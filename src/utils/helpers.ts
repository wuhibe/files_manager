import { Request } from 'express';
import dbClient from './db';
import redisClient from './redis';

export async function userCheck(req: Request) {
  const token = req.header('X-Token');
  if (!token) {
    return req;
  }
  const key = `auth_${token}`;
  const userId = await redisClient.get(key);
  if (!userId) {
    return req;
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const user: any = await dbClient.findUserById(userId);
  if (!user) {
    return req;
  }

  req['user'] = { email: user.email, id: user._id };
  return req;
}
