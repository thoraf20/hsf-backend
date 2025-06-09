import { getEnv } from '@infrastructure/config/env/env.config'
import dotenv from 'dotenv'

// Load .env file
dotenv.config()
// Define Configuration Object
console.log(getEnv('PORT'))
const configs = {
  app: {
    port: parseInt(process.env.PORT || '5000', 10),
    env: process.env.NODE_ENV || 'development',
  },
  elasticSearch: {
    node: process.env.ELASTICSEARCH_NODE || 'http://localhost:9200' as string,
    auth: {
      apiKey: process.env.ELASTICSEARCH_API_KEY || 'default_api_key',
    },
  },
  database: {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
  },
  jwt: {
    secret: process.env.JWT_SECRET || 'default_secret',
  },
  logger: {
    level: process.env.LOG_LEVEL || 'info',
  },
  salt: {
    app_key: process.env.APP_KEY,
  },
}

export default configs
