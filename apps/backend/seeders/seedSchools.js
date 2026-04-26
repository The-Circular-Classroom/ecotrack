require('dotenv').config();

const fs = require('fs');
const path = require('path');
const prisma = require('../services/database/prismaClient');

// Parse CSV line handling commas inside quotes
function parseLine(line) {
  const values = [];
  let current = '';
  let inQuotes = false;
  
  for (let j = 0; j < line.length; j++) {
    const char = line[j];
    if (char === '"') {
      inQuotes = !inQuotes;
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }
  values.push(current.trim());
  
  return values;
}

// Parse CSV file
function parseCSV(csvContent) {
  const lines = csvContent.split('\n');
  const headers = parseLine(lines[0]);
  
  const records = [];
  
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i].trim();
    if (!line) continue;
    
    const values = parseLine(line);
    const record = {};
    
    headers.forEach((header, index) => {
      // Remove quotes from values
      let value = values[index] || '';
      value = value.replace(/^"|"$/g, '').trim();
      record[header] = value;
    });
    
    records.push(record);
  }
  
  return records;
}

// Clean value - convert 'na' to null
function cleanValue(value) {
  if (!value || value.toLowerCase() === 'na') {
    return null;
  }
  return value.trim();
}

async function main() {
  console.log('🌱 Starting school seeding...');
  
  // Read CSV file - place the CSV in the seeders folder
  const csvPath = path.join(__dirname, 'General_information_of_schools_FIXED.csv');
  
  if (!fs.existsSync(csvPath)) {
    console.error('❌ CSV file not found at:', csvPath);
    console.log('📁 Please place General_information_of_schools_FIXED.csv in the seeders folder');
    process.exit(1);
  }
  
  const csvContent = fs.readFileSync(csvPath, 'utf-8');
  const schools = parseCSV(csvContent);
  
  console.log(`📄 Found ${schools.length} schools in CSV`);
  
  // Map CSV columns to School model fields
  const schoolDataList = schools
    .filter(school => school['school_name'] && school['school_name'].toLowerCase() !== 'na')
    .map(school => ({
      schoolName: cleanValue(school['school_name']),
      address: cleanValue(school['address']),
      mrtDesc: cleanValue(school['mrt_desc']),
      dgpCode: cleanValue(school['dgp_code']),
      mainlevelCode: cleanValue(school['mainlevel_code']),
      natureCode: cleanValue(school['nature_code']),
      postalCode: cleanValue(school['postal_code']),
      zoneCode: cleanValue(school['zone_code']),
      status: 'active',
      logoUrl: null,
      isCooperating: true
    }));
  
  console.log(`📝 Prepared ${schoolDataList.length} valid schools for insertion`);
  
  // Insert schools in batches using createMany
  const BATCH_SIZE = 50;
  let totalCreated = 0;
  let errors = 0;
  
  for (let i = 0; i < schoolDataList.length; i += BATCH_SIZE) {
    const batch = schoolDataList.slice(i, i + BATCH_SIZE);
    const batchNum = Math.floor(i / BATCH_SIZE) + 1;
    
    try {
      const result = await prisma.school.createMany({
        data: batch,
        skipDuplicates: true,
      });
      
      totalCreated += result.count;
      console.log(`✅ Batch ${batchNum}: Created ${result.count} schools`);
    } catch (error) {
      console.error(`❌ Error in batch ${batchNum}:`, error.message);
      
      // Fallback: try individual inserts for this batch
      for (const schoolData of batch) {
        try {
          await prisma.school.create({ data: schoolData });
          totalCreated++;
        } catch (individualError) {
          errors++;
          console.error(`   ❌ Failed: ${schoolData.schoolName} - ${individualError.message}`);
        }
      }
    }
  }
  
  console.log('\n🎉 School seeding completed!');
  console.log('\n📊 Summary:');
  console.log(`   - ${totalCreated} schools created`);
  console.log(`   - ${errors} errors`);
  
  // Show sample of created data
  const sample = await prisma.school.findMany({ take: 5 });
  console.log('\n📋 Sample schools in database:');
  sample.forEach((s, idx) => {
    console.log(`   ${idx + 1}. ${s.schoolName}`);
    console.log(`      Zone: ${s.zoneCode || 'N/A'} | Level: ${s.mainlevelCode || 'N/A'}`);
  });
  
  // Show total count
  const totalCount = await prisma.school.count();
  console.log(`\n📈 Total schools in database: ${totalCount}`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });