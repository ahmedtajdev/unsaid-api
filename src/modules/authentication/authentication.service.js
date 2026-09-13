import { UserModel } from "../../DB/models/index.js";
import {
  ConflictException,
  NotfoundException,
} from "../../common/exceptions/index.js";
import { createOne, findOne } from "../../common/repository/index.js";

export const signup = async ({ username, email, password }) => {
  try {
    const duplicatedAccount = await findOne({
      model: UserModel,
      filter: { email },
      options: { select: "email" },
    });

    if (duplicatedAccount) {
      throw ConflictException("Email already Exists");
    }

    const account = await createOne({
      model: UserModel,
      data: {
        username,
        email,
        password,
      },
    });

    return account;
  } catch (error) {
    console.log({ error });
    throw error;
  }
};

export const login = async ({ email, password }) => {
  try {
    const account = await findOne({
      model: UserModel,
      filter: { email, password },
      options: { select: "-password" },
    });

    if (!account) {
      throw NotfoundException("Not Exist");
    }

    return account;
  } catch (error) {
    console.log({ error });
    throw error;
  }
};
