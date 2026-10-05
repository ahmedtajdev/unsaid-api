import { z } from "zod";
import { LanguageEnum } from "./enum/security.enum.js";

const validationMessages = {
  email: {
    [LanguageEnum.EN]:
      "Invalid email format, please add valid email like any@example.com",
    [LanguageEnum.AR]:
      "تنسيق البريد الإلكتروني غير صحيح، يرجى إضافة بريد إلكتروني صحيح مثل any@example.com",
  },
  phone: {
    [LanguageEnum.EN]: "Please enter a valid Egyptian phone number",
    [LanguageEnum.AR]: "الرجاء إدخال رقم هاتف مصري صالح",
  },
  password: {
    [LanguageEnum.EN]:
      "Password must contain at least one letter and one number, and be between 8 and 16 characters long",
    [LanguageEnum.AR]:
      "يجب أن تحتوي كلمة المرور على حرف واحد ورقم واحد، وأن تكون بين 8 و16 حرفًا",
  },
  username: {
    [LanguageEnum.EN]: "Username must contain two parts",
    [LanguageEnum.AR]: "يجب أن يحتوي اسم المستخدم على جزأين",
  },
};

const getValidationMessage = (field, lang = LanguageEnum.EN) => {
  return validationMessages[field]?.[lang] || "Invalid input";
};

const matchFields = ({ original, copy, data, ctx, lang = LanguageEnum.EN }) => {
  if (data[original] !== data[copy]) {
    ctx.addIssue({
      code: "custom",
      path: [copy],
      message:
        lang === LanguageEnum.EN
          ? `${copy} must match ${original}`
          : `${copy} يجب أن يطابق ${original}`,
    });
  }
};

export const generalValidationFields = {
  email: (lang = LanguageEnum.EN) => {
    return z.email({
      message: getValidationMessage("email", lang),
    });
  },
  otp: (lang = LanguageEnum.EN) => {
    return z.string().regex(/^\d{6}$/, { error: "Invalid code" });
  },
  password: (lang = LanguageEnum.EN) => {
    return z.string().regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d).{8,}$/, {
      message: getValidationMessage("password", lang),
    });
  },
  username: (lang = LanguageEnum.EN) => {
    return z.string().regex(/^[a-zA-Z]+ [a-zA-Z]+$/, {
      message: getValidationMessage("username", lang),
    });
  },
  phone: (lang = LanguageEnum.EN) => {
    return z
      .string()
      .regex(/^01(0|1|2|5)\d{8}$/, {
        message: getValidationMessage("phone", lang),
      })
      .optional();
  },
  matchFields,
};
