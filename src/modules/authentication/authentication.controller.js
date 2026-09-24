import { Router } from "express";
import { successResponse } from "../../common/utils/index.js";
import { login, signup, signupWithGmail } from "./authentication.service.js";
import * as validators from "./authentication.validation.js";
import { BadRequestException } from "../../common/exceptions/error.exception.js";
import { validation } from "../../middleware/index.js";
const router = Router();

router.post("/signup-with-gmail", async (req, res) => {
  const { status, data } = await signupWithGmail(req.body);
  return successResponse({ res, status, data });
});

router.post(
  "/signup",
  validation(validators.signupSchema),
  async (req, res) => {
    const data = await signup(req.validate);
    return successResponse({ res, status: 201, data });
  },
);

router.post("/login", validation(validators.loginSchema), async (req, res) => {
  const validationResult = validators.loginSchema.safeParse(req.body);

  if (!validationResult.success) {
    throw BadRequestException("Validation error", error.issues);
  }

  const data = await login(req.validate);
  return successResponse({ res, data });
});

export default router;
