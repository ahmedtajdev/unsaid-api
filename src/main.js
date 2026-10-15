import express from "express";
import {
  authenticationController,
  messageController,
  userController,
  requestController,
  conversationController,
} from "./modules/index.js";
import { globalErrorHandling } from "./middleware/index.js";
import { LIMIT, ORIGINS, PORT } from "./config.js";
import { bootstrapDB } from "./DB/connection.db.js";
import cors from "cors";
import helmet from "helmet";
import { generateLimiter } from "./common/utils/index.js";
import morgan from "morgan";

const app = express();
await bootstrapDB(app, PORT);

const corsOptions = {
  origin: function (origin, callback) {
    if (!ORIGINS.includes(origin)) {
      callback(
        new Error("Unauthorized origin", { cause: { status: 401 } }),
        ORIGINS,
      );
    } else {
      callback(null, ORIGINS);
    }
  },
};

const limiter = generateLimiter({
  limit: LIMIT,
});

app.set("trust proxy", true);
app.use(helmet(), cors(), morgan("dev"), limiter, express.json());
app.use("/assets", express.static("./assets"));

app.all("/", (req, res) => res.status(200).json({ message: "Welcome" }));

app.use("/auth", authenticationController);
app.use("/message", messageController);
app.use("/user", userController);
app.use("/request", requestController);
app.use("/conversation", conversationController);

app.all("{/*dummy}", (req, res) =>
  res.status(404).json({ message: "Invalid application routing" }),
);

app.use(globalErrorHandling);
