
/**
 * Import data to Google Cloud SQL PostgreSQL database
 * This script reads the exported data and imports it into Cloud SQL
 */

const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Cloud SQL Database connection (for direct connection - use when testing locally)
const CLOUD_SQL_URL = 'postgresql://hotel-shift-log-db:ebf4vem5mzx8yuy*FJE@34.133.148.252:5432/hotelshiftlog';

const IMPORT_FILE = path.join(__dirname, 'abacusai_data_export.json');

async function importData() {
  const client = new Client({
    connectionString: CLOUD_SQL_URL,
  });

  try {
    console.log('📖 Reading export file...');
    const exportData = JSON.parse(await fs.readFile(IMPORT_FILE, 'utf-8'));
    console.log('✅ Export file loaded\n');

    console.log('🔌 Connecting to Cloud SQL database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Import tables in dependency order
    const tables = [
      'users',
      'shift_reports',
      'attachments',
      'comments',
      'comment_likes',
      'daily_post_trackers',
      'report_acknowledgements',
      'accounts',
      'sessions',
      'verification_tokens'
    ];

    let totalImported = 0;

    for (const table of tables) {
      const rows = exportData[table] || [];
      
      if (rows.length === 0) {
        console.log(`⏭️  Skipping ${table} (no data)`);
        continue;
      }

      console.log(`📥 Importing ${rows.length} rows into ${table}...`);

      try {
        // Get column names from first row
        const columns = Object.keys(rows[0]);
        
        // Create parameterized query
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const values = columns.map(col => row[col]);
          const placeholders = columns.map((_, idx) => `$${idx + 1}`).join(', ');
          const columnList = columns.map(col => `"${col}"`).join(', ');
          
          const query = `INSERT INTO "${table}" (${columnList}) VALUES (${placeholders}) ON CONFLICT DO NOTHING`;
          
          await client.query(query, values);
          
          // Progress indicator
          if ((i + 1) % 10 === 0 || i === rows.length - 1) {
            process.stdout.write(`\r   Progress: ${i + 1}/${rows.length} rows`);
          }
        }
        
        console.log(`\n   ✓ Successfully imported ${rows.length} rows into ${table}`);
        totalImported += rows.length;
        
      } catch (error) {
        console.error(`\n   ❌ Error importing ${table}:`, error.message);
        // Continue with other tables
      }
    }

    console.log('\n📊 Import Summary:');
    console.log('─────────────────────────────────────');
    console.log(`   Total rows imported: ${totalImported}`);
    console.log('\n✅ Data import completed!');
    
  } catch (error) {
    console.error('❌ Import failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the import
importData();
