const prisma = require('../services/database/prismaClient');

// CREATE
async function createDonationDrive({
    drive_name,
    start_date,
    end_date,
    location,
    school_id,
    created_by_user_id
}) {
    return prisma.donationDrive.create({
        data: {
            driveName: drive_name,
            startDate: new Date(start_date),
            endDate: new Date(end_date),
            location: location,
            schoolId: school_id || null,
            createdByUserId: created_by_user_id,
        },
        include: {
            school: true,
            createdBy: {
                select: {
                    id: true,
                    email: true,
                    // Add other non-sensitive user fields as needed
                }
            }
        }
    });
}

// READ ALL (with optional filters)
async function getAllDonationDrives({ school_id, active_only, page = 1, limit = null } = {}) {
    const skip = limit ? (page - 1) * limit : undefined;

    const where = {};

    if (school_id) {
        where.schoolId = school_id;
    }

    if (active_only) {
        const now = new Date();
        where.startDate = { lte: now };
        where.endDate = { gte: now };
    }

    const [donationDrives, total] = await Promise.all([
        prisma.donationDrive.findMany({
            where,
            skip,
            take: limit ?? undefined,
            include: {
                school: true,
                createdBy: {
                    select: {
                        id: true,
                        email: true,
                    }
                },
                _count: {
                    select: { transactions: true }
                }
            },
            orderBy: { startDate: 'desc' }
        }),
        prisma.donationDrive.count({ where })
    ]);

    return {
        data: donationDrives,
        pagination: {
            total,
            page,
            limit,
            totalPages: limit ? Math.ceil(total / limit) : 1
        }
    };
}

// READ ONE
async function getDonationDriveById(id) {
    return prisma.donationDrive.findUnique({
        where: { id: parseInt(id) },
        include: {
            school: true,
            createdBy: {
                select: {
                    id: true,
                    email: true,
                }
            },
            transactions: {
                take: 10,
                orderBy: { transactionDate: 'desc' }
            },
            _count: {
                select: { transactions: true }
            }
        }
    });
}

// UPDATE
async function updateDonationDrive(id, {
    drive_name,
    start_date,
    end_date,
    location,
    school_id
}) {
    const data = {};

    if (drive_name !== undefined) data.driveName = drive_name;
    if (start_date !== undefined) data.startDate = new Date(start_date);
    if (end_date !== undefined) data.endDate = new Date(end_date);
    if (location !== undefined) data.location = location;
    if (school_id !== undefined) data.schoolId = school_id;

    return prisma.donationDrive.update({
        where: { id: parseInt(id) },
        data,
        include: {
            school: true,
            createdBy: {
                select: {
                    id: true,
                    email: true,
                }
            }
        }
    });
}

// DELETE
async function deleteDonationDrive(id) {
    return prisma.donationDrive.delete({
        where: { id: parseInt(id) }
    });
}

// GET DRIVES BY SCHOOL
async function getDonationDrivesBySchool(schoolId) {
    return prisma.donationDrive.findMany({
        where: { schoolId: parseInt(schoolId) },
        include: {
            school: true,
            _count: {
                select: { transactions: true }
            }
        },
        orderBy: { startDate: 'desc' }
    });
}

// GET ACTIVE DRIVES
async function getActiveDonationDrives() {
    const now = new Date();
    return prisma.donationDrive.findMany({
        where: {
            startDate: { lte: now },
            endDate: { gte: now }
        },
        include: {
            school: true,
            _count: {
                select: { transactions: true }
            }
        },
        orderBy: { endDate: 'asc' }
    });
}


module.exports = {
    createDonationDrive,
    getAllDonationDrives,
    getDonationDriveById,
    updateDonationDrive,
    deleteDonationDrive,
    getDonationDrivesBySchool,
    getActiveDonationDrives
};