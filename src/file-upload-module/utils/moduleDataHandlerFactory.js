
import { FormDefinition } from "../../models/formDefinition.model.js";
import { FormSubmission } from "../../models/formSubmission.model.js";
import { toCamelCase } from "./uploadHelpers.js";

/**
 * @typedef {Object} DataHandler
 * @property {(definitionId: string) => Promise<any>} findDefinitionById
 * @property {(submissions: any[]) => Promise<void>} insertSubmissions
 * @property {(row: any, definitionId: string, definedHeaders: string[]) => any} transformRow
 */

/**
 * This is an example implementation of the DataHandler.
 * In a real application, you would replace this with your actual database logic.
 *
 * @param {any} UploadDefinition - The Mongoose model for upload definitions.
 * @param {any} Submission - The Mongoose model for submissions.
 * @returns {DataHandler}
 */
export const createMongooseDataHandler = () => {
    // if (!UploadDefinition || !Submission) {
    //     throw new Error("Both UploadDefinition and Submission models must be provided.");
    // }

    return {
        /**
         * @param {string} definitionId
         * @returns {Promise<any>}
         */
        findDefinitionById: async (definitionId) => {
            console.log(`Got form definition id: `, definitionId)
            return FormDefinition.findById(definitionId);
        },

        /**
         * @param {any[]} submissions
         * @returns {Promise<void>}
         */
        insertSubmissions: async (submissions) => {
            if (submissions.length === 0) {
                console.log("[DATA_HANDLER] No submissions to insert, returning.");
                return;
            }
            console.log(`[DATA_HANDLER] Received ${submissions.length} submissions for insertion.`);
            console.log("[DATA_HANDLER] First submission example:", JSON.stringify(submissions[0], null, 2));

            try {

                const result = await FormSubmission.insertMany(submissions, { ordered: false });
                console.log(`[DATA_HANDLER] Mongoose insertMany successful. Inserted count: ${result.length}`);
            } catch (error) {
                console.error("[DATA_HANDLER] Mongoose insertMany failed:", error);
                throw error; // Re-throw the error so it can be caught by the worker's try...catch
            }
        },

        /**
         * @param {any} row - The raw row data from the parser.
         * @param {string} definitionId - The ID of the definition being processed.
         * @param {string[]} definedHeaders - The headers defined in the definition.
         * @returns {any} The transformed data object to be inserted into the database.
         */
        transformRow: (row, definitionId, definedHeaders) => {
            const data = {};
            definedHeaders.forEach((h) => {
                data[toCamelCase(h)] = row[h] !== undefined ? row[h] : "N/A";
            });
            return { formId: definitionId, data };
        },
    };
};
