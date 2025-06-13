const express = require("express");
const morgan = require("morgan");
const cors = require("cors");
const path = require("path");
const mongoSanitize = require("express-mongo-sanitize");

const userRouter = require("./Routes/userRoutes");
const orgRouter = require("./Routes/orgRoutes");
const submissionRouter = require("./Routes/submissionRoutes");
const programRouter = require("./Routes/programRoutes");

const AppError = require("./utilities/appError");
const globalErrorHandler = require("./Controllers/errorController");
const serveStaticFiles = require("./serveStaticFiles");

const app = express();

if (process.env.NODE_ENV === "development") {
  app.use(morgan("dev"));
}

app.use((req, res, next) => {
  req.requestTime = new Date().toISOString();
  next();
});

app.use(cors());
app.use(express.json());
app.use(mongoSanitize());

app.use("/api/v1/users", userRouter);
app.use("/api/v1/orgs", orgRouter);
app.use("/api/v1/submission", submissionRouter);
app.use("/api/v1/programs", programRouter);

serveStaticFiles(app);

app.all("*", (req, res, next) => {
  next(new AppError(`Can't find ${req.originalUrl} on this server!`, 404));
});

app.use(globalErrorHandler);

module.exports = app;
