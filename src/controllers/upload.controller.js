// controllers/upload.controller.js
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { PassThrough } from "stream";

import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { FormSubmission } from "../models/formSubmission.model.js";
import { FormDefinition } from "../models/formDefinition.model.js";

// ======= Tuning =======
const CSV_BATCH_SIZE = 1000;   // rows per batch for CSV
const XLSX_BATCH_SIZE = 500;   // rows per batch for XLSX

// ======= Per-process upload session store =======
/**
 * Map key: `${formId}-${originalname}`
 */
const uploadSessions = new Map();

// ======= Helpers =======



const toCamelCase = (str) => {
    return String(str || "")
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)?/g, (m, chr) => (chr ? chr.toUpperCase() : ""))
        .replace(/^./, (s) => s.toLowerCase());
};


const normalizeHeader = (h) => String(h || "").trim();
const toBool = (v) => v === true || v === "true" || v === "1";

async function flushBatch(batch, session, kind) {
    if (!batch.length) return;
    console.log(`[${kind}] flushBatch(): inserting ${batch.length} docs...`);
    await FormSubmission.insertMany(batch, { ordered: false });
    session.totalRowsProcessed += batch.length;
    console.log(`[${kind}] flushBatch(): totalRowsProcessed=${session.totalRowsProcessed}`);
    batch.length = 0;
}

