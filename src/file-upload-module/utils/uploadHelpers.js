export const CSV_BATCH_SIZE = 1000;
export const XLSX_BATCH_SIZE = 1000;

export function toBool(str) {
    return str === "true" || str === true;
}

export function toCamelCase(str) {
    const hasHindi = /[\u0900-\u097F]/.test(str);
    if (hasHindi) return str.replace(/[^०-९\u0900-\u097F]+/g, '');
    return str
        .toLowerCase()
        .replace(/[^a-zA-Z0-9]+(.)?/g, (match, chr) => (chr ? chr.toUpperCase() : ''))
        .replace(/^./, (s) => s.toLowerCase());
};

export function normalizeHeader(header) {
    return header.toLowerCase().trim();
}
