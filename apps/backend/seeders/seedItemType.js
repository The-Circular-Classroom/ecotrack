require('dotenv').config();
console.log('DATABASE_URL:', process.env.DATABASE_URL ? process.env.DATABASE_URL.substring(0, 30) + '...' : 'NOT SET');

const prisma = require('../services/database/prismaClient');

async function main() {
  console.log('🌱 Starting seed...');

  // 1. Seed Categories (Item_Category_Weights)
  // Using enum keys directly (PascalCase) as that's what Prisma expects internally
  const categories = await Promise.all([
    prisma.category.upsert({
      where: { categoryName: 'UniformShirt' },
      update: {},
      create: {
        categoryName: 'UniformShirt',
        weightKg: 0.250,
      },
    }),
    prisma.category.upsert({
      where: { categoryName: 'UniformPants' },
      update: {},
      create: {
        categoryName: 'UniformPants',
        weightKg: 0.350,
      },
    }),
  ]);
  console.log('✅ Created Categories:', categories.map(c => c.categoryName));

  // 2. Seed Colours
  const colours = await Promise.all([
    prisma.colour.upsert({
      where: { colourName: 'White' },
      update: {},
      create: {
        colourName: 'White',
        hexcode: '#FFFFFF',
      },
    }),
    prisma.colour.upsert({
      where: { colourName: 'Navy Blue' },
      update: {},
      create: {
        colourName: 'Navy Blue',
        hexcode: '#000080',
      },
    }),
    prisma.colour.upsert({
      where: { colourName: 'Khaki' },
      update: {},
      create: {
        colourName: 'Khaki',
        hexcode: '#C3B091',
      },
    }),
  ]);
  console.log('✅ Created Colours:', colours.map(c => c.colourName));

  // 3. Seed Patterns
  const patterns = await Promise.all([
    prisma.pattern.upsert({
      where: { patternName: 'Solid' },
      update: {},
      create: {
        patternName: 'Solid',
      },
    }),
    prisma.pattern.upsert({
      where: { patternName: 'Striped' },
      update: {},
      create: {
        patternName: 'Striped',
      },
    }),
  ]);
  console.log('✅ Created Patterns:', patterns.map(p => p.patternName));

  // 4. Seed Materials
  const materials = await Promise.all([
    prisma.material.upsert({
      where: { materialName: 'Cotton' },
      update: {},
      create: {
        materialName: 'Cotton',
      },
    }),
    prisma.material.upsert({
      where: { materialName: 'Polyester Blend' },
      update: {},
      create: {
        materialName: 'Polyester Blend',
      },
    }),
  ]);
  console.log('✅ Created Materials:', materials.map(m => m.materialName));

  // 5. Seed Size Categories
  const sizeCategories = await Promise.all([
    prisma.sizeCategory.upsert({
      where: { id: 1 },
      update: {},
      create: {
        brandSupplier: 'Generic School Supplier',
        sizeType: 'Alphabetical',
      },
    }),
    prisma.sizeCategory.upsert({
      where: { id: 2 },
      update: {},
      create: {
        brandSupplier: 'Generic School Supplier',
        sizeType: 'Numerical',
      },
    }),
  ]);
  console.log('✅ Created Size Categories:', sizeCategories.map(s => `${s.id}: ${s.sizeType}`));

  // 6. Seed Size Options for alphabetical sizes (for shirts)
  const alphabeticalSizes = await Promise.all([
    prisma.sizeOption.upsert({
      where: { sizeCategoryId_sizeName: { sizeCategoryId: sizeCategories[0].id, sizeName: 'XS' } },
      update: {},
      create: {
        sizeCategoryId: sizeCategories[0].id,
        sizeName: 'XS',
        sortOrder: 1,
      },
    }),
    prisma.sizeOption.upsert({
      where: { sizeCategoryId_sizeName: { sizeCategoryId: sizeCategories[0].id, sizeName: 'S' } },
      update: {},
      create: {
        sizeCategoryId: sizeCategories[0].id,
        sizeName: 'S',
        sortOrder: 2,
      },
    }),
    prisma.sizeOption.upsert({
      where: { sizeCategoryId_sizeName: { sizeCategoryId: sizeCategories[0].id, sizeName: 'M' } },
      update: {},
      create: {
        sizeCategoryId: sizeCategories[0].id,
        sizeName: 'M',
        sortOrder: 3,
      },
    }),
    prisma.sizeOption.upsert({
      where: { sizeCategoryId_sizeName: { sizeCategoryId: sizeCategories[0].id, sizeName: 'L' } },
      update: {},
      create: {
        sizeCategoryId: sizeCategories[0].id,
        sizeName: 'L',
        sortOrder: 4,
      },
    }),
    prisma.sizeOption.upsert({
      where: { sizeCategoryId_sizeName: { sizeCategoryId: sizeCategories[0].id, sizeName: 'XL' } },
      update: {},
      create: {
        sizeCategoryId: sizeCategories[0].id,
        sizeName: 'XL',
        sortOrder: 5,
      },
    }),
  ]);
  console.log('✅ Created Alphabetical Size Options:', alphabeticalSizes.map(s => s.sizeName));

  // Seed Size Options for numerical sizes (for pants)
  const numericalSizes = await Promise.all([
    prisma.sizeOption.upsert({
      where: { sizeCategoryId_sizeName: { sizeCategoryId: sizeCategories[1].id, sizeName: '28' } },
      update: {},
      create: {
        sizeCategoryId: sizeCategories[1].id,
        sizeName: '28',
        sortOrder: 1,
      },
    }),
    prisma.sizeOption.upsert({
      where: { sizeCategoryId_sizeName: { sizeCategoryId: sizeCategories[1].id, sizeName: '30' } },
      update: {},
      create: {
        sizeCategoryId: sizeCategories[1].id,
        sizeName: '30',
        sortOrder: 2,
      },
    }),
    prisma.sizeOption.upsert({
      where: { sizeCategoryId_sizeName: { sizeCategoryId: sizeCategories[1].id, sizeName: '32' } },
      update: {},
      create: {
        sizeCategoryId: sizeCategories[1].id,
        sizeName: '32',
        sortOrder: 3,
      },
    }),
    prisma.sizeOption.upsert({
      where: { sizeCategoryId_sizeName: { sizeCategoryId: sizeCategories[1].id, sizeName: '34' } },
      update: {},
      create: {
        sizeCategoryId: sizeCategories[1].id,
        sizeName: '34',
        sortOrder: 4,
      },
    }),
  ]);
  console.log('✅ Created Numerical Size Options:', numericalSizes.map(s => s.sizeName));

  // 7. Seed a School (required for ItemType)
  const school = await prisma.school.upsert({
    where: { id: 2 },
    update: {},
    create: {
      schoolName: 'Demo Primary School',
      address: '123 Education Street, Singapore 123456',
      postalCode: '123456',
      isCooperating: true,
    },
  });
  console.log('✅ Created School:', school.schoolName);

  // 8. Seed Item Types (2 dummy items)
  const itemTypes = await Promise.all([
    // Item Type 1: White Uniform Shirt
    prisma.itemType.upsert({
      where: { id: 1 },
      update: {},
      create: {
        schoolId: school.id,
        categoryId: categories[0].id, // Uniform Shirt
        primaryColourId: colours[0].id, // White
        secondaryColourId: colours[1].id, // Navy Blue (for collar/cuffs)
        patternId: patterns[0].id, // Solid
        materialId: materials[0].id, // Cotton
        sizeCategoryId: sizeCategories[0].id, // Alphabetical sizes
        gender: 'Unisex',
        imageUrl: 'https://example.com/images/white-uniform-shirt.jpg',
      },
    }),
    // Item Type 2: Khaki Uniform Pants
    prisma.itemType.upsert({
      where: { id: 2 },
      update: {},
      create: {
        schoolId: school.id,
        categoryId: categories[1].id, // Uniform Pants
        primaryColourId: colours[2].id, // Khaki
        secondaryColourId: null, // No secondary colour
        patternId: patterns[0].id, // Solid
        materialId: materials[1].id, // Polyester Blend
        sizeCategoryId: sizeCategories[1].id, // Numerical sizes
        gender: 'Male',
        imageUrl: 'https://example.com/images/khaki-uniform-pants.jpg',
      },
    }),
  ]);
  console.log('✅ Created Item Types:', itemTypes.map(i => `ID ${i.id}`));

  // 9. Seed Inventory Balances for each Item Type with different sizes
  const inventoryBalances = await Promise.all([
    // Inventory for Item Type 1 (Shirt) - Size M, for_sale at school
    prisma.inventoryBalance.upsert({
      where: {
        itemTypeId_sizeOptionId_itemStatus_storedAt: {
          itemTypeId: itemTypes[0].id,
          sizeOptionId: alphabeticalSizes[2].id, // M
          itemStatus: 'ForSale',
          storedAt: 'School',
        },
      },
      update: {},
      create: {
        itemTypeId: itemTypes[0].id,
        sizeOptionId: alphabeticalSizes[2].id, // M
        itemStatus: 'ForSale',
        quantity: 25,
        storedAt: 'School',
      },
    }),
    // Inventory for Item Type 1 (Shirt) - Size L, for_sale at school
    prisma.inventoryBalance.upsert({
      where: {
        itemTypeId_sizeOptionId_itemStatus_storedAt: {
          itemTypeId: itemTypes[0].id,
          sizeOptionId: alphabeticalSizes[3].id, // L
          itemStatus: 'ForSale',
          storedAt: 'School',
        },
      },
      update: {},
      create: {
        itemTypeId: itemTypes[0].id,
        sizeOptionId: alphabeticalSizes[3].id, // L
        itemStatus: 'ForSale',
        quantity: 20,
        storedAt: 'School',
      },
    }),
    // Inventory for Item Type 1 (Shirt) - Size S, for_sale at TCC
    prisma.inventoryBalance.upsert({
      where: {
        itemTypeId_sizeOptionId_itemStatus_storedAt: {
          itemTypeId: itemTypes[0].id,
          sizeOptionId: alphabeticalSizes[1].id, // S
          itemStatus: 'ForSale',
          storedAt: 'TCC',
        },
      },
      update: {},
      create: {
        itemTypeId: itemTypes[0].id,
        sizeOptionId: alphabeticalSizes[1].id, // S
        itemStatus: 'ForSale',
        quantity: 15,
        storedAt: 'TCC',
      },
    }),
    // Inventory for Item Type 2 (Pants) - Size 30, for_sale at school
    prisma.inventoryBalance.upsert({
      where: {
        itemTypeId_sizeOptionId_itemStatus_storedAt: {
          itemTypeId: itemTypes[1].id,
          sizeOptionId: numericalSizes[1].id, // 30
          itemStatus: 'ForSale',
          storedAt: 'School',
        },
      },
      update: {},
      create: {
        itemTypeId: itemTypes[1].id,
        sizeOptionId: numericalSizes[1].id, // 30
        itemStatus: 'ForSale',
        quantity: 18,
        storedAt: 'School',
      },
    }),
    // Inventory for Item Type 2 (Pants) - Size 32, for_sale at school
    prisma.inventoryBalance.upsert({
      where: {
        itemTypeId_sizeOptionId_itemStatus_storedAt: {
          itemTypeId: itemTypes[1].id,
          sizeOptionId: numericalSizes[2].id, // 32
          itemStatus: 'ForSale',
          storedAt: 'School',
        },
      },
      update: {},
      create: {
        itemTypeId: itemTypes[1].id,
        sizeOptionId: numericalSizes[2].id, // 32
        itemStatus: 'ForSale',
        quantity: 22,
        storedAt: 'School',
      },
    }),
    // Some sold inventory for Item Type 1
    prisma.inventoryBalance.upsert({
      where: {
        itemTypeId_sizeOptionId_itemStatus_storedAt: {
          itemTypeId: itemTypes[0].id,
          sizeOptionId: alphabeticalSizes[2].id, // M
          itemStatus: 'Sold',
          storedAt: 'School',
        },
      },
      update: {},
      create: {
        itemTypeId: itemTypes[0].id,
        sizeOptionId: alphabeticalSizes[2].id, // M
        itemStatus: 'Sold',
        quantity: 5,
        storedAt: 'School',
      },
    }),
  ]);
  console.log('✅ Created Inventory Balances:', inventoryBalances.length, 'records');

  console.log('\n🎉 Seed completed successfully!');
  console.log('\n📊 Summary:');
  console.log(`   - ${categories.length} Categories`);
  console.log(`   - ${colours.length} Colours`);
  console.log(`   - ${patterns.length} Patterns`);
  console.log(`   - ${materials.length} Materials`);
  console.log(`   - ${sizeCategories.length} Size Categories`);
  console.log(`   - ${alphabeticalSizes.length + numericalSizes.length} Size Options`);
  console.log(`   - 1 School`);
  console.log(`   - ${itemTypes.length} Item Types`);
  console.log(`   - ${inventoryBalances.length} Inventory Balances`);
}

main()
  .catch((e) => {
    console.error('❌ Error during seeding:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });