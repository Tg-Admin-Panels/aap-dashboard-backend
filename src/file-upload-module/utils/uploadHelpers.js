export const CSV_BATCH_SIZE = 1000;
export const XLSX_BATCH_SIZE = 1000;

export function toBool(str) {
    return str === "true" || str === true;
}

export function toCamelCase(str) {
    return str
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)/g, (_, chr) => chr.toUpperCase());
}

export function normalizeHeader(header) {
    return header.toLowerCase().trim();
}
