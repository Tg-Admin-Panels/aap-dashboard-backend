import express from "express";
import cors from "cors";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

const app = express();

const allowedOrigins = [
  "http://localhost:5173",
  "http://localhost:5500",
  "https://admin.aapbihar.org"
];

const corsOptions = {
  origin: function (origin, callback) {
    console.log("CORS incoming origin:", origin);
    if (!origin || allowedOrigins.includes(origin)) {
      callback(null, true);
    } else {
      console.log("❌ Blocked by CORS:", origin);
      callback(new Error("Not allowed by CORS"));
    }
  },
  credentials: true,
  methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
};


app.use(cors(corsOptions));



// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Routes
import wingRoutes from "./routes/wing.route.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";
import volunteerRouter from "./routes/volunteer.routes.js";
import memberRouter from "./routes/member.routes.js";
import userRouter from "./routes/user.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";

app.get("/", (req, res) => {
  res.send("Welcome to AAP Bihar");
});

app.use("/wings", wingRoutes);
app.use("/volunteers", volunteerRouter);
app.use("/members", memberRouter);
app.use("/users", userRouter);
app.use("/dashboard", dashboardRouter);

// ✅ Error handler
app.use(errorMiddleware);

export default app;
