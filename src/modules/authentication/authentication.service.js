import { UserModel } from "../../DB/models/index.js";
import {
  BadRequestException,
  ConflictException,
  NotfoundException,
} from "../../common/exceptions/index.js";
import { createOne, findOne } from "../../common/repository/index.js";
import {
  compare,
  createLoginCredentials,
  decrypt,
  encrypt,
  hash,
} from "../../common/security/index.js";
import { OAuth2Client } from "google-auth-library";
import { WEB_CLIENT_IDS } from "../../config.js";
import { ProviderEnum } from "../../common/enum/user.enum.js";

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

export const signup = async ({ username, email, password, phone }) => {
  try {
    const duplicatedUser = await findOne({
      model: UserModel,
      filter: { email },
      options: { select: "email" },
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

    return user;
  } catch (error) {
    console.log({ error });
    throw error;
  }
};

export const login = async ({ email, password }, issuer) => {
  try {
    const user = await findOne({
      model: UserModel,
      filter: { email, provider: ProviderEnum.SYSTEM },
    });

    if (!user) {
      throw NotfoundException("Not Exist");
    }

    const match = await compare(password, user.password);

    if (!match) {
      throw NotfoundException("Not Exist");
    }

    return await createLoginCredentials({ user, issuer });
  } catch (error) {
    console.log({ error });
    throw error;
  }
};
