import 'module-alias/register'

import dotenv from 'dotenv'
dotenv.config()

import './server/app'

process.on('uncaughtException', (error) => {
  console.error('Uncaught Exception:', error)
})

process.on('unhandledRejection', (reason, promise) => {
  console.error('Unhandled Rejection:', reason)
})
