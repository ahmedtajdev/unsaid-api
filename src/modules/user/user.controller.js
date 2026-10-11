import { Router } from "express";
import {
  enableTwoStepVerification,
  getProfile,
  logout,
  rotateToken,
  updatePassword,
  updateProfile,
  verifyEnableTwoStepVerificationCode,
} from "./user.service.js";
import {
  fileValidation,
  localFileUpload,
  successResponse,
} from "../../common/utils/index.js";
import {
  authentication,
  fileUploadMiddleware,
  validation,
} from "../../middleware/index.js";
import { TokenTypeEnum } from "../../common/enum/security.enum.js";
import * as validators from "../authentication/index.js";

const router = Router({
  strict: true,
  caseSensitive: true,
  mergeParams: true,
});

router.patch(
  "/profile-image",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  fileUploadMiddleware({
    multerMiddleware: localFileUpload({
      maxFileSizeMB: 5,
    }).single("attachment"),
    customPath: "users/profile",
    validation: fileValidation.image,
  }),
  async (req, res) => {
    req.user.image = req.file.path;
    await req.user.save();
    return successResponse({ res, data: { user: req.user } });
  },
);

router.patch(
  "/update-password",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  validation(validators.updatePassword),
  async (req, res) => {
    const message = await updatePassword(
      req.user,
      req.payload,
      req.validated.body,
    );
    return successResponse({ res, message });
  },
);

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
  validation(validators.updateProfile),
  async (req, res) => {
    const data = await updateProfile(req.user, req.validated.body);
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
    const message = await enableTwoStepVerification(req.user);
    return successResponse({ res, message });
  },
);

router.post(
  "/verify-enable-two-step-verification-code",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  validation(validators.otp),
  async (req, res) => {
    const message = await verifyEnableTwoStepVerificationCode(
      req.user,
      req.validated.body,
    );
    return successResponse({ res, message });
  },
);

router.post(
  "/logout",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  async (req, res) => {
    const message = await logout({
      payload: req.payload,
      user: req.user,
      action: req.body.action,
    });
    return successResponse({ res, message });
  },
);

export default router;
