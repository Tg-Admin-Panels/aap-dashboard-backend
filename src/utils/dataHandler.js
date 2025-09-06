// your-project/dataHandler.js
import mongoose from "mongoose"; // add this
import { FormDefinition } from "../models/formDefinition.model.js";
import { FormSubmission } from "../models/formSubmission.model.js";
import { toCamelCase } from "../file-upload-module/utils/uploadHelpers.js";

export const myDataHandler = {
    findDefinitionById: async (definitionId) => {
        console.log("Find definition id in root/utils/dataHandler", definitionId);
        if (!mongoose.isValidObjectId(definitionId)) return null; // <— add guard
        return FormDefinition.findById(definitionId);
    },

    // Return how many docs DB ne actually insert kiye
    insertSubmissions: async (submissions) => {
        if (!Array.isArray(submissions) || submissions.length === 0) return 0;
        const docs = await FormSubmission.insertMany(submissions, { ordered: false });
        return docs.length;
    },

    transformRow: (row, definitionId, definedHeaders) => {
        const data = {};
        for (const h of definedHeaders) {
            const v = row?.[h] ?? row?.[h?.trim?.()];
            // numbers/dates ke liye "N/A" ki jagah null zyada safe hota hai
            data[toCamelCase(h)] = v === undefined ? null : v;
        }
        return { definitionId, data };
    },
};
