# Generic Upload Module

## Overview

This module provides a complete, reusable solution for handling large file uploads. It takes care of the complex parts of the process, like chunking (uploading files in small pieces), parsing CSV and XLSX files, and sending real-time progress updates to the frontend.

It is designed to be highly flexible and can be integrated into any Node.js project, regardless of the database or schema you are using.

## Core Concept: The Data Handler

To make this module so flexible, it uses a concept called **Dependency Injection**. Instead of including any database-specific code, the module asks you to "inject" your project's database logic when you set it up.

You do this by providing a simple JavaScript object called the `dataHandler`.

**Analogy: The Coffee Machine**

Think of this upload module as a smart coffee machine. 

- The **Coffee Machine** (this module) knows how to do all the hard work: grinding beans, heating water, and brewing.
- The **Coffee Pods** (your `dataHandler`) contain the specific coffee (e.g., espresso, latte, cappuccino).

The machine doesn't need to know what kind of coffee you want. It just needs a pod that fits. You give it the pod, and it handles the rest.

Similarly, our upload module knows how to process files, but it doesn't know anything about your database. You provide it with a `dataHandler` that knows how to interact with your specific database, and the module will use it to save the data.

## Backend Setup: A Step-by-Step Guide

Here’s how to connect the module to your application.

### Step 1: Define Your Database Models (If you haven't already)

First, you need to have your Mongoose (or other database) models defined. For this example, let's assume you have two models:

1.  `UploadDefinition`: This model stores the configuration for an upload, such as its name and the required columns (fields).
2.  `Submission`: This model is where the data from the uploaded files will be saved.

### Step 2: Create Your Custom Data Handler

Next, you'll create a new file in your project (e.g., `your-project/dataHandler.js`). This file will contain the object that connects the module to your models.

The `dataHandler` object must have these three functions:

1.  `findDefinitionById`: Looks up an upload configuration by its ID.
2.  `transformRow`: Converts a row from the CSV/XLSX file into the format your `Submission` model expects.
3.  `insertSubmissions`: Saves an array of transformed rows into your database.

Here is a complete example of what this file would look like:

```javascript
// In your project: your-project/dataHandler.js

// 1. Import your own database models
import { UploadDefinition } from './models/uploadDefinition.model.js';
import { Submission } from './models/submission.model.js';

// 2. Import a helper function from the module
import { toCamelCase } from './generic-upload-module/utils/uploadHelpers.js';

// 3. Create and export your data handler object
export const myDataHandler = {

    /**
     * This function receives a definitionId from the module and uses your model
     * to find the corresponding document in your database.
     */
    findDefinitionById: async (definitionId) => {
        return UploadDefinition.findById(definitionId);
    },

    /**
     * This function receives an array of submissions and uses your model
     * to save them to your database.
     */
    insertSubmissions: async (submissions) => {
        if (submissions.length === 0) {
            return;
        }
        await Submission.insertMany(submissions, { ordered: false });
    },

    /**
     * This function receives one row of data from the file and must return
     * an object that matches your database schema.
     * This is where you can customize the mapping of your data.
     */
    transformRow: (row, definitionId, definedHeaders) => {
        const data = {};
        // This example converts header names to camelCase (e.g., "First Name" -> "firstName")
        definedHeaders.forEach((h) => {
            data[toCamelCase(h)] = row[h] !== undefined ? row[h] : "N/A";
        });
        // Return the final object to be inserted into the database
        return { definitionId, data };
    },
};
```

### Step 3: Connect the Module to Your App

Finally, in your main `app.js` or `index.js` file, you import the module and your newly created `dataHandler` and tell your Express app to use them.

```javascript
// In your project: app.js

import express from 'express';
// Import the setup function from the module
import setupUploadModule from './generic-upload-module';
// Import your custom data handler
import { myDataHandler } from './your-project/dataHandler.js';

const app = express();

// This is the final connection. 
// It tells the module to use your data handler and sets up all the API routes.
setupUploadModule(app, myDataHandler);

// Your other app setup...

const PORT = 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
```

And that's it! The module is now fully integrated into your project.

## Frontend Usage

1.  Install required dependencies:

    ```bash
    npm install react-dropzone
    ```

2.  Import and use the `FileUploadModal` component:

    ```tsx
    import FileUploadModal from './modules/generic-upload-module/frontend/FileUploadModal';

    function YourComponent() {
      const [isUploadModalOpen, setIsUploadModalOpen] = useState(false);

      const handleUploadSuccess = () => {
        setIsUploadModalOpen(false);
        // Refresh your data or perform other actions
      };

      return (
        <FileUploadModal
          isOpen={isUploadModalOpen}
          onClose={() => setIsUploadModalOpen(false)}
          onUploadSuccess={handleUploadSuccess}
          definitionId="your-definition-id" // Pass the ID of your upload configuration here
          apiBaseUrl="http://your-api-base-url"
        />
      );
    }
    ```

## Configuration

You can configure batch sizes in `utils/uploadHelpers.js`:

```javascript
export const CSV_BATCH_SIZE = 1000;  // Adjust based on your needs
export const XLSX_BATCH_SIZE = 1000; // Adjust based on your needs
```

## Dependencies

### Backend

-   express
-   papaparse (for CSV parsing)
-   exceljs (for XLSX parsing)

### Frontend

-   react
-   react-dropzone
-   typescript (optional but recommended)

## Error Handling

The module includes comprehensive error handling for:

-   Invalid file types
-   Missing headers
-   Network issues
-   Processing errors

## Progress Tracking

The module provides real-time updates for:

-   Upload progress (percentage)
-   Processed rows count
-   Processing status (uploading/processing/completed)
