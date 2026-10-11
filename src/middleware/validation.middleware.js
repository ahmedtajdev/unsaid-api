import { LanguageEnum } from "../common/enum/security.enum.js";
import { BadRequestException } from "../common/exceptions/index.js";

export const validation = (schema) => {
  return (req, res, next) => {
    const lang = Number(req.headers["accept-language"] ?? LanguageEnum.EN);
    const validationResult = schema(lang).safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
      files: req.files,
      file: req.file,
    });

    if (!validationResult.success) {
      throw BadRequestException(
        "Validation error",
        validationResult.error.format(),
      );
    }

    req.validated = validationResult.data;
    next();
  };
};
