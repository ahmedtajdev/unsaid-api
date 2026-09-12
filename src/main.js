import express from "express";
import { authenticationController } from "./modules/index.js";
import { globalErrorHandling } from "./middleware/index.js";
import { PORT } from "./config.js";

const app = express();

app.use(express.json());

app.all("/", (req, res) => res.status(200).json({ message: "Welcome" }));

app.use("/auth", authenticationController);

app.all("{/*dummy}", (req, res) =>
  res.status(404).json({ message: "Invalid application routing" }),
);

app.use(globalErrorHandling);

app.listen(PORT, () => console.log(`App is running on port ${PORT}`));
