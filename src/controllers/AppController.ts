import dbClient from '../utils/db';
import redisClient from '../utils/redis';
import { Request, Response } from 'express';

function getStatus(req: Request, res: Response) {
  const status = {
    redis: redisClient.isAlive(),
    db: dbClient.isAlive(),
  };
  return res.status(200).send(status);
}

async function getStats(req: Request, res: Response) {
  const stats = {
    users: await dbClient.nbUsers(),
    files: await dbClient.nbFiles(),
  };
  return res.status(200).send(stats);
}

export { getStatus, getStats };
