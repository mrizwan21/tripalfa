"use strict";
const __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.closeRedis = exports.getRedisClient = void 0;
const ioredis_1 = __importDefault(require("ioredis"));
let client = null;
function getRedisClient() {
    if (!client) {
        const url = process.env.REDIS_URL || 'redis://127.0.0.1:6379';
        client = new ioredis_1.default(url);
    }
    return client;
}
exports.getRedisClient = getRedisClient;
async function closeRedis() {
    if (client) {
        await client.quit();
        client = null;
    }
}
exports.closeRedis = closeRedis;
