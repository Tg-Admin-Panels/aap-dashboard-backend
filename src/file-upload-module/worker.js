import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import fs from 'fs/promises';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import mongoose from 'mongoose';
import { cleanupFile } from './utils/tempFileStorage.js';
import fileUploadQueue from './queue.js';

import {
    CSV_BATCH_SIZE,
    XLSX_BATCH_SIZE,
    normalizeHeader,
    toCamelCase
} from './utils/uploadHelpers.js';
import ApiError from '../utils/ApiError.js';

import { FormDefinition } from '../models/formDefinition.model.js';
import { FormSubmission } from '../models/formSubmission.model.js';

// ---------------- DB + Redis ----------------
const redisConnection = new IORedis({ maxRetriesPerRequest: null });

// Redis publisher for SSE progress
const pub = new IORedis();
async function publishProgress(jobId, payload) {
    const message = JSON.stringify({ jobId, data: payload });

    // ✅ 1. SSE pub/sub (realtime)
    const delivered = await pub.publish('sse-progress', message);

    // ✅ 2. Event history store (replay ke liye)
    await pub.rpush(`job:${jobId}:events`, message);

    // Optionally old events ko trim kar do (jaise sirf last 1000 rakhna ho)
    // await pub.ltrim(`job:${jobId}:events`, -1000, -1);

    console.log(`[SSE_PUB] Job ${jobId} -> Delivered to ${delivered} subs :: ${payload.status}`);
}



await mongoose.connect(
    "mongodb+srv://rohit:Rohit1234@cluster0.5a6t3ge.mongodb.net/aap-bihar",
    { serverSelectionTimeoutMS: 10000, maxPoolSize: 10 }
);
if (mongoose.connection.readyState !== 1) {
    throw new Error('DB not connected in worker');
}
mongoose.set('bufferCommands', false);

// ---------------- Helpers ----------------
function isRowDataEmpty(rowData) {
    return Object.values(rowData).every(value => {
        const stringValue = String(value);
        return (
            stringValue === '' ||
            stringValue.trim() === '' ||
            value === null ||
            value === undefined
        );
    });
}

const findDefinitionById = async (definitionId) => {
    return FormDefinition.findById(definitionId);
};

const insertSubmissions = async (submissions) => {
    if (submissions.length === 0) return 0;
    try {
        const result = await FormSubmission.insertMany(submissions, { ordered: false });
        return result.length;
    } catch (error) {
        console.error("[DATA_HANDLER] insertMany failed:", error);
        throw error;
    }
};

const transformRow = (row, definitionId, definedHeaders) => {
    const data = {};
    definedHeaders.forEach((h) => {
        data[toCamelCase(h)] = row[h] !== undefined ? row[h] : "N/A";
    });
    return { formId: definitionId, data };
};

// ---------------- CSV ----------------
async function processCsvFile(job) {
    const { jobId, filePath, originalname, definitionId } = job.data;

    let totalRowsProcessed = 0;
    let csvBatch = [];
    let totalRows = 0;

    try {
        console.log(`[WORKER] Job ${jobId}: Parsing CSV file ${originalname}`);
        await publishProgress(jobId, {
            jobId, status: "parsing", processedRows: 0, totalRows: null, percent: 0,
            message: "Parsing CSV file"
        });

        const fileContent = await fs.readFile(filePath, 'utf8');
        const definition = await findDefinitionById(definitionId);
        if (!definition) throw new ApiError(404, "Definition not found.");
        const definedHeaders = definition.fields.map((f) => normalizeHeader(f.label));

        let headersValidated = false;
        let headers = [];

        await new Promise((resolve, reject) => {
            Papa.parse(fileContent, {
                header: true,
                skipEmptyLines: true,
                transformHeader: normalizeHeader,
                step: async (row, parser) => {
                    try {
                        if (isRowDataEmpty(row.data)) return;

                        if (!headersValidated) {
                            headers = Object.keys(row.data).map(normalizeHeader);
                            const missing = definedHeaders.filter((h) => !headers.includes(h));
                            if (missing.length) {
                                parser.abort();
                                return reject(new ApiError(400, `Missing required headers: ${missing.join(", ")}`));
                            }
                            headersValidated = true;
                            console.log(`[WORKER] Job ${jobId}: Headers validated successfully.`);
                            await publishProgress(jobId, {
                                jobId, status: "validating", processedRows: 0, totalRows: null, percent: 0,
                                message: "Headers validated successfully"
                            });
                        }

                        const transformedRow = transformRow(row.data, definitionId, definedHeaders);
                        csvBatch.push(transformedRow);
                        totalRowsProcessed++;
                        totalRows++;

                        if (csvBatch.length >= CSV_BATCH_SIZE) {
                            await insertSubmissions(csvBatch);
                            console.log(`[WORKER] Job ${jobId}: Inserted batch of ${csvBatch.length}. Total: ${totalRowsProcessed}`);
                            csvBatch = [];
                            await publishProgress(jobId, {
                                jobId, status: "inserting", processedRows: totalRowsProcessed,
                                totalRows, percent: (totalRowsProcessed / totalRows) * 100,
                                message: `Inserted ${totalRowsProcessed} rows`
                            });
                        }
                    } catch (err) {
                        reject(err);
                    }
                },
                complete: async () => {
                    try {
                        if (csvBatch.length > 0) {
                            await insertSubmissions(csvBatch);
                        }
                        console.log(`[WORKER] Job ${jobId}: CSV processing completed. Total rows: ${totalRowsProcessed}`);
                        await publishProgress(jobId, {
                            jobId, status: "completed", processedRows: totalRowsProcessed,
                            totalRows, percent: 100,
                            message: "CSV processing completed successfully"
                        });
                        await cleanupFile(jobId, originalname);
                        resolve();
                    } catch (err) {
                        reject(err);
                    }
                },
                error: (err) => reject(new ApiError(500, `CSV parsing error: ${err.message}`))
            });
        });

    } catch (error) {
        console.error(`[WORKER] Job ${jobId}: Error processing CSV file: ${error.message}`);
        await publishProgress(jobId, {
            jobId, status: "failed", processedRows: totalRowsProcessed,
            totalRows, percent: 0,
            message: error.message, errorReportUrl: null
        });
        throw error;
    }
}

