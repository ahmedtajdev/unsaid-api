import { tokenTypeEnum } from "../common/enum/index.js";
import {
  BadRequestException,
  UnauthorizedException,
} from "../common/exceptions/index.js";
import { decodeToken } from "../common/security/index.js";

export const authentication = ({ tokenType = tokenTypeEnum.ACCESS } = {}) => {
  return async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
      throw UnauthorizedException("Unauthorized user");
    }

    req.payload = await decodeToken({
      token: authorization,
      tokenType,
    });

    next();
  };
};
