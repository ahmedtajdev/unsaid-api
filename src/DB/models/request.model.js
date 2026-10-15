import mongoose from "mongoose";
import { RequestStatusEnum } from "../../common/enum/index.js";

const requestSchema = new mongoose.Schema(
  {
    status: {
      type: Number,
      enum: Object.values(RequestStatusEnum),
      default: RequestStatusEnum.PENDING,
    },
    senderId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    receiverId: {
      type: mongoose.Types.ObjectId,
      ref: "User",
      required: true,
    },
    messageId: {
      type: mongoose.Types.ObjectId,
      ref: "Message",
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

export const RequestModel =
  mongoose.models.Request || mongoose.model("Request", requestSchema);
