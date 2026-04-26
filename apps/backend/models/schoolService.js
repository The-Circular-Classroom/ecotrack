const prisma = require('../services/database/prismaClient');

// GET -- Get all schools
async function getAllSchools() {
    return prisma.school.findMany({
        where: {
            status: "active"
        },
        select: {
            id: true,
            schoolName: true,
            isCooperating: true,
        },
        orderBy: { schoolName: 'asc' }
    });
}

async function createSchool({
    school_name,
    address,
    mrt_desc,
    dgp_code,
    mainlevel_code,
    nature_code,
    type_code,
    postal_code,
    zone_code,
    status,
    is_cooperating,
    logo_url,
    school_email,
    school_number
}) {
    return prisma.school.create({
        data: {
            schoolName: school_name,
            address: address,
            mrtDesc: mrt_desc,
            dgpCode: dgp_code,
            mainlevelCode: mainlevel_code,
            natureCode: nature_code,
            typeCode: type_code,
            postalCode: postal_code,
            zoneCode: zone_code,
            status: status,
            isCooperating: is_cooperating,
            logoUrl: logo_url,
            schoolEmail: school_email,
            schoolNumber: school_number,
        },
    });
}

async function getSchoolNameById(school_id) {
    // console.log('In schoolService:',school_id);
    return prisma.school.findUnique({
        where: {
            id: school_id
        },
        select:{
            schoolName:true,
        }
    })
}

module.exports = {
    getAllSchools,
    createSchool,
    getSchoolNameById
};
