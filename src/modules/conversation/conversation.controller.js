import { Router } from "express";
import { TokenTypeEnum } from "../../common/enum/index.js";
import { authentication, validation } from "../../middleware/index.js";
import { successResponse } from "../../common/utils/index.js";
import * as validators from "./conversation.validation.js";
import { getConversationMessages } from "./conversation.service.js";

const router = Router();

router.get(
  "/:conversationId",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  validation(validators.getConversationMessages),
  async (req, res, next) => {
    const data = await getConversationMessages(req.validated.params,req.validated.query, req.user);
    return successResponse({ res, data });
  },
);

export default router;
