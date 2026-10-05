import "dotenv/config";
import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cors from "cors";
import formRoutes from "./modules/form/form.routes.js"
import authRoutes from "./modules/auth/auth.routes.js"
import { ApiError } from "./common/api.error.js";
import { errorMiddleware } from "./middleware/error.middleware.js";
import cookieParser from "cookie-parser";

const app: Application = express();

const port = process.env.PORT;

app.use(cors({origin:"http://localhost:3000", credentials: true}));
app.use(express.urlencoded({ extended: true }));
app.use(express.json());
app.use(cookieParser())

app.get("/", (req: Request, res: Response) => {
  res.send("Yooo! the server is live");
});
app.use("/api", formRoutes, authRoutes);

app.all("{*path}", (req: Request, res: Response) => {
  throw ApiError.notFound(`Route ${req.originalUrl} not found`);
});

app.listen(port, () => {
  console.log(`The server is listening on port:${port}`);
});

app.use(errorMiddleware)