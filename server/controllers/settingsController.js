const pool = require('../config/database');

// Get all settings
exports.getAllSettings = async (req, res) => {
  try {
    const [settings] = await pool.query('SELECT * FROM settings ORDER BY setting_key ASC');
    
    // Convert settings to a more usable format
    const formattedSettings = settings.map(setting => {
      let value = setting.setting_value;
      
      // Parse value based on type
      if (setting.setting_type === 'boolean') {
        value = value === 'true';
      } else if (setting.setting_type === 'number') {
        value = parseFloat(value);
      } else if (setting.setting_type === 'json') {
        try {
          value = JSON.parse(value);
        } catch (e) {
          value = {};
        }
      }
      
      return {
        id: setting.id,
        key: setting.setting_key,
        value: value,
        type: setting.setting_type,
        description: setting.description,
        updatedAt: setting.updated_at
      };
    });
    
    res.json(formattedSettings);
  } catch (error) {
    console.error('Error fetching settings:', error);
    res.status(500).json({ message: 'Error fetching settings', error: error.message });
  }
};

// Get setting by key
exports.getSettingByKey = async (req, res) => {
  try {
    const { key } = req.params;
    
    const [settings] = await pool.query(
      'SELECT * FROM settings WHERE setting_key = ?',
      [key]
    );

    if (settings.length === 0) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    const setting = settings[0];
    let value = setting.setting_value;
    
    // Parse value based on type
    if (setting.setting_type === 'boolean') {
      value = value === 'true';
    } else if (setting.setting_type === 'number') {
      value = parseFloat(value);
    } else if (setting.setting_type === 'json') {
      try {
        value = JSON.parse(value);
      } catch (e) {
        value = {};
      }
    }
    
    res.json({
      id: setting.id,
      key: setting.setting_key,
      value: value,
      type: setting.setting_type,
      description: setting.description,
      updatedAt: setting.updated_at
    });
  } catch (error) {
    console.error('Error fetching setting:', error);
    res.status(500).json({ message: 'Error fetching setting', error: error.message });
  }
};

// Get public settings (for frontend)
exports.getPublicSettings = async (req, res) => {
  try {
    // Only return specific public settings
    const publicKeys = ['subscription_mode_enabled', 'site_name', 'site_title', 'logo_url', 'maintenance_mode'];
    
    const [settings] = await pool.query(
      'SELECT setting_key, setting_value, setting_type FROM settings WHERE setting_key IN (?)',
      [publicKeys]
    );
    
    const publicSettings = {};
    settings.forEach(setting => {
      let value = setting.setting_value;
      
      if (setting.setting_type === 'boolean') {
        value = value === 'true';
      } else if (setting.setting_type === 'number') {
        value = parseFloat(value);
      }
      
      publicSettings[setting.setting_key] = value;
    });
    
    res.json(publicSettings);
  } catch (error) {
    console.error('Error fetching public settings:', error);
    res.status(500).json({ message: 'Error fetching public settings', error: error.message });
  }
};

// Update setting (admin only)
exports.updateSetting = async (req, res) => {
  try {
    const { key } = req.params;
    const { value } = req.body;
    const userId = req.user.id;

    // Check if setting exists
    const [existing] = await pool.query(
      'SELECT * FROM settings WHERE setting_key = ?',
      [key]
    );

    let setting;
    if (existing.length === 0) {
      // Create the setting if it doesn't exist
      const [result] = await pool.query(
        'INSERT INTO settings (setting_key, setting_value, setting_type, description, updated_by) VALUES (?, ?, ?, ?, ?)',
        [key, String(value), 'string', `Auto-created setting: ${key}`, userId]
      );
      setting = { id: result.insertId, setting_type: 'string' };
    } else {
      setting = existing[0];
    }

    let stringValue = value;

    // Validate and convert value based on type
    if (setting.setting_type === 'boolean') {
      stringValue = value === true || value === 'true' ? 'true' : 'false';
    } else if (setting.setting_type === 'number') {
      if (isNaN(value)) {
        return res.status(400).json({ message: 'Invalid number value' });
      }
      stringValue = value.toString();
    } else if (setting.setting_type === 'json') {
      try {
        stringValue = JSON.stringify(value);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid JSON value' });
      }
    }

    await pool.query(
      'UPDATE settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?',
      [stringValue, userId, key]
    );

    // Return updated setting
    let returnValue = value;
    if (setting.setting_type === 'boolean') {
      returnValue = stringValue === 'true';
    } else if (setting.setting_type === 'number') {
      returnValue = parseFloat(stringValue);
    }
    
    res.json({
      message: 'Setting updated successfully',
      key: key,
      value: returnValue,
      type: setting.setting_type
    });
  } catch (error) {
    console.error('Error updating setting:', error);
    res.status(500).json({ message: 'Error updating setting', error: error.message });
  }
};

