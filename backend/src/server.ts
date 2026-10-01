import "dotenv/config";
import express, {
  type Application,
  type Request,
  type Response,
} from "express";
import cors from "cors";

const app: Application = express();

const port = process.env.PORT;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json);

app.get("/", (req: Request, res: Response) => {
  res.send("Yooo! the server is live");
});

app.listen(port, () => {
  console.log(`The server is listening on port:${port}`);
});
