import { Router } from "express";
import { successResponse } from "../../common/utils/index.js";
import { signup } from "./authentication.service.js";
const router = Router();

router.post("/signup", async (req, res, next) => {
  const data = signup(req.body);
  return successResponse({ res, status: 201, data });
});

router.post("/login", (req, res, next) => {
  const data = signup(req.body);
  return successResponse({ res, data });
});

export default router;
