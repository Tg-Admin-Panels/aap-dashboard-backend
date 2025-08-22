import mongoose from "mongoose";
import State from "./src/models/state.model.js";
import District from "./src/models/district.model.js";
import LegislativeAssembly from "./src/models/legislativeAssembly.model.js";
import Booth from "./src/models/booth.model.js";

const MONGO_URI =
    "mongodb+srv://rohit:Rohit1234@cluster0.5a6t3ge.mongodb.net/aap-bihar";

const connectDB = async () => {
    try {
        await mongoose.connect(MONGO_URI);
        console.log("MongoDB connected");
    } catch (error) {
        console.error("MongoDB connection error:", error.message);
        process.exit(1);
    }
};

const addDummyLocations = async () => {
    try {
        await connectDB();
        console.log("Database connected for dummy locations insertion.");

        // Clear existing data (optional, for fresh start)
        await State.deleteMany({});
        await District.deleteMany({});
        await LegislativeAssembly.deleteMany({});
        await Booth.deleteMany({});
        console.log("Cleared existing location data.");

        // Add States
        const bihar = await State.create({ name: "Bihar", code: "BR" });
        const up = await State.create({ name: "Uttar Pradesh", code: "UP" });
        console.log("States added.");

        // Add Districts for Bihar
        const patna = await District.create({
            name: "Patna",
            code: "PTN",
            parentId: bihar._id,
        });
        const gaya = await District.create({
            name: "Gaya",
            code: "GAY",
            parentId: bihar._id,
        });
        console.log("Districts for Bihar added.");

        // Add Districts for Uttar Pradesh
        const lucknow = await District.create({
            name: "Lucknow",
            code: "LKO",
            parentId: up._id,
        });
        console.log("Districts for Uttar Pradesh added.");

        // Add Legislative Assemblies for Patna
        const didarganj = await LegislativeAssembly.create({
            name: "Didarganj",
            code: "DGJ",
            parentId: patna._id,
        });
        const bankipur = await LegislativeAssembly.create({
            name: "Bankipur",
            code: "BKP",
            parentId: patna._id,
        });
        console.log("Legislative Assemblies for Patna added.");

        // Add Booths for Didarganj
        await Booth.create({
            name: "Booth 1A",
            code: "B1A",
            parentId: didarganj._id,
        });
        await Booth.create({
            name: "Booth 1B",
            code: "B1B",
            parentId: didarganj._id,
        });
        console.log("Booths for Didarganj added.");

        console.log("Dummy location data added successfully!");
    } catch (error) {
        console.error("Error adding dummy location data:", error);
    } finally {
        process.exit(0);
    }
};

addDummyLocations();
