// controllers/csvUpload.controller.js

import Papa from "papaparse";
import asyncHandler from "../utils/asyncHandler.js";
import ApiError from "../utils/ApiError.js";
import ApiResponse from "../utils/ApiResponse.js";
import { FormSubmission } from "../models/formSubmission.model.js";
import { FormDefinition } from "../models/formDefinition.model.js";
import { uploadSessions } from "../utils/uploadSessions.js";
import { sendSseProgress } from "../utils/sseProgress.js";

// ======= Tuning =======
const CSV_BATCH_SIZE = 1000; // rows per batch

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

async function flushBatch(batch, session, formId) {
    if (!batch.length) return;
    await FormSubmission.insertMany(batch, { ordered: false });
    session.totalRowsProcessed += batch.length;
    sendSseProgress(formId, {
        processedRows: session.totalRowsProcessed,
        status: "processing",
    });
    batch.length = 0;
}

/**
 * POST /api/upload/csv/:formId
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

    const last = toBool(isLastChunk);
    const sessionId = `${formId}-${originalname}`;
    let session = uploadSessions.get(sessionId);

    // INIT
    if (!session) {
        if (!originalname.toLowerCase().endsWith(".csv")) {
            throw new ApiError(400, "Unsupported file type for this endpoint.");
        }

        const formDef = await FormDefinition.findById(formId);
        if (!formDef) throw new ApiError(404, "Form definition not found.");

        session = {
            formId,
            fileType: "csv",
            headers: [],
            headersValidated: false,
            definedHeaders: formDef.fields.map((f) => normalizeHeader(f.label)),
            totalRowsProcessed: 0,

            csvBuffer: "",
            csvBatch: [],
            csvChunkCount: 0,
        };
        uploadSessions.set(sessionId, session);
    }

    // STREAMING CSV
    session.csvChunkCount += 1;

    const decoded = Buffer.from(chunk, "base64").toString("utf8");
    session.csvBuffer += decoded;

    const lastNewlineIdx = session.csvBuffer.lastIndexOf("\n");

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

    const haveHeaders = session.headers && session.headers.length > 0;

    let rows = [];
    if (!haveHeaders) {
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
            await flushBatch(session.csvBatch, session, formId);
        }
    }

    if (last) {
        // parse tail (if any)
        if (session.csvBuffer && session.csvBuffer.trim().length) {
            const res3 = Papa.parse(session.csvBuffer, {
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
                    await flushBatch(session.csvBatch, session, formId);
                }
            }
            session.csvBuffer = "";
        }

        await flushBatch(session.csvBatch, session, formId);

        const count = session.totalRowsProcessed;
        sendSseProgress(formId, { processedRows: count, status: "completed" });
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

    // not last chunk
    return res
        .status(200)
        .json(new ApiResponse(200, {}, "CSV chunk received."));
});
