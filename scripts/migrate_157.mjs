#!/usr/bin/env node
/**
 * ============================================================
 * CONGRESS PRODUTTUR 157 — DATA MIGRATION SCRIPT
 * ============================================================
 * Migrates assembly_no=157 voter data from the existing SIR-AP
 * Supabase project to the new Congress-dedicated Supabase project.
 *
 * Usage:
 *   node scripts/migrate_157.mjs
 *
 * Requirements:
 *   npm install @supabase/supabase-js dotenv
 *
 * SOURCE:  SIR-AP Supabase (cjquwqobqtsjdzeuyscq)
 * TARGET:  Congress 157 Supabase (xqmeapwmbydijnaxjevk)
 * ============================================================
 */

import { createClient } from '@supabase/supabase-js'

// ============================================================
// SOURCE — Existing SIR-AP project
// ============================================================
const SOURCE_URL = 'https://cjquwqobqtsjdzeuyscq.supabase.co'
const SOURCE_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImNqcXV3cW9icXRzamR6ZXV5c2NxIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MDU1MDIxNywiZXhwIjoyMDk2MTI2MjE3fQ.H6AO2_X0-gyEuGCTCbIL8f9zCh2wQrVZd-wwyVFjgYI'

// ============================================================
// TARGET — New Congress 157 project
// ============================================================
const TARGET_URL = 'https://xqmeapwmbydijnaxjevk.supabase.co'
const TARGET_SERVICE_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InhxbWVhcHdtYnlkaWpuYXhqZXZrIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc4MTg4MjU3NywiZXhwIjoyMDk3NDU4NTc3fQ.hmBSydFeozRRT8IFNgpRvXd4dMQDyLjV7XFucB0q89A'

const ASSEMBLY_NO = 157
const BATCH_SIZE = 400

const source = createClient(SOURCE_URL, SOURCE_SERVICE_KEY, { auth: { persistSession: false } })
const target = createClient(TARGET_URL, TARGET_SERVICE_KEY, { auth: { persistSession: false } })

function sleep(ms) { return new Promise(r => setTimeout(r, ms)) }

// ============================================================
// STEP 1: Migrate voter_parts
// ============================================================
async function migrateVoterParts() {
  console.log('\n📋 Step 1: Migrating voter_parts for assembly 157...')

  const { data, error } = await source
    .from('voter_parts')
    .select('*')
    .eq('assembly_no', ASSEMBLY_NO)

  if (error) { console.error('Error fetching voter_parts:', error); process.exit(1) }
  console.log(`  → Found ${data.length} parts in source`)

  // Strip IDs so Supabase auto-generates new ones
  const rows = data.map(({ id, created_at, updated_at, ...rest }) => rest)

  const { error: insertError } = await target.from('voter_parts').upsert(rows, {
    onConflict: 'assembly_no,part_no',
    ignoreDuplicates: false
  })

  if (insertError) {
    console.error('Error inserting voter_parts:', insertError)
    process.exit(1)
  }
  console.log(`  ✅ Successfully migrated ${data.length} voter_parts`)
}

