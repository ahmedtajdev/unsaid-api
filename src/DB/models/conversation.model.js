import mongoose from "mongoose";

const conversationSchema = new mongoose.Schema(
  {
    originalMessageId: {
      type: mongoose.Types.ObjectId,
      ref: "Message",
      required: true,
    },
    participants: {
      type: [mongoose.Types.ObjectId],
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

export const ConversationModel =
  mongoose.models.Conversation ||
  mongoose.model("Conversation", conversationSchema);
