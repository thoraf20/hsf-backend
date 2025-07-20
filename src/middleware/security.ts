import helmet from 'helmet'
import { Application } from 'express'
import rateLimit from "express-rate-limit";
import ExpressBrute from "express-brute";
import slowDown from "express-slow-down";
import redis from '../infrastructure/cache/redisClient';
import RedisStore, { RedisReply } from "rate-limit-redis";

const store = new ExpressBrute.MemoryStore();
export const bruteforce = new ExpressBrute(store, {
  freeRetries: 100,
  minWait: 5 * 60 * 1000, 
  maxWait: 60 * 60 * 1000, 
});

export default function setupSecurity(app: Application) {
  app.use(helmet())
}




export const speedLimiter = slowDown({
  windowMs: 15 * 60 * 1000,
  delayAfter: 100,
  delayMs: () => 500,
  validate: { delayMs: false }, // Suppress warning
});




export const limiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: [string, ...string[]]) => redis.call(...args) as Promise<RedisReply>,
  }),
  keyGenerator: (req) => req.user?.id || req.ip, 
  windowMs: 15 * 60 * 1000,
  max: 1000,
  message:{
    error :{
          text: "Too many requests, try again in 10 minutes.",
          nextValidRequestDate : new Date()
    }

  },
  
  standardHeaders: true, 
  legacyHeaders: false, 
});



export const authLimiter = rateLimit({
  store: new RedisStore({
    sendCommand: (...args: [string, ...string[]]) => redis.call(...args) as Promise<RedisReply>,
  }),
  keyGenerator: (req) => req.user?.id || req.ip, 
  windowMs: 10 * 60 * 1000, 
  max: 5,
  message:
  {
    error :{
      text: "Too many requests, try again in 10 minutes.",
      nextValidRequestDate : new Date()
}

  }

});