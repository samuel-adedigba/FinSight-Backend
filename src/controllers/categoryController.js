import { createCategory, deleteCategory, listUserCategories, updateCategory } from "../services/categoryService.js";
import { prisma } from '../db/prisma.js';


const CategoryTypeEnum = {
  INCOME: 'INCOME',
  EXPENSE: 'EXPENSE'
};

export async function createCategoryController(req, res) {
  try {
    const userId = req.user?.id;
    if (!userId) {
      return res.status(401).json({ error: 'User not authenticated' });
    }

    const { name, type } = req.body;

    if (!name || !type) {
      return res.status(400).json({ error: 'Name and type are required.' });
    }

    const trimmedName = name.trim().toLowerCase();
    const upperType = type.trim().toUpperCase();

    if (!CategoryTypeEnum[upperType]) {
      return res.status(400).json({ error: 'Invalid category type. Must be INCOME or EXPENSE.' });
    }

    const enumType = CategoryTypeEnum[upperType];

    // Check if the category exists
    const existingCategory = await prisma.category.findFirst({
      where: {
        userId,
        name: trimmedName,
        type: enumType
      }
    });

    if (existingCategory) {
      return res.status(400).json({ error: 'Category already exists.' });
    }

    // Create the category
    const category = await prisma.category.create({
      data: {
        userId,
        name: trimmedName,
        type: enumType
      }
    });

    res.status(201).json({
      message: 'Category created successfully',
      category
    });

  } catch (err) {
    console.error('Create category failed:', err);
    res.status(500).json({ error: 'Internal server error' });
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
