import { createCategory, deleteCategory, listUserCategories, updateCategory } from "../services/categoryService.js";
import { prisma } from '../db/prisma.js';

export async function createCategoryController(req, res) {
  try {
    const userId = req.user?.id; // Optional chaining for safety
    const { name, type } = req.body;

    // 🚦 Validate required fields
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }

    const validName = typeof name === 'string' && name.trim().toLowerCase();
    const validType = typeof type === 'string' && type.trim().toUpperCase();

    if (!validName || !validType) {
      return res.status(400).json({ error: 'Invalid name or type format' });
    }

    // 🔍 Check if category already exists for the user (by name and type)
    const existingCategory = await prisma.category.findFirst({
      where: {
        userId,
        name: validName,
        type: validType
      }
    });

    if (existingCategory) {
      return res.status(400).json({ error: 'Category already exists' });
    }

    // ✨ Create the category
    const category = await createCategory({
      data: {
        userId,
        name: validName,
        type: validType
      }
    });

    res.status(201).json({ message: "Category created successfully", category });
  } catch (err) {
    console.error('Create category failed:', err);
    res.status(500).json({ error: err.message });
  }
}



export async function listCategoriesController(req, res) {
  try {
    const userId = req.user.id;
    const categories = await listUserCategories(userId);
    res.json({ message: "Your list of categories", categories });
  } catch (err) {
    console.error('List categories failed:', err);
    res.status(500).json({ error: err.message });
  }
}

export async function updateCategoryController(req, res) {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);
    const { name, type } = req.body;
    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required' });
    }
    const category = await updateCategory({ id, name, type, userId });
    res.json({ mesaage:"Category update successful"  ,category });
  } catch (err) {
    console.error('Update category failed:', err);
    res.status(err.message.includes('access denied') ? 403 : 500)
       .json({ error: err.message });
  }
}

export async function deleteCategoryController(req, res) {
  try {
    const userId = req.user.id;
    const id = Number(req.params.id);
    await deleteCategory({ id, userId });
    res.sendStatus(204);
  } catch (err) {
    console.error('Delete category failed:', err);
    res.status(err.message.includes('access denied') ? 403 : 500)
       .json({ error: err.message });
  }
}
