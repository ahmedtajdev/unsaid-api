import { Router } from "express";
import {
  getProfile,
  logout,
  rotateToken,
  updateProfile,
} from "./user.service.js";
import { successResponse } from "../../common/utils/index.js";
import { authentication } from "../../middleware/index.js";
import { LogoutEnum, TokenTypeEnum } from "../../common/enum/security.enum.js";
import { authorization } from "../../middleware/authorization.middleware.js";
import { RoleEnum } from "../../common/enum/user.enum.js";

const router = Router();

router.get(
  "/",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  async (req, res) => {
    const data = await getProfile(req.user);
    return successResponse({ res, data });
  },
);

router.patch(
  "/",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  authorization({ accessRole: RoleEnum.ADMIN }),
  async (req, res) => {
    const data = await updateProfile(req.user, req.body);
    return successResponse({ res, data });
  },
);

router.post(
  "/rotate-token",
  authentication({ tokenType: TokenTypeEnum.REFRESH }),
  async (req, res) => {
    const data = await rotateToken({
      payload: req.payload,
      user: req.user,
      issuer: `${req.protocol}://${req.host}`,
    });
    return successResponse({ res, data });
  },
);

router.post(
  "/logout",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  async (req, res) => {
    const data = await logout({
      payload: req.payload,
      user: req.user,
      action: req.body.action,
    });
    return successResponse({ res, data });
  },
);

export default router;
