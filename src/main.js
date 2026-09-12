import express from "express";
import {
  authenticationController,
  messageController,
  userController,
} from "./modules/index.js";
import { globalErrorHandling } from "./middleware/index.js";
import { PORT } from "./config.js";
import { bootstrapDB } from "./DB/connection.db.js";

const app = express();
bootstrapDB(app, PORT);

app.use(express.json());

app.all("/", (req, res) => res.status(200).json({ message: "Welcome" }));

app.use("/auth", authenticationController);
app.use("/message", messageController);
app.use("/user", userController);

app.all("{/*dummy}", (req, res) =>
  res.status(404).json({ message: "Invalid application routing" }),
);

app.use(globalErrorHandling);
