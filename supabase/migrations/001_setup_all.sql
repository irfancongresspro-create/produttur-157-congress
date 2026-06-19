-- ============================================================
-- VOTER SEARCH SIR AP — DATABASE MIGRATION 001
-- Schema setup with all indexes
-- ============================================================

-- Enable required extensions
CREATE EXTENSION IF NOT EXISTS vector;
CREATE EXTENSION IF NOT EXISTS pg_trgm;       -- trigram fuzzy match (typos)
CREATE EXTENSION IF NOT EXISTS unaccent;       -- accent-insensitive search
CREATE EXTENSION IF NOT EXISTS fuzzystrmatch;  -- soundex + levenshtein (phonetic)

-- ============================================================
-- TABLE: extraction_jobs
-- Background job queue for PDF processing
-- ============================================================
CREATE TABLE IF NOT EXISTS extraction_jobs (
  id              UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assembly_name   TEXT NOT NULL,
  assembly_no     INTEGER NOT NULL,
  part_no         INTEGER NOT NULL,
  source_pdf      TEXT NOT NULL,
  status          TEXT NOT NULL DEFAULT 'pending'
                    CHECK (status IN ('pending','running','done','error')),
  total_pages     INTEGER DEFAULT 0,
  processed_pages INTEGER DEFAULT 0,
  total_voters    INTEGER DEFAULT 0,
  error_message   TEXT,
  created_at      TIMESTAMPTZ DEFAULT NOW(),
  updated_at      TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- TABLE: voter_parts
-- Tracks uploaded part books
-- ============================================================
CREATE TABLE IF NOT EXISTS voter_parts (
  id                    UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assembly_name         TEXT NOT NULL,
  assembly_no           INTEGER NOT NULL,
  part_no               INTEGER NOT NULL,
  polling_station_no    INTEGER,
  polling_station_name  TEXT,
  source_pdf            TEXT,
  voter_count           INTEGER DEFAULT 0,
  created_at            TIMESTAMPTZ DEFAULT NOW(),
  updated_at            TIMESTAMPTZ DEFAULT NOW(),
  UNIQUE (assembly_no, part_no)
);

-- ============================================================
-- TABLE: voters
-- Main voter records with all indexed fields
-- ============================================================
CREATE TABLE IF NOT EXISTS voters (
  id                      UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  assembly_name           TEXT NOT NULL,
  assembly_no             INTEGER NOT NULL,
  part_no                 INTEGER NOT NULL,
  polling_station_no      INTEGER,
  polling_station_name    TEXT,
  serial_no               INTEGER NOT NULL,
  house_no                TEXT,
  house_no_normalized     NUMERIC,
  voter_name_telugu       TEXT,
  voter_name_english      TEXT,
  relative_name_telugu    TEXT,
  relative_name_english   TEXT,
  relation_type           TEXT,
  gender                  TEXT,
  age                     INTEGER,
  epic_id                 TEXT,
  page_no                 INTEGER,
  search_tokens           TEXT[] NOT NULL DEFAULT '{}',
  name_embedding          vector(768),
  source_pdf              TEXT,
  confidence              TEXT DEFAULT 'high'
                            CHECK (confidence IN ('high','medium','low')),
  created_at              TIMESTAMPTZ DEFAULT NOW()
);

-- ============================================================
-- INDEXES
-- ============================================================

-- GIN index on search_tokens array for @> queries
CREATE INDEX IF NOT EXISTS idx_voters_search_tokens
  ON voters USING GIN (search_tokens);

-- GIN index for pg_trgm similarity searches on name fields
CREATE INDEX IF NOT EXISTS idx_voters_voter_name_english_trgm
  ON voters USING GIN (voter_name_english gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_voters_voter_name_telugu_trgm
  ON voters USING GIN (voter_name_telugu gin_trgm_ops);

CREATE INDEX IF NOT EXISTS idx_voters_relative_name_english_trgm
  ON voters USING GIN (relative_name_english gin_trgm_ops);

-- HNSW index on name_embedding for fast ANN search
CREATE INDEX IF NOT EXISTS idx_voters_name_embedding_hnsw
  ON voters USING hnsw (name_embedding vector_cosine_ops)
  WITH (m = 16, ef_construction = 64);

-- B-tree indexes
CREATE UNIQUE INDEX IF NOT EXISTS idx_voters_epic_id
  ON voters (epic_id) WHERE epic_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_voters_house_no_normalized
  ON voters (house_no_normalized);

CREATE INDEX IF NOT EXISTS idx_voters_serial_no
  ON voters (serial_no);

CREATE INDEX IF NOT EXISTS idx_voters_assembly_part
  ON voters (assembly_no, part_no);

CREATE INDEX IF NOT EXISTS idx_voters_assembly_no
  ON voters (assembly_no);

-- ============================================================
-- ENABLE RLS (Row Level Security)
-- ============================================================
ALTER TABLE voters ENABLE ROW LEVEL SECURITY;
ALTER TABLE voter_parts ENABLE ROW LEVEL SECURITY;
ALTER TABLE extraction_jobs ENABLE ROW LEVEL SECURITY;

-- Allow anon read on voters and voter_parts
CREATE POLICY "Public read voters"
  ON voters FOR SELECT TO anon USING (true);

CREATE POLICY "Public read voter_parts"
  ON voter_parts FOR SELECT TO anon USING (true);

CREATE POLICY "Public read extraction_jobs"
  ON extraction_jobs FOR SELECT TO anon USING (true);

-- Allow service_role full access (for API routes)
CREATE POLICY "Service full access voters"
  ON voters FOR ALL TO service_role USING (true);

CREATE POLICY "Service full access voter_parts"
  ON voter_parts FOR ALL TO service_role USING (true);

CREATE POLICY "Service full access extraction_jobs"
  ON extraction_jobs FOR ALL TO service_role USING (true);
-- ============================================================
-- Migration 006: Add search_name_canonical column
-- This stores the canonical consonant skeleton of the voter name
-- so that Khader / Khadar / Qadir all resolve to "khdr"
-- and a search for any of them hits a fast index lookup.
-- ============================================================

-- 1. Add the column
ALTER TABLE voters ADD COLUMN IF NOT EXISTS search_name_canonical TEXT DEFAULT '';

-- 2. Create a B-Tree index on it for fast canonical lookups
CREATE INDEX IF NOT EXISTS idx_voters_canonical ON voters (search_name_canonical) 
WHERE search_name_canonical IS NOT NULL AND search_name_canonical != '';

-- 3. Create trigram index on canonical too (for partial canonical matches)
CREATE INDEX IF NOT EXISTS idx_voters_canonical_trgm ON voters 
USING GIN (search_name_canonical gin_trgm_ops)
WHERE search_name_canonical IS NOT NULL AND search_name_canonical != '';

-- NOTE: Existing rows will have search_name_canonical = ''.
-- Run the re-index script (007_reindex_canonical.sql) to backfill them.
-- New voters inserted after this migration will have canonical set automatically
-- by the application layer (gemini-client.ts enrichVotersBatch).
-- ============================================================
-- Migration 008: NYSIIS Phonetic Function (Layer 1 - SQL Side)
--               BM25-style Ranking Upgrade (Layer 2)
--               NYSIIS + Skeleton token lookups in search
--
-- All 100% free, all inside PostgreSQL. Zero new services.
-- ============================================================

-- --------------------------------------------------------
-- LAYER 1: NYSIIS function in PostgreSQL
-- Same algorithm as tokenizer.ts — runs at search time
-- so we can compute nysiis(user_query) and match against
-- the ~nysiis_code tokens stored in search_tokens array.
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION nysiis(input_name TEXT)
RETURNS TEXT AS $$
DECLARE
  s TEXT;
  result TEXT;
  first_char TEXT;
  i INTEGER;
  c TEXT;
  rep TEXT;
  prev TEXT;
BEGIN
  IF input_name IS NULL OR trim(input_name) = '' THEN RETURN ''; END IF;
  
  -- Clean: uppercase, letters only
  s := regexp_replace(upper(trim(input_name)), '[^A-Z]', '', 'g');
  IF length(s) = 0 THEN RETURN ''; END IF;

  -- Step 1: Transcode beginning
  IF s LIKE 'QH%' OR s LIKE 'KH%' THEN s := 'K' || substr(s, 3);
  ELSIF s LIKE 'MAC%' THEN s := 'MCC' || substr(s, 4);
  ELSIF s LIKE 'KN%'  THEN s := 'N'   || substr(s, 3);
  ELSIF s LIKE 'SCH%' THEN s := 'SSS' || substr(s, 4);
  ELSIF s LIKE 'PH%'  THEN s := 'FF'  || substr(s, 3);
  ELSIF s LIKE 'PF%'  THEN s := 'FF'  || substr(s, 3);
  ELSIF s LIKE 'K%'   THEN s := 'C'   || substr(s, 2);
  ELSIF s LIKE 'Q%'   THEN s := 'K'   || substr(s, 2);
  END IF;

  -- Step 2: Transcode end
  IF   s LIKE '%EE' OR s LIKE '%IE' THEN s := substr(s,1,length(s)-2) || 'Y';
  ELSIF s LIKE '%DT' OR s LIKE '%RT' OR s LIKE '%RD'
     OR s LIKE '%NT' OR s LIKE '%ND' THEN
    s := substr(s,1,length(s)-2) || 'D';
  END IF;

  -- Step 3: Store first character
  first_char := substr(s, 1, 1);
  result := first_char;

  -- Step 4: Process remaining characters
  i := 2;
  WHILE i <= length(s) LOOP
    c := substr(s, i, 1);
    rep := c;

    -- EV → AF
    IF c = 'E' AND i < length(s) AND substr(s, i+1, 1) = 'V' THEN
      rep := 'AF'; i := i + 1;
    -- All vowels → A
    ELSIF c IN ('A','E','I','O','U') THEN rep := 'A';
    ELSIF c = 'Q' THEN rep := 'G';
    ELSIF c = 'Z' THEN rep := 'S';
    ELSIF c = 'M' THEN rep := 'N';
    ELSIF c = 'K' THEN
      IF i < length(s) AND substr(s,i+1,1) = 'N' THEN rep := 'N';
      ELSE rep := 'C';
      END IF;
    ELSIF c = 'P' AND i < length(s) AND substr(s,i+1,1) = 'H' THEN
      rep := 'F'; i := i + 1;
    -- GH → silent (Mughal, Baghdadi)
    ELSIF c = 'G' AND i < length(s) AND substr(s,i+1,1) = 'H' THEN
      rep := ''; i := i + 1;
    END IF;

    -- Don't repeat last character
    IF rep != '' AND rep != substr(result, length(result), 1) THEN
      result := result || rep;
    END IF;

    i := i + 1;
  END LOOP;

  -- Remove trailing S
  IF length(result) > 1 AND result LIKE '%S' THEN
    result := substr(result, 1, length(result) - 1);
  END IF;

  RETURN lower(result);
END;
$$ LANGUAGE plpgsql IMMUTABLE STRICT PARALLEL SAFE;

-- Index for fast NYSIIS lookups (optional but recommended)
-- The main search uses search_tokens @> ARRAY['~' || nysiis(query)]
-- which hits the existing GIN index. This is just for direct column queries.
COMMENT ON FUNCTION nysiis(TEXT) IS 
  'NYSIIS phonetic algorithm - superior to Soundex for Indian/Urdu names. 
   Khader/Khadar/Qadir/Kadir all produce similar codes.
   Used at search time: nysiis(query) matches tokens prefixed with ~ in search_tokens.';

-- --------------------------------------------------------
-- LAYER 2: BM25-style ranking
-- PostgreSQL ts_rank_cd (Cover Density ranking) is the
-- closest free built-in to BM25. It gives higher scores
-- to documents where query terms appear close together
-- and penalizes very common terms (like Mohammed).
-- 
-- We also create a weighted tsvector column that gives
-- more importance to the voter name (weight A = 1.0)
-- vs relative name (weight B = 0.4).
-- --------------------------------------------------------

-- Add a pre-computed weighted tsvector column for BM25-style search
ALTER TABLE voters ADD COLUMN IF NOT EXISTS search_vector TSVECTOR;

-- Populate it for existing rows
UPDATE voters
SET search_vector = 
  setweight(to_tsvector('simple', coalesce(voter_name_english, '')), 'A') ||
  setweight(to_tsvector('simple', coalesce(relative_name_english, '')), 'B') ||
  setweight(to_tsvector('simple', coalesce(voter_name_telugu, '')), 'C')
WHERE search_vector IS NULL;

-- GIN index on the tsvector for fast BM25 search
CREATE INDEX IF NOT EXISTS idx_voters_search_vector 
ON voters USING GIN (search_vector);

-- Trigger to keep search_vector updated automatically on insert/update
CREATE OR REPLACE FUNCTION update_search_vector()
RETURNS TRIGGER AS $$
BEGIN
  NEW.search_vector :=
    setweight(to_tsvector('simple', coalesce(NEW.voter_name_english, '')), 'A') ||
    setweight(to_tsvector('simple', coalesce(NEW.relative_name_english, '')), 'B') ||
    setweight(to_tsvector('simple', coalesce(NEW.voter_name_telugu, '')), 'C');
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS voters_search_vector_trigger ON voters;
CREATE TRIGGER voters_search_vector_trigger
  BEFORE INSERT OR UPDATE OF voter_name_english, relative_name_english, voter_name_telugu
  ON voters
  FOR EACH ROW EXECUTE FUNCTION update_search_vector();

-- --------------------------------------------------------
-- FINAL: Upgrade search_voters to use all 3 layers
-- Key upgrades in this version:
--   1. NYSIIS token lookup (search_tokens @> ['~' + nysiis(query)])  
--   2. Skeleton token lookup (search_tokens @> ['^' + skeleton(query)])
--   3. BM25-style ranking via ts_rank_cd on weighted search_vector
--   4. All existing layers preserved
-- --------------------------------------------------------
CREATE OR REPLACE FUNCTION search_voters(
  query_text        TEXT,
  p_telugu_query    TEXT    DEFAULT NULL,
  p_limit           INTEGER DEFAULT 20,
  p_assembly_no     INTEGER DEFAULT NULL,
  p_part_no         INTEGER DEFAULT NULL,
  p_relative_name   TEXT    DEFAULT NULL,
  p_canonical_query TEXT    DEFAULT NULL,
  p_nysiis_query    TEXT    DEFAULT NULL
)
RETURNS TABLE (
  id                    UUID,
  assembly_name         TEXT,
  assembly_no           INTEGER,
  part_no               INTEGER,
  polling_station_no    INTEGER,
  polling_station_name  TEXT,
  serial_no             INTEGER,
  house_no              TEXT,
  house_no_normalized   NUMERIC,
  voter_name_telugu     TEXT,
  voter_name_english    TEXT,
  relative_name_telugu  TEXT,
  relative_name_english TEXT,
  relation_type         TEXT,
  gender                TEXT,
  age                   INTEGER,
  epic_id               TEXT,
  page_no               INTEGER,
  confidence            TEXT,
  extraction_engine     TEXT,
  match_type            TEXT,
  match_score           FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  clean_query      TEXT;
  clean_relative   TEXT;
  canonical_query  TEXT;
  nysiis_query     TEXT;
  nysiis_token     TEXT;
  bm25_query       TSQUERY;
BEGIN
  clean_query    := lower(trim(query_text));
  clean_relative := lower(trim(COALESCE(p_relative_name, '')));
  IF clean_relative = '' THEN clean_relative := NULL; END IF;

  -- Use app-computed canonical or fall back to raw query
  canonical_query := COALESCE(p_canonical_query, clean_query);

  -- Use app-computed NYSIIS or compute it here
  nysiis_query := COALESCE(p_nysiis_query, nysiis(clean_query));
  nysiis_token := '~' || nysiis_query;

  -- BM25 query: plainto_tsquery with 'simple' config (no stemming)
  -- 'simple' is used so "Abdul" matches "Abdul" not "abdulat"
  BEGIN
    bm25_query := plainto_tsquery('simple', clean_query);
  EXCEPTION WHEN OTHERS THEN
    bm25_query := NULL;
  END;

  RETURN QUERY
  WITH

  -- -----------------------------------------------
  -- STEP 1: Exact match — EPIC ID / serial / house
  -- -----------------------------------------------
  exact_match AS (
    SELECT v.id, v.assembly_name, v.assembly_no, v.part_no,
           v.polling_station_no, v.polling_station_name,
           v.serial_no, v.house_no, v.house_no_normalized,
           v.voter_name_telugu, v.voter_name_english,
           v.relative_name_telugu, v.relative_name_english,
           v.relation_type, v.gender, v.age, v.epic_id,
           v.page_no, v.confidence, v.source_pdf,
           'EXACT'::TEXT, 1.0::FLOAT
    FROM voters v
    WHERE (
      v.epic_id = query_text
      OR v.serial_no::TEXT = clean_query
      OR lower(v.house_no) = clean_query
    )
    AND (p_assembly_no IS NULL OR v.assembly_no = p_assembly_no)
    AND (p_part_no     IS NULL OR v.part_no     = p_part_no)
    AND (clean_relative IS NULL
         OR lower(v.relative_name_english) LIKE '%'||clean_relative||'%'
         OR v.relative_name_telugu         LIKE '%'||clean_relative||'%')
  ),

  -- -----------------------------------------------
  -- STEP 2: Exact name match
  -- -----------------------------------------------
  exact_name AS (
    SELECT v.id, v.assembly_name, v.assembly_no, v.part_no,
           v.polling_station_no, v.polling_station_name,
           v.serial_no, v.house_no, v.house_no_normalized,
           v.voter_name_telugu, v.voter_name_english,
           v.relative_name_telugu, v.relative_name_english,
           v.relation_type, v.gender, v.age, v.epic_id,
           v.page_no, v.confidence, v.source_pdf,
           'EXACT'::TEXT, 0.98::FLOAT
    FROM voters v
    WHERE NOT EXISTS (SELECT 1 FROM exact_match x WHERE x.id = v.id)
    AND (
      lower(v.voter_name_english)   = clean_query
      OR v.voter_name_telugu        = query_text
      OR (p_telugu_query IS NOT NULL AND v.voter_name_telugu = p_telugu_query)
      OR lower(v.relative_name_english) = clean_query
      OR (p_telugu_query IS NOT NULL AND v.relative_name_telugu = p_telugu_query)
    )
    AND (p_assembly_no IS NULL OR v.assembly_no = p_assembly_no)
    AND (p_part_no     IS NULL OR v.part_no     = p_part_no)
    AND (clean_relative IS NULL
         OR lower(v.relative_name_english) LIKE '%'||clean_relative||'%'
         OR v.relative_name_telugu         LIKE '%'||clean_relative||'%')
  ),

  -- -----------------------------------------------
  -- STEP 3: Canonical + NYSIIS token match (FASTEST phonetic path)
  -- Both stored as tokens in the GIN-indexed search_tokens array.
  -- canonical token (khdr), nysiis token (~kadar), skeleton token (^ktr)
  -- -----------------------------------------------
  phonetic_token_match AS (
    SELECT v.id, v.assembly_name, v.assembly_no, v.part_no,
           v.polling_station_no, v.polling_station_name,
           v.serial_no, v.house_no, v.house_no_normalized,
           v.voter_name_telugu, v.voter_name_english,
           v.relative_name_telugu, v.relative_name_english,
           v.relation_type, v.gender, v.age, v.epic_id,
           v.page_no, v.confidence, v.source_pdf,
           'CLOSE'::TEXT,
           CASE
             WHEN v.search_tokens @> ARRAY[nysiis_token]      THEN 0.96
             WHEN v.search_tokens @> ARRAY[canonical_query]   THEN 0.95
             WHEN v.search_name_canonical LIKE '%'||canonical_query||'%' THEN 0.94
             ELSE 0.92
           END::FLOAT
    FROM voters v
    WHERE NOT EXISTS (SELECT 1 FROM exact_match x WHERE x.id = v.id)
    AND   NOT EXISTS (SELECT 1 FROM exact_name  x WHERE x.id = v.id)
    AND (
      -- NYSIIS token lookup (Layer 1) — catches Qadir/Khader/Kadir
      v.search_tokens @> ARRAY[nysiis_token]
      -- Canonical token lookup (Layer 1b) — catches Khadar/Khader
      OR v.search_tokens @> ARRAY[canonical_query]
      -- Canonical column fuzzy (broader)
      OR v.search_name_canonical LIKE '%'||canonical_query||'%'
      -- Skeleton token lookup (Layer 3 — Indic phoneme bridge)
      OR (length(clean_query) > 3 AND EXISTS (
        SELECT 1 FROM unnest(v.search_tokens) t
        WHERE t LIKE '^%' AND similarity(t, '^'||clean_query) > 0.5
      ))
    )
    AND (p_assembly_no IS NULL OR v.assembly_no = p_assembly_no)
    AND (p_part_no     IS NULL OR v.part_no     = p_part_no)
    AND (clean_relative IS NULL
         OR lower(v.relative_name_english) LIKE '%'||clean_relative||'%'
         OR v.relative_name_telugu         LIKE '%'||clean_relative||'%')
  ),

  -- -----------------------------------------------
  -- STEP 4: Prefix match
  -- -----------------------------------------------
  prefix_match AS (
    SELECT v.id, v.assembly_name, v.assembly_no, v.part_no,
           v.polling_station_no, v.polling_station_name,
           v.serial_no, v.house_no, v.house_no_normalized,
           v.voter_name_telugu, v.voter_name_english,
           v.relative_name_telugu, v.relative_name_english,
           v.relation_type, v.gender, v.age, v.epic_id,
           v.page_no, v.confidence, v.source_pdf,
           'CLOSE'::TEXT, 0.90::FLOAT
    FROM voters v
    WHERE NOT EXISTS (SELECT 1 FROM exact_match       x WHERE x.id = v.id)
    AND   NOT EXISTS (SELECT 1 FROM exact_name        x WHERE x.id = v.id)
    AND   NOT EXISTS (SELECT 1 FROM phonetic_token_match x WHERE x.id = v.id)
    AND (
      lower(v.voter_name_english)       LIKE clean_query||'%'
      OR lower(v.relative_name_english) LIKE clean_query||'%'
      OR v.voter_name_telugu            LIKE query_text||'%'
      OR (p_telugu_query IS NOT NULL AND v.voter_name_telugu LIKE p_telugu_query||'%')
      OR lower(v.house_no)              LIKE clean_query||'%'
    )
    AND (p_assembly_no IS NULL OR v.assembly_no = p_assembly_no)
    AND (p_part_no     IS NULL OR v.part_no     = p_part_no)
    AND (clean_relative IS NULL
         OR lower(v.relative_name_english) LIKE '%'||clean_relative||'%'
         OR v.relative_name_telugu         LIKE '%'||clean_relative||'%')
  ),

  -- -----------------------------------------------
  -- STEP 5: Word-by-word fuzzy + dmetaphone_alt + soundex
  -- -----------------------------------------------
  fuzzy_match AS (
    SELECT v.id, v.assembly_name, v.assembly_no, v.part_no,
           v.polling_station_no, v.polling_station_name,
           v.serial_no, v.house_no, v.house_no_normalized,
           v.voter_name_telugu, v.voter_name_english,
           v.relative_name_telugu, v.relative_name_english,
           v.relation_type, v.gender, v.age, v.epic_id,
           v.page_no, v.confidence, v.source_pdf,
           CASE
             WHEN GREATEST(
               COALESCE((SELECT MAX(word_similarity(clean_query,w)) FROM unnest(string_to_array(lower(v.voter_name_english),' ')) w),0),
               COALESCE((SELECT MAX(word_similarity(clean_query,w)) FROM unnest(string_to_array(lower(v.relative_name_english),' ')) w),0)
             ) > 0.75 THEN 'CLOSE'::TEXT
             ELSE 'POSSIBLE'::TEXT
           END,
           GREATEST(
             -- LAYER 2: BM25-style rank (ts_rank_cd weights: {D,C,B,A})
             CASE WHEN bm25_query IS NOT NULL AND v.search_vector @@ bm25_query
               THEN ts_rank_cd('{0.1,0.2,0.4,1.0}', v.search_vector, bm25_query)::FLOAT
               ELSE 0.0 END,
             -- Word-by-word similarity (core fix for Khader/Khadar)
             COALESCE((SELECT MAX(word_similarity(clean_query,w)) FROM unnest(string_to_array(lower(v.voter_name_english),' ')) w),0)::FLOAT,
             COALESCE((SELECT MAX(word_similarity(clean_query,w)) FROM unnest(string_to_array(lower(v.relative_name_english),' ')) w),0)::FLOAT
           )::FLOAT
    FROM voters v
    WHERE NOT EXISTS (SELECT 1 FROM exact_match          x WHERE x.id = v.id)
    AND   NOT EXISTS (SELECT 1 FROM exact_name           x WHERE x.id = v.id)
    AND   NOT EXISTS (SELECT 1 FROM phonetic_token_match x WHERE x.id = v.id)
    AND   NOT EXISTS (SELECT 1 FROM prefix_match         x WHERE x.id = v.id)
    AND (
      -- Word-by-word similarity
      EXISTS (SELECT 1 FROM unnest(string_to_array(lower(v.voter_name_english),' ')) w WHERE word_similarity(clean_query,w) > 0.50)
      OR EXISTS (SELECT 1 FROM unnest(string_to_array(lower(v.relative_name_english),' ')) w WHERE word_similarity(clean_query,w) > 0.50)
      -- Telugu similarity
      OR (p_telugu_query IS NOT NULL AND word_similarity(p_telugu_query, v.voter_name_telugu) > 0.4)
      -- GIN token partial match
      OR EXISTS (SELECT 1 FROM unnest(v.search_tokens) t WHERE similarity(t,clean_query) > 0.40)
      -- dmetaphone word-by-word (+ alt code)
      OR EXISTS (
        SELECT 1 FROM unnest(string_to_array(lower(v.voter_name_english),' ')) w
        WHERE length(clean_query) > 3 AND (
          dmetaphone(w) = dmetaphone(clean_query)
          OR dmetaphone_alt(w) = dmetaphone(clean_query)
          OR dmetaphone(w) = dmetaphone_alt(clean_query)
        )
      )
      -- soundex word-by-word (vowel variations)
      OR EXISTS (
        SELECT 1 FROM unnest(string_to_array(lower(v.voter_name_english),' ')) w
        WHERE length(clean_query) > 3 AND soundex(w) = soundex(clean_query)
      )
      -- LAYER 2: BM25 full-text
      OR (bm25_query IS NOT NULL AND v.search_vector @@ bm25_query)
      -- Contains fallback
      OR lower(v.voter_name_english) LIKE '%'||clean_query||'%'
    )
    AND (p_assembly_no IS NULL OR v.assembly_no = p_assembly_no)
    AND (p_part_no     IS NULL OR v.part_no     = p_part_no)
    AND (clean_relative IS NULL
         OR lower(v.relative_name_english) LIKE '%'||clean_relative||'%'
         OR v.relative_name_telugu         LIKE '%'||clean_relative||'%')
  ),

  -- -----------------------------------------------
  -- STEP 6: Levenshtein word-by-word (last resort)
  -- -----------------------------------------------
  levenshtein_match AS (
    SELECT v.id, v.assembly_name, v.assembly_no, v.part_no,
           v.polling_station_no, v.polling_station_name,
           v.serial_no, v.house_no, v.house_no_normalized,
           v.voter_name_telugu, v.voter_name_english,
           v.relative_name_telugu, v.relative_name_english,
           v.relation_type, v.gender, v.age, v.epic_id,
           v.page_no, v.confidence, v.source_pdf,
           'POSSIBLE'::TEXT, 0.70::FLOAT
    FROM voters v
    WHERE NOT EXISTS (SELECT 1 FROM exact_match          x WHERE x.id = v.id)
    AND   NOT EXISTS (SELECT 1 FROM exact_name           x WHERE x.id = v.id)
    AND   NOT EXISTS (SELECT 1 FROM phonetic_token_match x WHERE x.id = v.id)
    AND   NOT EXISTS (SELECT 1 FROM prefix_match         x WHERE x.id = v.id)
    AND   NOT EXISTS (SELECT 1 FROM fuzzy_match          x WHERE x.id = v.id)
    AND length(clean_query) > 4
    AND (
      EXISTS (
        SELECT 1 FROM unnest(string_to_array(lower(v.voter_name_english),' ')) w
        WHERE length(w) > 3 AND levenshtein_less_equal(w, clean_query, 2) <= 2
      )
      OR EXISTS (
        SELECT 1 FROM unnest(string_to_array(lower(v.relative_name_english),' ')) w
        WHERE length(w) > 3 AND levenshtein_less_equal(w, clean_query, 2) <= 2
      )
    )
    AND (p_assembly_no IS NULL OR v.assembly_no = p_assembly_no)
    AND (p_part_no     IS NULL OR v.part_no     = p_part_no)
    AND (clean_relative IS NULL
         OR lower(v.relative_name_english) LIKE '%'||clean_relative||'%'
         OR v.relative_name_telugu         LIKE '%'||clean_relative||'%')
  ),

  -- -----------------------------------------------
  -- Combine + dedup by highest score
  -- -----------------------------------------------
  combined AS (
    SELECT * FROM exact_match
    UNION ALL SELECT * FROM exact_name
    UNION ALL SELECT * FROM phonetic_token_match
    UNION ALL SELECT * FROM prefix_match
    UNION ALL SELECT * FROM fuzzy_match
    UNION ALL SELECT * FROM levenshtein_match
  ),
  deduped AS (
    SELECT DISTINCT ON (id) *
    FROM combined
    ORDER BY id, match_score DESC
  )

  SELECT * FROM deduped
  ORDER BY match_score DESC, house_no_normalized ASC NULLS LAST
  LIMIT p_limit;
END;
$$;

-- Phase 1: Typo Tolerance using pg_trgm

-- 1. Enable the extension
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- 2. Create trigram index for blazing fast similarity matching
CREATE INDEX IF NOT EXISTS idx_voters_name_eng_trgm 
ON voters USING GIN (voter_name_english gin_trgm_ops);

-- 3. Create a dedicated fuzzy search RPC to act as the final fallback layer
CREATE OR REPLACE FUNCTION fuzzy_search_voters(
  query_text TEXT,
  p_limit INTEGER DEFAULT 20
)
RETURNS TABLE (
  id UUID,
  assembly_name TEXT,
  assembly_no INTEGER,
  part_no INTEGER,
  polling_station_no INTEGER,
  polling_station_name TEXT,
  serial_no INTEGER,
  house_no TEXT,
  house_no_normalized NUMERIC,
  voter_name_telugu TEXT,
  voter_name_english TEXT,
  relative_name_telugu TEXT,
  relative_name_english TEXT,
  relation_type TEXT,
  gender TEXT,
  age INTEGER,
  epic_id TEXT,
  page_no INTEGER,
  confidence TEXT,
  extraction_engine TEXT,
  match_type TEXT,
  match_score FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  RETURN QUERY
  SELECT 
    v.id, v.assembly_name, v.assembly_no, v.part_no, v.polling_station_no, v.polling_station_name,
    v.serial_no, v.house_no, v.house_no_normalized, v.voter_name_telugu, v.voter_name_english,
    v.relative_name_telugu, v.relative_name_english, v.relation_type, v.gender, v.age, v.epic_id,
    v.page_no, v.confidence, v.source_pdf,
    'POSSIBLE'::TEXT AS match_type,
    similarity(lower(v.voter_name_english), lower(query_text))::FLOAT AS match_score
  FROM voters v
  -- The % operator uses the GIN index for fast trigram matching
  WHERE lower(v.voter_name_english) % lower(query_text)
  ORDER BY similarity(lower(v.voter_name_english), lower(query_text)) DESC
  LIMIT p_limit;
END;
$$;
-- ============================================================
-- OPTIMIZATION: Remove slow full-table scans from search_voters
-- 
-- The `fuzzy_match` (STEP 5) and `levenshtein_match` (STEP 6) CTEs 
-- contain unindexed functions like `dmetaphone()` and `levenshtein()`.
-- For uncommon queries (like "muhammed"), the planner is forced to
-- evaluate these CTEs across all 2M rows, causing statement timeouts.
-- 
-- Since we already have a blazing fast `fuzzy_search_voters` fallback
-- using `pg_trgm` (added in migration 013), we can safely remove 
-- these slow CTEs from the primary RPC, making it 100% indexed.
-- ============================================================

CREATE OR REPLACE FUNCTION search_voters(
  query_text        TEXT,
  p_telugu_query    TEXT    DEFAULT NULL,
  p_limit           INTEGER DEFAULT 20,
  p_assembly_no     INTEGER DEFAULT NULL,
  p_part_no         INTEGER DEFAULT NULL,
  p_relative_name   TEXT    DEFAULT NULL,
  p_canonical_query TEXT    DEFAULT NULL,
  p_nysiis_query    TEXT    DEFAULT NULL
)
RETURNS TABLE (
  id                    UUID,
  assembly_name         TEXT,
  assembly_no           INTEGER,
  part_no               INTEGER,
  polling_station_no    INTEGER,
  polling_station_name  TEXT,
  serial_no             INTEGER,
  house_no              TEXT,
  house_no_normalized   NUMERIC,
  voter_name_telugu     TEXT,
  voter_name_english    TEXT,
  relative_name_telugu  TEXT,
  relative_name_english TEXT,
  relation_type         TEXT,
  gender                TEXT,
  age                   INTEGER,
  epic_id               TEXT,
  page_no               INTEGER,
  confidence            TEXT,
  extraction_engine     TEXT,
  match_type            TEXT,
  match_score           FLOAT
)
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  clean_query      TEXT;
  clean_relative   TEXT;
  canonical_query  TEXT;
  nysiis_query     TEXT;
  nysiis_token     TEXT;
  bm25_query       TSQUERY;
BEGIN
  clean_query    := lower(trim(query_text));
  clean_relative := lower(trim(COALESCE(p_relative_name, '')));
  IF clean_relative = '' THEN clean_relative := NULL; END IF;

  -- Use app-computed canonical or fall back to raw query
  canonical_query := COALESCE(p_canonical_query, clean_query);

  -- Use app-computed NYSIIS or compute it here
  nysiis_query := COALESCE(p_nysiis_query, nysiis(clean_query));
  nysiis_token := '~' || nysiis_query;

  -- BM25 query: plainto_tsquery with 'simple' config (no stemming)
  BEGIN
    bm25_query := plainto_tsquery('simple', clean_query);
  EXCEPTION WHEN OTHERS THEN
    bm25_query := NULL;
  END;

  RETURN QUERY
  WITH

  -- -----------------------------------------------
  -- STEP 1: Exact match — EPIC ID / serial / house
  -- -----------------------------------------------
  exact_match AS (
    SELECT v.id, v.assembly_name, v.assembly_no, v.part_no,
           v.polling_station_no, v.polling_station_name,
           v.serial_no, v.house_no, v.house_no_normalized,
           v.voter_name_telugu, v.voter_name_english,
           v.relative_name_telugu, v.relative_name_english,
           v.relation_type, v.gender, v.age, v.epic_id,
           v.page_no, v.confidence, v.source_pdf,
           'EXACT'::TEXT, 1.0::FLOAT
    FROM voters v
    WHERE (
      v.epic_id = query_text
      OR v.serial_no::TEXT = clean_query
      OR lower(v.house_no) = clean_query
    )
    AND (p_assembly_no IS NULL OR v.assembly_no = p_assembly_no)
    AND (p_part_no     IS NULL OR v.part_no     = p_part_no)
    AND (clean_relative IS NULL
         OR lower(v.relative_name_english) LIKE '%'||clean_relative||'%'
         OR v.relative_name_telugu         LIKE '%'||clean_relative||'%')
  ),

  -- -----------------------------------------------
  -- STEP 2: Exact name match
  -- -----------------------------------------------
  exact_name AS (
    SELECT v.id, v.assembly_name, v.assembly_no, v.part_no,
           v.polling_station_no, v.polling_station_name,
           v.serial_no, v.house_no, v.house_no_normalized,
           v.voter_name_telugu, v.voter_name_english,
           v.relative_name_telugu, v.relative_name_english,
           v.relation_type, v.gender, v.age, v.epic_id,
           v.page_no, v.confidence, v.source_pdf,
           'EXACT'::TEXT, 0.98::FLOAT
    FROM voters v
    WHERE NOT EXISTS (SELECT 1 FROM exact_match x WHERE x.id = v.id)
    AND (
      lower(v.voter_name_english)   = clean_query
      OR v.voter_name_telugu        = query_text
      OR (p_telugu_query IS NOT NULL AND v.voter_name_telugu = p_telugu_query)
      OR lower(v.relative_name_english) = clean_query
      OR (p_telugu_query IS NOT NULL AND v.relative_name_telugu = p_telugu_query)
    )
    AND (p_assembly_no IS NULL OR v.assembly_no = p_assembly_no)
    AND (p_part_no     IS NULL OR v.part_no     = p_part_no)
    AND (clean_relative IS NULL
         OR lower(v.relative_name_english) LIKE '%'||clean_relative||'%'
         OR v.relative_name_telugu         LIKE '%'||clean_relative||'%')
  ),

  -- -----------------------------------------------
  -- STEP 3: Phonetic + BM25 Token Match (Indexed)
  -- -----------------------------------------------
  phonetic_token_match AS (
    SELECT v.id, v.assembly_name, v.assembly_no, v.part_no,
           v.polling_station_no, v.polling_station_name,
           v.serial_no, v.house_no, v.house_no_normalized,
           v.voter_name_telugu, v.voter_name_english,
           v.relative_name_telugu, v.relative_name_english,
           v.relation_type, v.gender, v.age, v.epic_id,
           v.page_no, v.confidence, v.source_pdf,
           'CLOSE'::TEXT,
           CASE
             WHEN bm25_query IS NOT NULL AND v.search_vector @@ bm25_query THEN ts_rank_cd('{0.1,0.2,0.4,1.0}', v.search_vector, bm25_query)::FLOAT
             WHEN v.search_tokens @> ARRAY[nysiis_token]      THEN 0.96
             WHEN v.search_tokens @> ARRAY[canonical_query]   THEN 0.95
             WHEN v.search_name_canonical LIKE '%'||canonical_query||'%' THEN 0.94
             ELSE 0.92
           END::FLOAT
    FROM voters v
    WHERE NOT EXISTS (SELECT 1 FROM exact_match x WHERE x.id = v.id)
    AND   NOT EXISTS (SELECT 1 FROM exact_name  x WHERE x.id = v.id)
    AND (
      -- BM25 full-text rank (Layer 2 - Highly Indexed)
      (bm25_query IS NOT NULL AND v.search_vector @@ bm25_query)
      -- NYSIIS token lookup (Layer 1 - Indexed)
      OR v.search_tokens @> ARRAY[nysiis_token]
      -- Canonical token lookup (Layer 1b - Indexed)
      OR v.search_tokens @> ARRAY[canonical_query]
      -- Canonical column fuzzy
      OR v.search_name_canonical LIKE '%'||canonical_query||'%'
      -- Skeleton token lookup
      OR (length(clean_query) > 3 AND EXISTS (
        SELECT 1 FROM unnest(v.search_tokens) t
        WHERE t LIKE '^%' AND similarity(t, '^'||clean_query) > 0.5
      ))
    )
    AND (p_assembly_no IS NULL OR v.assembly_no = p_assembly_no)
    AND (p_part_no     IS NULL OR v.part_no     = p_part_no)
    AND (clean_relative IS NULL
         OR lower(v.relative_name_english) LIKE '%'||clean_relative||'%'
         OR v.relative_name_telugu         LIKE '%'||clean_relative||'%')
  ),

  -- -----------------------------------------------
  -- STEP 4: Prefix match
  -- -----------------------------------------------
  prefix_match AS (
    SELECT v.id, v.assembly_name, v.assembly_no, v.part_no,
           v.polling_station_no, v.polling_station_name,
           v.serial_no, v.house_no, v.house_no_normalized,
           v.voter_name_telugu, v.voter_name_english,
           v.relative_name_telugu, v.relative_name_english,
           v.relation_type, v.gender, v.age, v.epic_id,
           v.page_no, v.confidence, v.source_pdf,
           'CLOSE'::TEXT, 0.90::FLOAT
    FROM voters v
    WHERE NOT EXISTS (SELECT 1 FROM exact_match       x WHERE x.id = v.id)
    AND   NOT EXISTS (SELECT 1 FROM exact_name        x WHERE x.id = v.id)
    AND   NOT EXISTS (SELECT 1 FROM phonetic_token_match x WHERE x.id = v.id)
    AND (
      lower(v.voter_name_english)       LIKE clean_query||'%'
      OR lower(v.relative_name_english) LIKE clean_query||'%'
      OR v.voter_name_telugu            LIKE query_text||'%'
      OR (p_telugu_query IS NOT NULL AND v.voter_name_telugu LIKE p_telugu_query||'%')
      OR lower(v.house_no)              LIKE clean_query||'%'
    )
    AND (p_assembly_no IS NULL OR v.assembly_no = p_assembly_no)
    AND (p_part_no     IS NULL OR v.part_no     = p_part_no)
    AND (clean_relative IS NULL
         OR lower(v.relative_name_english) LIKE '%'||clean_relative||'%'
         OR v.relative_name_telugu         LIKE '%'||clean_relative||'%')
  ),

  -- -----------------------------------------------
  -- Combine + dedup by highest score
  -- -----------------------------------------------
  combined AS (
    SELECT * FROM exact_match
    UNION ALL SELECT * FROM exact_name
    UNION ALL SELECT * FROM phonetic_token_match
    UNION ALL SELECT * FROM prefix_match
  ),
  deduped AS (
    SELECT DISTINCT ON (id) *
    FROM combined
    ORDER BY id, match_score DESC
  )

  SELECT * FROM deduped
  ORDER BY match_score DESC, house_no_normalized ASC NULLS LAST
  LIMIT p_limit;
END;
$$;
-- Migration 015_fast_path_indexes.sql
-- Add pg_trgm indexes to house_no and epic_id to speed up ILIKE 'prefix%' searches in the API's fast path.
-- Without these indexes, the `.or(house_no.ilike.X, epic_id.ilike.X)` query triggers a full table scan and times out at 10 seconds.

-- Ensure pg_trgm is enabled (should be, but safe to include)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

-- Index for house_no fast path (e.g., ILIKE '44-12%')
CREATE INDEX IF NOT EXISTS idx_voters_house_no_trgm 
ON voters USING GIN (house_no gin_trgm_ops);

-- Index for epic_id fast path (e.g., ILIKE 'AP221520%')
CREATE INDEX IF NOT EXISTS idx_voters_epic_id_trgm 
ON voters USING GIN (epic_id gin_trgm_ops);
