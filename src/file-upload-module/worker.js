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
    await pub.publish('sse-progress', JSON.stringify({ jobId, data: payload }));
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

        Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
            transformHeader: normalizeHeader,
            step: async (row, parser) => {
                if (isRowDataEmpty(row.data)) return;

                if (!headersValidated) {
                    headers = Object.keys(row.data).map(normalizeHeader);
                    const missing = definedHeaders.filter((h) => !headers.includes(h));
                    if (missing.length) {
                        parser.abort();
                        throw new ApiError(400, `Missing required headers: ${missing.join(", ")}`);
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
                    console.log(`[WORKER] Job ${jobId}: Inserted a batch of ${csvBatch.length} rows. Total processed: ${totalRowsProcessed}`);
                    csvBatch = [];
                    await publishProgress(jobId, {
                        jobId, status: "inserting", processedRows: totalRowsProcessed,
                        totalRows, percent: (totalRowsProcessed / totalRows) * 100,
                        message: `Inserted ${totalRowsProcessed} rows`
                    });
                }
            },
            complete: async () => {
                if (csvBatch.length > 0) await insertSubmissions(csvBatch);
                console.log(`[WORKER] Job ${jobId}: CSV processing completed successfully. Total rows: ${totalRowsProcessed}`);
                await publishProgress(jobId, {
                    jobId, status: "completed", processedRows: totalRowsProcessed,
                    totalRows, percent: 100,
                    message: "CSV processing completed successfully"
                });
            },
            error: (err) => {
                throw new ApiError(500, `CSV parsing error: ${err.message}`);
            }
        });
    } catch (error) {
        console.error(`[WORKER] Job ${jobId}: Error processing CSV file: ${error.message}`);
        await publishProgress(jobId, {
            jobId, status: "failed", processedRows: totalRowsProcessed,
            totalRows, percent: 0,
            message: error.message, errorReportUrl: null
        });
        throw error;
    } finally {
        await cleanupFile(jobId, originalname);
    }
}

// ---------------- XLSX ----------------
async function processXlsxFile(job) {
    const { jobId, filePath, originalname, definitionId } = job.data;

    let totalRowsProcessed = 0;
    let totalRows = 0;
    let xlsxBatch = [];
    let flushing = false;

    async function flushBatch() {
        if (flushing || xlsxBatch.length === 0) return;
        flushing = true;
        const batch = xlsxBatch;
        xlsxBatch = [];
        try {
            await insertSubmissions(batch);
            console.log(`[WORKER] Job ${jobId}: Inserted a batch of ${batch.length} rows. Total processed: ${totalRowsProcessed}`);
            await publishProgress(jobId, {
                jobId, status: "inserting", processedRows: totalRowsProcessed,
                totalRows, percent: totalRows > 0 ? (totalRowsProcessed / totalRows) * 100 : 0,
                message: `Inserted ${totalRowsProcessed} rows`
            });
        } finally {
            flushing = false;
        }
    }

    try {
        console.log(`[WORKER] Job ${jobId}: Parsing XLSX file ${originalname}`);
        await publishProgress(jobId, {
            jobId, status: "parsing", processedRows: 0, totalRows: null, percent: 0,
            message: "Parsing XLSX file"
        });

        const definition = await findDefinitionById(definitionId);
        if (!definition) throw new ApiError(404, "Definition not found.");
        const definedHeaders = definition.fields.map((f) => normalizeHeader(f.label));

        const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
            entries: "emit", sharedStrings: "cache", hyperlinks: "emit",
            styles: "skip", worksheets: "emit",
        });

        let processedFirstSheet = false;
        let headers = [];
        let headersValidated = false;

        workbookReader.on("worksheet", (worksheet) => {
            if (processedFirstSheet) return;
            processedFirstSheet = true;

            worksheet.on("row", async (row) => {
                try {
                    const rowData = row.values.slice(1).map(v =>
                        v === undefined || v === null ? "" : String(v)
                    );
                    if (isRowDataEmpty(rowData)) return;

                    if (!headersValidated) {
                        headers = rowData.map(normalizeHeader);
                        const missing = definedHeaders.filter((h) => !headers.includes(h));
                        if (missing.length) {
                            throw new ApiError(400, `Missing required headers: ${missing.join(", ")}`);
                        }
                        headersValidated = true;
                        console.log(`[WORKER] Job ${jobId}: Headers validated successfully.`);
                        await publishProgress(jobId, {
                            jobId, status: "validating", processedRows: 0, totalRows: null, percent: 0,
                            message: "Headers validated successfully"
                        });
                        return;
                    }

                    const rowObject = {};
                    headers.forEach((h, i) => { rowObject[h] = rowData[i]; });

                    const transformedRow = transformRow(rowObject, definitionId, definedHeaders);
                    xlsxBatch.push(transformedRow);
                    totalRowsProcessed++;
                    totalRows++;

                    if (xlsxBatch.length >= XLSX_BATCH_SIZE) {
                        await flushBatch();
                    }
                } catch (err) {
                    console.error(`Error processing XLSX row:`, err);
                }
            });

            worksheet.on("finished", async () => {
                await flushBatch();
                console.log(`[WORKER] Job ${jobId}: XLSX processing completed successfully. Total rows: ${totalRowsProcessed}`);
                await publishProgress(jobId, {
                    jobId, status: "completed", processedRows: totalRowsProcessed,
                    totalRows, percent: 100,
                    message: "XLSX processing completed successfully"
                });
            });
        });

        workbookReader.on("error", async (err) => {
            await publishProgress(jobId, {
                jobId, status: "failed", processedRows: totalRowsProcessed,
                totalRows, percent: 0,
                message: err.message, errorReportUrl: null
            });
        });

        await new Promise((resolve, reject) => {
            workbookReader.on("end", resolve);
            workbookReader.on("error", reject);
            workbookReader.read();
        });

    } catch (error) {
        console.error(`[WORKER] Job ${jobId}: Error processing XLSX file: ${error.message}`);
        await publishProgress(jobId, {
            jobId, status: "failed", processedRows: totalRowsProcessed,
            totalRows, percent: 0,
            message: error.message, errorReportUrl: null
        });
        throw error;
    } finally {
        await cleanupFile(jobId, originalname);
    }
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
