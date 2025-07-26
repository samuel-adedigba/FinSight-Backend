import { prisma } from '../db/prisma.js';

/**
 * Create a new category for a user
 */
export async function createCategory({ userId, name, type }) {
  return prisma.category.create({
    data: { userId, name, type }
  });
}

/**
 * List all categories belonging to a user
 */
export async function listUserCategories(userId) {
  return prisma.category.findMany({
    where: { userId },
 //   orderBy: { name: 'asc' }
  });
}
export async function getCategoryById({userId, id}) {
  const category = await prisma.category.findUnique({where: {id}});
  if (!category || category.userId !== userId) {
    throw new Error('Category not found or unauthorized');
  }
  return category;
}

/**
 * Update a user’s category (only their own)
 */
export async function updateCategory({ userId, id, name, type }) {
  // Ensure the category belongs to this user
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new Error('Category not found or unauthorized');
  }

  return prisma.category.update({
    where: { id },
    data: { name, type }
  });
}

/**
 * Delete a user’s category
 */
export async function deleteCategory({ userId, id }) {
  // Ensure the category belongs to this user
  const existing = await prisma.category.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new Error('Category not found or unauthorized');
  }

  // If you want to reassign or clear transaction tags,
  // you could do that here before deletion.

  return prisma.category.delete({ where: { id } });
}
