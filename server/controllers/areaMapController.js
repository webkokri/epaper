const pool = require('../config/database');

// Get all area maps for an e-paper
exports.getAreaMapsByEPaper = async (req, res) => {
  try {
    const { e_paper_id } = req.params;
    
    const [areaMaps] = await pool.query(`
      SELECT am.*, ep.page_number 
      FROM area_maps am
      JOIN e_paper_pages ep ON am.page_id = ep.id
      WHERE am.e_paper_id = ? AND am.is_active = TRUE
      ORDER BY ep.page_number, am.created_at
    `, [e_paper_id]);
    
    // Parse coordinates JSON
    areaMaps.forEach(map => {
      if (map.coordinates) {
        map.coordinates = JSON.parse(map.coordinates);
      }
    });
    
    res.json(areaMaps);
  } catch (error) {
    console.error('Error fetching area maps:', error);
    res.status(500).json({ message: 'Error fetching area maps', error: error.message });
  }
};

// Get area maps for a specific page
exports.getAreaMapsByPage = async (req, res) => {
  try {
    const { page_id } = req.params;
    
    const [areaMaps] = await pool.query(`
      SELECT am.*, ad.image_path as ad_image, ad.link_url as ad_link
      FROM area_maps am
      LEFT JOIN advertisements ad ON am.ad_id = ad.id
      WHERE am.page_id = ? AND am.is_active = TRUE
      ORDER BY am.created_at
    `, [page_id]);
    
    // Parse coordinates JSON
    areaMaps.forEach(map => {
      if (map.coordinates) {
        map.coordinates = JSON.parse(map.coordinates);
      }
    });
    
    res.json(areaMaps);
  } catch (error) {
    console.error('Error fetching area maps:', error);
    res.status(500).json({ message: 'Error fetching area maps', error: error.message });
  }
};

// Create new area map
exports.createAreaMap = async (req, res) => {
  try {
    const {
      e_paper_id,
      page_id,
      area_type,
      coordinates,
      link_url,
      link_page_number,
      ad_id,
      tooltip_text
    } = req.body;
    
    // Validate required fields
    if (!e_paper_id || !page_id || !area_type || !coordinates) {
      return res.status(400).json({ 
        message: 'e_paper_id, page_id, area_type, and coordinates are required' 
      });
    }
    
    // Validate coordinates format
    if (!Array.isArray(coordinates) || coordinates.length < 3) {
      return res.status(400).json({ 
        message: 'Coordinates must be an array with at least 3 points' 
      });
    }
    
    const [result] = await pool.query(
      `INSERT INTO area_maps 
       (e_paper_id, page_id, area_type, coordinates, link_url, link_page_number, ad_id, tooltip_text) 
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        e_paper_id,
        page_id,
        area_type,
        JSON.stringify(coordinates),
        link_url || null,
        link_page_number || null,
        ad_id || null,
        tooltip_text || null
      ]
    );
    
    res.status(201).json({
      message: 'Area map created successfully',
      area_map_id: result.insertId
    });
    
  } catch (error) {
    console.error('Error creating area map:', error);
    res.status(500).json({ message: 'Error creating area map', error: error.message });
  }
};

// Update area map
exports.updateAreaMap = async (req, res) => {
  try {
    const { id } = req.params;
    const {
      area_type,
      coordinates,
      link_url,
      link_page_number,
      ad_id,
      tooltip_text,
      is_active
    } = req.body;
    
    const updates = [];
    const values = [];
    
    if (area_type) {
      updates.push('area_type = ?');
      values.push(area_type);
    }
    if (coordinates) {
      updates.push('coordinates = ?');
      values.push(JSON.stringify(coordinates));
    }
    if (link_url !== undefined) {
      updates.push('link_url = ?');
      values.push(link_url);
    }
    if (link_page_number !== undefined) {
      updates.push('link_page_number = ?');
      values.push(link_page_number);
    }
    if (ad_id !== undefined) {
      updates.push('ad_id = ?');
      values.push(ad_id);
    }
    if (tooltip_text !== undefined) {
      updates.push('tooltip_text = ?');
      values.push(tooltip_text);
    }
    if (is_active !== undefined) {
      updates.push('is_active = ?');
      values.push(is_active);
    }
    
    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }
    
    values.push(id);
    
    await pool.query(
      `UPDATE area_maps SET ${updates.join(', ')} WHERE id = ?`,
      values
    );
    
    res.json({ message: 'Area map updated successfully' });
    
  } catch (error) {
    console.error('Error updating area map:', error);
    res.status(500).json({ message: 'Error updating area map', error: error.message });
  }
};

// Delete area map
exports.deleteAreaMap = async (req, res) => {
  try {
    const { id } = req.params;
    
    await pool.query('DELETE FROM area_maps WHERE id = ?', [id]);
    
    res.json({ message: 'Area map deleted successfully' });
    
  } catch (error) {
    console.error('Error deleting area map:', error);
    res.status(500).json({ message: 'Error deleting area map', error: error.message });
  }
};

// Batch create area maps (for saving multiple areas at once)
exports.batchCreateAreaMaps = async (req, res) => {
  try {
    const { areas } = req.body;
    
    if (!Array.isArray(areas) || areas.length === 0) {
      return res.status(400).json({ message: 'Areas array is required' });
    }
    
    const createdIds = [];
    
    for (const area of areas) {
      const {
        e_paper_id,
        page_id,
        area_type,
        coordinates,
        link_url,
        link_page_number,
        ad_id,
        tooltip_text
      } = area;
      
      const [result] = await pool.query(
        `INSERT INTO area_maps 
         (e_paper_id, page_id, area_type, coordinates, link_url, link_page_number, ad_id, tooltip_text) 
         VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
        [
          e_paper_id,
          page_id,
          area_type,
          JSON.stringify(coordinates),
          link_url || null,
          link_page_number || null,
          ad_id || null,
          tooltip_text || null
        ]
      );
      
      createdIds.push(result.insertId);
    }
    
    res.status(201).json({
      message: `${createdIds.length} area maps created successfully`,
      area_map_ids: createdIds
    });
    
  } catch (error) {
    console.error('Error batch creating area maps:', error);
    res.status(500).json({ message: 'Error creating area maps', error: error.message });
  }
};