// Update multiple settings (admin only)
exports.updateMultipleSettings = async (req, res) => {
  try {
    const { settings } = req.body;
    const userId = req.user.id;

    if (!settings || typeof settings !== 'object') {
      return res.status(400).json({ message: 'Invalid settings data' });
    }

    const results = [];
    const errors = [];

    // Process each setting update
    for (const [key, value] of Object.entries(settings)) {
      try {
        // Check if setting exists
        const [existing] = await pool.query(
          'SELECT * FROM settings WHERE setting_key = ?',
          [key]
        );

        let setting;
        if (existing.length === 0) {
          // Create the setting if it doesn't exist
          const [result] = await pool.query(
            'INSERT INTO settings (setting_key, setting_value, setting_type, description, updated_by) VALUES (?, ?, ?, ?, ?)',
            [key, String(value), 'string', `Auto-created setting: ${key}`, userId]
          );
          setting = { id: result.insertId, setting_type: 'string' };
        } else {
          setting = existing[0];
        }

        let stringValue = value;

        // Validate and convert value based on type
        if (setting.setting_type === 'boolean') {
          stringValue = value === true || value === 'true' ? 'true' : 'false';
        } else if (setting.setting_type === 'number') {
          if (isNaN(value)) {
            errors.push({ key, error: 'Invalid number value' });
            continue;
          }
          stringValue = value.toString();
        } else if (setting.setting_type === 'json') {
          try {
            stringValue = JSON.stringify(value);
          } catch (e) {
            errors.push({ key, error: 'Invalid JSON value' });
            continue;
          }
        }

        await pool.query(
          'UPDATE settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?',
          [stringValue, userId, key]
        );

        // Return updated value
        let returnValue = value;
        if (setting.setting_type === 'boolean') {
          returnValue = stringValue === 'true';
        } else if (setting.setting_type === 'number') {
          returnValue = parseFloat(stringValue);
        }

        results.push({ key, value: returnValue, type: setting.setting_type });
      } catch (err) {
        errors.push({ key, error: err.message });
      }
    }

    res.json({
      message: 'Settings updated',
      updated: results,
      errors: errors.length > 0 ? errors : undefined
    });
  } catch (error) {
    console.error('Error updating settings:', error);
    res.status(500).json({ message: 'Error updating settings', error: error.message });
  }
};

// Create new setting (admin only)
exports.createSetting = async (req, res) => {
  try {
    const { key, value, type, description } = req.body;
    const userId = req.user.id;

    // Check if setting already exists
    const [existing] = await pool.query(
      'SELECT id FROM settings WHERE setting_key = ?',
      [key]
    );

    if (existing.length > 0) {
      return res.status(400).json({ message: 'Setting key already exists' });
    }

    let stringValue = value;
    let settingType = type || 'string';

    // Validate and convert value based on type
    if (settingType === 'boolean') {
      stringValue = value === true || value === 'true' ? 'true' : 'false';
    } else if (settingType === 'number') {
      if (isNaN(value)) {
        return res.status(400).json({ message: 'Invalid number value' });
      }
      stringValue = value.toString();
    } else if (settingType === 'json') {
      try {
        stringValue = JSON.stringify(value);
      } catch (e) {
        return res.status(400).json({ message: 'Invalid JSON value' });
      }
    }

    const [result] = await pool.query(
      'INSERT INTO settings (setting_key, setting_value, setting_type, description, updated_by) VALUES (?, ?, ?, ?, ?)',
      [key, stringValue, settingType, description, userId]
    );

    res.status(201).json({
      message: 'Setting created successfully',
      id: result.insertId,
      key: key,
      value: value,
      type: settingType
    });
  } catch (error) {
    console.error('Error creating setting:', error);
    res.status(500).json({ message: 'Error creating setting', error: error.message });
  }
};

