const prisma = require('../services/database/prismaClient');

// GET -- Get all colours
async function getAllColours() {
    return prisma.colour.findMany();
}

// GET -- Get a colour by its ID
async function getColourById(id) {
    return prisma.colour.findUnique({
        where: { id }
    });
}

// CREATE -- Create a new colour
async function createColour(colour_name, hexcode) {
    return prisma.colour.create({
        data: {
            colourName: colour_name,
            hexcode: hexcode,
        }
    });
}

// UPDATE -- Update an existing colour
async function updateColour(id, updates) {
    return prisma.colour.update({
        where: { id },
        data: updates
    });
}

// DELETE -- Delete a colour
async function deleteColour(id) {
    return prisma.colour.delete({
        where: { id }
    });
}

module.exports = {
    getAllColours,
    getColourById,
    createColour,
    updateColour,
    deleteColour
};