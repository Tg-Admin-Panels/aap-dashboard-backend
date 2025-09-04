// utils/uploadHelpers.js

export const CSV_BATCH_SIZE = 1000;
export const XLSX_BATCH_SIZE = 500;

export const toCamelCase = (str) =>
    String(str || "")
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)?/g, (m, chr) =>
            chr ? chr.toUpperCase() : ""
        )
        .replace(/^./, (s) => s.toLowerCase());

export const normalizeHeader = (h) => String(h || "").trim();
export const toBool = (v) => v === true || v === "true" || v === "1";

/** Clamp utility */
export const clamp = (n, min, max) => Math.max(min, Math.min(max, n));
