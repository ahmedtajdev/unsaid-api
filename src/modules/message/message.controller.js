import { Router } from "express";
import {
  fileValidation,
  localFileUpload,
  successResponse,
} from "../../common/utils/index.js";
import {
  authentication,
  fileUploadMiddleware,
  tokenAuth,
  validation,
} from "../../middleware/index.js";
import * as validators from "./message.validation.js";
import {
  createMessage,
  deleteMessage,
  getAllMessages,
  getMessageById,
} from "./message.service.js";
import { TokenTypeEnum } from "../../common/enum/index.js";

const router = Router({
  strict: true,
  caseSensitive: true,
  mergeParams: true,
});

router.post(
  "/",
  async (req, res, next) => {
    if (req.headers["authorization"]) {
      await tokenAuth({ req, tokenType: TokenTypeEnum.ACCESS });
    }
    next();
  },
  fileUploadMiddleware({
    multerMiddleware: localFileUpload().any("attachments", 3),
    validation: fileValidation.image,
    customPath: "messages",
    isFileRequired: false,
  }),
  validation(validators.createMessage),
  async (req, res) => {
    const data = await createMessage(req.validated.body, req.files, req.user);
    return successResponse({ res, status: 201, data });
  },
);

router.get(
  "/",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  validation(validators.getAllMessages),
  async (req, res) => {
    const data = await getAllMessages(req.validated.query, req.user);
    return successResponse({ res, data });
  },
);

router.delete(
  "/:messageId",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  validation(validators.deleteMessage),
  async (req, res) => {
    const message = await deleteMessage(req.validated.params, req.user);
    return successResponse({ res, message });
  },
);

router.get(
  "/:messageId",
  authentication({ tokenType: TokenTypeEnum.ACCESS }),
  validation(validators.getMessageById),
  async (req, res) => {
    const data = await getMessageById(req.validated.params, req.user);
    return successResponse({ res, data });
  },
);

export default router;
