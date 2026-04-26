const colourService = require('../models/colourService');

const getAllColours = async (req, res) => {
    try {
        const categories = await colourService.getAllColours();

        return res.status(200).json({
            success: true,
            message: "Categories fetched successfully",
            data: categories
        });
    } catch (error) {
        console.error("Error fetching categories:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching categories",
            error: error.message
        });
    }
};

const getColourById = async (req, res) => {
    try {
        const { id } = req.params;
        const colour = await colourService.getColourById(Number(id));

        if (!colour) {
            return res.status(404).json({
                success: false,
                message: "colour not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Colour fetched successfully",
            data: colour
        });
    } catch (error) {
        console.error("Error fetching colour:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching colour",
            error: error.message
        });
    }
};

const createColour = async (req, res) => {
    try {
        const { colour_name, hexcode } = req.body;

        if (!colour_name || hexcode === undefined) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const newColour = await colourService.createColour(colour_name, hexcode);

        return res.status(201).json({
            success: true,
            message: "Colour created successfully",
            data: newColour
        });
    } catch (error) {
        console.error("Error creating colour:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating colour",
            error: error.message
        });
    }
};

const updateColour = async (req, res) => {
    try {
        const { id } = req.params;
        const { colour_name, hexcode } = req.body;

        // Build updates object with only provided fields
        const updates = {};
        if (colour_name !== undefined) updates.colourName = colour_name;
        if (hexcode !== undefined) updates.hexcode = hexcode;

        // Check if at least one field is provided
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one field must be provided"
            });
        }

        const updatedColour = await colourService.updateColour(Number(id), updates);

        return res.status(200).json({
            success: true,
            message: "Colour updated successfully",
            data: updatedColour
        });
    } catch (error) {
        console.error("Error updating colour:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating colour",
            error: error.message
        });
    }
};

const deleteColour = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid or missing colour ID"
            });
        }

        await colourService.deleteColour(Number(id));

        return res.status(200).json({
            success: true,
            message: "colour deleted successfully"
        });
    }
    catch (error) {
        console.error("Error deleting colour:", error);
        return res.status(500).json({
            success: false,
            message: "Error deleting colour",
            error: error.message
        });
    }
};

module.exports = {
    getAllColours,
    getColourById,
    createColour,
    updateColour,
    deleteColour
}