import logger from '@middleware/logger'
import db from './knex'

db.raw('SELECT NOW()')
  .then((result) => {
    console.log('✅ Database connected. Current time:', result.rows[0])
  })
  .catch((err) => {
    logger.error(err)
    console.error('❌ Database connection failed:', err)
    process.exit(1)
  })
