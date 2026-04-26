const sizeService = require("../models/sizeService");

const getAllSizeCategories = async (req, res) => {
  try {
    // optional query param to filter by brand_supplier_id and/or size_type
    const { brand_supplier_id, size_type } = req.query;

    const sizeCategories = await sizeService.getAllSizeCategories(
      Number(brand_supplier_id),
      size_type,
    );

    if (!sizeCategories || sizeCategories.length === 0) {
      return res.status(404).json({
        success: false,
        message: size_type
          ? `Size category with type '${size_type}' not found`
          : "No size categories found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Size categories fetched successfully",
      data: sizeCategories,
    });
  } catch (error) {
    console.error("Error fetching size categories:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching size categories",
      error: error.message,
    });
  }
};

const createSizeCategory = async (req, res) => {
  try {
    const { brand_supplier_id, size_type } = req.body;
    if (!brand_supplier_id || !size_type) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const newSizeCategory = await sizeService.createSizeCategory(
      brand_supplier_id,
      size_type,
    );

    return res.status(201).json({
      success: true,
      message: "Size category created successfully",
      data: newSizeCategory,
    });
  } catch (error) {
    console.error("Error creating size category:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating size category",
      error: error.message,
    });
  }
};

const updateSizeCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { brand_supplier_id, size_type } = req.body;
    if (!brand_supplier_id && !size_type) {
      return res.status(400).json({
        success: false,
        message: "At least one field must be provided",
      });
    }
    const updatedSizeCategory = await sizeService.updateSizeCategory(
      Number(id),
      { brand_supplier_id, size_type },
    );

    return res.status(200).json({
      success: true,
      message: "Size category updated successfully",
      data: updatedSizeCategory,
    });
  } catch (error) {
    console.error("Error updating size category:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating size category",
      error: error.message,
    });
  }
};

const deleteSizeCategory = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing size category ID",
      });
    }

    await sizeService.deleteSizeCategory(Number(id));

    return res.status(200).json({
      success: true,
      message: "Size category deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting size category:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting size category",
      error: error.message,
    });
  }
};

const getAllSizeOptions = async (req, res) => {
  try {
    const sizeOptions = await sizeService.getAllSizeOptions();

    return res.status(200).json({
      success: true,
      message: "Size options fetched successfully",
      data: sizeOptions,
    });
  } catch (error) {
    console.error("Error fetching size options:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching size options",
      error: error.message,
    });
  }
};

const getSizeOptionById = async (req, res) => {
  try {
    const { id } = req.params;
    const sizeOption = await sizeService.getSizeOptionById(Number(id));

    if (!sizeOption) {
      return res.status(404).json({
        success: false,
        message: "Size option not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Size option fetched successfully",
      data: sizeOption,
    });
  } catch (error) {
    console.error("Error fetching size option:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching size option",
      error: error.message,
    });
  }
};

const createSizeOption = async (req, res) => {
  try {
    const { size_category_id, size_name, size_class, sort_order } = req.body;

    if (!size_category_id || !size_name || sort_order === undefined) {
      return res.status(400).json({
        success: false,
        message: "Missing required fields",
      });
    }

    const newSizeOption = await sizeService.createSizeOption(
      size_category_id,
      size_name,
      size_class,
      sort_order,
    );

    return res.status(201).json({
      success: true,
      message: "Size option created successfully",
      data: newSizeOption,
    });
  } catch (error) {
    console.error("Error creating size option:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating size option",
      error: error.message,
    });
  }
};

const updateSizeOption = async (req, res) => {
  try {
    const { id } = req.params;
    const { size_category_id, size_name, size_class, sort_order } = req.body;

    // Build updates object with only provided fields
    const updates = {};
    if (size_category_id !== undefined)
      updates.sizeCategoryId = Number(size_category_id);
    if (size_name !== undefined) updates.sizeName = size_name;
    if (size_class !== undefined) updates.sizeClass = size_class;
    if (sort_order !== undefined) updates.sortOrder = Number(sort_order);

    // Check if at least one field is provided
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "At least one field must be provided",
      });
    }

    const updatedSizeOption = await sizeService.updateSizeOption(
      Number(id),
      updates,
    );

    return res.status(200).json({
      success: true,
      message: "Size option updated successfully",
      data: updatedSizeOption,
    });
  } catch (error) {
    console.error("Error updating size option:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating size option",
      error: error.message,
    });
  }
};

const deleteSizeOption = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing size option ID",
      });
    }

    await sizeService.deleteSizeOption(Number(id));

    return res.status(200).json({
      success: true,
      message: "Size option deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting size option:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting size option",
      error: error.message,
    });
  }
};

module.exports = {
  getAllSizeCategories,
  createSizeCategory,
  updateSizeCategory,
  deleteSizeCategory,
  getAllSizeOptions,
  getSizeOptionById,
  createSizeOption,
  updateSizeOption,
  deleteSizeOption,
};
