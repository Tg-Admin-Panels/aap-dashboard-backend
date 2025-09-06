
import { Queue } from 'bullmq';
import IORedis from 'ioredis';

const redisConnection = new IORedis({
  maxRetriesPerRequest: null,
});

const fileUploadQueue = new Queue('file-upload', {
  connection: redisConnection,
});

export default fileUploadQueue;
