import { ConflictException } from "../../common/exceptions/index.js";
import { findById, findByIdAndUpdate } from "../../common/repository/index.js";
import { createLoginCredentials } from "../../common/security/index.js";
import { ACCESS_TOKEN_EXPIRES_IN } from "../../config.js";
import { UserModel } from "../../DB/models/index.js";

export const getProfile = async (userId) => {
  const user = await findById({
    model: UserModel,
    id: userId,
    options: { select: "-password" },
  });
  return user;
};

export const updateProfile = async (userId, update) => {
  const updatedUser = await findByIdAndUpdate({
    model: UserModel,
    id: userId,
    update,
    options: { select: "-password" },
  });
  return updatedUser;
};

export const rotateToken = async (payload) => {
  const accessExpiresIn = (payload.iat + ACCESS_TOKEN_EXPIRES_IN) * 1000;
  const currentTime = Date.now();

  if (currentTime < accessExpiresIn) {
    throw ConflictException(
      "Sorry we cannot create new login credentials while current access token still within valid time",
    );
  }

  return await createLoginCredentials({ user: payload });
};
