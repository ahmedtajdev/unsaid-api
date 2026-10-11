import { TokenTypeEnum } from "../common/enum/index.js";
import { UnauthorizedException } from "../common/exceptions/index.js";
import { decodeToken } from "../common/security/index.js";

export const tokenAuth = async ({ req, tokenType = TokenTypeEnum.ACCESS }) => {
  const { payload, user } = await decodeToken({
    token: req.headers.authorization,
    tokenType,
  });

  req.payload = payload;
  req.user = user;
};

export const authentication = ({ tokenType = TokenTypeEnum.ACCESS } = {}) => {
  return async (req, res, next) => {
    if (!req.headers.authorization) {
      throw UnauthorizedException("Unauthorized user");
    }

    await tokenAuth({ req, tokenType });

    next();
  };
};
