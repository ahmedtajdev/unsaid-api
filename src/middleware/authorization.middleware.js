import { RoleEnum } from "../common/enum/index.js";
import { ForbiddenException } from "../common/exceptions/index.js";

export const authorization = ({ accessRole = RoleEnum.USER } = {}) => {
  return async (req, res, next) => {
    if (req.user.role < accessRole) {
      throw ForbiddenException("Forbidden account");
    }
    next();
  };
};
