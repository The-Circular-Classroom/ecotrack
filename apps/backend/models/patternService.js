const prisma = require('../services/database/prismaClient');

// GET -- Get all patterns
async function getAllPatterns() {
    return prisma.pattern.findMany();
}

// GET -- Get a pattern by its ID
async function getPatternById(id) {
    return prisma.pattern.findUnique({
        where: { id }
    });
}

// CREATE -- Create a new pattern
async function createPattern(pattern_name) {
    return prisma.pattern.create({
        data: {
            patternName: pattern_name
        }
    });
}

// UPDATE -- Update an existing pattern
async function updatePattern(id, pattern_name) {
    return prisma.pattern.update({
        where: { id },
        data: {
            patternName: pattern_name
        }
    });
}

// DELETE -- Delete a pattern
async function deletePattern(id) {
    return prisma.pattern.delete({
        where: { id }
    });
}

module.exports = {
    getAllPatterns,
    getPatternById,
    createPattern,
    updatePattern,
    deletePattern
};