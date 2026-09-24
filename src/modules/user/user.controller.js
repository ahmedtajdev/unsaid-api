import { Router } from "express";
import { getProfile, rotateToken, updateProfile } from "./user.service.js";
import { successResponse } from "../../common/utils/index.js";
import { authentication } from "../../middleware/index.js";
import { tokenTypeEnum } from "../../common/enum/security.enum.js";
import { authorization } from "../../middleware/authorization.middleware.js";
import { RoleEnum } from "../../common/enum/user.enum.js";

const router = Router();

router.get(
  "/",
  authentication({ tokenType: tokenTypeEnum.ACCESS }),
  async (req, res) => {
    const data = await getProfile(req.payload.sub);
    return successResponse({ res, data });
  },
);

router.patch(
  "/",
  authentication({ tokenType: tokenTypeEnum.ACCESS }),
  authorization({ accessRole: RoleEnum.ADMIN }),
  async (req, res) => {
    const data = await updateProfile(req.payload.sub, req.body);
    return successResponse({ res, data });
  },
);

router.post(
  "/rotate-token",
  authentication({ tokenType: tokenTypeEnum.REFRESH }),
  async (req, res) => {
    const data = await rotateToken(req.payload);
    return successResponse({ res, data });
  },
);

export default router;
