import { UserModel } from "../../DB/models/index.js";
import {
  ConflictException,
  NotfoundException,
} from "../../common/exceptions/index.js";
import { createOne, findOne } from "../../common/repository/index.js";

export const signup = async ({ email, password, username }) => {
  const duplicatedAccount = await findOne({
    model: UserModel,
    filter: { email },
    options: { select: "email" },
  });

  if (duplicatedAccount) {
    throw ConflictException("Email Exists");
  }

  const account = await createOne({
    model: UserModel,
    data: { email, password, username },
  });

  return account;
};

export const login = async ({ email, password }) => {
  const account = await findOne({
    model: UserModel,
    filter: { email, password },
    options: { select: "-password" },
  });

  if (!account) {
    throw NotfoundException("Not Exist");
  }

  return account;
};
