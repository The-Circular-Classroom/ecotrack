const prisma = require('../services/database/prismaClient');

// GET -- Get all material
async function getAllMaterials() {
    return prisma.material.findMany();
}

// GET -- Get a material by its ID
async function getMaterialById(id) {
    return prisma.material.findUnique({
        where: { id }
    });
}

// CREATE -- Create a new material
async function createMaterial(material_name) {
    return prisma.material.create({
        data: {
            materialName: material_name
        }
    });
}

// UPDATE -- Update an existing material
async function updateMaterial(id, material_name) {
    return prisma.material.update({
        where: { id },
        data: {
            materialName: material_name
        }
    });
}

// DELETE -- Delete a material
async function deleteMaterial(id) {
    return prisma.material.delete({
        where: { id }
    });
}

module.exports = {
    getAllMaterials,
    getMaterialById,
    createMaterial,
    updateMaterial,
    deleteMaterial
};