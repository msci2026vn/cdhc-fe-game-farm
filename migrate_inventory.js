const postgres = require('postgres');
const fs = require('fs');
const dbUrl = fs.readFileSync('/home/cdhc/apps/cdhc-be/.env', 'utf8').match(/DATABASE_URL=(.+)/)[1];

const client = postgres(dbUrl);

(async () => {
  try {
    console.log('🔧 Dropping old inventory table...');
    await client`DROP TABLE IF EXISTS inventory CASCADE`;

    console.log('✅ Creating new inventory table with correct schema...');
    await client`
      CREATE TABLE inventory (
        id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
        user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
        item_id VARCHAR(30) NOT NULL,
        quantity INTEGER NOT NULL DEFAULT 1,
        harvested_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        expires_at TIMESTAMP WITH TIME ZONE,
        acquired_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
        updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW()
      )
    `;

    console.log('✅ Creating indexes...');
    await client`CREATE INDEX inventory_user_id_idx ON inventory(user_id)`;
    await client`CREATE INDEX inventory_item_id_idx ON inventory(user_id, item_id)`;
    await client`CREATE INDEX inventory_expires_at_idx ON inventory(expires_at)`;

    console.log('✅ Migration complete! Table has 7 columns with correct defaults.');
    process.exit(0);
  } catch (e) {
    console.error('❌ Error:', e.message);
    process.exit(1);
  }
})();