// Get area map statistics
exports.getAreaMapStats = async (req, res) => {
  try {
    const { e_paper_id } = req.params;
    
    const [stats] = await pool.query(`
      SELECT 
        COUNT(*) as total_areas,
        SUM(CASE WHEN area_type = 'link' THEN 1 ELSE 0 END) as link_areas,
        SUM(CASE WHEN area_type = 'ad' THEN 1 ELSE 0 END) as ad_areas,
        SUM(CASE WHEN area_type = 'page_nav' THEN 1 ELSE 0 END) as nav_areas
      FROM area_maps
      WHERE e_paper_id = ? AND is_active = TRUE
    `, [e_paper_id]);
    
    res.json(stats[0]);
    
  } catch (error) {
    console.error('Error fetching area map stats:', error);
    res.status(500).json({ message: 'Error fetching area map stats', error: error.message });
  }
};

// Test if point is inside area (for frontend hit testing)
exports.testPointInArea = async (req, res) => {
  try {
    const { page_id } = req.params;
    const { x, y } = req.body;
    
    const [areaMaps] = await pool.query(
      'SELECT * FROM area_maps WHERE page_id = ? AND is_active = TRUE',
      [page_id]
    );
    
    // Simple point-in-polygon test for each area
    const clickedAreas = [];
    
    for (const area of areaMaps) {
      const coords = JSON.parse(area.coordinates);
      if (isPointInPolygon(x, y, coords)) {
        clickedAreas.push(area);
      }
    }
    
    res.json(clickedAreas);
    
  } catch (error) {
    console.error('Error testing point:', error);
    res.status(500).json({ message: 'Error testing point', error: error.message });
  }
};

// Helper function: Point in polygon test
function isPointInPolygon(x, y, polygon) {
  let inside = false;
  for (let i = 0, j = polygon.length - 1; i < polygon.length; j = i++) {
    const xi = polygon[i].x, yi = polygon[i].y;
    const xj = polygon[j].x, yj = polygon[j].y;
    
    const intersect = ((yi > y) !== (yj > y)) &&
        (x < (xj - xi) * (y - yi) / (yj - yi) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}
