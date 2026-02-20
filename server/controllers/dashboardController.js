const pool = require('../config/database');
const fs = require('fs');
const path = require('path');

// Get dashboard statistics
const getStats = async (req, res) => {
  try {
    // Get e-paper statistics
    const [ePaperStats] = await pool.query(`
      SELECT 
        COUNT(*) as total_e_papers,
        COALESCE(SUM(total_pages), 0) as total_pages,
        COUNT(CASE WHEN status = 'live' THEN 1 END) as live_e_papers,
        COUNT(CASE WHEN status = 'draft' THEN 1 END) as draft_e_papers
      FROM e_papers
    `);

    // Get storage information
    const uploadsDir = path.join(__dirname, '../uploads');
    let totalStorage = 0;
    
    const getFolderSize = (dirPath) => {
      let size = 0;
      if (fs.existsSync(dirPath)) {
        const files = fs.readdirSync(dirPath);
        for (const file of files) {
          const filePath = path.join(dirPath, file);
          const stats = fs.statSync(filePath);
          if (stats.isDirectory()) {
            size += getFolderSize(filePath);
          } else {
            size += stats.size;
          }
        }
      }
      return size;
    };

    const papersSize = getFolderSize(path.join(uploadsDir, 'papers'));
    const pagesSize = getFolderSize(path.join(uploadsDir, 'pages'));
    const thumbnailsSize = getFolderSize(path.join(uploadsDir, 'thumbnails'));
    const cropsSize = getFolderSize(path.join(uploadsDir, 'crops'));
    
    totalStorage = papersSize + pagesSize + thumbnailsSize + cropsSize;

    // Convert to MB
    const usedStorageMB = (totalStorage / (1024 * 1024)).toFixed(2);
    const maxStorageMB = 1024; // 1GB limit

    // Get category count
    const [categoryStats] = await pool.query('SELECT COUNT(*) as total_categories FROM categories');

    // Get recent activity (last 7 days)
    const [recentActivity] = await pool.query(`
      SELECT COUNT(*) as recent_uploads
      FROM e_papers
      WHERE created_at >= DATE_SUB(NOW(), INTERVAL 7 DAY)
    `);

    res.json({
      // E-Paper stats
      total_e_papers: ePaperStats[0].total_e_papers || 0,
      total_pages: ePaperStats[0].total_pages || 0,
      live_e_papers: ePaperStats[0].live_e_papers || 0,
      draft_e_papers: ePaperStats[0].draft_e_papers || 0,
      
      // Storage
      used_storage: usedStorageMB,
      max_storage: maxStorageMB,
      storage_percentage: ((usedStorageMB / maxStorageMB) * 100).toFixed(1),
      
      // Other stats
      total_categories: categoryStats[0].total_categories || 0,
      recent_uploads: recentActivity[0].recent_uploads || 0,
      
      // Legacy stats for compatibility
      bookings: ePaperStats[0].total_e_papers || 0,
      users_count: ePaperStats[0].total_pages || 0,
      revenue: usedStorageMB + ' MB',
      followers: ePaperStats[0].live_e_papers || 0
    });
  } catch (error) {
    console.error('Get stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

// Update dashboard statistics
const updateStats = async (req, res) => {
  try {
    const { bookings, users_count, revenue, followers } = req.body;

    const [result] = await pool.query(
      'INSERT INTO dashboard_stats (bookings, users_count, revenue, followers) VALUES (?, ?, ?, ?)',
      [bookings, users_count, revenue, followers]
    );

    res.json({
      message: 'Stats updated successfully',
      id: result.insertId
    });
  } catch (error) {
    console.error('Update stats error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

module.exports = { getStats, updateStats };
