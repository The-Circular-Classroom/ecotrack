import { PrismaClient, ItemStatus, StorageLocation } from '../generated/prisma';
import { PrismaPg } from '@prisma/adapter-pg';

const adapter = new PrismaPg({
  connectionString: process.env.DATABASE_URL!,
});

const prisma = new PrismaClient({ adapter });


async function main() {
  console.log("🌱 Starting seed...\n");

  // ============================================================
  // TEARDOWN — reverse dependency order
  // ============================================================
    console.log("🗑️  Clearing existing data and resetting IDs...");

    // List all your tables in a single array
    const tablenames = [
    'recipe_ingredients', 'product_recipes', 'product_styles', 'products', 'product_types', 'styles',
    'inventory_balance', 'transactions', 'donation_drives', 'item_type_tags', 'tags',
    'item_types', 'size_options', 'size_categories', 'brand_suppliers', 'item_category_weights',
    'colours', 'patterns', 'materials', 'school_partnerships', 'users', 'schools'
    ];

    for (const tablename of tablenames) {
    // TRUNCATE is faster than deleteMany and RESTART IDENTITY resets sequences to 1
    await prisma.$executeRawUnsafe(
        `TRUNCATE TABLE "${tablename}" RESTART IDENTITY CASCADE;`
    );
    }

    console.log("✅ All tables cleared and auto-increment counters reset.\n");

  // ============================================================
  // TIER 1 — No dependencies
  // ============================================================

  // -------------------- SCHOOLS --------------------
  console.log("🏫 Seeding schools...");
  const schools = await Promise.all(
    [
        {
        schoolName: "ADMIRALTY PRIMARY SCHOOL",
        address: "11 WOODLANDS CIRCLE",
        mrtDesc: "Admiralty Station",
        dgpCode: "WOODLANDS",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "738907",
        zoneCode: "NORTH",
        schoolEmail: "ADMIRALTY_PS@MOE.EDU.SG",
        schoolNumber: "63620598",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ADMIRALTY SECONDARY SCHOOL",
        address: "31 WOODLANDS CRESCENT",
        mrtDesc: "ADMIRALTY MRT",
        dgpCode: "WOODLANDS",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "737916",
        zoneCode: "NORTH",
        schoolEmail: "Admiralty_SS@moe.edu.sg",
        schoolNumber: "63651733",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "AHMAD IBRAHIM PRIMARY SCHOOL",
        address: "10 YISHUN STREET 11",
        mrtDesc: "Yishun",
        dgpCode: "YISHUN",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "768643",
        zoneCode: "NORTH",
        schoolEmail: "AIPS@MOE.EDU.SG",
        schoolNumber: "67592906",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "AHMAD IBRAHIM SECONDARY SCHOOL",
        address: "751 YISHUN AVENUE 7",
        mrtDesc: "CANBERRA MRT, YISHUN MRT",
        dgpCode: "YISHUN",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "768928",
        zoneCode: "NORTH",
        schoolEmail: "AISS@MOE.EDU.SG",
        schoolNumber: "67585384",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "AI TONG SCHOOL",
        address: "100 Bright Hill Drive",
        mrtDesc: "Bishan MRT",
        dgpCode: "BISHAN",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "579646",
        zoneCode: "SOUTH",
        schoolEmail: "AITONG_SCH@MOE.EDU.SG",
        schoolNumber: "64547672",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ALEXANDRA PRIMARY SCHOOL",
        address: "2A Prince Charles Crescent",
        mrtDesc: "Redhill Station; Tiong Bahru Station",
        dgpCode: "BUKIT MERAH",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "159016",
        zoneCode: "SOUTH",
        schoolEmail: "alexandra_ps@moe.edu.sg",
        schoolNumber: "62485400",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ANCHOR GREEN PRIMARY SCHOOL",
        address: "31 Anchorvale Drive",
        mrtDesc: "MRT : NE16-Sengkang; LRT : SW7-TongKang",
        dgpCode: "SENG KANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "544969",
        zoneCode: "NORTH",
        schoolEmail: "anchorgreen_ps@moe.edu.sg",
        schoolNumber: "68861356",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ANDERSON PRIMARY SCHOOL",
        address: "19 ANG MO KIO AVE 9",
        mrtDesc: "Yio Chu Kang MRT Station (NS 15); Lentor MRT Station (TE5)",
        dgpCode: "ANG MO KIO",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "569785",
        zoneCode: "NORTH",
        schoolEmail: "ANDERSON_PS@MOE.EDU.SG",
        schoolNumber: "64560340",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ANDERSON SECONDARY SCHOOL",
        address: "10 ANG MO KIO STREET 53",
        mrtDesc: "ANG MO KIO MRT, YIO CHU KANG MRT",
        dgpCode: "ANG MO KIO",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "569206",
        zoneCode: "NORTH",
        schoolEmail: "ANDERSON_SS@MOE.EDU.SG",
        schoolNumber: "64598303",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ANDERSON SERANGOON JUNIOR COLLEGE",
        address: "1033 Upper Serangoon Road",
        mrtDesc: "Kovan MRT Station",
        dgpCode: "HOUGANG",
        mainlevelCode: "JUNIOR COLLEGE",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "534768",
        zoneCode: "NORTH",
        schoolEmail: "asrjc@moe.edu.sg",
        schoolNumber: "64596822",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ANG MO KIO PRIMARY SCHOOL",
        address: "20 ANG MO KIO AVENUE 3",
        mrtDesc: "Ang Mo Kio MRT Station; Mayflower MRT Station",
        dgpCode: "ANG MO KIO",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "569920",
        zoneCode: "SOUTH",
        schoolEmail: "AMKPS@MOE.EDU.SG",
        schoolNumber: "64520794",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ANG MO KIO SECONDARY SCHOOL",
        address: "6 ANG MO KIO STREET 22",
        mrtDesc: "ANG MO KIO MRT",
        dgpCode: "ANG MO KIO",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "569362",
        zoneCode: "SOUTH",
        schoolEmail: "AMKSS@MOE.EDU.SG",
        schoolNumber: "64548605",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ANGLICAN HIGH SCHOOL",
        address: "600 UPPER CHANGI ROAD",
        mrtDesc: "TANAH MERAH MRT",
        dgpCode: "BEDOK",
        mainlevelCode: "SECONDARY (S1-S4)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "487012",
        zoneCode: "EAST",
        schoolEmail: "AHS@MOE.EDU.SG",
        schoolNumber: "62414866",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ANGLO-CHINESE JUNIOR COLLEGE",
        address: "25 DOVER CLOSE EAST",
        mrtDesc: "Buona Vista",
        dgpCode: "QUEENSTOWN",
        mainlevelCode: "JUNIOR COLLEGE",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "139745",
        zoneCode: "WEST",
        schoolEmail: "ACJC@MOE.EDU.SG",
        schoolNumber: "67750511",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ANGLO-CHINESE SCHOOL (BARKER ROAD)",
        address: "60 BARKER ROAD",
        mrtDesc: "NEWTON MRT, STEVENS MRT",
        dgpCode: "NOVENA",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "BOYS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "309919",
        zoneCode: "SOUTH",
        schoolEmail: "ACBRS@MOE.EDU.SG",
        schoolNumber: "62561633",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ANGLO-CHINESE SCHOOL (INDEPENDENT)",
        address: "121 DOVER ROAD",
        mrtDesc: "DOVER MRT, BUONA VISTA MRT, ONE-NORTH MRT",
        dgpCode: "QUEENSTOWN",
        mainlevelCode: "MIXED LEVEL (S1-JC2)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "INDEPENDENT SCHOOL",
        postalCode: "139650",
        zoneCode: "SOUTH",
        schoolEmail: "ACIS@MOE.EDU.SG",
        schoolNumber: "67731633",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ANGLO-CHINESE SCHOOL (JUNIOR)",
        address: "16 WINSTEDT ROAD",
        mrtDesc: "Newton MRT Station",
        dgpCode: "CENTRAL",
        mainlevelCode: "PRIMARY",
        natureCode: "BOYS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "227988",
        zoneCode: "SOUTH",
        schoolEmail: "ACJS@MOE.EDU.SG",
        schoolNumber: "67337911",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ANGLO-CHINESE SCHOOL (PRIMARY)",
        address: "50 BARKER ROAD",
        mrtDesc: "Newton MRT Station",
        dgpCode: "NOVENA",
        mainlevelCode: "PRIMARY",
        natureCode: "BOYS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "309918",
        zoneCode: "SOUTH",
        schoolEmail: "ACPS@MOE.EDU.SG",
        schoolNumber: "62501633",
        status: "active",
        isCooperating: true,
        },
        {
        schoolName: "ANGSANA PRIMARY SCHOOL",
        address: "51 Tampines Street 61",
        mrtDesc: "Tampines",
        dgpCode: "TAMPINES",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "528565",
        zoneCode: "EAST",
        schoolEmail: "angsana_pri@moe.edu.sg",
        schoolNumber: "67830427",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ASSUMPTION ENGLISH SCHOOL",
        address: "622 UPPER BUKIT TIMAH ROAD",
        mrtDesc: "CASHEW MRT",
        dgpCode: "BUKIT PANJANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "678117",
        zoneCode: "WEST",
        schoolEmail: "AES@MOE.EDU.SG",
        schoolNumber: "65729100",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ASSUMPTION PATHWAY SCHOOL",
        address: "30 Cashew Road",
        mrtDesc: "DOWNTOWN LINE 2, CASHEW MRT",
        dgpCode: "BUKIT PANJANG",
        mainlevelCode: "SECONDARY (S1-S4)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "SPECIALISED SCHOOL",
        postalCode: "679697",
        zoneCode: "WEST",
        schoolEmail: "aps@schools.gov.sg",
        schoolNumber: "62793000",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "BARTLEY SECONDARY SCHOOL",
        address: "10 JALAN BUNGA RAMPAI",
        mrtDesc: "BARTLEY MRT, TAI SENG MRT",
        dgpCode: "TOA PAYOH",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "538403",
        zoneCode: "SOUTH",
        schoolEmail: "BARTLEY_SS@MOE.EDU.SG",
        schoolNumber: "62889013",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "BEACON PRIMARY SCHOOL",
        address: "36 Bukit Panjang Ring Road",
        mrtDesc: "Bangkit LRT, Fajar LRT Station, Bukit Panjang MRT",
        dgpCode: "BUKIT PANJANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "679944",
        zoneCode: "WEST",
        schoolEmail: "beaconprisch@moe.edu.sg",
        schoolNumber: "67697255",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "BEATTY SECONDARY SCHOOL",
        address: "1 TOA PAYOH NORTH",
        mrtDesc: "BRADDELL MRT, TOA PAYOH MRT",
        dgpCode: "TOA PAYOH",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "318990",
        zoneCode: "SOUTH",
        schoolEmail: "BEATTY_SS@MOE.EDU.SG",
        schoolNumber: "62569108",
        status: "active",
        isCooperating: true,
        },
        {
        schoolName: "BEDOK GREEN PRIMARY SCHOOL",
        address: "1 BEDOK SOUTH AVE 2",
        mrtDesc: "Bedok MRT Station, Tanah Merah MRT Station",
        dgpCode: "BEDOK",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "469317",
        zoneCode: "EAST",
        schoolEmail: "bgps@moe.edu.sg",
        schoolNumber: "64425416",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "BEDOK GREEN SECONDARY SCHOOL",
        address: "360 BEDOK NORTH AVE 3",
        mrtDesc: "BEDOK MRT, BEDOK RESERVOIR MRT",
        dgpCode: "BEDOK",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "469722",
        zoneCode: "EAST",
        schoolEmail: "BGSS@MOE.EDU.SG",
        schoolNumber: "64463301",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "BEDOK SOUTH SECONDARY SCHOOL",
        address: "1 JALAN LANGGAR BEDOK",
        mrtDesc: "TANAH MERAH MRT",
        dgpCode: "BEDOK",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "468585",
        zoneCode: "EAST",
        schoolEmail: "BSSS@MOE.EDU.SG",
        schoolNumber: "64414479",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "BEDOK VIEW SECONDARY SCHOOL",
        address: "6 BEDOK SOUTH AVENUE 3",
        mrtDesc: "TANAH MERAH MRT",
        dgpCode: "BEDOK",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "469293",
        zoneCode: "EAST",
        schoolEmail: "BEDOKVIEW_SS@MOE.EDU.SG",
        schoolNumber: "64430563",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "BENDEMEER PRIMARY SCHOOL",
        address: "91 BENDEMEER ROAD",
        mrtDesc: "Boon Keng, Kallang",
        dgpCode: "KALLANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "339948",
        zoneCode: "SOUTH",
        schoolEmail: "BENDEMEER_PS@MOE.EDU.SG",
        schoolNumber: "62982911",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "BENDEMEER SECONDARY SCHOOL",
        address: "1 ST WILFRED ROAD",
        mrtDesc: "BOON KENG MRT",
        dgpCode: "KALLANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "327919",
        zoneCode: "SOUTH",
        schoolEmail: "BENDEMEER_SS@MOE.EDU.SG",
        schoolNumber: "62927616",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "BLANGAH RISE PRIMARY SCHOOL",
        address: "91 TELOK BLANGAH HEIGHTS",
        mrtDesc: "Telok Blangah, Tiong Bahru & Redhill",
        dgpCode: "BUKIT MERAH",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "109100",
        zoneCode: "SOUTH",
        schoolEmail: "BRPS@MOE.EDU.SG",
        schoolNumber: "62717387",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "BOON LAY GARDEN PRIMARY SCHOOL",
        address: "20 BOON LAY DRIVE",
        mrtDesc: "Lakeside & Boon Lay",
        dgpCode: "JURONG WEST",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "649930",
        zoneCode: "WEST",
        schoolEmail: "BLGPS@MOE.EDU.SG",
        schoolNumber: "63160998",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "BOON LAY SECONDARY SCHOOL",
        address: "11 JURONG WEST STREET 65",
        mrtDesc: "Boon Lay",
        dgpCode: "JURONG WEST",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "648354",
        zoneCode: "WEST",
        schoolEmail: "BLSS@MOE.EDU.SG",
        schoolNumber: "67940161",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "BOWEN SECONDARY SCHOOL",
        address: "2 LORONG NAPIRI",
        mrtDesc: "HOUGANG MRT, SERANGOON MRT, SENGKANG MRT",
        dgpCode: "HOUGANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "547529",
        zoneCode: "NORTH",
        schoolEmail: "BOWEN_SS@MOE.EDU.SG",
        schoolNumber: "63859466",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "BROADRICK SECONDARY SCHOOL",
        address: "61 DAKOTA CRESCENT",
        mrtDesc: "DAKOTA MRT",
        dgpCode: "GEYLANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "399935",
        zoneCode: "EAST",
        schoolEmail: "BROADRICK_SS@MOE.EDU.SG",
        schoolNumber: "63445025",
        status: "active",
        isCooperating: true,
        },
        {
        schoolName: "BUKIT BATOK SECONDARY SCHOOL",
        address: "50 BUKIT BATOK WEST AVE 8",
        mrtDesc: "BUKIT BATOK MRT",
        dgpCode: "BUKIT BATOK",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "658962",
        zoneCode: "WEST",
        schoolEmail: "BBSS@MOE.EDU.SG",
        schoolNumber: "63799413",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "BUKIT MERAH SECONDARY SCHOOL",
        address: "10 LENGKOK BAHRU",
        mrtDesc: "REDHILL MRT",
        dgpCode: "BUKIT MERAH",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "159050",
        zoneCode: "SOUTH",
        schoolEmail: "BMSS@MOE.EDU.SG",
        schoolNumber: "64748934",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "BUKIT PANJANG GOVT. HIGH SCHOOL",
        address: "7 CHOA CHU KANG AVE 4",
        mrtDesc: "CHOA CHU KANG MRT",
        dgpCode: "CHOA CHU KANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "689809",
        zoneCode: "WEST",
        schoolEmail: "BPGHS@MOE.EDU.SG",
        schoolNumber: "67691031",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "BUKIT PANJANG PRIMARY SCHOOL",
        address: "109 CASHEW ROAD",
        mrtDesc: "From Pending LRT station to Choa Chu Kang MRT station",
        dgpCode: "BUKIT PANJANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "679676",
        zoneCode: "WEST",
        schoolEmail: "BPPS@MOE.EDU.SG",
        schoolNumber: "67691912",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "BUKIT TIMAH PRIMARY SCHOOL",
        address: "111 Lorong Kismis",
        mrtDesc: "Beauty World, Bukit Batok and Clementi Stations",
        dgpCode: "BUKIT TIMAH",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "598112",
        zoneCode: "WEST",
        schoolEmail: "bukittimahps@moe.edu.sg",
        schoolNumber: "64662863",
        status: "active",
        isCooperating: true,
        },
        {
        schoolName: "BUKIT VIEW PRIMARY SCHOOL",
        address: "18 BUKIT BATOK STREET 21",
        mrtDesc: "Bukit Batok MRT Station",
        dgpCode: "BUKIT BATOK",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "659634",
        zoneCode: "WEST",
        schoolEmail: "BUKITVIEW_PS@MOE.EDU.SG",
        schoolNumber: "65661980",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "BUKIT VIEW SECONDARY SCHOOL",
        address: "16 BUKIT BATOK STREET 21",
        mrtDesc: "BUKIT BATOK MRT",
        dgpCode: "BUKIT BATOK",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "659633",
        zoneCode: "WEST",
        schoolEmail: "BUKITVIEW_SS@MOE.EDU.SG",
        schoolNumber: "65661990",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CANBERRA PRIMARY SCHOOL",
        address: "21 ADMIRALTY DRIVE",
        mrtDesc: "Sembawang MRT Station",
        dgpCode: "SEMBAWANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "757714",
        zoneCode: "NORTH",
        schoolEmail: "CANBERRA_PS@MOE.EDU.SG",
        schoolNumber: "67597433",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CANBERRA SECONDARY SCHOOL",
        address: "51 SEMBAWANG DRIVE",
        mrtDesc: "SEMBAWANG MRT",
        dgpCode: "SEMBAWANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "757699",
        zoneCode: "NORTH",
        schoolEmail: "CANBERRA_SS@MOE.EDU.SG",
        schoolNumber: "67585070",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CANOSSA CATHOLIC PRIMARY SCHOOL",
        address: "1 Sallim Road",
        mrtDesc: "Nearest MRT station: Mattar Station (about 3-minute walk)",
        dgpCode: "GEYLANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "387621",
        zoneCode: "EAST",
        schoolEmail: "ccps@moe.edu.sg",
        schoolNumber: "68441418",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CANTONMENT PRIMARY SCHOOL",
        address: "1 CANTONMENT CLOSE",
        mrtDesc: "Tanjong Pagar; Outram Park",
        dgpCode: "BUKIT MERAH",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "88256",
        zoneCode: "SOUTH",
        schoolEmail: "cantonment_ps@moe.edu.sg",
        schoolNumber: "65119555",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CASUARINA PRIMARY SCHOOL",
        address: "30 PASIR RIS ST 41",
        mrtDesc: "Pasir Ris MRT Station",
        dgpCode: "PASIR RIS",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "518935",
        zoneCode: "EAST",
        schoolEmail: "CASUARINA_PS@MOE.EDU.SG",
        schoolNumber: "65837132",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CATHOLIC HIGH SCHOOL",
        address: "9 BISHAN STREET 22",
        mrtDesc: "BISHAN MRT",
        dgpCode: "BISHAN",
        mainlevelCode: "MIXED LEVEL (P1-S4)",
        natureCode: "BOYS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "579767",
        zoneCode: "NORTH",
        schoolEmail: "CHS@MOE.EDU.SG",
        schoolNumber: "64582177 (Secondary)",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CATHOLIC JUNIOR COLLEGE",
        address: "129 WHITLEY ROAD",
        mrtDesc: "Toa Payoh (NS Line), Novena (NS Line), Stevens (DT Line), Caldecott (CC Line,TE Line)",
        dgpCode: "NOVENA",
        mainlevelCode: "JUNIOR COLLEGE",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "297822",
        zoneCode: "SOUTH",
        schoolEmail: "CATHOLIC_JC@MOE.EDU.SG",
        schoolNumber: "62524083",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CEDAR GIRLS' SECONDARY SCHOOL",
        address: "1 CEDAR AVENUE",
        mrtDesc: "WOODLEIGH MRT, POTONG PASIR MRT, MATTAR MRT",
        dgpCode: "TOA PAYOH",
        mainlevelCode: "SECONDARY (S1-S4)",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "349692",
        zoneCode: "SOUTH",
        schoolEmail: "CEDARGIRLSSS@MOE.EDU.SG",
        schoolNumber: "62884909",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CEDAR PRIMARY SCHOOL",
        address: "15 CEDAR AVENUE",
        mrtDesc: "Potong Pasir MRT Station",
        dgpCode: "TOA PAYOH",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "349700",
        zoneCode: "SOUTH",
        schoolEmail: "CEDAR_PS@MOE.EDU.SG",
        schoolNumber: "62885633",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CHANGKAT CHANGI SECONDARY SCHOOL",
        address: "23 SIMEI ST 3",
        mrtDesc: "SIMEI MRT",
        dgpCode: "TAMPINES",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "529894",
        zoneCode: "EAST",
        schoolEmail: "CHANGKATCHGI@MOE.EDU.SG",
        schoolNumber: "67859790",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CHANGKAT PRIMARY SCHOOL",
        address: "11 SIMEI ST 3",
        mrtDesc: "Simei MRT Station",
        dgpCode: "TAMPINES",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "529896",
        zoneCode: "EAST",
        schoolEmail: "CHANGKAT_PS@MOE.EDU.SG",
        schoolNumber: "67830923",
        status: "active",
        isCooperating: true,
        },
        {
        schoolName: "CHIJ (KATONG) PRIMARY",
        address: "17 MARTIA ROAD",
        mrtDesc: "MARINE PARADE; EUNOS; PAYA LEBAR",
        dgpCode: "BEDOK",
        mainlevelCode: "PRIMARY",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "424821",
        zoneCode: "EAST",
        schoolEmail: "CHIJKTPS@MOE.EDU.SG",
        schoolNumber: "63443072",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "VALOUR PRIMARY SCHOOL",
        address: "49 Punggol Central",
        mrtDesc: null,
        dgpCode: "PUNGGOL",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "828728",
        zoneCode: "EAST",
        schoolEmail: "valour_ps@moe.edu.sg",
        schoolNumber: "62426390",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CHIJ (KELLOCK)",
        address: "1 Bukit Teresa Road",
        mrtDesc: "Outram Park Station",
        dgpCode: "BUKIT MERAH",
        mainlevelCode: "PRIMARY",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "99757",
        zoneCode: "SOUTH",
        schoolEmail: "CHIJKS@MOE.EDU.SG",
        schoolNumber: "62730096",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CHIJ KATONG CONVENT",
        address: "346 MARINE TERRACE",
        mrtDesc: "BEDOK MRT, KEMBANGAN MRT, EUNOS MRT, PAYA LEBAR MRT, MARINE TERRACE MRT",
        dgpCode: "MARINE PARADE",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "449150",
        zoneCode: "EAST",
        schoolEmail: "CHIJKTCS@MOE.EDU.SG",
        schoolNumber: "64486433",
        status: "active",
        isCooperating: true,
        },
        {
        schoolName: "CHIJ OUR LADY OF GOOD COUNSEL",
        address: "2C Burghley Drive",
        mrtDesc: "Ang Mo Kio MRT, Bishan MRT, Serangoon MRT station.",
        dgpCode: "SERANGOON",
        mainlevelCode: "PRIMARY",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "558979",
        zoneCode: "SOUTH",
        schoolEmail: "CHIJOLGCS@MOE.EDU.SG",
        schoolNumber: "62886930",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CHIJ OUR LADY OF THE NATIVITY",
        address: "1257 UPPER SERANGOON ROAD",
        mrtDesc: "Hougang MRT",
        dgpCode: "HOUGANG",
        mainlevelCode: "PRIMARY",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "534793",
        zoneCode: "SOUTH",
        schoolEmail: "CHIJPS@MOE.EDU.SG",
        schoolNumber: "63852455",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CHIJ OUR LADY QUEEN OF PEACE",
        address: "4 Chestnut Drive",
        mrtDesc: "Cashew and Hillview",
        dgpCode: "BUKIT PANJANG",
        mainlevelCode: "PRIMARY",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "679287",
        zoneCode: "WEST",
        schoolEmail: "CHIJBTS@MOE.EDU.SG",
        schoolNumber: "67691529",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CHIJ PRIMARY (TOA PAYOH)",
        address: "628 Lorong 1 Toa Payoh",
        mrtDesc: "Toa Payoh",
        dgpCode: "TOA PAYOH",
        mainlevelCode: "PRIMARY",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "319765",
        zoneCode: "SOUTH",
        schoolEmail: "CHIJTPPS@MOE.EDU.SG",
        schoolNumber: "63532164",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CHIJ SECONDARY (TOA PAYOH)",
        address: "626 LORONG 1 TOA PAYOH",
        mrtDesc: "TOA PAYOH MRT",
        dgpCode: "TOA PAYOH",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "319764",
        zoneCode: "SOUTH",
        schoolEmail: "CHIJTPSS@MOE.EDU.SG",
        schoolNumber: "63534972",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CHIJ ST. JOSEPH'S CONVENT",
        address: "62 SENGKANG EAST WAY",
        mrtDesc: "SENGKANG MRT",
        dgpCode: "SENG KANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "548595",
        zoneCode: "NORTH",
        schoolEmail: "CHIJSJCS@MOE.EDU.SG",
        schoolNumber: "64897580",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CHIJ ST. NICHOLAS GIRLS' SCHOOL",
        address: "501 ANG MO KIO STREET 13",
        mrtDesc: "ANG MO KIO MRT, YIO CHU KANG MRT, MAYFLOWER MRT",
        dgpCode: "ANG MO KIO",
        mainlevelCode: "MIXED LEVEL (P1-S4)",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "569405",
        zoneCode: "NORTH",
        schoolEmail: "CHIJSNG@MOE.EDU.SG",
        schoolNumber: "63541839 (Secondary)",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CHIJ ST. THERESA'S CONVENT",
        address: "160 LOWER DELTA ROAD",
        mrtDesc: "HARBOURFRONT MRT, TIONG BAHRU MRT",
        dgpCode: "BUKIT MERAH",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "99138",
        zoneCode: "SOUTH",
        schoolEmail: "CHIJSTCS@MOE.EDU.SG",
        schoolNumber: "64775777",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CHONGFU SCHOOL",
        address: "170 YISHUN AVENUE 6",
        mrtDesc: "Yishun MRT station",
        dgpCode: "YISHUN",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "768959",
        zoneCode: "NORTH",
        schoolEmail: "CFPS@MOE.EDU.SG",
        schoolNumber: "67585527",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CHONGZHENG PRIMARY SCHOOL",
        address: "1 TAMPINES STREET 21",
        mrtDesc: "Tampines MRT Station; Tampines East MRT Station",
        dgpCode: "TAMPINES",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "529392",
        zoneCode: "EAST",
        schoolEmail: "CZPS@MOE.EDU.SG",
        schoolNumber: "67819002",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CHRIST CHURCH SECONDARY SCHOOL",
        address: "20 WOODLANDS DRIVE 17",
        mrtDesc: "WOODLANDS MRT, WOODLANDS SOUTH MRT",
        dgpCode: "WOODLANDS",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "737924",
        zoneCode: "NORTH",
        schoolEmail: "CCSS@MOE.EDU.SG",
        schoolNumber: "68933297",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CHUA CHU KANG PRIMARY SCHOOL",
        address: "20 CHOA CHU KANG AVENUE 2",
        mrtDesc: "Choa Chu Kang MRT Station and Southview LRT Station",
        dgpCode: "CHOA CHU KANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "689905",
        zoneCode: "WEST",
        schoolEmail: "CCKPS@MOE.EDU.SG",
        schoolNumber: "67661574",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CHUA CHU KANG SECONDARY SCHOOL",
        address: "31 TECK WHYE CRESCENT",
        mrtDesc: "CHOA CHU KANG MRT, PHOENIX LRT",
        dgpCode: "CHOA CHU KANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "688848",
        zoneCode: "WEST",
        schoolEmail: "CCKSS@MOE.EDU.SG",
        schoolNumber: "67655228",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CHUNG CHENG HIGH SCHOOL (MAIN)",
        address: "50 GOODMAN ROAD",
        mrtDesc: "DAKOTA MRT",
        dgpCode: "MARINE PARADE",
        mainlevelCode: "SECONDARY (S1-S4)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "439012",
        zoneCode: "EAST",
        schoolEmail: "CCHMS@MOE.EDU.SG",
        schoolNumber: "63441393",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CHUNG CHENG HIGH SCHOOL (YISHUN)",
        address: "11 YISHUN STREET 61",
        mrtDesc: "KHATIB MRT",
        dgpCode: "YISHUN",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "768547",
        zoneCode: "NORTH",
        schoolEmail: "CCHBS@MOE.EDU.SG",
        schoolNumber: "67583912",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CLEMENTI PRIMARY SCHOOL",
        address: "8 CLEMENTI AVE 3",
        mrtDesc: "Clementi MRT Station",
        dgpCode: "CLEMENTI",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "129903",
        zoneCode: "WEST",
        schoolEmail: "CLEMENTI_PS@MOE.EDU.SG",
        schoolNumber: "67797449",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CLEMENTI TOWN SECONDARY SCHOOL",
        address: "10 CLEMENTI AVE 3",
        mrtDesc: "CLEMENTI MRT",
        dgpCode: "CLEMENTI",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "129904",
        zoneCode: "WEST",
        schoolEmail: "CTSS@MOE.EDU.SG",
        schoolNumber: "67777362",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "COMMONWEALTH SECONDARY SCHOOL",
        address: "698 WEST COAST ROAD",
        mrtDesc: "JURONG EAST MRT, CLEMENTI MRT",
        dgpCode: "JURONG EAST",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "608784",
        zoneCode: "WEST",
        schoolEmail: "CWSS@MOE.EDU.SG",
        schoolNumber: "65606866",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "COMPASSVALE PRIMARY SCHOOL",
        address: "21 COMPASSVALE ST",
        mrtDesc: "Sengkang",
        dgpCode: "SENG KANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "545091",
        zoneCode: "NORTH",
        schoolEmail: "CVPS@MOE.EDU.SG",
        schoolNumber: "63882819",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "COMPASSVALE SECONDARY SCHOOL",
        address: "51 COMPASSVALE CRESCENT",
        mrtDesc: "SENGKANG MRT, COMPASSVALE LRT",
        dgpCode: "SENG KANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "545083",
        zoneCode: "NORTH",
        schoolEmail: "CVSS@MOE.EDU.SG",
        schoolNumber: "68815047",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CONCORD PRIMARY SCHOOL",
        address: "3 CHOA CHU KANG AVE 4",
        mrtDesc: "Choa Chu Kang MRT Station",
        dgpCode: "CHOA CHU KANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "689814",
        zoneCode: "WEST",
        schoolEmail: "CONCORD_PS@MOE.EDU.SG",
        schoolNumber: "67632139",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CORPORATION PRIMARY SCHOOL",
        address: "31 JURONG WEST STREET 24",
        mrtDesc: "BOON LAY STATION; LAKESIDE STATION",
        dgpCode: "JURONG WEST",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "648347",
        zoneCode: "WEST",
        schoolEmail: "CPS@MOE.EDU.SG",
        schoolNumber: "67957381",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CRESCENT GIRLS' SCHOOL",
        address: "357 TANGLIN ROAD",
        mrtDesc: "REDHILL MRT",
        dgpCode: "BUKIT MERAH",
        mainlevelCode: "SECONDARY (S1-S4)",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "247961",
        zoneCode: "SOUTH",
        schoolEmail: "CRESCENTGIRL@MOE.EDU.SG",
        schoolNumber: "64758711",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "CREST SECONDARY SCHOOL",
        address: "561 JURONG EAST STREET 24",
        mrtDesc: "BUKIT BATOK MRT, JURONG EAST MRT",
        dgpCode: "JURONG EAST",
        mainlevelCode: "SECONDARY (S1-S4)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "SPECIALISED SCHOOL",
        postalCode: "609561",
        zoneCode: "WEST",
        schoolEmail: "info@crestsec.edu.sg",
        schoolNumber: "68992779",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "DAMAI PRIMARY SCHOOL",
        address: "52 BEDOK RESERVOIR CRESCENT",
        mrtDesc: "Bedok North MRT Station",
        dgpCode: "BEDOK",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "479226",
        zoneCode: "EAST",
        schoolEmail: "DAMAI_PS@MOE.EDU.SG",
        schoolNumber: "64456483",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "DAMAI SECONDARY SCHOOL",
        address: "4800 BEDOK RESERVOIR ROAD",
        mrtDesc: "BEDOK RESERVOIR MRT, BEDOK MRT, TAMPINES MRT",
        dgpCode: "BEDOK",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "479229",
        zoneCode: "EAST",
        schoolEmail: "DAMAI_SS@MOE.EDU.SG",
        schoolNumber: "64436848",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "DAZHONG PRIMARY SCHOOL",
        address: "35 BUKIT BATOK STREET 31",
        mrtDesc: "Bukit Gombak",
        dgpCode: "BUKIT BATOK",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "659441",
        zoneCode: "WEST",
        schoolEmail: "DAZHONG_PS@MOE.EDU.SG",
        schoolNumber: "65658002",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "DE LA SALLE SCHOOL",
        address: "11 Choa Chu Kang St 52",
        mrtDesc: "YEW TEE MRT",
        dgpCode: "CHOA CHU KANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "689285",
        zoneCode: "WEST",
        schoolEmail: "DLSS@MOE.EDU.SG",
        schoolNumber: "67667675",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "DEYI SECONDARY SCHOOL",
        address: "1 ANG MO KIO STREET 42",
        mrtDesc: "ANG MO KIO MRT",
        dgpCode: "ANG MO KIO",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "569277",
        zoneCode: "SOUTH",
        schoolEmail: "DEYI_SS@MOE.EDU.SG",
        schoolNumber: "64561565",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "DUNEARN SECONDARY SCHOOL",
        address: "21 BUKIT BATOK WEST AVENUE 2",
        mrtDesc: "BUKIT BATOK MRT, BUKIT GOMBAK MRT",
        dgpCode: "BUKIT BATOK",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "659204",
        zoneCode: "WEST",
        schoolEmail: "DUNEARN_SS@MOE.EDU.SG",
        schoolNumber: "65653692",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "DUNMAN HIGH SCHOOL",
        address: "10 TANJONG RHU ROAD",
        mrtDesc: "KATONG PARK MRT,ALJUNIED MRT, KALLANG MRT, MOUNTBATTEN MRT,",
        dgpCode: "KALLANG",
        mainlevelCode: "MIXED LEVEL (S1-JC2)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "436895",
        zoneCode: "EAST",
        schoolEmail: "DHS@MOE.EDU.SG",
        schoolNumber: "63450533",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "DUNMAN SECONDARY SCHOOL",
        address: "21 TAMPINES STREET 45",
        mrtDesc: "TAMPINES EAST MRT",
        dgpCode: "TAMPINES",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "529093",
        zoneCode: "EAST",
        schoolEmail: "DUNMAN_SS@MOE.EDU.SG",
        schoolNumber: "67862668",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "EAST SPRING PRIMARY SCHOOL",
        address: "31 TAMPINES ST 33",
        mrtDesc: "Tampines",
        dgpCode: "TAMPINES",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "529258",
        zoneCode: "EAST",
        schoolEmail: "ESPS@MOE.EDU.SG",
        schoolNumber: "67866192",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "EAST SPRING SECONDARY SCHOOL",
        address: "30 TAMPINES STREET 34",
        mrtDesc: "TAMPINES MRT, TAMPINES EAST MRT",
        dgpCode: "TAMPINES",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "529231",
        zoneCode: "EAST",
        schoolEmail: "ESSS@MOE.EDU.SG",
        schoolNumber: "65873805",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "EDGEFIELD PRIMARY SCHOOL",
        address: "41 EDGEFIELD PLAINS",
        mrtDesc: "Punggol MRT",
        dgpCode: "PUNGGOL",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "828869",
        zoneCode: "EAST",
        schoolEmail: "edgefield_ps@moe.edu.sg",
        schoolNumber: "63126091",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "EDGEFIELD SECONDARY SCHOOL",
        address: "36 PUNGGOL FIELD",
        mrtDesc: "PUNGGOL MRT",
        dgpCode: "PUNGGOL",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "828814",
        zoneCode: "EAST",
        schoolEmail: "edgefield_ss@moe.edu.sg",
        schoolNumber: "68839511",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ELIAS PARK PRIMARY SCHOOL",
        address: "11 PASIR RIS STREET 52",
        mrtDesc: "Pasir Ris MRT",
        dgpCode: "PASIR RIS",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "518866",
        zoneCode: "EAST",
        schoolEmail: "EPPS@MOE.EDU.SG",
        schoolNumber: "65844393",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ENDEAVOUR PRIMARY SCHOOL",
        address: "10 Admiralty Link",
        mrtDesc: "Sembawang MRT Station",
        dgpCode: "SEMBAWANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "757521",
        zoneCode: "NORTH",
        schoolEmail: "endeavour_ps@moe.edu.sg",
        schoolNumber: "64824650",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "EUNOIA JUNIOR COLLEGE",
        address: "2 Sin Ming Place",
        mrtDesc: "Bishan MRT Station, Marymount MRT Station, Ang Mo Kio MRT Station, Bright Hill MRT Station",
        dgpCode: "BISHAN",
        mainlevelCode: "JUNIOR COLLEGE",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "573838",
        zoneCode: "NORTH",
        schoolEmail: "eunoiajc@moe.edu.sg",
        schoolNumber: "63518388",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "EVERGREEN PRIMARY SCHOOL",
        address: "31 WOODLANDS CIRCLE",
        mrtDesc: "Admiralty",
        dgpCode: "WOODLANDS",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "738908",
        zoneCode: "NORTH",
        schoolEmail: "EVERGREEN_PS@MOE.EDU.SG",
        schoolNumber: "63687705",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "EVERGREEN SECONDARY SCHOOL",
        address: "11 WOODLANDS STREET 83",
        mrtDesc: "WOODLANDS MRT",
        dgpCode: "WOODLANDS",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "738489",
        zoneCode: "NORTH",
        schoolEmail: "EVERGREEN_SS@MOE.EDU.SG",
        schoolNumber: "63656392",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "FAIRFIELD METHODIST SCHOOL (PRIMARY)",
        address: "100 DOVER ROAD",
        mrtDesc: "One-North MRT, Buona Vista MRT & Dover MRT",
        dgpCode: "QUEENSTOWN",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "139648",
        zoneCode: "SOUTH",
        schoolEmail: "FMPS@MOE.EDU.SG",
        schoolNumber: "67788431",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "FAIRFIELD METHODIST SCHOOL (SECONDARY)",
        address: "102 DOVER ROAD",
        mrtDesc: "BUONA VISTA MRT, ONE-NORTH MRT",
        dgpCode: "QUEENSTOWN",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "139649",
        zoneCode: "SOUTH",
        schoolEmail: "FMSS@MOE.EDU.SG",
        schoolNumber: "67788702",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "FARRER PARK PRIMARY SCHOOL",
        address: "2 FARRER PARK ROAD",
        mrtDesc: "Farrer Park MRT Station",
        dgpCode: "KALLANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "217567",
        zoneCode: "SOUTH",
        schoolEmail: "FPPS@MOE.EDU.SG",
        schoolNumber: "62952272",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "FENGSHAN PRIMARY SCHOOL",
        address: "307 BEDOK NORTH ROAD",
        mrtDesc: "Bedok MRT",
        dgpCode: "BEDOK",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "469680",
        zoneCode: "EAST",
        schoolEmail: "FSPS@MOE.EDU.SG",
        schoolNumber: "65860123",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "FERN GREEN PRIMARY SCHOOL",
        address: "70 Fernvale Link",
        mrtDesc: "Kupang LRT Station (SW3)",
        dgpCode: "SENG KANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "797538",
        zoneCode: "NORTH",
        schoolEmail: "ferngreen_ps@moe.edu.sg",
        schoolNumber: "68343100",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "FERNVALE PRIMARY SCHOOL",
        address: "1 Fernvale Lane",
        mrtDesc: "Fernvale LRT (Sengkang West Loop)",
        dgpCode: "SENG KANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "797701",
        zoneCode: "NORTH",
        schoolEmail: "fernvale_ps@moe.edu.sg",
        schoolNumber: "63153051",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "FIRST TOA PAYOH PRIMARY SCHOOL",
        address: "7 LORONG 8 TOA PAYOH",
        mrtDesc: "Braddell & Toa Payoh Stations",
        dgpCode: "TOA PAYOH",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "319252",
        zoneCode: "SOUTH",
        schoolEmail: "FTPPS@MOE.EDU.SG",
        schoolNumber: "62567822",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "FRONTIER PRIMARY SCHOOL",
        address: "20 Jurong West Street 61",
        mrtDesc: "Pioneer MRT Station (EW28)",
        dgpCode: "JURONG WEST",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "648200",
        zoneCode: "WEST",
        schoolEmail: "frontier_ps@moe.edu.sg",
        schoolNumber: "65789555",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "FUCHUN PRIMARY SCHOOL",
        address: "23 WOODLANDS AVENUE 1",
        mrtDesc: "Marsiling",
        dgpCode: "WOODLANDS",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "739063",
        zoneCode: "NORTH",
        schoolEmail: "FCPS@MOE.EDU.SG",
        schoolNumber: "63683925",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "FUHUA PRIMARY SCHOOL",
        address: "65 JURONG EAST STREET 13",
        mrtDesc: "JURONG EAST MRT STATION",
        dgpCode: "JURONG EAST",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "609647",
        zoneCode: "WEST",
        schoolEmail: "FHPS@MOE.EDU.SG",
        schoolNumber: "65624370",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "FUHUA SECONDARY SCHOOL",
        address: "5 JURONG WEST STREET 41",
        mrtDesc: "CHINESE GARDEN MRT, LAKESIDE MRT",
        dgpCode: "JURONG WEST",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "649410",
        zoneCode: "WEST",
        schoolEmail: "FHSS@MOE.EDU.SG",
        schoolNumber: "65633067",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "GAN ENG SENG PRIMARY SCHOOL",
        address: "100 REDHILL CLOSE",
        mrtDesc: "Redhill",
        dgpCode: "BUKIT MERAH",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "158901",
        zoneCode: "SOUTH",
        schoolEmail: "GESPS@MOE.EDU.SG",
        schoolNumber: "64717451",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "GAN ENG SENG SCHOOL",
        address: "1 HENDERSON ROAD",
        mrtDesc: "REDHILL MRT, TIONG BAHRU MRT",
        dgpCode: "BUKIT MERAH",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "159561",
        zoneCode: "SOUTH",
        schoolEmail: "GESS@MOE.EDU.SG",
        schoolNumber: "64745594",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "GEYLANG METHODIST SCHOOL (PRIMARY)",
        address: "4 Geylang East Central",
        mrtDesc: "Aljunied",
        dgpCode: "GEYLANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "389706",
        zoneCode: "EAST",
        schoolEmail: "GMPS@MOE.EDU.SG",
        schoolNumber: "67486746",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "GEYLANG METHODIST SCHOOL (SECONDARY)",
        address: "2 GEYLANG EAST CENTRAL",
        mrtDesc: "ALJUNIED MRT",
        dgpCode: "GEYLANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "389705",
        zoneCode: "EAST",
        schoolEmail: "GMSS@MOE.EDU.SG",
        schoolNumber: "67466503",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "GONGSHANG PRIMARY SCHOOL",
        address: "1 TAMPINES STREET 42",
        mrtDesc: "Tampines (Downtown Line and East West Line) and Tampines East (Downtown Line)",
        dgpCode: "TAMPINES",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "529176",
        zoneCode: "EAST",
        schoolEmail: "GSPS@MOE.EDU.SG",
        schoolNumber: "67831191",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "GREENDALE PRIMARY SCHOOL",
        address: "50 Edgedale Plains",
        mrtDesc: "Punggol LRT:  Coral Edge",
        dgpCode: "PUNGGOL",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "828848",
        zoneCode: "EAST",
        schoolEmail: "greendale_ps@moe.edu.sg",
        schoolNumber: "68861413",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "GREENDALE SECONDARY SCHOOL",
        address: "51 EDGEDALE PLAINS",
        mrtDesc: "PUNGGOL MRT, MERIDIAN LRT",
        dgpCode: "PUNGGOL",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "828866",
        zoneCode: "EAST",
        schoolEmail: "greendale_ss@moe.edu.sg",
        schoolNumber: "63158616",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "GREENRIDGE PRIMARY SCHOOL",
        address: "11 JELAPANG ROAD",
        mrtDesc: "Senja LRT station, Jelapang LRT Station",
        dgpCode: "BUKIT PANJANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "677744",
        zoneCode: "WEST",
        schoolEmail: "GRPS@MOE.EDU.SG",
        schoolNumber: "67604265",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "GREENRIDGE SECONDARY SCHOOL",
        address: "31 Gangsa Road",
        mrtDesc: "Bukit Panjang MRT, Bukit Panjang LRT, Petir LRT",
        dgpCode: "BUKIT PANJANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "678972",
        zoneCode: "WEST",
        schoolEmail: "GRSS@MOE.EDU.SG",
        schoolNumber: "67691491",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "GREENWOOD PRIMARY SCHOOL",
        address: "11 WOODLANDS  DR  62",
        mrtDesc: "Admiralty MRT Station",
        dgpCode: "WOODLANDS",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "737942",
        zoneCode: "NORTH",
        schoolEmail: "GREENWOOD_PS@MOE.EDU.SG",
        schoolNumber: "63666158",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "GUANGYANG SECONDARY SCHOOL",
        address: "8 BISHAN STREET 12",
        mrtDesc: "BISHAN MRT",
        dgpCode: "BISHAN",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "579807",
        zoneCode: "SOUTH",
        schoolEmail: "GYSS@MOE.EDU.SG",
        schoolNumber: "62589781",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "HAI SING CATHOLIC SCHOOL",
        address: "15 PASIR RIS STREET 21",
        mrtDesc: "PASIR RIS MRT",
        dgpCode: "PASIR RIS",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "518969",
        zoneCode: "EAST",
        schoolEmail: "HSHS@MOE.EDU.SG",
        schoolNumber: "65827864",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "HAIG GIRLS' SCHOOL",
        address: "51 Koon Seng Road",
        mrtDesc: "Eunos, Dakota",
        dgpCode: "GEYLANG",
        mainlevelCode: "PRIMARY",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "427072",
        zoneCode: "EAST",
        schoolEmail: "HAIGGIRLSSCH@MOE.EDU.SG",
        schoolNumber: "63440293",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "HENRY PARK PRIMARY SCHOOL",
        address: "1 HOLLAND GROVE ROAD",
        mrtDesc: "Buona Vista MRT, Clementi MRT",
        dgpCode: "BUKIT TIMAH",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "278790",
        zoneCode: "WEST",
        schoolEmail: "HPPS@MOE.EDU.SG",
        schoolNumber: "64663600",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "HILLGROVE SECONDARY SCHOOL",
        address: "10 BUKIT BATOK STREET 52",
        mrtDesc: "BUKIT BATOK MRT, BUKIT GOMBAK MRT",
        dgpCode: "BUKIT BATOK",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "659250",
        zoneCode: "WEST",
        schoolEmail: "HILLGROVE_SS@MOE.EDU.SG",
        schoolNumber: "65603726",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "HOLY INNOCENTS' HIGH SCHOOL",
        address: "1191 UPPER SERANGOON ROAD",
        mrtDesc: "HOUGANG MRT",
        dgpCode: "HOUGANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "534786",
        zoneCode: "SOUTH",
        schoolEmail: "HIHS@MOE.EDU.SG",
        schoolNumber: "62833381",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "HOLY INNOCENTS' PRIMARY SCHOOL",
        address: "5 Lorong Low Koon",
        mrtDesc: "2km walk to Hougang MRT",
        dgpCode: "HOUGANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "536451",
        zoneCode: "SOUTH",
        schoolEmail: "HOLYINNOCENT@MOE.EDU.SG",
        schoolNumber: "62886516",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "HONG WEN SCHOOL",
        address: "30 TOWNER ROAD",
        mrtDesc: "Boon Keng MRT",
        dgpCode: "KALLANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "327829",
        zoneCode: "SOUTH",
        schoolEmail: "HWS@MOE.EDU.SG",
        schoolNumber: "62943340",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "HORIZON PRIMARY SCHOOL",
        address: "61 Edgedale Plains",
        mrtDesc: "Punggol MRT Station (NE17); (LRT: Kadaloor [PE5] or Oasis [PE6])",
        dgpCode: "PUNGGOL",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "828819",
        zoneCode: "EAST",
        schoolEmail: "horizon_ps@moe.edu.sg",
        schoolNumber: "67535411",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "HOUGANG PRIMARY SCHOOL",
        address: "1 HOUGANG ST 93",
        mrtDesc: "Ang Mo Kio, Buangkok, Hougang, Sengkang, Yio Chu Kang",
        dgpCode: "HOUGANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "534238",
        zoneCode: "NORTH",
        schoolEmail: "HOUGANG_PS@MOE.EDU.SG",
        schoolNumber: "64897445",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "HOUGANG SECONDARY SCHOOL",
        address: "2 HOUGANG STREET 93",
        mrtDesc: "HOUGANG MRT, BUANGKOK MRT",
        dgpCode: "HOUGANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "534256",
        zoneCode: "NORTH",
        schoolEmail: "HOUGANG_SS@MOE.EDU.SG",
        schoolNumber: "63851990",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "HUA YI SECONDARY SCHOOL",
        address: "60 JURONG WEST ST 42",
        mrtDesc: "LAKESIDE MRT, CHINESE GARDEN MRT",
        dgpCode: "JURONG WEST",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "649371",
        zoneCode: "WEST",
        schoolEmail: "HYSS@MOE.EDU.SG",
        schoolNumber: "65634568",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "HUAMIN PRIMARY SCHOOL",
        address: "21 YISHUN AVENUE 11",
        mrtDesc: "Yishun MRT Station",
        dgpCode: "YISHUN",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "768857",
        zoneCode: "NORTH",
        schoolEmail: "HUAMIN_PS@MOE.EDU.SG",
        schoolNumber: "67529004",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "HWA CHONG INSTITUTION",
        address: "661 BUKIT TIMAH ROAD",
        mrtDesc: "TAN KAH KEE MRT",
        dgpCode: "BUKIT TIMAH",
        mainlevelCode: "MIXED LEVEL (S1-JC2)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "INDEPENDENT SCHOOL",
        postalCode: "269734",
        zoneCode: "WEST",
        schoolEmail: "admin@hci.edu.sg",
        schoolNumber: "64683955",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "INNOVA PRIMARY SCHOOL",
        address: "80 Woodlands Drive 17",
        mrtDesc: "Woodlands",
        dgpCode: "WOODLANDS",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "737888",
        zoneCode: "NORTH",
        schoolEmail: "innova_pri@moe.edu.sg",
        schoolNumber: "68944693",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "JIEMIN PRIMARY SCHOOL",
        address: "2 YISHUN STREET 71",
        mrtDesc: "Yishun MRT Station",
        dgpCode: "YISHUN",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "768515",
        zoneCode: "NORTH",
        schoolEmail: "JIEMIN_PS@MOE.EDU.SG",
        schoolNumber: "67586472",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "JING SHAN PRIMARY SCHOOL",
        address: "5 ANG MO KIO ST 52",
        mrtDesc: "Ang Mo Kio MRT",
        dgpCode: "ANG MO KIO",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "569228",
        zoneCode: "SOUTH",
        schoolEmail: "JSPS@MOE.EDU.SG",
        schoolNumber: "64566305",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "JUNYUAN PRIMARY SCHOOL",
        address: "2 Tampines Street 91",
        mrtDesc: "Tampines West (Downtown Line); Tampines (East-West Line)",
        dgpCode: "TAMPINES",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "528906",
        zoneCode: "EAST",
        schoolEmail: "JUNYUAN_PS@MOE.EDU.SG",
        schoolNumber: "67830375",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "JUNYUAN SECONDARY SCHOOL",
        address: "11 TAMPINES STREET 84",
        mrtDesc: "TAMPINES MRT, TAMPINES WEST MRT",
        dgpCode: "TAMPINES",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "528933",
        zoneCode: "EAST",
        schoolEmail: "JUNYUAN_SS@MOE.EDU.SG",
        schoolNumber: "65873683",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "JURONG PIONEER JUNIOR COLLEGE",
        address: "21 Teck Whye Walk",
        mrtDesc: "Choa Chu Kang / Bt Panjang / Phoenix Station (LRT)",
        dgpCode: "CHOA CHU KANG",
        mainlevelCode: "JUNIOR COLLEGE",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "688258",
        zoneCode: "WEST",
        schoolEmail: "jpjc@moe.edu.sg",
        schoolNumber: "65646878",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "JURONG PRIMARY SCHOOL",
        address: "320 JURONG EAST Street 32",
        mrtDesc: "Lakeside MRT Station, Jurong East MRT Station",
        dgpCode: "JURONG EAST",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "609476",
        zoneCode: "WEST",
        schoolEmail: "JPS@MOE.EDU.SG",
        schoolNumber: "65618837",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "JURONG SECONDARY SCHOOL",
        address: "31 YUAN CHING ROAD",
        mrtDesc: "LAKESIDE MRT",
        dgpCode: "JURONG WEST",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "618652",
        zoneCode: "WEST",
        schoolEmail: "JURONG_SS@MOE.EDU.SG",
        schoolNumber: "62655980",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "JURONG WEST PRIMARY SCHOOL",
        address: "30 JURONG WEST ST 61",
        mrtDesc: "Pioneer MRT Station",
        dgpCode: "JURONG WEST",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "648368",
        zoneCode: "WEST",
        schoolEmail: "JWPS@MOE.EDU.SG",
        schoolNumber: "67933419",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "JURONG WEST SECONDARY SCHOOL",
        address: "61 JURONG WEST STREET 65",
        mrtDesc: "BOON LAY MRT, PIONEER MRT",
        dgpCode: "JURONG WEST",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "648348",
        zoneCode: "WEST",
        schoolEmail: "JWSS@MOE.EDU.SG",
        schoolNumber: "62623593",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "JURONGVILLE SECONDARY SCHOOL",
        address: "202 JURONG EAST AVENUE 1",
        mrtDesc: "JURONG EAST MRT, LAKESIDE MRT",
        dgpCode: "JURONG EAST",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "609790",
        zoneCode: "WEST",
        schoolEmail: "JURONGVILLE@MOE.EDU.SG",
        schoolNumber: "65638704",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "JUYING SECONDARY SCHOOL",
        address: "33 JURONG WEST STREET 91",
        mrtDesc: "BOON LAY MRT, PIONEER MRT, JOO KOON MRT",
        dgpCode: "JURONG WEST",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "649038",
        zoneCode: "WEST",
        schoolEmail: "JUYING_SS@MOE.EDU.SG",
        schoolNumber: "63089898",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "MEE TOH SCHOOL",
        address: "21 EDGEDALE PLAINS",
        mrtDesc: "Punggol Station",
        dgpCode: "PUNGGOL",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "828867",
        zoneCode: "NORTH",
        schoolEmail: "MEETOH_SCH@MOE.EDU.SG",
        schoolNumber: "64893326",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "KEMING PRIMARY SCHOOL",
        address: "90 BUKIT BATOK EAST AVENUE 6",
        mrtDesc: "Bukit Batok",
        dgpCode: "BUKIT BATOK",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "659762",
        zoneCode: "WEST",
        schoolEmail: "KMPS@MOE.EDU.SG",
        schoolNumber: "68962054",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "KENT RIDGE SECONDARY SCHOOL",
        address: "147 WEST COAST ROAD",
        mrtDesc: "CLEMENTI MRT, HAW PAR VILLA MRT",
        dgpCode: "CLEMENTI",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "127368",
        zoneCode: "WEST",
        schoolEmail: "KRSS@MOE.EDU.SG",
        schoolNumber: "67731127",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "KHENG CHENG SCHOOL",
        address: "15 LORONG 3 TOA PAYOH",
        mrtDesc: "Braddell",
        dgpCode: "TOA PAYOH",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "319580",
        zoneCode: "SOUTH",
        schoolEmail: "KCS@MOE.EDU.SG",
        schoolNumber: "62552502",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "KONG HWA SCHOOL",
        address: "350 GUILLEMARD ROAD",
        mrtDesc: "Dakota",
        dgpCode: "GEYLANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "399772",
        zoneCode: "EAST",
        schoolEmail: "KONGHWA_SCH@MOE.EDU.SG",
        schoolNumber: "63421195",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "KRANJI PRIMARY SCHOOL",
        address: "11 CHOA CHU KANG STREET 54",
        mrtDesc: "Yew Tee MRT",
        dgpCode: "CHOA CHU KANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "689189",
        zoneCode: "WEST",
        schoolEmail: "KRANJI_PS@MOE.EDU.SG",
        schoolNumber: "67634812",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "KRANJI SECONDARY SCHOOL",
        address: "61 CHOA CHU KANG STREET 51",
        mrtDesc: "CHOA CHU KANG MRT, YEW TEE MRT",
        dgpCode: "CHOA CHU KANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "689333",
        zoneCode: "WEST",
        schoolEmail: "KRANJI_SS@MOE.EDU.SG",
        schoolNumber: "67662464",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "KUO CHUAN PRESBYTERIAN PRIMARY SCHOOL",
        address: "8 BISHAN STREET 13",
        mrtDesc: "Bishan MRT Station",
        dgpCode: "BISHAN",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "579793",
        zoneCode: "SOUTH",
        schoolEmail: "KCPPS@MOE.EDU.SG",
        schoolNumber: "62595396",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "KUO CHUAN PRESBYTERIAN SECONDARY SCHOOL",
        address: "10 BISHAN STREET 13",
        mrtDesc: "BISHAN MRT",
        dgpCode: "BISHAN",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "579795",
        zoneCode: "SOUTH",
        schoolEmail: "KCPSS@MOE.EDU.SG",
        schoolNumber: "62593811",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "LAKESIDE PRIMARY SCHOOL",
        address: "161 Corporation Walk",
        mrtDesc: "Lakeside MRT",
        dgpCode: "JURONG WEST",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "618310",
        zoneCode: "WEST",
        schoolEmail: "lakeside_ps@moe.edu.sg",
        schoolNumber: "62620918",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "LIANHUA PRIMARY SCHOOL",
        address: "2 BUKIT BATOK STREET 52",
        mrtDesc: "Bukit Gombak/Bukit Batok",
        dgpCode: "BUKIT BATOK",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "659243",
        zoneCode: "WEST",
        schoolEmail: "LIANHUA_PS@MOE.EDU.SG",
        schoolNumber: "65639502",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "LOYANG VIEW SECONDARY SCHOOL",
        address: "12 PASIR RIS STREET 11",
        mrtDesc: "PASIR RIS MRT",
        dgpCode: "PASIR RIS",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "519073",
        zoneCode: "EAST",
        schoolEmail: "loyangview_ss@moe.edu.sg",
        schoolNumber: "65821727",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "MAHA BODHI SCHOOL",
        address: "10 UBI AVENUE 1",
        mrtDesc: "Eunos Station (Transfer Bus No.63, 63M); Ubi Station (Transfer Bus No. 137)",
        dgpCode: "GEYLANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "408931",
        zoneCode: "EAST",
        schoolEmail: "MBS@MOE.EDU.SG",
        schoolNumber: "67442115",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "MANJUSRI SECONDARY SCHOOL",
        address: "20 UBI AVENUE 1",
        mrtDesc: "UBI MRT, MACPHERSON MRT",
        dgpCode: "GEYLANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "408940",
        zoneCode: "EAST",
        schoolEmail: "MANJUSRI_SS@MOE.EDU.SG",
        schoolNumber: "68424558",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "MARIS STELLA HIGH SCHOOL",
        address: "25 MOUNT VERNON ROAD",
        mrtDesc: "BARTLEY MRT",
        dgpCode: "TOA PAYOH",
        mainlevelCode: "MIXED LEVEL (P1-S4)",
        natureCode: "BOYS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "368051",
        zoneCode: "NORTH",
        schoolEmail: "MSH@MOE.EDU.SG",
        schoolNumber: "62803880 (Sec)",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "MARSILING PRIMARY SCHOOL",
        address: "31 WOODLANDS CENTRE ROAD",
        mrtDesc: "Marsiling MRT Station",
        dgpCode: "WOODLANDS",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "738927",
        zoneCode: "NORTH",
        schoolEmail: "MARSILING_PS@MOE.EDU.SG",
        schoolNumber: "62696193",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "MARSILING SECONDARY SCHOOL",
        address: "12 MARSILING ROAD",
        mrtDesc: "MARSILING MRT",
        dgpCode: "WOODLANDS",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "739110",
        zoneCode: "NORTH",
        schoolEmail: "MARSILING_SS@MOE.EDU.SG",
        schoolNumber: "68941413",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "MARYMOUNT CONVENT SCHOOL",
        address: "20 Marymount Road",
        mrtDesc: "Braddell MRT Station or Caldecott MRT Station",
        dgpCode: "TOA PAYOH",
        mainlevelCode: "PRIMARY",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "297754",
        zoneCode: "SOUTH",
        schoolEmail: "MMCS@MOE.EDU.SG",
        schoolNumber: "6256 6701",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "MAYFLOWER PRIMARY SCHOOL",
        address: "200 Ang Mo Kio Avenue 5",
        mrtDesc: "Yio Chu Kang MRT Station.",
        dgpCode: "ANG MO KIO",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "569878",
        zoneCode: "SOUTH",
        schoolEmail: "MAYFLOWER_PS@MOE.EDU.SG",
        schoolNumber: "64520849",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "MAYFLOWER SECONDARY SCHOOL",
        address: "2 ANG MO KIO STREET 21",
        mrtDesc: "ANG MO KIO MRT, MAYFLOWER MRT",
        dgpCode: "ANG MO KIO",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "569384",
        zoneCode: "SOUTH",
        schoolEmail: "MAYFLOWER_SS@MOE.EDU.SG",
        schoolNumber: "64577783",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "MERIDIAN PRIMARY SCHOOL",
        address: "20 PASIR RIS ST 71",
        mrtDesc: "Pasir Ris MRT Station",
        dgpCode: "PASIR RIS",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "518798",
        zoneCode: "EAST",
        schoolEmail: "MERIDIAN_PS@MOE.EDU.SG",
        schoolNumber: "65832125",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "MERIDIAN SECONDARY SCHOOL",
        address: "31 PASIR RIS STREET 51",
        mrtDesc: "PASIR RIS MRT",
        dgpCode: "PASIR RIS",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "518901",
        zoneCode: "EAST",
        schoolEmail: "meridian_sec@moe.edu.sg",
        schoolNumber: "65831387",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "METHODIST GIRLS' SCHOOL (PRIMARY)",
        address: "11 Blackmore Drive",
        mrtDesc: "King Albert Park MRT",
        dgpCode: "BUKIT TIMAH",
        mainlevelCode: "PRIMARY",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "599986",
        zoneCode: "WEST",
        schoolEmail: "MGPS@MOE.EDU.SG",
        schoolNumber: "64694800",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "METHODIST GIRLS' SCHOOL (SECONDARY)",
        address: "11 BLACKMORE DRIVE",
        mrtDesc: "KING ALBERT PARK MRT",
        dgpCode: "BUKIT TIMAH",
        mainlevelCode: "SECONDARY (S1-S4)",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "INDEPENDENT SCHOOL",
        postalCode: "599986",
        zoneCode: "WEST",
        schoolEmail: "MGSS@MOE.EDU.SG",
        schoolNumber: "64694800",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "MILLENNIA INSTITUTE",
        address: "60 Bukit Batok West Avenue 8",
        mrtDesc: "Bukit Batok (NS 2)",
        dgpCode: "BUKIT BATOK",
        mainlevelCode: "CENTRALISED INSTITUTE",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "658965",
        zoneCode: "WEST",
        schoolEmail: "millennia_inst@moe.edu.sg",
        schoolNumber: "63023700",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "MONTFORT JUNIOR SCHOOL",
        address: "52 HOUGANG AVENUE 8",
        mrtDesc: "Hougang MRT & Bus Interchange",
        dgpCode: "HOUGANG",
        mainlevelCode: "PRIMARY",
        natureCode: "BOYS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "538786",
        zoneCode: "NORTH",
        schoolEmail: "MONTFORT_JS@MOE.EDU.SG",
        schoolNumber: "65101588",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "MONTFORT SECONDARY SCHOOL",
        address: "50 HOUGANG AVENUE 8",
        mrtDesc: "HOUGANG MRT",
        dgpCode: "HOUGANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "BOYS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "538785",
        zoneCode: "NORTH",
        schoolEmail: "MONTFORT_SS@MOE.EDU.SG",
        schoolNumber: "65107070",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "NAN CHIAU HIGH SCHOOL",
        address: "20 ANCHORVALE LINK",
        mrtDesc: "SENGKANG MRT, RENJONG LRT, TONGKANG LRT",
        dgpCode: "SENG KANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "545079",
        zoneCode: "NORTH",
        schoolEmail: "NCHS@MOE.EDU.SG",
        schoolNumber: "64897971",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "NAN CHIAU PRIMARY SCHOOL",
        address: "50 ANCHORVALE LINK",
        mrtDesc: "Sengkang Station",
        dgpCode: "SENG KANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "545080",
        zoneCode: "NORTH",
        schoolEmail: "NCPS@MOE.EDU.SG",
        schoolNumber: "64897905",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "NAN HUA HIGH SCHOOL",
        address: "41 CLEMENTI AVENUE 1",
        mrtDesc: "CLEMENTI MRT",
        dgpCode: "CLEMENTI",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "129956",
        zoneCode: "WEST",
        schoolEmail: "NHSS@MOE.EDU.SG",
        schoolNumber: "67788303",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "NAN HUA PRIMARY SCHOOL",
        address: "30 Jalan Lempeng",
        mrtDesc: "Clementi MRT Station",
        dgpCode: "CLEMENTI",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "128806",
        zoneCode: "WEST",
        schoolEmail: "NHPS@MOE.EDU.SG",
        schoolNumber: "67788050",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "NANYANG GIRLS' HIGH SCHOOL",
        address: "2 LINDEN DRIVE",
        mrtDesc: "SIXTH AVENUE MRT, TAN KAH KEE MRT",
        dgpCode: "BUKIT TIMAH",
        mainlevelCode: "SECONDARY (S1-S4)",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "INDEPENDENT SCHOOL",
        postalCode: "288683",
        zoneCode: "WEST",
        schoolEmail: "NYGHS@MOE.EDU.SG",
        schoolNumber: "64663275",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "NANYANG JUNIOR COLLEGE",
        address: "128 SERANGOON AVENUE 3",
        mrtDesc: "Lorong Chuan (Circle Line/CC14); 3-minute walk via sheltered walkway",
        dgpCode: "SERANGOON",
        mainlevelCode: "JUNIOR COLLEGE",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "556111",
        zoneCode: "SOUTH",
        schoolEmail: "NYJC@MOE.EDU.SG",
        schoolNumber: "62842281",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "NANYANG PRIMARY SCHOOL",
        address: "52 KING'S ROAD",
        mrtDesc: "Farrer Rd MRT Station",
        dgpCode: "BUKIT TIMAH",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "268097",
        zoneCode: "WEST",
        schoolEmail: "NYPS@MOE.EDU.SG",
        schoolNumber: "64672677",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "NATIONAL JUNIOR COLLEGE",
        address: "37 HILLCREST ROAD",
        mrtDesc: "BOTANIC GARDENS MRT, TAN KAH KEE MRT, SIXTH AVENUE MRT",
        dgpCode: "BUKIT TIMAH",
        mainlevelCode: "MIXED LEVEL (S1-JC2)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "288913",
        zoneCode: "SOUTH",
        schoolEmail: "NJC@MOE.EDU.SG",
        schoolNumber: "64661144",
        status: "active",
        isCooperating: true,
        },
        {
        schoolName: "NAVAL BASE PRIMARY SCHOOL",
        address: "7 YISHUN AVE 4",
        mrtDesc: "Yishun MRT Station",
        dgpCode: "YISHUN",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "769028",
        zoneCode: "NORTH",
        schoolEmail: "NBPS@MOE.EDU.SG",
        schoolNumber: "67537114",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "NAVAL BASE SECONDARY SCHOOL",
        address: "901 YISHUN RING ROAD",
        mrtDesc: "KHATIB MRT",
        dgpCode: "YISHUN",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "768689",
        zoneCode: "NORTH",
        schoolEmail: "NBSS@MOE.EDU.SG",
        schoolNumber: "62571996",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "NEW TOWN PRIMARY SCHOOL",
        address: "300 Tanglin Halt Road",
        mrtDesc: "Commonwealth MRT Station",
        dgpCode: "QUEENSTOWN",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "148812",
        zoneCode: "SOUTH",
        schoolEmail: "NTPS@MOE.EDU.SG",
        schoolNumber: "64748805",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "NEW TOWN SECONDARY SCHOOL",
        address: "1020 DOVER ROAD",
        mrtDesc: "DOVER MRT, CLEMENTI MRT",
        dgpCode: "QUEENSTOWN",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "139657",
        zoneCode: "WEST",
        schoolEmail: "NTSS@MOE.EDU.SG",
        schoolNumber: "67754140",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "NGEE ANN PRIMARY SCHOOL",
        address: "344 MARINE TERRACE",
        mrtDesc: "Nil",
        dgpCode: "MARINE PARADE",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "449149",
        zoneCode: "EAST",
        schoolEmail: "NAPS@MOE.EDU.SG",
        schoolNumber: "64418677",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "NGEE ANN SECONDARY SCHOOL",
        address: "1 TAMPINES STREET 32",
        mrtDesc: "TAMPINES MRT, SIMEI MRT, TAMPINES EAST MRT",
        dgpCode: "TAMPINES",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "529283",
        zoneCode: "EAST",
        schoolEmail: "NASS@MOE.EDU.SG",
        schoolNumber: "67844583",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "NORTH SPRING PRIMARY SCHOOL",
        address: "1 RIVERVALE STREET",
        mrtDesc: "NEL - Sengkang Station; LRT - Bakau Station",
        dgpCode: "SENG KANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "545088",
        zoneCode: "NORTH",
        schoolEmail: "NSPS@MOE.EDU.SG",
        schoolNumber: "68816887",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "NORTH VIEW PRIMARY SCHOOL",
        address: "210 YISHUN AVENUE 6",
        mrtDesc: "Yishun; Khatib",
        dgpCode: "YISHUN",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "768960",
        zoneCode: "NORTH",
        schoolEmail: "NVPS@MOE.EDU.SG",
        schoolNumber: "67593235",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "NORTH VISTA PRIMARY SCHOOL",
        address: "20 Compassvale Link",
        mrtDesc: "Buangkok MRT (NE15), Ranggung LRT (SE5)",
        dgpCode: "SENG KANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "544974",
        zoneCode: "NORTH",
        schoolEmail: "nvtps@moe.edu.sg",
        schoolNumber: "64843566",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "NORTH VISTA SECONDARY SCHOOL",
        address: "11 RIVERVALE LINK",
        mrtDesc: "SENGKANG MRT, BUANGKOK MRT, RANGGUNG LRT",
        dgpCode: "SENG KANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "545081",
        zoneCode: "NORTH",
        schoolEmail: "NORTHVISTASS@MOE.EDU.SG",
        schoolNumber: "68793930",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "NORTHBROOKS SECONDARY SCHOOL",
        address: "585 YISHUN RING ROAD",
        mrtDesc: "YISHUN MRT, KHATIB MRT",
        dgpCode: "YISHUN",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "768692",
        zoneCode: "NORTH",
        schoolEmail: "NORTHBROOKS@MOE.EDU.SG",
        schoolNumber: "67524311",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "NORTHLAND PRIMARY SCHOOL",
        address: "15 YISHUN AVENUE 4",
        mrtDesc: "Yishun MRT Station",
        dgpCode: "YISHUN",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "769026",
        zoneCode: "NORTH",
        schoolEmail: "NORTHLAND_PS@MOE.EDU.SG",
        schoolNumber: "67598884",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "NORTHLAND SECONDARY SCHOOL",
        address: "3 YISHUN STREET 22",
        mrtDesc: "YISHUN MRT",
        dgpCode: "YISHUN",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "768578",
        zoneCode: "NORTH",
        schoolEmail: "NORTHLAND_SS@MOE.EDU.SG",
        schoolNumber: "62576781",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "NORTHLIGHT SCHOOL",
        address: "151 Towner Road",
        mrtDesc: "BOON KENG (NE9)",
        dgpCode: "KALLANG",
        mainlevelCode: "SECONDARY (S1-S4)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "SPECIALISED SCHOOL",
        postalCode: "327830",
        zoneCode: "SOUTH",
        schoolEmail: "nls@moe.edu.sg",
        schoolNumber: "69296290",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "NORTHOAKS PRIMARY SCHOOL",
        address: "61 Sembawang Drive",
        mrtDesc: "Sembawang MRT",
        dgpCode: "SEMBAWANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "757622",
        zoneCode: "NORTH",
        schoolEmail: "northoaks_ps@moe.edu.sg",
        schoolNumber: "6753 8835",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "NORTHSHORE PRIMARY SCHOOL",
        address: "30 Northshore Drive",
        mrtDesc: "Puggol Point LRT Station",
        dgpCode: "PUNGGOL",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "828671",
        zoneCode: "EAST",
        schoolEmail: "northhshore_ps@moe.edu.sg",
        schoolNumber: "62026490",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "NUS HIGH SCHOOL OF MATHEMATICS AND SCIENCE",
        address: "20 Clementi Avenue 1",
        mrtDesc: "Nearest MRT Stations - Clementi and Dover",
        dgpCode: "CLEMENTI",
        mainlevelCode: "MIXED LEVEL (S1-JC2)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "SPECIALISED INDEPENDENT SCHOOL",
        postalCode: "129957",
        zoneCode: "WEST",
        schoolEmail: "einstein@highsch.nus.edu.sg",
        schoolNumber: "65161709",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "OASIS PRIMARY SCHOOL",
        address: "71 Edgefield Plains",
        mrtDesc: "Damai LRT Station",
        dgpCode: "PUNGGOL",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "828716",
        zoneCode: "EAST",
        schoolEmail: "oasis_ps@moe.edu.sg",
        schoolNumber: "6320 9855",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "OPERA ESTATE PRIMARY SCHOOL",
        address: "48 FIDELIO STREET",
        mrtDesc: "Bedok, Kembangan",
        dgpCode: "BEDOK",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "458436",
        zoneCode: "EAST",
        schoolEmail: "OEPS@MOE.EDU.SG",
        schoolNumber: "62410417",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ORCHID PARK SECONDARY SCHOOL",
        address: "10 YISHUN STREET 81",
        mrtDesc: "KHATIB MRT",
        dgpCode: "YISHUN",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "768454",
        zoneCode: "NORTH",
        schoolEmail: "OPSS@MOE.EDU.SG",
        schoolNumber: "67598547",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "OUTRAM SECONDARY SCHOOL",
        address: "3 YORK HILL",
        mrtDesc: "OUTRAM PARK MRT, CHINATOWN MRT",
        dgpCode: "CENTRAL",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "168622",
        zoneCode: "SOUTH",
        schoolEmail: "OSS@MOE.EDU.SG",
        schoolNumber: "67334077",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "PALM VIEW PRIMARY SCHOOL",
        address: "150 Compassvale Bow",
        mrtDesc: "Buangkok",
        dgpCode: "SENG KANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "544822",
        zoneCode: "NORTH",
        schoolEmail: "palmview_ps@moe.edu.sg",
        schoolNumber: "65087300",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "PARK VIEW PRIMARY SCHOOL",
        address: "60 PASIR RIS DRIVE 1",
        mrtDesc: "Pasir Ris MRT Station",
        dgpCode: "PASIR RIS",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "519524",
        zoneCode: "EAST",
        schoolEmail: "PVPS@MOE.EDU.SG",
        schoolNumber: "65851421",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "PASIR RIS CREST SECONDARY SCHOOL",
        address: "11 PASIR RIS STREET 41",
        mrtDesc: "PASIR RIS MRT",
        dgpCode: "PASIR RIS",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "518934",
        zoneCode: "EAST",
        schoolEmail: "PRCSS@MOE.EDU.SG",
        schoolNumber: "65811655",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "PASIR RIS PRIMARY SCHOOL",
        address: "5 PASIR RIS STREET 21",
        mrtDesc: "Pasir Ris MRT",
        dgpCode: "PASIR RIS",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "518968",
        zoneCode: "EAST",
        schoolEmail: "PRPS@MOE.EDU.SG",
        schoolNumber: "65822606",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "PASIR RIS SECONDARY SCHOOL",
        address: "390 TAMPINES STREET 21",
        mrtDesc: "TAMPINES MRT, TAMPINES EAST MRT,  TAMPINES WEST MRT",
        dgpCode: "TAMPINES",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "529400",
        zoneCode: "EAST",
        schoolEmail: "PRSS@MOE.EDU.SG",
        schoolNumber: "65010800",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "PAYA LEBAR METHODIST GIRLS' SCHOOL (PRIMARY)",
        address: "298 LORONG AH SOO",
        mrtDesc: "Kovan (NE13), Serangoon(NE12/CC13)",
        dgpCode: "HOUGANG",
        mainlevelCode: "PRIMARY",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "536741",
        zoneCode: "EAST",
        schoolEmail: "PLMGPS@MOE.EDU.SG",
        schoolNumber: "62862795",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "PAYA LEBAR METHODIST GIRLS' SCHOOL (SECONDARY)",
        address: "296 LOR AH SOO",
        mrtDesc: "KOVAN MRT, SERANGOON MRT",
        dgpCode: "HOUGANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "536742",
        zoneCode: "EAST",
        schoolEmail: "PLMGSS@MOE.EDU.SG",
        schoolNumber: "62816606",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "PEI CHUN PUBLIC SCHOOL",
        address: "16 LORONG 7 TOA PAYOH",
        mrtDesc: "Toa Payoh MRT Station and Braddell MRT Station",
        dgpCode: "TOA PAYOH",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "319320",
        zoneCode: "SOUTH",
        schoolEmail: "PCPS@MOE.EDU.SG",
        schoolNumber: "63539450",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "PEI HWA PRESBYTERIAN PRIMARY SCHOOL",
        address: "7 PEI WAH AVENUE",
        mrtDesc: "Beauty World",
        dgpCode: "BUKIT TIMAH",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "597610",
        zoneCode: "WEST",
        schoolEmail: "PHPPS@MOE.EDU.SG",
        schoolNumber: "64663787",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "PEI HWA SECONDARY SCHOOL",
        address: "21 FERNVALE LINK",
        mrtDesc: "SENGKANG MRT, LAYAR LRT",
        dgpCode: "SENG KANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "797702",
        zoneCode: "NORTH",
        schoolEmail: "peihwasec@moe.edu.sg",
        schoolNumber: "65009580",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "PEI TONG PRIMARY SCHOOL",
        address: "15 CLEMENTI AVENUE 5",
        mrtDesc: "Clementi",
        dgpCode: "CLEMENTI",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "129857",
        zoneCode: "WEST",
        schoolEmail: "PTPS@MOE.EDU.SG",
        schoolNumber: "67775458",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "PEICAI SECONDARY SCHOOL",
        address: "10 SERANGOON AVENUE 4",
        mrtDesc: "SERANGOON MRT",
        dgpCode: "SERANGOON",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "556094",
        zoneCode: "SOUTH",
        schoolEmail: "PEICAI_SS@MOE.EDU.SG",
        schoolNumber: "62021260",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "PEIRCE SECONDARY SCHOOL",
        address: "10 SIN MING WALK",
        mrtDesc: "ANG MO KIO MRT, BISHAN MRT, MARYMOUNT MRT, BRIGHT HILL MRT",
        dgpCode: "BISHAN",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "575566",
        zoneCode: "SOUTH",
        schoolEmail: "PEIRCE_SS@MOE.EDU.SG",
        schoolNumber: "64576454",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "PEIYING PRIMARY SCHOOL",
        address: "651 YISHUN RING ROAD",
        mrtDesc: "Khatib",
        dgpCode: "YISHUN",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "768687",
        zoneCode: "NORTH",
        schoolEmail: "PYPS@MOE.EDU.SG",
        schoolNumber: "62575684",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "PIONEER PRIMARY SCHOOL",
        address: "80 TENGAH GARDEN AVENUE",
        mrtDesc: "Boon Lay Station",
        dgpCode: "TENGAH",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "699915",
        zoneCode: "WEST",
        schoolEmail: "PIONEER_PS@MOE.EDU.SG",
        schoolNumber: "67932039",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "POI CHING SCHOOL",
        address: "21 TAMPINES STREET 71",
        mrtDesc: "Tampines MRT",
        dgpCode: "TAMPINES",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "529067",
        zoneCode: "EAST",
        schoolEmail: "POICHING_SCH@MOE.EDU.SG",
        schoolNumber: "67856420",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "PRESBYTERIAN HIGH SCHOOL",
        address: "5209 ANG MO KIO AVENUE 6",
        mrtDesc: "YIO CHU KANG MRT",
        dgpCode: "ANG MO KIO",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "569845",
        zoneCode: "SOUTH",
        schoolEmail: "PRESBYTERIAN@MOE.EDU.SG",
        schoolNumber: "64543722",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "PRINCESS ELIZABETH PRIMARY SCHOOL",
        address: "30 BUKIT BATOK WEST AVENUE 3",
        mrtDesc: "Bukit Batok MRT Station",
        dgpCode: "BUKIT BATOK",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "659163",
        zoneCode: "WEST",
        schoolEmail: "PEPS@MOE.EDU.SG",
        schoolNumber: "65655111",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "PUNGGOL COVE PRIMARY SCHOOL",
        address: "52 Sumang Walk",
        mrtDesc: "Nibong LRT Station",
        dgpCode: "PUNGGOL",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "828674",
        zoneCode: "EAST",
        schoolEmail: "punggolcove_ps@moe.edu.sg",
        schoolNumber: "63857339",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "PUNGGOL GREEN PRIMARY SCHOOL",
        address: "98 Punggol Walk",
        mrtDesc: "Punggol MRT Station",
        dgpCode: "PUNGGOL",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "828772",
        zoneCode: "EAST",
        schoolEmail: "admin_punggolgreen_ps@moe.edu.sg",
        schoolNumber: "65383011",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "PUNGGOL PRIMARY SCHOOL",
        address: "61 HOUGANG AVENUE 8",
        mrtDesc: "Hougang, Buangkok",
        dgpCode: "HOUGANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "538787",
        zoneCode: "SOUTH",
        schoolEmail: "PUNGGOL_PS@MOE.EDU.SG",
        schoolNumber: "63850762",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "PUNGGOL SECONDARY SCHOOL",
        address: "51 EDGEFIELD PLAINS",
        mrtDesc: "PUNGGOL MRT, COVE LRT",
        dgpCode: "PUNGGOL",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "828870",
        zoneCode: "EAST",
        schoolEmail: "PUNGGOL_SS@MOE.EDU.SG",
        schoolNumber: "64897851",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "PUNGGOL VIEW PRIMARY SCHOOL",
        address: "9 Punggol Place",
        mrtDesc: "Punggol MRT Station",
        dgpCode: "PUNGGOL",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "828845",
        zoneCode: "EAST",
        schoolEmail: "punggolview_ps@moe.edu.sg",
        schoolNumber: "6570 1588",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "QIFA PRIMARY SCHOOL",
        address: "50 WEST COAST AVENUE",
        mrtDesc: "Clementi MRT Station",
        dgpCode: "CLEMENTI",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "128104",
        zoneCode: "WEST",
        schoolEmail: "QIFA_PS@MOE.EDU.SG",
        schoolNumber: "67783085",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "QIHUA PRIMARY SCHOOL",
        address: "5 WOODLANDS STREET 81",
        mrtDesc: "Woodlands MRT Station",
        dgpCode: "WOODLANDS",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "738525",
        zoneCode: "NORTH",
        schoolEmail: "QIHUA_PS@MOE.EDU.SG",
        schoolNumber: "62696250",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "QUEENSTOWN PRIMARY SCHOOL",
        address: "310 MARGARET DR",
        mrtDesc: "Queenstown MRT",
        dgpCode: "QUEENSTOWN",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "149303",
        zoneCode: "SOUTH",
        schoolEmail: "QTPS@MOE.EDU.SG",
        schoolNumber: "64741044",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "QUEENSTOWN SECONDARY SCHOOL",
        address: "1 STRATHMORE ROAD",
        mrtDesc: "REDHILL MRT, QUEENSTOWN MRT",
        dgpCode: "QUEENSTOWN",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "148800",
        zoneCode: "SOUTH",
        schoolEmail: "QTSS@MOE.EDU.SG",
        schoolNumber: "64741055",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "QUEENSWAY SECONDARY SCHOOL",
        address: "2A MARGARET DRIVE",
        mrtDesc: "COMMONWEALTH MRT, QUEENSTOWN MRT",
        dgpCode: "QUEENSTOWN",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "149295",
        zoneCode: "SOUTH",
        schoolEmail: "QWSS@MOE.EDU.SG",
        schoolNumber: "64741421",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "RADIN MAS PRIMARY SCHOOL",
        address: "1 BUKIT PURMEI AVENUE",
        mrtDesc: "Tiong Bahru MRT; HarbourFront MRT",
        dgpCode: "BUKIT MERAH",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "99840",
        zoneCode: "SOUTH",
        schoolEmail: "RMPS@MOE.EDU.SG",
        schoolNumber: "62733937",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "RAFFLES GIRLS' PRIMARY SCHOOL",
        address: "21 Hillcrest Road",
        mrtDesc: "TAN KAH KEE MRT STATION",
        dgpCode: "BUKIT TIMAH",
        mainlevelCode: "PRIMARY",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "289072",
        zoneCode: "SOUTH",
        schoolEmail: "RGPS@MOE.EDU.SG",
        schoolNumber: "64684377",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "RAFFLES GIRLS' SCHOOL (SECONDARY)",
        address: "2 BRADDELL RISE",
        mrtDesc: "BRADDELL MRT, CALDECOTT MRT",
        dgpCode: "TOA PAYOH",
        mainlevelCode: "SECONDARY (S1-S4)",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "INDEPENDENT SCHOOL",
        postalCode: "318871",
        zoneCode: "SOUTH",
        schoolEmail: "RGSS@MOE.EDU.SG",
        schoolNumber: "67371845",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "RAFFLES INSTITUTION",
        address: "1 RAFFLES INSTITUTION LANE",
        mrtDesc: "BISHAN MRT, MARYMOUNT MRT",
        dgpCode: "BISHAN",
        mainlevelCode: "MIXED LEVEL (S1-JC2)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "INDEPENDENT SCHOOL",
        postalCode: "575954",
        zoneCode: "SOUTH",
        schoolEmail: "RAFFLES_INST@MOE.EDU.SG",
        schoolNumber: "64199242",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "RED SWASTIKA SCHOOL",
        address: "350 BEDOK NORTH AVENUE 3",
        mrtDesc: "Bedok Reservoir MRT",
        dgpCode: "BEDOK",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "469719",
        zoneCode: "EAST",
        schoolEmail: "REDSWASTIKA@MOE.EDU.SG",
        schoolNumber: "64430380",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "REGENT SECONDARY SCHOOL",
        address: "50 CHOA CHU KANG NORTH 5",
        mrtDesc: "YEW TEE MRT, CHOA CHU KANG MRT",
        dgpCode: "CHOA CHU KANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "689621",
        zoneCode: "WEST",
        schoolEmail: "REGENT_SS@MOE.EDU.SG",
        schoolNumber: "67653828",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "RIVER VALLEY HIGH SCHOOL",
        address: "6 BOON LAY AVENUE",
        mrtDesc: "BOON LAY MRT, LAKESIDE MRT",
        dgpCode: "JURONG WEST",
        mainlevelCode: "MIXED LEVEL (S1-JC2)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "649961",
        zoneCode: "WEST",
        schoolEmail: "RVHS@MOE.EDU.SG",
        schoolNumber: "65678115",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "RIVER VALLEY PRIMARY SCHOOL",
        address: "2 RIVER VALLEY GREEN",
        mrtDesc: "Somerset MRT",
        dgpCode: "CENTRAL",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "237993",
        zoneCode: "SOUTH",
        schoolEmail: "RVPS@MOE.EDU.SG",
        schoolNumber: "67371785",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "RIVERSIDE PRIMARY SCHOOL",
        address: "110 Woodlands Crescent",
        mrtDesc: "Admiralty MRT Station",
        dgpCode: "WOODLANDS",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "737803",
        zoneCode: "NORTH",
        schoolEmail: "riverside_ps@moe.edu.sg",
        schoolNumber: "63654490",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "RIVERSIDE SECONDARY SCHOOL",
        address: "3 WOODLANDS STREET 81",
        mrtDesc: "WOODLANDS MRT",
        dgpCode: "WOODLANDS",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "738524",
        zoneCode: "NORTH",
        schoolEmail: "RIVERSIDE_SS@MOE.EDU.SG",
        schoolNumber: "62699631",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "UNITY PRIMARY SCHOOL",
        address: "21 CHOA CHU KANG CRESCENT",
        mrtDesc: "Yew Tee MRT",
        dgpCode: "CHOA CHU KANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "688268",
        zoneCode: "WEST",
        schoolEmail: "UNITY_PS@MOE.EDU.SG",
        schoolNumber: "67676750",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "RIVERVALE PRIMARY SCHOOL",
        address: "80 RIVERVALE DRIVE",
        mrtDesc: "Nearest LRT Station : Rumbia",
        dgpCode: "SENG KANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "545092",
        zoneCode: "NORTH",
        schoolEmail: "RIVERVALE_PS@MOE.EDU.SG",
        schoolNumber: "63887450",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ROSYTH SCHOOL",
        address: "21 Serangoon North Avenue 4",
        mrtDesc: "Ang Mo Kio, Serangoon",
        dgpCode: "SERANGOON",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "555855",
        zoneCode: "NORTH",
        schoolEmail: "ROSYTH_SCH@MOE.EDU.SG",
        schoolNumber: "64812273",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "RULANG PRIMARY SCHOOL",
        address: "6 JURONG WEST STREET 52",
        mrtDesc: "Lakeside",
        dgpCode: "JURONG WEST",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "649295",
        zoneCode: "WEST",
        schoolEmail: "RULANG_PS@MOE.EDU.SG",
        schoolNumber: "65657771",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "SCHOOL OF SCIENCE AND TECHNOLOGY, SINGAPORE",
        address: "1 Technology Drive",
        mrtDesc: "Dover",
        dgpCode: "CLEMENTI",
        mainlevelCode: "SECONDARY (S1-S4)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "SPECIALISED INDEPENDENT SCHOOL",
        postalCode: "138572",
        zoneCode: "WEST",
        schoolEmail: "contactus@sst.edu.sg",
        schoolNumber: "65717200",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "SCHOOL OF THE ARTS, SINGAPORE",
        address: "1 Zubir Said Drive 05 01",
        mrtDesc: "Dhoby Ghaut",
        dgpCode: "CENTRAL",
        mainlevelCode: "MIXED LEVEL (S1-JC2)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "SPECIALISED INDEPENDENT SCHOOL",
        postalCode: "227968",
        zoneCode: "SOUTH",
        schoolEmail: "enquiries@sota.edu.sg",
        schoolNumber: "6338 9663",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "SEMBAWANG PRIMARY SCHOOL",
        address: "10 SEMBAWANG DRIVE",
        mrtDesc: "Sembawang MRT (6 to 8-minute walk)",
        dgpCode: "SEMBAWANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "757715",
        zoneCode: "NORTH",
        schoolEmail: "SEMBAWANG_PS@MOE.EDU.SG",
        schoolNumber: "67567330",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "SEMBAWANG SECONDARY SCHOOL",
        address: "30 SEMBAWANG CRESCENT",
        mrtDesc: "SEMBAWANG MRT",
        dgpCode: "SEMBAWANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "757704",
        zoneCode: "NORTH",
        schoolEmail: "SEMBAWANG_SS@MOE.EDU.SG",
        schoolNumber: "67566760",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "SENG KANG PRIMARY SCHOOL",
        address: "21 COMPASSVALE WALK",
        mrtDesc: "Sengkang MRT",
        dgpCode: "SENG KANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "545166",
        zoneCode: "NORTH",
        schoolEmail: "SKPS@MOE.EDU.SG",
        schoolNumber: "63840809",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "SENG KANG SECONDARY SCHOOL",
        address: "10 COMPASSVALE LANE",
        mrtDesc: "SENGKANG MRT, RANGGUNG LRT",
        dgpCode: "SENG KANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "545090",
        zoneCode: "NORTH",
        schoolEmail: "SKSS@MOE.EDU.SG",
        schoolNumber: "63887258",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "SENGKANG GREEN PRIMARY SCHOOL",
        address: "15 Fernvale Road",
        mrtDesc: "Fernvale LRT (SW5) - (Sengkang West Loop)",
        dgpCode: "SENG KANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "797636",
        zoneCode: "NORTH",
        schoolEmail: "sengkanggreen_ps@moe.edu.sg",
        schoolNumber: "63864255",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "SERANGOON GARDEN SECONDARY SCHOOL",
        address: "21 SERANGOON NORTH AVENUE 1",
        mrtDesc: "SERANGOON MRT, ANG MO KIO MRT",
        dgpCode: "SERANGOON",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "555889",
        zoneCode: "SOUTH",
        schoolEmail: "sgss@moe.edu.sg",
        schoolNumber: "62889227",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "SERANGOON SECONDARY SCHOOL",
        address: "11 UPPER SERANGOON VIEW",
        mrtDesc: "HOUGANG MRT, KANGKAR LRT",
        dgpCode: "HOUGANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "534237",
        zoneCode: "SOUTH",
        schoolEmail: "SERANGOON_SS@MOE.EDU.SG",
        schoolNumber: "63851589",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "SHUQUN PRIMARY SCHOOL",
        address: "8 JURONG WEST STREET 51",
        mrtDesc: "W11 Lakeside",
        dgpCode: "JURONG WEST",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "649332",
        zoneCode: "WEST",
        schoolEmail: "SQPS@MOE.EDU.SG",
        schoolNumber: "65637129",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "SI LING PRIMARY SCHOOL",
        address: "61 WOODLANDS AVENUE 1",
        mrtDesc: "Woodlands",
        dgpCode: "WOODLANDS",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "739067",
        zoneCode: "NORTH",
        schoolEmail: "SLPS@MOE.EDU.SG",
        schoolNumber: "62698832",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "SINGAPORE CHINESE GIRLS' PRIMARY SCHOOL",
        address: "190 DUNEARN ROAD",
        mrtDesc: "Stevens",
        dgpCode: "NOVENA",
        mainlevelCode: "PRIMARY",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "309437",
        zoneCode: "SOUTH",
        schoolEmail: "SCGPS@MOE.EDU.SG",
        schoolNumber: "62527966",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "SINGAPORE CHINESE GIRLS' SCHOOL",
        address: "190 DUNEARN ROAD",
        mrtDesc: "STEVENS MRT",
        dgpCode: "NOVENA",
        mainlevelCode: "SECONDARY (S1-S4)",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "INDEPENDENT SCHOOL",
        postalCode: "309437",
        zoneCode: "SOUTH",
        schoolEmail: "SCGSS@MOE.EDU.SG",
        schoolNumber: "62527966",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "SINGAPORE SPORTS SCHOOL",
        address: "1 Champions Way",
        mrtDesc: "Woodlands South MRT",
        dgpCode: "WOODLANDS",
        mainlevelCode: "MIXED LEVEL (S1-S5, JC1-JC2)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "SPECIALISED INDEPENDENT SCHOOL",
        postalCode: "737913",
        zoneCode: "NORTH",
        schoolEmail: "enquire@sportsschool.edu.sg",
        schoolNumber: "67660100",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "SOUTH VIEW PRIMARY SCHOOL",
        address: "6 Choa Chu Kang Central",
        mrtDesc: "Choa Chu Kang MRT Station",
        dgpCode: "CHOA CHU KANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "689762",
        zoneCode: "WEST",
        schoolEmail: "SVPS@MOE.EDU.SG",
        schoolNumber: "67697176",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "SPECTRA SECONDARY SCHOOL",
        address: "1 WOODLANDS DRIVE 64",
        mrtDesc: "ADMIRALTY",
        dgpCode: "WOODLANDS",
        mainlevelCode: "SECONDARY (S1-S4)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "SPECIALISED SCHOOL",
        postalCode: "737758",
        zoneCode: "NORTH",
        schoolEmail: "spectra@schools.gov.sg",
        schoolNumber: "64660775",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "SPRINGDALE PRIMARY SCHOOL",
        address: "71 Anchorvale Link",
        mrtDesc: "Sengkang Station (NE16); Nearest LRT station: Farmway; *10-15 min walk from either station",
        dgpCode: "SENG KANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "544799",
        zoneCode: "NORTH",
        schoolEmail: "springdale_ps@moe.edu.sg",
        schoolNumber: "63157600",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "SPRINGFIELD SECONDARY SCHOOL",
        address: "30 TAMPINES AVENUE 8",
        mrtDesc: "TAMPINES MRT, TAMPINES WEST MRT",
        dgpCode: "TAMPINES",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "529593",
        zoneCode: "EAST",
        schoolEmail: "SPRINGFIELDS@MOE.EDU.SG",
        schoolNumber: "63183053",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ST ANDREW'S SCHOOL (JUNIOR)",
        address: "2 FRANCIS THOMAS DRIVE",
        mrtDesc: "Potong Pasir, Toa Payoh",
        dgpCode: "TOA PAYOH",
        mainlevelCode: "PRIMARY",
        natureCode: "BOYS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "359337",
        zoneCode: "SOUTH",
        schoolEmail: "SAJS@MOE.EDU.SG",
        schoolNumber: "62884303",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ST ANDREW'S SCHOOL (SECONDARY)",
        address: "15 FRANCIS THOMAS DRIVE",
        mrtDesc: "POTONG PASIR MRT",
        dgpCode: "TOA PAYOH",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "BOYS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "359342",
        zoneCode: "SOUTH",
        schoolEmail: "SASS@MOE.EDU.SG",
        schoolNumber: "62851944",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ST. ANDREW'S JUNIOR COLLEGE",
        address: "5 Sorby Adams Drive",
        mrtDesc: "Potong Pasir NE10",
        dgpCode: "TOA PAYOH",
        mainlevelCode: "JUNIOR COLLEGE",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "357691",
        zoneCode: "SOUTH",
        schoolEmail: "SAJC@MOE.EDU.SG",
        schoolNumber: "62857008",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ST. ANTHONY'S CANOSSIAN PRIMARY SCHOOL",
        address: "1602 BEDOK NORTH AVE 4",
        mrtDesc: "Bedok MRT",
        dgpCode: "BEDOK",
        mainlevelCode: "PRIMARY",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "469701",
        zoneCode: "EAST",
        schoolEmail: "SACPS@MOE.EDU.SG",
        schoolNumber: "64492239",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ST. ANTHONY'S CANOSSIAN SECONDARY SCHOOL",
        address: "1600 BEDOK NORTH AVENUE 4",
        mrtDesc: "BEDOK MRT, BEDOK RESERVOIR MRT",
        dgpCode: "BEDOK",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "469700",
        zoneCode: "EAST",
        schoolEmail: "SACSS@MOE.EDU.SG",
        schoolNumber: "64490616",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ST. ANTHONY'S PRIMARY SCHOOL",
        address: "30 Bukit Batok St 32",
        mrtDesc: "Bukit Gombak MRT Station",
        dgpCode: "BUKIT BATOK",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "659401",
        zoneCode: "WEST",
        schoolEmail: "SAPS@MOE.EDU.SG",
        schoolNumber: "65690822",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ST. GABRIEL'S PRIMARY SCHOOL",
        address: "220 Lorong Chuan",
        mrtDesc: "Lor Chuan MRT Station (Circle Line)",
        dgpCode: "SERANGOON",
        mainlevelCode: "PRIMARY",
        natureCode: "BOYS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "556742",
        zoneCode: "SOUTH",
        schoolEmail: "STGPS@MOE.EDU.SG",
        schoolNumber: "62803628",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ST. GABRIEL'S SECONDARY SCHOOL",
        address: "24 SERANGOON AVENUE 1",
        mrtDesc: "SERANGOON MRT",
        dgpCode: "SERANGOON",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "BOYS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "556140",
        zoneCode: "SOUTH",
        schoolEmail: "STGSS@MOE.EDU.SG",
        schoolNumber: "62889470",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ST. HILDA'S PRIMARY SCHOOL",
        address: "2 Tampines Ave 3",
        mrtDesc: "Tampines West, Tampines Central",
        dgpCode: "TAMPINES",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "529706",
        zoneCode: "EAST",
        schoolEmail: "SHPS@MOE.EDU.SG",
        schoolNumber: "67811916",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ST. HILDA'S SECONDARY SCHOOL",
        address: "2 TAMPINES STREET 82",
        mrtDesc: "TAMPINES MRT, TAMPINES WEST MRT",
        dgpCode: "TAMPINES",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "528986",
        zoneCode: "EAST",
        schoolEmail: "SHSS@MOE.EDU.SG",
        schoolNumber: "63055277",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ST. JOSEPH'S INSTITUTION",
        address: "38 MALCOLM ROAD",
        mrtDesc: "STEVENS MRT",
        dgpCode: "NOVENA",
        mainlevelCode: "MIXED LEVEL (S1-JC2)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "INDEPENDENT SCHOOL",
        postalCode: "308274",
        zoneCode: "SOUTH",
        schoolEmail: "SJI@MOE.EDU.SG",
        schoolNumber: "62500022",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ST. JOSEPH'S INSTITUTION JUNIOR",
        address: "3 ESSEX ROAD",
        mrtDesc: "Novena",
        dgpCode: "NOVENA",
        mainlevelCode: "PRIMARY",
        natureCode: "BOYS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "309331",
        zoneCode: "SOUTH",
        schoolEmail: "STMICHAELSCH@MOE.EDU.SG",
        schoolNumber: "62552700",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ST. MARGARET'S SCHOOL (PRIMARY)",
        address: "136 Sophia Road",
        mrtDesc: "Little India MRT Station (NE7/DT12); Dhoby Ghaut MRT Station (NS24/NE6/CC1)",
        dgpCode: "CENTRAL",
        mainlevelCode: "PRIMARY",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "228197",
        zoneCode: "SOUTH",
        schoolEmail: "STMARGARETPS@MOE.EDU.SG",
        schoolNumber: "63394247",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ST. MARGARET'S SCHOOL (SECONDARY)",
        address: "111 FARRER ROAD",
        mrtDesc: "FARRER ROAD MRT",
        dgpCode: "BUKIT TIMAH",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "259240",
        zoneCode: "SOUTH",
        schoolEmail: "STMARGARETSS@MOE.EDU.SG",
        schoolNumber: "64664525",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "UNITY SECONDARY SCHOOL",
        address: "20 CHOA CHU KANG STREET 62",
        mrtDesc: "YEW TEE MRT",
        dgpCode: "CHOA CHU KANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "689143",
        zoneCode: "WEST",
        schoolEmail: "UNITY_SS@MOE.EDU.SG",
        schoolNumber: "67671070",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ST. PATRICK'S SCHOOL",
        address: "490 EAST COAST ROAD",
        mrtDesc: "MARINE TERRACE MRT (TEL)",
        dgpCode: "BEDOK",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "BOYS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "429058",
        zoneCode: "EAST",
        schoolEmail: "STPATRICKSCH@MOE.EDU.SG",
        schoolNumber: "63440929",
        status: "active",
        isCooperating: true,
        },
        {
        schoolName: "ST. STEPHEN'S SCHOOL",
        address: "20 SIGLAP VIEW",
        mrtDesc: "Kembangan MRT Station",
        dgpCode: "BEDOK",
        mainlevelCode: "PRIMARY",
        natureCode: "BOYS' SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "455789",
        zoneCode: "EAST",
        schoolEmail: "STSTEPHENSCH@MOE.EDU.SG",
        schoolNumber: "62419513",
        status: "active",
        isCooperating: true,
        },
        {
        schoolName: "SWISS COTTAGE SECONDARY SCHOOL",
        address: "3 BUKIT BATOK STREET 34",
        mrtDesc: "BUKIT GOMBAK MRT",
        dgpCode: "BUKIT BATOK",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "659322",
        zoneCode: "WEST",
        schoolEmail: "SCSS@MOE.EDU.SG",
        schoolNumber: "65637173",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "TAMPINES MERIDIAN JUNIOR COLLEGE",
        address: "21 Pasir Ris Street 71",
        mrtDesc: "Pasir Ris MRT Station",
        dgpCode: "PASIR RIS",
        mainlevelCode: "JUNIOR COLLEGE",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "518799",
        zoneCode: "EAST",
        schoolEmail: "tmjc@moe.edu.sg",
        schoolNumber: "63493660",
        status: "active",
        isCooperating: true,
        },
        {
        schoolName: "TAMPINES NORTH PRIMARY SCHOOL",
        address: "30 TAMPINES AVENUE 9",
        mrtDesc: "Tampines MRT",
        dgpCode: "TAMPINES",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "529565",
        zoneCode: "EAST",
        schoolEmail: "TNPS@MOE.EDU.SG",
        schoolNumber: "67854329",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "TAMPINES PRIMARY SCHOOL",
        address: "250 TAMPINES STREET 12",
        mrtDesc: "Tampines MRT",
        dgpCode: "TAMPINES",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "529426",
        zoneCode: "EAST",
        schoolEmail: "TPPS@MOE.EDU.SG",
        schoolNumber: "67831190",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "TAMPINES SECONDARY SCHOOL",
        address: "252 TAMPINES ST 12",
        mrtDesc: "TAMPINES MRT",
        dgpCode: "TAMPINES",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "529427",
        zoneCode: "EAST",
        schoolEmail: "TPSS@MOE.EDU.SG",
        schoolNumber: "67835423",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "TANJONG KATONG GIRLS' SCHOOL",
        address: "20 Dunman Lane",
        mrtDesc: "PAYA LEBAR MRT, DAKOTA MRT",
        dgpCode: "MARINE PARADE",
        mainlevelCode: "SECONDARY (S1-S4)",
        natureCode: "GIRLS' SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "439272",
        zoneCode: "EAST",
        schoolEmail: "TKGS@MOE.EDU.SG",
        schoolNumber: "63441593",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "TANJONG KATONG PRIMARY SCHOOL",
        address: "10 Seraya Road",
        mrtDesc: null,
        dgpCode: "MARINE PARADE",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "437259",
        zoneCode: "EAST",
        schoolEmail: "TKPS@MOE.EDU.SG",
        schoolNumber: "63444728",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "TANJONG KATONG SECONDARY SCHOOL",
        address: "130 HAIG ROAD",
        mrtDesc: "PAYA LEBAR MRT, DAKOTA MRT",
        dgpCode: "MARINE PARADE",
        mainlevelCode: "SECONDARY (S1-S4)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "438796",
        zoneCode: "EAST",
        schoolEmail: "TKSS@MOE.EDU.SG",
        schoolNumber: "63443471",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "TAO NAN SCHOOL",
        address: "49 MARINE CRESCENT",
        mrtDesc: "Marine Parade, Marine Terrace",
        dgpCode: "MARINE PARADE",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "449761",
        zoneCode: "EAST",
        schoolEmail: "TAONAN_SCH@MOE.EDU.SG",
        schoolNumber: "64428307",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "TECK GHEE PRIMARY SCHOOL",
        address: "1 ANG MO KIO STREET 32",
        mrtDesc: "Ang Mo Kio & Bishan",
        dgpCode: "ANG MO KIO",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "569299",
        zoneCode: "SOUTH",
        schoolEmail: "TGPS@MOE.EDU.SG",
        schoolNumber: "64548769",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "TECK WHYE PRIMARY SCHOOL",
        address: "11 TECK WHYE WALK",
        mrtDesc: "Choa Chu Kang MRT & LRT",
        dgpCode: "CHOA CHU KANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "688261",
        zoneCode: "WEST",
        schoolEmail: "TWPS@MOE.EDU.SG",
        schoolNumber: "67691025",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "TELOK KURAU PRIMARY SCHOOL",
        address: "50 BEDOK RESERVOIR RD",
        mrtDesc: "Kaki Bukit MRT (nearest)",
        dgpCode: "BEDOK",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "479239",
        zoneCode: "EAST",
        schoolEmail: "TELOKKRAU_PS@MOE.EDU.SG",
        schoolNumber: "62441600",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "TEMASEK JUNIOR COLLEGE",
        address: "2 Tampines Avenue 9   Temasek Junior College",
        mrtDesc: "TAMPINES EAST MRT",
        dgpCode: "TAMPINES",
        mainlevelCode: "MIXED LEVEL (S1-JC2)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "529564",
        zoneCode: "EAST",
        schoolEmail: "TEMASEK_JC@MOE.EDU.SG",
        schoolNumber: "64428066",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "TEMASEK PRIMARY SCHOOL",
        address: "501 BEDOK SOUTH AVE 3",
        mrtDesc: "Tanah Merah MRT",
        dgpCode: "BEDOK",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "469300",
        zoneCode: "EAST",
        schoolEmail: "TEMASEK_PS@MOE.EDU.SG",
        schoolNumber: "64438134",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "TEMASEK SECONDARY SCHOOL",
        address: "600 UPPER EAST COAST ROAD",
        mrtDesc: "BEDOK MRT, TANAH MERAH MRT",
        dgpCode: "BEDOK",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "465561",
        zoneCode: "EAST",
        schoolEmail: "TEMASEK_SS@MOE.EDU.SG",
        schoolNumber: "64495020",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "TOWNSVILLE PRIMARY SCHOOL",
        address: "3 ANG MO KIO AVE 10",
        mrtDesc: "Bishan MRT, Ang Mo Kio MRT Stations",
        dgpCode: "ANG MO KIO",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "569730",
        zoneCode: "SOUTH",
        schoolEmail: "TOWNSVILLEPS@MOE.EDU.SG",
        schoolNumber: "64574345",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "VICTORIA JUNIOR COLLEGE",
        address: "20 MARINE VISTA",
        mrtDesc: "Nearest MRT Stations:  Marine Terrace, Kembangan, Eunos",
        dgpCode: "BEDOK",
        mainlevelCode: "JUNIOR COLLEGE",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "449035",
        zoneCode: "EAST",
        schoolEmail: "VICTORIA_JC@MOE.EDU.SG",
        schoolNumber: "64485011",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "VICTORIA SCHOOL",
        address: "2 SIGLAP LINK",
        mrtDesc: "SIGLAP, BEDOK MRT, PAYA LEBAR MRT",
        dgpCode: "BEDOK",
        mainlevelCode: "SECONDARY (S1-S4)",
        natureCode: "BOYS' SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "448880",
        zoneCode: "EAST",
        schoolEmail: "VICTORIA_SCH@MOE.EDU.SG",
        schoolNumber: "62912965",
        status: "active",
        isCooperating: true,
        },
        {
        schoolName: "WATERWAY PRIMARY SCHOOL",
        address: "70 Punggol Drive",
        mrtDesc: "Kadaloor LRT Station",
        dgpCode: "PUNGGOL",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "828802",
        zoneCode: "EAST",
        schoolEmail: "waterway_ps@moe.edu.sg",
        schoolNumber: "6636 6880",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "WELLINGTON PRIMARY SCHOOL",
        address: "10 WELLINGTON CIRCLE",
        mrtDesc: "Sembawang MRT",
        dgpCode: "SEMBAWANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "757702",
        zoneCode: "NORTH",
        schoolEmail: "WELLINGTONPS@MOE.EDU.SG",
        schoolNumber: "67533319",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "WEST GROVE PRIMARY SCHOOL",
        address: "1 JURONG WEST ST 72",
        mrtDesc: "Boon Lay MRT",
        dgpCode: "JURONG WEST",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "649223",
        zoneCode: "WEST",
        schoolEmail: "WGPS@MOE.EDU.SG",
        schoolNumber: "62679234",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "WEST SPRING PRIMARY SCHOOL",
        address: "60 Bukit Panjang Ring Road",
        mrtDesc: "Jelapang LRT",
        dgpCode: "BUKIT PANJANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "679946",
        zoneCode: "WEST",
        schoolEmail: "westspring_ps@moe.edu.sg",
        schoolNumber: "63144192",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "WEST SPRING SECONDARY SCHOOL",
        address: "61 SENJA  ROAD",
        mrtDesc: "BUKIT PANJANG MRT, JELAPANG LRT, SENJA LRT",
        dgpCode: "BUKIT PANJANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "677737",
        zoneCode: "WEST",
        schoolEmail: "WESTSPRINGSS@MOE.EDU.SG",
        schoolNumber: "68920369",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "WEST VIEW PRIMARY SCHOOL",
        address: "31 SENJA ROAD",
        mrtDesc: "Bukit Panjang MRT, SENJA LRT (A13)",
        dgpCode: "BUKIT PANJANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "677742",
        zoneCode: "WEST",
        schoolEmail: "WVPS@MOE.EDU.SG",
        schoolNumber: "67600178",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "WESTWOOD PRIMARY SCHOOL",
        address: "1 Jurong West Street 73",
        mrtDesc: "Boon Lay MRT Station",
        dgpCode: "JURONG WEST",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "649188",
        zoneCode: "WEST",
        schoolEmail: "westwood_ps@moe.edu.sg",
        schoolNumber: "64121690",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "WESTWOOD SECONDARY SCHOOL",
        address: "11 JURONG WEST STREET 25",
        mrtDesc: "BOON LAY MRT",
        dgpCode: "JURONG WEST",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "648350",
        zoneCode: "WEST",
        schoolEmail: "WESTWOOD_SS@MOE.EDU.SG",
        schoolNumber: "67929737",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "WHITE SANDS PRIMARY SCHOOL",
        address: "2 PASIR RIS ST 11",
        mrtDesc: "Pasir Ris MRT Station",
        dgpCode: "PASIR RIS",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "519075",
        zoneCode: "EAST",
        schoolEmail: "WSPS@MOE.EDU.SG",
        schoolNumber: "69229100",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "WHITLEY SECONDARY SCHOOL",
        address: "30 BISHAN STREET 24",
        mrtDesc: "BISHAN MRT, MARYMOUNT MRT",
        dgpCode: "BISHAN",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "579747",
        zoneCode: "SOUTH",
        schoolEmail: "WHITLEY_SS@MOE.EDU.SG",
        schoolNumber: "64561336",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "WOODGROVE PRIMARY SCHOOL",
        address: "2 WOODLANDS DRIVE 14",
        mrtDesc: "Woodlands MRT Station",
        dgpCode: "WOODLANDS",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "738079",
        zoneCode: "NORTH",
        schoolEmail: "WOODGROVE_PS@MOE.EDU.SG",
        schoolNumber: "68943371",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "WOODGROVE SECONDARY SCHOOL",
        address: "3 WOODLANDS AVENUE 6",
        mrtDesc: "WOODLANDS MRT, WOODLANDS SOUTH MRT",
        dgpCode: "WOODLANDS",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "738990",
        zoneCode: "NORTH",
        schoolEmail: "WOODGROVE_SS@MOE.EDU.SG",
        schoolNumber: "68932564",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "WOODLANDS PRIMARY SCHOOL",
        address: "10 WOODLANDS DRIVE 50",
        mrtDesc: "Woodlands",
        dgpCode: "WOODLANDS",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "738853",
        zoneCode: "NORTH",
        schoolEmail: "WPS@MOE.EDU.SG",
        schoolNumber: "62697410",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "WOODLANDS RING PRIMARY SCHOOL",
        address: "11 WOODLANDS RING ROAD",
        mrtDesc: "Admiralty MRT Station",
        dgpCode: "WOODLANDS",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "738240",
        zoneCode: "NORTH",
        schoolEmail: "WRPS@MOE.EDU.SG",
        schoolNumber: "63643679",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "WOODLANDS RING SECONDARY SCHOOL",
        address: "21 WOODLANDS AVENUE 1",
        mrtDesc: "ADMIRALTY MRT",
        dgpCode: "WOODLANDS",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "739062",
        zoneCode: "NORTH",
        schoolEmail: "WRSS@MOE.EDU.SG",
        schoolNumber: "63643712",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "WOODLANDS SECONDARY SCHOOL",
        address: "11 MARSILING ROAD",
        mrtDesc: "MARSILING MRT, WOODLANDS MRT",
        dgpCode: "WOODLANDS",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "739111",
        zoneCode: "NORTH",
        schoolEmail: "WSS@MOE.EDU.SG",
        schoolNumber: "68494400",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "XINGHUA PRIMARY SCHOOL",
        address: "45 HOUGANG AVENUE 1",
        mrtDesc: "Kovan MRT Station",
        dgpCode: "HOUGANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "538882",
        zoneCode: "SOUTH",
        schoolEmail: "XINGHUA_PS@MOE.EDU.SG",
        schoolNumber: "62889121",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "XINGNAN PRIMARY SCHOOL",
        address: "5 JURONG WEST STREET 91",
        mrtDesc: "Pioneer MRT Station",
        dgpCode: "JURONG WEST",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "649036",
        zoneCode: "WEST",
        schoolEmail: "XINGNAN_PS@MOE.EDU.SG",
        schoolNumber: "67913679",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "XINMIN PRIMARY SCHOOL",
        address: "9 HOUGANG AVENUE 8",
        mrtDesc: "Nil",
        dgpCode: "HOUGANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "538784",
        zoneCode: "NORTH",
        schoolEmail: "XINMIN_PS@MOE.EDU.SG",
        schoolNumber: "62835479",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "XINMIN SECONDARY SCHOOL",
        address: "11 HOUGANG AVENUE 8",
        mrtDesc: "HOUGANG MRT",
        dgpCode: "HOUGANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "538789",
        zoneCode: "NORTH",
        schoolEmail: "XINMIN_SS@MOE.EDU.SG",
        schoolNumber: "62889382",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "XISHAN PRIMARY SCHOOL",
        address: "8 YISHUN STREET 21",
        mrtDesc: "Alight at Yishun MRT Station; Take Exit C; Walk towards Yishun Street 21",
        dgpCode: "YISHUN",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "768611",
        zoneCode: "NORTH",
        schoolEmail: "XISHAN_PS@MOE.EDU.SG",
        schoolNumber: "67588837",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "YANGZHENG PRIMARY SCHOOL",
        address: "15 SERANGOON AVENUE 3",
        mrtDesc: "Serangoon Station",
        dgpCode: "SERANGOON",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "556108",
        zoneCode: "SOUTH",
        schoolEmail: "YZPS@MOE.EDU.SG",
        schoolNumber: "62846298",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "YEW TEE PRIMARY SCHOOL",
        address: "10 CHOA CHU KANG ST 64",
        mrtDesc: "Yew Tee MRT Station",
        dgpCode: "CHOA CHU KANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "689100",
        zoneCode: "WEST",
        schoolEmail: "YTPS@MOE.EDU.SG",
        schoolNumber: "67670027",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "YIO CHU KANG PRIMARY SCHOOL",
        address: "1 HOUGANG STREET 51",
        mrtDesc: "Hougang MRT Station; Yio Chu Kang MRT Station",
        dgpCode: "HOUGANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "538720",
        zoneCode: "NORTH",
        schoolEmail: "YCKPS@MOE.EDU.SG",
        schoolNumber: "63851365",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "YIO CHU KANG SECONDARY SCHOOL",
        address: "3063 ANG MO KIO AVENUE 5",
        mrtDesc: "YIO CHU KANG MRT",
        dgpCode: "ANG MO KIO",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "569868",
        zoneCode: "SOUTH",
        schoolEmail: "YCKSS@MOE.EDU.SG",
        schoolNumber: "64560669",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "YISHUN INNOVA JUNIOR COLLEGE",
        address: "3 YISHUN RING ROAD",
        mrtDesc: "Yishun, Khatib",
        dgpCode: "YISHUN",
        mainlevelCode: "JUNIOR COLLEGE",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "768675",
        zoneCode: "NORTH",
        schoolEmail: "yijc@moe.edu.sg",
        schoolNumber: "62579873",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "YISHUN PRIMARY SCHOOL",
        address: "500 YISHUN RING ROAD",
        mrtDesc: "Yishun",
        dgpCode: "YISHUN",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "768679",
        zoneCode: "NORTH",
        schoolEmail: "YPS@MOE.EDU.SG",
        schoolNumber: "62577461",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "YISHUN SECONDARY SCHOOL",
        address: "4 YISHUN STREET 71",
        mrtDesc: "YISHUN MRT, KHATIB MRT",
        dgpCode: "YISHUN",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "768516",
        zoneCode: "NORTH",
        schoolEmail: "YISHUN_SS@MOE.EDU.SG",
        schoolNumber: "68767129",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "YISHUN TOWN SECONDARY SCHOOL",
        address: "6 YISHUN STREET 21",
        mrtDesc: "YISHUN MRT",
        dgpCode: "YISHUN",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "768610",
        zoneCode: "NORTH",
        schoolEmail: "YTSS@MOE.EDU.SG",
        schoolNumber: "67587219",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "YU NENG PRIMARY SCHOOL",
        address: "56 BEDOK NORTH ST 3",
        mrtDesc: "Bedok MRT Station (East-West Line), Bedok Reservoir MRT STation (Downtown line)",
        dgpCode: "BEDOK",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "469623",
        zoneCode: "EAST",
        schoolEmail: "YNPS@MOE.EDU.SG",
        schoolNumber: "64490121",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "YUAN CHING SECONDARY SCHOOL",
        address: "103 YUAN CHING ROAD",
        mrtDesc: "LAKESIDE MRT",
        dgpCode: "JURONG WEST",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "618654",
        zoneCode: "WEST",
        schoolEmail: "YCSS@MOE.EDU.SG",
        schoolNumber: "62612489",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "YUHUA PRIMARY SCHOOL",
        address: "158 JURONG EAST STREET 24",
        mrtDesc: "Jurong East, Bukit Batok",
        dgpCode: "JURONG EAST",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "609558",
        zoneCode: "WEST",
        schoolEmail: "YUHUA_PS@MOE.EDU.SG",
        schoolNumber: "65605062",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "YUHUA SECONDARY SCHOOL",
        address: "35 JURONG WEST STREET 41",
        mrtDesc: "LAKESIDE MRT",
        dgpCode: "JURONG WEST",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "649406",
        zoneCode: "WEST",
        schoolEmail: "YUHUA_SS@MOE.EDU.SG",
        schoolNumber: "65661985",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "YUMIN PRIMARY SCHOOL",
        address: "3 TAMPINES STREET 21",
        mrtDesc: "Tampines MRT Station",
        dgpCode: "TAMPINES",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "529393",
        zoneCode: "EAST",
        schoolEmail: "YUMIN_PS@MOE.EDU.SG",
        schoolNumber: "67811262",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "YUSOF ISHAK SECONDARY SCHOOL",
        address: "8 SUMANG WALK",
        mrtDesc: "PUNGGOL MRT",
        dgpCode: "PUNGGOL",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "828676",
        zoneCode: "EAST",
        schoolEmail: "YISS@MOE.EDU.SG",
        schoolNumber: "65009800",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "YUYING SECONDARY SCHOOL",
        address: "47 HOUGANG AVENUE 1",
        mrtDesc: "KOVAN MRT, SERANGOON MRT, HOUGANG MRT",
        dgpCode: "HOUGANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT-AIDED SCH",
        postalCode: "538884",
        zoneCode: "SOUTH",
        schoolEmail: "YUYING_SS@MOE.EDU.SG",
        schoolNumber: "62827968",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ZHANGDE PRIMARY SCHOOL",
        address: "51 Jalan Membina",
        mrtDesc: "Tiong Bahru MRT Station",
        dgpCode: "BUKIT MERAH",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "169485",
        zoneCode: "SOUTH",
        schoolEmail: "ZHANGDE_PS@MOE.EDU.SG",
        schoolNumber: "62740357",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ZHENGHUA PRIMARY SCHOOL",
        address: "9 Fajar Road",
        mrtDesc: "LRT: Fajar Station",
        dgpCode: "BUKIT PANJANG",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "679002",
        zoneCode: "WEST",
        schoolEmail: "ZHENGHUA_PS@MOE.EDU.SG",
        schoolNumber: "67697478",
        status: "active",
        isCooperating: true,
        },
        {
        schoolName: "ZHENGHUA SECONDARY SCHOOL",
        address: "62 Bukit Panjang Ring Road",
        mrtDesc: "JELAPANG LRT",
        dgpCode: "BUKIT PANJANG",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "679962",
        zoneCode: "WEST",
        schoolEmail: "ZHENGHUA_SS@MOE.EDU.SG",
        schoolNumber: "67639455",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ZHONGHUA PRIMARY SCHOOL",
        address: "12 SERANGOON AVENUE 4",
        mrtDesc: "Ang Mo Kio MRT, Bishan MRT, Serangoon MRT",
        dgpCode: "SERANGOON",
        mainlevelCode: "PRIMARY",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "556095",
        zoneCode: "SOUTH",
        schoolEmail: "ZHONGHUA_PS@MOE.EDU.SG",
        schoolNumber: "62835413",
        status: "active",
        isCooperating: false,
        },
        {
        schoolName: "ZHONGHUA SECONDARY SCHOOL",
        address: "13 SERANGOON AVENUE 3",
        mrtDesc: "SERANGOON MRT",
        dgpCode: "SERANGOON",
        mainlevelCode: "SECONDARY (S1-S5)",
        natureCode: "CO-ED SCHOOL",
        typeCode: "GOVERNMENT SCHOOL",
        postalCode: "556123",
        zoneCode: "SOUTH",
        schoolEmail: "ZHONGHUA_SS@MOE.EDU.SG",
        schoolNumber: "62824339",
        status: "active",
        isCooperating: false,
        },
    ].map((s) => prisma.school.create({ data: s }))
  );

  const schoolMap = Object.fromEntries(schools.map((s) => [s.schoolName, s.id]));
  console.log(`   Created ${schools.length} schools.`);

  // -------------------- COLOURS --------------------
  console.log("🎨 Seeding colours...");
  const colourData = [
    { colourName: "White", hexcode: "#FFFFFF" },
    { colourName: "Black", hexcode: "#000000" },
    { colourName: "Navy Blue", hexcode: "#000080" },
    { colourName: "Light Blue", hexcode: "#ADD8E6" },
    { colourName: "Royal Blue", hexcode: "#4169E1" },
    { colourName: "Blue", hexcode: "#0000FF" },       
    { colourName: "Red", hexcode: "#FF0000" },
    { colourName: "Maroon", hexcode: "#800000" },
    { colourName: "Green", hexcode: "#008000" },
    { colourName: "Dark Green", hexcode: "#006400" },
    { colourName: "Yellow", hexcode: "#FFFF00" },
    { colourName: "Gold", hexcode: "#FFD700" },
    { colourName: "Grey", hexcode: "#808080" },
    { colourName: "Silver", hexcode: "#C0C0C0" },
    { colourName: "Khaki", hexcode: "#C3B091" },
    { colourName: "Beige", hexcode: "#F5F5DC" },
    { colourName: "Brown", hexcode: "#8B4513" },
    { colourName: "Orange", hexcode: "#FFA500" },
    { colourName: "Purple", hexcode: "#800080" },
    { colourName: "Pink", hexcode: "#FFC0CB" },
  ];
  const colours = await Promise.all(
    colourData.map((c) => prisma.colour.create({ data: c }))
  );
  const colourMap = Object.fromEntries(colours.map((c) => [c.colourName, c.id]));
  console.log(`   Created ${colours.length} colours.`);

  // -------------------- PATTERNS --------------------
  console.log("🔲 Seeding patterns...");
  const patternData = ["Solid", "Striped", "Checkered", "Plaid", "Polka Dot"];
  const patterns = await Promise.all(
    patternData.map((p) => prisma.pattern.create({ data: { patternName: p } }))
  );
  const patternMap = Object.fromEntries(patterns.map((p) => [p.patternName, p.id]));
  console.log(`   Created ${patterns.length} patterns.`);

  // -------------------- MATERIALS --------------------
  console.log("🧵 Seeding materials...");
  const materialData = ["Cotton", "Polyester", "Cotton-Polyester Blend", "Nylon", "Dri-Fit"];
  const materials = await Promise.all(
    materialData.map((m) => prisma.material.create({ data: { materialName: m } }))
  );
  const materialMap = Object.fromEntries(materials.map((m) => [m.materialName, m.id]));
  console.log(`   Created ${materials.length} materials.`);

  // -------------------- CATEGORIES (Item Category Weights) --------------------
  console.log("📦 Seeding categories...");
  const categoryData = [
    { categoryName: "Uniform Shirt", weightKg: 0.22 },
    { categoryName: "Uniform Pants", weightKg: 0.300 },
    { categoryName: "Uniform Shorts", weightKg: 0.190 },
    { categoryName: "Uniform Skirt", weightKg: 0.275 },
    { categoryName: "Skort", weightKg: 0.275 },
    { categoryName: "House Shirt", weightKg: 0.190 },
    { categoryName: "Pinafore", weightKg: 0.250 },
    { categoryName: "PE Shirt", weightKg: 0.190 },
    { categoryName: "PE Shorts", weightKg: 0.110 },
    { categoryName: "Gym Shorts", weightKg: 0.110 },
    { categoryName: "Polo Shirt", weightKg: 0.190 },
    { categoryName: "Tie", weightKg: 0.05 },
    { categoryName: "Belt", weightKg: 0.1 },
    { categoryName: "Cap", weightKg: 0.08 },
    { categoryName: "Other Shirts", weightKg: 0.190 },
    { categoryName: "Others", weightKg: 0.0 },
  ];
  const categories = await Promise.all(
    categoryData.map((c) => prisma.category.create({ data: c }))
  );
  const catMap = Object.fromEntries(categories.map((c) => [c.categoryName, c.id]));
  console.log(`   Created ${categories.length} categories.`);

  // -------------------- BRAND SUPPLIERS --------------------
  console.log("🏭 Seeding brand suppliers...");
  const supplierData = [
    "Shanghai School Uniforms",
    "Asencio",
    "My Uniform Shop (Asia)",
    "KH Uniform (Kah Huat)",
    "Bibi & Baba",
    "Beau Voix",
    "Magdalene Sewing Centre",
  ];
  const suppliers = await Promise.all(
    supplierData.map((s) => prisma.brandSupplier.create({ data: { brandSupplier: s } }))
  );
  const supplierMap = Object.fromEntries(suppliers.map((s) => [s.brandSupplier, s.id]));
  console.log(`   Created ${suppliers.length} brand suppliers.`);

  // // -------------------- PRODUCT TYPES --------------------
  // console.log("📋 Seeding product types...");
  // const productTypeData = ["Laptop Sleeve", "Tote Bag", "Pencil Case", "Drawstring Bag", "Cushion Cover"];
  // const productTypes = await Promise.all(
  //   productTypeData.map((pt) => prisma.productType.create({ data: { typeName: pt } }))
  // );
  // const ptMap = Object.fromEntries(productTypes.map((pt) => [pt.typeName, pt.id]));
  // console.log(`   Created ${productTypes.length} product types.`);

  // // -------------------- STYLES --------------------
  // console.log("✂️  Seeding styles...");
  // const styleData = ["Patchwork", "Solid Panel", "Appliqué", "Quilted", "Woven Strip"];
  // const styles = await Promise.all(
  //   styleData.map((s) => prisma.style.create({ data: { styleName: s } }))
  // );
  // const styleMap = Object.fromEntries(styles.map((s) => [s.styleName, s.id]));
  // console.log(`   Created ${styles.length} styles.`);

  // ============================================================
  // TIER 2 — Depends on Tier 1
  // ============================================================

// -------------------- SIZE CATEGORIES & OPTIONS --------------------
console.log("📐 Seeding size categories & options...");

// ===== GENERIC (NO BRAND) SIZE CATEGORIES =====
// Fallback categories when supplier is unknown or not mapped

const genericOneSize = await prisma.sizeCategory.create({
  data: { sizeType: "OneSize" }, // brandSupplierId is null
});
const genericOneSizeOption = await prisma.sizeOption.create({
  data: { sizeName: "One Size", sizeClass: "S", sortOrder: 1, sizeCategoryId: genericOneSize.id },
});

const genericNumerical = await prisma.sizeCategory.create({
  data: { sizeType: "Numerical" }, // brandSupplierId is null
});
const genericNumericalOpts = await Promise.all(
  [
    // Age-based (7-15)
    { sizeName: "7",  sizeClass: "S" as const, sortOrder: 1 },
    { sizeName: "8",  sizeClass: "S" as const, sortOrder: 2 },
    { sizeName: "9",  sizeClass: "S" as const, sortOrder: 3 },
    { sizeName: "10", sizeClass: "S" as const, sortOrder: 4 },
    { sizeName: "11", sizeClass: "S" as const, sortOrder: 5 },
    { sizeName: "12", sizeClass: "S" as const, sortOrder: 6 },
    { sizeName: "13", sizeClass: "S" as const, sortOrder: 7 },
    { sizeName: "14", sizeClass: "S" as const, sortOrder: 8 },
    { sizeName: "15", sizeClass: "S" as const, sortOrder: 9 },
    // Waist-based (20-34 even)
    { sizeName: "20", sizeClass: "S" as const, sortOrder: 10 },
    { sizeName: "22", sizeClass: "S" as const, sortOrder: 11 },
    { sizeName: "24", sizeClass: "S" as const, sortOrder: 12 },
    { sizeName: "26", sizeClass: "S" as const, sortOrder: 13 },
    { sizeName: "28", sizeClass: "L" as const, sortOrder: 14 },
    { sizeName: "30", sizeClass: "L" as const, sortOrder: 15 },
    { sizeName: "32", sizeClass: "L" as const, sortOrder: 16 },
    { sizeName: "34", sizeClass: "L" as const, sortOrder: 17 },
    { sizeName: "One Size", sizeClass: "S" as const, sortOrder: 99 },
  ].map((o) => prisma.sizeOption.create({ data: { ...o, sizeCategoryId: genericNumerical.id } }))
);

const genericAlphabetical = await prisma.sizeCategory.create({
  data: { sizeType: "Alphabetical" }, // brandSupplierId is null
});
const genericAlphabeticalOpts = await Promise.all(
  [
    { sizeName: "3XS", sizeClass: "S" as const, sortOrder: 1 },
    { sizeName: "2XS", sizeClass: "S" as const, sortOrder: 2 },
    { sizeName: "XS",  sizeClass: "S" as const, sortOrder: 3 },
    { sizeName: "S",   sizeClass: "S" as const, sortOrder: 4 },
    { sizeName: "M",   sizeClass: "S" as const, sortOrder: 5 },
    { sizeName: "L",   sizeClass: "S" as const, sortOrder: 6 },
    { sizeName: "XL",  sizeClass: "L" as const, sortOrder: 7 },
    { sizeName: "2XL", sizeClass: "L" as const, sortOrder: 8 },
    { sizeName: "One Size", sizeClass: "S" as const, sortOrder: 99 },
  ].map((o) => prisma.sizeOption.create({ data: { ...o, sizeCategoryId: genericAlphabetical.id } }))
);

// ===== SHANGHAI SCHOOL UNIFORMS =====
// Source: shanghai-uniforms.sg — serves Victoria, Tampines Pri, St Stephen's, Zhenghua

const shanghaiOneSize = await prisma.sizeCategory.create({
  data: { sizeType: "OneSize", brandSupplierId: supplierMap["Shanghai School Uniforms"] },
});
const shanghaiOneSizeOption = await prisma.sizeOption.create({
  data: { sizeName: "One Size", sizeClass: "S", sortOrder: 1, sizeCategoryId: shanghaiOneSize.id },
});

// Numerical: 12–24 (primary) + 26–54 even (secondary/adult) + MTM variants
const shanghaiNumerical = await prisma.sizeCategory.create({
  data: { sizeType: "Numerical", brandSupplierId: supplierMap["Shanghai School Uniforms"] },
});
const shanghaiNumericalOpts = await Promise.all(
  [
    // Non-MTM: bottom 21 of 28 = S (12–40), top 7 = L (42–54)
    // MTM: always L
    { sizeName: "12",    sizeClass: "S" as const, sortOrder: 1  },
    { sizeName: "13",    sizeClass: "S" as const, sortOrder: 2  },
    { sizeName: "14",    sizeClass: "S" as const, sortOrder: 3  },
    { sizeName: "15",    sizeClass: "S" as const, sortOrder: 4  },
    { sizeName: "16",    sizeClass: "S" as const, sortOrder: 5  },
    { sizeName: "17",    sizeClass: "S" as const, sortOrder: 6  },
    { sizeName: "18",    sizeClass: "S" as const, sortOrder: 7  },
    { sizeName: "19",    sizeClass: "S" as const, sortOrder: 8  },
    { sizeName: "20",    sizeClass: "S" as const, sortOrder: 9  },
    { sizeName: "21",    sizeClass: "S" as const, sortOrder: 10 },
    { sizeName: "22",    sizeClass: "S" as const, sortOrder: 11 },
    { sizeName: "22MTM", sizeClass: "L" as const, sortOrder: 12 },
    { sizeName: "23",    sizeClass: "S" as const, sortOrder: 13 },
    { sizeName: "23MTM", sizeClass: "L" as const, sortOrder: 14 },
    { sizeName: "24",    sizeClass: "S" as const, sortOrder: 15 },
    { sizeName: "24MTM", sizeClass: "L" as const, sortOrder: 16 },
    { sizeName: "26",    sizeClass: "S" as const, sortOrder: 17 },
    { sizeName: "28",    sizeClass: "S" as const, sortOrder: 18 },
    { sizeName: "30",    sizeClass: "S" as const, sortOrder: 19 },
    { sizeName: "32",    sizeClass: "S" as const, sortOrder: 20 },
    { sizeName: "34",    sizeClass: "S" as const, sortOrder: 21 },
    { sizeName: "36",    sizeClass: "S" as const, sortOrder: 22 },
    { sizeName: "38",    sizeClass: "S" as const, sortOrder: 23 },
    { sizeName: "38MTM", sizeClass: "L" as const, sortOrder: 24 },
    { sizeName: "40",    sizeClass: "S" as const, sortOrder: 25 },
    { sizeName: "40MTM", sizeClass: "L" as const, sortOrder: 26 },
    { sizeName: "42",    sizeClass: "L" as const, sortOrder: 27 },
    { sizeName: "42MTM", sizeClass: "L" as const, sortOrder: 28 },
    { sizeName: "44",    sizeClass: "L" as const, sortOrder: 29 },
    { sizeName: "44MTM", sizeClass: "L" as const, sortOrder: 30 },
    { sizeName: "46",    sizeClass: "L" as const, sortOrder: 31 },
    { sizeName: "46MTM", sizeClass: "L" as const, sortOrder: 32 },
    { sizeName: "48",    sizeClass: "L" as const, sortOrder: 33 },
    { sizeName: "48MTM", sizeClass: "L" as const, sortOrder: 34 },
    { sizeName: "50",    sizeClass: "L" as const, sortOrder: 35 },
    { sizeName: "50MTM", sizeClass: "L" as const, sortOrder: 36 },
    { sizeName: "52",    sizeClass: "L" as const, sortOrder: 37 },
    { sizeName: "52MTM", sizeClass: "L" as const, sortOrder: 38 },
    { sizeName: "54",    sizeClass: "L" as const, sortOrder: 39 },
    { sizeName: "54MTM", sizeClass: "L" as const, sortOrder: 40 },
    { sizeName: "One Size", sizeClass: "S" as const, sortOrder: 99 },
  ].map((o) => prisma.sizeOption.create({ data: { ...o, sizeCategoryId: shanghaiNumerical.id } }))
);

// Alphabetical: 13 sizes (hybrids interleaved by size)
// Bottom 10 = S, top 3 = L
const shanghaiAlphabetical = await prisma.sizeCategory.create({
  data: { sizeType: "Alphabetical", brandSupplierId: supplierMap["Shanghai School Uniforms"] },
});
const shanghaiAlphabeticalOpts = await Promise.all(
  [
    { sizeName: "3XS",   sizeClass: "S" as const, sortOrder: 1  },
    { sizeName: "2XS",   sizeClass: "S" as const, sortOrder: 2  },
    { sizeName: "24/XS", sizeClass: "S" as const, sortOrder: 3  },
    { sizeName: "XS",    sizeClass: "S" as const, sortOrder: 4  },
    { sizeName: "S",     sizeClass: "S" as const, sortOrder: 5  },
    { sizeName: "26/S",  sizeClass: "S" as const, sortOrder: 6  },
    { sizeName: "M",     sizeClass: "S" as const, sortOrder: 7  },
    { sizeName: "28/M",  sizeClass: "S" as const, sortOrder: 8  },
    { sizeName: "L",     sizeClass: "S" as const, sortOrder: 9  },
    { sizeName: "30/L",  sizeClass: "S" as const, sortOrder: 10 },
    { sizeName: "XL",    sizeClass: "L" as const, sortOrder: 11 },
    { sizeName: "2XL",   sizeClass: "L" as const, sortOrder: 12 },
    { sizeName: "3XL",   sizeClass: "L" as const, sortOrder: 13 },
    { sizeName: "One Size", sizeClass: "S" as const, sortOrder: 99 },
  ].map((o) => prisma.sizeOption.create({ data: { ...o, sizeCategoryId: shanghaiAlphabetical.id } }))
);

// ===== MY UNIFORM SHOP (ASIA) =====
// Source: schooluniforms.sg — serves Changkat Pri, St Patrick's

const musOneSize = await prisma.sizeCategory.create({
  data: { sizeType: "OneSize", brandSupplierId: supplierMap["My Uniform Shop (Asia)"] },
});
const musOneSizeOption = await prisma.sizeOption.create({
  data: { sizeName: "One Size", sizeClass: "S", sortOrder: 1, sizeCategoryId: musOneSize.id },
});

const musNumerical = await prisma.sizeCategory.create({
  data: { sizeType: "Numerical", brandSupplierId: supplierMap["My Uniform Shop (Asia)"] },
});
const musNumericalOpts = await Promise.all(
  [
    { sizeName: "7",  sizeClass: "S" as const, sortOrder: 1 },
    { sizeName: "8",  sizeClass: "S" as const, sortOrder: 2 },
    { sizeName: "9",  sizeClass: "S" as const, sortOrder: 3 },
    { sizeName: "10", sizeClass: "S" as const, sortOrder: 4 },
    { sizeName: "11", sizeClass: "S" as const, sortOrder: 5 },
    { sizeName: "12", sizeClass: "S" as const, sortOrder: 6 },
    { sizeName: "13", sizeClass: "S" as const, sortOrder: 7 },
    { sizeName: "14", sizeClass: "S" as const, sortOrder: 8 },
    { sizeName: "15", sizeClass: "S" as const, sortOrder: 9 },
    { sizeName: "20", sizeClass: "S" as const, sortOrder: 10 },
    { sizeName: "22", sizeClass: "S" as const, sortOrder: 11 },
    { sizeName: "24", sizeClass: "S" as const, sortOrder: 12 },
    { sizeName: "26", sizeClass: "S" as const, sortOrder: 13 },
    { sizeName: "28", sizeClass: "L" as const, sortOrder: 14 },
    { sizeName: "30", sizeClass: "L" as const, sortOrder: 15 },
    { sizeName: "32", sizeClass: "L" as const, sortOrder: 16 },
    { sizeName: "34", sizeClass: "L" as const, sortOrder: 17 },
    { sizeName: "One Size", sizeClass: "S" as const, sortOrder: 99 },
  ].map((o) => prisma.sizeOption.create({ data: { ...o, sizeCategoryId: musNumerical.id } }))
);

const musAlphabetical = await prisma.sizeCategory.create({
  data: { sizeType: "Alphabetical", brandSupplierId: supplierMap["My Uniform Shop (Asia)"] },
});
const musAlphabeticalOpts = await Promise.all(
  [
    { sizeName: "3XS", sizeClass: "S" as const, sortOrder: 1 },
    { sizeName: "2XS", sizeClass: "S" as const, sortOrder: 2 },
    { sizeName: "XS",  sizeClass: "S" as const, sortOrder: 3 },
    { sizeName: "S",   sizeClass: "S" as const, sortOrder: 4 },
    { sizeName: "M",   sizeClass: "S" as const, sortOrder: 5 },
    { sizeName: "L",   sizeClass: "S" as const, sortOrder: 6 },
    { sizeName: "XL",  sizeClass: "L" as const, sortOrder: 7 },
    { sizeName: "2XL", sizeClass: "L" as const, sortOrder: 8 },
    { sizeName: "One Size", sizeClass: "S" as const, sortOrder: 99 },
  ].map((o) => prisma.sizeOption.create({ data: { ...o, sizeCategoryId: musAlphabetical.id } }))
);

// ===== ASENCIO =====
// Serves Broadrick Sec, Beatty Sec, CHIJ Katong Convent

const asencioOneSize = await prisma.sizeCategory.create({
  data: { sizeType: "OneSize", brandSupplierId: supplierMap["Asencio"] },
});
const asencioOneSizeOption = await prisma.sizeOption.create({
  data: { sizeName: "One Size", sizeClass: "S", sortOrder: 1, sizeCategoryId: asencioOneSize.id },
});

const asencioNumerical = await prisma.sizeCategory.create({
  data: { sizeType: "Numerical", brandSupplierId: supplierMap["Asencio"] },
});
const asencioNumericalOpts = await Promise.all(
  [
    { sizeName: "7",  sizeClass: "S" as const, sortOrder: 1 },
    { sizeName: "8",  sizeClass: "S" as const, sortOrder: 2 },
    { sizeName: "9",  sizeClass: "S" as const, sortOrder: 3 },
    { sizeName: "10", sizeClass: "S" as const, sortOrder: 4 },
    { sizeName: "11", sizeClass: "S" as const, sortOrder: 5 },
    { sizeName: "12", sizeClass: "S" as const, sortOrder: 6 },
    { sizeName: "13", sizeClass: "S" as const, sortOrder: 7 },
    { sizeName: "14", sizeClass: "S" as const, sortOrder: 8 },
    { sizeName: "15", sizeClass: "S" as const, sortOrder: 9 },
    { sizeName: "20", sizeClass: "S" as const, sortOrder: 10 },
    { sizeName: "22", sizeClass: "S" as const, sortOrder: 11 },
    { sizeName: "24", sizeClass: "S" as const, sortOrder: 12 },
    { sizeName: "26", sizeClass: "S" as const, sortOrder: 13 },
    { sizeName: "28", sizeClass: "L" as const, sortOrder: 14 },
    { sizeName: "30", sizeClass: "L" as const, sortOrder: 15 },
    { sizeName: "32", sizeClass: "L" as const, sortOrder: 16 },
    { sizeName: "34", sizeClass: "L" as const, sortOrder: 17 },
    { sizeName: "One Size", sizeClass: "S" as const, sortOrder: 99 },
  ].map((o) => prisma.sizeOption.create({ data: { ...o, sizeCategoryId: asencioNumerical.id } }))
);

const asencioAlphabetical = await prisma.sizeCategory.create({
  data: { sizeType: "Alphabetical", brandSupplierId: supplierMap["Asencio"] },
});
const asencioAlphabeticalOpts = await Promise.all(
  [
    { sizeName: "3XS", sizeClass: "S" as const, sortOrder: 1 },
    { sizeName: "2XS", sizeClass: "S" as const, sortOrder: 2 },
    { sizeName: "XS",  sizeClass: "S" as const, sortOrder: 3 },
    { sizeName: "S",   sizeClass: "S" as const, sortOrder: 4 },
    { sizeName: "M",   sizeClass: "S" as const, sortOrder: 5 },
    { sizeName: "L",   sizeClass: "S" as const, sortOrder: 6 },
    { sizeName: "XL",  sizeClass: "L" as const, sortOrder: 7 },
    { sizeName: "2XL", sizeClass: "L" as const, sortOrder: 8 },
    { sizeName: "One Size", sizeClass: "S" as const, sortOrder: 99 },
  ].map((o) => prisma.sizeOption.create({ data: { ...o, sizeCategoryId: asencioAlphabetical.id } }))
);

// ===== KH UNIFORM (KAH HUAT) =====
// Serves Bukit Timah Pri, TMJC

const khOneSize = await prisma.sizeCategory.create({
  data: { sizeType: "OneSize", brandSupplierId: supplierMap["KH Uniform (Kah Huat)"] },
});
const khOneSizeOption = await prisma.sizeOption.create({
  data: { sizeName: "One Size", sizeClass: "S", sortOrder: 1, sizeCategoryId: khOneSize.id },
});

const khNumerical = await prisma.sizeCategory.create({
  data: { sizeType: "Numerical", brandSupplierId: supplierMap["KH Uniform (Kah Huat)"] },
});
const khNumericalOpts = await Promise.all(
  [
    { sizeName: "7",  sizeClass: "S" as const, sortOrder: 1 },
    { sizeName: "8",  sizeClass: "S" as const, sortOrder: 2 },
    { sizeName: "9",  sizeClass: "S" as const, sortOrder: 3 },
    { sizeName: "10", sizeClass: "S" as const, sortOrder: 4 },
    { sizeName: "11", sizeClass: "S" as const, sortOrder: 5 },
    { sizeName: "12", sizeClass: "S" as const, sortOrder: 6 },
    { sizeName: "13", sizeClass: "S" as const, sortOrder: 7 },
    { sizeName: "14", sizeClass: "S" as const, sortOrder: 8 },
    { sizeName: "15", sizeClass: "S" as const, sortOrder: 9 },
    { sizeName: "20", sizeClass: "S" as const, sortOrder: 10 },
    { sizeName: "22", sizeClass: "S" as const, sortOrder: 11 },
    { sizeName: "24", sizeClass: "S" as const, sortOrder: 12 },
    { sizeName: "26", sizeClass: "S" as const, sortOrder: 13 },
    { sizeName: "28", sizeClass: "L" as const, sortOrder: 14 },
    { sizeName: "30", sizeClass: "L" as const, sortOrder: 15 },
    { sizeName: "32", sizeClass: "L" as const, sortOrder: 16 },
    { sizeName: "34", sizeClass: "L" as const, sortOrder: 17 },
    { sizeName: "One Size", sizeClass: "S" as const, sortOrder: 99 },
  ].map((o) => prisma.sizeOption.create({ data: { ...o, sizeCategoryId: khNumerical.id } }))
);

const khAlphabetical = await prisma.sizeCategory.create({
  data: { sizeType: "Alphabetical", brandSupplierId: supplierMap["KH Uniform (Kah Huat)"] },
});
const khAlphabeticalOpts = await Promise.all(
  [
    { sizeName: "3XS", sizeClass: "S" as const, sortOrder: 1 },
    { sizeName: "2XS", sizeClass: "S" as const, sortOrder: 2 },
    { sizeName: "XS",  sizeClass: "S" as const, sortOrder: 3 },
    { sizeName: "S",   sizeClass: "S" as const, sortOrder: 4 },
    { sizeName: "M",   sizeClass: "S" as const, sortOrder: 5 },
    { sizeName: "L",   sizeClass: "S" as const, sortOrder: 6 },
    { sizeName: "XL",  sizeClass: "L" as const, sortOrder: 7 },
    { sizeName: "2XL", sizeClass: "L" as const, sortOrder: 8 },
    { sizeName: "One Size", sizeClass: "S" as const, sortOrder: 99 },
  ].map((o) => prisma.sizeOption.create({ data: { ...o, sizeCategoryId: khAlphabetical.id } }))
);

// ===== BIBI & BABA =====
// Serves National Junior College, Anglo-Chinese School (Primary)

const bibiOneSize = await prisma.sizeCategory.create({
  data: { sizeType: "OneSize", brandSupplierId: supplierMap["Bibi & Baba"] },
});
const bibiOneSizeOption = await prisma.sizeOption.create({
  data: { sizeName: "One Size", sizeClass: "S", sortOrder: 1, sizeCategoryId: bibiOneSize.id },
});

const bibiNumerical = await prisma.sizeCategory.create({
  data: { sizeType: "Numerical", brandSupplierId: supplierMap["Bibi & Baba"] },
});
const bibiNumericalOpts = await Promise.all(
  [
    { sizeName: "7",  sizeClass: "S" as const, sortOrder: 1 },
    { sizeName: "8",  sizeClass: "S" as const, sortOrder: 2 },
    { sizeName: "9",  sizeClass: "S" as const, sortOrder: 3 },
    { sizeName: "10", sizeClass: "S" as const, sortOrder: 4 },
    { sizeName: "11", sizeClass: "S" as const, sortOrder: 5 },
    { sizeName: "12", sizeClass: "S" as const, sortOrder: 6 },
    { sizeName: "13", sizeClass: "S" as const, sortOrder: 7 },
    { sizeName: "14", sizeClass: "S" as const, sortOrder: 8 },
    { sizeName: "15", sizeClass: "S" as const, sortOrder: 9 },
    { sizeName: "20", sizeClass: "S" as const, sortOrder: 10 },
    { sizeName: "22", sizeClass: "S" as const, sortOrder: 11 },
    { sizeName: "24", sizeClass: "S" as const, sortOrder: 12 },
    { sizeName: "26", sizeClass: "S" as const, sortOrder: 13 },
    { sizeName: "28", sizeClass: "L" as const, sortOrder: 14 },
    { sizeName: "30", sizeClass: "L" as const, sortOrder: 15 },
    { sizeName: "32", sizeClass: "L" as const, sortOrder: 16 },
    { sizeName: "34", sizeClass: "L" as const, sortOrder: 17 },
    { sizeName: "One Size", sizeClass: "S" as const, sortOrder: 99 },
  ].map((o) => prisma.sizeOption.create({ data: { ...o, sizeCategoryId: bibiNumerical.id } }))
);

const bibiAlphabetical = await prisma.sizeCategory.create({
  data: { sizeType: "Alphabetical", brandSupplierId: supplierMap["Bibi & Baba"] },
});
const bibiAlphabeticalOpts = await Promise.all(
  [
    { sizeName: "3XS", sizeClass: "S" as const, sortOrder: 1 },
    { sizeName: "2XS", sizeClass: "S" as const, sortOrder: 2 },
    { sizeName: "XS",  sizeClass: "S" as const, sortOrder: 3 },
    { sizeName: "S",   sizeClass: "S" as const, sortOrder: 4 },
    { sizeName: "M",   sizeClass: "S" as const, sortOrder: 5 },
    { sizeName: "L",   sizeClass: "S" as const, sortOrder: 6 },
    { sizeName: "XL",  sizeClass: "L" as const, sortOrder: 7 },
    { sizeName: "2XL", sizeClass: "L" as const, sortOrder: 8 },
    { sizeName: "One Size", sizeClass: "S" as const, sortOrder: 99 },
  ].map((o) => prisma.sizeOption.create({ data: { ...o, sizeCategoryId: bibiAlphabetical.id } }))
);

// ===== BEAU VOIX =====

const beauvoixOneSize = await prisma.sizeCategory.create({
  data: { sizeType: "OneSize", brandSupplierId: supplierMap["Beau Voix"] },
});
const beauvoixOneSizeOption = await prisma.sizeOption.create({
  data: { sizeName: "One Size", sizeClass: "S", sortOrder: 1, sizeCategoryId: beauvoixOneSize.id },
});

const beauvoixNumerical = await prisma.sizeCategory.create({
  data: { sizeType: "Numerical", brandSupplierId: supplierMap["Beau Voix"] },
});
const beauvoixNumericalOpts = await Promise.all(
  [
    { sizeName: "7",  sizeClass: "S" as const, sortOrder: 1 },
    { sizeName: "8",  sizeClass: "S" as const, sortOrder: 2 },
    { sizeName: "9",  sizeClass: "S" as const, sortOrder: 3 },
    { sizeName: "10", sizeClass: "S" as const, sortOrder: 4 },
    { sizeName: "11", sizeClass: "S" as const, sortOrder: 5 },
    { sizeName: "12", sizeClass: "S" as const, sortOrder: 6 },
    { sizeName: "13", sizeClass: "S" as const, sortOrder: 7 },
    { sizeName: "14", sizeClass: "S" as const, sortOrder: 8 },
    { sizeName: "15", sizeClass: "S" as const, sortOrder: 9 },
    { sizeName: "20", sizeClass: "S" as const, sortOrder: 10 },
    { sizeName: "22", sizeClass: "S" as const, sortOrder: 11 },
    { sizeName: "24", sizeClass: "S" as const, sortOrder: 12 },
    { sizeName: "26", sizeClass: "S" as const, sortOrder: 13 },
    { sizeName: "28", sizeClass: "L" as const, sortOrder: 14 },
    { sizeName: "30", sizeClass: "L" as const, sortOrder: 15 },
    { sizeName: "32", sizeClass: "L" as const, sortOrder: 16 },
    { sizeName: "34", sizeClass: "L" as const, sortOrder: 17 },
    { sizeName: "One Size", sizeClass: "S" as const, sortOrder: 99 },
  ].map((o) => prisma.sizeOption.create({ data: { ...o, sizeCategoryId: beauvoixNumerical.id } }))
);

const beauvoixAlphabetical = await prisma.sizeCategory.create({
  data: { sizeType: "Alphabetical", brandSupplierId: supplierMap["Beau Voix"] },
});
const beauvoixAlphabeticalOpts = await Promise.all(
  [
    { sizeName: "3XS", sizeClass: "S" as const, sortOrder: 1 },
    { sizeName: "2XS", sizeClass: "S" as const, sortOrder: 2 },
    { sizeName: "XS",  sizeClass: "S" as const, sortOrder: 3 },
    { sizeName: "S",   sizeClass: "S" as const, sortOrder: 4 },
    { sizeName: "M",   sizeClass: "S" as const, sortOrder: 5 },
    { sizeName: "L",   sizeClass: "S" as const, sortOrder: 6 },
    { sizeName: "XL",  sizeClass: "L" as const, sortOrder: 7 },
    { sizeName: "2XL", sizeClass: "L" as const, sortOrder: 8 },
    { sizeName: "One Size", sizeClass: "S" as const, sortOrder: 99 },
  ].map((o) => prisma.sizeOption.create({ data: { ...o, sizeCategoryId: beauvoixAlphabetical.id } }))
);

// ===== MAGDALENE SEWING CENTRE =====

const magdaleneOneSize = await prisma.sizeCategory.create({
  data: { sizeType: "OneSize", brandSupplierId: supplierMap["Magdalene Sewing Centre"] },
});
const magdaleneOneSizeOption = await prisma.sizeOption.create({
  data: { sizeName: "One Size", sizeClass: "S", sortOrder: 1, sizeCategoryId: magdaleneOneSize.id },
});

const magdaleneNumerical = await prisma.sizeCategory.create({
  data: { sizeType: "Numerical", brandSupplierId: supplierMap["Magdalene Sewing Centre"] },
});
const magdaleneNumericalOpts = await Promise.all(
  [
    { sizeName: "7",  sizeClass: "S" as const, sortOrder: 1 },
    { sizeName: "8",  sizeClass: "S" as const, sortOrder: 2 },
    { sizeName: "9",  sizeClass: "S" as const, sortOrder: 3 },
    { sizeName: "10", sizeClass: "S" as const, sortOrder: 4 },
    { sizeName: "11", sizeClass: "S" as const, sortOrder: 5 },
    { sizeName: "12", sizeClass: "S" as const, sortOrder: 6 },
    { sizeName: "13", sizeClass: "S" as const, sortOrder: 7 },
    { sizeName: "14", sizeClass: "S" as const, sortOrder: 8 },
    { sizeName: "15", sizeClass: "S" as const, sortOrder: 9 },
    { sizeName: "20", sizeClass: "S" as const, sortOrder: 10 },
    { sizeName: "22", sizeClass: "S" as const, sortOrder: 11 },
    { sizeName: "24", sizeClass: "S" as const, sortOrder: 12 },
    { sizeName: "26", sizeClass: "S" as const, sortOrder: 13 },
    { sizeName: "28", sizeClass: "L" as const, sortOrder: 14 },
    { sizeName: "30", sizeClass: "L" as const, sortOrder: 15 },
    { sizeName: "32", sizeClass: "L" as const, sortOrder: 16 },
    { sizeName: "34", sizeClass: "L" as const, sortOrder: 17 },
    { sizeName: "One Size", sizeClass: "S" as const, sortOrder: 99 },
  ].map((o) => prisma.sizeOption.create({ data: { ...o, sizeCategoryId: magdaleneNumerical.id } }))
);

const magdaleneAlphabetical = await prisma.sizeCategory.create({
  data: { sizeType: "Alphabetical", brandSupplierId: supplierMap["Magdalene Sewing Centre"] },
});
const magdaleneAlphabeticalOpts = await Promise.all(
  [
    { sizeName: "3XS", sizeClass: "S" as const, sortOrder: 1 },
    { sizeName: "2XS", sizeClass: "S" as const, sortOrder: 2 },
    { sizeName: "XS",  sizeClass: "S" as const, sortOrder: 3 },
    { sizeName: "S",   sizeClass: "S" as const, sortOrder: 4 },
    { sizeName: "M",   sizeClass: "S" as const, sortOrder: 5 },
    { sizeName: "L",   sizeClass: "S" as const, sortOrder: 6 },
    { sizeName: "XL",  sizeClass: "L" as const, sortOrder: 7 },
    { sizeName: "2XL", sizeClass: "L" as const, sortOrder: 8 },
    { sizeName: "One Size", sizeClass: "S" as const, sortOrder: 99 },
  ].map((o) => prisma.sizeOption.create({ data: { ...o, sizeCategoryId: magdaleneAlphabetical.id } }))
);

console.log("   Created 24 size categories (8 suppliers × 3 types each).");

// ---------- SCHOOL-SUPPLIER MAPPING ----------
const schoolSupplierMapping: Record<string, string> = {
  "VICTORIA SCHOOL": "Shanghai School Uniforms",
  "BROADRICK SECONDARY SCHOOL": "Asencio",
  "TAMPINES PRIMARY SCHOOL": "Shanghai School Uniforms",
  "ST. STEPHEN'S SCHOOL": "Shanghai School Uniforms",
  "BEATTY SECONDARY SCHOOL": "Asencio",
  "CHIJ KATONG CONVENT": "Asencio",
  "NATIONAL JUNIOR COLLEGE": "Bibi & Baba",
  "CHANGKAT PRIMARY SCHOOL": "My Uniform Shop (Asia)",
  "ST. PATRICK'S SCHOOL": "My Uniform Shop (Asia)",
  "BUKIT TIMAH PRIMARY SCHOOL": "KH Uniform (Kah Huat)",
  "TAMPINES MERIDIAN JUNIOR COLLEGE": "KH Uniform (Kah Huat)",
  "ANGLO-CHINESE SCHOOL (PRIMARY)": "Bibi & Baba",
  "ZHENGHUA PRIMARY SCHOOL": "Shanghai School Uniforms",
};

// ---------- SIZE CATEGORY LOOKUP MAPS ----------
// Maps supplier name -> { oneSize, numerical, alphabetical } category IDs
const supplierSizeCategories: Record<string, { oneSize: number; numerical: number; alphabetical: number }> = {
  "Shanghai School Uniforms": {
    oneSize: shanghaiOneSize.id,
    numerical: shanghaiNumerical.id,
    alphabetical: shanghaiAlphabetical.id,
  },
  "My Uniform Shop (Asia)": {
    oneSize: musOneSize.id,
    numerical: musNumerical.id,
    alphabetical: musAlphabetical.id,
  },
  "Asencio": {
    oneSize: asencioOneSize.id,
    numerical: asencioNumerical.id,
    alphabetical: asencioAlphabetical.id,
  },
  "KH Uniform (Kah Huat)": {
    oneSize: khOneSize.id,
    numerical: khNumerical.id,
    alphabetical: khAlphabetical.id,
  },
  "Bibi & Baba": {
    oneSize: bibiOneSize.id,
    numerical: bibiNumerical.id,
    alphabetical: bibiAlphabetical.id,
  },
  "Beau Voix": {
    oneSize: beauvoixOneSize.id,
    numerical: beauvoixNumerical.id,
    alphabetical: beauvoixAlphabetical.id,
  },
  "Magdalene Sewing Centre": {
    oneSize: magdaleneOneSize.id,
    numerical: magdaleneNumerical.id,
    alphabetical: magdaleneAlphabetical.id,
  },
};

// ---------- SIZE CATEGORY HELPER FUNCTIONS ----------

/**
 * Determines whether an item category should use Alphabetical sizing for a given supplier.
 * Returns true for Alphabetical, false for Numerical.
 * 
 * Rules:
 * - Shanghai School Uniforms: only gym_shorts → Alphabetical
 * - My Uniform Shop (Asia): polo_shirt, pe_shirt, house_shirt, pe_shorts, uniform_skirt, skort → Alphabetical
 * - All other suppliers (default): pe_shirt, pe_shorts, house_shirt, gym_shorts → Alphabetical
 */
function shouldUseAlphabetical(supplier: string | undefined, categoryName: string): boolean {
  const catLower = categoryName.toLowerCase();

  // Shanghai: only gym_shorts uses Alphabetical
  if (supplier === "Shanghai School Uniforms") {
    return catLower === "gym_shorts";
  }

  // My Uniform Shop: PE items + skirt/skort use Alphabetical
  if (supplier === "My Uniform Shop (Asia)") {
    return ["polo_shirt", "pe_shirt", "house_shirt", "pe_shorts", "uniform_skirt", "skort"].includes(catLower);
  }

  // Default for other suppliers: PE items use Alphabetical
  const peItems = ["pe_shirt", "pe_shorts", "house_shirt", "gym_shorts"];
  return peItems.includes(catLower);
}

/**
 * Gets the appropriate SizeCategory ID for a given school and item category.
 * Uses the school-supplier mapping to determine which supplier's size categories to use.
 * 
 * @param schoolName - The school name (case-insensitive)
 * @param categoryName - The item category name (matches Category.categoryName)
 * @returns The SizeCategory ID to use for this item type
 */
function getSizeCategoryForItem(schoolName: string, categoryName: string): number {
  const catLower = categoryName.toLowerCase();

  // Accessories always use OneSize
  if (["tie", "belt", "cap"].includes(catLower)) {
    const supplier = schoolSupplierMapping[schoolName.toUpperCase()];
    if (supplier && supplierSizeCategories[supplier]) {
      return supplierSizeCategories[supplier].oneSize;
    }
    return genericOneSize.id;
  }

  // Get supplier for this school
  const supplier = schoolSupplierMapping[schoolName.toUpperCase()];

  // If no supplier mapping, use generic categories
  if (!supplier || !supplierSizeCategories[supplier]) {
    if (shouldUseAlphabetical(undefined, categoryName)) {
      return genericAlphabetical.id;
    }
    return genericNumerical.id;
  }

  // Return supplier-specific category based on item type
  const categories = supplierSizeCategories[supplier];
  if (shouldUseAlphabetical(supplier, categoryName)) {
    return categories.alphabetical;
  }
  return categories.numerical;
}

/**
 * Gets a default/middle size option for a given size category.
 * Useful for seeding sample inventory data.
 * 
 * @param sizeCategoryId - The SizeCategory ID
 * @returns A SizeOption ID from the middle of the range
 */
function getDefaultSizeOption(sizeCategoryId: number): number {
  const midpointMap: Record<number, number> = {
    // Generic
    [genericOneSize.id]: genericOneSizeOption.id,
    [genericNumerical.id]: genericNumericalOpts[8].id,       // "15"
    [genericAlphabetical.id]: genericAlphabeticalOpts[4].id, // "M"
    // Shanghai
    [shanghaiOneSize.id]: shanghaiOneSizeOption.id,
    [shanghaiNumerical.id]: shanghaiNumericalOpts[8].id,     // "20"
    [shanghaiAlphabetical.id]: shanghaiAlphabeticalOpts[6].id, // "M"
    // My Uniform Shop
    [musOneSize.id]: musOneSizeOption.id,
    [musNumerical.id]: musNumericalOpts[8].id,               // "15"
    [musAlphabetical.id]: musAlphabeticalOpts[4].id,         // "M"
    // Asencio
    [asencioOneSize.id]: asencioOneSizeOption.id,
    [asencioNumerical.id]: asencioNumericalOpts[8].id,       // "15"
    [asencioAlphabetical.id]: asencioAlphabeticalOpts[4].id, // "M"
    // KH Uniform
    [khOneSize.id]: khOneSizeOption.id,
    [khNumerical.id]: khNumericalOpts[8].id,                 // "15"
    [khAlphabetical.id]: khAlphabeticalOpts[4].id,           // "M"
    // Bibi & Baba
    [bibiOneSize.id]: bibiOneSizeOption.id,
    [bibiNumerical.id]: bibiNumericalOpts[8].id,             // "15"
    [bibiAlphabetical.id]: bibiAlphabeticalOpts[4].id,       // "M"
    // Beau Voix
    [beauvoixOneSize.id]: beauvoixOneSizeOption.id,
    [beauvoixNumerical.id]: beauvoixNumericalOpts[8].id,     // "15"
    [beauvoixAlphabetical.id]: beauvoixAlphabeticalOpts[4].id, // "M"
    // Magdalene
    [magdaleneOneSize.id]: magdaleneOneSizeOption.id,
    [magdaleneNumerical.id]: magdaleneNumericalOpts[8].id,   // "15"
    [magdaleneAlphabetical.id]: magdaleneAlphabeticalOpts[4].id, // "M"
  };
  return midpointMap[sizeCategoryId] ?? genericOneSizeOption.id;
}
  // -------------------- USERS --------------------
  console.log("👤 Seeding users...");
const users = await Promise.all([
  // ===== ADMIN =====
  prisma.user.create({
    data: {
      cognitoSub: "19ea65fc-70a1-70d4-a0e3-2d031b7ebefa",
      email: "Admin@tcc.org.sg",
      firstName: "TCC",
      lastName: "Admin",
      fullName: "TCC Admin",
      role: "Admin",
      schoolId: null,
    },
  }),

    prisma.user.create({
    data: {
      cognitoSub: "592a05dc-c081-7088-24f7-ea8e6adcaf0d",
      email: "hansen.lim.2022@smu.edu.sg",
      firstName: "Hansen",
      lastName: "Lim",
      fullName: "Hansen Lim",
      role: "Admin",
      schoolId: null,
    },
  }),

  // ===== SCHOOL STAFF (1 per school) =====
  prisma.user.create({
    data: {
      cognitoSub: "b90ad5dc-60d1-7050-c3d7-67d2bffc986c",
      email: "staff@changkatpri.moe.edu.sg",
      firstName: "John",
      lastName: "Lim",
      fullName: "John Lim",
      role: "SchoolStaff",
      schoolId: schoolMap["CHANGKAT PRIMARY SCHOOL"],
    },
  }),
  prisma.user.create({
    data: {
      cognitoSub: "59fae5fc-8031-7097-7630-e09b668d63d8",
      email: "staff@acspri.moe.edu.sg",
      firstName: "Sarah",
      lastName: "Tan",
      fullName: "Sarah Tan",
      role: "SchoolStaff",
      schoolId: schoolMap["ANGLO-CHINESE SCHOOL (PRIMARY)"],
    },
  }),
  prisma.user.create({
    data: {
      cognitoSub: "998a55bc-00b1-7089-3050-f78016c186b3",
      email: "staff@bukittimahpri.moe.edu.sg",
      firstName: "Wei Ming",
      lastName: "Chen",
      fullName: "Wei Ming Chen",
      role: "SchoolStaff",
      schoolId: schoolMap["BUKIT TIMAH PRIMARY SCHOOL"],
    },
  }),
  prisma.user.create({
    data: {
      cognitoSub: "496a75ac-a011-70d9-32f1-c6c98b0dbb2b",
      email: "staff@zhenghuapri.moe.edu.sg",
      firstName: "Priya",
      lastName: "Nair",
      fullName: "Priya Nair",
      role: "SchoolStaff",
      schoolId: schoolMap["ZHENGHUA PRIMARY SCHOOL"],
    },
  }),
  prisma.user.create({
    data: {
      cognitoSub: "f9cae54c-f061-70f4-da2f-03781a4adf56",
      email: "staff@stpatricks.moe.edu.sg",
      firstName: "Ahmad",
      lastName: "Ibrahim",
      fullName: "Ahmad Ibrahim",
      role: "SchoolStaff",
      schoolId: schoolMap["ST. PATRICK'S SCHOOL"],
    },
  }),
  prisma.user.create({
    data: {
      cognitoSub: "492aa59c-1001-7027-1486-4907abb1b267",
      email: "staff@victoria.moe.edu.sg",
      firstName: "David",
      lastName: "Koh",
      fullName: "David Koh",
      role: "SchoolStaff",
      schoolId: schoolMap["VICTORIA SCHOOL"],
    },
  }),
  prisma.user.create({
    data: {
      cognitoSub: "a96a353c-8071-70ff-2c55-f7418384dea0",
      email: "staff@beattysec.moe.edu.sg",
      firstName: "Mei Ling",
      lastName: "Ong",
      fullName: "Mei Ling Ong",
      role: "SchoolStaff",
      schoolId: schoolMap["BEATTY SECONDARY SCHOOL"],
    },
  }),
  prisma.user.create({
    data: {
      cognitoSub: "a92ab56c-3031-703f-d783-0ab5d9c1fe1d",
      email: "staff@tmjc.moe.edu.sg",
      firstName: "Rajesh",
      lastName: "Kumar",
      fullName: "Rajesh Kumar",
      role: "SchoolStaff",
      schoolId: schoolMap["TAMPINES MERIDIAN JUNIOR COLLEGE"],
    },
  }),
  prisma.user.create({
    data: {
      cognitoSub: "09ea257c-7081-70f9-fd61-7dcaafea947b",
      email: "staff@njc.moe.edu.sg",
      firstName: "Hui Wen",
      lastName: "Lee",
      fullName: "Hui Wen Lee",
      role: "SchoolStaff",
      schoolId: schoolMap["NATIONAL JUNIOR COLLEGE"],
    },
  }),
  prisma.user.create({
    data: {
      cognitoSub: "09ca25ec-d011-700a-09c6-43d8fd09cb17",
      email: "staff@broadricksec.moe.edu.sg",
      firstName: "Faizal",
      lastName: "Rahman",
      fullName: "Faizal Rahman",
      role: "SchoolStaff",
      schoolId: schoolMap["BROADRICK SECONDARY SCHOOL"],
    },
  }),
  prisma.user.create({
    data: {
      cognitoSub: "49dac58c-f061-70f8-c0bf-79296b0b28ef",
      email: "staff@tampinespri.moe.edu.sg",
      firstName: "Siti",
      lastName: "Aminah",
      fullName: "Siti Aminah",
      role: "SchoolStaff",
      schoolId: schoolMap["TAMPINES PRIMARY SCHOOL"],
    },
  }),
  prisma.user.create({
    data: {
      cognitoSub: "b9aaf58c-9071-7061-ea93-0c467f0c0e4d",
      email: "staff@ststephenspri.moe.edu.sg",
      firstName: "Daniel",
      lastName: "Teo",
      fullName: "Daniel Teo",
      role: "SchoolStaff",
      schoolId: schoolMap["ST. STEPHEN'S SCHOOL"],
    },
  }),
  prisma.user.create({
    data: {
      cognitoSub: "897a55bc-80b1-7002-e9d5-5b521ac761aa",
      email: "staff@chijkatong.moe.edu.sg",
      firstName: "Grace",
      lastName: "Ng",
      fullName: "Grace Ng",
      role: "SchoolStaff",
      schoolId: schoolMap["CHIJ KATONG CONVENT"],
    },
  }),

  // ===== PSG VOLUNTEERS (1 per school) =====
  prisma.user.create({
    data: {
      cognitoSub: "395af56c-8091-70fe-0e74-8a95e936259e",
      email: "volunteer.changkat@gmail.com",
      firstName: "Rachel",
      lastName: "Wong",
      fullName: "Rachel Wong",
      role: "PsgVolunteer",
      schoolId: schoolMap["CHANGKAT PRIMARY SCHOOL"],
    },
  }),
  prisma.user.create({
    data: {
      cognitoSub: "299ac5fc-c011-70ea-0348-2f1ad236185c",
      email: "volunteer.acs@gmail.com",
      firstName: "Mary",
      lastName: "Goh",
      fullName: "Mary Goh",
      role: "PsgVolunteer",
      schoolId: schoolMap["ANGLO-CHINESE SCHOOL (PRIMARY)"],
    },
  }),
  prisma.user.create({
    data: {
      cognitoSub: "695a35fc-00a1-70bb-6db3-940f67c48aec",
      email: "volunteer.bukittimah@gmail.com",
      firstName: "Linda",
      lastName: "Chua",
      fullName: "Linda Chua",
      role: "PsgVolunteer",
      schoolId: schoolMap["BUKIT TIMAH PRIMARY SCHOOL"],
    },
  }),
  prisma.user.create({
    data: {
      cognitoSub: "c93a35fc-3011-70df-0489-784531dc3a9f",
      email: "volunteer.zhenghua@gmail.com",
      firstName: "Jenny",
      lastName: "Yeo",
      fullName: "Jenny Yeo",
      role: "PsgVolunteer",
      schoolId: schoolMap["ZHENGHUA PRIMARY SCHOOL"],
    },
  }),
  prisma.user.create({
    data: {
      cognitoSub: "79ba65dc-80f1-70bc-9d3d-c5b59aa12786",
      email: "volunteer.stpatricks@gmail.com",
      firstName: "Nurul",
      lastName: "Hassan",
      fullName: "Nurul Hassan",
      role: "PsgVolunteer",
      schoolId: schoolMap["ST. PATRICK'S SCHOOL"],
    },
  }),
  prisma.user.create({
    data: {
      cognitoSub: "59da754c-80d1-7089-62e6-137cb810c1a0",
      email: "volunteer.victoria@gmail.com",
      firstName: "Karen",
      lastName: "Sim",
      fullName: "Karen Sim",
      role: "PsgVolunteer",
      schoolId: schoolMap["VICTORIA SCHOOL"],
    },
  }),
  prisma.user.create({
    data: {
      cognitoSub: "89aa05cc-f041-70fe-c810-7568f8793551",
      email: "volunteer.beatty@gmail.com",
      firstName: "Deepa",
      lastName: "Menon",
      fullName: "Deepa Menon",
      role: "PsgVolunteer",
      schoolId: schoolMap["BEATTY SECONDARY SCHOOL"],
    },
  }),
  prisma.user.create({
    data: {
      cognitoSub: "19dac57c-5041-70a8-37a6-8a74547bd261",
      email: "volunteer.tmjc@gmail.com",
      firstName: "Michelle",
      lastName: "Lau",
      fullName: "Michelle Lau",
      role: "PsgVolunteer",
      schoolId: schoolMap["TAMPINES MERIDIAN JUNIOR COLLEGE"],
    },
  }),
  prisma.user.create({
    data: {
      cognitoSub: "a98a95ec-8061-7065-2791-d54c24414a48",
      email: "volunteer.njc@gmail.com",
      firstName: "Aishah",
      lastName: "Binte Yusof",
      fullName: "Aishah Binte Yusof",
      role: "PsgVolunteer",
      schoolId: schoolMap["NATIONAL JUNIOR COLLEGE"],
    },
  }),
  prisma.user.create({
    data: {
      cognitoSub: "29ba85fc-f051-7031-9bd1-081f58315d70",
      email: "volunteer.broadrick@gmail.com",
      firstName: "Christine",
      lastName: "Ho",
      fullName: "Christine Ho",
      role: "PsgVolunteer",
      schoolId: schoolMap["BROADRICK SECONDARY SCHOOL"],
    },
  }),
  prisma.user.create({
    data: {
      cognitoSub: "39fac52c-3021-701f-e0fc-462c7a0468d3",
      email: "volunteer.tampinespri@gmail.com",
      firstName: "Kavitha",
      lastName: "Pillai",
      fullName: "Kavitha Pillai",
      role: "PsgVolunteer",
      schoolId: schoolMap["TAMPINES PRIMARY SCHOOL"],
    },
  }),
  prisma.user.create({
    data: {
      cognitoSub: "097a852c-d001-7036-10e3-5264107fb536",
      email: "volunteer.ststephens@gmail.com",
      firstName: "Susan",
      lastName: "Pang",
      fullName: "Susan Pang",
      role: "PsgVolunteer",
      schoolId: schoolMap["ST. STEPHEN'S SCHOOL"],
    },
  }),
  prisma.user.create({
    data: {
      cognitoSub: "19aa458c-a011-7045-91d9-11706a60e121",
      email: "volunteer.chijkatong@gmail.com",
      firstName: "Jasmine",
      lastName: "Tay",
      fullName: "Jasmine Tay",
      role: "PsgVolunteer",
      schoolId: schoolMap["CHIJ KATONG CONVENT"],
    },
  }),
]);

  const AdminUser = users[0];
  const HansenAdmin = users[1];

  // Staff (starting at index 2)
  const changkatStaff = users[2];
  const acsStaff = users[3];
  const bukitTimahStaff = users[4];
  const zhenghuaStaff = users[5];
  const stPatricksStaff = users[6];
  const victoriaStaff = users[7];
  const beattyStaff = users[8];
  const tmjcStaff = users[9];
  const njcStaff = users[10];
  const broadrickStaff = users[11];
  const tampinesPriStaff = users[12];
  const stStephensStaff = users[13];
  const chijKatongStaff = users[14];

  // PSG Volunteers (starting at index 15)
  const changkatVolunteer = users[15];
  const acsVolunteer = users[16];
  const bukitTimahVolunteer = users[17];
  const zhenghuaVolunteer = users[18];
  const stPatricksVolunteer = users[19];
  const victoriaVolunteer = users[20];
  const beattyVolunteer = users[21];
  const tmjcVolunteer = users[22];
  const njcVolunteer = users[23];
  const broadrickVolunteer = users[24];
  const tampinesPriVolunteer = users[25];
  const stStephensVolunteer = users[26];
  const chijKatongVolunteer = users[27];
  console.log(`   Created ${users.length} users.`);

// -------------------- SCHOOL PARTNERSHIPS --------------------
  console.log("🤝 Seeding school partnerships...");
  const partnershipRaw = [
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["ADMIRALTY SECONDARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["AI TONG SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["ANDERSON SERANGOON JUNIOR COLLEGE"] },
      { activityName: "Survey", yearConducted: 2024, schoolId: schoolMap["ANDERSON SERANGOON JUNIOR COLLEGE"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["ANG MO KIO PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["ANGLO-CHINESE SCHOOL (PRIMARY)"] },
      { activityName: "Go Green SG", yearConducted: 2024, schoolId: schoolMap["ANGLO-CHINESE SCHOOL (PRIMARY)"] },
      { activityName: "Learning Programme (Students)", yearConducted: 2024, schoolId: schoolMap["ANGLO-CHINESE SCHOOL (PRIMARY)"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2024, schoolId: schoolMap["ANGLO-CHINESE SCHOOL (PRIMARY)"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2025, schoolId: schoolMap["ANGLO-CHINESE SCHOOL (PRIMARY)"] },
      { activityName: "Uniform Exhibition", yearConducted: 2024, schoolId: schoolMap["ANGLO-CHINESE SCHOOL (PRIMARY)"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["ANGSANA PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["BARTLEY SECONDARY SCHOOL"] },
      { activityName: "Go Green SG", yearConducted: 2025, schoolId: schoolMap["BEATTY SECONDARY SCHOOL"] },
      { activityName: "Learning Programme (Students)", yearConducted: 2025, schoolId: schoolMap["BEATTY SECONDARY SCHOOL"] },
      { activityName: "Learning Programme (Students)", yearConducted: 2026, schoolId: schoolMap["BEATTY SECONDARY SCHOOL"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2025, schoolId: schoolMap["BEATTY SECONDARY SCHOOL"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2026, schoolId: schoolMap["BEATTY SECONDARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["BEDOK GREEN SECONDARY SCHOOL"] },
      { activityName: "Learning Programme (Students)", yearConducted: 2024, schoolId: schoolMap["BENDEMEER PRIMARY SCHOOL"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2024, schoolId: schoolMap["BENDEMEER PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["BUKIT PANJANG PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["BUKIT TIMAH PRIMARY SCHOOL"] },
      { activityName: "Infobooth/Awareness Talk", yearConducted: 2025, schoolId: schoolMap["BUKIT TIMAH PRIMARY SCHOOL"] },
      { activityName: "Learning Programme (Students)", yearConducted: 2025, schoolId: schoolMap["BUKIT TIMAH PRIMARY SCHOOL"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2025, schoolId: schoolMap["BUKIT TIMAH PRIMARY SCHOOL"] },
      { activityName: "Uniform Exhibition", yearConducted: 2025, schoolId: schoolMap["BUKIT TIMAH PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["CANBERRA PRIMARY SCHOOL"] },
      { activityName: "Survey", yearConducted: 2023, schoolId: schoolMap["CANBERRA PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["CASUARINA PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["CEDAR GIRLS' SECONDARY SCHOOL"] },
      { activityName: "Infobooth/Awareness Talk", yearConducted: 2024, schoolId: schoolMap["CEDAR GIRLS' SECONDARY SCHOOL"] },
      { activityName: "Survey", yearConducted: 2023, schoolId: schoolMap["CEDAR GIRLS' SECONDARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["CHANGKAT CHANGI SECONDARY SCHOOL"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2024, schoolId: schoolMap["CHANGKAT CHANGI SECONDARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["CHANGKAT PRIMARY SCHOOL"] },
      { activityName: "Go Green SG", yearConducted: 2023, schoolId: schoolMap["CHANGKAT PRIMARY SCHOOL"] },
      { activityName: "Go Green SG", yearConducted: 2025, schoolId: schoolMap["CHANGKAT PRIMARY SCHOOL"] },
      { activityName: "Infobooth/Awareness Talk", yearConducted: 2025, schoolId: schoolMap["CHANGKAT PRIMARY SCHOOL"] },
      { activityName: "Learning Programme (Students)", yearConducted: 2023, schoolId: schoolMap["CHANGKAT PRIMARY SCHOOL"] },
      { activityName: "Learning Programme (Students)", yearConducted: 2025, schoolId: schoolMap["CHANGKAT PRIMARY SCHOOL"] },
      { activityName: "PSG Session/Workshop", yearConducted: 2023, schoolId: schoolMap["CHANGKAT PRIMARY SCHOOL"] },
      { activityName: "PSG Session/Workshop", yearConducted: 2024, schoolId: schoolMap["CHANGKAT PRIMARY SCHOOL"] },
      { activityName: "Survey", yearConducted: 2023, schoolId: schoolMap["CHANGKAT PRIMARY SCHOOL"] },
      { activityName: "Survey", yearConducted: 2024, schoolId: schoolMap["CHANGKAT PRIMARY SCHOOL"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2023, schoolId: schoolMap["CHANGKAT PRIMARY SCHOOL"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2024, schoolId: schoolMap["CHANGKAT PRIMARY SCHOOL"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2025, schoolId: schoolMap["CHANGKAT PRIMARY SCHOOL"] },
      { activityName: "Uniform Exhibition", yearConducted: 2024, schoolId: schoolMap["CHANGKAT PRIMARY SCHOOL"] },
      { activityName: "Uniform Exhibition", yearConducted: 2025, schoolId: schoolMap["CHANGKAT PRIMARY SCHOOL"] },
      { activityName: "Uniform Exhibition", yearConducted: 2026, schoolId: schoolMap["CHANGKAT PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["CHIJ KATONG CONVENT"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["CHONGZHENG PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["CHUA CHU KANG PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["CHUNG CHENG HIGH SCHOOL (MAIN)"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["CHUNG CHENG HIGH SCHOOL (YISHUN)"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["COMMONWEALTH SECONDARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["COMPASSVALE PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["CRESCENT GIRLS' SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["DAMAI SECONDARY SCHOOL"] },
      { activityName: "Infobooth/Awareness Talk", yearConducted: 2024, schoolId: schoolMap["DUNMAN HIGH SCHOOL"] },
      { activityName: "Uniform Exhibition", yearConducted: 2024, schoolId: schoolMap["DUNMAN HIGH SCHOOL"] },
      { activityName: "Survey", yearConducted: 2023, schoolId: schoolMap["EAST SPRING PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["ELIAS PARK PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["EVERGREEN PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["EVERGREEN SECONDARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["FAIRFIELD METHODIST SCHOOL (SECONDARY)"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["FUHUA PRIMARY SCHOOL"] },
      { activityName: "Survey", yearConducted: 2024, schoolId: schoolMap["GAN ENG SENG PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["GEYLANG METHODIST SCHOOL (SECONDARY)"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["GONGSHANG PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["GREENDALE PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["GREENWOOD PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["HOLY INNOCENTS' HIGH SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["HOLY INNOCENTS' PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["HONG WEN SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["HOUGANG PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["HUA YI SECONDARY SCHOOL"] },
      { activityName: "Survey", yearConducted: 2024, schoolId: schoolMap["HUA YI SECONDARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["JUNYUAN PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["JURONG PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["KEMING PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["KONG HWA SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["KRANJI PRIMARY SCHOOL"] },
      { activityName: "Staff Session/Workshop", yearConducted: 2025, schoolId: schoolMap["KUO CHUAN PRESBYTERIAN SECONDARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["LAKESIDE PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["LOYANG VIEW SECONDARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["MAHA BODHI SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["MERIDIAN PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["NAN CHIAU PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["NANYANG GIRLS' HIGH SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["NANYANG JUNIOR COLLEGE"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["NANYANG PRIMARY SCHOOL"] },
      { activityName: "Go Green SG", yearConducted: 2024, schoolId: schoolMap["NATIONAL JUNIOR COLLEGE"] },
      { activityName: "Learning Programme (Students)", yearConducted: 2024, schoolId: schoolMap["NATIONAL JUNIOR COLLEGE"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2024, schoolId: schoolMap["NATIONAL JUNIOR COLLEGE"] },
      { activityName: "Uniform Exhibition", yearConducted: 2024, schoolId: schoolMap["NATIONAL JUNIOR COLLEGE"] },
      { activityName: "Survey", yearConducted: 2024, schoolId: schoolMap["NAVAL BASE PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["NORTH SPRING PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["NORTH VIEW PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["NORTHOAKS PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["NORTHSHORE PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["OPERA ESTATE PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["ORCHID PARK SECONDARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["PASIR RIS SECONDARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["PEI CHUN PUBLIC SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["POI CHING SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["PRESBYTERIAN HIGH SCHOOL"] },
      { activityName: "Survey", yearConducted: 2024, schoolId: schoolMap["PRINCESS ELIZABETH PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["PUNGGOL COVE PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["PUNGGOL PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["QIFA PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["QUEENSTOWN PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["RIVER VALLEY PRIMARY SCHOOL"] },
      { activityName: "Go Green SG", yearConducted: 2024, schoolId: schoolMap["RIVER VALLEY PRIMARY SCHOOL"] },
      { activityName: "Infobooth/Awareness Talk", yearConducted: 2025, schoolId: schoolMap["RIVER VALLEY PRIMARY SCHOOL"] },
      { activityName: "Learning Programme (Students)", yearConducted: 2024, schoolId: schoolMap["RIVER VALLEY PRIMARY SCHOOL"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2024, schoolId: schoolMap["RIVER VALLEY PRIMARY SCHOOL"] },
      { activityName: "Uniform Exhibition", yearConducted: 2024, schoolId: schoolMap["RIVER VALLEY PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["ROSYTH SCHOOL"] },
      { activityName: "Survey", yearConducted: 2024, schoolId: schoolMap["ROSYTH SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["SEMBAWANG PRIMARY SCHOOL"] },
      { activityName: "Survey", yearConducted: 2024, schoolId: schoolMap["SEMBAWANG PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["SOUTH VIEW PRIMARY SCHOOL"] },
      { activityName: "Survey", yearConducted: 2024, schoolId: schoolMap["ST ANDREW'S SCHOOL (JUNIOR)"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["ST. JOSEPH'S INSTITUTION"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["ST. MARGARET'S SCHOOL (SECONDARY)"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["ST. PATRICK'S SCHOOL"] },
      { activityName: "Learning Programme (Students)", yearConducted: 2025, schoolId: schoolMap["ST. PATRICK'S SCHOOL"] },
      { activityName: "Learning Programme (Students)", yearConducted: 2026, schoolId: schoolMap["ST. PATRICK'S SCHOOL"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2023, schoolId: schoolMap["ST. PATRICK'S SCHOOL"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2024, schoolId: schoolMap["ST. PATRICK'S SCHOOL"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2025, schoolId: schoolMap["ST. PATRICK'S SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["ST. STEPHEN'S SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["ST. HILDA'S PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["TAMPINES MERIDIAN JUNIOR COLLEGE"] },
      { activityName: "Go Green SG", yearConducted: 2024, schoolId: schoolMap["TAMPINES MERIDIAN JUNIOR COLLEGE"] },
      { activityName: "Go Green SG", yearConducted: 2025, schoolId: schoolMap["TAMPINES MERIDIAN JUNIOR COLLEGE"] },
      { activityName: "Learning Programme (Students)", yearConducted: 2024, schoolId: schoolMap["TAMPINES MERIDIAN JUNIOR COLLEGE"] },
      { activityName: "Learning Programme (Students)", yearConducted: 2025, schoolId: schoolMap["TAMPINES MERIDIAN JUNIOR COLLEGE"] },
      { activityName: "Learning Programme (Students)", yearConducted: 2026, schoolId: schoolMap["TAMPINES MERIDIAN JUNIOR COLLEGE"] },
      { activityName: "Survey", yearConducted: 2024, schoolId: schoolMap["TAMPINES MERIDIAN JUNIOR COLLEGE"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2024, schoolId: schoolMap["TAMPINES MERIDIAN JUNIOR COLLEGE"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2025, schoolId: schoolMap["TAMPINES MERIDIAN JUNIOR COLLEGE"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2026, schoolId: schoolMap["TAMPINES MERIDIAN JUNIOR COLLEGE"] },
      { activityName: "Uniform Exhibition", yearConducted: 2024, schoolId: schoolMap["TAMPINES MERIDIAN JUNIOR COLLEGE"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["TAMPINES PRIMARY SCHOOL"] },
      { activityName: "PSG Session/Workshop", yearConducted: 2024, schoolId: schoolMap["TAMPINES PRIMARY SCHOOL"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2024, schoolId: schoolMap["TAMPINES PRIMARY SCHOOL"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2025, schoolId: schoolMap["TAMPINES PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["TAMPINES SECONDARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["TANJONG KATONG GIRLS' SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["TANJONG KATONG PRIMARY SCHOOL"] },
      { activityName: "Infobooth/Awareness Talk", yearConducted: 2024, schoolId: schoolMap["TANJONG KATONG PRIMARY SCHOOL"] },
      { activityName: "PSG Session/Workshop", yearConducted: 2024, schoolId: schoolMap["TANJONG KATONG PRIMARY SCHOOL"] },
      { activityName: "PSG Session/Workshop", yearConducted: 2025, schoolId: schoolMap["TANJONG KATONG PRIMARY SCHOOL"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2024, schoolId: schoolMap["TANJONG KATONG PRIMARY SCHOOL"] },
      { activityName: "Survey", yearConducted: 2023, schoolId: schoolMap["TAO NAN SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["TEMASEK SECONDARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["UNITY SECONDARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["VALOUR PRIMARY SCHOOL"] },
      { activityName: "Survey", yearConducted: 2023, schoolId: schoolMap["VICTORIA JUNIOR COLLEGE"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["VICTORIA SCHOOL"] },
      { activityName: "Learning Programme (Students)", yearConducted: 2025, schoolId: schoolMap["VICTORIA SCHOOL"] },
      { activityName: "Learning Programme (Students)", yearConducted: 2026, schoolId: schoolMap["VICTORIA SCHOOL"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2025, schoolId: schoolMap["VICTORIA SCHOOL"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2026, schoolId: schoolMap["VICTORIA SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["WEST VIEW PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["WHITE SANDS PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["WHITLEY SECONDARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["WOODLANDS PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["XINGHUA PRIMARY SCHOOL"] },
      { activityName: "Survey", yearConducted: 2024, schoolId: schoolMap["XINGNAN PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["XINMIN PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["YANGZHENG PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["YISHUN PRIMARY SCHOOL"] },
      { activityName: "Survey", yearConducted: 2024, schoolId: schoolMap["YISHUN SECONDARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["YU NENG PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["YUAN CHING SECONDARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["ZHENGHUA PRIMARY SCHOOL"] },
      { activityName: "Learning Programme (Students)", yearConducted: 2025, schoolId: schoolMap["ZHENGHUA PRIMARY SCHOOL"] },
      { activityName: "Learning Programme (Students)", yearConducted: 2026, schoolId: schoolMap["ZHENGHUA PRIMARY SCHOOL"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2025, schoolId: schoolMap["ZHENGHUA PRIMARY SCHOOL"] },
      { activityName: "Uniform Donation Drive", yearConducted: 2026, schoolId: schoolMap["ZHENGHUA PRIMARY SCHOOL"] },
      { activityName: "Go Green PSGs", yearConducted: 2025, schoolId: schoolMap["ZHENGHUA SECONDARY SCHOOL"] },
  ];

  const valid = partnershipRaw.filter((d): d is typeof d & { schoolId: number } => {
    if (d.schoolId === undefined) {
      console.warn(`   ⚠️ Skipped: schoolId undefined for "${d.activityName}"`);
      return false;
    }
    return true;
  });

  await prisma.schoolPartnership.createMany({ data: valid });

  partnershipRaw.forEach((d, i) => {
  if (d.schoolId === undefined) {
    console.warn(`   ⚠️ Skipped index ${i}: "${d.activityName}"`);
  }
  });

  console.log(`   Created ${valid.length} school partnerships.`);

  // -------------------- ITEM TYPES --------------------
  console.log("👕 Seeding item types...");

  // Define a set of realistic item types per school
interface ItemTypeSeedDef {
  schoolName: string;
  categoryName: string;
  gender: "Unisex" | "Male" | "Female";
  primaryColour: string;
  secondaryColour?: string;
  pattern?: string;
  material?: string;
}

const itemTypeDefs: ItemTypeSeedDef[] = [

  // School Uniform Seed Data for TCC UIMS
  // Generated for 12 schools with comprehensive clothing items
  // ============================================================
  // VICTORIA SCHOOL (Boys' School)
  // ============================================================
  // Uniform Items
  { schoolName: "VICTORIA SCHOOL", categoryName: "Uniform Shirt", gender: "Male", primaryColour: "White", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "VICTORIA SCHOOL", categoryName: "Uniform Shorts", gender: "Male", primaryColour: "Khaki", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "VICTORIA SCHOOL", categoryName: "Uniform Pants", gender: "Male", primaryColour: "White", material: "Cotton-Polyester Blend", pattern: "Solid" },
  // PE Items
  { schoolName: "VICTORIA SCHOOL", categoryName: "PE Shirt", gender: "Male", primaryColour: "Royal Blue", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "VICTORIA SCHOOL", categoryName: "PE Shorts", gender: "Male", primaryColour: "Royal Blue", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "VICTORIA SCHOOL", categoryName: "Gym Shorts", gender: "Male", primaryColour: "Royal Blue", material: "Dri-Fit", pattern: "Solid" },
  // House Shirts
  { schoolName: "VICTORIA SCHOOL", categoryName: "House Shirt", gender: "Male", primaryColour: "Red", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "VICTORIA SCHOOL", categoryName: "House Shirt", gender: "Male", primaryColour: "Blue", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "VICTORIA SCHOOL", categoryName: "House Shirt", gender: "Male", primaryColour: "Green", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "VICTORIA SCHOOL", categoryName: "House Shirt", gender: "Male", primaryColour: "Yellow", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  // Accessories
  { schoolName: "VICTORIA SCHOOL", categoryName: "Tie", gender: "Male", primaryColour: "Maroon", secondaryColour: "Gold", material: "Polyester", pattern: "Striped" },
  { schoolName: "VICTORIA SCHOOL", categoryName: "Belt", gender: "Male", primaryColour: "Black", material: "Leather", pattern: "Solid" },
  { schoolName: "VICTORIA SCHOOL", categoryName: "Cap", gender: "Male", primaryColour: "Maroon", secondaryColour: "White", material: "Cotton", pattern: "Solid" },
  // Other Items
  { schoolName: "VICTORIA SCHOOL", categoryName: "Other Shirts", gender: "Male", primaryColour: "Maroon", secondaryColour: "White", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "VICTORIA SCHOOL", categoryName: "Others", gender: "Male", primaryColour: "Maroon", material: "Cotton", pattern: "Solid" },

  // ============================================================
  // CHIJ KATONG CONVENT (Girls' School)
  // ============================================================
  // Uniform Items
  { schoolName: "CHIJ KATONG CONVENT", categoryName: "Uniform Shirt", gender: "Female", primaryColour: "White", material: "Cotton", pattern: "Solid" },
  { schoolName: "CHIJ KATONG CONVENT", categoryName: "Pinafore", gender: "Female", primaryColour: "Green", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "CHIJ KATONG CONVENT", categoryName: "Skort", gender: "Female", primaryColour: "Green", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "CHIJ KATONG CONVENT", categoryName: "Uniform Skirt", gender: "Female", primaryColour: "Green", material: "Cotton-Polyester Blend", pattern: "Solid" },
  // PE Items
  { schoolName: "CHIJ KATONG CONVENT", categoryName: "PE Shirt", gender: "Female", primaryColour: "Green", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "CHIJ KATONG CONVENT", categoryName: "PE Shorts", gender: "Female", primaryColour: "Green", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "CHIJ KATONG CONVENT", categoryName: "Gym Shorts", gender: "Female", primaryColour: "Green", material: "Dri-Fit", pattern: "Solid" },
  // House Shirts
  { schoolName: "CHIJ KATONG CONVENT", categoryName: "House Shirt", gender: "Female", primaryColour: "Red", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "CHIJ KATONG CONVENT", categoryName: "House Shirt", gender: "Female", primaryColour: "Blue", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "CHIJ KATONG CONVENT", categoryName: "House Shirt", gender: "Female", primaryColour: "Green", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "CHIJ KATONG CONVENT", categoryName: "House Shirt", gender: "Female", primaryColour: "Yellow", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  // Accessories
  { schoolName: "CHIJ KATONG CONVENT", categoryName: "Tie", gender: "Female", primaryColour: "Green", secondaryColour: "White", material: "Polyester", pattern: "Striped" },
  { schoolName: "CHIJ KATONG CONVENT", categoryName: "Belt", gender: "Female", primaryColour: "Green", material: "Fabric", pattern: "Solid" },
  { schoolName: "CHIJ KATONG CONVENT", categoryName: "Cap", gender: "Female", primaryColour: "Green", secondaryColour: "White", material: "Cotton", pattern: "Solid" },
  // Other Items
  { schoolName: "CHIJ KATONG CONVENT", categoryName: "Other Shirts", gender: "Female", primaryColour: "Green", secondaryColour: "White", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "CHIJ KATONG CONVENT", categoryName: "Others", gender: "Female", primaryColour: "Green", material: "Cotton", pattern: "Solid" },

  // ============================================================
  // ANGLO-CHINESE SCHOOL (PRIMARY) (Boys' School)
  // ============================================================
  // Uniform Items
  { schoolName: "ANGLO-CHINESE SCHOOL (PRIMARY)", categoryName: "Uniform Shirt", gender: "Male", primaryColour: "White", material: "Cotton", pattern: "Solid" },
  { schoolName: "ANGLO-CHINESE SCHOOL (PRIMARY)", categoryName: "Uniform Shorts", gender: "Male", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "ANGLO-CHINESE SCHOOL (PRIMARY)", categoryName: "Uniform Pants", gender: "Male", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  // PE Items
  { schoolName: "ANGLO-CHINESE SCHOOL (PRIMARY)", categoryName: "PE Shirt", gender: "Male", primaryColour: "Navy Blue", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "ANGLO-CHINESE SCHOOL (PRIMARY)", categoryName: "PE Shorts", gender: "Male", primaryColour: "Navy Blue", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "ANGLO-CHINESE SCHOOL (PRIMARY)", categoryName: "Gym Shorts", gender: "Male", primaryColour: "Navy Blue", material: "Dri-Fit", pattern: "Solid" },
  // House Shirts
  { schoolName: "ANGLO-CHINESE SCHOOL (PRIMARY)", categoryName: "House Shirt", gender: "Male", primaryColour: "Red", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "ANGLO-CHINESE SCHOOL (PRIMARY)", categoryName: "House Shirt", gender: "Male", primaryColour: "Blue", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "ANGLO-CHINESE SCHOOL (PRIMARY)", categoryName: "House Shirt", gender: "Male", primaryColour: "Green", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "ANGLO-CHINESE SCHOOL (PRIMARY)", categoryName: "House Shirt", gender: "Male", primaryColour: "Yellow", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  // Accessories
  { schoolName: "ANGLO-CHINESE SCHOOL (PRIMARY)", categoryName: "Tie", gender: "Male", primaryColour: "Navy Blue", secondaryColour: "Gold", material: "Polyester", pattern: "Striped" },
  { schoolName: "ANGLO-CHINESE SCHOOL (PRIMARY)", categoryName: "Belt", gender: "Male", primaryColour: "Black", material: "Leather", pattern: "Solid" },
  { schoolName: "ANGLO-CHINESE SCHOOL (PRIMARY)", categoryName: "Cap", gender: "Male", primaryColour: "Navy Blue", secondaryColour: "White", material: "Cotton", pattern: "Solid" },
  // Other Items
  { schoolName: "ANGLO-CHINESE SCHOOL (PRIMARY)", categoryName: "Other Shirts", gender: "Male", primaryColour: "Navy Blue", secondaryColour: "White", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "ANGLO-CHINESE SCHOOL (PRIMARY)", categoryName: "Others", gender: "Male", primaryColour: "Navy Blue", material: "Cotton", pattern: "Solid" },

  // ============================================================
  // ST. PATRICK'S SCHOOL (Boys' School)
  // ============================================================
  // Uniform Items
  { schoolName: "ST. PATRICK'S SCHOOL", categoryName: "Uniform Shirt", gender: "Male", primaryColour: "White", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "ST. PATRICK'S SCHOOL", categoryName: "Uniform Shorts", gender: "Male", primaryColour: "White", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "ST. PATRICK'S SCHOOL", categoryName: "Uniform Pants", gender: "Male", primaryColour: "White", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "ST. PATRICK'S SCHOOL", categoryName: "Polo Shirt", gender: "Male", primaryColour: "White", secondaryColour: "Green", material: "Cotton-Polyester Blend", pattern: "Striped" },
  // PE Items
  { schoolName: "ST. PATRICK'S SCHOOL", categoryName: "PE Shirt", gender: "Male", primaryColour: "White", secondaryColour: "Green", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "ST. PATRICK'S SCHOOL", categoryName: "PE Shorts", gender: "Male", primaryColour: "Green", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "ST. PATRICK'S SCHOOL", categoryName: "Gym Shorts", gender: "Male", primaryColour: "Green", material: "Dri-Fit", pattern: "Solid" },
  // House Shirts
  { schoolName: "ST. PATRICK'S SCHOOL", categoryName: "House Shirt", gender: "Male", primaryColour: "Red", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "ST. PATRICK'S SCHOOL", categoryName: "House Shirt", gender: "Male", primaryColour: "Blue", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "ST. PATRICK'S SCHOOL", categoryName: "House Shirt", gender: "Male", primaryColour: "Green", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "ST. PATRICK'S SCHOOL", categoryName: "House Shirt", gender: "Male", primaryColour: "Yellow", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  // Accessories
  { schoolName: "ST. PATRICK'S SCHOOL", categoryName: "Tie", gender: "Male", primaryColour: "Green", secondaryColour: "Blue", material: "Polyester", pattern: "Striped" },
  { schoolName: "ST. PATRICK'S SCHOOL", categoryName: "Belt", gender: "Male", primaryColour: "Blue", secondaryColour: "Green", material: "Fabric", pattern: "Striped" },
  { schoolName: "ST. PATRICK'S SCHOOL", categoryName: "Cap", gender: "Male", primaryColour: "Green", secondaryColour: "White", material: "Cotton", pattern: "Solid" },
  // Other Items
  { schoolName: "ST. PATRICK'S SCHOOL", categoryName: "Other Shirts", gender: "Male", primaryColour: "Green", secondaryColour: "White", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "ST. PATRICK'S SCHOOL", categoryName: "Others", gender: "Male", primaryColour: "Green", material: "Cotton", pattern: "Solid" },

  // ============================================================
  // BROADRICK SECONDARY SCHOOL (Co-ed)
  // ============================================================
  // Uniform Items - Male
  { schoolName: "BROADRICK SECONDARY SCHOOL", categoryName: "Uniform Shirt", gender: "Male", primaryColour: "White", material: "Cotton-Polyester Blend", pattern: "Solid" },
  // Uniform Items - Female
  { schoolName: "BROADRICK SECONDARY SCHOOL", categoryName: "Uniform Shirt", gender: "Female", primaryColour: "White", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "BROADRICK SECONDARY SCHOOL", categoryName: "Uniform Shorts", gender: "Male", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "BROADRICK SECONDARY SCHOOL", categoryName: "Uniform Pants", gender: "Male", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "BROADRICK SECONDARY SCHOOL", categoryName: "Pinafore", gender: "Female", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "BROADRICK SECONDARY SCHOOL", categoryName: "Skort", gender: "Female", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "BROADRICK SECONDARY SCHOOL", categoryName: "Uniform Skirt", gender: "Female", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  // PE Items
  { schoolName: "BROADRICK SECONDARY SCHOOL", categoryName: "PE Shirt", gender: "Unisex", primaryColour: "Orange", secondaryColour: "Navy Blue", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "BROADRICK SECONDARY SCHOOL", categoryName: "PE Shorts", gender: "Unisex", primaryColour: "Navy Blue", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "BROADRICK SECONDARY SCHOOL", categoryName: "Gym Shorts", gender: "Unisex", primaryColour: "Navy Blue", material: "Dri-Fit", pattern: "Solid" },
  // House Shirts
  { schoolName: "BROADRICK SECONDARY SCHOOL", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Red", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "BROADRICK SECONDARY SCHOOL", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Blue", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "BROADRICK SECONDARY SCHOOL", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Green", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "BROADRICK SECONDARY SCHOOL", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Yellow", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  // Accessories
  { schoolName: "BROADRICK SECONDARY SCHOOL", categoryName: "Tie", gender: "Unisex", primaryColour: "Navy Blue", secondaryColour: "Orange", material: "Polyester", pattern: "Striped" },
  { schoolName: "BROADRICK SECONDARY SCHOOL", categoryName: "Belt", gender: "Unisex", primaryColour: "Black", material: "Leather", pattern: "Solid" },
  { schoolName: "BROADRICK SECONDARY SCHOOL", categoryName: "Cap", gender: "Unisex", primaryColour: "Navy Blue", secondaryColour: "Orange", material: "Cotton", pattern: "Solid" },
  // Other Items
  { schoolName: "BROADRICK SECONDARY SCHOOL", categoryName: "Other Shirts", gender: "Unisex", primaryColour: "Navy Blue", secondaryColour: "Orange", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "BROADRICK SECONDARY SCHOOL", categoryName: "Others", gender: "Unisex", primaryColour: "Navy Blue", material: "Cotton", pattern: "Solid" },

  // ============================================================
  // BEATTY SECONDARY SCHOOL (Co-ed)
  // ============================================================
  // Uniform Items - Male
  { schoolName: "BEATTY SECONDARY SCHOOL", categoryName: "Uniform Shirt", gender: "Male", primaryColour: "White", material: "Cotton-Polyester Blend", pattern: "Solid" },
  // Uniform Items - Female
  { schoolName: "BEATTY SECONDARY SCHOOL", categoryName: "Uniform Shirt", gender: "Female", primaryColour: "White", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "BEATTY SECONDARY SCHOOL", categoryName: "Uniform Shorts", gender: "Male", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "BEATTY SECONDARY SCHOOL", categoryName: "Uniform Pants", gender: "Male", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "BEATTY SECONDARY SCHOOL", categoryName: "Pinafore", gender: "Female", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "BEATTY SECONDARY SCHOOL", categoryName: "Skort", gender: "Female", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "BEATTY SECONDARY SCHOOL", categoryName: "Uniform Skirt", gender: "Female", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Pleated" },
  // PE Items
  { schoolName: "BEATTY SECONDARY SCHOOL", categoryName: "PE Shirt", gender: "Unisex", primaryColour: "Navy Blue", secondaryColour: "Gold", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "BEATTY SECONDARY SCHOOL", categoryName: "PE Shorts", gender: "Unisex", primaryColour: "Navy Blue", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "BEATTY SECONDARY SCHOOL", categoryName: "Gym Shorts", gender: "Unisex", primaryColour: "Navy Blue", material: "Dri-Fit", pattern: "Solid" },
  // House Shirts
  { schoolName: "BEATTY SECONDARY SCHOOL", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Red", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "BEATTY SECONDARY SCHOOL", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Blue", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "BEATTY SECONDARY SCHOOL", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Green", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "BEATTY SECONDARY SCHOOL", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Yellow", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  // Accessories
  { schoolName: "BEATTY SECONDARY SCHOOL", categoryName: "Tie", gender: "Unisex", primaryColour: "Navy Blue", secondaryColour: "Gold", material: "Polyester", pattern: "Striped" },
  { schoolName: "BEATTY SECONDARY SCHOOL", categoryName: "Belt", gender: "Unisex", primaryColour: "Black", material: "Leather", pattern: "Solid" },
  { schoolName: "BEATTY SECONDARY SCHOOL", categoryName: "Cap", gender: "Unisex", primaryColour: "Navy Blue", secondaryColour: "Gold", material: "Cotton", pattern: "Solid" },
  // Other Items
  { schoolName: "BEATTY SECONDARY SCHOOL", categoryName: "Other Shirts", gender: "Unisex", primaryColour: "Navy Blue", secondaryColour: "Gold", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "BEATTY SECONDARY SCHOOL", categoryName: "Others", gender: "Unisex", primaryColour: "Navy Blue", material: "Cotton", pattern: "Solid" },

  // ============================================================
  // NATIONAL JUNIOR COLLEGE (Co-ed)
  // ============================================================
  // Uniform Items - Male
  { schoolName: "NATIONAL JUNIOR COLLEGE", categoryName: "Uniform Shirt", gender: "Male", primaryColour: "Grey", material: "Cotton-Polyester Blend", pattern: "Solid" },
  // Uniform Items - Female
  { schoolName: "NATIONAL JUNIOR COLLEGE", categoryName: "Uniform Shirt", gender: "Female", primaryColour: "Grey", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "NATIONAL JUNIOR COLLEGE", categoryName: "Uniform Shorts", gender: "Male", primaryColour: "Grey", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "NATIONAL JUNIOR COLLEGE", categoryName: "Uniform Pants", gender: "Male", primaryColour: "Grey", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "NATIONAL JUNIOR COLLEGE", categoryName: "Pinafore", gender: "Female", primaryColour: "Grey", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "NATIONAL JUNIOR COLLEGE", categoryName: "Skort", gender: "Female", primaryColour: "Grey", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "NATIONAL JUNIOR COLLEGE", categoryName: "Uniform Skirt", gender: "Female", primaryColour: "Grey", material: "Cotton-Polyester Blend", pattern: "Pleated" },
  { schoolName: "NATIONAL JUNIOR COLLEGE", categoryName: "Polo Shirt", gender: "Unisex", primaryColour: "White", secondaryColour: "Maroon", material: "Cotton-Polyester Blend", pattern: "Solid" },
  // PE Items
  { schoolName: "NATIONAL JUNIOR COLLEGE", categoryName: "PE Shirt", gender: "Unisex", primaryColour: "White", secondaryColour: "Red", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "NATIONAL JUNIOR COLLEGE", categoryName: "PE Shorts", gender: "Unisex", primaryColour: "Red", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "NATIONAL JUNIOR COLLEGE", categoryName: "Gym Shorts", gender: "Unisex", primaryColour: "Red", material: "Dri-Fit", pattern: "Solid" },
  // House Shirts
  { schoolName: "NATIONAL JUNIOR COLLEGE", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Red", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "NATIONAL JUNIOR COLLEGE", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Blue", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "NATIONAL JUNIOR COLLEGE", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Green", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "NATIONAL JUNIOR COLLEGE", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Yellow", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  // Accessories
  { schoolName: "NATIONAL JUNIOR COLLEGE", categoryName: "Tie", gender: "Unisex", primaryColour: "Maroon", secondaryColour: "Grey", material: "Polyester", pattern: "Striped" },
  { schoolName: "NATIONAL JUNIOR COLLEGE", categoryName: "Belt", gender: "Unisex", primaryColour: "Black", material: "Leather", pattern: "Solid" },
  { schoolName: "NATIONAL JUNIOR COLLEGE", categoryName: "Cap", gender: "Unisex", primaryColour: "Maroon", secondaryColour: "White", material: "Cotton", pattern: "Solid" },
  // Other Items
  { schoolName: "NATIONAL JUNIOR COLLEGE", categoryName: "Other Shirts", gender: "Unisex", primaryColour: "Maroon", secondaryColour: "White", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "NATIONAL JUNIOR COLLEGE", categoryName: "Others", gender: "Unisex", primaryColour: "Maroon", material: "Cotton", pattern: "Solid" },

  // ============================================================
  // CHANGKAT PRIMARY SCHOOL (Co-ed)
  // ============================================================
  // Uniform Items - Male
  { schoolName: "CHANGKAT PRIMARY SCHOOL", categoryName: "Uniform Shirt", gender: "Male", primaryColour: "White", material: "Cotton", pattern: "Solid" },
  // Uniform Items - Female
  { schoolName: "CHANGKAT PRIMARY SCHOOL", categoryName: "Uniform Shirt", gender: "Female", primaryColour: "White", material: "Cotton", pattern: "Solid" },
  { schoolName: "CHANGKAT PRIMARY SCHOOL", categoryName: "Uniform Shorts", gender: "Male", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "CHANGKAT PRIMARY SCHOOL", categoryName: "Uniform Pants", gender: "Male", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "CHANGKAT PRIMARY SCHOOL", categoryName: "Pinafore", gender: "Female", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "CHANGKAT PRIMARY SCHOOL", categoryName: "Skort", gender: "Female", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "CHANGKAT PRIMARY SCHOOL", categoryName: "Uniform Skirt", gender: "Female", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  // PE Items
  { schoolName: "CHANGKAT PRIMARY SCHOOL", categoryName: "PE Shirt", gender: "Unisex", primaryColour: "Light Blue", secondaryColour: "Navy Blue", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "CHANGKAT PRIMARY SCHOOL", categoryName: "PE Shorts", gender: "Unisex", primaryColour: "Navy Blue", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "CHANGKAT PRIMARY SCHOOL", categoryName: "Gym Shorts", gender: "Unisex", primaryColour: "Navy Blue", material: "Dri-Fit", pattern: "Solid" },
  // House Shirts
  { schoolName: "CHANGKAT PRIMARY SCHOOL", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Red", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "CHANGKAT PRIMARY SCHOOL", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Blue", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "CHANGKAT PRIMARY SCHOOL", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Green", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "CHANGKAT PRIMARY SCHOOL", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Yellow", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  // Accessories
  { schoolName: "CHANGKAT PRIMARY SCHOOL", categoryName: "Tie", gender: "Unisex", primaryColour: "Navy Blue", secondaryColour: "Light Blue", material: "Polyester", pattern: "Striped" },
  { schoolName: "CHANGKAT PRIMARY SCHOOL", categoryName: "Belt", gender: "Unisex", primaryColour: "Black", material: "Fabric", pattern: "Solid" },
  { schoolName: "CHANGKAT PRIMARY SCHOOL", categoryName: "Cap", gender: "Unisex", primaryColour: "Navy Blue", secondaryColour: "White", material: "Cotton", pattern: "Solid" },
  // Other Items
  { schoolName: "CHANGKAT PRIMARY SCHOOL", categoryName: "Other Shirts", gender: "Unisex", primaryColour: "Navy Blue", secondaryColour: "Light Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "CHANGKAT PRIMARY SCHOOL", categoryName: "Others", gender: "Unisex", primaryColour: "Navy Blue", material: "Cotton", pattern: "Solid" },

  // ============================================================
  // BUKIT TIMAH PRIMARY SCHOOL (Co-ed)
  // ============================================================
  // Uniform Items - Male
  { schoolName: "BUKIT TIMAH PRIMARY SCHOOL", categoryName: "Uniform Shirt", gender: "Male", primaryColour: "White", material: "Cotton", pattern: "Solid" },
  // Uniform Items - Female
  { schoolName: "BUKIT TIMAH PRIMARY SCHOOL", categoryName: "Uniform Shirt", gender: "Female", primaryColour: "White", material: "Cotton", pattern: "Solid" },
  { schoolName: "BUKIT TIMAH PRIMARY SCHOOL", categoryName: "Uniform Shorts", gender: "Male", primaryColour: "Maroon", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "BUKIT TIMAH PRIMARY SCHOOL", categoryName: "Uniform Pants", gender: "Male", primaryColour: "Maroon", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "BUKIT TIMAH PRIMARY SCHOOL", categoryName: "Pinafore", gender: "Female", primaryColour: "Maroon", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "BUKIT TIMAH PRIMARY SCHOOL", categoryName: "Skort", gender: "Female", primaryColour: "Maroon", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "BUKIT TIMAH PRIMARY SCHOOL", categoryName: "Uniform Skirt", gender: "Female", primaryColour: "Maroon", material: "Cotton-Polyester Blend", pattern: "Solid" },
  // PE Items
  { schoolName: "BUKIT TIMAH PRIMARY SCHOOL", categoryName: "PE Shirt", gender: "Unisex", primaryColour: "Maroon", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "BUKIT TIMAH PRIMARY SCHOOL", categoryName: "PE Shorts", gender: "Unisex", primaryColour: "Maroon", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "BUKIT TIMAH PRIMARY SCHOOL", categoryName: "Gym Shorts", gender: "Unisex", primaryColour: "Maroon", material: "Dri-Fit", pattern: "Solid" },
  // House Shirts
  { schoolName: "BUKIT TIMAH PRIMARY SCHOOL", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Red", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "BUKIT TIMAH PRIMARY SCHOOL", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Blue", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "BUKIT TIMAH PRIMARY SCHOOL", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Green", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "BUKIT TIMAH PRIMARY SCHOOL", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Yellow", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  // Accessories
  { schoolName: "BUKIT TIMAH PRIMARY SCHOOL", categoryName: "Tie", gender: "Unisex", primaryColour: "Maroon", secondaryColour: "White", material: "Polyester", pattern: "Striped" },
  { schoolName: "BUKIT TIMAH PRIMARY SCHOOL", categoryName: "Belt", gender: "Unisex", primaryColour: "Maroon", material: "Fabric", pattern: "Solid" },
  { schoolName: "BUKIT TIMAH PRIMARY SCHOOL", categoryName: "Cap", gender: "Unisex", primaryColour: "Maroon", secondaryColour: "White", material: "Cotton", pattern: "Solid" },
  // Other Items
  { schoolName: "BUKIT TIMAH PRIMARY SCHOOL", categoryName: "Other Shirts", gender: "Unisex", primaryColour: "Maroon", secondaryColour: "White", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "BUKIT TIMAH PRIMARY SCHOOL", categoryName: "Others", gender: "Unisex", primaryColour: "Maroon", material: "Cotton", pattern: "Solid" },

  // ============================================================
  // TAMPINES MERIDIAN JUNIOR COLLEGE (Co-ed)
  // ============================================================
  // Uniform Items - Male
  { schoolName: "TAMPINES MERIDIAN JUNIOR COLLEGE", categoryName: "Uniform Shirt", gender: "Male", primaryColour: "White", material: "Cotton-Polyester Blend", pattern: "Solid" },
  // Uniform Items - Female
  { schoolName: "TAMPINES MERIDIAN JUNIOR COLLEGE", categoryName: "Uniform Shirt", gender: "Female", primaryColour: "White", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "TAMPINES MERIDIAN JUNIOR COLLEGE", categoryName: "Uniform Shorts", gender: "Male", primaryColour: "Khaki", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "TAMPINES MERIDIAN JUNIOR COLLEGE", categoryName: "Uniform Pants", gender: "Male", primaryColour: "Khaki", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "TAMPINES MERIDIAN JUNIOR COLLEGE", categoryName: "Pinafore", gender: "Female", primaryColour: "Khaki", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "TAMPINES MERIDIAN JUNIOR COLLEGE", categoryName: "Skort", gender: "Female", primaryColour: "Khaki", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "TAMPINES MERIDIAN JUNIOR COLLEGE", categoryName: "Uniform Skirt", gender: "Female", primaryColour: "Khaki", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "TAMPINES MERIDIAN JUNIOR COLLEGE", categoryName: "Polo Shirt", gender: "Unisex", primaryColour: "White", secondaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  // PE Items
  { schoolName: "TAMPINES MERIDIAN JUNIOR COLLEGE", categoryName: "PE Shirt", gender: "Unisex", primaryColour: "Red", secondaryColour: "Silver", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "TAMPINES MERIDIAN JUNIOR COLLEGE", categoryName: "PE Shorts", gender: "Unisex", primaryColour: "Navy Blue", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "TAMPINES MERIDIAN JUNIOR COLLEGE", categoryName: "Gym Shorts", gender: "Unisex", primaryColour: "Navy Blue", material: "Dri-Fit", pattern: "Solid" },
  // House Shirts
  { schoolName: "TAMPINES MERIDIAN JUNIOR COLLEGE", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Red", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "TAMPINES MERIDIAN JUNIOR COLLEGE", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Blue", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "TAMPINES MERIDIAN JUNIOR COLLEGE", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Green", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "TAMPINES MERIDIAN JUNIOR COLLEGE", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Yellow", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  // Accessories
  { schoolName: "TAMPINES MERIDIAN JUNIOR COLLEGE", categoryName: "Tie", gender: "Unisex", primaryColour: "Red", secondaryColour: "Silver", material: "Polyester", pattern: "Striped" },
  { schoolName: "TAMPINES MERIDIAN JUNIOR COLLEGE", categoryName: "Belt", gender: "Unisex", primaryColour: "Black", material: "Leather", pattern: "Solid" },
  { schoolName: "TAMPINES MERIDIAN JUNIOR COLLEGE", categoryName: "Cap", gender: "Unisex", primaryColour: "Red", secondaryColour: "White", material: "Cotton", pattern: "Solid" },
  // Other Items
  { schoolName: "TAMPINES MERIDIAN JUNIOR COLLEGE", categoryName: "Other Shirts", gender: "Unisex", primaryColour: "Red", secondaryColour: "Silver", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "TAMPINES MERIDIAN JUNIOR COLLEGE", categoryName: "Others", gender: "Unisex", primaryColour: "Red", material: "Cotton", pattern: "Solid" },

  // ============================================================
  // ST. STEPHEN'S SCHOOL (Co-ed)
  // ============================================================
  // Uniform Items - Male
  { schoolName: "ST. STEPHEN'S SCHOOL", categoryName: "Uniform Shirt", gender: "Male", primaryColour: "White", material: "Cotton", pattern: "Solid" },
  // Uniform Items - Female
  { schoolName: "ST. STEPHEN'S SCHOOL", categoryName: "Uniform Shirt", gender: "Female", primaryColour: "White", material: "Cotton", pattern: "Solid" },
  { schoolName: "ST. STEPHEN'S SCHOOL", categoryName: "Uniform Shorts", gender: "Male", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "ST. STEPHEN'S SCHOOL", categoryName: "Uniform Pants", gender: "Male", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "ST. STEPHEN'S SCHOOL", categoryName: "Pinafore", gender: "Female", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "ST. STEPHEN'S SCHOOL", categoryName: "Skort", gender: "Female", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "ST. STEPHEN'S SCHOOL", categoryName: "Uniform Skirt", gender: "Female", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  // PE Items
  { schoolName: "ST. STEPHEN'S SCHOOL", categoryName: "PE Shirt", gender: "Unisex", primaryColour: "Light Blue", secondaryColour: "Navy Blue", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "ST. STEPHEN'S SCHOOL", categoryName: "PE Shorts", gender: "Unisex", primaryColour: "Navy Blue", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "ST. STEPHEN'S SCHOOL", categoryName: "Gym Shorts", gender: "Unisex", primaryColour: "Navy Blue", material: "Dri-Fit", pattern: "Solid" },
  // House Shirts
  { schoolName: "ST. STEPHEN'S SCHOOL", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Red", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "ST. STEPHEN'S SCHOOL", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Blue", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "ST. STEPHEN'S SCHOOL", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Green", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "ST. STEPHEN'S SCHOOL", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Yellow", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  // Accessories
  { schoolName: "ST. STEPHEN'S SCHOOL", categoryName: "Tie", gender: "Unisex", primaryColour: "Navy Blue", secondaryColour: "Light Blue", material: "Polyester", pattern: "Striped" },
  { schoolName: "ST. STEPHEN'S SCHOOL", categoryName: "Belt", gender: "Unisex", primaryColour: "Navy Blue", material: "Fabric", pattern: "Solid" },
  { schoolName: "ST. STEPHEN'S SCHOOL", categoryName: "Cap", gender: "Unisex", primaryColour: "Navy Blue", secondaryColour: "White", material: "Cotton", pattern: "Solid" },
  // Other Items
  { schoolName: "ST. STEPHEN'S SCHOOL", categoryName: "Other Shirts", gender: "Unisex", primaryColour: "Navy Blue", secondaryColour: "Light Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "ST. STEPHEN'S SCHOOL", categoryName: "Others", gender: "Unisex", primaryColour: "Navy Blue", material: "Cotton", pattern: "Solid" },

  // ============================================================
  // ZHENGHUA PRIMARY SCHOOL (Co-ed)
  // ============================================================
  // Uniform Items - Male
  { schoolName: "ZHENGHUA PRIMARY SCHOOL", categoryName: "Uniform Shirt", gender: "Male", primaryColour: "White", material: "Cotton", pattern: "Solid" },
  // Uniform Items - Female
  { schoolName: "ZHENGHUA PRIMARY SCHOOL", categoryName: "Uniform Shirt", gender: "Female", primaryColour: "White", material: "Cotton", pattern: "Solid" },
  { schoolName: "ZHENGHUA PRIMARY SCHOOL", categoryName: "Uniform Shorts", gender: "Male", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "ZHENGHUA PRIMARY SCHOOL", categoryName: "Uniform Pants", gender: "Male", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "ZHENGHUA PRIMARY SCHOOL", categoryName: "Pinafore", gender: "Female", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "ZHENGHUA PRIMARY SCHOOL", categoryName: "Skort", gender: "Female", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "ZHENGHUA PRIMARY SCHOOL", categoryName: "Uniform Skirt", gender: "Female", primaryColour: "Navy Blue", material: "Cotton-Polyester Blend", pattern: "Solid" },
  // PE Items
  { schoolName: "ZHENGHUA PRIMARY SCHOOL", categoryName: "PE Shirt", gender: "Unisex", primaryColour: "Green", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "ZHENGHUA PRIMARY SCHOOL", categoryName: "PE Shorts", gender: "Unisex", primaryColour: "Green", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "ZHENGHUA PRIMARY SCHOOL", categoryName: "Gym Shorts", gender: "Unisex", primaryColour: "Green", material: "Dri-Fit", pattern: "Solid" },
  // House Shirts
  { schoolName: "ZHENGHUA PRIMARY SCHOOL", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Red", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "ZHENGHUA PRIMARY SCHOOL", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Blue", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "ZHENGHUA PRIMARY SCHOOL", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Green", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  { schoolName: "ZHENGHUA PRIMARY SCHOOL", categoryName: "House Shirt", gender: "Unisex", primaryColour: "Yellow", secondaryColour: "White", material: "Dri-Fit", pattern: "Solid" },
  // Accessories
  { schoolName: "ZHENGHUA PRIMARY SCHOOL", categoryName: "Tie", gender: "Unisex", primaryColour: "Green", secondaryColour: "White", material: "Polyester", pattern: "Striped" },
  { schoolName: "ZHENGHUA PRIMARY SCHOOL", categoryName: "Belt", gender: "Unisex", primaryColour: "Green", material: "Fabric", pattern: "Solid" },
  { schoolName: "ZHENGHUA PRIMARY SCHOOL", categoryName: "Cap", gender: "Unisex", primaryColour: "Green", secondaryColour: "White", material: "Cotton", pattern: "Solid" },
  // Other Items
  { schoolName: "ZHENGHUA PRIMARY SCHOOL", categoryName: "Other Shirts", gender: "Unisex", primaryColour: "Green", secondaryColour: "White", material: "Cotton-Polyester Blend", pattern: "Solid" },
  { schoolName: "ZHENGHUA PRIMARY SCHOOL", categoryName: "Others", gender: "Unisex", primaryColour: "Green", material: "Cotton", pattern: "Solid" },
];


  const itemTypes = await Promise.all(
    itemTypeDefs.map((def) => {
      const sizeCatId = getSizeCategoryForItem(def.schoolName, def.categoryName);
      return prisma.itemType.create({
        data: {
          gender: def.gender,
          schoolId: schoolMap[def.schoolName],
          categoryId: catMap[def.categoryName],
          primaryColourId: colourMap[def.primaryColour],
          secondaryColourId: def.secondaryColour ? colourMap[def.secondaryColour] : null,
          patternId: def.pattern ? patternMap[def.pattern] : null,
          materialId: def.material ? materialMap[def.material] : null,
          sizeCategoryId: sizeCatId,
        },
      });
    })
  );
  console.log(`   Created ${itemTypes.length} item types.`);
// -------------------- TAGS --------------------
console.log("🏷️  Seeding tags...");
const tagData = ["Christmas", "Cute", "CNY"];
const tags = await Promise.all(
  tagData.map((t) =>
    prisma.tag.create({
      data: { tagName: t, createdByUserId: AdminUser.id },
    })
  )
);
const tagMap = Object.fromEntries(tags.map((t) => [t.tagName, t.id]));
console.log(`   Created ${tags.length} tags.`);

// ==================== HELPER FUNCTIONS ====================

// ItemType lookup map (built after itemTypes are created)
const itemTypeMap: Record<string, number> = {};
itemTypeDefs.forEach((def, index) => {
  const key = `${def.schoolName}|${def.categoryName}|${def.primaryColour}${def.secondaryColour ? '|' + def.secondaryColour : ''}`;
  itemTypeMap[key] = itemTypes[index].id;
});

function getItemTypeId(schoolName: string, categoryName: string, primaryColour: string, secondaryColour?: string): number {
  const key = `${schoolName}|${categoryName}|${primaryColour}${secondaryColour ? '|' + secondaryColour : ''}`;
  const id = itemTypeMap[key];
  if (!id) throw new Error(`ItemType not found: ${key}`);
  return id;
}

function getItemType(schoolName: string, categoryName: string, primaryColour: string, secondaryColour?: string) {
  const key = `${schoolName}|${categoryName}|${primaryColour}${secondaryColour ? '|' + secondaryColour : ''}`;
  const index = itemTypeDefs.findIndex((def) => {
    const defKey = `${def.schoolName}|${def.categoryName}|${def.primaryColour}${def.secondaryColour ? '|' + def.secondaryColour : ''}`;
    return defKey === key;
  });
  if (index === -1) throw new Error(`ItemType not found: ${key}`);
  return itemTypes[index];
}

// ==================== PRNG (Deterministic Randomness) ====================
// Mulberry32 — deterministic PRNG so seed data is reproducible across runs
function mulberry32(seed: number) {
  return function () {
    seed |= 0;
    seed = (seed + 0x6d2b79f5) | 0;
    let t = Math.imul(seed ^ (seed >>> 15), 1 | seed);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const rand = mulberry32(42);

function randInt(min: number, max: number): number {
  return Math.floor(rand() * (max - min + 1)) + min;
}

function randFloat(min: number, max: number): number {
  return rand() * (max - min) + min;
}

function pickRandom<T>(arr: T[]): T {
  return arr[Math.floor(rand() * arr.length)];
}

function pickRandomN<T>(arr: T[], n: number): T[] {
  const shuffled = [...arr].sort(() => rand() - 0.5);
  return shuffled.slice(0, Math.min(n, arr.length));
}

/**
 * Pick sizes weighted toward the middle of the sort order (bell-curve).
 * For OneSize categories, returns the single option.
 * For others, picks 5–8 sizes with higher probability in the centre.
 */
function pickWeightedSizes(
  sizeOptions: { id: number; sizeName: string; sortOrder: number }[],
  count: number
): typeof sizeOptions {
  if (sizeOptions.length <= count) return sizeOptions;

  // Always include "One Size" if present
  const oneSize = sizeOptions.find((o) => o.sizeName === "One Size");
  const rest = sizeOptions.filter((o) => o.sizeName !== "One Size");
  const adjustedCount = oneSize ? count - 1 : count;

  if (rest.length <= adjustedCount) {
    return sizeOptions; // everything fits
  }

  const mid = (rest.length - 1) / 2;
  const weighted = rest.map((opt, i) => {
    const dist = Math.abs(i - mid) / (rest.length / 2);
    const weight = Math.exp(-2 * dist * dist);
    return { opt, weight };
  });

  const picked: typeof sizeOptions = [];
  const remaining = [...weighted];
  for (let i = 0; i < adjustedCount && remaining.length > 0; i++) {
    const totalWeight = remaining.reduce((sum, w) => sum + w.weight, 0);
    let r = rand() * totalWeight;
    let idx = 0;
    for (idx = 0; idx < remaining.length - 1; idx++) {
      r -= remaining[idx].weight;
      if (r <= 0) break;
    }
    picked.push(remaining[idx].opt);
    remaining.splice(idx, 1);
  }

  if (oneSize) picked.push(oneSize);
  return picked.sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Add days to a date (returns new Date) */
function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setDate(d.getDate() + days);
  return d;
}

/** Random date within a range */
function randomDateInRange(start: Date, end: Date): Date {
  const diffMs = end.getTime() - start.getTime();
  return new Date(start.getTime() + rand() * diffMs);
}

// ==================== CATEGORY WEIGHTING ====================
// Core clothing items get more donations; accessories get fewer
const CORE_CATEGORIES = new Set([
  "uniform shirt", "uniform shorts", "uniform pants", "pinafore",
  "uniform skirt", "skort", "pe shirt", "pe shorts", "polo shirt",
]);
const ACCESSORY_CATEGORIES = new Set(["tie", "belt", "cap", "others"]);

function getCategoryWeight(categoryName: string): number {
  const lower = categoryName.toLowerCase();
  if (CORE_CATEGORIES.has(lower)) return 1.5;
  if (ACCESSORY_CATEGORIES.has(lower)) return 0.4;
  return 1.0; // house shirts, gym shorts, other shirts
}

// Year multipliers — simulates TCC programme growth
const YEAR_MULTIPLIER: Record<number, number> = {
  2023: 0.6,
  2024: 1.0,
  2025: 1.3,
};

// ==================== SCHOOL METADATA ====================
const SCHOOL_NAMES = [
  "VICTORIA SCHOOL",
  "CHIJ KATONG CONVENT",
  "ANGLO-CHINESE SCHOOL (PRIMARY)",
  "ST. PATRICK'S SCHOOL",
  "BROADRICK SECONDARY SCHOOL",
  "BEATTY SECONDARY SCHOOL",
  "NATIONAL JUNIOR COLLEGE",
  "CHANGKAT PRIMARY SCHOOL",
  "BUKIT TIMAH PRIMARY SCHOOL",
  "TAMPINES MERIDIAN JUNIOR COLLEGE",
  "ST. STEPHEN'S SCHOOL",
  "ZHENGHUA PRIMARY SCHOOL",
] as const;

const SCHOOL_INITIALS: Record<string, string> = {
  "VICTORIA SCHOOL": "VS",
  "BROADRICK SECONDARY SCHOOL": "BSS",
  // "TAMPINES PRIMARY SCHOOL": "TPS",
  "ST. STEPHEN'S SCHOOL": "SSS",
  "BEATTY SECONDARY SCHOOL": "BTSS",
  "CHIJ KATONG CONVENT": "CHIJKC",
  "NATIONAL JUNIOR COLLEGE": "NJC",
  "CHANGKAT PRIMARY SCHOOL": "CPS",
  "ST. PATRICK'S SCHOOL": "SPS",
  "BUKIT TIMAH PRIMARY SCHOOL": "BTPS",
  "TAMPINES MERIDIAN JUNIOR COLLEGE": "TMJC",
  "ANGLO-CHINESE SCHOOL (PRIMARY)": "ACS(P)",
  "ZHENGHUA PRIMARY SCHOOL": "ZPS",
};


// Staff lookup by school
const schoolStaffMap: Record<string, typeof AdminUser> = {
  "VICTORIA SCHOOL": victoriaStaff,
  "CHIJ KATONG CONVENT": chijKatongStaff,
  "ANGLO-CHINESE SCHOOL (PRIMARY)": acsStaff,
  "ST. PATRICK'S SCHOOL": stPatricksStaff,
  "BROADRICK SECONDARY SCHOOL": broadrickStaff,
  "BEATTY SECONDARY SCHOOL": beattyStaff,
  "NATIONAL JUNIOR COLLEGE": njcStaff,
  "CHANGKAT PRIMARY SCHOOL": changkatStaff,
  "BUKIT TIMAH PRIMARY SCHOOL": bukitTimahStaff,
  "TAMPINES MERIDIAN JUNIOR COLLEGE": tmjcStaff,
  "ST. STEPHEN'S SCHOOL": stStephensStaff,
  "ZHENGHUA PRIMARY SCHOOL": zhenghuaStaff,
};

// Short display names for drive naming
const schoolShortNames: Record<string, string> = {
  "VICTORIA SCHOOL": "Victoria School",
  "CHIJ KATONG CONVENT": "CHIJ Katong Convent",
  "ANGLO-CHINESE SCHOOL (PRIMARY)": "ACS Primary",
  "ST. PATRICK'S SCHOOL": "St. Patrick's School",
  "BROADRICK SECONDARY SCHOOL": "Broadrick Secondary",
  "BEATTY SECONDARY SCHOOL": "Beatty Secondary",
  "NATIONAL JUNIOR COLLEGE": "National Junior College",
  "CHANGKAT PRIMARY SCHOOL": "Changkat Primary",
  "BUKIT TIMAH PRIMARY SCHOOL": "Bukit Timah Primary",
  "TAMPINES MERIDIAN JUNIOR COLLEGE": "Tampines Meridian JC",
  "ST. STEPHEN'S SCHOOL": "St. Stephen's School",
  "ZHENGHUA PRIMARY SCHOOL": "Zhenghua Primary",
};

const schoolLocations: Record<string, string> = {
  "VICTORIA SCHOOL": "Victoria School General Office",
  "CHIJ KATONG CONVENT": "CHIJ Katong Convent School Hall",
  "ANGLO-CHINESE SCHOOL (PRIMARY)": "ACS Primary Hall",
  "ST. PATRICK'S SCHOOL": "St. Patrick's School General Office",
  "BROADRICK SECONDARY SCHOOL": "Broadrick Secondary School Hall",
  "BEATTY SECONDARY SCHOOL": "Beatty Secondary School Hall",
  "NATIONAL JUNIOR COLLEGE": "National Junior College Lobby",
  "CHANGKAT PRIMARY SCHOOL": "Changkat Primary School General Office",
  "BUKIT TIMAH PRIMARY SCHOOL": "Bukit Timah Primary School Foyer",
  "TAMPINES MERIDIAN JUNIOR COLLEGE": "Tampines Meridian JC Atrium",
  "ST. STEPHEN'S SCHOOL": "St. Stephen's School General Office",
  "ZHENGHUA PRIMARY SCHOOL": "Zhenghua Primary School Canteen",
};

// ==================== DONATION DRIVES ====================
console.log("📢 Seeding donation drives...");

interface DriveDef {
  name: string;
  schoolName: string | null;
  staff: typeof AdminUser;
  startDate: Date;
  endDate: Date;
  location: string;
}

const driveDefs: DriveDef[] = [];

// Per-school drives: 3 per school across 2023, 2024, 2025
for (const school of SCHOOL_NAMES) {
  const short = schoolShortNames[school];
  const loc = schoolLocations[school];
  const staff = schoolStaffMap[school];

  // 2023: Mid-year collection (Jun–Jul)
  driveDefs.push({
    name: `${short} Mid-Year Collection 2023`,
    schoolName: school,
    staff,
    startDate: new Date("2023-06-01"),
    endDate: new Date("2023-07-15"),
    location: loc,
  });

  // 2024: Year-end graduation drive (Oct–Nov)
  driveDefs.push({
    name: `${short} Year-End Drive 2024`,
    schoolName: school,
    staff,
    startDate: new Date("2024-10-01"),
    endDate: new Date("2024-11-30"),
    location: loc,
  });

  // 2025: Term 1 drive (Jan–Mar)
  driveDefs.push({
    name: `${short} Term 1 Drive 2025`,
    schoolName: school,
    staff,
    startDate: new Date("2025-01-13"),
    endDate: new Date("2025-03-14"),
    location: loc,
  });
}

// TCC community drives (islandwide)
driveDefs.push({
  name: "TCC Islandwide Collection 2023",
  schoolName: null,
  staff: AdminUser,
  startDate: new Date("2023-08-01"),
  endDate: new Date("2023-10-31"),
  location: "TCC Office, 10 Ubi Crescent",
});
driveDefs.push({
  name: "TCC Community Drive 2024",
  schoolName: null,
  staff: AdminUser,
  startDate: new Date("2024-07-01"),
  endDate: new Date("2024-09-30"),
  location: "TCC Office, 10 Ubi Crescent",
});
driveDefs.push({
  name: "TCC Community Drive 2025",
  schoolName: null,
  staff: AdminUser,
  startDate: new Date("2025-02-01"),
  endDate: new Date("2025-04-30"),
  location: "TCC Office, 10 Ubi Crescent",
});

// Create all drives in DB
const drives = await Promise.all(
  driveDefs.map((d) =>
    prisma.donationDrive.create({
      data: {
        driveName: d.name,
        startDate: d.startDate,
        endDate: d.endDate,
        location: d.location,
        schoolId: d.schoolName ? schoolMap[d.schoolName] : null,
        createdByUserId: d.staff.id,
      },
    })
  )
);

// Build lookup: drive name → drive record
const driveMap: Record<string, (typeof drives)[0]> = {};
driveDefs.forEach((def, i) => {
  driveMap[def.name] = drives[i];
});

console.log(`   Created ${drives.length} donation drives (${SCHOOL_NAMES.length * 3} school + 3 TCC).`);

// ==================== TRANSACTION + BALANCE GENERATION ====================
console.log("💸 Generating transactions and computing inventory balances...");

// Group item types by school for efficient lookup
const itemTypesBySchool: Record<string, { itemType: (typeof itemTypes)[0]; def: ItemTypeSeedDef }[]> = {};
itemTypeDefs.forEach((def, i) => {
  if (!itemTypesBySchool[def.schoolName]) itemTypesBySchool[def.schoolName] = [];
  itemTypesBySchool[def.schoolName].push({ itemType: itemTypes[i], def });
});

// Pre-fetch all size options grouped by category ID
const allSizeOptions = await prisma.sizeOption.findMany({ orderBy: { sortOrder: "asc" } });
const sizeOptionsByCat: Record<number, typeof allSizeOptions> = {};
for (const so of allSizeOptions) {
  if (!sizeOptionsByCat[so.sizeCategoryId]) sizeOptionsByCat[so.sizeCategoryId] = [];
  sizeOptionsByCat[so.sizeCategoryId].push(so);
}

// Accumulator for inventory balances (transactions-first approach)
// Key: "itemTypeId-sizeOptionId-status-location"
const balanceAccumulator = new Map<string, number>();

function balanceKey(
  itemTypeId: number,
  sizeOptionId: number,
  status: string,
  location: string
): string {
  return `${itemTypeId}-${sizeOptionId}-${status}-${location}`;
}

function adjustBalance(
  itemTypeId: number,
  sizeOptionId: number,
  status: string,
  location: string,
  delta: number
) {
  const key = balanceKey(itemTypeId, sizeOptionId, status, location);
  balanceAccumulator.set(key, (balanceAccumulator.get(key) ?? 0) + delta);
}

// Collect all transaction data rows for bulk insert
const allTransactions: {
  fromStoredAt: string | null;
  toStoredAt: string;
  fromStatus: string | null;
  toStatus: string;
  quantity: number;
  transactionType: string;
  transactionDate: Date;
  itemTypeId: number;
  sizeOptionId: number;
  donationDriveId: number | null;
  userId: number;
  remarks: string | null;
}[] = [];

/** Derive the year from a drive's start date (for multiplier lookup) */
function driveYear(d: DriveDef): number {
  return d.startDate.getFullYear();
}

/**
 * Process one item type for one drive:
 * - Pick weighted sizes
 * - Generate donation + downstream transactions
 */
function generateTransactionsForItem(
  itemType: (typeof itemTypes)[0],
  def: ItemTypeSeedDef,
  driveDef: DriveDef,
  drive: (typeof drives)[0],
  staff: typeof AdminUser
) {
  const year = driveYear(driveDef);
  const yearMult = YEAR_MULTIPLIER[year] ?? 1.0;
  const catWeight = getCategoryWeight(def.categoryName);

  // Get valid size options for this item type
  const validSizes = sizeOptionsByCat[itemType.sizeCategoryId] ?? [];
  if (validSizes.length === 0) return;

  // Pick sizes: OneSize → 1, otherwise 5–8 weighted toward middle
  const isOneSize = validSizes.length === 1;
  const selectedSizes = isOneSize
    ? validSizes
    : pickWeightedSizes(validSizes, randInt(5, 8));

  // Random processing percentages (shared across all sizes for this item+drive)
  const salePct = randFloat(0.15, 0.30);
  const goPct = randFloat(0.05, 0.15);
  const transferPct = randFloat(0.15, 0.25);
  const disposalPct = randFloat(0.03, 0.08);
  // repurposePct is applied to the transferred amount
  const repurposePctOfTransferred = randFloat(0.50, 0.80);

  for (const sizeOpt of selectedSizes) {
    // Base donation qty: 5–15, scaled by year and category
    const baseDonation = randInt(5, 15);
    const donationQty = Math.max(1, Math.round(baseDonation * yearMult * catWeight));

    // Calculate downstream quantities (ensure they don't exceed donation)
    let saleQty = Math.round(donationQty * salePct);
    let goQty = Math.round(donationQty * goPct);
    let transferQty = Math.round(donationQty * transferPct);
    let disposalQty = Math.round(donationQty * disposalPct);

    // Clamp total outflows to not exceed donation
    const totalOut = saleQty + goQty + transferQty + disposalQty;
    if (totalOut > donationQty) {
      const scale = donationQty / totalOut;
      saleQty = Math.floor(saleQty * scale);
      goQty = Math.floor(goQty * scale);
      transferQty = Math.floor(transferQty * scale);
      disposalQty = Math.floor(disposalQty * scale);
    }

    const repurposeQty = Math.round(transferQty * repurposePctOfTransferred);

    // --- Date calculations ---
    const driveStart = driveDef.startDate;
    const driveEnd = driveDef.endDate;
    const donationDate = randomDateInRange(driveStart, driveEnd);
    const saleDate = addDays(driveEnd, randInt(14, 56));
    const goDate = addDays(driveEnd, randInt(7, 21));
    const transferDate = addDays(driveEnd, randInt(28, 70));
    const repurposeDate = addDays(transferDate, randInt(14, 42));
    const disposalDate = addDays(driveEnd, randInt(7, 28));

    // --- 1. DonationIn → ForSale @ School ---
    if (donationQty > 0) {
      allTransactions.push({
        fromStoredAt: null,
        toStoredAt: "School",
        fromStatus: null,
        toStatus: "ForSale",
        quantity: donationQty,
        transactionType: "DonationIn",
        transactionDate: donationDate,
        itemTypeId: itemType.id,
        sizeOptionId: sizeOpt.id,
        donationDriveId: drive.id,
        userId: staff.id,
        remarks: null,
      });
      adjustBalance(itemType.id, sizeOpt.id, "ForSale", "School", donationQty);
    }

    // --- 2. Sale → Sold @ Exited ---
    if (saleQty > 0) {
      allTransactions.push({
        fromStoredAt: "School",
        toStoredAt: "Exited",
        fromStatus: "ForSale",
        toStatus: "Sold",
        quantity: saleQty,
        transactionType: "Sale",
        transactionDate: saleDate,
        itemTypeId: itemType.id,
        sizeOptionId: sizeOpt.id,
        donationDriveId: drive.id,
        userId: staff.id,
        remarks: "Sold to students at uniform sale",
      });
      adjustBalance(itemType.id, sizeOpt.id, "ForSale", "School", -saleQty);
      adjustBalance(itemType.id, sizeOpt.id, "Sold", "Exited", saleQty);
    }

    // --- 3. StatusChange → GeneralOffice @ School ---
    if (goQty > 0) {
      allTransactions.push({
        fromStoredAt: "School",
        toStoredAt: "School",
        fromStatus: "ForSale",
        toStatus: "GeneralOffice",
        quantity: goQty,
        transactionType: "StatusChange",
        transactionDate: goDate,
        itemTypeId: itemType.id,
        sizeOptionId: sizeOpt.id,
        donationDriveId: drive.id,
        userId: staff.id,
        remarks: "Retained at General Office for student needs",
      });
      adjustBalance(itemType.id, sizeOpt.id, "ForSale", "School", -goQty);
      adjustBalance(itemType.id, sizeOpt.id, "GeneralOffice", "School", goQty);
    }

    // --- 4. Transfer → ForRepurpose @ TCC ---
    if (transferQty > 0) {
      allTransactions.push({
        fromStoredAt: "School",
        toStoredAt: "TCC",
        fromStatus: "ForSale",
        toStatus: "ForRepurpose",
        quantity: transferQty,
        transactionType: "Transfer",
        transactionDate: transferDate,
        itemTypeId: itemType.id,
        sizeOptionId: sizeOpt.id,
        donationDriveId: drive.id,
        userId: AdminUser.id,
        remarks: "Transferred to TCC for repurposing",
      });
      adjustBalance(itemType.id, sizeOpt.id, "ForSale", "School", -transferQty);
      adjustBalance(itemType.id, sizeOpt.id, "ForRepurpose", "TCC", transferQty);

      // --- 4b. Repurposing → Repurposed @ Exited ---
      if (repurposeQty > 0) {
        allTransactions.push({
          fromStoredAt: "TCC",
          toStoredAt: "Exited",
          fromStatus: "ForRepurpose",
          toStatus: "Repurposed",
          quantity: repurposeQty,
          transactionType: "Repurposing",
          transactionDate: repurposeDate,
          itemTypeId: itemType.id,
          sizeOptionId: sizeOpt.id,
          donationDriveId: drive.id,
          userId: AdminUser.id,
          remarks: pickRandom([
            "Converted to tote bags",
            "Repurposed into cleaning cloths",
            "Material used for craft workshop",
            "Upcycled into pencil cases",
          ]),
        });
        adjustBalance(itemType.id, sizeOpt.id, "ForRepurpose", "TCC", -repurposeQty);
        adjustBalance(itemType.id, sizeOpt.id, "Repurposed", "Exited", repurposeQty);
      }
    }

    // --- 5. Disposal → Disposed @ Exited ---
    if (disposalQty > 0) {
      allTransactions.push({
        fromStoredAt: "School",
        toStoredAt: "Exited",
        fromStatus: "ForSale",
        toStatus: "Disposed",
        quantity: disposalQty,
        transactionType: "Disposal",
        transactionDate: disposalDate,
        itemTypeId: itemType.id,
        sizeOptionId: sizeOpt.id,
        donationDriveId: drive.id,
        userId: staff.id,
        remarks: pickRandom([
          "Items too damaged for sale or repurpose",
          "Stained beyond recovery",
          "Fabric deteriorated — not suitable for reuse",
          "Failed quality check",
        ]),
      });
      adjustBalance(itemType.id, sizeOpt.id, "ForSale", "School", -disposalQty);
      adjustBalance(itemType.id, sizeOpt.id, "Disposed", "Exited", disposalQty);
    }
  }
}

// ==================== GENERATE: SCHOOL DRIVES ====================
for (const school of SCHOOL_NAMES) {
  const schoolItems = itemTypesBySchool[school] ?? [];
  const staff = schoolStaffMap[school];
  const short = schoolShortNames[school];

  // 3 drives per school
  const schoolDriveNames = [
    `${short} Mid-Year Collection 2023`,
    `${short} Year-End Drive 2024`,
    `${short} Term 1 Drive 2025`,
  ];

  for (const driveName of schoolDriveNames) {
    const drive = driveMap[driveName];
    const driveDef = driveDefs.find((d) => d.name === driveName)!;

    for (const { itemType, def } of schoolItems) {
      generateTransactionsForItem(itemType, def, driveDef, drive, staff);
    }
  }
}

// ==================== GENERATE: TCC COMMUNITY DRIVES ====================
const tccDriveNames = [
  "TCC Islandwide Collection 2023",
  "TCC Community Drive 2024",
  "TCC Community Drive 2025",
];

for (const driveName of tccDriveNames) {
  const drive = driveMap[driveName];
  const driveDef = driveDefs.find((d) => d.name === driveName)!;

  // Pick 6–8 random schools, sample 3–5 item types from each
  const sampledSchools = pickRandomN([...SCHOOL_NAMES], randInt(6, 8));

  for (const school of sampledSchools) {
    const schoolItems = itemTypesBySchool[school] ?? [];
    const sampledItems = pickRandomN(schoolItems, randInt(3, 5));

    for (const { itemType, def } of sampledItems) {
      // TCC drives get smaller quantities — we achieve this by using a modified def
      // We temporarily override category weight with ×0.3
      const origWeight = getCategoryWeight(def.categoryName);

      // Inline: generate with reduced quantities
      const year = driveYear(driveDef);
      const yearMult = YEAR_MULTIPLIER[year] ?? 1.0;
      const catWeight = origWeight * 0.3; // TCC community = smaller per-item volumes

      const validSizes = sizeOptionsByCat[itemType.sizeCategoryId] ?? [];
      if (validSizes.length === 0) continue;

      const isOneSize = validSizes.length === 1;
      const selectedSizes = isOneSize ? validSizes : pickWeightedSizes(validSizes, randInt(3, 5));

      const salePct = randFloat(0.10, 0.20);
      const goPct = randFloat(0.05, 0.10);
      const transferPct = randFloat(0.20, 0.35);
      const disposalPct = randFloat(0.03, 0.08);
      const repurposePctOfTransferred = randFloat(0.50, 0.80);

      for (const sizeOpt of selectedSizes) {
        const baseDonation = randInt(3, 10);
        const donationQty = Math.max(1, Math.round(baseDonation * yearMult * catWeight));

        let saleQty = Math.round(donationQty * salePct);
        let goQty = Math.round(donationQty * goPct);
        let transferQty = Math.round(donationQty * transferPct);
        let disposalQty = Math.round(donationQty * disposalPct);

        const totalOut = saleQty + goQty + transferQty + disposalQty;
        if (totalOut > donationQty) {
          const scale = donationQty / totalOut;
          saleQty = Math.floor(saleQty * scale);
          goQty = Math.floor(goQty * scale);
          transferQty = Math.floor(transferQty * scale);
          disposalQty = Math.floor(disposalQty * scale);
        }
        const repurposeQty = Math.round(transferQty * repurposePctOfTransferred);

        const driveStart = driveDef.startDate;
        const driveEnd = driveDef.endDate;
        const donationDate = randomDateInRange(driveStart, driveEnd);
        const saleDate = addDays(driveEnd, randInt(14, 56));
        const goDate = addDays(driveEnd, randInt(7, 21));
        const transferDate = addDays(driveEnd, randInt(28, 70));
        const repurposeDate = addDays(transferDate, randInt(14, 42));
        const disposalDate = addDays(driveEnd, randInt(7, 28));

        if (donationQty > 0) {
          allTransactions.push({
            fromStoredAt: null, toStoredAt: "School",
            fromStatus: null, toStatus: "ForSale",
            quantity: donationQty, transactionType: "DonationIn",
            transactionDate: donationDate,
            itemTypeId: itemType.id, sizeOptionId: sizeOpt.id,
            donationDriveId: drive.id, userId: AdminUser.id, remarks: "Community collection via TCC",
          });
          adjustBalance(itemType.id, sizeOpt.id, "ForSale", "School", donationQty);
        }
        if (saleQty > 0) {
          allTransactions.push({
            fromStoredAt: "School", toStoredAt: "Exited",
            fromStatus: "ForSale", toStatus: "Sold",
            quantity: saleQty, transactionType: "Sale",
            transactionDate: saleDate,
            itemTypeId: itemType.id, sizeOptionId: sizeOpt.id,
            donationDriveId: drive.id, userId: AdminUser.id, remarks: "Sold via TCC pop-up sale",
          });
          adjustBalance(itemType.id, sizeOpt.id, "ForSale", "School", -saleQty);
          adjustBalance(itemType.id, sizeOpt.id, "Sold", "Exited", saleQty);
        }
        if (goQty > 0) {
          allTransactions.push({
            fromStoredAt: "School", toStoredAt: "School",
            fromStatus: "ForSale", toStatus: "GeneralOffice",
            quantity: goQty, transactionType: "StatusChange",
            transactionDate: goDate,
            itemTypeId: itemType.id, sizeOptionId: sizeOpt.id,
            donationDriveId: drive.id, userId: AdminUser.id, remarks: "Set aside for General Office",
          });
          adjustBalance(itemType.id, sizeOpt.id, "ForSale", "School", -goQty);
          adjustBalance(itemType.id, sizeOpt.id, "GeneralOffice", "School", goQty);
        }
        if (transferQty > 0) {
          allTransactions.push({
            fromStoredAt: "School", toStoredAt: "TCC",
            fromStatus: "ForSale", toStatus: "ForRepurpose",
            quantity: transferQty, transactionType: "Transfer",
            transactionDate: transferDate,
            itemTypeId: itemType.id, sizeOptionId: sizeOpt.id,
            donationDriveId: drive.id, userId: AdminUser.id, remarks: "Transferred to TCC for repurposing",
          });
          adjustBalance(itemType.id, sizeOpt.id, "ForSale", "School", -transferQty);
          adjustBalance(itemType.id, sizeOpt.id, "ForRepurpose", "TCC", transferQty);

          if (repurposeQty > 0) {
            allTransactions.push({
              fromStoredAt: "TCC", toStoredAt: "Exited",
              fromStatus: "ForRepurpose", toStatus: "Repurposed",
              quantity: repurposeQty, transactionType: "Repurposing",
              transactionDate: repurposeDate,
              itemTypeId: itemType.id, sizeOptionId: sizeOpt.id,
              donationDriveId: drive.id, userId: AdminUser.id,
              remarks: pickRandom(["Converted to tote bags", "Upcycled into craft items", "Repurposed into cleaning cloths"]),
            });
            adjustBalance(itemType.id, sizeOpt.id, "ForRepurpose", "TCC", -repurposeQty);
            adjustBalance(itemType.id, sizeOpt.id, "Repurposed", "Exited", repurposeQty);
          }
        }
        if (disposalQty > 0) {
          allTransactions.push({
            fromStoredAt: "School", toStoredAt: "Exited",
            fromStatus: "ForSale", toStatus: "Disposed",
            quantity: disposalQty, transactionType: "Disposal",
            transactionDate: disposalDate,
            itemTypeId: itemType.id, sizeOptionId: sizeOpt.id,
            donationDriveId: drive.id, userId: AdminUser.id,
            remarks: "Items too damaged for reuse",
          });
          adjustBalance(itemType.id, sizeOpt.id, "ForSale", "School", -disposalQty);
          adjustBalance(itemType.id, sizeOpt.id, "Disposed", "Exited", disposalQty);
        }
      }
    }
  }
}

// ==================== BULK INSERT TRANSACTIONS ====================
console.log(`   Inserting ${allTransactions.length} transactions...`);

// Prisma createMany with skipDuplicates for safety
// Batch in chunks of 500 to avoid query size limits
const TXN_BATCH_SIZE = 500;
for (let i = 0; i < allTransactions.length; i += TXN_BATCH_SIZE) {
  const batch = allTransactions.slice(i, i + TXN_BATCH_SIZE);
  await prisma.transaction.createMany({ data: batch, skipDuplicates: true });
}
console.log(`   ✅ Inserted ${allTransactions.length} transactions.`);

// ==================== DERIVE & INSERT INVENTORY BALANCES ====================
console.log("📦 Computing inventory balances from transactions...");

const balanceData: {
  itemTypeId: number;
  sizeOptionId: number;
  itemStatus: string;
  storedAt: string;
  quantity: number;
}[] = [];

for (const [key, qty] of balanceAccumulator.entries()) {
  if (qty <= 0) continue; // Skip zero or negative balances
  const [itemTypeId, sizeOptionId, status, location] = key.split("-");
  balanceData.push({
    itemTypeId: parseInt(itemTypeId),
    sizeOptionId: parseInt(sizeOptionId),
    itemStatus: status,
    storedAt: location,
    quantity: qty,
  });
}

// Batch insert balances
const BAL_BATCH_SIZE = 500;
for (let i = 0; i < balanceData.length; i += BAL_BATCH_SIZE) {
  const batch = balanceData.slice(i, i + BAL_BATCH_SIZE);
  await prisma.inventoryBalance.createMany({ data: batch, skipDuplicates: true });
}

console.log(`   ✅ Created ${balanceData.length} inventory balance rows.`);

// Summary stats
const statusCounts: Record<string, number> = {};
for (const b of balanceData) {
  statusCounts[b.itemStatus] = (statusCounts[b.itemStatus] ?? 0) + b.quantity;
}
console.log("   Balance summary by status:");
for (const [status, total] of Object.entries(statusCounts).sort()) {
  console.log(`     ${status}: ${total} units`);
}

// ==================== ITEM TYPE TAGS ====================
console.log("🔗 Seeding item type tags...");

await prisma.itemTypeTag.createMany({
  data: [
    // Christmas — green items
    { itemTypeId: getItemTypeId("ST. PATRICK'S SCHOOL", "PE Shirt", "White", "Green"), tagId: tagMap["Christmas"] },
    { itemTypeId: getItemTypeId("CHIJ KATONG CONVENT", "PE Shirt", "Green", "White"), tagId: tagMap["Christmas"] },
    { itemTypeId: getItemTypeId("ZHENGHUA PRIMARY SCHOOL", "PE Shirt", "Green", "White"), tagId: tagMap["Christmas"] },
    { itemTypeId: getItemTypeId("ST. PATRICK'S SCHOOL", "Tie", "Green", "Blue"), tagId: tagMap["Christmas"] },
    
    // Cute — yellow/bright house shirts
    { itemTypeId: getItemTypeId("VICTORIA SCHOOL", "House Shirt", "Yellow", "White"), tagId: tagMap["Cute"] },
    { itemTypeId: getItemTypeId("BROADRICK SECONDARY SCHOOL", "House Shirt", "Yellow", "White"), tagId: tagMap["Cute"] },
    { itemTypeId: getItemTypeId("CHANGKAT PRIMARY SCHOOL", "House Shirt", "Yellow", "White"), tagId: tagMap["Cute"] },
    
    // CNY — red items
    { itemTypeId: getItemTypeId("VICTORIA SCHOOL", "House Shirt", "Red", "White"), tagId: tagMap["CNY"] },
    { itemTypeId: getItemTypeId("NATIONAL JUNIOR COLLEGE", "PE Shirt", "White", "Red"), tagId: tagMap["CNY"] },
    { itemTypeId: getItemTypeId("TAMPINES MERIDIAN JUNIOR COLLEGE", "PE Shirt", "Red", "Silver"), tagId: tagMap["CNY"] },
    { itemTypeId: getItemTypeId("BROADRICK SECONDARY SCHOOL", "House Shirt", "Red", "White"), tagId: tagMap["CNY"] },
  ],
});
console.log("   Created item type tags.");

/**
 * ============================================================
 * TIER 4 — Product Types, Styles, Products, Recipes & Ingredients
 * ============================================================
 *
 * Prerequisites (from earlier tiers):
 *   - schoolMap: Record<string, number>   (schoolName → school.id)
 *   - prisma: PrismaClient instance
 *   - ItemTypes already seeded for all 12 schools
 *   - ItemCategories already seeded
 *
 * This section creates:
 *   - 21 ProductTypes
 *   - 2 Styles (Simple, Boxed Bottom)
 *   - 21 Products per school (× 12 schools = 252 products)
 *   - ProductStyles, ProductRecipes, RecipeIngredients
 *   - Skirt/Pants variants for secondary schools
 */

// ────────────────────────────────────────────────────────────
// 1. CONSTANTS & TYPES
// ────────────────────────────────────────────────────────────

interface OptionDef {
  shirt: number;
  shorts: number;
  skirtPants: number;
  peTshirt: number;
  peShorts: number;
}

interface ProductDef {
  name: string;
  productTypeName: string;
  styleName: string;
  options: [OptionDef, OptionDef, OptionDef];
}

const PRIMARY_SCHOOLS = new Set([
  "ANGLO-CHINESE SCHOOL (PRIMARY)",
  "CHANGKAT PRIMARY SCHOOL",
  "BUKIT TIMAH PRIMARY SCHOOL",
  "ST. STEPHEN'S SCHOOL",
  "ZHENGHUA PRIMARY SCHOOL",
]);

// Column → ItemCategory mapping (excluding skirtPants which has special handling)
const COLUMN_TO_CATEGORY: Record<string, string> = {
  shirt: "Uniform Shirt",
  shorts: "Uniform Shorts",
  peTshirt: "PE Shirt",
  peShorts: "PE Shorts",
};

// ────────────────────────────────────────────────────────────
// 2. PRODUCT DATA (parsed from TCC spreadsheets)
// ────────────────────────────────────────────────────────────

// Primary school product recipes
const PRIMARY_PRODUCTS: ProductDef[] = [
  {
    name: "Pencil Case", productTypeName: "Pencil Case", styleName: "Simple",
    options: [
      { shirt: 1, shorts: 1, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 1, shorts: 1, skirtPants: 0, peTshirt: 0.5, peShorts: 1 },
      { shirt: 1, shorts: 0, skirtPants: 0.5, peTshirt: 1, peShorts: 0 },
    ],
  },
  {
    name: "Tote Bag", productTypeName: "Tote Bag", styleName: "Simple",
    options: [
      { shirt: 2, shorts: 0, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 2, shorts: 0, skirtPants: 0.5, peTshirt: 0, peShorts: 1 },
      { shirt: 2, shorts: 0, skirtPants: 1, peTshirt: 0, peShorts: 0 },
    ],
  },
  {
    name: "Tote Bag", productTypeName: "Tote Bag", styleName: "Boxed Bottom",
    options: [
      { shirt: 2, shorts: 0, skirtPants: 1, peTshirt: 1, peShorts: 0 },
      { shirt: 2, shorts: 0, skirtPants: 1, peTshirt: 0, peShorts: 1 },
      { shirt: 2, shorts: 0, skirtPants: 1, peTshirt: 1, peShorts: 0 },
    ],
  },
  {
    name: "Shoe Bag", productTypeName: "Shoe Bag", styleName: "Simple",
    options: [
      { shirt: 3, shorts: 0, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 3, shorts: 0, skirtPants: 1, peTshirt: 0, peShorts: 1 },
      { shirt: 1, shorts: 0, skirtPants: 2, peTshirt: 0, peShorts: 0 },
    ],
  },
  {
    name: "Laptop Sleeve", productTypeName: "Laptop Sleeve", styleName: "Simple",
    options: [
      { shirt: 2, shorts: 0.25, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 2, shorts: 0, skirtPants: 1, peTshirt: 0.25, peShorts: 1 },
      { shirt: 2, shorts: 0, skirtPants: 1, peTshirt: 0.5, peShorts: 0 },
    ],
  },
  {
    name: "iPad Sleeve", productTypeName: "iPad Sleeve", styleName: "Simple",
    options: [
      { shirt: 2, shorts: 0, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 1, shorts: 0, skirtPants: 1, peTshirt: 0, peShorts: 1 },
      { shirt: 1, shorts: 0, skirtPants: 1, peTshirt: 0, peShorts: 0 },
    ],
  },
  {
    name: "Apron", productTypeName: "Apron", styleName: "Simple",
    options: [
      { shirt: 0, shorts: 0, skirtPants: 2, peTshirt: 1, peShorts: 0 },
      { shirt: 0, shorts: 0, skirtPants: 2, peTshirt: 0, peShorts: 1 },
      { shirt: 1, shorts: 0, skirtPants: 2, peTshirt: 0, peShorts: 0 },
    ],
  },
  {
    name: "Backpack", productTypeName: "Backpack", styleName: "Simple",
    options: [
      { shirt: 2, shorts: 1, skirtPants: 1, peTshirt: 1, peShorts: 0 },
      { shirt: 2, shorts: 1, skirtPants: 2, peTshirt: 0, peShorts: 1 },
      { shirt: 2, shorts: 0, skirtPants: 1, peTshirt: 1, peShorts: 0 },
    ],
  },
  {
    name: "Key Chain", productTypeName: "Key Chain", styleName: "Simple",
    options: [
      { shirt: 0, shorts: 0, skirtPants: 0.25, peTshirt: 0, peShorts: 1 },
      { shirt: 0, shorts: 0, skirtPants: 0, peTshirt: 0.25, peShorts: 1 },
      { shirt: 1, shorts: 0, skirtPants: 0, peTshirt: 0, peShorts: 0 },
    ],
  },
  {
    name: "Cutlery Holder", productTypeName: "Cutlery Holder", styleName: "Simple",
    options: [
      { shirt: 0, shorts: 0, skirtPants: 0.5, peTshirt: 1, peShorts: 0 },
      { shirt: 0, shorts: 0.5, skirtPants: 0, peTshirt: 0.5, peShorts: 1 },
      { shirt: 1, shorts: 0.5, skirtPants: 0, peTshirt: 0, peShorts: 0 },
    ],
  },
  {
    name: "Stationery Holder", productTypeName: "Stationery Holder", styleName: "Simple",
    options: [
      { shirt: 0, shorts: 1, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 0, shorts: 1, skirtPants: 0, peTshirt: 0, peShorts: 1 },
      { shirt: 1, shorts: 0.5, skirtPants: 0, peTshirt: 0, peShorts: 0 },
    ],
  },
  {
    name: "Accordion Pouch", productTypeName: "Accordion Pouch", styleName: "Simple",
    options: [
      { shirt: 1, shorts: 0, skirtPants: 0.5, peTshirt: 1, peShorts: 0 },
      { shirt: 1, shorts: 0, skirtPants: 0.5, peTshirt: 0, peShorts: 1 },
      { shirt: 1, shorts: 0, skirtPants: 0.5, peTshirt: 0, peShorts: 0 },
    ],
  },
  {
    name: "Big Box Pouch", productTypeName: "Big Box Pouch", styleName: "Simple",
    options: [
      { shirt: 2, shorts: 0, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 2, shorts: 0, skirtPants: 0.5, peTshirt: 0, peShorts: 1 },
      { shirt: 2, shorts: 0, skirtPants: 0, peTshirt: 1, peShorts: 0 },
    ],
  },
  {
    name: "Small Box Pouch", productTypeName: "Small Box Pouch", styleName: "Simple",
    options: [
      { shirt: 2, shorts: 0, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 1, shorts: 0, skirtPants: 0.5, peTshirt: 0, peShorts: 1 },
      { shirt: 2, shorts: 0, skirtPants: 0, peTshirt: 1, peShorts: 0 },
    ],
  },
  {
    name: "Multi Purpose Pouch", productTypeName: "Multi Purpose Pouch", styleName: "Simple",
    options: [
      { shirt: 2, shorts: 0, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 1, shorts: 0, skirtPants: 0.5, peTshirt: 0, peShorts: 1 },
      { shirt: 2, shorts: 0, skirtPants: 0, peTshirt: 1, peShorts: 0 },
    ],
  },
  {
    name: "Phone Sling Bag", productTypeName: "Phone Sling Bag", styleName: "Simple",
    options: [
      { shirt: 1, shorts: 0.5, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 1, shorts: 0.5, skirtPants: 0.25, peTshirt: 0, peShorts: 1 },
      { shirt: 1, shorts: 0.5, skirtPants: 0, peTshirt: 0.25, peShorts: 0 },
    ],
  },
  {
    name: "Art Brush Roll Up", productTypeName: "Art Brush Roll Up", styleName: "Simple",
    options: [
      { shirt: 1, shorts: 0, skirtPants: 0.5, peTshirt: 1, peShorts: 0 },
      { shirt: 0, shorts: 0, skirtPants: 1, peTshirt: 1, peShorts: 1 },
      { shirt: 1, shorts: 0, skirtPants: 1, peTshirt: 0, peShorts: 0 },
    ],
  },
  {
    name: "Drawstring Bag", productTypeName: "Drawstring Bag", styleName: "Simple",
    options: [
      { shirt: 0.5, shorts: 1, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 0.5, shorts: 1, skirtPants: 0, peTshirt: 0, peShorts: 1 },
      { shirt: 1, shorts: 0.5, skirtPants: 0, peTshirt: 0, peShorts: 0 },
    ],
  },
  {
    name: "Owl", productTypeName: "Owl", styleName: "Simple",
    options: [
      { shirt: 0, shorts: 0.25, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 0, shorts: 0.25, skirtPants: 0, peTshirt: 0, peShorts: 1 },
      { shirt: 1, shorts: 0.25, skirtPants: 0, peTshirt: 0, peShorts: 0 },
    ],
  },
  {
    name: "Fish Drawstring Bag", productTypeName: "Fish Drawstring Bag", styleName: "Simple",
    options: [
      { shirt: 1, shorts: 0.5, skirtPants: 0, peTshirt: 1, peShorts: 1 },
      { shirt: 1, shorts: 0.5, skirtPants: 0, peTshirt: 0.5, peShorts: 1 },
      { shirt: 1, shorts: 0.5, skirtPants: 0, peTshirt: 0.5, peShorts: 0 },
    ],
  },
  {
    name: "Lunch Bag", productTypeName: "Lunch Bag", styleName: "Simple",
    options: [
      { shirt: 2, shorts: 0, skirtPants: 0.5, peTshirt: 1, peShorts: 0 },
      { shirt: 2, shorts: 0, skirtPants: 0.5, peTshirt: 0.5, peShorts: 1 },
      { shirt: 2, shorts: 0, skirtPants: 1, peTshirt: 0, peShorts: 0 },
    ],
  },
  {
    name: "Bucket Hat", productTypeName: "Bucket Hat", styleName: "Simple",
    options: [
      { shirt: 1, shorts: 0, skirtPants: 1, peTshirt: 1, peShorts: 0 },
      { shirt: 1, shorts: 0, skirtPants: 1, peTshirt: 0, peShorts: 1 },
      { shirt: 1, shorts: 0, skirtPants: 1, peTshirt: 0, peShorts: 0 },
    ],
  },
];

// Secondary school product recipes (different quantities from primary)
const SECONDARY_PRODUCTS: ProductDef[] = [
  {
    name: "Pencil Case", productTypeName: "Pencil Case", styleName: "Simple",
    options: [
      { shirt: 0.5, shorts: 0.5, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 0.5, shorts: 0.25, skirtPants: 0, peTshirt: 0.5, peShorts: 1 },
      { shirt: 1, shorts: 0, skirtPants: 0.25, peTshirt: 0.25, peShorts: 0 },
    ],
  },
  {
    name: "Tote Bag", productTypeName: "Tote Bag", styleName: "Simple",
    options: [
      { shirt: 1, shorts: 0, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 2, shorts: 0, skirtPants: 0.5, peTshirt: 0, peShorts: 1 },
      { shirt: 1, shorts: 0, skirtPants: 1, peTshirt: 0, peShorts: 0 },
    ],
  },
  {
    name: "Tote Bag", productTypeName: "Tote Bag", styleName: "Boxed Bottom",
    options: [
      { shirt: 2, shorts: 0, skirtPants: 1, peTshirt: 1, peShorts: 0 },
      { shirt: 2, shorts: 0, skirtPants: 1, peTshirt: 0, peShorts: 1 },
      { shirt: 2, shorts: 0, skirtPants: 1, peTshirt: 1, peShorts: 0 },
    ],
  },
  {
    name: "Shoe Bag", productTypeName: "Shoe Bag", styleName: "Simple",
    options: [
      { shirt: 3, shorts: 0, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 3, shorts: 0, skirtPants: 1, peTshirt: 0, peShorts: 1 },
      { shirt: 1, shorts: 0, skirtPants: 2, peTshirt: 0, peShorts: 0 },
    ],
  },
  {
    name: "Laptop Sleeve", productTypeName: "Laptop Sleeve", styleName: "Simple",
    options: [
      { shirt: 2, shorts: 0.25, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 2, shorts: 0, skirtPants: 1, peTshirt: 0.25, peShorts: 1 },
      { shirt: 2, shorts: 0, skirtPants: 1, peTshirt: 0.5, peShorts: 0 },
    ],
  },
  {
    name: "iPad Sleeve", productTypeName: "iPad Sleeve", styleName: "Simple",
    options: [
      { shirt: 1, shorts: 0, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 1, shorts: 0, skirtPants: 0.5, peTshirt: 0, peShorts: 1 },
      { shirt: 1, shorts: 0, skirtPants: 1, peTshirt: 0, peShorts: 0 },
    ],
  },
  {
    name: "Apron", productTypeName: "Apron", styleName: "Simple",
    options: [
      { shirt: 0, shorts: 0, skirtPants: 2, peTshirt: 1, peShorts: 0 },
      { shirt: 0, shorts: 0, skirtPants: 2, peTshirt: 0, peShorts: 1 },
      { shirt: 1, shorts: 0, skirtPants: 2, peTshirt: 0, peShorts: 0 },
    ],
  },
  {
    name: "Backpack", productTypeName: "Backpack", styleName: "Simple",
    options: [
      { shirt: 2, shorts: 1, skirtPants: 1, peTshirt: 1, peShorts: 0 },
      { shirt: 2, shorts: 1, skirtPants: 1, peTshirt: 0, peShorts: 1 },
      { shirt: 2, shorts: 0, skirtPants: 1, peTshirt: 1, peShorts: 0 },
    ],
  },
  {
    name: "Key Chain", productTypeName: "Key Chain", styleName: "Simple",
    options: [
      { shirt: 0, shorts: 0, skirtPants: 0.25, peTshirt: 0, peShorts: 1 },
      { shirt: 0, shorts: 0, skirtPants: 0, peTshirt: 0.25, peShorts: 1 },
      { shirt: 1, shorts: 0, skirtPants: 0, peTshirt: 0, peShorts: 0 },
    ],
  },
  {
    name: "Cutlery Holder", productTypeName: "Cutlery Holder", styleName: "Simple",
    options: [
      { shirt: 0, shorts: 0, skirtPants: 0.25, peTshirt: 1, peShorts: 0 },
      { shirt: 0, shorts: 0.5, skirtPants: 0, peTshirt: 0.5, peShorts: 1 },
      { shirt: 1, shorts: 0.5, skirtPants: 0, peTshirt: 0, peShorts: 0 },
    ],
  },
  {
    name: "Stationery Holder", productTypeName: "Stationery Holder", styleName: "Simple",
    options: [
      { shirt: 0, shorts: 0.5, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 0, shorts: 0.5, skirtPants: 0, peTshirt: 0, peShorts: 1 },
      { shirt: 1, shorts: 0.5, skirtPants: 0, peTshirt: 0, peShorts: 0 },
    ],
  },
  {
    name: "Accordion Pouch", productTypeName: "Accordion Pouch", styleName: "Simple",
    options: [
      { shirt: 1, shorts: 0, skirtPants: 0.5, peTshirt: 1, peShorts: 0 },
      { shirt: 1, shorts: 0, skirtPants: 0.5, peTshirt: 0, peShorts: 1 },
      { shirt: 1, shorts: 0, skirtPants: 0.5, peTshirt: 0, peShorts: 0 },
    ],
  },
  {
    name: "Big Box Pouch", productTypeName: "Big Box Pouch", styleName: "Simple",
    options: [
      { shirt: 2, shorts: 0, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 1, shorts: 0, skirtPants: 0.5, peTshirt: 0, peShorts: 1 },
      { shirt: 2, shorts: 0, skirtPants: 0, peTshirt: 1, peShorts: 0 },
    ],
  },
  {
    name: "Small Box Pouch", productTypeName: "Small Box Pouch", styleName: "Simple",
    options: [
      { shirt: 2, shorts: 0, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 1, shorts: 0, skirtPants: 0.5, peTshirt: 0, peShorts: 1 },
      { shirt: 2, shorts: 0, skirtPants: 0, peTshirt: 1, peShorts: 0 },
    ],
  },
  {
    name: "Multi Purpose Pouch", productTypeName: "Multi Purpose Pouch", styleName: "Simple",
    options: [
      { shirt: 2, shorts: 0, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 1, shorts: 0, skirtPants: 0.5, peTshirt: 0, peShorts: 1 },
      { shirt: 2, shorts: 0, skirtPants: 0, peTshirt: 1, peShorts: 0 },
    ],
  },
  {
    name: "Phone Sling Bag", productTypeName: "Phone Sling Bag", styleName: "Simple",
    options: [
      { shirt: 1, shorts: 0.5, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 1, shorts: 0.5, skirtPants: 0.25, peTshirt: 0, peShorts: 1 },
      { shirt: 1, shorts: 0.5, skirtPants: 0, peTshirt: 0.25, peShorts: 0 },
    ],
  },
  {
    name: "Art Brush Roll Up", productTypeName: "Art Brush Roll Up", styleName: "Simple",
    options: [
      { shirt: 1, shorts: 0, skirtPants: 0.5, peTshirt: 1, peShorts: 0 },
      { shirt: 0, shorts: 0, skirtPants: 1, peTshirt: 1, peShorts: 1 },
      { shirt: 1, shorts: 0, skirtPants: 1, peTshirt: 0, peShorts: 0 },
    ],
  },
  {
    name: "Drawstring Bag", productTypeName: "Drawstring Bag", styleName: "Simple",
    options: [
      { shirt: 0.5, shorts: 1, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 0.5, shorts: 1, skirtPants: 0, peTshirt: 0, peShorts: 1 },
      { shirt: 1, shorts: 0.5, skirtPants: 0, peTshirt: 0, peShorts: 0 },
    ],
  },
  {
    name: "Owl", productTypeName: "Owl", styleName: "Simple",
    options: [
      { shirt: 0, shorts: 0.25, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 0, shorts: 0.25, skirtPants: 0, peTshirt: 0, peShorts: 1 },
      { shirt: 1, shorts: 0.25, skirtPants: 0, peTshirt: 0, peShorts: 0 },
    ],
  },
  {
    name: "Fish Drawstring Bag", productTypeName: "Fish Drawstring Bag", styleName: "Simple",
    options: [
      { shirt: 1, shorts: 0.5, skirtPants: 0, peTshirt: 1, peShorts: 0 },
      { shirt: 1, shorts: 0.5, skirtPants: 0, peTshirt: 0.5, peShorts: 1 },
      { shirt: 1, shorts: 0.5, skirtPants: 0, peTshirt: 0.5, peShorts: 0 },
    ],
  },
  {
    name: "Lunch Bag", productTypeName: "Lunch Bag", styleName: "Simple",
    options: [
      { shirt: 2, shorts: 0, skirtPants: 0.5, peTshirt: 1, peShorts: 0 },
      { shirt: 2, shorts: 0, skirtPants: 0.5, peTshirt: 0.5, peShorts: 1 },
      { shirt: 2, shorts: 0, skirtPants: 1, peTshirt: 0, peShorts: 0 },
    ],
  },
  {
    name: "Bucket Hat", productTypeName: "Bucket Hat", styleName: "Simple",
    options: [
      { shirt: 1, shorts: 0, skirtPants: 1, peTshirt: 1, peShorts: 0 },
      { shirt: 1, shorts: 0, skirtPants: 1, peTshirt: 0, peShorts: 1 },
      { shirt: 1, shorts: 0, skirtPants: 1, peTshirt: 0, peShorts: 0 },
    ],
  },
];

// ────────────────────────────────────────────────────────────
// 3. SEED LOGIC (paste into your main seed function)
// ────────────────────────────────────────────────────────────

console.log("🎒 Seeding products & recipes...");

// ── 3a. Product Types ──
const productTypeNames = [
  ...new Set([
    ...PRIMARY_PRODUCTS.map((p) => p.productTypeName),
    ...SECONDARY_PRODUCTS.map((p) => p.productTypeName),
  ]),
];
const productTypes = await Promise.all(
  productTypeNames.map((pt) =>
    prisma.productType.create({ data: { typeName: pt } })
  )
);
const ptMap = Object.fromEntries(
  productTypes.map((pt) => [pt.typeName, pt.id])
);
console.log(`   Created ${productTypes.length} product types.`);

// ── 3b. Styles ──
const styleNames = ["Simple", "Boxed Bottom"];
const styles = await Promise.all(
  styleNames.map((s) => prisma.style.create({ data: { styleName: s } }))
);
const styleMap = Object.fromEntries(
  styles.map((s) => [s.styleName, s.id])
);
console.log(`   Created ${styles.length} styles.`);

// ── 3c. Build ItemType lookup ──
// Key: "SCHOOL_NAME::CATEGORY_NAME" → itemType.id
// Adjust the `include` if your relation names differ
const allItemTypes = await prisma.itemType.findMany({
  include: { school: true, category: true },
});
const itemTypeLookup = new Map<string, number>();
for (const it of allItemTypes) {
  const key = `${it.school.schoolName}::${it.category.categoryName}`;
  itemTypeLookup.set(key, it.id);
}

/**
 * Resolve an ingredient column + school into itemType ID(s).
 * Returns array because skirtPants may resolve to multiple variants.
 */
function resolveItemTypeIds(
  column: string,
  qty: number,
  schoolName: string,
  isPrimary: boolean
): { categoryName: string; itemTypeId: number; qty: number }[] {
  if (qty === 0) return [];

  // Standard columns (shirt, shorts, peTshirt, peShorts)
  if (column !== "skirtPants") {
    const categoryName = COLUMN_TO_CATEGORY[column];
    const id = itemTypeLookup.get(`${schoolName}::${categoryName}`);
    if (!id) {
      // School doesn't have this item type — skip silently
      return [];
    }
    return [{ categoryName, itemTypeId: id, qty }];
  }

  // ── skirtPants handling ──
  if (isPrimary) {
    // Primary: map directly to Uniform Skirt
    const id = itemTypeLookup.get(`${schoolName}::Uniform Skirt`);
    return id ? [{ categoryName: "Uniform Skirt", itemTypeId: id, qty }] : [];
  }

  // Secondary/JC: generate variants for whichever the school has
  const results: { categoryName: string; itemTypeId: number; qty: number }[] = [];
  const skirtId = itemTypeLookup.get(`${schoolName}::Uniform Skirt`);
  const pantsId = itemTypeLookup.get(`${schoolName}::Uniform Pants`);
  if (skirtId) results.push({ categoryName: "Uniform Skirt", itemTypeId: skirtId, qty });
  if (pantsId) results.push({ categoryName: "Uniform Pants", itemTypeId: pantsId, qty });
  return results;
}

// ── 3d. Create Products, Styles, Recipes & Ingredients per school ──

let totalProducts = 0;
let totalRecipes = 0;
let totalIngredients = 0;

for (const schoolName of SCHOOL_NAMES) {
  const isPrimary = PRIMARY_SCHOOLS.has(schoolName);
  const productDefs = isPrimary ? PRIMARY_PRODUCTS : SECONDARY_PRODUCTS;
  const schoolId = schoolMap[schoolName];
  const initials = SCHOOL_INITIALS[schoolName];

  // Group by productTypeName to handle Tote Bag (which appears twice: Simple + Boxed Bottom)
  // We create ONE Product per productType per school, then multiple ProductStyles on it
  const byProductType = new Map<string, ProductDef[]>();
  for (const pDef of productDefs) {
    const existing = byProductType.get(pDef.productTypeName) ?? [];
    existing.push(pDef);
    byProductType.set(pDef.productTypeName, existing);
  }

  for (const [productTypeName, styleDefs] of byProductType) {
    // Create the Product (one per type per school)
    const product = await prisma.product.create({
      data: {
        productName: productTypeName,
        productTypeId: ptMap[productTypeName],
        schoolId,
      },
    });
    totalProducts++;

    // For each style variant of this product type
    for (const sDef of styleDefs) {
      const productStyle = await prisma.productStyle.create({
        data: {
          productId: product.id,
          styleId: styleMap[sDef.styleName],
        },
      });

      // Determine if any option has a skirtPants ingredient
      // that would generate multiple variants for this school
      const hasSkirtPantsVariants =
        !isPrimary &&
        sDef.options.some((opt) => opt.skirtPants > 0) &&
        !!itemTypeLookup.get(`${schoolName}::Uniform Skirt`) &&
        !!itemTypeLookup.get(`${schoolName}::Uniform Pants`);

      for (let optIdx = 0; optIdx < 3; optIdx++) {
        const opt = sDef.options[optIdx];
        const optNum = optIdx + 1;

        if (hasSkirtPantsVariants && opt.skirtPants > 0) {
          // Create TWO recipes: one with Skirt, one with Pants
          for (const variant of ["Skirt", "Pants"] as const) {
            const categoryName = variant === "Skirt" ? "Uniform Skirt" : "Uniform Pants";
            const variantItemTypeId = itemTypeLookup.get(`${schoolName}::${categoryName}`)!;

            const recipe = await prisma.productRecipe.create({
              data: {
                recipeName: `${initials} - ${productTypeName} - ${sDef.styleName} Recipe ${optNum} (${variant})`,
                productStyleId: productStyle.id,
              },
            });
            totalRecipes++;

            // Build all ingredients for this recipe
            const ingredients: { recipeId: number; itemTypeId: number; quantityRequired: number }[] = [];

            // Standard columns
            for (const col of ["shirt", "shorts", "peTshirt", "peShorts"] as const) {
              const colQty = opt[col];
              if (colQty === 0) continue;
              const catName = COLUMN_TO_CATEGORY[col];
              const itId = itemTypeLookup.get(`${schoolName}::${catName}`);
              if (!itId) continue;
              ingredients.push({ recipeId: recipe.id, itemTypeId: itId, quantityRequired: colQty });
            }

            // SkirtPants → use the specific variant
            ingredients.push({
              recipeId: recipe.id,
              itemTypeId: variantItemTypeId,
              quantityRequired: opt.skirtPants,
            });

            if (ingredients.length > 0) {
              await prisma.recipeIngredient.createMany({ data: ingredients });
              totalIngredients += ingredients.length;
            }
          }
        } else {
          // Standard: single recipe for this option
          const recipe = await prisma.productRecipe.create({
            data: {
              recipeName: `${initials} - ${productTypeName} - ${sDef.styleName} Recipe ${optNum}`,
              productStyleId: productStyle.id,
            },
          });
          totalRecipes++;

          const ingredients: { recipeId: number; itemTypeId: number; quantityRequired: number }[] = [];

          // Standard columns
          for (const col of ["shirt", "shorts", "peTshirt", "peShorts"] as const) {
            const colQty = opt[col];
            if (colQty === 0) continue;
            const catName = COLUMN_TO_CATEGORY[col];
            const itId = itemTypeLookup.get(`${schoolName}::${catName}`);
            if (!itId) continue;
            ingredients.push({ recipeId: recipe.id, itemTypeId: itId, quantityRequired: colQty });
          }

          // SkirtPants → resolve to whatever the school has (single variant)
          if (opt.skirtPants > 0) {
            const resolved = resolveItemTypeIds("skirtPants", opt.skirtPants, schoolName, isPrimary);
            // For single-variant case, take the first match only
            if (resolved.length > 0) {
              ingredients.push({
                recipeId: recipe.id,
                itemTypeId: resolved[0].itemTypeId,
                quantityRequired: resolved[0].qty,
              });
            }
          }

          if (ingredients.length > 0) {
            await prisma.recipeIngredient.createMany({ data: ingredients });
            totalIngredients += ingredients.length;
          }
        }
      }
    }
  }
}

console.log(`   Created ${totalProducts} products, ${totalRecipes} recipes, ${totalIngredients} ingredients across ${SCHOOL_NAMES.length} schools.`);

  // ============================================================
  // DONE
  // ============================================================
  console.log("\n🎉 Seed completed successfully!");
}

main()
  .then(async () => {
    await prisma.$disconnect();
  })
  .catch(async (e) => {
    console.error("❌ Seed failed:", e);
    await prisma.$disconnect();
    process.exit(1);
  });