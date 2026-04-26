#!/usr/bin/env node

/**
 * seedUniformGraphics.js
 *
 * Seeds uniform graphic images to S3 and updates ItemType.imageUrl in the database.
 *
 * S3 Structure:
 *   uniform-graphics/schools/{school_name}/{file}.png   — school-specific graphics
 *   uniform-graphics/general/{category_name}/{file}.png — generic colour-based fallback
 *
 * Logic:
 *   Phase 1 — Upload school-specific images to S3 and update matching ItemType rows
 *             (all ItemTypes for that school + category get the same image).
 *   Phase 2 — Upload general colour images to S3.
 *   Phase 3 — For ItemTypes at schools WITHOUT custom graphics, assign general images
 *             matched by category + primary colour.
 *
 * Usage:
 *   node seedUniformGraphics.js                          # live run
 *   node seedUniformGraphics.js --dry-run                # preview only (no S3 upload, no DB writes)
 *   node seedUniformGraphics.js --check                  # audit: list unmatched images + ItemTypes missing imageUrl
 *   GRAPHICS_DIR=/path/to/folder node seedUniformGraphics.js
 */

const { S3Client, PutObjectCommand, ListObjectsV2Command } = require("@aws-sdk/client-s3");
const prisma = require("../services/database/prismaClient");
const fs = require("fs");
const path = require("path");

// ─── Configuration ─────────────────────────────────────────────────
const S3_BUCKET = "tcc-website-assets";
const S3_REGION = process.env.AWS_REGION || "ap-southeast-1";
const S3_PREFIX = "uniform-graphics";
const GRAPHICS_DIR =
  process.env.GRAPHICS_DIR ||
  path.resolve(__dirname, "../scripts/Uniform Graphics");
const GENERAL_FOLDER = "0 - General Colours";
const DRY_RUN = process.argv.includes("--dry-run");
const CHECK_ONLY = process.argv.includes("--check");

const s3 = new S3Client({ region: S3_REGION });

// Cache of existing S3 object keys under our prefix so we can skip re-uploads
const existingKeys = new Set();

async function loadExistingS3Keys() {
  console.log("  Checking existing S3 objects under prefix:", S3_PREFIX);
  let continuationToken = undefined;

  do {
    const resp = await s3.send(
      new ListObjectsV2Command({
        Bucket: S3_BUCKET,
        Prefix: `${S3_PREFIX}/`,
        ContinuationToken: continuationToken,
      })
    );

    if (resp.Contents) {
      for (const obj of resp.Contents) {
        if (obj.Key) {
          existingKeys.add(obj.Key);
        }
      }
    }

    continuationToken = resp.IsTruncated ? resp.NextContinuationToken : undefined;
  } while (continuationToken);

  console.log(`  Found ${existingKeys.size} existing object(s) in S3 under ${S3_PREFIX}/\n`);
}

// ─── Category Mapping ──────────────────────────────────────────────
// Maps human-readable names found in filenames/folder names → DB category_name values.
// Handles singular/plural and common variants.
const CATEGORY_MAP = {
  "pe shirt": "pe shirt",
  "pe shirts": "pe shirt",
  "pe shorts": "pe shorts",
  "uniform shirt": "uniform shirt",
  "uniform shirts": "uniform shirt",
  "shirt": "uniform skirt",
  "uniform shorts": "uniform shorts",
  "uniform pants": "uniform pants",
  "uniform skirt": "uniform skirt",
  "uniform skirts": "uniform skirt",
  "skirt": "uniform skirt",
  "polo shirt": "polo shirt",
  "polo shirts": "polo shirt",
  "pinafore": "pinafore",
  "pinafores": "pinafore",
  "pinarfore": "pinafore", // known typo in source files
  "top": "other shirts", // ACS P - Top.png
};

// ─── Helpers ───────────────────────────────────────────────────────

function buildS3Url(key) {
  return `https://${S3_BUCKET}.s3.${S3_REGION}.amazonaws.com/${key}`;
}