// Delete setting (admin only)
exports.deleteSetting = async (req, res) => {
  try {
    const { key } = req.params;

    // Prevent deletion of critical settings
    const protectedKeys = ['subscription_mode_enabled', 'maintenance_mode'];
    if (protectedKeys.includes(key)) {
      return res.status(400).json({ message: 'Cannot delete protected setting' });
    }

    const [result] = await pool.query(
      'DELETE FROM settings WHERE setting_key = ?',
      [key]
    );

    if (result.affectedRows === 0) {
      return res.status(404).json({ message: 'Setting not found' });
    }

    res.json({ message: 'Setting deleted successfully' });
  } catch (error) {
    console.error('Error deleting setting:', error);
    res.status(500).json({ message: 'Error deleting setting', error: error.message });
  }
};

// Check subscription mode status (public)
exports.checkSubscriptionMode = async (req, res) => {
  try {
    const [settings] = await pool.query(
      "SELECT setting_value FROM settings WHERE setting_key = 'subscription_mode_enabled'"
    );

    if (settings.length === 0) {
      return res.json({ subscriptionModeEnabled: false });
    }

    res.json({ 
      subscriptionModeEnabled: settings[0].setting_value === 'true'
    });
  } catch (error) {
    console.error('Error checking subscription mode:', error);
    res.status(500).json({ message: 'Error checking subscription mode', error: error.message });
  }
};

// Upload logo (admin only)
exports.uploadLogo = async (req, res) => {
  try {
    const userId = req.user.id;
    
    if (!req.file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }

    // Generate logo URL path
    const logoUrl = `/uploads/logos/${req.file.filename}`;
    
    // Update logo_url setting in database
    await pool.query(
      'UPDATE settings SET setting_value = ?, updated_by = ? WHERE setting_key = ?',
      [logoUrl, userId, 'logo_url']
    );

    res.json({
      message: 'Logo uploaded successfully',
      logoUrl: logoUrl
    });
  } catch (error) {
    console.error('Error uploading logo:', error);
    res.status(500).json({ message: 'Error uploading logo', error: error.message });
  }
};

// Send test email (admin only)
exports.sendTestEmail = async (req, res) => {
  try {
    const { to } = req.body;
    
    if (!to) {
      return res.status(400).json({ message: 'Recipient email is required' });
    }

    // Get SMTP settings
    const [settings] = await pool.query(
      'SELECT setting_key, setting_value FROM settings WHERE setting_key LIKE "smtp_%"'
    );
    
    const smtpSettings = {};
    settings.forEach(setting => {
      smtpSettings[setting.setting_key] = setting.setting_value;
    });

    // Validate SMTP settings
    if (!smtpSettings.smtp_host || !smtpSettings.smtp_port || !smtpSettings.smtp_user) {
      return res.status(400).json({ 
        message: 'SMTP settings are incomplete. Please configure SMTP settings first.' 
      });
    }

    // Create transporter
    const nodemailer = require('nodemailer');
    const transporter = nodemailer.createTransport({
      host: smtpSettings.smtp_host,
      port: parseInt(smtpSettings.smtp_port),
      secure: parseInt(smtpSettings.smtp_port) === 465,
      auth: {
        user: smtpSettings.smtp_user,
        pass: smtpSettings.smtp_password,
      },
    });

    // Send test email
    const info = await transporter.sendMail({
      from: `"${smtpSettings.smtp_from_name || 'Test'}" <${smtpSettings.smtp_from_email || smtpSettings.smtp_user}>`,
      to: to,
      subject: 'Test Email from E-Paper Platform',
      html: `
        <h2>Test Email Successful!</h2>
        <p>This is a test email from your E-Paper Platform settings.</p>
        <p>If you received this email, your SMTP configuration is working correctly.</p>
        <hr>
        <p><strong>SMTP Settings Used:</strong></p>
        <ul>
          <li>Host: ${smtpSettings.smtp_host}</li>
          <li>Port: ${smtpSettings.smtp_port}</li>
          <li>Username: ${smtpSettings.smtp_user}</li>
          <li>From: ${smtpSettings.smtp_from_name} <${smtpSettings.smtp_from_email}></li>
        </ul>
      `,
    });

    res.json({
      message: 'Test email sent successfully',
      messageId: info.messageId,
      previewUrl: nodemailer.getTestMessageUrl ? nodemailer.getTestMessageUrl(info) : null
    });
  } catch (error) {
    console.error('Error sending test email:', error);
    res.status(500).json({ 
      message: 'Failed to send test email', 
      error: error.message,
      hint: 'Please check your SMTP settings and ensure they are correct.'
    });
  }
};
