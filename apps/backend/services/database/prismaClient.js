const { PrismaPg } = require('@prisma/adapter-pg');
const { PrismaClient } = require('../../../../generated/prisma');
require('dotenv').config(); 

const connectionString = process.env.DATABASE_URL;
if (!connectionString) {
  throw new Error('DATABASE_URL environment variable is required for PrismaClient');
}

// PrismaPg accepts pg.PoolConfig. Use ssl: { rejectUnauthorized: false } when
// the DB uses a self-signed cert and you need to skip TLS verification.
// Set DATABASE_SSL_NO_VERIFY=1 in .env to enable. Prefer fixing certificates in production.
const poolConfig = { connectionString };
if (process.env.DATABASE_SSL_NO_VERIFY === '1' || process.env.DATABASE_SSL_NO_VERIFY === 'true') {
  poolConfig.ssl = { rejectUnauthorized: false };
}

const adapter = new PrismaPg(poolConfig);
const prisma = new PrismaClient({ adapter });

module.exports = prisma;
