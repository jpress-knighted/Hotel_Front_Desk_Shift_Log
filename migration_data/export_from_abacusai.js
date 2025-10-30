
/**
 * Export data from Abacus.AI PostgreSQL database
 * This script connects to the current Abacus.AI database and exports all data to JSON files
 */

const { Client } = require('pg');
const fs = require('fs').promises;
const path = require('path');

// Abacus.AI Database connection
const ABACUS_DB_URL = 'postgresql://role_170709f7da:ZkiCk3PqKd9NtQ47ZvDJCb6VLpg_EYNQ@db-170709f7da.db101.hosteddb.reai.io:5432/170709f7da?connect_timeout=15';

const EXPORT_DIR = __dirname;

async function exportData() {
  const client = new Client({
    connectionString: ABACUS_DB_URL,
  });

  try {
    console.log('🔌 Connecting to Abacus.AI database...');
    await client.connect();
    console.log('✅ Connected successfully!\n');

    // Define tables to export in dependency order
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

    const exportData = {};

    for (const table of tables) {
      try {
        console.log(`📦 Exporting ${table}...`);
        const result = await client.query(`SELECT * FROM "${table}"`);
        exportData[table] = result.rows;
        console.log(`   ✓ Exported ${result.rows.length} rows from ${table}`);
      } catch (error) {
        if (error.message.includes('does not exist')) {
          console.log(`   ⚠ Table ${table} does not exist, skipping...`);
          exportData[table] = [];
        } else {
          throw error;
        }
      }
    }

    // Save to JSON file
    const exportFile = path.join(EXPORT_DIR, 'abacusai_data_export.json');
    await fs.writeFile(exportFile, JSON.stringify(exportData, null, 2));
    console.log(`\n💾 Data exported successfully to: ${exportFile}`);

    // Generate summary
    console.log('\n📊 Export Summary:');
    console.log('─────────────────────────────────────');
    for (const [table, rows] of Object.entries(exportData)) {
      if (rows.length > 0) {
        console.log(`   ${table.padEnd(30)} ${rows.length} rows`);
      }
    }

    // Also create individual table files for easier inspection
    for (const [table, rows] of Object.entries(exportData)) {
      if (rows.length > 0) {
        const tableFile = path.join(EXPORT_DIR, `${table}.json`);
        await fs.writeFile(tableFile, JSON.stringify(rows, null, 2));
      }
    }

    console.log('\n✅ All data exported successfully!');
    
  } catch (error) {
    console.error('❌ Export failed:', error);
    process.exit(1);
  } finally {
    await client.end();
  }
}

// Run the export
exportData();
