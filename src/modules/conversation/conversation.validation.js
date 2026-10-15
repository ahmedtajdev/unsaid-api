import { z } from "zod";
import { generalValidationFields } from "../../common/validation.js";

export const getConversationMessages = (lang) => {
  return z.object({
    params: z.strictObject({
      conversationId: generalValidationFields.id(lang),
    }),
    query: z.strictObject({
      search: z.string().optional(),
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(5),
    }),
  });
};
