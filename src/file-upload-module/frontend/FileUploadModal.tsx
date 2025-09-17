// import React, { useState, useCallback, useEffect, useRef } from 'react';
// import { useDropzone } from 'react-dropzone';

// interface FileUploadModalProps {
//     isOpen: boolean;
//     onClose: () => void;
//     onUploadSuccess: () => void;
//     definitionId: string;
//     apiBaseUrl: string;
// }

// const FileUploadModal: React.FC<FileUploadModalProps> = ({
//     isOpen,
//     onClose,
//     onUploadSuccess,
//     definitionId,
//     apiBaseUrl
// }) => {
//     const [file, setFile] = useState<File | null>(null);
//     const [loading, setLoading] = useState(false);
//     const [error, setError] = useState<string | null>(null);
//     const [uploadProgress, setUploadProgress] = useState(0);
//     const [processedRows, setProcessedRows] = useState(0);
//     const eventSourceRef = useRef<EventSource | null>(null);

//     const closeSSE = useCallback(() => {
//         if (eventSourceRef.current) {
//             try { eventSourceRef.current.close(); } catch { }
//             eventSourceRef.current = null;
//         }
//     }, []);

//     const reset = useCallback(() => {
//         closeSSE();
//         setFile(null);
//         setLoading(false);
//         setError(null);
//         setUploadProgress(0);
//         setProcessedRows(0);
//     }, [closeSSE]);

//     const onDrop = useCallback((acceptedFiles: File[]) => {
//         if (acceptedFiles.length > 0) {
//             const selectedFile = acceptedFiles[0];
//             setFile(selectedFile);
//             setError(null);
//             setUploadProgress(0);
//             setProcessedRows(0);
//         }
//     }, []);

//     const uploadFileInChunks = async (fileToUpload: File) => {
//         setLoading(true);
//         setError(null);
//         setUploadProgress(0);
//         setProcessedRows(0);

//         // 1) Establish SSE connection
//         const es = new EventSource(`${apiBaseUrl}/api/v1/uploads/${definitionId}/submissions/events`);
//         eventSourceRef.current = es;

//         es.onmessage = (event) => {
//             const data = JSON.parse(event.data);
//             if (data.status === "processing") {
//                 const perc = fileToUpload.size > 0
//                     ? Math.min(100, Math.max(0, (data.processedBytes / fileToUpload.size) * 100))
//                     : 0;
//                 setUploadProgress(perc);
//                 setProcessedRows(data.processedRows || 0);
//             } else if (data.status === "completed") {
//                 setProcessedRows(data.processedRows || 0);
//                 setUploadProgress(100);
//                 closeSSE();
//                 onUploadSuccess();
//             } else if (data.status === "error") {
//                 setError(data.message || "Processing failed.");
//                 closeSSE();
//             }
//         };

//         es.onerror = () => {
//             setError("SSE connection error. Progress updates may be unavailable.");
//             closeSSE();
//         };

//         const chunkSize = 1024 * 1024; // 1MB
//         const totalChunks = Math.ceil(fileToUpload.size / chunkSize);
//         let chunkIndex = 0;

//         try {
//             for (let i = 0; i < fileToUpload.size; i += chunkSize) {
//                 const chunk = fileToUpload.slice(i, i + chunkSize);
//                 const reader = new FileReader();

//                 const chunkPromise = new Promise<void>((resolve, reject) => {
//                     reader.onload = async (e) => {
//                         try {
//                             const base64Chunk = (e.target?.result as string).split(',')[1];
//                             const isLastChunk = (chunkIndex + 1) === totalChunks;

//                             await fetch(`${apiBaseUrl}/api/v1/uploads/${definitionId}/submissions/upload-chunk`, {
//                                 method: 'POST',
//                                 headers: {
//                                     'Content-Type': 'application/json',
//                                 },
//                                 body: JSON.stringify({
//                                     chunk: base64Chunk,
//                                     isLastChunk: isLastChunk.toString(),
//                                     originalname: fileToUpload.name,
//                                 })
//                             });

//                             chunkIndex++;
//                             resolve();
//                         } catch (err: any) {
//                             setError(err.response?.data?.message || "Chunk upload failed.");
//                             reject(err);
//                         }
//                     };
//                     reader.readAsDataURL(chunk);
//                 });
//                 await chunkPromise;
//             }

