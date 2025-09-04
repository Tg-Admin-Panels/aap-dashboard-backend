// utils/uploadSessions.js
// Single in-memory store shared by both CSV and XLSX controllers

/** Map key: `${formId}-${originalname}` */
export const uploadSessions = new Map();
