import { createClient } from 'redis';
import { RedisClientType } from '@redis/client';
require('dotenv').config();

class RedisClient {
  private client: RedisClientType;

  constructor() {
    const url = process.env.REDIS_URL || 'redis://localhost:6379';

    this.client = createClient({ url });
    this.client.on('error', (err: any) => {
      console.log(err);
    });
    this.client.connect();
  }

  isAlive() {
    return this.client.isOpen;
  }

  async get(key: string) {
    return await this.client.get(key);
  }

  set(key: string, value: any, duration: number) {
    this.client.set(key, value, { EX: duration });
  }

  del(key: string) {
    this.client.del(key);
  }
}
const redisClient = new RedisClient();
export default redisClient;
