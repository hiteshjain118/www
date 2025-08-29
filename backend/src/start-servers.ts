#!/usr/bin/env tsx

import { config, validateConfig } from './config';
import { log } from './utils/logger';
import { startInternalServer } from './internal-server';

// Global BigInt serialization fix
(BigInt.prototype as any).toJSON = function() {
  return this.toString();
};

/**
 * Start only the internal tools server
 * This is useful for development or when running services separately
 */
async function startInternalOnly() {
  try {
    // Validate configuration
    const configErrors = validateConfig();
    if (configErrors.length > 0) {
      log.error('Configuration validation failed:', { errors: configErrors });
      console.error('Configuration errors:', configErrors);
      process.exit(1);
    }

    console.log('🔧 Starting CoralBricks Internal Tools API...');
    await startInternalServer();
    
    console.log('\n✅ Internal Tools API is running!');
    console.log(`   Port: ${config.internalPort}`);
    console.log(`   Environment: ${config.nodeEnv}`);
    console.log(`   Tools endpoint: http://localhost:${config.internalPort}/tools`);

  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    log.error(`Failed to start internal tools server: ${errorMessage}`, { error: String(error) });
    console.error(`❌ Failed to start internal tools server: ${errorMessage}`);
    process.exit(1);
  }
}

// Handle graceful shutdown
process.on('SIGTERM', () => {
  log.info('SIGTERM received, shutting down internal server gracefully');
  console.log('🛑 SIGTERM received, shutting down internal server gracefully');
  process.exit(0);
});

process.on('SIGINT', () => {
  log.info('SIGINT received, shutting down internal server gracefully');
  console.log('🛑 SIGINT received, shutting down internal server gracefully');
  process.exit(0);
});

// Handle uncaught exceptions
process.on('uncaughtException', (error) => {
  log.error(`Uncaught Exception in internal server: ${error.message}`, { error: String(error) });
  console.error(`💥 Uncaught Exception in internal server: ${error.message}`);
  process.exit(1);
});

process.on('unhandledRejection', (reason, promise) => {
  log.error(`Unhandled Rejection in internal server at: ${promise}, reason: ${reason}`, { reason: String(reason) });
  console.error(`💥 Unhandled Rejection in internal server at: ${promise}, reason: ${reason}`);
  process.exit(1);
});

// Check command line arguments
const args = process.argv.slice(2);
if (args.includes('--internal-only') || args.includes('-i')) {
  startInternalOnly();
} else {
  console.log('Usage: tsx start-servers.ts [--internal-only | -i]');
  console.log('  --internal-only, -i    Start only the internal tools server');
  console.log('');
  console.log('To start both servers, use: npm start');
  console.log('To start only internal server, use: npm run start:internal');
} 