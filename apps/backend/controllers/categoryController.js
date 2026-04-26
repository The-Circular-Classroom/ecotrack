const categoryService = require('../models/categoryService');

const getAllCategories = async (req, res) => {
    try {
        const categories = await categoryService.getAllCategories();

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

const getCategoryById = async (req, res) => {
    try {
        const { id } = req.params;
        const category = await categoryService.getCategoryById(Number(id));

        if (!category) {
            return res.status(404).json({
                success: false,
                message: "Category not found"
            });
        }

        return res.status(200).json({
            success: true,
            message: "Category fetched successfully",
            data: category
        });
    } catch (error) {
        console.error("Error fetching category:", error);
        return res.status(500).json({
            success: false,
            message: "Error fetching category",
            error: error.message
        });
    }
};

const createCategory = async (req, res) => {
    try {
        const { category_name, weight_kg } = req.body;

        if (!category_name || weight_kg === undefined) {
            return res.status(400).json({
                success: false,
                message: "Missing required fields"
            });
        }

        const newCategory = await categoryService.createCategory(category_name, weight_kg);

        return res.status(201).json({
            success: true,
            message: "Category created successfully",
            data: newCategory
        });
    } catch (error) {
        console.error("Error creating category:", error);
        return res.status(500).json({
            success: false,
            message: "Error creating category",
            error: error.message
        });
    }
};

const updateCategory = async (req, res) => {
    try {
        const { id } = req.params;
        const { category_name, weight_kg } = req.body;

        // Build updates object with only provided fields
        const updates = {};
        if (category_name !== undefined) updates.categoryName = category_name;
        if (weight_kg !== undefined) updates.weightKg = Number(weight_kg);

        // Check if at least one field is provided
        if (Object.keys(updates).length === 0) {
            return res.status(400).json({
                success: false,
                message: "At least one field must be provided"
            });
        }

        const updatedCategory = await categoryService.updateCategory(Number(id), updates);

        return res.status(200).json({
            success: true,
            message: "Category updated successfully",
            data: updatedCategory
        });
    } catch (error) {
        console.error("Error updating category:", error);
        return res.status(500).json({
            success: false,
            message: "Error updating category",
            error: error.message
        });
    }
};

const deleteCategory = async (req, res) => {
    try {
        const { id } = req.params;

        if (!id || isNaN(Number(id))) {
            return res.status(400).json({
                success: false,
                message: "Invalid or missing tag ID"
            });
        }

        await categoryService.deleteCategory(Number(id));

        return res.status(200).json({
            success: true,
            message: "Category deleted successfully"
        });
    }
    catch (error) {
        console.error("Error deleting category:", error);
        return res.status(500).json({
            success: false,
            message: "Error deleting category",
            error: error.message
        });
    }
};

module.exports = {
    getAllCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory
}