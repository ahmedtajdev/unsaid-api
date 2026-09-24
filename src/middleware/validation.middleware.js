import { BadRequestException } from "../common/exceptions/index.js";

export const validation = (shcema) => {
  return (req, res, next) => {
    const validationResult = shcema.safeParse(req.body);

    if (!validationResult.success) {
      throw BadRequestException("Validation error", error.issues);
    }

    req.validate = validationResult.data;
    next();
  };
};
