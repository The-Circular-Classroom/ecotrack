const prisma = require("../services/database/prismaClient");

// GET -- Get all tags
async function getAllTags() {
  return prisma.tag.findMany({
    orderBy: { id: "asc" },
  });
}

// GET -- Get a tag by its ID
async function getTagById(id) {
  return prisma.tag.findUnique({
    where: { id },
  });
}

// CREATE -- Create a new tag
async function createTag(user_id, tag_name, is_active) {
  return prisma.tag.create({
    data: {
      createdByUserId: user_id,
      tagName: tag_name,
      isActive: is_active,
    },
  });
}

// UPDATE -- Update an existing tag
async function updateTag(id, updates) {
  return prisma.tag.update({
    where: { id },
    data: updates,
  });
}

// DELETE -- Delete a tag
async function deleteTag(id) {
  return prisma.tag.delete({
    where: { id },
  });
}

// GET -- Get all item type tags by tag ID
async function getItemTypeTagsById(id) {
  return prisma.itemTypeTag.findMany({
    where: {
      tagId: id,
    },
  });
}

// GET -- Get all item type tags by item type ID
async function getItemTypeTagsByItemTypeId(item_type_id) {
  return prisma.itemTypeTag.findMany({
    where: {
      itemTypeId: item_type_id,
    },
  });
}

// CREATE -- Create a new item type tag (association between an item type and a tag)
async function createItemTypeTag(item_type_id, tag_id) {
  return prisma.itemTypeTag.create({
    data: {
      itemTypeId: item_type_id,
      tagId: tag_id,
    },
  });
}

// DELETE -- Delete a specific tag for a specific item type
async function deleteItemTypeTag(item_type_id, tag_id) {
  return prisma.itemTypeTag.deleteMany({
    where: {
      itemTypeId: item_type_id,
      tagId: tag_id,
    },
  });
}

// DELETE -- Delete all tags for a specific item type
async function deleteAllItemTypeTags(item_type_id) {
  return prisma.itemTypeTag.deleteMany({
    where: {
      itemTypeId: item_type_id,
    },
  });
}

module.exports = {
  getAllTags,
  getTagById,
  createTag,
  updateTag,
  deleteTag,
  getItemTypeTagsById,
  getItemTypeTagsByItemTypeId,
  createItemTypeTag,
  deleteItemTypeTag,
  deleteAllItemTypeTags,
};
