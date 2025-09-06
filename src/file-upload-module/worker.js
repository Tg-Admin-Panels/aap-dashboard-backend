import { Worker } from 'bullmq';
import IORedis from 'ioredis';
import fs from 'fs/promises';
import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import { PassThrough } from 'stream';
import mongoose from 'mongoose';
import { cleanupFile } from './utils/tempFileStorage.js';
import { sendSseProgress } from './utils/sseProgress.js';

import {
    CSV_BATCH_SIZE,
    XLSX_BATCH_SIZE,
    normalizeHeader,
} from './utils/uploadHelpers.js';
import ApiError from '../utils/ApiError.js';

import { FormDefinition } from '../models/formDefinition.model.js';
import { FormSubmission } from '../models/formSubmission.model.js';
import { createMongooseDataHandler } from './utils/moduleDataHandlerFactory.js';

// Helper function to check if an object's values are all empty
function isRowDataEmpty(rowData) {
    return Object.values(rowData).every(value => {
        const stringValue = String(value);
        return stringValue === '' || stringValue.trim() === '' || value === null || value === undefined;
    });
}


const redisConnection = new IORedis({
    maxRetriesPerRequest: null,
});

await mongoose.connect("mongodb+srv://rohit:Rohit1234@cluster0.5a6t3ge.mongodb.net/aap-bihar", {
    serverSelectionTimeoutMS: 10000,
    maxPoolSize: 10,
});
if (mongoose.connection.readyState !== 1) {
    throw new Error('DB not connected in worker');
}

// worker.js (top)
let myDataHandler; // same name so the rest of your code keeps working

mongoose.set('bufferCommands', false); // fail-fast instead of 10s buffering

// After successful connect, create the handler using models
myDataHandler = createMongooseDataHandler(FormDefinition, FormSubmission);


// Function to process CSV files
async function processCsvFile(job) {
    const { jobId, filePath, originalname, definitionId } = job.data;
    console.log(`[WORKER] Starting CSV job ${jobId} for file ${originalname}, Definition ID: ${definitionId}`);

    let totalRowsProcessed = 0;
    let csvBatch = [];

    try {
        const fileContent = await fs.readFile(filePath, 'utf8');

        const definition = await myDataHandler.findDefinitionById(definitionId);
        if (!definition) {
            throw new ApiError(404, "Definition not found.");
        }
        const definedHeaders = definition.fields.map((f) => normalizeHeader(f.label));

        let headersValidated = false;
        let headers = [];

        Papa.parse(fileContent, {
            header: true,
            skipEmptyLines: true,
            transformHeader: normalizeHeader,
            dynamicTyping: false,
            step: async (row, parser) => {
                // Skip empty rows
                if (isRowDataEmpty(row.data)) {
                    return;
                }
                if (!headersValidated) {
                    headers = Object.keys(row.data).map(normalizeHeader);
                    const missing = definedHeaders.filter((h) => !headers.includes(h));
                    if (missing.length) {
                        parser.abort();
                        throw new ApiError(400, `Missing required headers: ${missing.join(", ")}`);
                    }
                    headersValidated = true;
                }

                const transformedRow = myDataHandler.transformRow(
                    row.data,
                    definitionId,
                    definedHeaders
                );
                csvBatch.push(transformedRow);

                if (csvBatch.length >= CSV_BATCH_SIZE) {
                    console.log(`[WORKER] Attempting to insert ${csvBatch.length} documents.`);
                    try {
                        const ins = await myDataHandler.insertSubmissions(csvBatch);
                        console.log(`[WORKER] Successfully inserted ${csvBatch.length} documents.`);
                        totalRowsProcessed += ins;
                        csvBatch = [];
                        console.log(`[WORKER] Calling sendSseProgress for processing status. JobId: ${jobId}, DefinitionId: ${definitionId}`);
                        sendSseProgress(definitionId, {
                            jobId,
                            status: "processing",
                            processedRows: totalRowsProcessed,
                            originalname,
                        });
                    } catch (insertErr) {
                        console.error(`[WORKER] Error during batch insertion:`, insertErr);
                    }
                }
            },
            complete: async () => {
                if (csvBatch.length > 0) {
                    console.log(`[WORKER] Attempting to insert final batch of ${csvBatch.length} documents.`);
                    try {
                        const ins = await myDataHandler.insertSubmissions(csvBatch);
                        console.log(`[WORKER] Successfully inserted final batch of ${csvBatch.length} documents.`);
                        totalRowsProcessed += ins;
                    } catch (insertErr) {
                        console.error(`[WORKER] Error during final batch insertion:`, insertErr);
                    }
                }
                console.log(`[WORKER] Calling sendSseProgress for completed status. JobId: ${jobId}, DefinitionId: ${definitionId}`);
                sendSseProgress(definitionId, {
                    jobId,
                    status: "completed",
                    processedRows: totalRowsProcessed,
                    originalname,
                });
                console.log(`CSV job ${jobId} completed. Total rows processed: ${totalRowsProcessed}`);
            },
            error: (err) => {
                throw new ApiError(500, `CSV parsing error: ${err.message}`);
            }
        });
    } catch (error) {
        console.error(`[WORKER] Error in job ${jobId}:`, error);
        sendSseProgress(definitionId, {
            jobId,
            status: "failed",
            error: error.message,
            originalname,
        });
        console.error(`Error processing CSV job ${jobId}:`, error);
        throw error; // Re-throw to mark job as failed in BullMQ
    } finally {
        await cleanupFile(jobId, originalname);
    }
}

