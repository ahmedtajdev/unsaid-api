import {
  FilterMessagesEnum,
  SortMessagesEnum,
} from "../../common/enum/index.js";
import { NotfoundException } from "../../common/exceptions/index.js";
import {
  createOne,
  deleteOne,
  findById,
  findOne,
  paginate,
} from "../../common/repository/index.js";
import { MessageModel, UserModel } from "../../DB/models/index.js";

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
  if (search) {
    return {
      content: { $regex: search, $options: "i" },
    };
  } else {
    return {};
  }
};

export const createMessage = async (
  { content, receiverId } = {},
  files = [],
  user = undefined,
) => {
  try {
    const receiver = await findById({ model: UserModel, id: receiverId });

    if (!receiver) {
      throw NotfoundException("Invalid receiver ID");
    }

    const attachments = files.map((file) => file.path);
    const senderId = user ? user._id : undefined;

    const message = await createOne({
      model: MessageModel,
      data: {
        receiverId,
        senderId,
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
    const filter = {
      ...filterMessages(filterBy, user),
      ...searchMessages(search?.trim()),
    };

    return await paginate({
      model: MessageModel,
      filter,
      page,
      limit,
      options: {
        sort: { ...sortMessages(sortBy) },
      },
    });
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

export const getMessageById = async ({ messageId }, user) => {
  try {
    const message = await findOne({
      model: MessageModel,
      filter: {
        _id: messageId,
        receiverId: user._id,
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
