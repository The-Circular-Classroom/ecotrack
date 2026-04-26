const brandService = require("../models/brandService");

const getAllBrands = async (req, res) => {
  try {
    const brands = await brandService.getAllBrands();

    return res.status(200).json({
      success: true,
      message: "Brands fetched successfully",
      data: brands,
    });
  } catch (error) {
    console.error("Error fetching brands:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching brands",
      error: error.message,
    });
  }
};

const getBrandById = async (req, res) => {
  try {
    const { id } = req.params;
    const brand = await brandService.getBrandById(Number(id));

    if (!brand) {
      return res.status(404).json({
        success: false,
        message: "Brand not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Brand fetched successfully",
      data: brand,
    });
  } catch (error) {
    console.error("Error fetching brand:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching brand",
      error: error.message,
    });
  }
};

const createBrand = async (req, res) => {
  try {
    const { brand_supplier } = req.body;

    if (!brand_supplier) {
      return res.status(400).json({
        success: false,
        message: "Missing required field",
      });
    }

    const newBrand = await brandService.createBrand(brand_supplier);

    return res.status(201).json({
      success: true,
      message: "Brand created successfully",
      data: newBrand,
    });
  } catch (error) {
    console.error("Error creating brand:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating brand",
      error: error.message,
    });
  }
};

const updateBrand = async (req, res) => {
  try {
    const { id } = req.params;
    const { brand_supplier } = req.body;

    if (!brand_supplier) {
      return res.status(400).json({
        success: false,
        message: "Missing required field",
      });
    }

    const updatedBrand = await brandService.updateBrand(
      Number(id),
      brand_supplier,
    );

    return res.status(200).json({
      success: true,
      message: "Brand updated successfully",
      data: updatedBrand,
    });
  } catch (error) {
    console.error("Error updating brand:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating brand",
      error: error.message,
    });
  }
};

const deleteBrand = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing brand ID",
      });
    }

    const categories = await brandService.getSizeCategoriesByBrandId(Number(id));
    if (categories.some((c) => c.itemTypes.length > 0)) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete this brand — its size categories are referenced by existing item type presets. Remove those presets first.",
      });
    }

    if (
      categories.some((c) =>
        c.sizeOptions.some(
          (o) => o.transactions.length > 0 || o.inventoryBalances.length > 0,
        ),
      )
    ) {
      return res.status(409).json({
        success: false,
        message:
          "Cannot delete this brand — its size options are referenced by existing transactions or inventory records.",
      });
    }

    await brandService.deleteBrand(Number(id));

    return res.status(200).json({
      success: true,
      message: "Brand deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting brand:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting brand",
      error: error.message,
    });
  }
};

module.exports = {
  getAllBrands,
  getBrandById,
  createBrand,
  updateBrand,
  deleteBrand,
};
