#!/usr/bin/env node

/**
 * seedSchoolLogos.js
 *
 * Seeds school logo images to S3 and updates School.logoUrl in the database.
 *
 * S3 Structure:
 *   school-logos/{level}/{sanitised_filename}.png
 *   e.g. school-logos/secondary_school/Logo_Victoria_School.png
 *
 * Matching Logic:
 *   1. Strip "Logo_" prefix from filename → candidate school name
 *   2. Try exact match against School.schoolName (case-insensitive)
 *   3. If no match, try fuzzy matching (handles missing "School" suffix, apostrophe variants, etc.)
 *
 * Usage:
 *   node seedSchoolLogos.js                        # live run
 *   node seedSchoolLogos.js --dry-run              # preview only (no S3 upload, no DB writes)
 *   node seedSchoolLogos.js --check                # list schools with/without logos and exit
 *   LOGOS_DIR=/path/to/folder node seedSchoolLogos.js
 */

const { S3Client, PutObjectCommand } = require("@aws-sdk/client-s3");
const fs = require("fs");
const path = require("path");
const prisma = require("../services/database/prismaClient");

// ─── Configuration ─────────────────────────────────────────────────
const S3_BUCKET = "tcc-website-assets";
const S3_REGION = process.env.AWS_REGION || "ap-southeast-1";
const S3_PREFIX = "school-logos";
const LOGOS_DIR =
  process.env.LOGOS_DIR || path.resolve(__dirname, "./School Logos");
const DRY_RUN = process.argv.includes("--dry-run");
const CHECK_ONLY = process.argv.includes("--check");

const s3 = new S3Client({ region: S3_REGION });

// ─── Manual Overrides ──────────────────────────────────────────────
// Maps extracted filename (after stripping "Logo_") → exact DB school name(s).
// Handles typos, abbreviations, and naming mismatches between client files and DB.
// Use an array to assign one logo to multiple schools.
const MANUAL_OVERRIDES = {
  // ── Primary School files ───────────────────────────────────────
  "Senkang Primary":                                ["SENG KANG PRIMARY SCHOOL"],
  "Ai Tong Primary":                                ["AI TONG SCHOOL"],
  "Anglo Chinese (Junior) and Primary":             ["ANGLO-CHINESE SCHOOL (JUNIOR)", "ANGLO-CHINESE SCHOOL (PRIMARY)"],
  "CHIJ Our Lady of Nativity Primary":              ["CHIJ OUR LADY OF THE NATIVITY"],
  "CHIJ St Nicholas (Primary and Secondary)":       ["CHIJ ST. NICHOLAS GIRLS' SCHOOL"],
  "CHIJ Toa Payoh Primary":                         ["CHIJ PRIMARY (TOA PAYOH)"],
  "ChongFu Primary":                                ["CHONGFU SCHOOL"],
  "De La Salle Primary":                            ["DE LA SALLE SCHOOL"],
  "Fairfield Methodist Primary":                    ["FAIRFIELD METHODIST SCHOOL (PRIMARY)"],
  "Haig Girls Primary":                             ["HAIG GIRLS' SCHOOL"],
  "Maha Bohdi Primary":                             ["MAHA BODHI SCHOOL"],
  "Marymount Convent Primary":                      ["MARYMOUNT CONVENT SCHOOL"],
  "Methodist Girls Primary":                        ["METHODIST GIRLS' SCHOOL (PRIMARY)"],
  "Montfort Junior Primary":                        ["MONTFORT JUNIOR SCHOOL"],
  "Paya Lebar Methodist Girls_ School Primary":     ["PAYA LEBAR METHODIST GIRLS' SCHOOL (PRIMARY)"],
  "Princess Elisabeth Primary":                     ["PRINCESS ELIZABETH PRIMARY SCHOOL"],
  "Red Swastika Primary":                           ["RED SWASTIKA SCHOOL"],
  "Rosyth Primary":                                 ["ROSYTH SCHOOL"],
  "Sembawang PS":                                   ["SEMBAWANG PRIMARY SCHOOL"],
  "Sengkang PS":                                    ["SENG KANG PRIMARY SCHOOL"],
  "St Andrews School(Junior)_Primary":              ["ST ANDREW'S SCHOOL (JUNIOR)"],

  // ── Secondary School files ─────────────────────────────────────
  "Assumption English Secondary School":            ["ASSUMPTION ENGLISH SCHOOL"],
  "Geylang Methodist Secondary":                    ["GEYLANG METHODIST SCHOOL (SECONDARY)"],
  "Pasir Rise Crest Secondary":                     ["PASIR RIS CREST SECONDARY SCHOOL"],
  "Paya Lebar Methodists Girls School Secondary":   ["PAYA LEBAR METHODIST GIRLS' SCHOOL (SECONDARY)"],
  "Sengkang Secondary":                             ["SENG KANG SECONDARY SCHOOL"],
  "St. Andrew's Secondary":                         ["ST ANDREW'S SCHOOL (SECONDARY)"],
  "St. Margaret's Secondary":                       ["ST. MARGARET'S SCHOOL (SECONDARY)"],
};

