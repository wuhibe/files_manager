import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import dotenv from 'dotenv';
import dbClient from '../utils/db';
import { userCheck } from '../utils/helpers';
import { lookup } from 'mime-types';
import { join } from 'path';

dotenv.config();

async function postUpload(req: Request, res: Response) {
  const user: { email: string; id: ObjectId } = req['user'];
  const { name, type, parentId, isPublic, data } = req.body;

  // Validations
  if (!name) return res.status(400).send({ error: 'Missing name' });
  if (!type || !['folder', 'file', 'image'].includes(type))
    return res.status(400).send({ error: 'Missing type' });
  if (!data && type !== 'folder')
    return res.status(400).send({ error: 'Missing data' });

  try {
    const parent =
      parentId && parentId !== '0'
        ? await dbClient.findFileByIdOwner(parentId, user.id)
        : null;
    if (parentId && parentId !== '0' && !parent)
      return res.status(400).send({ error: 'Parent not found' });
    if (parent && parent['type'] !== 'folder')
      return res.status(400).send({ error: 'Parent is not a folder' });

    const fileId = uuidv4();
    const path = process.env.FOLDER_PATH ?? '/tmp/files_manager';
    if (!existsSync(path)) {
      mkdirSync(path);
    }

    const fileDetails = {
      userId: user.id,
      name,
      type,
      isPublic: isPublic ? true : false,
    };

    if (type === 'file' || type === 'image') {
      const localPath = `${path}/${fileId}`;
      const decodedBuffer = Buffer.from(data, 'base64');
      writeFileSync(localPath, decodedBuffer);
      fileDetails['localPath'] = localPath;
    }

    const file = await dbClient.insertFile({
      ...fileDetails,
      parentId: parent?._id ?? 0,
    });

    return res.status(201).send({
      ...fileDetails,
      id: file?.insertedId,
      parentId: parent?._id ?? 0,
    });
  } catch (error) {
    return res.status(500).json(error);
  }
}

async function getIndex(req: Request, res: Response) {
  const user: { email: string; id: ObjectId } = req['user'];
  const parentId = req.query.parentId?.toString() ?? 0;
  const page = req.query.page?.toString() ?? 0;
  try {
    const parent = parentId
      ? await dbClient.findFileByIdOwner(parentId, user.id)
      : null;
    if (parentId && !parent)
      return res.status(200).send({ error: 'Parent not found' });
    if (parent && parent['type'] !== 'folder')
      return res.status(400).send({ error: 'Parent is not a folder' });

    const files = await dbClient.getFilesList(user, parent, page);

    return res.status(200).send(files);
  } catch (error) {
    return res.status(500).json(error);
  }
}

async function getShow(req: Request, res: Response) {
  const user: { email: string; id: ObjectId } = req['user'];
  const fileId = req.params.id;
  try {
    const file = await dbClient.findFileByIdOwner(fileId, user.id);
    if (!file) return res.status(404).send({ error: 'Not found' });

    return res.status(200).send(file);
  } catch (error) {
    return res.status(404).send({ error: 'Not found' });
  }
}

async function putPublish(req: Request, res: Response) {
  const user: { email: string; id: ObjectId } = req['user'];
  const fileId = req.params.id;
  try {
    const file = await dbClient.findFileByIdOwner(fileId, user.id);
    if (!file) return res.status(404).send({ error: 'Not found' });

    const updatedFile = await dbClient.updateFileById(fileId, {
      isPublic: true,
    });

    return res.status(200).send({
      ...file,
      isPublic: updatedFile.matchedCount === 1 ? true : false,
    });
  } catch (error) {
    return res.status(404).send({ error: 'Not found' });
  }
}

async function putUnpublish(req: Request, res: Response) {
  const user: { email: string; id: ObjectId } = req['user'];
  const fileId = req.params.id;
  try {
    const file = await dbClient.findFileByIdOwner(fileId, user.id);
    if (!file) return res.status(404).send({ error: 'Not found' });

    const updatedFile = await dbClient.updateFileById(fileId, {
      isPublic: false,
    });

    return res.status(200).send({
      ...file,
      isPublic: updatedFile.matchedCount === 1 ? false : true,
    });
  } catch (error) {
    return res.status(404).send({ error: 'Not found' });
  }
}

async function getFile(req: Request, res: Response) {
  req = await userCheck(req);
  const user: { email: string; id: ObjectId } = req['user'];
  const fileId = req.params.id;
  try {
    let file;
    if (user)
      file = await dbClient.findFileByIdOwner(fileId, new ObjectId(user.id));
    else file = await dbClient.findPublicFileById(fileId);
    if (!file) return res.status(404).send({ error: 'Not found' });
    if (file.type === 'folder') {
      return res.status(400).send({ error: "A folder doesn't have content" });
    }
    const mime = lookup(file.name);
    return res
      .status(200)
      .contentType(mime ? mime : 'text/plain')
      .sendFile(join(__dirname, '..', '..', file.localPath));
  } catch (error) {
    return res.status(404).send({ error: 'Not found' });
  }
}

export default {
  postUpload,
  getIndex,
  getShow,
  putPublish,
  putUnpublish,
  getFile,
};
