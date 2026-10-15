import { Router } from "express";
import { successResponse } from "../../common/utils/index.js";
import { authentication, validation } from "./../../middleware/index.js";
import * as validators from "./request.validation.js";
import {
  getAllRequests,
  processRequest,
  requestSenderIdentity,
} from "./request.service.js";
import { TokenTypeEnum } from "../../common/enum/index.js";

const router = Router({
  strict: true,
  caseSensitive: true,
  mergeParams: true,
});

router.post(
  "/:messageId",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  validation(validators.requestSenderIdentity),
  async (req, res, next) => {
    const data = await requestSenderIdentity(req.validated.params, req.user);
    return successResponse({ res, data, status: 201 });
  },
);

router.get(
  "/",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  validation(validators.getAllRequests),
  async (req, res) => {
    const data = await getAllRequests(req.validated.query, req.user);
    return successResponse({ res, data });
  },
);

router.patch(
  "/:requestId/process",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  validation(validators.processRequest),
  async (req, res) => {
    const data = await processRequest(
      req.validated.params,
      req.validated.body,
      req.user,
    );
    return successResponse({ res, data });
  },
);

export default router;
