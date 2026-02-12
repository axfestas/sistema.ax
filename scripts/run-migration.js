#!/usr/bin/env node

/**
 * Migration Runner Script
 * 
 * This script helps execute migration files against the D1 database.
 * Usage: node scripts/run-migration.js <migration-file>
 * 
 * Example:
 * node scripts/run-migration.js migrations/008_add_portfolio_image_size.sql
 */

const { execSync } = require('child_process');
const fs = require('fs');
const path = require('path');

// Get migration file from command line argument
const migrationFile = process.argv[2];

if (!migrationFile) {
  console.error('❌ Error: Please provide a migration file path');
  console.log('\nUsage: node scripts/run-migration.js <migration-file>');
  console.log('Example: node scripts/run-migration.js migrations/008_add_portfolio_image_size.sql');
  process.exit(1);
}

// Check if file exists
const fullPath = path.resolve(migrationFile);
if (!fs.existsSync(fullPath)) {
  console.error(`❌ Error: Migration file not found: ${fullPath}`);
  process.exit(1);
}

// Database name from wrangler.toml
const DATABASE_NAME = 'sistema';

console.log('🔄 Running migration...');
console.log(`📁 File: ${migrationFile}`);
console.log(`💾 Database: ${DATABASE_NAME}`);
console.log('');

try {
  // Execute migration using wrangler
  const command = `npx wrangler d1 execute ${DATABASE_NAME} --file=${migrationFile}`;
  console.log(`▶️  ${command}`);
  console.log('');
  
  execSync(command, { stdio: 'inherit' });
  
  console.log('');
  console.log('✅ Migration completed successfully!');
} catch (error) {
  console.error('');
  console.error('❌ Migration failed!');
  console.error('Error:', error.message);
  process.exit(1);
}
