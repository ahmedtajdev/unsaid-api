import mongoose from "mongoose";
import { DB_URI } from "../config.js";
import { UserModel } from "./models/index.js";

// DB CONNECTION
export const bootstrapDB = async (app, port) => {
  try {
    await mongoose.connect(DB_URI);
    await UserModel.syncIndexes();
    console.log(`DB connected successfully`);
    app.listen(port, () => console.log(`App is running on port ${port}`));
  } catch (error) {
    console.log(error);

    console.log(`Fail to connect on DB`);
  }
};
