import mongoose from "mongoose";
import xlsx from "xlsx";

// Import models
import State from "./src/models/state.model.js";
import District from "./src/models/district.model.js";
import LegislativeAssembly from "./src/models/legislativeAssembly.model.js";
import Booth from "./src/models/booth.model.js";

// MongoDB connection
const MONGO_URI = "mongodb+srv://rohit:Rohit1234@cluster0.5a6t3ge.mongodb.net/aap-bihar";

async function connectDB() {
    await mongoose.connect(MONGO_URI, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    });
    console.log("✅ MongoDB connected");
}

async function importData() {
    try {
        // Excel file load
        const workbook = xlsx.readFile("./FORM.xlsx");

        // Sheet detection (ignore case + spaces)
        const sheetName = workbook.SheetNames.find(
            (name) => name.trim().toUpperCase() === "BULK"
        );
        if (!sheetName) throw new Error("❌ BULK sheet not found in Excel file");

        const sheet = workbook.Sheets[sheetName];
        let rows = xlsx.utils.sheet_to_json(sheet, { defval: null });

        // Normalize headers: trim + uppercase
        rows = rows.map((row) => {
            const normalized = {};
            Object.keys(row).forEach((key) => {
                if (!key) return;
                normalized[key.trim().toUpperCase()] = row[key];
            });
            return normalized;
        });

        console.log("👉 First row keys:", Object.keys(rows[0]));

        // Process rows in batches of 100
        for (let i = 0; i < rows.length; i += 100) {
            const batch = rows.slice(i, i + 100);

            const ops = [];

            for (const row of batch) {
                const stateName = row["STATE"];
                const stateCode = row["STATE CODE"];
                const districtName = row["DISTRICT"];
                const districtCode = row["DISTRICT CODE"];
                const acName = row["AC NAME"];
                const acCode = row["AC NO."];
                const boothName = row["BOOTH NAME"];
                const boothCode = row["BOOTH CODE."];

                if (!stateName || !districtName || !acName || !boothName) continue;

                ops.push({ stateName, stateCode, districtName, districtCode, acName, acCode, boothName, boothCode });
            }

            // Resolve hierarchy one by one for this batch
            for (const item of ops) {
                // --- STATE ---
                let state = await State.findOne({ name: item.stateName });
                if (!state) {
                    state = await State.create({ name: item.stateName, code: item.stateCode });
                }

                // --- DISTRICT ---
                let district = await District.findOne({ name: item.districtName, parentId: state._id });
                if (!district) {
                    district = await District.create({
                        name: item.districtName,
                        code: item.districtCode,
                        parentId: state._id,
                    });
                }

                // --- LEGISLATIVE ASSEMBLY ---
                let assembly = await LegislativeAssembly.findOne({ name: item.acName, parentId: district._id });
                if (!assembly) {
                    assembly = await LegislativeAssembly.create({
                        name: item.acName,
                        code: item.acCode,
                        parentId: district._id,
                    });
                }

                // --- BOOTH ---
                let booth = await Booth.findOne({ name: item.boothName, parentId: assembly._id });
                if (!booth) {
                    booth = await Booth.create({
                        name: item.boothName,
                        code: item.boothCode,
                        parentId: assembly._id,
                    });
                }
            }

            console.log(`✅ Batch ${i / 100 + 1} processed (${i + 1} - ${i + batch.length})`);
        }

        console.log("🎉 Data imported successfully!");
        process.exit(0);
    } catch (error) {
        console.error("❌ Error importing data:", error);
        process.exit(1);
    }
}

(async () => {
    await connectDB();
    await importData();
})();
