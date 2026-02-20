const pool = require('../config/database');
const path = require('path');
const fs = require('fs');

// Get all advertisements
exports.getAllAdvertisements = async (req, res) => {
  try {
    const [ads] = await pool.query(`
      SELECT a.*, u.name as created_by_name 
      FROM advertisements a 
      LEFT JOIN users u ON a.created_by = u.id 
      ORDER BY a.created_at DESC
    `);
    
    res.json(ads);
  } catch (error) {
    console.error('Error fetching advertisements:', error);
    res.status(500).json({ message: 'Error fetching advertisements', error: error.message });
  }
};

// Get advertisement by ID
exports.getAdvertisementById = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [ads] = await pool.query(
      'SELECT * FROM advertisements WHERE id = ?',
      [id]
    );
    
    if (ads.length === 0) {
      return res.status(404).json({ message: 'Advertisement not found' });
    }
    
    // Get placements for this ad
    const [placements] = await pool.query(`
      SELECT ap.*, ep.title as e_paper_title, epp.page_number
      FROM ad_placements ap
      JOIN e_papers ep ON ap.e_paper_id = ep.id
      JOIN e_paper_pages epp ON ap.page_id = epp.id
      WHERE ap.ad_id = ? AND ap.is_active = TRUE
    `, [id]);
    
    const ad = ads[0];
    ad.placements = placements;
    
    res.json(ad);
  } catch (error) {
    console.error('Error fetching advertisement:', error);
    res.status(500).json({ message: 'Error fetching advertisement', error: error.message });
  }
};

// Create new advertisement
exports.createAdvertisement = async (req, res) => {
  try {
    const {
      title,
      description,
      link_url,
      advertiser_name,
      advertiser_email,
      start_date,
      end_date
    } = req.body;
    
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ message: 'Advertisement image is required' });
    }
    
    const imagePath = `/uploads/ads/${req.file.filename}`;
    
    const [result] = await pool.query(
      `INSERT INTO advertisements 
       (title, description, image_path, link_url, advertiser_name, advertiser_email, start_date, end_date, created_by) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        imagePath,
        link_url || null,
        advertiser_name || null,
        advertiser_email || null,
        start_date || null,
        end_date || null,
        userId
      ]
    );
    
    res.status(201).json({
      message: 'Advertisement created successfully',
      ad_id: result.insertId,
      image_path: imagePath
    });
    
  } catch (error) {
    console.error('Error creating advertisement:', error);
    res.status(500).json({ message: 'Error creating advertisement', error: error.message });
  }
};

// Update advertisement
exports.updateAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      title,
      description,
      link_url,
      advertiser_name,
      advertiser_email,
      start_date,
      end_date,
      status
    } = req.body;
    
    const updates = [];
    const values = [];
    
    if (title) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description !== undefined) {
      updates.push('description = ?');
      values.push(description);
    }
    if (link_url !== undefined) {
      updates.push('link_url = ?');
      values.push(link_url);
    }
    if (advertiser_name !== undefined) {
      updates.push('advertiser_name = ?');
      values.push(advertiser_name);
    }
    if (advertiser_email !== undefined) {
      updates.push('advertiser_email = ?');
      values.push(advertiser_email);
    }
    if (start_date !== undefined) {
      updates.push('start_date = ?');
      values.push(start_date);
    }
    if (end_date !== undefined) {
      updates.push('end_date = ?');
      values.push(end_date);
    }
    if (status) {
      updates.push('status = ?');
      values.push(status);
    }
    
    // Handle image update
    if (req.file) {
      // Delete old image
      const [oldAd] = await pool.query('SELECT image_path FROM advertisements WHERE id = ?', [id]);
      if (oldAd.length > 0 && oldAd[0].image_path) {
        const oldPath = path.join(__dirname, '..', oldAd[0].image_path);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
      }
      
      updates.push('image_path = ?');
      values.push(`/uploads/ads/${req.file.filename}`);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    values.push(id);
    
    await pool.query(
      `UPDATE advertisements SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    res.json({ message: 'Advertisement updated successfully' });
    
  } catch (error) {
    console.error('Error updating advertisement:', error);
    res.status(500).json({ message: 'Error updating advertisement', error: error.message });
  }
};

