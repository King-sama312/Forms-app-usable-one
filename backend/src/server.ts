import "dotenv/config";
import express, {
  type Application,
  type Request,
  type Response,
} from "express";
// import cors from "cors";
import formRoutes from "./modules/form/form.routes.js";
import authRoutes from "./modules/auth/auth.routes.js";
import submissionRoutes from "./modules/submission/submission.routes.js";
import { ApiError } from "./common/api.error.js";
import { errorMiddleware } from "./common/middleware/error.middleware.js";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import { env } from "./common/env.js";

const app: Application = express();

const port = env.PORT;

if (env.NODE_ENV === "production") {
  app.set("trust proxy", 1);
}

app.use(helmet());
// app.use(cors({ origin: "http://localhost:5173", credentials: true }));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser());

app.get("/", (req: Request, res: Response) => {
  res.send("Yooo! the server is live");
});
app.use("/api/forms", submissionRoutes);
app.use("/api/auth", authRoutes);
app.use("/api/forms", formRoutes);

app.all("{*path}", (req: Request, res: Response) => {
  throw ApiError.notFound(`Route ${req.originalUrl} not found`);
});

app.listen(port, () => {
  console.log(`The server is listening on port:${port}`);
});

app.use(errorMiddleware);
