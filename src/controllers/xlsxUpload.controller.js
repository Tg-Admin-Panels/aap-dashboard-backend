// controllers/realXlsxUpload.controller.js

import ExcelJS from "exceljs";
import { PassThrough } from "stream";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { FormSubmission } from "../models/formSubmission.model.js";
import { FormDefinition } from "../models/formDefinition.model.js";
import { uploadSessions } from "../utils/uploadSessions.js";
import { sendSseProgress } from "../utils/sseProgress.js";
import {
    XLSX_BATCH_SIZE,
    toBool,
    toCamelCase,
    normalizeHeader,
} from "../utils/uploadHelpers.js";

/**
 * POST /api/v1/forms/:formId/submissions/upload-chunk
 * Body: { originalname, chunk (base64), isLastChunk }
 */
export const xlsxFileUpload = asyncHandler(async (req, res) => {
    const { formId } = req.params;
    const { chunk, isLastChunk, originalname } = req.body;

    if (!originalname || !chunk) {
        throw new ApiError(
            400,
            "Missing required fields: originalname or chunk."
        );
    }
    if (!originalname.toLowerCase().endsWith(".xlsx")) {
        throw new ApiError(400, "Unsupported file type for this endpoint.");
    }

    const last = toBool(isLastChunk);
    const sessionId = `${formId}-${originalname}`;
    let session = uploadSessions.get(sessionId);

    // INIT session
    if (!session) {
        const formDef = await FormDefinition.findById(formId);
        if (!formDef) throw new ApiError(404, "Form definition not found.");

        session = {
            formId,
            fileType: "xlsx",
            headers: [],
            headersValidated: false,
            definedHeaders: formDef.fields.map((f) => normalizeHeader(f.label)),
            totalRowsProcessed: 0,

            // streaming/bookkeeping
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
            totalRow: 0,
            batchesFlushed: 0,
            processedBytes: 0, // <= increment as we feed binary bytes to the reader
        };
        uploadSessions.set(sessionId, session);

        // Setup streaming reader
        session.excelStream = new PassThrough();
        session.endPromise = new Promise((resolve, reject) => {
            session.resolveEnd = resolve;
            session.rejectEnd = reject;
        });

        session.workbookReader = new ExcelJS.stream.xlsx.WorkbookReader(
            session.excelStream,
            {
                entries: "emit",
                sharedStrings: "cache",
                hyperlinks: "emit",
                styles: "skip",
                worksheets: "emit",
            }
        );

        let processedFirstSheet = false;

        session.workbookReader.on("worksheet", (worksheet) => {
            session.worksheetsSeen += 1;
            if (processedFirstSheet) {
                worksheet.on("row", () => { });
                worksheet.on("finished", () => { });
                return;
            }
            processedFirstSheet = true;

            worksheet.on("row", async (row) => {
                try {
                    session.rowsSeen += 1;

                    const rowData = row.values
                        .slice(1)
                        .map((v) =>
                            v === undefined || v === null ? "" : String(v)
                        );

                    if (!session.headersValidated) {
                        session.headers = rowData.map(normalizeHeader);
                        const missing = session.definedHeaders.filter(
                            (h) => !session.headers.includes(h)
                        );
                        if (missing.length) {
                            session.rejectEnd?.(
                                new ApiError(
                                    400,
                                    `Missing required headers: ${missing.join(", ")}`
                                )
                            );
                            return;
                        }
                        session.headersValidated = true;
                        return; // skip header row
                    }

                    // Data row
                    const data = {};
                    session.definedHeaders.forEach((h) => {
                        const idx = session.headers.indexOf(h);
                        data[toCamelCase(h)] =
                            idx >= 0 && rowData[idx] !== undefined
                                ? rowData[idx]
                                : "N/A";
                    });

                    session.xlsxBatch.push({ formId, data });

                    if (
                        session.xlsxBatch.length >= XLSX_BATCH_SIZE &&
                        !session.inserting
                    ) {
                        const toInsert = [...session.xlsxBatch];
                        session.xlsxBatch.length = 0;
                        session.inserting = true;
                        try {
                            await FormSubmission.insertMany(toInsert, {
                                ordered: false,
                            });
                            session.totalRowsProcessed += toInsert.length;
                            session.batchesFlushed += 1;
                            sendSseProgress(formId, {
                                status: "processing",
                                processedRows: session.totalRowsProcessed,
                                processedBytes: session.processedBytes,
                            });
                        } finally {
                            session.inserting = false;
                        }
                    }
                } catch (err) {
                    session.rejectEnd?.(err);
                }
            });

            worksheet.on("finished", async () => {
                try {
                    if (session.xlsxBatch.length) {
                        const toInsert = [...session.xlsxBatch];
                        session.xlsxBatch.length = 0;
                        session.inserting = true;
                        try {
                            await FormSubmission.insertMany(toInsert, {
                                ordered: false,
                            });
                            session.totalRowsProcessed += toInsert.length;
                            session.batchesFlushed += 1;
                            sendSseProgress(formId, {
                                status: "processing",
                                processedRows: session.totalRowsProcessed,
                                processedBytes: session.processedBytes,
                            });
                        } finally {
                            session.inserting = false;
                        }
                    }
                    session.resolveEnd?.();
                } catch (err) {
                    session.rejectEnd?.(err);
                }
            });
        });

        session.workbookReader.on("error", (err) => {
            session.rejectEnd?.(err);
        });

        session.workbookReader.on("end", () => {
            // all worksheets consumed
        });

        // start reader after listeners attached
        setImmediate(() => {
            try {
                session.workbookReader.read();
            } catch (err) {
                session.rejectEnd?.(err);
            }
        });
    }

    // Receive binary chunk, feed to reader, and count bytes
    session.xlsxChunkCount += 1;
    const buf = Buffer.from(chunk, "base64");
    session.excelStream.write(buf);
    session.processedBytes += buf.length;

    console.log(`sendSSe: ${JSON.stringify({
        status: "processing",
        processedRows: session.totalRowsProcessed,
        processedBytes: session.processedBytes,
    })}`)
    // Intermediate SSE ping for smoother UI
    sendSseProgress(formId, {
        status: "processing",
        processedRows: session.totalRowsProcessed, // may trail inserts
        processedBytes: session.processedBytes, // exact bytes fed to parser
    });

    if (!last) {
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "XLSX chunk received."));
    }

    // Last chunk: close and await all flushes
    try {
        session.excelStream.end();
        await session.endPromise;

        const count = session.totalRowsProcessed;

        sendSseProgress(formId, {
            status: "completed",
            processedRows: count,
            processedBytes: session.processedBytes,
        });

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
        uploadSessions.delete(sessionId);
        if (err instanceof ApiError) throw err;
        throw new ApiError(500, `Error processing XLSX stream: ${err.message}`);
    }
});
