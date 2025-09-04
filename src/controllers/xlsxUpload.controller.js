// controllers/xlsxUpload.controller.js

import ExcelJS from "exceljs";
import { PassThrough } from "stream";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { FormSubmission } from "../models/formSubmission.model.js";
import { FormDefinition } from "../models/formDefinition.model.js";
import { uploadSessions } from "../utils/uploadSessions.js";
import { sendSseProgress } from "../utils/sseProgress.js";

// ======= Tuning =======
const XLSX_BATCH_SIZE = 500; // rows per batch

// ======= Helpers =======
const toCamelCase = (str) =>
    String(str || "")
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)?/g, (m, chr) =>
            chr ? chr.toUpperCase() : ""
        )
        .replace(/^./, (s) => s.toLowerCase());
const normalizeHeader = (h) => String(h || "").trim();
const toBool = (v) => v === true || v === "true" || v === "1";

/**
 * POST /api/upload/xlsx/:formId
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

    const last = toBool(isLastChunk);
    const sessionId = `${formId}-${originalname}`;
    let session = uploadSessions.get(sessionId);

    // INIT
    if (!session) {
        if (!originalname.toLowerCase().endsWith(".xlsx")) {
            throw new ApiError(400, "Unsupported file type for this endpoint.");
        }

        const formDef = await FormDefinition.findById(formId);
        if (!formDef) throw new ApiError(404, "Form definition not found.");

        session = {
            formId,
            fileType: "xlsx",
            headers: [],
            headersValidated: false,
            definedHeaders: formDef.fields.map((f) => normalizeHeader(f.label)),
            totalRowsProcessed: 0,

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

        // streaming setup
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
                // Drain others silently (only first sheet is processed)
                worksheet.on("row", () => {});
                worksheet.on("finished", () => {});
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
                        return; // skip header row from insertion
                    }

                    // data row
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
                                processedRows: session.totalRowsProcessed,
                                status: "processing",
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
                                processedRows: session.totalRowsProcessed,
                                status: "processing",
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
            session.workbookReader.read();
        });
    }

    // STREAMING XLSX
    session.xlsxChunkCount += 1;

    const buf = Buffer.from(chunk, "base64");
    session.excelStream.write(buf);

    if (!last) {
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "XLSX chunk received."));
    }

    // last chunk
    try {
        session.excelStream.end();
        await session.endPromise;
        const count = session.totalRowsProcessed;

        sendSseProgress(formId, { processedRows: count, status: "completed" });
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