//             // 2) upload-complete
//             await fetch(`${apiBaseUrl}/api/v1/uploads/${definitionId}/submissions/upload-complete`, {
//                 method: 'POST',
//                 headers: {
//                     'Content-Type': 'application/json',
//                 },
//                 body: JSON.stringify({
//                     originalname: fileToUpload.name,
//                 })
//             });

//         } catch (uploadErr: any) {
//             setError(uploadErr?.response?.data?.message || "File upload failed.");
//             closeSSE();
//         } finally {
//             setLoading(false);
//         }
//     };

//     const handleSubmit = async () => {
//         if (!file) {
//             setError("Please select a file to upload.");
//             return;
//         }
//         await uploadFileInChunks(file);
//     };

//     const { getRootProps, getInputProps, isDragActive } = useDropzone({
//         onDrop,
//         accept: {
//             'text/csv': ['.csv'],
//             'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': ['.xlsx']
//         }
//     });

//     useEffect(() => {
//         if (!isOpen) {
//             reset();
//         }
//     }, [isOpen, reset]);

//     useEffect(() => {
//         return () => {
//             reset();
//         };
//     }, [reset]);

//     if (!isOpen) return null;

//     return (
//         <div className="fixed inset-0 bg-black bg-opacity-50 z-90 flex justify-center items-center">
//             <div className="bg-white dark:bg-gray-800 p-8 rounded-lg shadow-2xl w-full max-w-lg relative">
//                 <div className="flex justify-between items-center mb-4">
//                     <h2 className="text-2xl font-bold text-gray-900 dark:text-white">Upload File</h2>
//                     <button
//                         onClick={() => { reset(); onClose(); }}
//                         className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors duration-200"
//                     >
//                         <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
//                             <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
//                         </svg>
//                     </button>
//                 </div>

//                 <div
//                     {...getRootProps()}
//                     className="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center cursor-pointer hover:border-blue-500 dark:hover:border-blue-400 transition-colors duration-200"
//                 >
//                     <input {...getInputProps()} />
//                     <div>
//                         {file ? (
//                             <p className="text-gray-700 dark:text-gray-300">{file.name}</p>
//                         ) : isDragActive ? (
//                             <p className="text-blue-500">Drop the file here...</p>
//                         ) : (
//                             <p className="text-gray-500 dark:text-gray-400">
//                                 Drag & drop a file here, or click to select
//                             </p>
//                         )}
//                         <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">(CSV or XLSX files only)</p>
//                     </div>
//                 </div>

//                 {(uploadProgress > 0 || processedRows > 0) && (
//                     <div className="mt-4">
//                         <div className="flex justify-between mb-1">
//                             <span className="text-base font-medium text-blue-700 dark:text-white">
//                                 {uploadProgress < 100 ? `Uploading & Processing...` : `Completed!`}
//                             </span>
//                             <span className="text-sm font-medium text-blue-700 dark:text-white">
//                                 {uploadProgress < 100 ? `${Math.floor(uploadProgress)}%` : `100%`}
//                                 {processedRows > 0 && ` (${processedRows} rows processed)`}
//                             </span>
//                         </div>
//                         <div className="w-full bg-gray-200 rounded-full h-2.5 dark:bg-gray-700">
//                             <div
//                                 className="bg-blue-600 h-2.5 rounded-full transition-all duration-500 ease-out"
//                                 style={{ width: `${uploadProgress}%` }}
//                             ></div>
//                         </div>
//                     </div>
//                 )}

//                 {error && (
//                     <p className="text-red-500 text-sm mt-4 p-2 bg-red-100 dark:bg-red-900 rounded-md border border-red-300 dark:border-red-700">
//                         Error: {error}
//                     </p>
//                 )}

//                 <div className="mt-6 flex justify-end gap-3">
//                     <button
//                         onClick={() => { reset(); onClose(); }}
//                         className="px-5 py-2 bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 dark:bg-gray-700 dark:text-gray-200 dark:hover:bg-gray-600 transition duration-200 ease-in-out"
//                     >
//                         Cancel
//                     </button>
//                     <button
//                         onClick={handleSubmit}
//                         className="px-5 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition duration-200 ease-in-out"
//                         disabled={!file || loading}
//                     >
//                         {loading ? `Uploading... ${Math.floor(uploadProgress)}%` : 'Upload'}
//                     </button>
//                 </div>
//             </div>
//         </div>
//     );
// };

// export default FileUploadModal;
