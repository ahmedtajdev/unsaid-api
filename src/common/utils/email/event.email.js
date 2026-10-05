import { EventEmitter } from "node:events";
import { sendEmail } from "./send.email.js";
import { verifyEmailTemplate } from "./templates.email.js";

export const emailEvent = new EventEmitter();

emailEvent.on("sendEmail", async ({ recipients, subject, data }) => {
  try {
    await sendEmail({
      ...recipients,
      subject,
      html: verifyEmailTemplate({
        code: data.code,
        subject,
        title: data.title,
      }),
    });
  } catch (error) {
    console.log(error);
  }
});
