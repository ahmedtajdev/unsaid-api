import mongoose from "mongoose";
import {
  FilterMessagesEnum,
  SortMessagesEnum,
} from "../../common/enum/index.js";
import { NotfoundException } from "../../common/exceptions/index.js";
import {
  createOne,
  deleteOne,
  find,
  findById,
  findOne,
  paginate,
} from "../../common/repository/index.js";
import {
  ConversationModel,
  MessageModel,
  RequestModel,
  UserModel,
} from "../../DB/models/index.js";

const sortMessages = (sortBy) => {
  switch (sortBy) {
    case SortMessagesEnum.CREATED_AT_ASC:
      return { createdAt: 1 };
    case SortMessagesEnum.CREATED_AT_DESC:
      return { createdAt: -1 };
    default:
      return {};
  }
};

const filterMessages = (filterBy, user) => {
  switch (filterBy) {
    case FilterMessagesEnum.INBOX:
      return { receiverId: user._id };
    case FilterMessagesEnum.SENT:
      return { senderId: user._id };
    case FilterMessagesEnum.ALL:
      return {
        $or: [{ receiverId: user._id }, { senderId: user._id }],
      };

    default:
      return {};
  }
};

const searchMessages = (search) => {
  const searchKeyword = search.trim();
  if (searchKeyword) {
    return {
      content: { $regex: searchKeyword, $options: "i" },
    };
  } else {
    return {};
  }
};

export const createMessage = async (
  { content, receiverId, conversationId = undefined } = {},
  files = [],
  sender = undefined,
) => {
  try {
    const receiver = await findById({ model: UserModel, id: receiverId });

    if (!receiver) {
      throw NotfoundException("Invalid receiver id");
    }

    const attachments = files.map((file) => file.path);
    const senderId = sender ? sender._id : undefined;

    if (conversationId) {
      const existConversation = await findOne({
        model: ConversationModel,
        filter: {
          _id: conversationId,
          participants: { $all: [senderId, receiverId] },
        },
      });
      if (!existConversation) {
        throw NotfoundException("Invalid conversation id");
      }
    }

    const message = await createOne({
      model: MessageModel,
      data: {
        receiverId,
        senderId,
        conversationId,
        content,
        attachments,
      },
    });

    return message;
  } catch (error) {
    throw error;
  }
};

export const getAllMessages = async (
  {
    filterBy = FilterMessagesEnum.INBOX,
    sortBy = SortMessagesEnum.CREATED_AT_DESC,
    search = "",
    page = 1,
    limit = 5,
  } = {},
  user,
) => {
  try {
    const acceptedRequest = await findOne({
      model: RequestModel,
      filter: {
        $or: [{ senderId: user._id }, { receiverId: user._id }],
        status: 1,
      },
    });

    const filter = {
      ...filterMessages(filterBy, user),
      ...searchMessages(search),
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
        select: !acceptedRequest ? "-senderId" : undefined,
        sort: { ...sortMessages(sortBy) },
      },
    });
  } catch (error) {
    throw error;
  }
};

export const getMessageById = async ({ messageId }, user) => {
  try {
    const acceptedRequest = await findOne({
      model: RequestModel,
      filter: {
        $or: [{ senderId: user._id }, { receiverId: user._id }],
        status: 1,
      },
    });

    const message = await findOne({
      model: MessageModel,
      filter: {
        _id: messageId,
        $or: [{ receiverId: user._id }, { senderId: user._id }],
      },
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
        select: !acceptedRequest ? "-senderId" : undefined,
      },
    });

    if (!message) {
      throw NotfoundException("Invalid message id");
    }

    return message;
  } catch (error) {
    throw error;
  }
};

export const deleteMessage = async ({ messageId }, user) => {
  try {
    const result = await deleteOne({
      model: MessageModel,
      filter: {
        _id: messageId,
        receiverId: user._id,
      },
    });

    if (!result.deletedCount) {
      throw NotfoundException("Invalid message id");
    }

    return "Message deleted successfully";
  } catch (error) {
    throw error;
  }
};
