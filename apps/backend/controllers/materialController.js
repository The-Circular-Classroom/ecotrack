const materialService = require('../models/materialService');

const getAllMaterials = async (req, res) => {
    try {
        const materials = await materialService.getAllMaterials();

        return res.status(200).json({
            success: true,
            message: "Materials fetched successfully",
            data: materials
        });
    } catch (error) {
        console.error("Error fetching materials:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching materials",
            error: error.message
        });
    }
};

const getMaterialById = async (req, res) => {
    try {
        const { id } = req.params;
        const material = await materialService.getMaterialById(Number(id));

        if (!material) {
            return res.status(404).json({
                success: false,
                message: "Material not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Material fetched successfully",
            data: material
        });
    } catch (error) {
        console.error("Error fetching material:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching material",
            error: error.message
        });
    }
};

const createMaterial = async (req, res) => {
    try {
        const { material_name } = req.body;

        if (!material_name) {
            return res.status(400).json({
                success: false,
                message: "Missing required field"
            });
        }

        const newMaterial = await materialService.createMaterial(material_name);

        return res.status(201).json({
            success: true,
            message: "Material created successfully",
            data: newMaterial
        });
    } catch (error) {
        console.error("Error creating material:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating material",
            error: error.message
        });
    }
};

const updateMaterial = async (req, res) => {
    try {
        const { id } = req.params;
        const { material_name } = req.body;

        if (!material_name) {
            return res.status(400).json({
                success: false,
                message: "Missing required field"
            });
        }

        const updatedMaterial = await materialService.updateMaterial(Number(id), material_name);

        return res.status(200).json({
            success: true,
            message: "Material updated successfully",
            data: updatedMaterial
        });
    } catch (error) {
        console.error("Error updating material:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating material",
            error: error.message
        });
    }
};

const deleteMaterial = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid or missing material ID"
            });
        }

        await materialService.deleteMaterial(Number(id));

        return res.status(200).json({
            success: true,
            message: "Material deleted successfully"
        });
    }
    catch (error) {
        console.error("Error deleting material:", error);
        return res.status(500).json({
            success: false,
            message: "Error deleting material",
            error: error.message
        });
    }
};

module.exports = {
    getAllMaterials,
    getMaterialById,
    createMaterial,
    updateMaterial,
    deleteMaterial
}