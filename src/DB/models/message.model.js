import mongoose from "mongoose";

const messageSchema = new mongoose.Schema(
  {
    content: {
      type: String,
      minLength: 2,
      maxLength: 50000,
      required: function () {
        return this.attachments?.length === 0;
      },
    },
    attachments: [String],
    senderId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
    },
    receiverId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
    autoIndex: true,
  },
);

export const MessageModel =
  mongoose.models.Message || mongoose.model("Message", messageSchema);