// Delete advertisement
exports.deleteAdvertisement = async (req, res) => {
  try {
    const { id } = req.params;
    
    // Get image path before deletion
    const [ads] = await pool.query('SELECT image_path FROM advertisements WHERE id = ?', [id]);
    
    if (ads.length > 0 && ads[0].image_path) {
      const imagePath = path.join(__dirname, '..', ads[0].image_path);
      if (fs.existsSync(imagePath)) fs.unlinkSync(imagePath);
    }
    
    await pool.query('DELETE FROM advertisements WHERE id = ?', [id]);
    
    res.json({ message: 'Advertisement deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting advertisement:', error);
    res.status(500).json({ message: 'Error deleting advertisement', error: error.message });
  }
};

// Record ad impression
exports.recordImpression = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query(
      'UPDATE advertisements SET impressions = impressions + 1 WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'Impression recorded' });
    
  } catch (error) {
    console.error('Error recording impression:', error);
    res.status(500).json({ message: 'Error recording impression', error: error.message });
  }
};

// Record ad click
exports.recordClick = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query(
      'UPDATE advertisements SET clicks = clicks + 1 WHERE id = ?',
      [id]
    );
    
    res.json({ message: 'Click recorded' });
    
  } catch (error) {
    console.error('Error recording click:', error);
    res.status(500).json({ message: 'Error recording click', error: error.message });
  }
};

// Get ad statistics
exports.getAdStats = async (req, res) => {
  try {
    const { id } = req.params;
    
    const [stats] = await pool.query(
      'SELECT impressions, clicks, (clicks / NULLIF(impressions, 0) * 100) as ctr FROM advertisements WHERE id = ?',
      [id]
    );
    
    if (stats.length === 0) {
      return res.status(404).json({ message: 'Advertisement not found' });
    }
    
    res.json(stats[0]);
    
  } catch (error) {
    console.error('Error fetching ad stats:', error);
    res.status(500).json({ message: 'Error fetching ad stats', error: error.message });
  }
};

// Place ad on e-paper page
exports.placeAd = async (req, res) => {
  try {
    const {
      ad_id,
      e_paper_id,
      page_id,
      position_x,
      position_y,
      width,
      height
    } = req.body;
    
    const [result] = await pool.query(
      `INSERT INTO ad_placements 
       (ad_id, e_paper_id, page_id, position_x, position_y, width, height) 
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [ad_id, e_paper_id, page_id, position_x, position_y, width, height]
    );
    
    res.status(201).json({
      message: 'Ad placed successfully',
      placement_id: result.insertId
    });
    
  } catch (error) {
    console.error('Error placing ad:', error);
    res.status(500).json({ message: 'Error placing ad', error: error.message });
  }
};

// Remove ad placement
exports.removeAdPlacement = async (req, res) => {
  try {
    const { placement_id } = req.params;
    
    await pool.query('DELETE FROM ad_placements WHERE id = ?', [placement_id]);
    
    res.json({ message: 'Ad placement removed successfully' });
    
  } catch (error) {
    console.error('Error removing ad placement:', error);
    res.status(500).json({ message: 'Error removing ad placement', error: error.message });
  }
};

// Get active ads for e-paper
exports.getActiveAdsForEPaper = async (req, res) => {
  try {
    const { e_paper_id } = req.params;
    
    const [ads] = await pool.query(`
      SELECT 
        ap.id as placement_id,
        ap.position_x,
        ap.position_y,
        ap.width,
        ap.height,
        a.id as ad_id,
        a.title,
        a.image_path,
        a.link_url,
        a.advertiser_name,
        epp.page_number
      FROM ad_placements ap
      JOIN advertisements a ON ap.ad_id = a.id
      JOIN e_paper_pages epp ON ap.page_id = epp.id
      WHERE ap.e_paper_id = ? 
        AND ap.is_active = TRUE 
        AND a.status = 'active'
        AND (a.start_date IS NULL OR a.start_date <= NOW())
        AND (a.end_date IS NULL OR a.end_date >= NOW())
      ORDER BY epp.page_number
    `, [e_paper_id]);
    
    res.json(ads);
    
  } catch (error) {
    console.error('Error fetching active ads:', error);
    res.status(500).json({ message: 'Error fetching active ads', error: error.message });
  }
};
