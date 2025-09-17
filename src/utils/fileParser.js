import fs from "fs";
import Papa from "papaparse";
import * as XLSX from "xlsx";

export const parseFile = async (filePath) => {
    const ext = filePath.split(".").pop().toLowerCase();

    if (ext === "csv") {
        return new Promise((resolve, reject) => {
            const fileStream = fs.createReadStream(filePath);

            Papa.parse(fileStream, {
                header: true,          // Use first row as headers
                skipEmptyLines: true,  // Ignore completely blank rows
                transformHeader: header => header.trim(),
                complete: (results) => {
                    // Filter out null / undefined / empty objects
                    const cleanData = results.data.filter((row) => {
                        if (!row || typeof row !== "object") return false;

                        // check if all values are empty/undefined/null
                        const values = Object.values(row).map((v) => (v ? String(v).trim() : ""));
                        const nonEmpty = values.some((v) => v.length > 0);
                        return nonEmpty;
                    });

                    resolve(cleanData);
                },
                error: (err) => reject(err),
            });
        });
    }

    if (ext === "xlsx") {
        // ✅ read Multer uploaded file as buffer
        const fileBuffer = fs.readFileSync(filePath);
        const workbook = XLSX.read(fileBuffer, { type: "buffer" });

        const sheetName = workbook.SheetNames[0];
        let rows = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);

        rows = rows.filter((row) => {
            if (!row || typeof row !== "object") return false;
            const values = Object.values(row).map((v) =>
                v ? String(v).trim() : ""
            );
            return values.some((v) => v.length > 0);
        });

        return rows;
    }

    throw new Error("Unsupported file format. Use CSV or XLSX.");
};