// ======= Main handler =======
export const uploadChunk = asyncHandler(async (req, res) => {
    const { formId } = req.params;
    const { chunk, isLastChunk, originalname } = req.body;

    if (!originalname || !chunk) {
        console.error(`[UPLOAD] Missing originalname/chunk`);
        throw new ApiError(400, "Missing required fields: originalname or chunk.");
    }

    const last = toBool(isLastChunk);
    const sessionId = `${formId}-${originalname}`;
    let session = uploadSessions.get(sessionId);

    console.log(`[UPLOAD] ---------------------------`);
    console.log(`[UPLOAD] sessionId=${sessionId}, last=${last}`);
    console.log(`[UPLOAD] chunk bytes=${Buffer.byteLength(chunk, "base64")} (base64)`);

    // ---------- INIT SESSION ----------
    if (!session) {
        let fileType = "";
        if (originalname.toLowerCase().endsWith(".csv")) fileType = "csv";
        else if (originalname.toLowerCase().endsWith(".xlsx")) fileType = "xlsx";
        else {
            console.error(`[UPLOAD] Unsupported file type: ${originalname}`);
            throw new ApiError(400, "Unsupported file type. Only CSV and XLSX are supported.");
        }

        console.log(`[INIT] New session. fileType=${fileType}`);

        // Load FormDefinition once
        const formDef = await FormDefinition.findById(formId);
        if (!formDef) {
            console.error(`[INIT] Form definition not found: formId=${formId}`);
            throw new ApiError(404, "Form definition not found.");
        }

        session = {
            fileType,
            headers: [],
            headersValidated: false,
            definedHeaders: formDef.fields.map((f) => normalizeHeader(f.label)),
            totalRowsProcessed: 0,

            // CSV
            csvBuffer: "",
            csvBatch: [],
            csvChunkCount: 0,

            // XLSX
            excelStream: null,
            workbookReader: null,
            xlsxBatch: [],
            inserting: false,
            endPromise: null,
            resolveEnd: null,
            rejectEnd: null,
            xlsxChunkCount: 0,
            worksheetsSeen: 0,
            rowsSeen: 0,
            batchesFlushed: 0,
        };
        uploadSessions.set(sessionId, session);

        console.log(`[INIT] definedHeaders=`, session.definedHeaders);

        // Prepare XLSX streaming machinery
        if (fileType === "xlsx") {
            console.log(`[XLSX] Creating PassThrough and WorkbookReader...`);
            session.excelStream = new PassThrough();
            session.endPromise = new Promise((resolve, reject) => {
                session.resolveEnd = resolve;
                session.rejectEnd = reject;
            });

            session.workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(session.excelStream, {
                entries: "emit",
                sharedStrings: "cache",
                hyperlinks: "emit",
                styles: "skip",
                worksheets: "emit",
            });

            let processedFirstSheet = false;

            session.workbookReader.on("worksheet", (worksheet) => {
                session.worksheetsSeen += 1;
                console.log(`[XLSX] 'worksheet' event (#${session.worksheetsSeen}). processedFirstSheet=${processedFirstSheet}`);

                if (processedFirstSheet) {
                    // Drain others silently (we only process the first sheet)
                    worksheet.on("row", () => { });
                    worksheet.on("finished", () => { });
                    return;
                }
                processedFirstSheet = true;
                console.log(`[XLSX] Processing FIRST worksheet...`);

                worksheet.on("row", async (row) => {
                    try {
                        session.rowsSeen += 1;
                        if (session.rowsSeen % 1000 === 0) {
                            console.log(`[XLSX] row #${session.rowsSeen}`);
                        }

                        const rowData = row.values.slice(1).map((v) =>
                            v === undefined || v === null ? "" : String(v)
                        );

                        if (!session.headersValidated) {
                            session.headers = rowData.map(normalizeHeader);
                            console.log(`[XLSX] Header row detected:`, session.headers);

                            const missing = session.definedHeaders.filter(
                                (h) => !session.headers.includes(h)
                            );
                            if (missing.length) {
                                console.error(`[XLSX] Missing required headers: ${missing.join(", ")}`);
                                throw new ApiError(400, `Missing required headers: ${missing.join(", ")}`);
                            }
                            session.headersValidated = true;
                            console.log(`[XLSX] Header validation PASSED`);
                            return; // skip header row from insertion
                        }

                        // Data row
                        const data = {};
                        session.definedHeaders.forEach((h) => {
                            const idx = session.headers.indexOf(h);
                            data[toCamelCase(h)] = idx >= 0 && rowData[idx] !== undefined ? rowData[idx] : "N/A";
                        });

                        session.xlsxBatch.push({ formId, data });

                        if (session.xlsxBatch.length >= XLSX_BATCH_SIZE && !session.inserting) {
                            const toInsert = [...session.xlsxBatch];
                            session.xlsxBatch.length = 0;
                            session.inserting = true;
                            console.log(`[XLSX] Batch threshold reached: inserting ${toInsert.length} docs...`);
                            try {
                                await FormSubmission.insertMany(toInsert, { ordered: false });
                                session.totalRowsProcessed += toInsert.length;
                                session.batchesFlushed += 1;
                                console.log(`[XLSX] Batch inserted. totalRowsProcessed=${session.totalRowsProcessed}, batchesFlushed=${session.batchesFlushed}`);
                            } finally {
                                session.inserting = false;
                            }
                        }
                    } catch (err) {
                        console.error(`[XLSX] Error inside 'row' handler:`, err);
                        session.rejectEnd?.(err);
                    }
                });

                worksheet.on("finished", async () => {
                    try {
                        console.log(`[XLSX] Worksheet 'finished' event. Flushing remaining: ${session.xlsxBatch.length}`);
                        if (session.xlsxBatch.length) {
                            const toInsert = [...session.xlsxBatch];
                            session.xlsxBatch.length = 0;
                            session.inserting = true;
                            try {
                                await FormSubmission.insertMany(toInsert, { ordered: false });
                                session.totalRowsProcessed += toInsert.length;
                                session.batchesFlushed += 1;
                                console.log(`[XLSX] Final worksheet flush done. totalRowsProcessed=${session.totalRowsProcessed}, batchesFlushed=${session.batchesFlushed}`);
                            } finally {
                                session.inserting = false;
                            }
                        }
                        console.log(`[XLSX] Resolving endPromise...`);
                        session.resolveEnd?.();
                    } catch (err) {
                        console.error(`[XLSX] Error flushing on 'finished':`, err);
                        session.rejectEnd?.(err);
                    }
                });
            });

            session.workbookReader.on("error", (err) => {
                console.error(`[XLSX] workbookReader 'error':`, err);
                session.rejectEnd?.(err);
            });

            session.workbookReader.on("end", () => {
                console.log(`[XLSX] workbookReader 'end' (all worksheets consumed).`);
            });

            // IMPORTANT: start the reader! (this was missing)
            // Use setImmediate to ensure listeners are fully attached first.
            setImmediate(() => {
                console.log(`[XLSX] Calling workbookReader.read() to start streaming...`);
                session.workbookReader.read();
            });
        }
    }

    // ---------- XLSX STREAMING ----------
    if (session.fileType === "xlsx") {
        session.xlsxChunkCount += 1;
        console.log(`[XLSX] chunk #${session.xlsxChunkCount} received. last=${last}`);

        // Push bytes into the PassThrough feeding WorkbookReader
        const buf = Buffer.from(chunk, "base64");
        console.log(`[XLSX] writing ${buf.length} bytes into excelStream`);
        session.excelStream.write(buf);

        if (!last) {
            console.log(`[XLSX] Not last chunk. Returning 200 early.`);
            return res.status(200).json(new ApiResponse(200, {}, "XLSX chunk received."));
        }

        // Last chunk: end stream and wait for all inserts to flush
        try {
            console.log(`[XLSX] Last chunk received. Ending excelStream...`);
            session.excelStream.end();
            console.log(`[XLSX] Awaiting endPromise (worksheet 'finished')...`);
            await session.endPromise;
            const count = session.totalRowsProcessed;
            console.log(`[XLSX] endPromise resolved. totalRowsProcessed=${count}. Cleaning session.`);
            uploadSessions.delete(sessionId);
            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        { count },
                        "XLSX processed chunk-by-chunk and data inserted successfully."
                    )
                );
        } catch (err) {
            console.error(`[XLSX] Error while finalizing:`, err);
            uploadSessions.delete(sessionId);
            if (err instanceof ApiError) throw err;
            throw new ApiError(500, `Error processing XLSX stream: ${err.message}`);
        }
    }

    // ---------- CSV STREAMING ----------
    if (session.fileType === "csv") {
        session.csvChunkCount += 1;
        console.log(`[CSV] chunk #${session.csvChunkCount} received. last=${last}`);

        const decoded = Buffer.from(chunk, "base64").toString("utf8");
        session.csvBuffer += decoded;

        const lastNewlineIdx = session.csvBuffer.lastIndexOf("\n");
        console.log(`[CSV] current buffer length=${session.csvBuffer.length}, lastNewlineIdx=${lastNewlineIdx}`);

        if (lastNewlineIdx < 0 && !last) {
            console.log(`[CSV] No newline yet and not last chunk — waiting for more data.`);
            return res.status(200).json(new ApiResponse(200, {}, "CSV chunk received."));
        }

        const processPart = last
            ? session.csvBuffer
            : session.csvBuffer.slice(0, lastNewlineIdx + 1);
        const tail = last ? "" : session.csvBuffer.slice(lastNewlineIdx + 1);
        session.csvBuffer = tail;

        const haveHeaders = session.headers && session.headers.length > 0;

        let rows = [];
        if (!haveHeaders) {
            console.log(`[CSV] Detecting headers from this processPart...`);
            const res1 = Papa.parse(processPart, {
                header: true,
                skipEmptyLines: true,
                transformHeader: normalizeHeader,
                dynamicTyping: false,
            });

            if (res1.meta?.fields) {
                session.headers = res1.meta.fields.map(normalizeHeader);
            } else if (res1.data?.length) {
                session.headers = Object.keys(res1.data[0]).map(normalizeHeader);
            }
            console.log(`[CSV] Detected headers:`, session.headers);

            if (!session.headersValidated && session.headers.length > 0) {
                const missing = session.definedHeaders.filter(
                    (h) => !session.headers.includes(h)
                );
                if (missing.length) {
                    console.error(`[CSV] Missing required headers: ${missing.join(", ")}`);
                    uploadSessions.delete(sessionId);
                    throw new ApiError(400, `Missing required headers: ${missing.join(", ")}`);
                }
                session.headersValidated = true;
                console.log(`[CSV] Header validation PASSED`);
            }

            rows = res1.data || [];
            console.log(`[CSV] Parsed rows count=${rows.length}`);
        } else {
            console.log(`[CSV] Headers already known, parsing as data...`);
            const res2 = Papa.parse(processPart, {
                header: true,
                skipEmptyLines: true,
                transformHeader: normalizeHeader,
                dynamicTyping: false,
            });
            rows = res2.data || [];
            console.log(`[CSV] Parsed rows count=${rows.length}`);
        }

        for (const row of rows) {
            const data = {};
            session.definedHeaders.forEach((h) => {
                data[toCamelCase(h)] = row[h] !== undefined ? row[h] : "N/A";
            });
            session.csvBatch.push({ formId, data });

            if (session.csvBatch.length >= CSV_BATCH_SIZE) {
                await flushBatch(session.csvBatch, session, "CSV");
            }
        }

        if (last) {
            if (session.csvBuffer && session.csvBuffer.trim().length) {
                console.log(`[CSV] Final tail parsing...`);
                const res3 = Papa.parse(session.csvBuffer, {
                    header: true,
                    skipEmptyLines: true,
                    transformHeader: normalizeHeader,
                    dynamicTyping: false,
                });
                for (const row of res3.data || []) {
                    const data = {};
                    session.definedHeaders.forEach((h) => {
                        data[h] = row[h] !== undefined ? row[h] : "N/A";
                    });
                    session.csvBatch.push({ formId, data });
                    if (session.csvBatch.length >= CSV_BATCH_SIZE) {
                        await flushBatch(session.csvBatch, session, "CSV");
                    }
                }
                session.csvBuffer = "";
            }

            await flushBatch(session.csvBatch, session, "CSV");

            const count = session.totalRowsProcessed;
            console.log(`[CSV] Finalized. totalRowsProcessed=${count}`);
            uploadSessions.delete(sessionId);

            return res
                .status(200)
                .json(
                    new ApiResponse(
                        200,
                        { count },
                        "CSV processed chunk-by-chunk and data inserted successfully."
                    )
                );
        }

        console.log(`[CSV] Not last chunk. Returning 200 early.`);
        return res.status(200).json(new ApiResponse(200, {}, "CSV chunk received."));
    }

    console.error(`[UPLOAD] Unknown processing state. Cleaning session.`);
    uploadSessions.delete(sessionId);
    throw new ApiError(500, "Unknown processing state.");
});
