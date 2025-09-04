// controllers/csvUpload.controller.js

import Papa from "papaparse";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { FormSubmission } from "../models/formSubmission.model.js";
import { FormDefinition } from "../models/formDefinition.model.js";
import { uploadSessions } from "../utils/uploadSessions.js";
import { sendSseProgress } from "../utils/sseProgress.js";
import {
    CSV_BATCH_SIZE,
    toBool,
    toCamelCase,
    normalizeHeader,
} from "../utils/uploadHelpers.js";

/**
 * Flush a batch and emit SSE progress.
 */
async function flushCsvBatch(batch, session) {
    if (!batch.length) return;
    await FormSubmission.insertMany(batch, { ordered: false });
    session.totalRowsProcessed += batch.length;
    batch.length = 0;

    sendSseProgress(session.formId, {
        status: "processing",
        processedRows: session.totalRowsProcessed,
        processedBytes: session.processedBytes,
    });
}

/**
 * POST /api/v1/forms/:formId/submissions/upload-chunk
 * Body: { originalname, chunk (base64), isLastChunk }
 */
export const csvFileUpload = asyncHandler(async (req, res) => {
    const { formId } = req.params;
    const { chunk, isLastChunk, originalname } = req.body;

    if (!originalname || !chunk) {
        throw new ApiError(
            400,
            "Missing required fields: originalname or chunk."
        );
    }
    if (!originalname.toLowerCase().endsWith(".csv")) {
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
            fileType: "csv",
            headers: [],
            headersValidated: false,
            definedHeaders: formDef.fields.map((f) => normalizeHeader(f.label)),
            totalRowsProcessed: 0,

            // streaming/bookkeeping
            csvBuffer: "",
            csvBatch: [],
            csvChunkCount: 0,
            processedBytes: 0, // <= increment as we parse/process text bytes
        };
        uploadSessions.set(sessionId, session);
    }

    // Receive chunk (decode to UTF-8 text)
    session.csvChunkCount += 1;
    const decoded = Buffer.from(chunk, "base64").toString("utf8");
    session.csvBuffer += decoded;

    // We only add to processedBytes when we actually parse/consume text
    const lastNewlineIdx = session.csvBuffer.lastIndexOf("\n");

    // if no newline and not last, wait for more data
    if (lastNewlineIdx < 0 && !last) {
        return res
            .status(200)
            .json(new ApiResponse(200, {}, "CSV chunk received."));
    }

    const processPart = last
        ? session.csvBuffer
        : session.csvBuffer.slice(0, lastNewlineIdx + 1);

    const tail = last ? "" : session.csvBuffer.slice(lastNewlineIdx + 1);
    session.csvBuffer = tail;

    // bytes we just consumed from buffer
    session.processedBytes += Buffer.byteLength(processPart, "utf8");

    const haveHeaders = session.headers && session.headers.length > 0;
    let rows = [];

    if (!haveHeaders) {
        const res1 = Papa.parse(processPart, {
            header: true,
            skipEmptyLines: true,
            transformHeader: normalizeHeader,
            dynamicTyping: false,
        });

        if (res1.meta?.fields?.length) {
            session.headers = res1.meta.fields.map(normalizeHeader);
        } else if (res1.data?.length) {
            session.headers = Object.keys(res1.data[0]).map(normalizeHeader);
        }

        if (!session.headersValidated && session.headers.length > 0) {
            const missing = session.definedHeaders.filter(
                (h) => !session.headers.includes(h)
            );
            if (missing.length) {
                uploadSessions.delete(sessionId);
                throw new ApiError(
                    400,
                    `Missing required headers: ${missing.join(", ")}`
                );
            }
            session.headersValidated = true;
        }

        rows = res1.data || [];
    } else {
        const res2 = Papa.parse(processPart, {
            header: true,
            skipEmptyLines: true,
            transformHeader: normalizeHeader,
            dynamicTyping: false,
        });
        rows = res2.data || [];
    }

    for (const row of rows) {
        const data = {};
        session.definedHeaders.forEach((h) => {
            data[toCamelCase(h)] = row[h] !== undefined ? row[h] : "N/A";
        });
        session.csvBatch.push({ formId, data });

        if (session.csvBatch.length >= CSV_BATCH_SIZE) {
            await flushCsvBatch(session.csvBatch, session);
        }
    }

    if (last) {
        // If any tail still unparsed (rare due to earlier slicing), parse and count its bytes
        if (session.csvBuffer && session.csvBuffer.trim().length) {
            const tailText = session.csvBuffer;
            session.processedBytes += Buffer.byteLength(tailText, "utf8");

            const res3 = Papa.parse(tailText, {
                header: true,
                skipEmptyLines: true,
                transformHeader: normalizeHeader,
                dynamicTyping: false,
            });

            for (const row of res3.data || []) {
                const data = {};
                session.definedHeaders.forEach((h) => {
                    data[toCamelCase(h)] =
                        row[h] !== undefined ? row[h] : "N/A";
                });
                session.csvBatch.push({ formId, data });
                if (session.csvBatch.length >= CSV_BATCH_SIZE) {
                    await flushCsvBatch(session.csvBatch, session);
                }
            }
            session.csvBuffer = "";
        }

        await flushCsvBatch(session.csvBatch, session);

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
                    "CSV processed chunk-by-chunk and data inserted successfully."
                )
            );
    }

    // Intermediate ping (optional—but helps smoother progress bar)
    sendSseProgress(formId, {
        status: "processing",
        processedRows: session.totalRowsProcessed,
        processedBytes: session.processedBytes,
    });

    return res
        .status(200)
        .json(new ApiResponse(200, {}, "CSV chunk received."));
});
