import { Request, Response } from 'express';
import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { existsSync, mkdirSync, writeFileSync } from 'fs';
import dotenv from 'dotenv';
import dbClient from '../utils/db';

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

  const parent = parentId ? await dbClient.findFileById(parentId) : null;
  if (parentId && !parent)
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
    const decodedString = decodedBuffer.toString('utf-8');
    writeFileSync(localPath, decodedString);
    fileDetails['localPath'] = localPath;
  }

  const file = await dbClient.insertFile({
    ...fileDetails,
    parentId: parent?._id ?? 0,
  });

  return res
    .status(201)
    .send({ ...fileDetails, id: file?.insertedId, parentId: parent?._id ?? 0 });
}

export default { postUpload };
