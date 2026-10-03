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
import { randomUUID } from "node:crypto";
import { exists, set } from "../services/index.js";

export const userBaseKey = ({ userId }) => {
  return `User::${userId.toString()}`;
};

export const userBaseRevokeTokenKey = ({ userId }) => {
  return `${userBaseKey({ userId })}::Revoke_Token`;
};

export const userRevokeTokenKey = ({ userId, jti }) => {
  return `${userBaseRevokeTokenKey({ userId })}::${jti}`;
};

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

  if (
    await exists({
      key: userRevokeTokenKey({
        userId: payload.sub,
        jti: payload.jti,
      }),
    })
  ) {
    throw UnauthorizedException("Expired login credentials");
  }

  const user = await findById({
    model: UserModel,
    id: payload.sub,
  });

  if (!user) {
    throw NotfoundException("Invalid user");
  }

  if ((user.changeCredentialsTime?.getTime() ?? 0) > payload.iat * 1000) {
    throw UnauthorizedException("Expired login credentials");
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
  const jti = randomUUID();

  const access_token = generateToken({
    payload: { sub: user._id, role: user.role },
    secretKey: access_signature,
    options: {
      ...options,
      expiresIn: ACCESS_TOKEN_EXPIRES_IN,
      issuer,
      audience: [user.role],
      jti,
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
      jti,
    },
  });

  return { access_token, refresh_token };
};

export const createRevokeToken = async ({ payload }) => {
  const consumedTime = Math.ceil(Date.now() / 1000) - payload.iat;
  const refreshExpiresIn = payload.iat + REFRESH_TOKEN_EXPIRES_IN;
  const ttl = refreshExpiresIn - consumedTime;

  // SET IN REDIS
  await set({
    key: userRevokeTokenKey({
      userId: payload.sub,
      jti: payload.jti,
    }),
    value: payload.jti,
    ttl,
  });

  return;
};
