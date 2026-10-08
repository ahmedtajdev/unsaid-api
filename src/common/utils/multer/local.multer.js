import multer from "multer";
import { randomUUID } from "node:crypto";
import { join, resolve } from "node:path";
import { mkdir, unlink, writeFile } from "node:fs/promises";
import { fileTypeFromBuffer } from "file-type";
import { BadRequestException } from "../../exceptions/index.js";
import { get, set } from "../../services/index.js";

export const localFileUplaod = ({ maxFileSizeMB = 5 } = {}) => {
  const storage = multer.memoryStorage();

  return multer({
    storage,
    limits: { fileSize: maxFileSizeMB * 1024 * 1024 },
  });
};

export const fileValidation = {
  image: ["image/jpeg", "image/jpg", "image/png", "image/gif"],
  files: ["application/pdf", "application/json"],
};

const validateFile = async ({ file, validation = [] }) => {
  const result = await fileTypeFromBuffer(file.buffer);

  if (!result || !validation.includes(result.mime)) {
    throw BadRequestException("Invalid file format");
  }

  return result;
};

const generateUniqueFilePath = async ({ customPath = "general", ext }) => {
  const relativeDir = join("assets", customPath);
  await mkdir(relativeDir, { recursive: true });
  return join(relativeDir, `${randomUUID()}.${ext}`);
};

const deleteFile = async (filePath) => {
  try {
    await unlink(resolve(filePath));
  } catch (error) {
    if (error.code !== "ENOENT") {
      throw error;
    }
  }
};

const deleteFiles = async (files = []) => {
  for (const file of files) {
    await deleteFile(file.finalPath);
  }
};

const saveFile = async ({ file, uniqueFilePath }) => {
  await writeFile(resolve(uniqueFilePath), file.buffer);
  file.finalPath = uniqueFilePath;
  return file;
};

const uploadProfileImage = async ({ user, file, uniqueFilePath }) => {
  const key = `User::${user.email}::Profile_Image`;

  const oldProfileImage = await get({ key });

  if (oldProfileImage) {
    await deleteFile(oldProfileImage);
  }

  const uploadedFile = await saveFile({ file, uniqueFilePath });

  await set({
    key,
    value: file.finalPath,
  });
  return file;
};

const processFilesArray = async ({
  user,
  customPath,
  files = [],
  validation = [],
}) => {
  const uniqueFilePaths = [];
  for (const file of files) {
    const result = await validateFile({ file, validation });
    const uniqueFilePath = await generateUniqueFilePath({
      customPath,
      ext: result.ext,
    });
    uniqueFilePaths.push(uniqueFilePath);
  }

  const assets = [];

  try {
    for (const [index, file] of files.entries()) {
      const uploadedFile = await saveFile({
        file,
        uniqueFilePath: uniqueFilePaths[index],
      });
      assets.push(uploadedFile);
    }
    return assets;
  } catch (error) {
    await deleteFiles(assets);
    throw error;
  }
};

const processFields = async ({ customPath, fields = {}, validation = [] }) => {
  const assets = [];
  for (const field of Object.keys(fields)) {
    const files = await processFilesArray({
      customPath,
      files: fields[field],
      validation,
    });
    assets.push({ field, files });
  }
  return assets;
};

export const processMulterUpload = async ({
  req,
  customPath = "general",
  validation = [],
}) => {
  if (req.file) {
    const result = await validateFile({ file: req.file, validation });
    const uniqueFilePath = await generateUniqueFilePath({
      customPath,
      ext: result.ext,
    });

    if (customPath === "users/profile") {
      await uploadProfileImage({
        user: req.user,
        file: req.file,
        uniqueFilePath,
      });
    } else {
      await saveFile({ file: req.file, uniqueFilePath });
    }
  } else if (Array.isArray(req.files)) {
    await processFilesArray({
      user: req.user,
      customPath,
      files: req.files,
      validation,
    });
  } else if (typeof req.files === "object" && Object.keys(req.files)?.length) {
    await processFields({
      user: req.user,
      customPath,
      fields: req.files,
      validation,
    });
  }
};
