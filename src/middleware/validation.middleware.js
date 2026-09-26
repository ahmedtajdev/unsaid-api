import { LanguageEnum } from "../common/enum/security.enum.js";
import { BadRequestException } from "../common/exceptions/index.js";

export const validation = (shcema) => {
  return (req, res, next) => {
    const lang = Number(req.headers["accept-language"] ?? LanguageEnum.EN);
    const validationResult = shcema(lang).safeParse({
      body: req.body,
      query: req.query,
      params: req.params,
    });

    if (!validationResult.success) {
      throw BadRequestException(
        "Validation error",
        validationResult.error.format(),
      );
    }

    req.validate = validationResult.data;
    next();
  };
};
