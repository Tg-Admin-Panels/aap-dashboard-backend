import connectDB from "./src/config/db.js";
import dotenv from "dotenv";
import app from "./src/app.js";

dotenv.config({
    path: "./.env",
});

const port = process.env.PORT || 8000;

connectDB()
    .then(() => {
        app.listen(port, () => {
            console.log(`Server started on port ${port}`);
        });
    })
    .catch((err) => console.log(err));
