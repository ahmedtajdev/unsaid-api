import bcrypt from "bcrypt";

export const hashPassword = async (plainText, rounds = 12, minor = "b") => {
  const salt = bcrypt.genSalt(rounds, minor);
  return await bcrypt.hash(plainText, salt);
};

export const comparePassword = async (plainText, cipherText) => {
  return await bcrypt.compare(plainText, cipherText);
};
