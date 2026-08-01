/**
 * Runs a SQL file against Supabase using the PostgREST rpc endpoint.
 * Usage: node scripts/run_sql_supabase.js <path-to-sql-file>
 */
const fs = require('fs');
const path = require('path');

const SUPABASE_URL = 'https://dotjlikaurcjwabarqcy.supabase.co';
// Service role key (has full DB access)
const SUPABASE_SERVICE_ROLE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImRvdGpsaWthdXJjandhYmFycWN5Iiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc2NTA4NjkxNCwiZXhwIjoyMDgwNjYyOTE0fQ.iDJT1JEshxxMHUiIVXgV3249CNCM-zCI-jaZthRmLz0';

async function main() {
  const sqlFile = process.argv[2];
  if (!sqlFile) {
    console.error('Usage: node run_sql_supabase.js <path-to-sql-file>');
    process.exit(1);
  }

  const sqlContent = fs.readFileSync(path.resolve(sqlFile), 'utf-8');
  console.log(`Executing SQL from: ${sqlFile}`);
  console.log(`SQL length: ${sqlContent.length} chars`);

  // Use the Supabase SQL endpoint (pg-meta)
  const response = await fetch(`${SUPABASE_URL}/rest/v1/rpc/`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'apikey': SUPABASE_SERVICE_ROLE_KEY,
      'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
    },
    body: JSON.stringify({ query: sqlContent }),
  });

  // If rpc doesn't work, try the pg-meta SQL query endpoint
  if (!response.ok) {
    console.log('RPC endpoint not available, trying pg-meta SQL endpoint...');
    
    // Execute each UPDATE statement individually via the REST API
    const statements = sqlContent
      .split(';')
      .map(s => s.trim())
      .filter(s => s.toUpperCase().startsWith('UPDATE'));

    console.log(`Found ${statements.length} UPDATE statements to execute.`);
    
    let success = 0;
    let failed = 0;

    for (const stmt of statements) {
      // Parse the UUID from the WHERE clause
      const idMatch = stmt.match(/WHERE\s+id\s*=\s*'([^']+)'/i);
      // Parse the SET values
      const regionMatch = stmt.match(/region\s*=\s*'([^']+)'/i);
      const cityMatch = stmt.match(/city\s*=\s*'([^']+)'/i);
      const locationMatch = stmt.match(/location\s*=\s*'(\{[^']+\})'/i);

      if (!idMatch) {
        console.log('  Skipping statement - no ID found');
        failed++;
        continue;
      }

      const id = idMatch[1];
      const updateBody = {};
      if (regionMatch) updateBody.region = regionMatch[1];
      if (cityMatch) updateBody.city = cityMatch[1];
      if (locationMatch) {
        try {
          updateBody.location = JSON.parse(locationMatch[1]);
        } catch {
          updateBody.location = locationMatch[1];
        }
      }

      const patchResponse = await fetch(
        `${SUPABASE_URL}/rest/v1/destinations?id=eq.${id}`,
        {
          method: 'PATCH',
          headers: {
            'Content-Type': 'application/json',
            'apikey': SUPABASE_SERVICE_ROLE_KEY,
            'Authorization': `Bearer ${SUPABASE_SERVICE_ROLE_KEY}`,
            'Prefer': 'return=representation',
          },
          body: JSON.stringify(updateBody),
        }
      );

      if (patchResponse.ok) {
        const result = await patchResponse.json();
        const name = result[0]?.name || result[0]?.title || id;
        console.log(`  ✓ Updated ${id.substring(0, 8)}... → ${updateBody.region}/${updateBody.city} (${name})`);
        success++;
      } else {
        const errText = await patchResponse.text();
        console.error(`  ✗ Failed ${id.substring(0, 8)}...: ${patchResponse.status} ${errText}`);
        failed++;
      }
    }

    console.log(`\nDone: ${success} succeeded, ${failed} failed out of ${statements.length} total.`);
    return;
  }

  const result = await response.json();
  console.log('Result:', JSON.stringify(result, null, 2));
}

main().catch(err => {
  console.error('Fatal error:', err);
  process.exit(1);
});
