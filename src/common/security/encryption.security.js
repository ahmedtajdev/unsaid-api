import crypto from "node:crypto";

const ALGORITHM = "aes-256-cbc";
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

const SECRET_KEY = crypto.randomBytes(KEY_LENGTH);

export const encrypt = async (plainText) => {
  const iv = crypto.randomBytes(IV_LENGTH);
};
