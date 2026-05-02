import connectDB from "./src/config/db.js";
import dotenv from "dotenv";
import app from "./src/app.js";

dotenv.config();

const port = (process.env.NODE_ENV === 'production' ? process.env.PROD_PORT : process.env.DEV_PORT) || 80;

connectDB()
    .then(() => {
        app.listen(port, "0.0.0.0", () => {
            console.log(`🚀 Server is running on port ${port}`);
            console.log(`🌍 Environment: ${process.env.NODE_ENV || 'development'}`);
        });
    })
    .catch((err) => console.log(err));
