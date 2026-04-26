const prisma = require("../services/database/prismaClient");

// GET -- Get all categories
async function getAllCategories() {
  return prisma.category.findMany();
}

// GET -- Get a category by its ID
async function getCategoryById(id) {
  return prisma.category.findUnique({
    where: { id },
  });
}

// CREATE -- Create a new category
async function createCategory(category_name, weight_kg) {
  return prisma.category.create({
    data: {
      categoryName: category_name,
      weightKg: weight_kg,
    },
  });
}

// UPDATE -- Update an existing category
async function updateCategory(id, updates) {
  return prisma.category.update({
    where: { id },
    data: updates,
  });
}

// DELETE -- Delete a category
async function deleteCategory(id) {
  return prisma.category.delete({
    where: { id },
  });
}

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
};
