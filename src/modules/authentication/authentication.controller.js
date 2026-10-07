import { Router } from "express";
import { successResponse } from "../../common/utils/index.js";
import {
  confirmEmail,
  forgotPassword,
  login,
  resendEmailOtp,
  resetForgotPassword,
  signup,
  signupWithGmail,
  verifyForgotPasswordCode,
} from "./authentication.service.js";
import * as validators from "./authentication.validation.js";
import { validation } from "../../middleware/index.js";

const router = Router();

router.post("/signup-with-gmail", async (req, res) => {
  const { status, data } = await signupWithGmail(req.body);
  return successResponse({ res, status, data });
});

router.post("/signup", validation(validators.signup), async (req, res) => {
  const data = await signup(req.validate.body);
  return successResponse({ res, status: 201, data });
});

router.post(
  "/confirm-email",
  validation(validators.confirmEmail),
  async (req, res) => {
    await confirmEmail(req.validate.body);
    return successResponse({ res });
  },
);

router.post(
  "/forgot-password",
  validation(validators.forgotPassword),
  async (req, res) => {
    const data = await forgotPassword(req.validate.body);
    return successResponse({ res, status: 201, data });
  },
);

router.post(
  "/verify-forgot-password",
  validation(validators.confirmEmail),
  async (req, res) => {
    const data = await verifyForgotPasswordCode(req.validate.body);
    return successResponse({ res, data });
  },
);

router.patch(
  "/reset-forgot-password",
  validation(validators.resetForgotPassword),
  async (req, res) => {
    const data = await resetForgotPassword(req.validate.body);
    return successResponse({ res, data });
  },
);

router.post(
  "/resend-email-otp",
  validation(validators.resendEmailOtp),
  async (req, res) => {
    await resendEmailOtp(req.validate.body);
    return successResponse({ res });
  },
);

router.post("/login", validation(validators.login), async (req, res) => {
  const data = await login(req.validate.body, {
    issuer: `${req.protocol}://${req.host}`,
  });
  return successResponse({ res, data });
});

export default router;
