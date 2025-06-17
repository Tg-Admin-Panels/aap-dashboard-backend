import express from "express";
import cors from "cors";

const app = express();

app.use(express.json());
app.use(
    cors({
        origin: ["http://localhost:5173"], // TODO: change this
        credentials: true,
    })
);
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

import wingRoutes from "./routes/wing.route.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import volunteerRouter from "./routes/volunteer.routes.js";
import memberRouter from "./routes/member.routes.js";
import userRouter from "./routes/user.routes.js";
import cookieParser from "cookie-parser";

app.use("/wings", wingRoutes);
app.use("/volunteers", volunteerRouter);
app.use("/members", memberRouter);
app.use("/users", userRouter);

app.use(errorMiddleware);

export default app;
