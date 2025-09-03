import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";
import fileUpload from "express-fileupload";
import { v2 as cloudinary } from "cloudinary";
const app = express();

console.log("This is AAP Bihar Backend");
app.use((req, res, next) => {
    console.log(`[${req.method}] ${req.url}`);
    next();
});

// --- ✅ CUSTOM CORS MIDDLEWARE ---
app.use((req, res, next) => {
    const origin = req.headers.origin;
    console.log("This is origin");
    console.log(origin);

    if (origin) {
        res.setHeader("Access-Control-Allow-Origin", origin);
    }

    res.setHeader("Access-Control-Allow-Credentials", "true");
    res.setHeader(
        "Access-Control-Allow-Methods",
        "GET,POST,PUT,PATCH,DELETE,OPTIONS"
    );
    res.setHeader(
        "Access-Control-Allow-Headers",
        "Content-Type, Authorization"
    );

    if (req.method === "OPTIONS") {
        return res.sendStatus(204);
    }

    next();
});

// ✅ Middleware
app.use(express.json({ limit: "50mb" }));
app.use(
    cors({
        origin: [
            "http://localhost:5173",
            "http://localhost:5500",
            "http://127.0.0.1:5501",
            "http://127.0.0.1:5500",
            "https://aapbihar.org",
            "https://admin.aapbihar.org",
        ], // TODO: change this
        credentials: true,
    })
);

app.use(
    fileUpload({
        useTempFiles: true,
        tempFileDir: "/tmp/", // या अपनी choice का path
        limits: { fileSize: 50 * 1024 * 1024 }, // max file 50 MB
    })
);

app.use(express.urlencoded({ extended: true, limit: "50mb" }));
app.use(cookieParser());
// app.use(bodyParser.json()); // Removed
// app.use(bodyParser.urlencoded({ extended: true })); // Removed

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
console.log({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
// ✅ Routes
import wingRoutes from "./routes/wing.route.js";
import volunteerRouter from "./routes/volunteer.routes.js";
import memberRouter from "./routes/member.routes.js";
import userRouter from "./routes/user.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import boothTeamRouter from "./routes/boothTeam.route.js";
import stateRouter from "./routes/state.route.js";
import districtRouter from "./routes/district.route.js";
import legislativeAssemblyRouter from "./routes/legislativeAssembly.route.js";
import boothRouter from "./routes/booth.route.js";
import cloudinaryRouter from "./routes/cloudinary.route.js";
import visionRouter from "./routes/vision.routes.js";
import candidateApplicationRouter from "./routes/candidateApplication.routes.js";
import campaignRouter from "./routes/campaign.routes.js";
import formRouter from "./routes/form.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

app.get("/", (req, res) => {
    res.send("Welcome to AAP Bihar");
});

app.use("/wings", wingRoutes);
app.use("/volunteers", volunteerRouter);
app.use("/members", memberRouter);
app.use("/users", userRouter);
app.use("/dashboard", dashboardRouter);
app.use("/booth-team", boothTeamRouter);
app.use("/states", stateRouter);
app.use("/districts", districtRouter);
app.use("/legislative-assemblies", legislativeAssemblyRouter);
app.use("/booths", boothRouter);
app.use("/visions", visionRouter);
app.use("/api/cloudinary", cloudinaryRouter);
app.use("/candidate-applications", candidateApplicationRouter);
app.use("/campaigns", campaignRouter);
app.use("/api/v1/forms", formRouter);
app.use(errorMiddleware);

export default app;
