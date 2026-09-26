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
import { RoleEnum, TokenTypeEnum } from "../enum/index.js";
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
      throw BadRequestException("Invalid role");
  }
};

const getSignature = ({
  tokenType = TokenTypeEnum.ACCESS,
  role = RoleEnum.USER,
} = {}) => {
  const signatures = getTokenSignatures({ role });

  switch (tokenType) {
    case TokenTypeEnum.ACCESS:
      return signatures.access_signature;

    case TokenTypeEnum.REFRESH:
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
      issuer: "http://localhost:3000",
      audience: [RoleEnum.USER, RoleEnum.ADMIN],
    });
  } catch (error) {
    throw UnauthorizedException("Invalid or expired token");
  }
};

export const decodeToken = async ({
  token = "",
  tokenType = TokenTypeEnum.ACCESS,
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
    throw NotfoundException("Invalid user");
  }

  return { payload, user };
};

export const createLoginCredentials = async ({
  user,
  issuer,
  options = {},
}) => {
  const { access_signature, refresh_signature } = getTokenSignatures({
    role: user.role,
  });

  const access_token = generateToken({
    payload: { sub: user._id, role: user.role },
    secretKey: access_signature,
    options: {
      ...options,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      issuer,
      audience: [user.role],
    },
  });

  const refresh_token = generateToken({
    payload: { sub: user._id, role: user.role },
    secretKey: refresh_signature,
    options: {
      ...options,
      expiresIn: REFRESH_TOKEN_EXPIRES_IN,
      issuer,
      audience: [user.role],
    },
  });

  return { access_token, refresh_token };
};