async function uploadToS3(filePath, s3Key) {
  if (existingKeys.has(s3Key)) {
    console.log(`  [SKIP] Already exists in S3 → ${s3Key}`);
    return buildS3Url(s3Key);
  }

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
 * Sanitise an S3 key segment — replaces characters that are problematic in URLs.
 * Preserves readability while ensuring valid S3 keys.
 */
function sanitiseKeySegment(segment) {
  return segment
    .replace(/#U2019/g, "'") // fix zip encoding of right single quote
    .replace(/['']/g, "'") // normalise curly quotes
    .replace(/\s+/g, "_"); // spaces → underscores for cleaner URLs
}

/**
 * Clean folder name for DB matching — fixes encoding artefacts from zip extraction.
 */
function cleanFolderName(name) {
  return name.replace(/#U2019/g, "\u2019"); // restore right single quote
}

/**
 * Normalise school names for matching between folder names and DB `schoolName`.
 * - lowercases
 * - removes periods and apostrophes
 * - collapses whitespace
 */
function normaliseSchoolName(name) {
  return name
    .toLowerCase()
    .replace(/[''.]/g, "") // drop apostrophes and periods
    .replace(/\s+/g, " ")
    .trim();
}

// Simple Levenshtein distance for fuzzy matching between folder names and DB names
function stringDistance(a, b) {
  if (a === b) return 0;
  const aLen = a.length;
  const bLen = b.length;
  if (aLen === 0) return bLen;
  if (bLen === 0) return aLen;
  const dp = Array.from({ length: aLen + 1 }, () => new Array(bLen + 1));
  for (let i = 0; i <= aLen; i++) dp[i][0] = i;
  for (let j = 0; j <= bLen; j++) dp[0][j] = j;
  for (let i = 1; i <= aLen; i++) {
    for (let j = 1; j <= bLen; j++) {
      const cost = a[i - 1] === b[j - 1] ? 0 : 1;
      dp[i][j] = Math.min(
        dp[i - 1][j] + 1,
        dp[i][j - 1] + 1,
        dp[i - 1][j - 1] + cost
      );
    }
  }
  return dp[aLen][bLen];
}

/**
 * Find the best matching school for a given normalised folder name.
 * 1. Try exact normalised match.
 * 2. Fallback to fuzzy match with small edit distance (e.g. "st patrick school" vs "st patricks school").
 */
function findSchoolForFolder(normalisedFolderName, schoolByName) {
  const exact = schoolByName.get(normalisedFolderName);
  if (exact) {
    return { school: exact, key: normalisedFolderName, matchedType: "exact" };
  }

  let bestKey = null;
  let bestSchool = null;
  let bestDistance = Infinity;

  for (const [key, school] of schoolByName.entries()) {
    const dist = stringDistance(normalisedFolderName, key);
    if (dist < bestDistance) {
      bestDistance = dist;
      bestKey = key;
      bestSchool = school;
    }
  }

  // Only accept a fuzzy match if it's very close (edit distance <= 2).
  if (bestSchool && bestDistance <= 2) {
    return { school: bestSchool, key: bestKey, matchedType: "fuzzy", distance: bestDistance };
  }

  return null;
}

/**
 * Parse a school-specific filename to extract the category portion.
 * Pattern: "{School Prefix} - {Category}.png"
 * e.g. "ACS P - PE Shirt.png"       → "pe_shirt"
 *      "Victoria School - Skirt.png" → "uniform_skirt"
 */
function parseCategoryFromSchoolFile(filename) {
  const name = path.parse(filename).name;
  const match = name.match(/^.+?\s*-\s*(.+)$/);
  if (!match) return null;

  const raw = match[1].trim().toLowerCase();
  return CATEGORY_MAP[raw] || null;
}

/**
 * Parse a general colour filename to extract category + colour.
 * Pattern: "{Category} - {colour}.png"
 * e.g. "PE Shirt - dark blue.png" → { category: "pe_shirt", colour: "dark blue" }
 */
function parseGeneralFile(filename) {
  const name = path.parse(filename).name;
  const match = name.match(/^(.+?)\s*-\s*(.*)$/);
  if (!match) return null;

  const rawCategory = match[1].trim().toLowerCase();
  const colour = match[2].trim().toLowerCase();
  const category = CATEGORY_MAP[rawCategory] || null;

  if (!category || !colour) return null;
  return { category, colour };
}

/**
 * Parse a general colour subfolder name to extract category.
 * Pattern: "{Category} colours - {suffix}"
 * e.g. "PE Shirts colours - png" → "pe_shirt"
 */
function parseCategoryFromSubfolder(folderName) {
  const match = folderName.match(/^(.+?)\s+colours/i);
  if (!match) return null;
  const raw = match[1].trim().toLowerCase();
  return CATEGORY_MAP[raw] || null;
}

// ─── Check Mode ────────────────────────────────────────────────────

async function runCheck() {
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║     Uniform Graphics Coverage Report             ║");
  console.log("╚══════════════════════════════════════════════════╝\n");
  console.log(`  Source:  ${GRAPHICS_DIR}\n`);

  if (!fs.existsSync(GRAPHICS_DIR)) {
    console.error(`❌ Graphics directory not found: ${GRAPHICS_DIR}`);
    process.exit(1);
  }

  // ── Load DB data ───────────────────────────────────────────────
  const [schools, categories, colours] = await Promise.all([
    prisma.school.findMany(),
    prisma.category.findMany(),
    prisma.colour.findMany(),
  ]);

  const schoolByName = new Map(
    schools.map((s) => [normaliseSchoolName(s.schoolName), s])
  );
  const categoryByName = new Map(
    categories.map((c) => [c.categoryName.toLowerCase(), c])
  );

  const allItemTypes = await prisma.itemType.findMany({
    include: {
      category: true,
      primaryColour: true,
      school: true,
    },
    orderBy: [{ schoolId: "asc" }, { categoryId: "asc" }],
  });

  console.log(
    `  Loaded: ${schools.length} schools, ${categories.length} categories, ${colours.length} colours, ${allItemTypes.length} item types\n`
  );

  // ── Track unmatched images ─────────────────────────────────────
  const unmatchedImages = [];
  const matchedImages = [];

  // -- School-specific images --
  console.log("━━━ Checking school-specific images ━━━\n");

  const entries = fs.readdirSync(GRAPHICS_DIR, { withFileTypes: true });
  const schoolFolders = entries.filter(
    (e) => e.isDirectory() && !e.name.startsWith("0 -")
  );

  for (const folder of schoolFolders) {
    const folderPath = path.join(GRAPHICS_DIR, folder.name);
    const cleanName = cleanFolderName(folder.name);
    const normalisedFolderName = normaliseSchoolName(cleanName);

    const match = findSchoolForFolder(normalisedFolderName, schoolByName);

    if (!match) {
      // Entire folder unmatched
      const files = fs.readdirSync(folderPath).filter((f) => f.toLowerCase().endsWith(".png"));
      for (const file of files) {
        unmatchedImages.push({
          file,
          folder: cleanName,
          reason: `School folder "${cleanName}" has no match in DB`,
        });
      }
      continue;
    }

    const school = match.school;
    const files = fs.readdirSync(folderPath).filter((f) => f.toLowerCase().endsWith(".png"));

    for (const file of files) {
      const categoryName = parseCategoryFromSchoolFile(file);

      if (!categoryName) {
        unmatchedImages.push({
          file,
          folder: cleanName,
          reason: `Could not parse category from filename`,
        });
        continue;
      }

      const category = categoryByName.get(categoryName);
      if (!category) {
        unmatchedImages.push({
          file,
          folder: cleanName,
          reason: `Category "${categoryName}" not found in DB`,
        });
        continue;
      }

      // Check if any ItemTypes exist for this school + category
      const matchingItemTypes = allItemTypes.filter(
        (it) => it.schoolId === school.id && it.categoryId === category.id
      );

      if (matchingItemTypes.length === 0) {
        unmatchedImages.push({
          file,
          folder: cleanName,
          reason: `No ItemTypes in DB for school "${school.schoolName}" + category "${categoryName}"`,
        });
      } else {
        matchedImages.push({
          file,
          folder: cleanName,
          school: school.schoolName,
          category: categoryName,
          itemTypeCount: matchingItemTypes.length,
        });
      }
    }
  }

  // -- General colour images -- build URL map for fallback analysis
  console.log("━━━ Checking general colour images ━━━\n");

  const generalDir = path.join(GRAPHICS_DIR, GENERAL_FOLDER);
  const checkGeneralUrlMap = {};

  if (fs.existsSync(generalDir)) {
    const subfolders = fs
      .readdirSync(generalDir, { withFileTypes: true })
      .filter((e) => e.isDirectory());

    for (const subfolder of subfolders) {
      const subfolderPath = path.join(generalDir, subfolder.name);
      const categoryName = parseCategoryFromSubfolder(subfolder.name);

      if (!categoryName) {
        unmatchedImages.push({
          file: subfolder.name,
          folder: GENERAL_FOLDER,
          reason: `Could not parse category from subfolder name`,
        });
        continue;
      }

      checkGeneralUrlMap[categoryName] = checkGeneralUrlMap[categoryName] || {};

      const files = fs
        .readdirSync(subfolderPath)
        .filter((f) => f.toLowerCase().endsWith(".png"));

      for (const file of files) {
        const parsed = parseGeneralFile(file);
        if (!parsed) {
          unmatchedImages.push({
            file,
            folder: `${GENERAL_FOLDER}/${subfolder.name}`,
            reason: `Could not parse category/colour from filename`,
          });
          continue;
        }

        checkGeneralUrlMap[categoryName][parsed.colour] = true; // just track existence

        // Check if this colour exists in the DB
        const colourExists = colours.some(
          (c) => c.colourName.toLowerCase() === parsed.colour
        );
        if (!colourExists) {
          unmatchedImages.push({
            file,
            folder: `${GENERAL_FOLDER}/${subfolder.name}`,
            reason: `Colour "${parsed.colour}" not found in DB colours table`,
          });
        }
      }
    }
  }

  // Fallback maps (same as seeding mode)
  const CATEGORY_FALLBACK = {
    "skort":        "uniform skirt",
    "house shirt":  "pe shirt",
    "gym shorts":   "pe shorts",
  };

  const COLOUR_FALLBACK = {
    "navy blue":   ["dark blue", "medium blue"],
    "green":       ["medium green", "dark green", "light green"],
    "blue":        ["light blue", "dark blue", "medium blue"],
    "yellow":      ["light yellow", "dark yellow"],
    "grey":        ["dark grey", "light grey", "medium grey"],
    "royal blue":  ["medium blue", "dark blue"],
    "khaki":       ["beige"],
    "maroon":      ["dark red"],
  };

  function checkResolveGeneralUrl(categoryName, colourName) {
    const categoriesToTry = [categoryName];
    if (CATEGORY_FALLBACK[categoryName]) categoriesToTry.push(CATEGORY_FALLBACK[categoryName]);

    const coloursToTry = [colourName];
    if (COLOUR_FALLBACK[colourName]) coloursToTry.push(...COLOUR_FALLBACK[colourName]);

    for (const cat of categoriesToTry) {
      for (const col of coloursToTry) {
        if (checkGeneralUrlMap[cat]?.[col]) return { resolvedCategory: cat, resolvedColour: col };
      }
    }
    return null;
  }

  // ── Report: Unmatched images ───────────────────────────────────
  if (unmatchedImages.length > 0) {
    console.log(`🖼️  Unmatched images (${unmatchedImages.length}):`);
    console.log("─".repeat(80));
    unmatchedImages.forEach((img, i) => {
      console.log(
        `  ${String(i + 1).padStart(3)}. ${img.folder}/${img.file}`
      );
      console.log(`       → ${img.reason}`);
    });
    console.log("─".repeat(80));
  } else {
    console.log("✅ All images matched to DB records!\n");
  }

  // ── Report: ItemTypes missing imageUrl ─────────────────────────
  const itemTypesMissing = allItemTypes.filter((it) => !it.imageUrl);
  const itemTypesWithImage = allItemTypes.length - itemTypesMissing.length;

  // Separate into resolvable (with fallback) vs truly missing
  const resolvable = [];
  const trulyMissing = [];

  for (const it of itemTypesMissing) {
    const categoryName = it.category.categoryName.toLowerCase();
    const colourName = it.primaryColour.colourName.toLowerCase();
    const result = checkResolveGeneralUrl(categoryName, colourName);

    if (result) {
      resolvable.push({ ...it, resolved: result });
    } else {
      trulyMissing.push(it);
    }
  }

  console.log(
    `\n📊 Image coverage: ${itemTypesWithImage}/${allItemTypes.length} ItemTypes have imageUrl\n`
  );

  if (resolvable.length > 0) {
    console.log(`✅ Resolvable with fallback (${resolvable.length} ItemTypes):`);
    console.log("  These will get an image on next seed run.\n");
  }

  if (trulyMissing.length > 0) {
    // Group by school for cleaner output
    const bySchool = {};
    for (const it of trulyMissing) {
      const schoolName = it.school.schoolName;
      if (!bySchool[schoolName]) {
        bySchool[schoolName] = [];
      }
      bySchool[schoolName].push(it);
    }

    const schoolNames = Object.keys(bySchool).sort();

    console.log(`🚫 Truly missing — no image or fallback available (${trulyMissing.length}) across ${schoolNames.length} school(s):`);
    console.log("─".repeat(80));

    for (const schoolName of schoolNames) {
      const items = bySchool[schoolName];
      console.log(`\n  📁 ${schoolName} (${items.length} missing):`);
      for (const it of items) {
        const colourName = it.primaryColour.colourName;
        const categoryName = it.category.categoryName;
        const genderLabel = it.gender !== "Unisex" ? ` [${it.gender}]` : "";
        console.log(
          `      [ID ${String(it.id).padStart(4)}] ${categoryName} / ${colourName}${genderLabel}`
        );
      }
    }
    console.log("\n" + "─".repeat(80));
    console.log(
      "\n  → Categories with no fallback: other shirts, tie, belt, cap, others"
    );
    console.log(
      "  → Colours with no fallback: orange"
    );
    console.log(
      "  → Some category+colour combos have no image even with fallback (e.g. pinafore/grey)"
    );
  } else {
    console.log("✅ All ItemTypes have or will have imageUrl after seeding!");
  }

  // ── Summary ────────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║               Coverage Summary                  ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(
    `║  Images matched:          ${String(matchedImages.length).padStart(4)}                   ║`
  );
  console.log(
    `║  Images unmatched:        ${String(unmatchedImages.length).padStart(4)}                   ║`
  );
  console.log(
    `║  ItemTypes with image:    ${String(itemTypesWithImage).padStart(4)}                   ║`
  );
  console.log(
    `║  Resolvable (fallback):   ${String(resolvable.length).padStart(4)}                   ║`
  );
  console.log(
    `║  Truly missing:           ${String(trulyMissing.length).padStart(4)}                   ║`
  );
  console.log("╚══════════════════════════════════════════════════╝");
}

// ─── Main ──────────────────────────────────────────────────────────

async function main() {

  // ── Check-only mode ────────────────────────────────────────────
  if (CHECK_ONLY) {
    return runCheck();
  }

  // ── Full seeding mode ──────────────────────────────────────────
  console.log("╔══════════════════════════════════════════════════╗");
  console.log("║      Uniform Graphics Seeding Script            ║");
  console.log("╚══════════════════════════════════════════════════╝\n");
  console.log(`  Bucket:  ${S3_BUCKET}`);
  console.log(`  Region:  ${S3_REGION}`);
  console.log(`  Source:  ${GRAPHICS_DIR}`);
  console.log(`  Mode:    ${DRY_RUN ? "🔍 DRY RUN" : "🚀 LIVE"}\n`);

  if (!fs.existsSync(GRAPHICS_DIR)) {
    console.error(`❌ Graphics directory not found: ${GRAPHICS_DIR}`);
    process.exit(1);
  }

  // Pre-load existing S3 keys so we can skip already-uploaded files
  await loadExistingS3Keys();

  // ── Load DB reference data ─────────────────────────────────────
  const [schools, categories, colours] = await Promise.all([
    prisma.school.findMany(),
    prisma.category.findMany(),
    prisma.colour.findMany(),
  ]);

  const schoolByName = new Map(
    schools.map((s) => [normaliseSchoolName(s.schoolName), s])
  );
  const categoryByName = new Map(
    categories.map((c) => [c.categoryName.toLowerCase(), c])
  );
  const colourByName = new Map(
    colours.map((c) => [c.colourName.toLowerCase(), c])
  );

  console.log(
    `  Loaded: ${schools.length} schools, ${categories.length} categories, ${colours.length} colours\n`
  );

  // Track which school IDs have custom graphics
  const schoolsWithGraphics = new Set();

  // Counters
  const stats = {
    schoolUploads: 0,
    schoolDbUpdates: 0,
    generalUploads: 0,
    fallbackUpdates: 0,
    skipped: 0,
    warnings: [],
  };

  // ── Phase 1: School-specific folders ───────────────────────────
  console.log("━━━ Phase 1: School-specific graphics ━━━\n");

  const entries = fs.readdirSync(GRAPHICS_DIR, { withFileTypes: true });
  const schoolFolders = entries.filter(
    (e) => e.isDirectory() && !e.name.startsWith("0 -")
  );

  for (const folder of schoolFolders) {
    const folderPath = path.join(GRAPHICS_DIR, folder.name);
    const cleanName = cleanFolderName(folder.name);
    const normalisedFolderName = normaliseSchoolName(cleanName);

    console.log(`📁 School folder: "${cleanName}" (normalised: "${normalisedFolderName}")`);

    // Match folder name to DB school (normalised + fuzzy)
    const match = findSchoolForFolder(normalisedFolderName, schoolByName);
    if (!match) {
      const msg = `No matching school in DB for "${cleanName}" (normalised: "${normalisedFolderName}")`;
      console.log(`  ⚠ ${msg} — skipping folder\n`);
      stats.warnings.push(msg);
      continue;
    }

    const school = match.school;
    if (match.matchedType === "fuzzy") {
      console.log(
        `  → Fuzzy matched to DB school "${school.schoolName}" (key "${match.key}", distance ${match.distance})`
      );
    }

    schoolsWithGraphics.add(school.id);
    console.log(`  → Matched: School ID ${school.id}`);

    const files = fs
      .readdirSync(folderPath)
      .filter((f) => f.toLowerCase().endsWith(".png"));

    for (const file of files) {
      const filePath = path.join(folderPath, file);
      const s3Key = `${S3_PREFIX}/schools/${sanitiseKeySegment(cleanName)}/${sanitiseKeySegment(file)}`;

      // Upload to S3
      const s3Url = await uploadToS3(filePath, s3Key);
      stats.schoolUploads++;

      // Parse category from filename
      const categoryName = parseCategoryFromSchoolFile(file);
      if (!categoryName) {
        const msg = `Could not parse category from "${file}"`;
        console.log(`  ⚠ ${msg}`);
        stats.warnings.push(msg);
        continue;
      }

      const category = categoryByName.get(categoryName);
      if (!category) {
        const msg = `Category "${categoryName}" not found in DB (from "${file}")`;
        console.log(`  ⚠ ${msg}`);
        stats.warnings.push(msg);
        continue;
      }

      // Update all ItemType rows for this school + category
      if (!DRY_RUN) {
        const result = await prisma.itemType.updateMany({
          where: {
            schoolId: school.id,
            categoryId: category.id,
          },
          data: { imageUrl: s3Url },
        });
        stats.schoolDbUpdates += result.count;
        console.log(
          `  → DB: ${result.count} ItemType(s) updated [${categoryName}]`
        );
      } else {
        console.log(
          `  [DRY RUN] Would update ItemTypes: schoolId=${school.id}, category=${categoryName}`
        );
      }
    }
    console.log();
  }

  // ── Phase 2: General colour images ─────────────────────────────
  console.log("━━━ Phase 2: General colour images ━━━\n");

  const generalDir = path.join(GRAPHICS_DIR, GENERAL_FOLDER);
  if (!fs.existsSync(generalDir)) {
    console.error(`❌ General colours folder not found: ${generalDir}`);
    process.exit(1);
  }

  const subfolders = fs
    .readdirSync(generalDir, { withFileTypes: true })
    .filter((e) => e.isDirectory());

  // Build lookup: { categoryName: { colourName: s3Url } }
  const generalUrlMap = {};

  for (const subfolder of subfolders) {
    const subfolderPath = path.join(generalDir, subfolder.name);
    const categoryName = parseCategoryFromSubfolder(subfolder.name);

    if (!categoryName) {
      const msg = `Could not parse category from subfolder "${subfolder.name}"`;
      console.log(`⚠ ${msg}`);
      stats.warnings.push(msg);
      continue;
    }

    console.log(`📁 General: ${categoryName} (from "${subfolder.name}")`);
    generalUrlMap[categoryName] = generalUrlMap[categoryName] || {};

    const categoryKey = categoryName.replace(/\s+/g, "_"); // spaces → underscores for S3 path

    const files = fs
      .readdirSync(subfolderPath)
      .filter((f) => f.toLowerCase().endsWith(".png"));

    for (const file of files) {
      const filePath = path.join(subfolderPath, file);
      const s3Key = `${S3_PREFIX}/general/${categoryKey}/${sanitiseKeySegment(file)}`;

      // Upload to S3
      const s3Url = await uploadToS3(filePath, s3Key);
      stats.generalUploads++;

      // Parse colour from filename
      const parsed = parseGeneralFile(file);
      if (!parsed) {
        const msg = `Could not parse colour from "${file}"`;
        console.log(`  ⚠ ${msg}`);
        stats.warnings.push(msg);
        continue;
      }

      generalUrlMap[categoryName][parsed.colour] = s3Url;
    }
    console.log();
  }

  // ── Phase 3: Assign general images as fallback ─────────────────
  console.log("━━━ Phase 3: Assign fallback images to remaining ItemTypes ━━━\n");

  // Categories without their own general images → borrow from another category
  const CATEGORY_FALLBACK = {
    "skort":        "uniform skirt",
    "house shirt":  "pe shirt",
    "gym shorts":   "pe shorts",
    // No fallback — leave blank:
    // "other shirts", "tie", "belt", "cap", "others"
  };

  // DB colour names that don't match any general image filename → map to closest.
  // Values are arrays — tried in order until one matches.
  const COLOUR_FALLBACK = {
    "navy blue":   ["dark blue", "medium blue"],
    "green":       ["medium green", "dark green", "light green"],
    "blue":        ["light blue", "dark blue", "medium blue"],
    "yellow":      ["light yellow", "dark yellow"],
    "grey":        ["dark grey", "light grey", "medium grey"],
    "royal blue":  ["medium blue", "dark blue"],
    "khaki":       ["beige"],
    "maroon":      ["dark red"],
  };

  /**
   * Look up a general image URL, trying direct match first,
   * then category fallback, then colour fallback, then both.
   */
  function resolveGeneralUrl(categoryName, colourName) {
    const categoriesToTry = [categoryName];
    if (CATEGORY_FALLBACK[categoryName]) {
      categoriesToTry.push(CATEGORY_FALLBACK[categoryName]);
    }

    const coloursToTry = [colourName];
    if (COLOUR_FALLBACK[colourName]) {
      coloursToTry.push(...COLOUR_FALLBACK[colourName]);
    }

    for (const cat of categoriesToTry) {
      for (const col of coloursToTry) {
        const url = generalUrlMap[cat]?.[col];
        if (url) return { url, resolvedCategory: cat, resolvedColour: col };
      }
    }

    return null;
  }

  const itemTypesToUpdate = await prisma.itemType.findMany({
    where: {
      schoolId: { notIn: [...schoolsWithGraphics] },
      imageUrl: null,
    },
    include: {
      category: true,
      primaryColour: true,
      school: true,
    },
  });

  console.log(
    `Found ${itemTypesToUpdate.length} ItemType(s) without custom graphics\n`
  );

  for (const itemType of itemTypesToUpdate) {
    const categoryName = itemType.category.categoryName.toLowerCase();
    const colourName = itemType.primaryColour.colourName.toLowerCase();

    const result = resolveGeneralUrl(categoryName, colourName);

    if (result) {
      if (!DRY_RUN) {
        await prisma.itemType.update({
          where: { id: itemType.id },
          data: { imageUrl: result.url },
        });
      }
      stats.fallbackUpdates++;

      // Show if a fallback was used
      const usedFallback =
        result.resolvedCategory !== categoryName || result.resolvedColour !== colourName;
      const fallbackLabel = usedFallback
        ? ` (via ${result.resolvedCategory} / ${result.resolvedColour})`
        : "";
      console.log(
        `  ✓ ItemType #${itemType.id} (${itemType.school.schoolName}): ${categoryName} / ${colourName}${fallbackLabel}`
      );
    } else {
      stats.skipped++;
      console.log(
        `  ⚠ No image for: ${categoryName} / ${colourName} — ItemType #${itemType.id} (${itemType.school.schoolName})`
      );
    }
  }

  // ── Summary ────────────────────────────────────────────────────
  console.log("\n╔══════════════════════════════════════════════════╗");
  console.log("║                    Summary                      ║");
  console.log("╠══════════════════════════════════════════════════╣");
  console.log(
    `║  Mode:                    ${DRY_RUN ? "DRY RUN" : "LIVE   "}                 ║`
  );
  console.log("╠──────────────────────────────────────────────────╣");
  console.log(
    `║  S3 uploads (school):     ${String(stats.schoolUploads).padStart(4)}                   ║`
  );
  console.log(
    `║  S3 uploads (general):    ${String(stats.generalUploads).padStart(4)}                   ║`
  );
  console.log(
    `║  DB updates (school):     ${String(stats.schoolDbUpdates).padStart(4)}                   ║`
  );
  console.log(
    `║  DB updates (fallback):   ${String(stats.fallbackUpdates).padStart(4)}                   ║`
  );
  console.log(
    `║  Skipped (no match):      ${String(stats.skipped).padStart(4)}                   ║`
  );
  console.log("╚══════════════════════════════════════════════════╝");

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