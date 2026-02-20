const pool = require('../config/database');

// Get all categories
exports.getAllCategories = async (req, res) => {
  try {
    const [categories] = await pool.query(`
      SELECT c.*, u.name as created_by_name
      FROM categories c
      LEFT JOIN users u ON c.created_by = u.id
      ORDER BY c.created_at DESC
    `);
    res.json(categories);
  } catch (error) {
    console.error('Error fetching categories:', error);
    res.status(500).json({ message: 'Error fetching categories', error: error.message });
  }
};

// Get category by ID
exports.getCategoryById = async (req, res) => {
  try {
    const { id } = req.params;
    const [categories] = await pool.query(
      'SELECT * FROM categories WHERE id = ?',
      [id]
    );

    if (categories.length === 0) {
      return res.status(404).json({ message: 'Category not found' });
    }

    res.json(categories[0]);
  } catch (error) {
    console.error('Error fetching category:', error);
    res.status(500).json({ message: 'Error fetching category', error: error.message });
  }
};

// Create new category
exports.createCategory = async (req, res) => {
  try {
    const { name, description } = req.body;
    const userId = req.user.id;

    // Check if category name already exists
    const [existing] = await pool.query(
      'SELECT id FROM categories WHERE name = ?',
      [name]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Category name already exists' });
    }

    const [result] = await pool.query(
      'INSERT INTO categories (name, description, created_by) VALUES (?, ?, ?)',
      [name, description, userId]
    );

    res.status(201).json({
      message: 'Category created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Error creating category:', error);
    res.status(500).json({ message: 'Error creating category', error: error.message });
  }
};

// Update category
exports.updateCategory = async (req, res) => {
  try {
    const { id } = req.params;
    const { name, description } = req.body;

    // Check if another category with same name exists
    const [existing] = await pool.query(
      'SELECT id FROM categories WHERE name = ? AND id != ?',
      [name, id]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Category name already exists' });
    }

    await pool.query(
      'UPDATE categories SET name = ?, description = ? WHERE id = ?',
      [name, description, id]
    );

    res.json({ message: 'Category updated successfully' });
  } catch (error) {
    console.error('Error updating category:', error);
    res.status(500).json({ message: 'Error updating category', error: error.message });
  }
};

// Delete category
exports.deleteCategory = async (req, res) => {
  try {
    const { id } = req.params;

    // Check if category is being used
    const [usage] = await pool.query(
      'SELECT COUNT(*) as count FROM e_paper_categories WHERE category_id = ?',
      [id]
    );

    if (usage[0].count > 0) {
      return res.status(400).json({
        message: 'Cannot delete category that is being used by e-papers'
      });
    }

    await pool.query('DELETE FROM categories WHERE id = ?', [id]);
    res.json({ message: 'Category deleted successfully' });
  } catch (error) {
    console.error('Error deleting category:', error);
    res.status(500).json({ message: 'Error deleting category', error: error.message });
  }
};
