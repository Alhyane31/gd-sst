const { Client } = require('pg');
require('dotenv').config();
const client = new Client({ connectionString: process.env.DATABASE_URL });
client.connect().then(async () => {
  await client.query('ALTER TABLE "AvisSpecialise" ADD COLUMN IF NOT EXISTS "rapportUrl" TEXT');
  console.log('Done');
  await client.end();
});
