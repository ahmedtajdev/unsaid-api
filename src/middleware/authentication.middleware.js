import { TokenTypeEnum } from "../common/enum/index.js";
import { UnauthorizedException } from "../common/exceptions/index.js";
import { decodeToken } from "../common/security/index.js";

export const authentication = ({ tokenType = TokenTypeEnum.ACCESS } = {}) => {
  return async (req, res, next) => {
    const { authorization } = req.headers;

    if (!authorization) {
      throw UnauthorizedException("Unauthorized user");
    }

    const { payload, user } = await decodeToken({
      token: authorization,
      tokenType,
    });

    req.payload = payload;
    req.user = user;

    next();
  };
};
