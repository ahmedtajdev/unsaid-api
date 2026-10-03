import { LogoutEnum } from "../../common/enum/security.enum.js";
import {
  BadRequestException,
  ConflictException,
} from "../../common/exceptions/index.js";
import { findByIdAndUpdate } from "../../common/repository/index.js";
import {
  createLoginCredentials,
  createRevokeToken,
  decrypt,
  userBaseRevokeTokenKey,
} from "../../common/security/index.js";
import { del, keys } from "../../common/services/index.js";
import { ACCESS_TOKEN_EXPIRES_IN } from "../../config.js";
import { UserModel } from "../../DB/models/index.js";

export const getProfile = async (user) => {
  const profile = user.toObject();

  profile.phone = await decrypt(profile.phone);

  return profile;
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

  const data = await createLoginCredentials({ user, issuer });
  await createRevokeToken({ payload });
  return data;
};

export const logout = async ({
  payload,
  user,
  action = LogoutEnum.DEVICE,
} = {}) => {
  switch (action) {
    case LogoutEnum.ALL:
      user.changeCredentialsTime = new Date();
      await user.save();
      await del({
        key: await keys({
          prefix: userBaseRevokeTokenKey({ userId: payload.sub }),
        }),
      });
      break;

    case LogoutEnum.DEVICE:
      return createRevokeToken({ payload });
    default:
      throw BadRequestException("Invalid action");
  }
};
