const pool = require('../config/database');

// Get all projects
const getAllProjects = async (req, res) => {
  try {
    const [projects] = await pool.query(
      'SELECT id, name, description, budget, completion, status, created_at FROM projects ORDER BY id'
    );
    res.json(projects);
  } catch (error) {
    console.error('Get projects error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get project by ID
const getProjectById = async (req, res) => {
  try {
    const [projects] = await pool.query(
      'SELECT id, name, description, budget, completion, status, created_at FROM projects WHERE id = ?',
      [req.params.id]
    );

    if (projects.length === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json(projects[0]);
  } catch (error) {
    console.error('Get project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new project
const createProject = async (req, res) => {
  try {
    const { name, description, budget, completion, status } = req.body;

    const [result] = await pool.query(
      'INSERT INTO projects (name, description, budget, completion, status) VALUES (?, ?, ?, ?, ?)',
      [name, description, budget || '$0', completion || 0, status || 'pending']
    );

    res.status(201).json({
      message: 'Project created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Create project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update project
const updateProject = async (req, res) => {
  try {
    const { name, description, budget, completion, status } = req.body;
    const { id } = req.params;

    const [result] = await pool.query(
      'UPDATE projects SET name = ?, description = ?, budget = ?, completion = ?, status = ? WHERE id = ?',
      [name, description, budget, completion, status, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project updated successfully' });
  } catch (error) {
    console.error('Update project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete project
const deleteProject = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM projects WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Project not found' });
    }

    res.json({ message: 'Project deleted successfully' });
  } catch (error) {
    console.error('Delete project error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllProjects,
  getProjectById,
  createProject,
  updateProject,
  deleteProject
};
