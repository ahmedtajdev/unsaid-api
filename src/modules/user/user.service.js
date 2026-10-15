import { EmailSubjectEnum, EmailTitleEnum } from "../../common/enum/index.js";
import { LogoutEnum } from "../../common/enum/index.js";
import {
  BadRequestException,
  ConflictException,
  UnauthorizedException,
} from "../../common/exceptions/index.js";
import {
  compare,
  createLoginCredentials,
  createRevokeToken,
  decrypt,
  encrypt,
  hash,
  userBaseRevokeTokenKey,
} from "../../common/security/index.js";
import { del, get, keys } from "../../common/services/index.js";
import { userEmailKey } from "../../common/utils/index.js";
import { ACCESS_TOKEN_EXPIRES_IN } from "../../config.js";
import { sendEmailOtp } from "../authentication/index.js";

export const getProfile = async (user) => {
  const phone = user.phone ? await decrypt(user.phone) : undefined;
  return {
    ...user.toObject(),
    phone,
  };
};

export const updateProfile = async (user, updates) => {
  for (const update of Object.keys(updates)) {
    if (update === "phone") {
      user[update] = await encrypt(updates[update]);
    } else {
      user[update] = updates[update];
    }
  }

  await user.save();

  return await getProfile(user);
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

export const enableTwoStepVerification = async (user) => {
  try {
    if (user.isTwoStepVerificationEnabled) {
      throw ConflictException("Two Step Verification already enabled");
    }

    await sendEmailOtp({
      email: user.email,
      subject: EmailSubjectEnum.ENABLE_TWO_STEP_VERIFICATION,
      title: EmailTitleEnum.ENABLE_TWO_STEP_VERIFICATION,
    });

    return "OTP sent to your email, please check your email and verify the OTP to enable Two Step Verification";
  } catch (error) {
    throw error;
  }
};

export const verifyEnableTwoStepVerificationCode = async (user, body) => {
  try {
    const { otp } = body;
    const hashOtp = await get({
      key: userEmailKey({
        email: user.email,
        subject: EmailSubjectEnum.ENABLE_TWO_STEP_VERIFICATION,
      }),
    });

    if (!hashOtp || !(await compare(otp, hashOtp))) {
      throw ConflictException("Invalid OTP");
    }

    user.isTwoStepVerificationEnabled = true;
    await user.save();

    await del({
      key: await keys({
        prefix: userEmailKey({
          email: user.email,
          subject: EmailSubjectEnum.ENABLE_TWO_STEP_VERIFICATION,
        }),
      }),
    });

    return "Two Step Verification enabled successfully";
  } catch (error) {
    throw error;
  }
};

export const updatePassword = async (user, payload, body) => {
  try {
    const { currentPassword, newPassword } = body;

    const isCurrentPasswordCorrect = await compare(
      currentPassword,
      user.password,
    );

    if (!isCurrentPasswordCorrect) {
      throw UnauthorizedException("Unauthorized user");
    }

    user.password = await hash(newPassword);
    await logout({ payload, user, action: LogoutEnum.ALL });

    return "Password updated successfully";
  } catch (error) {
    throw error;
  }
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
      return "Logout from all devices successfully";

    case LogoutEnum.DEVICE:
      await createRevokeToken({ payload });
      return "Logout from current device successfully";
    default:
      throw BadRequestException("Invalid action");
  }
};
