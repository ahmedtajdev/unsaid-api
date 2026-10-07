import { UserModel } from "../../DB/models/index.js";
import {
  BadRequestException,
  ConflictException,
  NotfoundException,
  TooManyRequestsException,
} from "../../common/exceptions/index.js";
import { createOne, findOne } from "../../common/repository/index.js";
import {
  compare,
  createLoginCredentials,
  encrypt,
  hash,
  userBaseRevokeTokenKey,
} from "../../common/security/index.js";
import { OAuth2Client } from "google-auth-library";
import { WEB_CLIENT_IDS } from "../../config.js";
import { ProviderEnum } from "../../common/enum/user.enum.js";
import {
  createOtp,
  emailEvent,
  userEmailKey,
  userEmailTrialsKey,
} from "../../common/utils/index.js";
import { EmailSubjectEnum, EmailTitleEnum } from "../../common/enum/index.js";
import {
  del,
  expire,
  get,
  incBy,
  keys,
  set,
  ttl,
} from "../../common/services/index.js";

const client = new OAuth2Client();

async function verifyGoogleAccount(idToken) {
  const ticket = await client.verifyIdToken({
    idToken,
    audience: WEB_CLIENT_IDS,
  });
  const payload = ticket.getPayload();

  console.log({ payload });

  if (!payload.email_verified) {
    throw BadRequestException("Email not verified");
  }

  return payload;
}

export const signupWithGmail = async ({ idToken }) => {
  try {
    console.log({ idToken });
    const { name, email, picture } = await verifyGoogleAccount(idToken);

    const existAccount = await findOne({
      model: UserModel,
      filter: { email },
    });

    if (existAccount) {
      if (existAccount.provider !== ProviderEnum.GOOGLE) {
        throw ConflictException("Invalid account provider");
      }

      return {
        status: 200,
        data: await createLoginCredentials({ user: existAccount }),
      };
    }

    const user = await createOne({
      model: UserModel,
      data: {
        username: name,
        email,
        confirmEmail: new Date(),
        provider: ProviderEnum.GOOGLE,
        image: picture,
      },
    });

    return {
      status: 201,
      data: await createLoginCredentials({ user }),
    };
  } catch (error) {
    console.log({ error });
    throw error;
  }
};

const sendEmailOtp = async ({
  email,
  subject,
  title,
  expiresIn = 120,
  maxTrials = 3,
  blockInSeconds = 300,
}) => {
  const existOtp_TTL = await ttl({ key: userEmailKey({ email, subject }) });

  if (existOtp_TTL > 0) {
    throw ConflictException(
      `Sorry we cannot create new OTP while existin one still valid. Please try again later after ${existOtp_TTL}s`,
    );
  }

  const oldTrials =
    (await get({ key: userEmailTrialsKey({ email, subject }) })) ?? 0;

  if (oldTrials >= maxTrials) {
    throw TooManyRequestsException("Max OTP trials have been reached");
  }

  const code = createOtp();

  await set({
    key: userEmailKey({ email, subject }),
    value: await hash(code.toString()),
    ttl: expiresIn,
  });

  const currentTrials = await incBy({
    key: userEmailTrialsKey({ email, subject }),
  });

  if (currentTrials === maxTrials) {
    await expire({
      key: userEmailTrialsKey({ email, subject }),
      ttl: blockInSeconds,
    });
  }

  emailEvent.emit("sendEmail", {
    recipients: { to: email },
    subject,
    data: { code, title: title ?? subject },
  });

  return;
};

export const signup = async ({ username, email, password, phone }) => {
  try {
    const duplicatedUser = await findOne({
      model: UserModel,
      filter: { email },
    });

    if (duplicatedUser) {
      throw ConflictException("Email already Exists");
    }

    const user = await createOne({
      model: UserModel,
      data: {
        username,
        email,
        password: await hash(password),
        phone: phone ? await encrypt(phone) : undefined,
      },
    });

    await sendEmailOtp({
      email,
      subject: EmailSubjectEnum.CONFIRM_EMAIL,
      title: EmailTitleEnum.CONFIRM_EMAIL,
    });

    return user;
  } catch (error) {
    console.log({ error });
    throw error;
  }
};

