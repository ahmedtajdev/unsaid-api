import { Router } from "express";
import {
  enableTwoStepVerification,
  getProfile,
  logout,
  rotateToken,
  updateProfile,
  verifyEnableTwoStepVerificationCode,
} from "./user.service.js";
import { successResponse } from "../../common/utils/index.js";
import { authentication, validation } from "../../middleware/index.js";
import { TokenTypeEnum } from "../../common/enum/security.enum.js";
import * as validators from "../authentication/index.js";

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
  "/enable-two-step-verification",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  async (req, res) => {
    const data = await enableTwoStepVerification(req.user);
    return successResponse({ res, data });
  },
);

router.post(
  "/verify-enable-two-step-verification-code",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  validation(validators.otp),
  async (req, res) => {
    const data = await verifyEnableTwoStepVerificationCode(
      req.user,
      req.validate.body,
    );
    return successResponse({ res, data });
  },
);

router.post(
  "/verify-forgot-password",
  validation(validators.confirmEmail),
  async (req, res) => {
    const data = await validators.verifyForgotPasswordCode(req.validate.body);
    return successResponse({ res, data });
  },
);

router.post(
  "/logout",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  async (req, res) => {
    await logout({
      payload: req.payload,
      user: req.user,
      action: req.body.action,
    });
    return successResponse({ res });
  },
);

export default router;
