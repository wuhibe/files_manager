import { Request, Response } from 'express';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

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

export default { getStatus, getStats };
