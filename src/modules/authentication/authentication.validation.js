import { z } from "zod";
import { LanguageEnum } from "../../common/enum/index.js";
import { generalValidationFields } from "../../common/validation.js";

const loginSchema = (lang = LanguageEnum.EN) =>
  z.strictObject({
    email: generalValidationFields.email(lang),
    password: generalValidationFields.password(lang),
  });

export const login = (lang = LanguageEnum.EN) =>
  z.object({
    body: loginSchema(lang),
  });

export const signup = (lang = LanguageEnum.EN) =>
  z.object({
    body: loginSchema(lang)
      .safeExtend({
        username: generalValidationFields.username(lang),
        phone: generalValidationFields.phone(lang),
        confirmPassword: generalValidationFields.password(lang),
      })
      .superRefine((data, ctx) => {
        generalValidationFields.matchFields({
          original: "password",
          copy: "confirmPassword",
          data,
          ctx,
          lang,
        });

        if (!data.username.includes(" ")) {
          ctx.addIssue({
            code: "custom",
            path: ["username"],
            message:
              lang === LanguageEnum.EN
                ? "Username must contain two parts"
                : "يجب أن يحتوي اسم المستخدم على جزأين",
          });
        }
      }),
  });

export const resendEmailOtp = (lang = LanguageEnum.EN) =>
  z.object({
    body: z.strictObject({
      email: generalValidationFields.email(lang),
    }),
  });

export const forgotPassword = (lang = LanguageEnum.EN) =>
  z.object({
    body: z.strictObject({
      email: generalValidationFields.email(lang),
    }),
  });

export const confirmEmail = (lang = LanguageEnum.EN) =>
  z.object({
    body: z.strictObject({
      email: generalValidationFields.email(lang),
      otp: generalValidationFields.otp(lang),
    }),
  });

export const otp = (lang = LanguageEnum.EN) =>
  z.object({
    body: z.strictObject({
      otp: generalValidationFields.otp(lang),
    }),
  });

export const resetForgotPassword = (lang = LanguageEnum.EN) =>
  z
    .object({
      body: z.strictObject({
        email: generalValidationFields.email(lang),
        otp: generalValidationFields.otp(lang),
        password: generalValidationFields.password(lang),
        confirmPassword: generalValidationFields.password(lang),
      }),
    })
    .superRefine((data, ctx) => {
      generalValidationFields.matchFields({
        original: "password",
        copy: "confirmPassword",
        data,
        ctx,
        lang,
      });
    });
