import 'dotenv/config'
import './server/app'

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
  });
  
  process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection:', reason);
  });
  