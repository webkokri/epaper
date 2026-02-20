import React, { useState, useEffect } from 'react';

// @mui material components
import {
  Card,
  Grid,
  Switch,
  TextField,
  Typography,
  Box,
  Alert,
  Chip,
  Divider,
  Tabs,
  Tab,
  Paper,
  Avatar,
  InputAdornment,
  Accordion,
  AccordionSummary,
  AccordionDetails,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from '@mui/material';

// Material Dashboard 2 React components
import MDBox from 'components/MDBox';
import MDTypography from 'components/MDTypography';
import MDButton from 'components/MDButton';

// Material Dashboard 2 React example components
import DashboardLayout from 'examples/LayoutContainers/DashboardLayout';
import DashboardNavbar from 'examples/Navbars/DashboardNavbar';
import Footer from 'examples/Footer';

// Icons
import {
  Info as InfoIcon,
  Save as SaveIcon,
  Settings as SettingsIcon,
  ExpandMore as ExpandMoreIcon,
  Business as BusinessIcon,
  Email as EmailIcon,
  Phone as PhoneIcon,
  LocationOn as LocationIcon,
  Image as ImageIcon,
  Search as SearchIcon,
  Description as DescriptionIcon,
  ToggleOn as ToggleOnIcon,
  Security as SecurityIcon,
  Notifications as NotificationsIcon,
  CloudUpload as CloudUploadIcon,
  Send as SendIcon,
} from '@mui/icons-material';

// API
import { settingsAPI } from 'services/api';

function TabPanel({ children, value, index, ...other }) {
  return (
    <div
      role="tabpanel"
      hidden={value !== index}
      id={`settings-tabpanel-${index}`}
      aria-labelledby={`settings-tab-${index}`}
      {...other}
    >
      {value === index && <Box sx={{ p: 3 }}>{children}</Box>}
    </div>
  );
}

function Settings() {
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });
  const [activeTab, setActiveTab] = useState(0);
  const [expanded, setExpanded] = useState('subscription');

  const [testEmailDialog, setTestEmailDialog] = useState({ open: false, sending: false, result: null });

  // Logo upload state
  const [logoPreview, setLogoPreview] = useState(null);
  const [uploadingLogo, setUploadingLogo] = useState(false);

  const handleTestEmailOpen = () => {
    setTestEmailDialog({ open: true, sending: false, result: null });
  };

  const handleTestEmailClose = () => {
    setTestEmailDialog({ open: false, sending: false, result: null });
  };

  const handleSendTestEmail = async () => {
    const testEmail = getSettingValue('smtp_from_email') || 'test@example.com';
    setTestEmailDialog(prev => ({ ...prev, sending: true }));
    
    try {
      const response = await settingsAPI.sendTestEmail(testEmail);
      setTestEmailDialog(prev => ({ 
        ...prev, 
        sending: false, 
        result: { success: true, message: 'Test email sent successfully!' }
      }));
    } catch (error) {
      setTestEmailDialog(prev => ({ 
        ...prev, 
        sending: false, 
        result: { success: false, message: error.response?.data?.message || 'Failed to send test email' }
      }));
    }
  };

  const handleLogoFileChange = async (event) => {
    const file = event.target.files[0];
    if (!file) return;

    // Preview the file
    const reader = new FileReader();
    reader.onloadend = () => {
      setLogoPreview(reader.result);
    };
    reader.readAsDataURL(file);

    // Upload the file
    setUploadingLogo(true);
    const formData = new FormData();
    formData.append('logo', file);

    try {
      const response = await settingsAPI.uploadLogo(formData);
      setSettings(prev => ({
        ...prev,
        logo_url: { ...prev.logo_url, value: response.data?.logoUrl }
      }));
      setMessage({ type: 'success', text: 'Logo uploaded successfully!' });
    } catch (error) {
      setMessage({ type: 'error', text: 'Failed to upload logo' });
    } finally {
      setUploadingLogo(false);
    }
  };

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      setLoading(true);
      const response = await settingsAPI.getAllSettings();
      
      // Convert array to object for easier access
      const settingsObj = {};
      response.data.forEach(setting => {
        settingsObj[setting.key] = setting;
      });
      
      setSettings(settingsObj);
    } catch (error) {
      console.error('Error fetching settings:', error);
      setMessage({ type: 'error', text: 'Failed to load settings' });
    } finally {
      setLoading(false);
    }
  };

  const handleToggleChange = async (key) => {
    const setting = settings[key];
    if (!setting) return;

    const newValue = !setting.value;
    
    // Optimistic update
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], value: newValue }
    }));

    try {
      await settingsAPI.updateSetting(key, newValue);
      setMessage({ 
        type: 'success', 
        text: `${formatSettingName(key)} ${newValue ? 'enabled' : 'disabled'} successfully` 
      });
      
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error updating setting:', error);
      setSettings(prev => ({
        ...prev,
        [key]: { ...prev[key], value: !newValue }
      }));
      setMessage({ type: 'error', text: 'Failed to update setting' });
    }
  };

  const handleTextChange = (key, value) => {
    setSettings(prev => ({
      ...prev,
      [key]: { ...prev[key], value }
    }));
  };

  const handleSaveTextSetting = async (key) => {
    const setting = settings[key];
    if (!setting) return;

    setSaving(true);
    try {
      await settingsAPI.updateSetting(key, setting.value);
      setMessage({ 
        type: 'success', 
        text: `${formatSettingName(key)} updated successfully` 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving setting:', error);
      setMessage({ type: 'error', text: 'Failed to save setting' });
    } finally {
      setSaving(false);
    }
  };

  const handleSaveAllInSection = async (keys) => {
    setSaving(true);
    try {
      const updates = {};
      keys.forEach(key => {
        if (settings[key]) {
          updates[key] = settings[key].value;
        }
      });
      
      await settingsAPI.updateMultipleSettings(updates);
      setMessage({ 
        type: 'success', 
        text: 'All settings saved successfully' 
      });
      setTimeout(() => setMessage({ type: '', text: '' }), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Failed to save settings' });
    } finally {
      setSaving(false);
    }
  };

  const formatSettingName = (key) => {
    return key
      .split('_')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const handleTabChange = (event, newValue) => {
    setActiveTab(newValue);
  };

  const handleAccordionChange = (panel) => (event, isExpanded) => {
    setExpanded(isExpanded ? panel : false);
  };

  const getSettingValue = (key, defaultValue = '') => {
    return settings[key]?.value || defaultValue;
  };

  const renderTextField = (key, label, icon, multiline = false, rows = 1, type = 'text') => (
    <TextField
      fullWidth
      label={label}
      value={getSettingValue(key)}
      onChange={(e) => handleTextChange(key, e.target.value)}
      multiline={multiline}
      rows={rows}
      type={type}
      variant="outlined"
      sx={{ mb: 2 }}
      InputProps={{
        startAdornment: icon && (
          <InputAdornment position="start">
            {icon}
          </InputAdornment>
        ),
      }}
    />
  );

  const renderToggle = (key, label, description, color = 'primary') => {
    const setting = settings[key];
    if (!setting) return null;

    const isSubscriptionMode = key === 'subscription_mode_enabled';

    return (
      <Card sx={{ p: 3, mb: 2, bgcolor: 'background.paper' }}>
        <Box display="flex" alignItems="center" justifyContent="space-between">
          <Box>
            <Typography variant="h6" fontWeight="medium" gutterBottom>
              {label}
            </Typography>
            <Typography variant="body2" color="text.secondary">
              {description}
            </Typography>
          </Box>
          <Box display="flex" alignItems="center" gap={2}>
            {isSubscriptionMode && (
              <Chip
                label={setting.value ? 'REQUIRED' : 'FREE ACCESS'}
                color={setting.value ? 'warning' : 'success'}
                size="small"
                sx={{ fontWeight: 'bold' }}
              />
            )}
            <Switch
              checked={setting.value}
              onChange={() => handleToggleChange(key)}
              color={color}
            />
          </Box>
        </Box>
      </Card>
    );
  };

  if (loading) {
    return (
      <DashboardLayout>
        <DashboardNavbar />
        <MDBox pt={6} pb={3}>
          <MDTypography>Loading settings...</MDTypography>
        </MDBox>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <DashboardNavbar />
      <MDBox pt={6} pb={3}>
        <Grid container spacing={6}>
          <Grid item xs={12}>
            <Card>
              <MDBox
                mx={2}
                mt={-3}
                py={3}
                px={2}
                variant="gradient"
                bgColor="info"
                borderRadius="lg"
                coloredShadow="info"
                display="flex"
                alignItems="center"
                gap={2}
              >
                <SettingsIcon sx={{ color: 'white', fontSize: 32 }} />
                <MDTypography variant="h6" color="white">
                  General Settings
                </MDTypography>
              </MDBox>
              
              <MDBox p={3}>
                {message.text && (
                  <Alert 
                    severity={message.type} 
                    sx={{ mb: 3 }}
                    onClose={() => setMessage({ type: '', text: '' })}
                  >
                    {message.text}
                  </Alert>
                )}

                <Paper sx={{ mb: 3 }}>
                  <Tabs
                    value={activeTab}
                    onChange={handleTabChange}
                    indicatorColor="primary"
                    textColor="primary"
                    variant="scrollable"
                    scrollButtons="auto"
                  >
                    <Tab icon={<ToggleOnIcon />} label="Subscription" />
                    <Tab icon={<BusinessIcon />} label="Site Info" />
                    <Tab icon={<ImageIcon />} label="Branding" />
                    <Tab icon={<SearchIcon />} label="SEO" />
                    <Tab icon={<EmailIcon />} label="Email" />
                    <Tab icon={<SecurityIcon />} label="System" />
                  </Tabs>
                </Paper>

                {/* Subscription Tab */}
                <TabPanel value={activeTab} index={0}>
                  <Typography variant="h5" fontWeight="medium" gutterBottom>
                    Subscription Mode
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Control whether visitors need a subscription to access e-papers
                  </Typography>
                  
                  {renderToggle(
                    'subscription_mode_enabled',
                    'Require Subscription',
                    'When enabled, visitors must have an active subscription to read e-papers. When disabled, all content is freely accessible.',
                    'warning'
                  )}
                </TabPanel>

                {/* Site Info Tab */}
                <TabPanel value={activeTab} index={1}>
                  <Typography variant="h5" fontWeight="medium" gutterBottom>
                    Site Information
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Basic information about your website that will be displayed to visitors
                  </Typography>

                  <Card sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <BusinessIcon color="info" /> General Info
                    </Typography>
                    <Divider sx={{ mb: 3 }} />
                    
                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        {renderTextField('site_name', 'Site Name', <BusinessIcon />)}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        {renderTextField('contact_email', 'Contact Email', <EmailIcon />, false, 1, 'email')}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        {renderTextField('contact_phone', 'Contact Phone', <PhoneIcon />)}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        {renderTextField('contact_address', 'Contact Address', <LocationIcon />)}
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <MDButton
                        variant="gradient"
                        color="info"
                        onClick={() => handleSaveAllInSection(['site_name', 'contact_email', 'contact_phone', 'contact_address'])}
                        disabled={saving}
                        startIcon={<SaveIcon />}
                      >
                        {saving ? 'Saving...' : 'Save Site Info'}
                      </MDButton>
                    </Box>
                  </Card>

                  <Card sx={{ p: 3, bgcolor: 'background.paper' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <NotificationsIcon color="info" /> Social Media Links
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Add your social media profiles to connect with your audience
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                      <Grid item xs={12} md={6}>
                        {renderTextField('social_facebook', 'Facebook URL', null)}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        {renderTextField('social_twitter', 'Twitter URL', null)}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        {renderTextField('social_instagram', 'Instagram URL', null)}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        {renderTextField('social_linkedin', 'LinkedIn URL', null)}
                      </Grid>
                      <Grid item xs={12} md={6}>
                        {renderTextField('social_youtube', 'YouTube URL', null)}
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <MDButton
                        variant="gradient"
                        color="info"
                        onClick={() => handleSaveAllInSection(['social_facebook', 'social_twitter', 'social_instagram', 'social_linkedin', 'social_youtube'])}
                        disabled={saving}
                        startIcon={<SaveIcon />}
                      >
                        {saving ? 'Saving...' : 'Save Social Links'}
                      </MDButton>
                    </Box>
                  </Card>
                </TabPanel>

                {/* Branding Tab */}
                <TabPanel value={activeTab} index={2}>
                  <Typography variant="h5" fontWeight="medium" gutterBottom>
                    Branding & Logo
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Customize your site appearance and branding
                  </Typography>

                  <Card sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
                    <Typography variant="h6" gutterBottom>
                      Site Logo
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Upload your site logo. Recommended size: 200x200px, PNG or SVG format
                    </Typography>
                    
                    <Box display="flex" alignItems="center" gap={4} flexWrap="wrap">
                      <Avatar
                        src={logoPreview || getSettingValue('logo_url')}
                        alt="Site Logo"
                        sx={{ 
                          width: 120, 
                          height: 120, 
                          bgcolor: 'grey.200',
                          border: '2px solid',
                          borderColor: 'grey.300'
                        }}
                        variant="rounded"
                      >
                        <ImageIcon sx={{ fontSize: 40, color: 'grey.500' }} />
                      </Avatar>
                      
                      <Box>
                        <input
                          accept="image/*"
                          style={{ display: 'none' }}
                          id="logo-upload-button"
                          type="file"
                          onChange={handleLogoFileChange}
                        />
                        <label htmlFor="logo-upload-button">
                          <MDButton
                            variant="gradient"
                            color="info"
                            component="span"
                            startIcon={<CloudUploadIcon />}
                            disabled={uploadingLogo}
                          >
                            {uploadingLogo ? 'Uploading...' : 'Upload Logo'}
                          </MDButton>
                        </label>
                        <Typography variant="caption" display="block" color="text.secondary" sx={{ mt: 1 }}>
                          Max file size: 5MB
                        </Typography>
                      </Box>
                    </Box>

                    <Divider sx={{ my: 3 }} />

                    <Typography variant="subtitle2" gutterBottom>
                      Or enter logo URL manually
                    </Typography>
                    {renderTextField('logo_url', 'Logo URL Path', <ImageIcon />)}
                    
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <MDButton
                        variant="outlined"
                        color="info"
                        onClick={() => handleSaveTextSetting('logo_url')}
                        disabled={saving}
                        startIcon={<SaveIcon />}
                      >
                        Save URL
                      </MDButton>
                    </Box>
                  </Card>

                  {/* Favicon Section */}
                  <Card sx={{ p: 3, bgcolor: 'background.paper' }}>
                    <Typography variant="h6" gutterBottom>
                      Favicon
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                      Small icon displayed in browser tabs. Recommended: 32x32px ICO or PNG
                    </Typography>
                    {renderTextField('favicon_url', 'Favicon URL Path', <ImageIcon />)}
                    
                    <Box sx={{ mt: 2, display: 'flex', justifyContent: 'flex-end' }}>
                      <MDButton
                        variant="outlined"
                        color="info"
                        onClick={() => handleSaveTextSetting('favicon_url')}
                        disabled={saving}
                        startIcon={<SaveIcon />}
                      >
                        Save Favicon URL
                      </MDButton>
                    </Box>
                  </Card>
                </TabPanel>

                {/* SEO Tab */}
                <TabPanel value={activeTab} index={3}>
                  <Typography variant="h5" fontWeight="medium" gutterBottom>
                    SEO Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Optimize your site for search engines to improve visibility
                  </Typography>

                  <Card sx={{ p: 3, mb: 3, bgcolor: 'background.paper' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <SearchIcon color="info" /> Search Engine Optimization
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                          Meta Keywords
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Comma-separated keywords for search engines (e.g., e-paper, digital newspaper, news)
                        </Typography>
                        {renderTextField('meta_keywords', '', <SearchIcon />)}
                      </Grid>
                      <Grid item xs={12}>
                        <Typography variant="subtitle2" gutterBottom sx={{ fontWeight: 'bold' }}>
                          Meta Description
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Brief description of your site (150-160 characters recommended for search results)
                        </Typography>
                        {renderTextField('meta_description', '', <DescriptionIcon />, true, 4)}
                        <Box sx={{ mt: 1, display: 'flex', justifyContent: 'flex-end' }}>
                          <Typography variant="caption" color="text.secondary">
                            Characters: {(getSettingValue('meta_description') || '').length}/160
                          </Typography>
                        </Box>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <MDButton
                        variant="gradient"
                        color="info"
                        onClick={() => handleSaveAllInSection(['meta_keywords', 'meta_description'])}
                        disabled={saving}
                        startIcon={<SaveIcon />}
                      >
                        {saving ? 'Saving...' : 'Save SEO Settings'}
                      </MDButton>
                    </Box>
                  </Card>

                  <Card sx={{ p: 3, bgcolor: 'background.paper' }}>
                    <Typography variant="h6" gutterBottom sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                      <DescriptionIcon color="info" /> Open Graph Settings
                    </Typography>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                      Control how your site appears when shared on social media
                    </Typography>
                    <Divider sx={{ mb: 3 }} />

                    <Grid container spacing={3}>
                      <Grid item xs={12}>
                        {renderTextField('og_title', 'Open Graph Title', null)}
                      </Grid>
                      <Grid item xs={12}>
                        {renderTextField('og_description', 'Open Graph Description', null, true, 3)}
                      </Grid>
                      <Grid item xs={12}>
                        {renderTextField('og_image_url', 'Open Graph Image URL', <ImageIcon />)}
                        <Typography variant="caption" color="text.secondary" sx={{ mt: -1, mb: 2, display: 'block' }}>
                          Recommended size: 1200x630px
                        </Typography>
                      </Grid>
                    </Grid>

                    <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                      <MDButton
                        variant="gradient"
                        color="info"
                        onClick={() => handleSaveAllInSection(['og_title', 'og_description', 'og_image_url'])}
                        disabled={saving}
                        startIcon={<SaveIcon />}
                      >
                        {saving ? 'Saving...' : 'Save OG Settings'}
                      </MDButton>
                    </Box>
                  </Card>
                </TabPanel>

                {/* Email Tab */}
                <TabPanel value={activeTab} index={4}>
                  <Typography variant="h5" fontWeight="medium" gutterBottom>
                    Email Configuration
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Configure SMTP settings for sending emails and customize email templates
                  </Typography>

                  {/* Test Email Button */}
                  <Box sx={{ mb: 3, display: 'flex', justifyContent: 'flex-end' }}>
                    <MDButton
                      variant="outlined"
                      color="info"
                      onClick={handleTestEmailOpen}
                      startIcon={<SendIcon />}
                    >
                      Send Test Email
                    </MDButton>
                  </Box>

                  <Accordion 
                    expanded={expanded === 'smtp'} 
                    onChange={handleAccordionChange('smtp')}
                    sx={{ mb: 2 }}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <EmailIcon color="info" />
                        <Typography variant="h6">SMTP Server Settings</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Card sx={{ p: 3, mb: 2, bgcolor: 'grey.50' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                          Configure your SMTP server to send emails from the application
                        </Typography>
                        <Grid container spacing={3}>
                          <Grid item xs={12} md={6}>
                            {renderTextField('smtp_host', 'SMTP Host', null)}
                          </Grid>
                          <Grid item xs={12} md={6}>
                            {renderTextField('smtp_port', 'SMTP Port', null, false, 1, 'number')}
                          </Grid>
                          <Grid item xs={12} md={6}>
                            {renderTextField('smtp_user', 'SMTP Username', null)}
                          </Grid>
                          <Grid item xs={12} md={6}>
                            {renderTextField('smtp_password', 'SMTP Password', null, false, 1, 'password')}
                          </Grid>
                          <Grid item xs={12} md={6}>
                            {renderTextField('smtp_from_email', 'From Email', <EmailIcon />, false, 1, 'email')}
                          </Grid>
                          <Grid item xs={12} md={6}>
                            {renderTextField('smtp_from_name', 'From Name', null)}
                          </Grid>
                        </Grid>

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                          <MDButton
                            variant="gradient"
                            color="info"
                            onClick={() => handleSaveAllInSection(['smtp_host', 'smtp_port', 'smtp_user', 'smtp_password', 'smtp_from_email', 'smtp_from_name'])}
                            disabled={saving}
                            startIcon={<SaveIcon />}
                          >
                            {saving ? 'Saving...' : 'Save SMTP Settings'}
                          </MDButton>
                        </Box>
                      </Card>
                    </AccordionDetails>
                  </Accordion>

                  <Accordion 
                    expanded={expanded === 'templates'} 
                    onChange={handleAccordionChange('templates')}
                  >
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Box display="flex" alignItems="center" gap={1}>
                        <DescriptionIcon color="info" />
                        <Typography variant="h6">Email Templates</Typography>
                      </Box>
                    </AccordionSummary>
                    <AccordionDetails>
                      <Card sx={{ p: 3, bgcolor: 'grey.50' }}>
                        <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                          Customize the email templates sent to users. Use {'{{variable}}'} syntax for dynamic content.
                        </Typography>

                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
                          Welcome Email Template
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Available variables: {'{{name}}'}, {'{{site_name}}'}, {'{{email}}'}
                        </Typography>
                        {renderTextField('email_template_welcome', '', null, true, 4)}

                        <Divider sx={{ my: 3 }} />

                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
                          Subscription Confirmation Template
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Available variables: {'{{name}}'}, {'{{plan_name}}'}, {'{{site_name}}'}, {'{{start_date}}'}, {'{{end_date}}'}
                        </Typography>
                        {renderTextField('email_template_subscription', '', null, true, 4)}

                        <Divider sx={{ my: 3 }} />

                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
                          Payment Receipt Template
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Available variables: {'{{name}}'}, {'{{amount}}'}, {'{{currency}}'}, {'{{site_name}}'}, {'{{invoice_id}}'}, {'{{date}}'}
                        </Typography>
                        {renderTextField('email_template_payment', '', null, true, 4)}

                        <Divider sx={{ my: 3 }} />

                        <Typography variant="subtitle2" gutterBottom sx={{ mt: 2, fontWeight: 'bold' }}>
                          Password Reset Template
                        </Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
                          Available variables: {'{{name}}'}, {'{{site_name}}'}, {'{{reset_link}}'}
                        </Typography>
                        {renderTextField('email_template_password_reset', '', null, true, 4)}

                        <Box sx={{ mt: 3, display: 'flex', justifyContent: 'flex-end' }}>
                          <MDButton
                            variant="gradient"
                            color="info"
                            onClick={() => handleSaveAllInSection(['email_template_welcome', 'email_template_subscription', 'email_template_payment', 'email_template_password_reset'])}
                            disabled={saving}
                            startIcon={<SaveIcon />}
                          >
                            {saving ? 'Saving...' : 'Save Email Templates'}
                          </MDButton>
                        </Box>
                      </Card>
                    </AccordionDetails>
                  </Accordion>

                  {/* Test Email Dialog */}
                  <Dialog open={testEmailDialog.open} onClose={handleTestEmailClose}>
                    <DialogTitle>Send Test Email</DialogTitle>
                    <DialogContent>
                      <Typography variant="body2" sx={{ mb: 2 }}>
                        This will send a test email to: <strong>{getSettingValue('smtp_from_email') || 'your configured from email'}</strong>
                      </Typography>
                      {testEmailDialog.result && (
                        <Alert 
                          severity={testEmailDialog.result.success ? 'success' : 'error'}
                          sx={{ mt: 2 }}
                        >
                          {testEmailDialog.result.message}
                        </Alert>
                      )}
                    </DialogContent>
                    <DialogActions>
                      <Button onClick={handleTestEmailClose}>Close</Button>
                      <MDButton 
                        onClick={handleSendTestEmail} 
                        disabled={testEmailDialog.sending}
                        variant="gradient"
                        color="info"
                      >
                        {testEmailDialog.sending ? 'Sending...' : 'Send Test'}
                      </MDButton>
                    </DialogActions>
                  </Dialog>
                </TabPanel>

                {/* System Tab */}
                <TabPanel value={activeTab} index={5}>
                  <Typography variant="h5" fontWeight="medium" gutterBottom>
                    System Settings
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Advanced system configuration
                  </Typography>

                  {renderToggle(
                    'maintenance_mode',
                    'Maintenance Mode',
                    'When enabled, the site shows a maintenance page to non-admin users. Only administrators can access the site.',
                    'error'
                  )}

                  <Card sx={{ p: 3, mt: 3, bgcolor: 'warning.light' }}>
                    <Box display="flex" alignItems="center" gap={2}>
                      <InfoIcon color="warning" />
                      <Typography variant="body2">
                        <strong>Note:</strong> Changes to system settings may require a server restart to take full effect.
                      </Typography>
                    </Box>
                  </Card>
                </TabPanel>
              </MDBox>
            </Card>
          </Grid>
        </Grid>
      </MDBox>
      <Footer />
    </DashboardLayout>
  );
}

export default Settings;
