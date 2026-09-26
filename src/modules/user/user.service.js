import { ConflictException } from "../../common/exceptions/index.js";
import { findByIdAndUpdate } from "../../common/repository/index.js";
import { createLoginCredentials } from "../../common/security/index.js";
import { ACCESS_TOKEN_EXPIRES_IN } from "../../config.js";
import { UserModel } from "../../DB/models/index.js";

export const getProfile = async (user) => {
  return user;
};

export const updateProfile = async (user, update) => {
  const updatedUser = await findByIdAndUpdate({
    model: UserModel,
    id: user._id,
    update,
    options: { select: "-password" },
  });
  return updatedUser;
};

export const rotateToken = async ({ payload, user, issuer } = {}) => {
  const accessExpiresIn = (payload.iat + ACCESS_TOKEN_EXPIRES_IN) * 1000;
  const currentTime = Date.now();

  if (currentTime < accessExpiresIn) {
    throw ConflictException(
      "Sorry we cannot create new login credentials while current access token still within valid time",
    );
  }

  return await createLoginCredentials({ user, issuer });
};
