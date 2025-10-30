
/**
 * Test connection to Google Cloud SQL
 */

const { Client } = require('pg');

// Test both connection methods
const connections = {
  'Direct IP Connection': 'postgresql://hotel-shift-log-db:ebf4vem5mzx8yuy*FJE@34.133.148.252:5432/hotelshiftlog',
  'Unix Socket Connection (Cloud Run)': 'postgresql://hotel-shift-log-db:ebf4vem5mzx8yuy*FJE@/hotelshiftlog?host=/cloudsql/houston-front-desk-shift-logs:us-central1:hotel-shift-log-db'
};

async function testConnection(name, connectionString) {
  console.log(`\n🔍 Testing: ${name}`);
  console.log('─────────────────────────────────────');
  
  const client = new Client({ connectionString });

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
  
  for (const [name, connString] of Object.entries(connections)) {
    // Skip Unix socket test if not in Cloud Run environment
    if (name.includes('Unix Socket') && !process.env.GOOGLE_CLOUD_PROJECT) {
      console.log(`\n⏭️  Skipping: ${name}`);
      console.log('   (Only works in Cloud Run environment)');
      continue;
    }
    
    await testConnection(name, connString);
  }
  
  console.log('\n✅ Connection tests completed!');
}

runTests();
