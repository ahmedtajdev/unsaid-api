import { resolve } from "node:path";
import { config } from "dotenv";
config({ path: resolve(`.env.${process.env.NODE_ENV ?? "development"}`) });

export const PORT = parseInt(process.env.PORT ?? "9000");
export const DB_URI = process.env.DB_URI;
export const DB_NAME = process.env.DB_NAME;
