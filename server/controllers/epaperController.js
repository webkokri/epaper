const pool = require('../config/database');
const path = require('path');
const fs = require('fs');
const sharp = require('sharp');
const { v4: uuidv4 } = require('uuid');

// Import subscription helper
const { checkEPaperAccess, filterPagesByAccess, FREE_PREVIEW_PAGES } = require('../utils/subscriptionHelper');

// Ensure upload directories exist
const uploadsDir = path.join(__dirname, '../uploads');
const papersDir = path.join(uploadsDir, 'papers');
const pagesDir = path.join(uploadsDir, 'pages');
const thumbnailsDir = path.join(uploadsDir, 'thumbnails');
const cropsDir = path.join(uploadsDir, 'crops');

[papersDir, pagesDir, thumbnailsDir, cropsDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
});

// Get all e-papers
exports.getAllEPapers = async (req, res) => {
  try {
    const [ePapers] = await pool.query(`
      SELECT e.*, u.name as created_by_name
      FROM e_papers e
      LEFT JOIN users u ON e.created_by = u.id
      ORDER BY e.created_at DESC
    `);

    // Get page count and first page image for each e-paper
    for (let paper of ePapers) {
      const [pages] = await pool.query(
        'SELECT COUNT(*) as count FROM e_paper_pages WHERE e_paper_id = ?',
        [paper.id]
      );
      paper.page_count = pages[0].count;

      // Get first page image
      const [firstPage] = await pool.query(
        'SELECT image_path FROM e_paper_pages WHERE e_paper_id = ? ORDER BY page_number ASC LIMIT 1',
        [paper.id]
      );
      if (firstPage.length > 0) {
        paper.first_page_image = firstPage[0].image_path;
      }
    }

    res.json(ePapers);
  } catch (error) {
    console.error('Error fetching e-papers:', error);
    res.status(500).json({ message: 'Error fetching e-papers', error: error.message });
  }
};

// Get e-paper by ID with pages (with subscription check)
exports.getEPaperById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user?.id || null;

    // Get e-paper details
    const [ePapers] = await pool.query(
      'SELECT * FROM e_papers WHERE id = ?',
      [id]
    );

    if (ePapers.length === 0) {
      return res.status(404).json({ message: 'E-paper not found' });
    }

    const ePaper = ePapers[0];

    // Get pages
    const [pages] = await pool.query(
      'SELECT * FROM e_paper_pages WHERE e_paper_id = ? ORDER BY page_number',
      [id]
    );

    // Get total page count for reference
    const totalPages = pages.length;

    // Check subscription access
    const accessInfo = await checkEPaperAccess(userId);

    // Get area maps for each page (only for allowed pages)
    for (let page of pages) {
      const [areaMaps] = await pool.query(
        'SELECT * FROM area_maps WHERE page_id = ? AND is_active = TRUE',
        [page.id]
      );
      page.area_maps = areaMaps;
    }

    // Filter pages based on subscription access
    const allowedPages = pages.slice(0, accessInfo.pages.allowed === -1 ? pages.length : accessInfo.pages.allowed);
    
    ePaper.pages = allowedPages;
    ePaper.total_pages = totalPages;
    
    // Add access info to response
    ePaper.access_info = {
      can_access: accessInfo.canAccess,
      access_type: accessInfo.accessType,
      pages_allowed: accessInfo.pages.allowed,
      pages_total: totalPages,
      is_subscriber: accessInfo.isSubscriber,
      is_free_plan: accessInfo.isFreePlan
    };

    // If user can't access, we still return the e-paper info but with limited pages
    // The frontend will handle showing the appropriate message
    if (!accessInfo.canAccess) {
      ePaper.pages_limited = true;
      ePaper.message = accessInfo.accessType === 'unauthenticated' 
        ? 'Please login to access this e-paper' 
        : 'Please subscribe to access all pages';
    }

    res.json(ePaper);
  } catch (error) {
    console.error('Error fetching e-paper:', error);
    res.status(500).json({ message: 'Error fetching e-paper', error: error.message });
  }
};

