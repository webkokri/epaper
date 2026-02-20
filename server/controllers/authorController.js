const pool = require('../config/database');

// Get all authors
const getAllAuthors = async (req, res) => {
  try {
    const [authors] = await pool.query(
      'SELECT id, name, email, image, job_title, job_description, status, employed_date FROM authors ORDER BY id'
    );
    res.json(authors);
  } catch (error) {
    console.error('Get authors error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Get author by ID
const getAuthorById = async (req, res) => {
  try {
    const [authors] = await pool.query(
      'SELECT id, name, email, image, job_title, job_description, status, employed_date FROM authors WHERE id = ?',
      [req.params.id]
    );

    if (authors.length === 0) {
      return res.status(404).json({ message: 'Author not found' });
    }

    res.json(authors[0]);
  } catch (error) {
    console.error('Get author error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Create new author
const createAuthor = async (req, res) => {
  try {
    const { name, email, image, job_title, job_description, status, employed_date } = req.body;

    const [result] = await pool.query(
      'INSERT INTO authors (name, email, image, job_title, job_description, status, employed_date) VALUES (?, ?, ?, ?, ?, ?, ?)',
      [name, email, image || '/assets/images/team-3.jpg', job_title, job_description, status || 'online', employed_date]
    );

    res.status(201).json({
      message: 'Author created successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Create author error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update author
const updateAuthor = async (req, res) => {
  try {
    const { name, email, image, job_title, job_description, status, employed_date } = req.body;
    const { id } = req.params;

    const [result] = await pool.query(
      'UPDATE authors SET name = ?, email = ?, image = ?, job_title = ?, job_description = ?, status = ?, employed_date = ? WHERE id = ?',
      [name, email, image, job_title, job_description, status, employed_date, id]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Author not found' });
    }

    res.json({ message: 'Author updated successfully' });
  } catch (error) {
    console.error('Update author error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Delete author
const deleteAuthor = async (req, res) => {
  try {
    const [result] = await pool.query('DELETE FROM authors WHERE id = ?', [req.params.id]);

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Author not found' });
    }

    res.json({ message: 'Author deleted successfully' });
  } catch (error) {
    console.error('Delete author error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = {
  getAllAuthors,
  getAuthorById,
  createAuthor,
  updateAuthor,
  deleteAuthor
};
