import { createLogger, format, transports } from 'winston'
import 'winston-daily-rotate-file'
import path from 'path'

const { combine, timestamp, errors, splat, printf, colorize } = format

const logFormat = printf(({ level, message, timestamp, stack }) => {
  return `${timestamp} [${level.toUpperCase()}]: ${stack || message}`
})

const logger = createLogger({
  level: process.env.NODE_ENV === 'production' ? 'info' : 'debug',
  format: combine(
    timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), // Better timestamp format
    errors({ stack: true }),
    splat(),
    logFormat,
  ),
  transports: [
    new transports.Console({
      format: combine(colorize(), logFormat),
    }),
    new transports.DailyRotateFile({
      filename: path.resolve(__dirname, '../logs/application-%DATE%.log'),
      datePattern: 'YYYY-MM-DD',
      maxSize: '20m', // Prevent logs from becoming too large
      maxFiles: '14d',
      zippedArchive: true,
    }),
  ],
  exceptionHandlers: [
    new transports.File({
      filename: path.resolve(__dirname, '../logs/exceptions.log'),
    }),
  ],
  rejectionHandlers: [
    new transports.File({
      filename: path.resolve(__dirname, '../logs/rejections.log'),
    }),
  ],
})

export default logger
