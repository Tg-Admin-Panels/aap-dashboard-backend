import express from "express";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(
    cors({
        origin: ["http://localhost:5173"], // TODO: change this
    })
);

import wingRoutes from "./routes/wing.route.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import volunteerRouter from "./routes/volunteer.routes.js";
app.use("/wings", wingRoutes);
app.use("/volunteers", volunteerRouter);
app.use(errorMiddleware);

export default app;
