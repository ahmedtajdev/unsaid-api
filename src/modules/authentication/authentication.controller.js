import { Router } from "express";
import { successResponse } from "../../common/utils/index.js";
import {
  confirmEmail,
  forgotPassword,
  login,
  loginConfirmation,
  resendEmailOtp,
  resetForgotPassword,
  signup,
  signupWithGmail,
  verifyForgotPasswordCode,
} from "./authentication.service.js";
import * as validators from "./authentication.validation.js";
import { validation } from "../../middleware/index.js";

const router = Router({
  strict: true,
  caseSensitive: true,
  mergeParams: true,
});

router.post("/signup-with-gmail", async (req, res) => {
  const { status, data } = await signupWithGmail(req.body);
  return successResponse({ res, status, data });
});

router.post("/signup", validation(validators.signup), async (req, res) => {
  const message = await signup(req.validated.body);
  return successResponse({ res, status: 201, message });
});

router.post(
  "/resend-email-otp",
  validation(validators.resendEmailOtp),
  async (req, res) => {
    const message = await resendEmailOtp(req.validated.body);
    return successResponse({ res, message });
  },
);

router.post(
  "/confirm-email",
  validation(validators.confirmEmail),
  async (req, res) => {
    const message = await confirmEmail(req.validated.body);
    return successResponse({ res, message });
  },
);

router.post(
  "/forgot-password",
  validation(validators.forgotPassword),
  async (req, res) => {
    const message = await forgotPassword(req.validated.body);
    return successResponse({ res, status: 201, message });
  },
);

router.post(
  "/verify-forgot-password",
  validation(validators.confirmEmail),
  async (req, res) => {
    const message = await verifyForgotPasswordCode(req.validated.body);
    return successResponse({ res, message });
  },
);

router.patch(
  "/reset-forgot-password",
  validation(validators.resetForgotPassword),
  async (req, res) => {
    const message = await resetForgotPassword(req.validated.body);
    return successResponse({ res, message });
  },
);

router.post("/login", validation(validators.login), async (req, res) => {
  const data = await login(req.validated.body, {
    issuer: `${req.protocol}://${req.host}`,
  });
  return successResponse({ res, data });
});

router.post(
  "/login-confirmation",
  validation(validators.confirmEmail),
  async (req, res) => {
    const data = await loginConfirmation(req.validated.body, {
      issuer: `${req.protocol}://${req.host}`,
    });
    return successResponse({ res, data });
  },
);

export default router;
