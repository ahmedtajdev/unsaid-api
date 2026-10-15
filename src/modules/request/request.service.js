import {
  FilterRequestsEnum,
  RequestStatusEnum,
  SortRequestsEnum,
} from "../../common/enum/index.js";
import {
  BadRequestException,
  NotfoundException,
} from "../../common/exceptions/index.js";
import {
  createOne,
  findById,
  findOne,
  paginate,
} from "../../common/repository/index.js";
import {
  MessageModel,
  RequestModel,
  UserModel,
  ConversationModel,
} from "../../DB/models/index.js";

const sortRequests = (sortBy) => {
  switch (sortBy) {
    case SortRequestsEnum.CREATED_AT_ASC:
      return { createdAt: 1 };
    case SortRequestsEnum.CREATED_AT_DESC:
      return { createdAt: -1 };
    default:
      return {};
  }
};

const filterRequests = (filterBy, user) => {
  switch (filterBy) {
    case FilterRequestsEnum.INBOX:
      return { receiverId: user._id };
    case FilterRequestsEnum.SENT:
      return { senderId: user._id };
    case FilterRequestsEnum.ALL:
      return {
        $or: [{ receiverId: user._id }, { senderId: user._id }],
      };

    default:
      return {};
  }
};

export const requestSenderIdentity = async ({ messageId }, user) => {
  try {
    const message = await findOne({
      model: MessageModel,
      filter: {
        _id: messageId,
        receiverId: user._id,
      },
    });

    if (!message) {
      throw BadRequestException("Invalid message id");
    }

    const receiver = await findById({
      model: UserModel,
      id: message.senderId,
    });

    if (!receiver) {
      throw NotfoundException("Receiver not found");
    }

    const existRequest = await findOne({
      model: RequestModel,
      filter: {
        messageId,
        senderId: user._id,
        receiverId: receiver._id,
      },
    });

    if (existRequest) {
      throw BadRequestException("Request already sent");
    }

    const request = await createOne({
      model: RequestModel,
      data: {
        status: RequestStatusEnum.PENDING,
        senderId: user._id,
        receiverId: receiver._id,
        messageId,
      },
    });

    return request;
  } catch (error) {
    throw error;
  }
};

export const getAllRequests = async (
  {
    filterBy = FilterRequestsEnum.INBOX,
    sortBy = SortRequestsEnum.CREATED_AT_DESC,
    page = 1,
    limit = 5,
  } = {},
  user,
) => {
  try {
    const filter = {
      ...filterRequests(filterBy, user),
    };

    return await paginate({
      model: RequestModel,
      filter,
      page,
      limit,
      options: {
        sort: { ...sortRequests(sortBy) },
      },
    });
  } catch (error) {
    throw error;
  }
};

const createConversation = async (request) => {
  const [originalMessage, conversation] = await Promise.all([
    findOne({
      model: MessageModel,
      senderId: request.receiverId,
      receiverId: request.senderId,
    }),
    createOne({
      model: ConversationModel,
      data: {
        participants: [request.senderId, request.receiverId],
        originalMessageId: request.messageId,
      },
    }),
  ]);

  originalMessage.conversationId = conversation._id;
  await originalMessage.save();

  return { originalMessage, conversation };
};

export const processRequest = async ({ requestId }, { status }, user) => {
  try {
    const request = await findOne({
      model: RequestModel,
      filter: {
        _id: requestId,
        receiverId: user._id,
      },
    });

    if (!request) {
      throw BadRequestException("Invalid request id");
    }

    if (request.status > 0) {
      throw BadRequestException("Request has already been processed");
    }

    request.status = status;
    await request.save();

    if (request.status === RequestStatusEnum.ACCEPTED) {
      const { conversation } = await createConversation(request);
      return {
        request,
        conversation,
      };
    }

    return request;
  } catch (error) {
    throw error;
  }
};
