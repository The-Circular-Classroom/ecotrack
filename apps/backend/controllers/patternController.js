const patternService = require('../models/patternService');

const getAllPatterns = async (req, res) => {
    try {
        const patterns = await patternService.getAllPatterns();

        return res.status(200).json({
            success: true,
            message: "Patterns fetched successfully",
            data: patterns
        });
    } catch (error) {
        console.error("Error fetching patterns:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching patterns",
            error: error.message
        });
    }
};

const getPatternById = async (req, res) => {
    try {
        const { id } = req.params;
        const pattern = await patternService.getPatternById(Number(id));

        if (!pattern) {
            return res.status(404).json({
                success: false,
                message: "pattern not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Pattern fetched successfully",
            data: pattern
        });
    } catch (error) {
        console.error("Error fetching pattern:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching pattern",
            error: error.message
        });
    }
};

const createPattern = async (req, res) => {
    try {
        const { pattern_name } = req.body;

        if (!pattern_name) {
            return res.status(400).json({
                success: false,
                message: "Missing required field"
            });
        }

        const newPattern = await patternService.createPattern(pattern_name);

        return res.status(201).json({
            success: true,
            message: "Pattern created successfully",
            data: newPattern
        });
    } catch (error) {
        console.error("Error creating pattern:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating pattern",
            error: error.message
        });
    }
};

const updatePattern = async (req, res) => {
    try {
        const { id } = req.params;
        const { pattern_name } = req.body;

        if (!pattern_name) {
            return res.status(400).json({
                success: false,
                message: "Missing required field"
            });
        }

        const updatedPattern = await patternService.updatePattern(Number(id), pattern_name);

        return res.status(200).json({
            success: true,
            message: "Pattern updated successfully",
            data: updatedPattern
        });
    } catch (error) {
        console.error("Error updating pattern:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating pattern",
            error: error.message
        });
    }
};

const deletePattern = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid or missing pattern ID"
            });
        }

        await patternService.deletePattern(Number(id));

        return res.status(200).json({
            success: true,
            message: "Pattern deleted successfully"
        });
    }
    catch (error) {
        console.error("Error deleting pattern:", error);
        return res.status(500).json({
            success: false,
            message: "Error deleting pattern",
            error: error.message
        });
    }
};

module.exports = {
    getAllPatterns,
    getPatternById,
    createPattern,
    updatePattern,
    deletePattern
}