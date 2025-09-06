
import fs from 'fs/promises';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';

const TEMP_UPLOAD_DIR = path.join(process.cwd(), 'tmp', 'uploads');

// Ensure the temporary upload directory exists
fs.mkdir(TEMP_UPLOAD_DIR, { recursive: true }).catch(console.error);

const getTempFilePath = (jobId, originalname) => {
  const fileExtension = path.extname(originalname);
  return path.join(TEMP_UPLOAD_DIR, `${jobId}${fileExtension}`);
};

export const writeChunk = async (jobId, originalname, chunk, isLastChunk) => {
  const filePath = getTempFilePath(jobId, originalname);
  const buffer = Buffer.from(chunk, 'base64');

  await fs.appendFile(filePath, buffer);

  return filePath;
};

export const getFilePath = (jobId, originalname) => {
  return getTempFilePath(jobId, originalname);
};

export const cleanupFile = async (jobId, originalname) => {
  const filePath = getTempFilePath(jobId, originalname);
  try {
    // Check if the file exists before attempting to unlink
    await fs.access(filePath, fs.constants.F_OK); // F_OK tests for file existence
    await fs.unlink(filePath);
    console.log(`Cleaned up temporary file: ${filePath}`);
  } catch (error) {
    if (error.code === 'ENOENT') {
      console.log(`Temporary file not found, no cleanup needed: ${filePath}`);
    } else {
      console.error(`Error cleaning up file ${filePath}:`, error);
    }
  }
};
