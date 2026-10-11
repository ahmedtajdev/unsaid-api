import express from "express";
import {
  authenticationController,
  messageController,
  userController,
} from "./modules/index.js";
import { globalErrorHandling } from "./middleware/index.js";
import { ORIGINS, PORT } from "./config.js";
import { bootstrapDB } from "./DB/connection.db.js";
import cors from "cors";
import helmet from "helmet";

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

app.use(helmet(), cors(), express.json());
app.use("/assets", express.static("./assets"));

app.all("/", (req, res) => res.status(200).json({ message: "Welcome" }));

app.use("/auth", authenticationController);
app.use("/message", messageController);
app.use("/user", userController);

app.all("{/*dummy}", (req, res) =>
  res.status(404).json({ message: "Invalid application routing" }),
);

app.use(globalErrorHandling);
