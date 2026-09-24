import jwt from "jsonwebtoken";
import {
  ACCESS_ADMIN_TOKEN_SIGNATURE,
  ACCESS_TOKEN_EXPIRES_IN,
  ACCESS_USER_TOKEN_SIGNATURE,
  REFRESH_ADMIN_TOKEN_SIGNATURE,
  REFRESH_TOKEN_EXPIRES_IN,
  REFRESH_USER_TOKEN_SIGNATURE,
} from "../../config.js";
import {
  BadRequestException,
  NotfoundException,
  UnauthorizedException,
} from "../exceptions/index.js";
import { RoleEnum, tokenTypeEnum } from "../enum/index.js";
import { findById } from "../repository/index.js";
import { UserModel } from "../../DB/models/user.model.js";

const getTokenSignatures = ({ role = RoleEnum.USER }) => {
  switch (role) {
    case RoleEnum.ADMIN:
      return {
        access_signature: ACCESS_ADMIN_TOKEN_SIGNATURE,
        refresh_signature: REFRESH_ADMIN_TOKEN_SIGNATURE,
      };
    case RoleEnum.USER:
      return {
        access_signature: ACCESS_USER_TOKEN_SIGNATURE,
        refresh_signature: REFRESH_USER_TOKEN_SIGNATURE,
      };

    default:
      throw BadRequestException("Invlaid user role");
  }
};

const getSignature = ({
  tokenType = tokenTypeEnum.ACCESS,
  role = RoleEnum.USER,
} = {}) => {
  const signatures = getTokenSignatures({ role });

  switch (tokenType) {
    case tokenTypeEnum.ACCESS:
      return signatures.access_signature;

    case tokenTypeEnum.REFRESH:
      return signatures.refresh_signature;

    default:
      throw BadRequestException("Invalid token type");
  }
};

export const generateToken = ({
  payload = {},
  options = {},
  secretKey = ACCESS_USER_TOKEN_SIGNATURE,
} = {}) => {
  return jwt.sign(payload, secretKey, options);
};

export const verifyToken = ({
  token = "",
  secretKey = ACCESS_USER_TOKEN_SIGNATURE,
} = {}) => {
  try {
    return jwt.verify(token, secretKey, {
      issuer: "my-api",
      audience: "my-client",
    });
  } catch (error) {
    throw UnauthorizedException("Invalid or expired token");
  }
};

export const decodeToken = async ({
  token = "",
  tokenType = tokenTypeEnum.ACCESS,
  role = RoleEnum.USER,
} = {}) => {
  const secretKey = getSignature({
    tokenType,
    role,
  });

  const payload = verifyToken({
    token,
    secretKey,
  });

  if (!payload?.sub) {
    throw BadRequestException("Missing token payload");
  }

  const user = await findById({
    model: UserModel,
    id: payload.sub,
  });

  if (!user) {
    throw NotfoundException("Invlaid user");
  }

  return { payload, user };
};

export const createLoginCredentials = async ({ user, options = {} }) => {
  const { access_signature, refresh_signature } = getTokenSignatures({
    role: user.role,
  });

  const access_token = generateToken({
    payload: { sub: user._id, role: user.role },
    secretKey: access_signature,
    options: {
      ...options,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      issuer: "my-api",
      audience: "my-client",
    },
  });

  const refresh_token = generateToken({
    payload: { sub: user._id, role: user.role },
    secretKey: refresh_signature,
    options: {
      ...options,
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      issuer: "my-api",
      audience: "my-client",
    },
  });

  return { access_token, refresh_token };
};
