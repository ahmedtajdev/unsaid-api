import { z } from "zod";
import { generalValidationFields } from "../../common/validation.js";
import {
  LanguageEnum,
  FilterMessagesEnum,
  SortMessagesEnum,
} from "../../common/enum/index.js";

export const createMessage = (lang) => {
  return z
    .object({
      body: z.strictObject({
        receiverId: generalValidationFields.id(lang),
        conversationId: generalValidationFields.id(lang).optional(),
        content: z.string().min(2).max(50000).optional(),
      }),
      files: z.array(generalValidationFields.file(lang)).max(3).optional(),
    })
    .superRefine((data, ctx) => {
      if (!data.body.content && !data.files?.length) {
        ctx.addIssue({
          code: "custom",
          message:
            lang === LanguageEnum.EN
              ? "Either content or attachments must be provided"
              : "يجب تقديم المحتوى أو المرفقات",
        });
      }
    });
};

export const getAllMessages = (lang) => {
  return z.object({
    query: z.strictObject({
      filterBy: z.enum(FilterMessagesEnum).default(FilterMessagesEnum.INBOX),
      sortBy: z
        .enum(SortMessagesEnum)
        .default(SortMessagesEnum.CREATED_AT_DESC),
      search: z.string().optional(),
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(5),
    }),
  });
};

export const deleteMessage = (lang) => {
  return z.object({
    params: z.strictObject({
      messageId: generalValidationFields.id(lang),
    }),
  });
};

export const getMessageById = (lang) => {
  return z.object({
    params: z.strictObject({
      messageId: generalValidationFields.id(lang),
    }),
  });
};
