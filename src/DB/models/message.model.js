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
    conversationId: {
      type: mongoose.Types.ObjectId,
      ref: "Conversation",
    },
  },
  {
    timestamps: true,
    strict: true,
    strictQuery: true,
    autoIndex: true,
    toJSON: {
      virtuals: true,
      transform: (doc, ret) => {
        delete ret.senderId;
        delete ret.receiverId;
        return ret;
      },
    },
    toObject: { virtuals: true },
    id: false,
  },
);

messageSchema.virtual("sender", {
  ref: "User",
  localField: "senderId",
  foreignField: "_id",
  justOne: true,
});

messageSchema.virtual("receiver", {
  ref: "User",
  localField: "receiverId",
  foreignField: "_id",
  justOne: true,
});

export const MessageModel =
  mongoose.models.Message || mongoose.model("Message", messageSchema);
