import crypto from "node:crypto";
import { ENC_ALG, ENC_KEY, IV_LENGTH } from "../../config.js";

export const encrypt = async (plainText) => {
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipheriv = crypto.createCipheriv(ENC_ALG, ENC_KEY, iv);

  let encrypted = cipheriv.update(plainText, "utf-8", "hex");

  encrypted += cipheriv.final("hex");

  return `${iv.toString("hex")}::${encrypted}`;
};

export const decrypt = async (cipherText) => {
  const [hexIV, encrypted] = cipherText.split("::");

  const iv = Buffer.from(hexIV, "hex");

  const decipheriv = crypto.createDecipheriv(ENC_ALG, ENC_KEY, iv);

  let decrypted = decipheriv.update(encrypted, "hex", "utf-8");

  decrypted += decipheriv.final("utf-8");

  return decrypted;
};
