import sha from 'sha1';
import { NextFunction, Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

async function getConnect(req: Request, res: Response) {
  const auth = req.header('Authorization');
  if (!auth) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const b64str = auth.split(' ')[1];
  const decodedBuffer = Buffer.from(b64str, 'base64');
  const decodedString = decodedBuffer.toString('utf-8');
  const [email, password] = decodedString.split(':');

  if (!email) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  if (!password) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const usr: any = await dbClient.findUserByEmail(email);

  if (!usr) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const pass = sha(password);
  if (pass !== usr.password) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  const token = uuidv4();
  const key = `auth_${token}`;
  redisClient.set(key, usr._id.toString(), 86400);

  return res.status(200).json({ token });
}

async function getDisconnect(req: Request, res: Response) {
  const token = req.header('X-Token');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const key = `auth_${token}`;
  const userId = await redisClient.get(key);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  redisClient.del(key);

  return res.status(204).json();
}

async function userAuth(req: Request, res: Response, next: NextFunction) {
  const token = req.header('X-Token');
  if (!token) {
    return res.status(401).json({ error: 'Unauthorized' });
  }
  const key = `auth_${token}`;
  const userId = await redisClient.get(key);
  if (!userId) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user: any = await dbClient.findUserById(userId);
  if (!user) {
    return res.status(401).json({ error: 'Unauthorized' });
  }

  req['user'] = { email: user.email, id: user._id };
  next();
}

export default { getConnect, getDisconnect, userAuth };
