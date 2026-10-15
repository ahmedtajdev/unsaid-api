import { NotfoundException } from "../../common/exceptions/index.js";
import { findOne, paginate } from "../../common/repository/index.js";
import { ConversationModel, MessageModel } from "../../DB/models/index.js";

export const getConversationMessages = async (
  { conversationId },
  { page, limit },
  user,
) => {
  const conversation = await findOne({
    model: ConversationModel,
    filter: {
      _id: conversationId,
      participants: { $in: [user._id] },
    },
  });

  if (!conversation) {
    throw NotfoundException("Invalid conversation id");
  }

  const filter = {
    // ...searchMessages(search),
    conversationId,
  };

  return await paginate({
    model: MessageModel,
    filter,
    page,
    limit,
    options: {
      populate: [
        {
          path: "sender",
          select: "firstName lastName image",
        },
        {
          path: "receiver",
          select: "firstName lastName image",
        },
      ],
    },
  });
};