// Files to skip entirely (review markers, old versions, etc.)
// Keys must match the output of extractSchoolName() after stripping.
const SKIP_FILES = [
  "First Toa Payoh PS",        // old logo version (_OLD stripped)
  "Lakeside PS",               // review marker (_check stripped)
];


// ─── Helpers ───────────────────────────────────────────────────────

function buildS3Url(key) {
  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
}

async function uploadToS3(filePath, s3Key) {
  if (DRY_RUN) {
    console.log(`  [DRY RUN] Would upload → ${s3Key}`);
    return buildS3Url(s3Key);
  }

  const fileBuffer = fs.readFileSync(filePath);
  await s3.send(
    new PutObjectCommand({
      Bucket: S3_BUCKET,
      Key: s3Key,
      Body: fileBuffer,
      ContentType: "image/png",
      CacheControl: "public, max-age=31536000, immutable",
    })
  );
  console.log(`  ✓ Uploaded → ${s3Key}`);
  return buildS3Url(s3Key);
}

/**
 * Sanitise an S3 key segment — spaces to underscores, remove problematic chars.
 */
function sanitiseKeySegment(segment) {
  return segment
    .replace(/\s+/g, "_")
    .replace(/['']/g, "'");
}

/**
 * Extract school name from logo filename.
 * Strips "Logo_" prefix, trims, removes duplicate markers like "(1)",
 * strips " - Check" and "_ Check" suffixes, and expands abbreviations.
 */
function extractSchoolName(filename) {
  let name = path.parse(filename).name;

  // Strip "Logo_" or "Logo_ " prefix
  name = name.replace(/^Logo_\s*/, "");

  // Remove duplicate markers: "(1)", "(2)", etc.
  name = name.replace(/\(\d+\)$/, "");

  // Remove " - Check" / "_ Check" or similar review markers
  name = name.replace(/[\s_]*-?\s*Check$/i, "");

  // Remove trailing "_OLD" markers
  name = name.replace(/[\s_]*OLD$/i, "");

  return name.trim();
}

/**
 * Expand common abbreviations in school names for matching.
 * Returns an array of possible expansions.
 * e.g. "Rulang PS" → ["Rulang Primary School"]
 */
function expandAbbreviations(name) {
  const expansions = [];

  // PS → Primary School
  if (/\bPS\b/i.test(name)) {
    expansions.push(name.replace(/\bPS\b/i, "Primary School"));
  }

  // SS → Secondary School
  if (/\bSS\b/i.test(name)) {
    expansions.push(name.replace(/\bSS\b/i, "Secondary School"));
  }

  // JC → Junior College
  if (/\bJC\b/i.test(name)) {
    expansions.push(name.replace(/\bJC\b/i, "Junior College"));
  }

  return expansions;
}

/**
 * Normalise a school name for fuzzy comparison.
 * Lowercases, replaces hyphens with spaces (ANGLO-CHINESE → anglo chinese),
 * strips punctuation (apostrophes, quotes, parentheses), collapses whitespace.
 */
