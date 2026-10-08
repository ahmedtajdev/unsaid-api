import { BadRequestException } from "../common/exceptions/index.js";
import { processMulterUpload } from "../common/utils/index.js";

export const fileUploadMiddleware = ({
  isFileRequired = true,
  multerMiddleware,
  customPath = "general",
  validation = [],
}) => {
  return async (req, res, next) => {
    multerMiddleware(req, res, async (error) => {
      try {
        if (error) {
          throw BadRequestException(error.message);
        }

        if (
          isFileRequired &&
          !(
            req.file ||
            (Array.isArray(req.files) && req.files.length) ||
            (typeof req.files === "object" && Object.keys(req.files).length)
          )
        ) {
          throw BadRequestException("File is required");
        }

        await processMulterUpload({
          req,
          customPath,
          validation,
        });

        next();
      } catch (error) {
        next(error);
      }
    });
  };
};