// ---------------- XLSX ----------------
async function processXlsxFile(job) {
    const { jobId, filePath, originalname, definitionId } = job.data;

    return new Promise(async (resolve, reject) => {
        let totalRowsProcessed = 0;
        let totalRows = 0;
        let xlsxBatch = [];
        const pendingPromises = [];

        async function flushBatch() {
            if (xlsxBatch.length === 0) return;
            const batch = xlsxBatch;
            xlsxBatch = [];
            const p = insertSubmissions(batch)
                .then(async () => {
                    console.log(`[WORKER] Job ${jobId}: Inserted batch of ${batch.length}. Total: ${totalRowsProcessed}`);
                    const payload = {
                        jobId,
                        status: "inserting",
                        processedRows: totalRowsProcessed,
                        totalRows,
                        percent: (totalRowsProcessed / totalRows) * 100,
                        message: `Please wait,Inserting.. ${totalRowsProcessed} rows`
                    };
                    console.log('[WORKER] Publishing progress:', payload);
                    await publishProgress(jobId, payload);
                })
                .catch(err => {
                    console.error(`[WORKER] Job ${jobId}: Batch insert failed`, err);
                });
            pendingPromises.push(p);
            await p;
        }

        try {
            console.log(`[WORKER] Job ${jobId}: Parsing XLSX file ${originalname}`);

            const definition = await findDefinitionById(definitionId);
            if (!definition) throw new ApiError(404, "Definition not found.");
            const definedHeaders = definition.fields.map(f => normalizeHeader(f.label));

            const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
                entries: "emit", sharedStrings: "cache", hyperlinks: "emit",
                styles: "skip", worksheets: "emit"
            });

            let headers = [];
            let headersValidated = false;

            workbookReader.on("worksheet", worksheet => {
                worksheet.on("row", async row => {
                    const rowData = row.values.slice(1).map(v => v ?? "");
                    if (isRowDataEmpty(rowData)) return;

                    if (!headersValidated) {
                        headers = rowData.map(normalizeHeader);
                        headersValidated = true;
                        return;
                    }

                    const rowObject = {};
                    headers.forEach((h, i) => rowObject[h] = rowData[i]);

                    const transformedRow = transformRow(rowObject, definitionId, definedHeaders);
                    xlsxBatch.push(transformedRow);
                    totalRowsProcessed++;
                    totalRows++;

                    if (xlsxBatch.length >= XLSX_BATCH_SIZE) {
                        await flushBatch();
                    }
                });

                worksheet.on("finished", async () => {
                    if (xlsxBatch.length > 0) {
                        await flushBatch();
                    }
                });
            });

            workbookReader.on("end", async () => {
                try {
                    await Promise.all(pendingPromises);

                    console.log(`[WORKER] Job ${jobId}: XLSX processing completed. Total rows: ${totalRowsProcessed}`);

                    await publishProgress(jobId, {
                        jobId,
                        status: "completed",
                        processedRows: totalRowsProcessed,
                        totalRows,
                        percent: 100,
                        message: "XLSX processing completed successfully"
                    });

                    await cleanupFile(jobId, originalname);

                    // 👇 छोटा delay do before resolve
                    setTimeout(() => resolve(), 50);

                } catch (err) {
                    reject(err);
                }
            });


            workbookReader.on("error", err => {
                reject(err);
            });

            await workbookReader.read();
        } catch (err) {
            reject(err);
        }
    });
}



// ---------------- Worker ----------------
const fileUploadWorker = new Worker(
    'file-upload',
    async (job) => {
        const { fileType } = job.data;
        if (fileType === 'csv') return processCsvFile(job);
        if (fileType === 'xlsx') return processXlsxFile(job);
        throw new Error(`Unknown file type: ${fileType}`);
    },
    {
        connection: redisConnection,
        removeOnComplete: { count: 1000, age: 3600 },
        removeOnFail: { count: 5000 },
    }
);

console.log('Worker started and listening...');

fileUploadWorker.on('active', job => {
    console.log(`[WORKER_EVENT] Job ${job.id} started.`);
});

fileUploadWorker.on('completed', async job => {
    console.log(`[WORKER_EVENT] Job ${job.id} completed.`);
    await logQueueCounts(fileUploadQueue);
});

fileUploadWorker.on('failed', async (job, err) => {
    console.error(`[WORKER_EVENT] Job ${job.id} failed: ${err.message}`);
    await logQueueCounts(fileUploadQueue);
});

// Queue stats
async function logQueueCounts(queue) {
    try {
        const counts = await queue.getJobCounts();
        console.log(`[QUEUE_STATS] Waiting: ${counts.waiting}, Active: ${counts.active}, Completed: ${counts.completed}, Failed: ${counts.failed}`);
    } catch (error) {
        console.error(`[QUEUE_STATS] Error: ${error.message}`);
    }
}
setTimeout(() => { logQueueCounts(fileUploadQueue); }, 1000);