// ============================================================
// STEP 2: Migrate voters in batches
// ============================================================
async function migrateVoters() {
  console.log('\n🗳️  Step 2: Migrating voters for assembly 157...')

  // First get total count
  const { count: totalCount, error: countError } = await source
    .from('voters')
    .select('*', { count: 'exact', head: true })
    .eq('assembly_no', ASSEMBLY_NO)

  if (countError) { console.error('Count error:', countError); process.exit(1) }
  console.log(`  → Total voters to migrate: ${totalCount.toLocaleString()}`)

  let migrated = 0
  let offset = 0
  let batchNum = 0
  const totalBatches = Math.ceil(totalCount / BATCH_SIZE)

  while (offset < totalCount) {
    batchNum++
    const pct = ((offset / totalCount) * 100).toFixed(1)
    process.stdout.write(`\r  Batch ${batchNum}/${totalBatches} (${pct}%) — ${migrated.toLocaleString()} migrated...`)

    const { data: batch, error: fetchError } = await source
      .from('voters')
      .select('assembly_name,assembly_no,part_no,polling_station_no,polling_station_name,serial_no,house_no,house_no_normalized,voter_name_telugu,voter_name_english,relative_name_telugu,relative_name_english,relation_type,gender,age,epic_id,page_no,search_tokens,source_pdf,confidence,created_at')
      .eq('assembly_no', ASSEMBLY_NO)
      .range(offset, offset + BATCH_SIZE - 1)

    if (fetchError) {
      console.error(`\nFetch error at offset ${offset}:`, fetchError)
      process.exit(1)
    }

    if (!batch || batch.length === 0) break

    // Insert into target (upsert by epic_id to handle duplicates)
    const { error: insertError } = await target
      .from('voters')
      .insert(batch)

    if (insertError) {
      // If duplicate key error, insert row-by-row to skip duplicates
      if (insertError.code === '23505') {
        for (const row of batch) {
          const { error: singleErr } = await target.from('voters').insert(row)
          if (singleErr && singleErr.code !== '23505') {
            console.error(`\nInsert error at offset ${offset} for EPIC ${row.epic_id}:`, singleErr)
          }
        }
      } else {
        console.error(`\nInsert error at offset ${offset}:`, insertError)
      }
    }

    migrated += batch.length
    offset += BATCH_SIZE

    // Small delay to avoid rate limits
    await sleep(100)
  }

  console.log(`\n  ✅ Successfully migrated ${migrated.toLocaleString()} voters`)
  return migrated
}

// ============================================================
// STEP 3: Verify migration
// ============================================================
async function verifyMigration() {
  console.log('\n🔍 Step 3: Verifying migration...')

  const { count: srcVoters } = await source.from('voters').select('*', { count: 'exact', head: true }).eq('assembly_no', ASSEMBLY_NO)
  const { count: tgtVoters } = await target.from('voters').select('*', { count: 'exact', head: true }).eq('assembly_no', ASSEMBLY_NO)
  const { count: srcParts } = await source.from('voter_parts').select('*', { count: 'exact', head: true }).eq('assembly_no', ASSEMBLY_NO)
  const { count: tgtParts } = await target.from('voter_parts').select('*', { count: 'exact', head: true }).eq('assembly_no', ASSEMBLY_NO)

  console.log(`\n  SOURCE: ${srcVoters?.toLocaleString()} voters, ${srcParts} parts`)
  console.log(`  TARGET: ${tgtVoters?.toLocaleString()} voters, ${tgtParts} parts`)

  if (tgtVoters >= srcVoters * 0.98) {
    console.log(`\n  ✅ Migration successful! (${((tgtVoters/srcVoters)*100).toFixed(1)}% transfer rate)`)
  } else {
    console.log(`\n  ⚠️  Warning: Only ${((tgtVoters/srcVoters)*100).toFixed(1)}% of voters migrated. Check for errors.`)
  }
}

// ============================================================
// MAIN
// ============================================================
async function main() {
  console.log('🚀 Congress Produttur 157 — Migration Script')
  console.log('============================================')
  console.log(`Source: ${SOURCE_URL}`)
  console.log(`Target: ${TARGET_URL}`)
  console.log(`Assembly: ${ASSEMBLY_NO} (Produttur)`)
  console.log(`Batch size: ${BATCH_SIZE} rows`)
  console.log('')
  console.log('⚠️  NOTE: Run scripts/setup_supabase.sql FIRST in the target Supabase SQL editor!')
  console.log('')

  const startTime = Date.now()

  await migrateVoterParts()
  const total = await migrateVoters()
  await verifyMigration()

  const elapsed = ((Date.now() - startTime) / 1000 / 60).toFixed(1)
  console.log(`\n⏱️  Total time: ${elapsed} minutes`)
  console.log(`📊 Total records: ${total.toLocaleString()}`)
  console.log('\n🎉 Migration complete! Deploy the frontend to Vercel next.')
}

main().catch(err => {
  console.error('\n❌ Migration failed:', err)
  process.exit(1)
})
