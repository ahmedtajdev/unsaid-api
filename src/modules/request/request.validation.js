import { z } from "zod";
import { generalValidationFields } from "../../common/validation.js";
import {
  FilterRequestsEnum,
  ProcessRequestStatusEnum,
  SortRequestsEnum,
} from "../../common/enum/index.js";

export const requestSenderIdentity = (lang) => {
  return z.object({
    params: z.strictObject({
      messageId: generalValidationFields.id(lang),
    }),
  });
};

export const getAllRequests = (lang) => {
  return z.object({
    query: z.strictObject({
      filterBy: z.enum(FilterRequestsEnum).default(FilterRequestsEnum.INBOX),
      sortBy: z
        .enum(SortRequestsEnum)
        .default(SortRequestsEnum.CREATED_AT_DESC),
      search: z.string().optional(),
      page: z.coerce.number().default(1),
      limit: z.coerce.number().default(5),
    }),
  });
};

export const processRequest = (lang) => {
  return z.object({
    params: z.strictObject({
      requestId: generalValidationFields.id(lang),
    }),
    body: z.strictObject({
      status: z.enum(ProcessRequestStatusEnum),
    }),
  });
};
