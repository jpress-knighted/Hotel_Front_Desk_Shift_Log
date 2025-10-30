/**
 * Test connection to Google Cloud SQL
 */

const { Client } = require('pg');

async function testConnection() {
  console.log(`\n🔍 Testing: Direct IP Connection`);
  console.log('─────────────────────────────────────');

  const client = new Client({
    user: 'hotelapp',
    password: 'R\\,H~(NC6aI$D=,K',
    host: '34.133.148.252',
    port: 5432,
    database: 'hotelshiftlog',
    ssl: {
      rejectUnauthorized: false,
    },
  });

  try {
    await client.connect();
    console.log('✅ Connection successful!');

    // Test query
    const result = await client.query('SELECT NOW() as current_time, version() as postgres_version');
    console.log('📊 Database Info:');
    console.log(`   Time: ${result.rows[0].current_time}`);
    console.log(`   Version: ${result.rows[0].postgres_version.split(' ')[0]} ${result.rows[0].postgres_version.split(' ')[1]}`);

    // Check existing tables
    const tables = await client.query(`
      SELECT tablename 
      FROM pg_tables 
      WHERE schemaname = 'public' 
      ORDER BY tablename
    `);
    
    console.log(`\n📋 Existing tables: ${tables.rows.length}`);
    if (tables.rows.length > 0) {
      tables.rows.forEach(row => console.log(`   - ${row.tablename}`));
    } else {
      console.log('   (No tables found - schema needs to be created)');
    }
    
    await client.end();
    return true;
  } catch (error) {
    console.error('❌ Connection failed:', error.message);
    return false;
  }
}

async function runTests() {
  console.log('🧪 Google Cloud SQL Connection Test');
  console.log('═══════════════════════════════════════');

  await testConnection();

  console.log('\n✅ Connection tests completed!');
}

runTests();