import { Router } from "express";
import { successResponse } from "../../common/utils/index.js";
import { login, signup, signupWithGmail } from "./authentication.service.js";
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

router.post("/login", validation(validators.login), async (req, res) => {
  const data = await login(req.validate.body, `${req.protocol}://${req.host}`);
  return successResponse({ res, data });
});

export default router;
