import { z } from "zod";

export const loginSchema = z.strictObject({
  email: z.email(),
  password: z.string().min(8).max(16),
});

export const signupSchema = loginSchema
  .safeExtend({
    username: z.string(),
    phone: z.e164(),
    confirmPassword: z.string().min(8).max(16),
  })
  .superRefine((data, ctx) => {
    if (data.password !== data.confirmPassword) {
      ctx.addIssue({
        code: "custom",
        path: ["confirmPassword"],
        message: "Password mismatch with confirmation password",
      });
    }

    if (!data.username.includes(" ")) {
      ctx.addIssue({
        code: "custom",
        path: ["username"],
        message: "Username must contain two parts",
      });
    }
  });