// Create new e-paper with PDF processing
exports.createEPaper = async (req, res) => {
  try {
    console.log('=== createEPaper called ===');
    const {
      title,
      description,
      alias,
      edition_date,
      meta_title,
      meta_description,
      category,
      status = 'draft',
      is_public = true,
      is_free = false,
      categories = []
    } = req.body;
    const userId = req.user.id;

    console.log('Request body:', {
      title,
      description,
      alias,
      edition_date,
      meta_title,
      meta_description,
      category,
      status,
      is_public,
      categories,
      userId
    });
    console.log('Request files:', req.files);

    // Check for files in the new structure (from upload.fields)
    const pdfFiles = req.files?.pdf || [];
    const imageFiles = req.files?.images || [];
    
    console.log('PDF files:', pdfFiles);
    console.log('Image files:', imageFiles);

    if (pdfFiles.length === 0 && imageFiles.length === 0) {
      console.log('No files uploaded');
      return res.status(400).json({ message: 'PDF or image files are required' });
    }

    const pdfId = uuidv4();
    let totalPages = 0;
    let pdfPath = null;
    let pdfFilename = null;
    const pageImages = [];

    // Get PDF file info first
    if (pdfFiles.length > 0) {
      const pdfFile = pdfFiles[0];
      pdfPath = pdfFile.path;
      pdfFilename = pdfFile.filename;
    }

    // Create e-paper record with actual pdf_path
    const [result] = await pool.query(
      `INSERT INTO e_papers
       (title, description, pdf_path, thumbnail_path, total_pages, status, is_public, is_free, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        title,
        description || null,
        pdfPath ? `/uploads/papers/${pdfFilename}` : '',
        null, // thumbnail_path will be updated later
        0,    // total_pages will be updated later
        status,
        is_public,
        is_free,
        userId
      ]
    );

    const ePaperId = result.insertId;
    console.log('Created e-paper with ID:', ePaperId);

    // Handle PDF processing
    if (pdfFiles.length > 0) {

      console.log('PDF details:', { pdfPath, pdfFilename, pdfId });

      // Convert PDF to images using pdf-to-img
      console.log('Converting PDF to images using pdf-to-img...');

      const { pdf } = await import('pdf-to-img');
      const document = await pdf(pdfPath, { scale: 2.0 });

      let pageNum = 1;

      for await (const imageBuffer of document) {
        console.log(`Processing page ${pageNum}...`);

        const pageFilename = `${pdfId}-${pageNum}.jpg`;
        const pagePath = path.join(pagesDir, pageFilename);

        await sharp(imageBuffer)
          .resize(1200, 1600, { fit: 'inside', withoutEnlargement: false })
          .jpeg({ quality: 90 })
          .toFile(pagePath);

        console.log(`Page ${pageNum} saved to:`, pagePath);

        pageImages.push({
          path: pagePath,
          name: pageFilename
        });

        pageNum++;
      }

      console.log(`Converted ${pageImages.length} pages`);
      totalPages = pageImages.length;

      // Save page records with actual e_paper_id
      for (let i = 0; i < pageImages.length; i++) {
        const pageImage = pageImages[i];
        await pool.query(
          `INSERT INTO e_paper_pages (e_paper_id, page_number, image_path)
           VALUES (?, ?, ?)`,
          [ePaperId, i + 1, `/uploads/pages/${pageImage.name}`]
        );
      }

      // Generate thumbnail from first page
      if (pageImages.length > 0) {
        const firstPagePath = path.join(pagesDir, `${pdfId}-1.jpg`);
        const thumbnailPath = path.join(thumbnailsDir, `${pdfId}_thumb.jpg`);
        await sharp(firstPagePath)
          .resize(400, 533, { fit: 'cover' })
          .toFile(thumbnailPath);
      }
    }

    // Handle image uploads
    if (imageFiles.length > 0) {
      let processedImages = 0;

      for (let i = 0; i < imageFiles.length; i++) {
        const imageFile = imageFiles[i];
        const imageFilename = `${pdfId}-${i + 1}.jpg`;
        const imagePath = path.join(pagesDir, imageFilename);

        try {
          // Process image
          const buffer = fs.readFileSync(imageFile.path);
          await sharp(buffer)
            .rotate(false)
            .toColorspace('srgb')
            .flatten({ background: { r: 255, g: 255, b: 255 } })
            .resize(1200, 1600, { fit: 'inside', withoutEnlargement: true })
            .jpeg({ quality: 90 })
            .toFile(imagePath);

          // Insert page with actual e_paper_id
          await pool.query(
            `INSERT INTO e_paper_pages (e_paper_id, page_number, image_path)
             VALUES (?, ?, ?)`,
            [ePaperId, i + 1, `/uploads/pages/${imageFilename}`]
          );
          processedImages++;
        } catch (error) {
          console.error(`Error processing image ${i + 1}:`, error.message);
          // Clean up any partial file
          if (fs.existsSync(imagePath)) {
            fs.unlinkSync(imagePath);
          }
        }
      }

      totalPages = processedImages;

      // Generate thumbnail from first image if any processed
      if (processedImages > 0) {
        const firstImagePath = path.join(pagesDir, `${pdfId}-1.jpg`);
        const thumbnailPath = path.join(thumbnailsDir, `${pdfId}_thumb.jpg`);
        try {
          const buffer = fs.readFileSync(firstImagePath);
          await sharp(buffer)
            .rotate(false)
            .toColorspace('srgb')
            .flatten({ background: { r: 255, g: 255, b: 255 } })
            .resize(400, 533, { fit: 'cover' })
            .toFile(thumbnailPath);
        } catch (error) {
          console.error('Error generating thumbnail:', error.message);
          if (fs.existsSync(thumbnailPath)) {
            fs.unlinkSync(thumbnailPath);
          }
        }
      }
    }

    // Update e-paper record with thumbnail and total_pages
    await pool.query(
      `UPDATE e_papers 
       SET thumbnail_path = ?, total_pages = ? 
       WHERE id = ?`,
      [
        totalPages > 0 ? `/uploads/thumbnails/${pdfId}_thumb.jpg` : null,
        totalPages,
        ePaperId
      ]
    );

    // Save categories
    if (categories && categories.length > 0 && ePaperId) {
      console.log('Saving categories:', categories, 'for e-paper ID:', ePaperId);
      for (const categoryId of categories) {
        if (categoryId) {
          await pool.query(
            'INSERT INTO e_paper_categories (e_paper_id, category_id) VALUES (?, ?)',
            [ePaperId, categoryId]
          );
        }
      }
    }

    res.status(201).json({
      message: 'E-paper created successfully',
      e_paper_id: ePaperId,
      total_pages: totalPages
    });

  } catch (error) {
    console.error('=== Error creating e-paper ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error stack:', error.stack);
    res.status(500).json({ message: 'Error creating e-paper', error: error.message });
  }
};

// Update e-paper
exports.updateEPaper = async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, status, is_public, is_free } = req.body;

    const updates = [];
    const values = [];

    if (title) {
      updates.push('title = ?');
      values.push(title);
    }
    if (description) {
      updates.push('description = ?');
      values.push(description);
    }
    if (status) {
      updates.push('status = ?');
      values.push(status);
    }
    if (is_public !== undefined) {
      updates.push('is_public = ?');
      values.push(is_public);
    }
    if (is_free !== undefined) {
      updates.push('is_free = ?');
      values.push(is_free);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    values.push(id);

    await pool.query(
      `UPDATE e_papers SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    res.json({ message: 'E-paper updated successfully' });

  } catch (error) {
    console.error('Error updating e-paper:', error);
    res.status(500).json({ message: 'Error updating e-paper', error: error.message });
  }
};

// Delete e-paper
exports.deleteEPaper = async (req, res) => {
  try {
    const { id } = req.params;

    // Get file paths before deletion
    const [ePapers] = await pool.query(
      'SELECT pdf_path, thumbnail_path FROM e_papers WHERE id = ?',
      [id]
    );

    if (ePapers.length === 0) {
      return res.status(404).json({ message: 'E-paper not found' });
    }

    // Delete files
    if (ePapers[0].pdf_path) {
      const pdfPath = path.join(__dirname, '..', ePapers[0].pdf_path);
      if (fs.existsSync(pdfPath)) fs.unlinkSync(pdfPath);
    }
    if (ePapers[0].thumbnail_path) {
      const thumbPath = path.join(__dirname, '..', ePapers[0].thumbnail_path);
      if (fs.existsSync(thumbPath)) fs.unlinkSync(thumbPath);
    }

    // Delete page images
    const [pages] = await pool.query(
      'SELECT image_path FROM e_paper_pages WHERE e_paper_id = ?',
      [id]
    );

    for (let page of pages) {
      if (page.image_path) {
        const pagePath = path.join(__dirname, '..', page.image_path);
        if (fs.existsSync(pagePath)) fs.unlinkSync(pagePath);
      }
    }

    // Delete from database (cascades to pages and area_maps)
    await pool.query('DELETE FROM e_papers WHERE id = ?', [id]);

    res.json({ message: 'E-paper deleted successfully' });

  } catch (error) {
    console.error('Error deleting e-paper:', error);
    res.status(500).json({ message: 'Error deleting e-paper', error: error.message });
  }
};

// Publish e-paper
exports.publishEPaper = async (req, res) => {
  try {
    const { id } = req.params;

    await pool.query(
      "UPDATE e_papers SET status = 'published', publish_date = NOW() WHERE id = ?",
      [id]
    );

    res.json({ message: 'E-paper published successfully' });

  } catch (error) {
    console.error('Error publishing e-paper:', error);
    res.status(500).json({ message: 'Error publishing e-paper', error: error.message });
  }
};

// Smart crop and share
exports.cropAndShare = async (req, res) => {
  try {
    const { e_paper_id, page_id, crop_coordinates } = req.body;
    const userId = req.user.id;

    // Get page image
    const [pages] = await pool.query(
      'SELECT image_path FROM e_paper_pages WHERE id = ? AND e_paper_id = ?',
      [page_id, e_paper_id]
    );

    if (pages.length === 0) {
      return res.status(404).json({ message: 'Page not found' });
    }

    const pagePath = path.join(__dirname, '..', pages[0].image_path);
    const { x, y, width, height } = crop_coordinates;

    // Generate unique token
    const shareToken = uuidv4();
    const croppedFilename = `crop_${shareToken}.jpg`;
    const croppedPath = path.join(cropsDir, croppedFilename);

    // Crop image
    await sharp(pagePath)
      .extract({ left: x, top: y, width, height })
      .toFile(croppedPath);

    // Save to database
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + 30); // 30 days expiry

    await pool.query(
      `INSERT INTO cropped_shares
       (e_paper_id, page_id, crop_coordinates, cropped_image_path, share_token, share_url, expires_at, created_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        e_paper_id,
        page_id,
        JSON.stringify(crop_coordinates),
        `/uploads/crops/${croppedFilename}`,
        shareToken,
        `/share/${shareToken}`,
        expiresAt,
        userId
      ]
    );

    res.json({
      message: 'Image cropped and shared successfully',
      share_token: shareToken,
      share_url: `/share/${shareToken}`,
      cropped_image: `/uploads/crops/${croppedFilename}`
    });

  } catch (error) {
    console.error('Error cropping and sharing:', error);
    res.status(500).json({ message: 'Error cropping and sharing', error: error.message });
  }
};

// Get shared crop
exports.getSharedCrop = async (req, res) => {
  try {
    const { token } = req.params;

    const [shares] = await pool.query(
      'SELECT * FROM cropped_shares WHERE share_token = ? AND expires_at > NOW()',
      [token]
    );

    if (shares.length === 0) {
      return res.status(404).json({ message: 'Share not found or expired' });
    }

    res.json(shares[0]);

  } catch (error) {
    console.error('Error fetching shared crop:', error);
    res.status(500).json({ message: 'Error fetching shared crop', error: error.message });
  }
};