function normalise(name) {
  return name
    .toLowerCase()
    .replace(/[-–—]/g, " ")            // hyphens → spaces (ANGLO-CHINESE → anglo chinese)
    .replace(/[''`\u2018\u2019]/g, "") // remove apostrophes / curly quotes
    .replace(/[()]/g, "")             // remove parentheses
    .replace(/[^\w\s]/g, "")           // remove remaining punctuation
    .replace(/\s+/g, " ")             // collapse whitespace
    .trim();
}

/**
 * Strip the parenthetical qualifier from a DB school name.
 * e.g. "ANGLO-CHINESE SCHOOL (BARKER ROAD)" → "ANGLO-CHINESE SCHOOL"
 */
function stripQualifier(name) {
  return name.replace(/\s*\(.*?\)\s*$/, "").trim();
}

/**
 * Match a filename-derived school name to a DB school record.
 *
 * Strategy (in priority order):
 *   1. Exact normalised match
 *   2. Exact match after appending common suffixes ("School", "Secondary School", etc.)
 *   3. Match against DB name with parenthetical qualifier stripped
 *   4. Starts-with match — but ONLY if exactly one DB school matches (avoids ambiguity)
 *   5. Contains match — same single-match safety check
 *
 * Returns null for ambiguous matches to avoid false positives.
 */
function findSchoolMatch(candidateName, schoolsNormalised) {
  const normCandidate = normalise(candidateName);

  // 1. Exact normalised match
  const exact = schoolsNormalised.find((s) => s.norm === normCandidate);
  if (exact) return { school: exact.school, matchType: "exact" };

  // 2. Try appending common suffixes
  const suffixes = [" school", " secondary school", " primary school"];
  for (const suffix of suffixes) {
    const withSuffix = normCandidate + suffix;
    const suffixMatch = schoolsNormalised.find((s) => s.norm === withSuffix);
    if (suffixMatch) return { school: suffixMatch.school, matchType: "suffix-added" };
  }

  // 2b. Try expanding abbreviations (PS → Primary School, SS → Secondary School, etc.)
  const expansions = expandAbbreviations(candidateName);
  for (const expanded of expansions) {
    const normExpanded = normalise(expanded);
    const expandedMatch = schoolsNormalised.find((s) => s.norm === normExpanded);
    if (expandedMatch) return { school: expandedMatch.school, matchType: "abbreviation-expanded" };

    // Also try with " school" suffix on the expanded form
    for (const suffix of suffixes) {
      const expandedWithSuffix = normExpanded + suffix;
      const match = schoolsNormalised.find((s) => s.norm === expandedWithSuffix);
      if (match) return { school: match.school, matchType: "abbreviation-expanded" };
    }
  }

  // 3. Match against DB names with qualifier stripped
  //    e.g. "Anglo Chinese School" matches "ANGLO-CHINESE SCHOOL (PRIMARY)" stripped to "ANGLO-CHINESE SCHOOL"
  const qualifierMatch = schoolsNormalised.filter(
    (s) => s.normStripped === normCandidate
  );
  if (qualifierMatch.length === 1) {
    return { school: qualifierMatch[0].school, matchType: "qualifier-stripped" };
  }
  if (qualifierMatch.length > 1) {
    // Multiple schools share the base name — assign logo to all of them
    return {
      schools: qualifierMatch.map((q) => q.school),
      matchType: "shared",
    };
  }

  // 4. Starts-with — only if exactly one match (avoids false positives)
  const startsWithMatches = schoolsNormalised.filter(
    (s) => s.norm.startsWith(normCandidate) || normCandidate.startsWith(s.norm)
  );
  if (startsWithMatches.length === 1) {
    return { school: startsWithMatches[0].school, matchType: "starts-with" };
  }

  // 5. Contains — only if exactly one match
  const containsMatches = schoolsNormalised.filter(
    (s) => s.norm.includes(normCandidate) || normCandidate.includes(s.norm)
  );
  if (containsMatches.length === 1) {
    return { school: containsMatches[0].school, matchType: "contains" };
  }

  return null;
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {

  // ── Check-only mode: just list schools missing logos ───────────
  if (CHECK_ONLY) {
    console.log("╔══════════════════════════════════════════════════╗");
    console.log("║       School Logo Coverage Report                ║");
    console.log("╚══════════════════════════════════════════════════╝\n");

    const allSchools = await prisma.school.findMany({
      orderBy: { schoolName: "asc" },
    });

    const withLogo = allSchools.filter((s) => s.logoUrl);
    const withoutLogo = allSchools.filter((s) => !s.logoUrl);

    console.log(`📊 Logo coverage: ${withLogo.length}/${allSchools.length} schools have logos\n`);

    if (withLogo.length > 0) {
      console.log(`✅ Schools with logos (${withLogo.length}):`);
      console.log("─".repeat(70));
      withLogo.forEach((s, i) => {
        console.log(`  ${String(i + 1).padStart(3)}. [ID ${String(s.id).padStart(4)}] ${s.schoolName}`);
      });
      console.log();
    }

    if (withoutLogo.length > 0) {
      console.log(`🚫 Schools missing logos (${withoutLogo.length}):`);
      console.log("─".repeat(70));
      withoutLogo.forEach((s, i) => {
        console.log(`  ${String(i + 1).padStart(3)}. [ID ${String(s.id).padStart(4)}] ${s.schoolName}`);
      });
      console.log("─".repeat(70));
      console.log(
        "\n  → Add logo files named Logo_{school name}.png to the appropriate level folder."
      );
    } else {
      console.log("✅ All schools have logos!");
    }

    return;
  }

  // ── Full seeding mode ──────────────────────────────────────────
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║         School Logos Seeding Script              ║");
  console.log("╚══════════════════════════════════════════════════╝\n");
  console.log(`  Bucket:  ${S3_BUCKET}`);
  console.log(`  Region:  ${S3_REGION}`);
  console.log(`  Source:  ${LOGOS_DIR}`);
  console.log(`  Mode:    ${DRY_RUN ? "🔍 DRY RUN" : "🚀 LIVE"}\n`);

  if (!fs.existsSync(LOGOS_DIR)) {
    console.error(`❌ Logos directory not found: ${LOGOS_DIR}`);
    process.exit(1);
  }

  // ── Load schools from DB ───────────────────────────────────────
  const schools = await prisma.school.findMany();
  const schoolsNormalised = schools.map((s) => ({
    school: s,
    norm: normalise(s.schoolName),
    normStripped: normalise(stripQualifier(s.schoolName)),
  }));

  console.log(`  Loaded: ${schools.length} schools from DB\n`);

  // Counters
  const stats = {
    uploaded: 0,
    dbUpdates: 0,
    skippedDuplicates: 0,
    skippedExisting: 0,
    unmatched: [],
    matched: [],
    warnings: [],
  };

  // Track matched school IDs to avoid duplicates from (1) files
  // Pre-populate with schools that already have a logo — skip them
  const matchedSchoolIds = new Set();
  const schoolsAlreadySeeded = schools.filter((s) => s.logoUrl);
  for (const s of schoolsAlreadySeeded) {
    matchedSchoolIds.add(s.id);
  }

  if (schoolsAlreadySeeded.length > 0) {
    console.log(`  ⊘ Skipping ${schoolsAlreadySeeded.length} school(s) that already have logos\n`);
  }

  // ── Walk level folders ─────────────────────────────────────────
  const levelFolders = fs
    .readdirSync(LOGOS_DIR, { withFileTypes: true })
    .filter((e) => e.isDirectory());

  for (const levelFolder of levelFolders) {
    const levelPath = path.join(LOGOS_DIR, levelFolder.name);
    const levelKey = sanitiseKeySegment(levelFolder.name).toLowerCase();

    console.log(`━━━ Level: ${levelFolder.name} ━━━\n`);

    const files = fs
      .readdirSync(levelPath)
      .filter((f) => f.toLowerCase().endsWith(".png"));

    for (const file of files) {
      const filePath = path.join(levelPath, file);
      const candidateName = extractSchoolName(file);

      if (!candidateName) {
        const msg = `Could not extract school name from "${file}"`;
        console.log(`  ⚠ ${msg}`);
        stats.warnings.push(msg);
        continue;
      }

      // Skip files flagged for exclusion
      if (SKIP_FILES.includes(candidateName)) {
        console.log(`  ⊘ Skipped (excluded): "${file}"`);
        stats.skippedDuplicates++;
        continue;
      }

      // Check manual overrides first
      const override = MANUAL_OVERRIDES[candidateName];
      if (override) {
        const overrideSchools = schools.filter((s) =>
          override.map((n) => n.toLowerCase()).includes(s.schoolName.toLowerCase())
        );

        const unmatched = overrideSchools.filter((s) => !matchedSchoolIds.has(s.id));
        if (unmatched.length === 0) {
          console.log(
            `  ⊘ Skipped (already set): "${candidateName}" → all override targets already matched`
          );
          stats.skippedDuplicates++;
          continue;
        }

        // Upload once
        const s3Key = `${S3_PREFIX}/${levelKey}/${sanitiseKeySegment(file)}`;
        const s3Url = await uploadToS3(filePath, s3Key);
        stats.uploaded++;

        for (const school of unmatched) {
          matchedSchoolIds.add(school.id);
          if (!DRY_RUN) {
            await prisma.school.update({
              where: { id: school.id },
              data: { logoUrl: s3Url },
            });
            stats.dbUpdates++;
          }
          console.log(
            `  ✓ "${candidateName}" → School #${school.id} "${school.schoolName}" [override]`
          );
        }

        stats.matched.push(
          ...unmatched.map((s) => ({
            file,
            candidateName,
            schoolId: s.id,
            schoolName: s.schoolName,
            matchType: "override",
          }))
        );

        // Flag any override targets not found in DB
        const notFound = override.filter(
          (name) => !schools.some((s) => s.schoolName.toLowerCase() === name.toLowerCase())
        );
        if (notFound.length > 0) {
          const msg = `Override target(s) not found in DB: ${notFound.join(", ")}`;
          console.log(`  ⚠ ${msg}`);
          stats.warnings.push(msg);
        }

        continue;
      }

      // Attempt DB match (fuzzy)
      const match = findSchoolMatch(candidateName, schoolsNormalised);

      if (!match) {
        console.log(`  ✗ No DB match: "${candidateName}" (${file})`);
        stats.unmatched.push({ file, candidateName, level: levelFolder.name });
        continue;
      }

      // Handle shared matches — one logo for multiple schools (e.g., all ACS schools)
      if (match.matchType === "shared") {
        const schoolList = match.schools;

        // Skip if ALL of these schools were already matched
        const unmatched = schoolList.filter((s) => !matchedSchoolIds.has(s.id));
        if (unmatched.length === 0) {
          console.log(
            `  ⊘ Skipped duplicate: "${file}" → all ${schoolList.length} schools already matched`
          );
          stats.skippedDuplicates++;
          continue;
        }

        // Upload once
        const s3Key = `${S3_PREFIX}/${levelKey}/${sanitiseKeySegment(file)}`;
        const s3Url = await uploadToS3(filePath, s3Key);
        stats.uploaded++;

        // Update all matching schools
        for (const school of unmatched) {
          matchedSchoolIds.add(school.id);
          if (!DRY_RUN) {
            await prisma.school.update({
              where: { id: school.id },
              data: { logoUrl: s3Url },
            });
            stats.dbUpdates++;
          }
          console.log(
            `  ✓ "${candidateName}" → School #${school.id} "${school.schoolName}" [shared]`
          );
        }

        stats.matched.push(
          ...unmatched.map((s) => ({
            file,
            candidateName,
            schoolId: s.id,
            schoolName: s.schoolName,
            matchType: "shared",
          }))
        );
        continue;
      }

      const { school, matchType } = match;

      // Skip duplicate files (e.g., Logo_National Junior College(1).png)
      if (matchedSchoolIds.has(school.id)) {
        console.log(
          `  ⊘ Skipped duplicate: "${file}" → already matched School #${school.id}`
        );
        stats.skippedDuplicates++;
        continue;
      }

      matchedSchoolIds.add(school.id);

      // Upload to S3
      const s3Key = `${S3_PREFIX}/${levelKey}/${sanitiseKeySegment(file)}`;
      const s3Url = await uploadToS3(filePath, s3Key);
      stats.uploaded++;

      // Update DB
      if (!DRY_RUN) {
        await prisma.school.update({
          where: { id: school.id },
          data: { logoUrl: s3Url },
        });
        stats.dbUpdates++;
      }

      const matchLabel =
        matchType === "exact" ? "" : ` [${matchType} match]`;
      console.log(
        `  ✓ "${candidateName}" → School #${school.id} "${school.schoolName}"${matchLabel}`
      );
      stats.matched.push({
        file,
        candidateName,
        schoolId: school.id,
        schoolName: school.schoolName,
        matchType,
      });
    }
    console.log();
  }

  // ── Summary ────────────────────────────────────────────────────
  const sharedCount = stats.matched.filter((m) => m.matchType === "shared").length;

  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║                    Summary                      ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(
    `║  Mode:                  ${DRY_RUN ? "DRY RUN" : "LIVE   "}                   ║`
  );
  console.log("╠──────────────────────────────────────────────────╣");
  console.log(
    `║  S3 uploads:            ${String(stats.uploaded).padStart(4)}                       ║`
  );
  console.log(
    `║  DB updates:            ${String(stats.dbUpdates).padStart(4)}                       ║`
  );
  console.log(
    `║  Shared logo assigns:   ${String(sharedCount).padStart(4)}                       ║`
  );
  console.log(
    `║  Skipped (already set):  ${String(schoolsAlreadySeeded.length).padStart(4)}                       ║`
  );
  console.log(
    `║  Skipped duplicates:    ${String(stats.skippedDuplicates).padStart(4)}                       ║`
  );
  console.log(
    `║  Unmatched files:       ${String(stats.unmatched.length).padStart(4)}                       ║`
  );
  console.log("╚══════════════════════════════════════════════════╝");

  // ── Schools still missing logos ────────────────────────────────
  // In dry-run mode, use in-memory tracking since DB wasn't updated.
  // In live mode, query DB for accuracy.
  let schoolsMissingLogos;
  if (DRY_RUN) {
    schoolsMissingLogos = schools
      .filter((s) => !matchedSchoolIds.has(s.id))
      .sort((a, b) => a.schoolName.localeCompare(b.schoolName));
  } else {
    schoolsMissingLogos = await prisma.school.findMany({
      where: { logoUrl: null },
      orderBy: { schoolName: "asc" },
    });
  }

  const schoolsWithLogos = schools.length - schoolsMissingLogos.length;

  console.log(
    `\n📊 Logo coverage: ${schoolsWithLogos}/${schools.length} schools have logos\n`
  );

  if (schoolsMissingLogos.length > 0) {
    console.log(`🚫 Schools still missing logos (${schoolsMissingLogos.length}):`);
    console.log("─".repeat(60));
    schoolsMissingLogos.forEach((s, i) => {
      console.log(`  ${String(i + 1).padStart(3)}. [ID ${String(s.id).padStart(4)}] ${s.schoolName}`);
    });
    console.log("─".repeat(60));
    console.log(
      "\n  → To fix: add logo files named Logo_{school name}.png to the appropriate level folder."
    );
    console.log(
      "  → The school name must match the DB school_name (case-insensitive, hyphens/apostrophes ignored)."
    );
  } else {
    console.log("✅ All schools have logos!");
  }

  // ── Unmatched report (important for manual review) ─────────────
  if (stats.unmatched.length > 0) {
    console.log(`\n✗ Unmatched files (${stats.unmatched.length}):`);
    console.log("  These logos could not be matched to any school in the DB.\n");
    stats.unmatched.forEach((u, i) => {
      console.log(`  ${i + 1}. "${u.candidateName}" (${u.level}/${u.file})`);
    });
    console.log(
      "\n  → Check for spelling differences between filenames and School.schoolName in DB."
    );
  }

  // ── Fuzzy match report (review these) ──────────────────────────
  const fuzzyMatches = stats.matched.filter((m) => m.matchType !== "exact");
  if (fuzzyMatches.length > 0) {
    console.log(`\n🔍 Non-exact matches (${fuzzyMatches.length}) — please review:`);
    fuzzyMatches.forEach((m, i) => {
      console.log(
        `  ${i + 1}. "${m.candidateName}" → "${m.schoolName}" [${m.matchType}]`
      );
    });
  }

  if (stats.warnings.length > 0) {
    console.log(`\n⚠ Warnings (${stats.warnings.length}):`);
    stats.warnings.forEach((w, i) => console.log(`  ${i + 1}. ${w}`));
  }
}

main()
  .catch((e) => {
    console.error("\n❌ Fatal error:", e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());