export const resendEmailOtp = async ({ email }) => {
  try {
    const user = await findOne({
      model: UserModel,
      filter: {
        email,
        provider: ProviderEnum.SYSTEM,
        confirmEmail: { $exists: false },
      },
    });

    if (!user) {
      throw NotfoundException("Invalid account");
    }

    await sendEmailOtp({
      email,
      subject: EmailSubjectEnum.CONFIRM_EMAIL,
      title: EmailTitleEnum.CONFIRM_EMAIL,
    });

    return;
  } catch (error) {
    console.log({ error });
    throw error;
  }
};

export const forgotPassword = async ({ email }) => {
  try {
    const user = await findOne({
      model: UserModel,
      filter: {
        email,
        provider: ProviderEnum.SYSTEM,
        confirmEmail: { $exists: true },
      },
    });

    if (!user) {
      throw NotfoundException("Invalid account");
    }

    await sendEmailOtp({
      email,
      subject: EmailSubjectEnum.FORGOT_PASSWORD,
      title: EmailTitleEnum.FORGOT_PASSWORD,
    });
    return;
  } catch (error) {
    console.log({ error });
    throw error;
  }
};

export const confirmEmail = async ({ otp, email }) => {
  try {
    const user = await findOne({
      model: UserModel,
      filter: {
        email,
        provider: ProviderEnum.SYSTEM,
        confirmEmail: { $exists: false },
      },
    });

    if (!user) {
      throw NotfoundException("Invalid account");
    }

    const hashOtp = await get({
      key: userEmailKey({ email, subject: EmailSubjectEnum.CONFIRM_EMAIL }),
    });

    if (!hashOtp || !(await compare(otp, hashOtp))) {
      throw ConflictException("Invalid OTP");
    }

    user.confirmEmail = new Date();
    await user.save();
    await del({
      key: await keys({
        prefix: userEmailKey({
          email,
          subject: EmailSubjectEnum.CONFIRM_EMAIL,
        }),
      }),
    });
    return;
  } catch (error) {
    console.log({ error });
    throw error;
  }
};

export const verifyForgotPasswordCode = async ({ otp, email }) => {
  try {
    const user = await findOne({
      model: UserModel,
      filter: {
        email,
        provider: ProviderEnum.SYSTEM,
        confirmEmail: { $exists: true },
      },
    });

    if (!user) {
      throw NotfoundException("Invalid account");
    }

    const hashOtp = await get({
      key: userEmailKey({ email, subject: EmailSubjectEnum.FORGOT_PASSWORD }),
    });

    if (!hashOtp || !(await compare(otp, hashOtp))) {
      throw ConflictException("Invalid OTP");
    }

    return user;
  } catch (error) {
    console.log({ error });
    throw error;
  }
};

export const resetForgotPassword = async ({ otp, email, password }) => {
  const user = await verifyForgotPasswordCode({ otp, email });
  user.password = await hash(password);
  user.changeCredentialsTime = new Date();
  await user.save();

  const result = await Promise.all([
    keys({
      prefix: userBaseRevokeTokenKey({ userId: user._id }),
    }),
    keys({
      prefix: userEmailKey({
        email,
        subject: EmailSubjectEnum.FORGOT_PASSWORD,
      }),
    }),
  ]);

  await del({ key: [...result[0], ...result[1]] });

  return;
};

export const userLoginTrialsKey = ({ email }) => {
  return `User::${email.trim().toLowerCase()}::Login_Trials`;
};

export const login = async (
  { email, password },
  { issuer, maxTrials = 5, blockInSeconds = 300 },
) => {
  try {
    const user = await findOne({
      model: UserModel,
      filter: {
        email,
        provider: ProviderEnum.SYSTEM,
        confirmEmail: { $exists: true },
      },
    });

    if (!user) {
      throw NotfoundException("Invalid email or password");
    }

    const oldTrials =
      (await get({
        key: userLoginTrialsKey({ email }),
      })) ?? 0;

    if (oldTrials >= maxTrials) {
      throw TooManyRequestsException(
        `Max login trials have been reached, please try again after ${await ttl({ key: userLoginTrialsKey({ email }) })}s`,
      );
    }

    const match = await compare(password, user.password);

    if (!match) {
      const currentTrials = await incBy({ key: userLoginTrialsKey({ email }) });

      if (currentTrials === maxTrials) {
        await expire({
          key: userLoginTrialsKey({ email }),
          ttl: blockInSeconds,
        });
      }

      throw NotfoundException("Invalid email or password");
    }

    await del({ key: userLoginTrialsKey({ email }) });

    return await createLoginCredentials({ user, issuer });
  } catch (error) {
    console.log({ error });
    throw error;
  }
};
