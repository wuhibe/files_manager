import sha from 'sha1';
import { Request, Response } from 'express';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

async function postNew(req: Request, res: Response) {
  const email = req.body.email;
  const pass = req.body.password;

  if (!email) {
    return res.status(400).json({ error: 'Missing email' });
  }
  if (!pass) {
    return res.status(400).json({ error: 'Missing password' });
  }
  const usr = await dbClient.findUserByEmail(email);
  if (usr) {
    return res.status(400).json({ error: 'Already exist' });
  }

  const password = sha(pass);
  const user = await dbClient.insertUser({ email, password });

  return res.status(201).json({ email, id: user.insertedId });
}

async function getMe(req: Request, res: Response) {
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

  return res.status(200).json({ email: user.email, id: user._id });
}

export default { postNew, getMe };
