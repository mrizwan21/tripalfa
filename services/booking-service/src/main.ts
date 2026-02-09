import * as dotenv from 'dotenv';
import process from 'node:process';
import app from './app';

async function bootstrap() {
  // Load environment variables
  dotenv.config();

  const port = process.env.PORT || 3001;

  // Start the Express server
  app.listen(port, () => {
    console.log(`Booking Service running on port ${port}`);
    console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
  });
}

bootstrap().catch((error) => {
  console.error('Failed to start Booking Service:', error);
  process.exit(1);
});
