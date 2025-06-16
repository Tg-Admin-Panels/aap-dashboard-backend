import express from "express";
import cors from "cors";


const app = express();

app.use(express.json());
app.use(cors({
    origin: "*" // TODO: change this
}))

import wingRoutes from "./routes/wing.route.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

app.use("/wings", wingRoutes);

app.use(errorMiddleware)

export default app;