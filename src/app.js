import express from "express";
import cookieParser from "cookie-parser";
import bodyParser from "body-parser";

const app = express();


console.log("This is AAP Bihar Backend")
app.use((req, res, next) => {
  console.log(`[${req.method}] ${req.url}`);
  next();
});

// --- ✅ CUSTOM CORS MIDDLEWARE ---
app.use((req, res, next) => {
  const origin = req.headers.origin;
console.log("This is origin")
console.log(origin)

  if (origin) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET,POST,PUT,PATCH,DELETE,OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(204);
  }

  next();
});

// ✅ Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// ✅ Routes
import wingRoutes from "./routes/wing.route.js";
import volunteerRouter from "./routes/volunteer.routes.js";
import memberRouter from "./routes/member.routes.js";
import userRouter from "./routes/user.routes.js";
import dashboardRouter from "./routes/dashboard.routes.js";
import { errorMiddleware } from "./middlewares/error.middleware.js";

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