// Function to process XLSX files
async function processXlsxFile(job) {
    const { jobId, filePath, originalname, definitionId } = job.data;
    console.log(`[WORKER] Starting XLSX job ${jobId} for file ${originalname}, Definition ID: ${definitionId}`);

    let totalRowsProcessed = 0;
    let xlsxBatch = [];

    try {
        console.log("definitionId: ", definitionId)
        const definition = await myDataHandler.findDefinitionById(definitionId);
        if (!definition) {
            throw new ApiError(404, "Definition not found.");
        }
        const definedHeaders = definition.fields.map((f) => normalizeHeader(f.label));

        const workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(filePath, {
            entries: "emit",
            sharedStrings: "cache",
            hyperlinks: "emit",
            styles: "skip",
            worksheets: "emit",
        });

        let processedFirstSheet = false;
        let headersValidated = false;
        let headers = [];

        workbookReader.on("worksheet", (worksheet) => {
            if (processedFirstSheet) {
                worksheet.on("row", () => { });
                worksheet.on("finished", () => { });
                return;
            }
            processedFirstSheet = true;

            worksheet.on("row", async (row) => {
                try {
                    const rowData = row.values
                        .slice(1)
                        .map((v) =>
                            v === undefined || v === null ? "" : String(v)
                        );

                    // Skip empty rows
                    if (rowData.every(value => {
                        const stringValue = String(value);
                        return stringValue === '' || stringValue.trim() === '' || value === null || value === undefined;
                    })) {
                        return;
                    }

                    if (!headersValidated) {
                        headers = rowData.map(normalizeHeader);
                        const missing = definedHeaders.filter((h) => !headers.includes(h));
                        if (missing.length) {
                            throw new ApiError(400, `Missing required headers: ${missing.join(", ")}`);
                        }
                        headersValidated = true;
                        return; // skip header row
                    }

                    const rowObject = {};
                    headers.forEach((h, i) => {
                        rowObject[h] = rowData[i];
                    });

                    const transformedRow = myDataHandler.transformRow(
                        rowObject,
                        definitionId,
                        definedHeaders
                    );
                    xlsxBatch.push(transformedRow);

                    if (xlsxBatch.length >= XLSX_BATCH_SIZE) {
                        console.log(`[WORKER] Attempting to insert ${xlsxBatch.length} documents.`);
                        try {
                            const ins = await myDataHandler.insertSubmissions(xlsxBatch);
                            console.log(`[WORKER] Successfully inserted ${xlsxBatch.length} documents.`);
                            totalRowsProcessed += ins;
                            xlsxBatch = [];
                            console.log(`[WORKER] Calling sendSseProgress for processing status. JobId: ${jobId}, DefinitionId: ${definitionId}`);
                            sendSseProgress(definitionId, {
                                jobId,
                                status: "processing",
                                processedRows: totalRowsProcessed,
                                originalname,
                            });
                        } catch (insertErr) {
                            console.error(`[WORKER] Error during batch insertion:`, insertErr);
                        }
                    }
                } catch (err) {
                    console.error(`Error processing XLSX row for job ${jobId}:`, err);
                    sendSseProgress(definitionId, {
                        jobId,
                        status: "failed",
                        error: err.message,
                        originalname,
                    });
                    // Depending on requirements, you might want to stop processing or log and continue
                }
            });

            worksheet.on("finished", async () => {
                if (xlsxBatch.length > 0) {
                    console.log(`[WORKER] Attempting to insert final batch of ${xlsxBatch.length} documents.`);
                    try {
                        const ins = await myDataHandler.insertSubmissions(xlsxBatch);
                        console.log(`[WORKER] Successfully inserted final batch of ${xlsxBatch.length} documents.`);
                        totalRowsProcessed += ins;
                    } catch (insertErr) {
                        console.error(`[WORKER] Error during final batch insertion:`, insertErr);
                    }
                }
                console.log(`[WORKER] Calling sendSseProgress for completed status. JobId: ${jobId}, DefinitionId: ${definitionId}`);
                sendSseProgress(definitionId, {
                    jobId,
                    status: "completed",
                    processedRows: totalRowsProcessed,
                    originalname,
                });
                console.log(`XLSX job ${jobId} completed. Total rows processed: ${totalRowsProcessed}`);
            });
        });

        workbookReader.on("error", (err) => {
            console.error(`Error reading XLSX workbook for job ${jobId}:`, err);
            sendSseProgress(definitionId, {
                jobId,
                status: "failed",
                error: err.message,
                originalname,
            });
        });

        await new Promise((resolve, reject) => {
            workbookReader.on("end", resolve);
            workbookReader.on("error", reject);
            workbookReader.read();
        });

    } catch (error) {
        console.error(`[WORKER] Error in job ${jobId}:`, error);
        sendSseProgress(definitionId, {
            jobId,
            status: "failed",
            error: error.message,
            originalname,
        });
        console.error(`Error processing XLSX job ${jobId}:`, error);
        throw error; // Re-throw to mark job as failed in BullMQ
    } finally {
        await cleanupFile(jobId, originalname);
    }
}


const fileUploadWorker = new Worker('file-upload', async (job) => {
    const { fileType } = job.data;

    if (fileType === 'csv') {
        await processCsvFile(job);
    } else if (fileType === 'xlsx') {
        await processXlsxFile(job);
    } else {
        console.error(`Unknown file type: ${fileType} for job ${job.id}`);
        throw new Error(`Unknown file type: ${fileType}`);
    }
}, {
    connection: redisConnection,
});

console.log('Worker started...');