import { EventEmitter } from "node:events";
import { sendEmail } from "./send.email.js";
import { sendEmailTemplate } from "./templates.email.js";

export const emailEvent = new EventEmitter();

emailEvent.on("sendEmail", async ({ recipients, subject, data }) => {
  try {
    await sendEmail({
      ...recipients,
      subject,
      html: sendEmailTemplate({
        code: data.code,
        subject,
        title: data.title,
        expiresIn: data.expiresIn,
      }),
    });
  } catch (error) {
    console.log(error);
  }
});
