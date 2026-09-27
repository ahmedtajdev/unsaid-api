import crypto from "node:crypto";
import { ENC_KEY, IV_LENGTH } from "../../config.js";

export const encrypt = async (plainText) => {
  const algorithm = "aes-256-cbc";

  const iv = crypto.randomBytes(IV_LENGTH);

  const cipheriv = crypto.createCipheriv(algorithm, ENC_KEY, iv);

  let encrypted = cipheriv.update(plainText, "utf-8", "hex");

  encrypted += cipheriv.final("hex");

  return `${iv.toString("hex")}::${encrypted}`;
};

export const decrypt = async (cipherText) => {
  const [hexIV, encrypted] = cipherText.split("::");

  const algorithm = "aes-256-cbc";

  const iv = Buffer.from(hexIV, "hex");

  const decipheriv = crypto.createDecipheriv(algorithm, ENC_KEY, iv);

  let decrypted = decipheriv.update(encrypted, "hex", "utf-8");

  decrypted += decipheriv.final("utf-8");

  return decrypted;
};
