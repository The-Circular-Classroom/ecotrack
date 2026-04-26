const tagService = require("../models/tagService");
const userService = require("../models/userService");

const getAllTags = async (req, res) => {
  try {
    const tags = await tagService.getAllTags();

    return res.status(200).json({
      success: true,
      message: "Tags fetched successfully",
      data: tags,
    });
  } catch (error) {
    console.error("Error fetching tags:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching tags",
      error: error.message,
    });
  }
};

const getTagById = async (req, res) => {
  try {
    const { id } = req.params;
    const tag = await tagService.getTagById(Number(id));

    if (!tag) {
      return res.status(404).json({
        success: false,
        message: "Tag not found",
      });
    }

    return res.status(200).json({
      success: true,
      message: "Tag fetched successfully",
      data: tag,
    });
  } catch (error) {
    console.error("Error fetching tag:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching tag",
      error: error.message,
    });
  }
};

const createTag = async (req, res) => {
  try {
    const { tag_name, is_active } = req.body;

    if (!tag_name) {
      return res.status(400).json({
        success: false,
        message: "Missing required field",
      });
    }

    const cognitoSub = req.user && req.user.sub;
    if (!cognitoSub) {
      return res.status(401).json({
        success: false,
        message: "Unauthorized: missing authenticated user",
      });
    }

    const userId = await userService.getUserIdByCognitoSub(cognitoSub);
    if (!userId) {
      return res.status(404).json({
        success: false,
        message: "User not found for authenticated subject",
      });
    }

    const newTag = await tagService.createTag(
      Number(userId),
      tag_name,
      is_active,
    );

    return res.status(201).json({
      success: true,
      message: "Tag created successfully",
      data: newTag,
    });
  } catch (error) {
    console.error("Error creating tag:", error);
    return res.status(500).json({
      success: false,
      message: "Error creating tag",
      error: error.message,
    });
  }
};

const updateTag = async (req, res) => {
  try {
    const { id } = req.params;
    const { tag_name, is_active } = req.body;

    const numericId = Number(id);
    if (!id || isNaN(numericId)) {
      return res.status(400).json({
        success: false,
        message: "Invalid tag ID",
      });
    }

    // Build updates object with only provided fields
    const updates = {};
    if (tag_name !== undefined) updates.tagName = tag_name;
    if (is_active !== undefined) updates.isActive = is_active;

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid fields provided for update",
      });
    }

    const updatedTag = await tagService.updateTag(numericId, updates);

    return res.status(200).json({
      success: true,
      message: "Tag updated successfully",
      data: updatedTag,
    });
  } catch (error) {
    console.error("Error updating tag:", error);
    return res.status(500).json({
      success: false,
      message: "Error updating tag",
      error: error.message,
    });
  }
};

const deleteTag = async (req, res) => {
  try {
    const { id } = req.params;

    if (!id || isNaN(Number(id))) {
      return res.status(400).json({
        success: false,
        message: "Invalid or missing tag ID",
      });
    }

    const existingItemTypeTag = await tagService.getItemTypeTagsById(
      Number(id),
    );
    if (existingItemTypeTag.length > 0) {
      return res.status(409).json({
        success: false,
        message: "Cannot delete tag that is associated with item types",
      });
    }

    await tagService.deleteTag(Number(id));

    return res.status(200).json({
      success: true,
      message: "Tag deleted successfully",
    });
  } catch (error) {
    console.error("Error deleting tag:", error);
    return res.status(500).json({
      success: false,
      message: "Error deleting tag",
      error: error.message,
    });
  }
};

const getItemTypeTagsById = async (req, res) => {
  try {
    const { id } = req.params;
    const tags = await tagService.getItemTypeTagsById(Number(id));

    return res.status(200).json({
      success: true,
      message: "Item type tags fetched successfully",
      data: tags,
    });
  } catch (error) {
    console.error("Error fetching item type tags:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching item type tags",
      error: error.message,
    });
  }
};

const getItemTypeTagsByItemTypeId = async (req, res) => {
  try {
    const { item_type_id } = req.params;
    const tags = await tagService.getItemTypeTagsByItemTypeId(
      Number(item_type_id),
    );

    return res.status(200).json({
      success: true,
      message: "Item type tags fetched successfully",
      data: tags,
    });
  } catch (error) {
    console.error("Error fetching item type tags:", error);
    return res.status(500).json({
      success: false,
      message: "Error fetching item type tags",
      error: error.message,
    });
  }
};

module.exports = {
  getAllTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
  getItemTypeTagsById,
  getItemTypeTagsByItemTypeId,
};
