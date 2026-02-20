-- Create database if not exists
CREATE DATABASE IF NOT EXISTS u206708889_epaper;
USE u206708889_epaper;

-- Users table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) UNIQUE NOT NULL,
    password VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'user',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Dashboard stats table
CREATE TABLE IF NOT EXISTS dashboard_stats (
    id INT AUTO_INCREMENT PRIMARY KEY,
    bookings INT DEFAULT 0,
    users_count INT DEFAULT 0,
    revenue VARCHAR(50) DEFAULT '0',
    followers VARCHAR(50) DEFAULT '0',
    date DATE DEFAULT CURRENT_DATE
);

-- Authors table
CREATE TABLE IF NOT EXISTS authors (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    email VARCHAR(255) NOT NULL,
    image VARCHAR(255) DEFAULT '/assets/images/team-3.jpg',
    job_title VARCHAR(255) NOT NULL,
    job_description VARCHAR(255),
    status ENUM('online', 'offline') DEFAULT 'online',
    employed_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    budget VARCHAR(50),
    completion INT DEFAULT 0,
    status VARCHAR(50) DEFAULT 'in_progress',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Categories table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL UNIQUE,
    description TEXT,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- E-Papers table
CREATE TABLE IF NOT EXISTS e_papers (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    alias VARCHAR(255),
    edition_date DATE,
    meta_title VARCHAR(255),
    meta_description TEXT,
    category VARCHAR(255),
    pdf_path VARCHAR(500),
    thumbnail_path VARCHAR(500),
    total_pages INT DEFAULT 0,
    status ENUM('draft', 'live', 'schedule', 'archived') DEFAULT 'draft',
    is_public BOOLEAN DEFAULT TRUE,
    is_free BOOLEAN DEFAULT FALSE,
    publish_date TIMESTAMP NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- E-Paper Pages table
CREATE TABLE IF NOT EXISTS e_paper_pages (
    id INT AUTO_INCREMENT PRIMARY KEY,
    e_paper_id INT NOT NULL,
    page_number INT NOT NULL,
    image_path VARCHAR(500) NOT NULL,
    thumbnail_path VARCHAR(500),
    ocr_text TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (e_paper_id) REFERENCES e_papers(id) ON DELETE CASCADE
);

-- E-Paper Categories junction table
CREATE TABLE IF NOT EXISTS e_paper_categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    e_paper_id INT NOT NULL,
    category_id INT NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (e_paper_id) REFERENCES e_papers(id) ON DELETE CASCADE,
    FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE CASCADE,
    UNIQUE KEY unique_e_paper_category (e_paper_id, category_id)
);

-- Advertisements table
CREATE TABLE IF NOT EXISTS advertisements (
    id INT AUTO_INCREMENT PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    description TEXT,
    image_path VARCHAR(500),
    advertiser_name VARCHAR(255),
    link_url VARCHAR(500),
    link_page_number INT,
    ad_id INT,
    tooltip_text TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (e_paper_id) REFERENCES e_papers(id) ON DELETE CASCADE,
    FOREIGN KEY (page_id) REFERENCES e_paper_pages(id) ON DELETE CASCADE,
    FOREIGN KEY (ad_id) REFERENCES advertisements(id) ON DELETE SET NULL
);

-- Area Maps table
CREATE TABLE IF NOT EXISTS area_maps (
    id INT AUTO_INCREMENT PRIMARY KEY,
    e_paper_id INT NOT NULL,
    page_id INT NOT NULL,
    coordinates JSON NOT NULL,
    link_url VARCHAR(500),
    link_type ENUM('internal', 'external') DEFAULT 'external',
    tooltip_text TEXT,
    is_active BOOLEAN DEFAULT TRUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (e_paper_id) REFERENCES e_papers(id) ON DELETE CASCADE,
    FOREIGN KEY (page_id) REFERENCES e_paper_pages(id) ON DELETE CASCADE
);

-- Cropped Shares table
CREATE TABLE IF NOT EXISTS cropped_shares (
    id INT AUTO_INCREMENT PRIMARY KEY,
    e_paper_id INT NOT NULL,
    page_id INT NOT NULL,
    crop_coordinates JSON NOT NULL,
    cropped_image_path VARCHAR(500) NOT NULL,
    share_token VARCHAR(255) UNIQUE NOT NULL,
    share_url VARCHAR(500) NOT NULL,
    expires_at TIMESTAMP NOT NULL,
    created_by INT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (e_paper_id) REFERENCES e_papers(id) ON DELETE CASCADE,
    FOREIGN KEY (page_id) REFERENCES e_paper_pages(id) ON DELETE CASCADE,
    FOREIGN KEY (created_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert sample data for dashboard
INSERT INTO dashboard_stats (bookings, users_count, revenue, followers) VALUES
(281, 2300, '34k', '+91');

-- Insert sample authors
INSERT INTO authors (name, email, image, job_title, job_description, status, employed_date) VALUES
('John Michael', 'john@creative-tim.com', '/assets/images/team-2.jpg', 'Manager', 'Organization', 'online', '2017-09-19'),
('Alexa Liras', 'alexa@creative-tim.com', '/assets/images/team-3.jpg', 'Programator', 'Developer', 'offline', '2017-09-17'),
('Laurent Perrier', 'laurent@creative-tim.com', '/assets/images/team-4.jpg', 'Executive', 'Projects', 'online', '2017-09-18'),
('Michael Levi', 'michael@creative-tim.com', '/assets/images/team-3.jpg', 'Programator', 'Developer', 'online', '2008-12-24'),
('Richard Gran', 'richard@creative-tim.com', '/assets/images/team-3.jpg', 'Manager', 'Executive', 'offline', '2021-10-04'),
('Miriam Eric', 'miriam@creative-tim.com', '/assets/images/team-4.jpg', 'Programator', 'Developer', 'offline', '2020-09-14');

-- Insert sample projects
INSERT INTO projects (name, description, budget, completion, status) VALUES
('Material Dashboard 2', 'Modern admin dashboard template', '$2,500', 60, 'in_progress'),
('Dark Edition', 'Dark mode version of dashboard', '$5,000', 100, 'completed'),
('React Version', 'React implementation', '$3,400', 30, 'canceled'),
('Vue.js Version', 'Vue.js implementation', '$14,000', 80, 'in_progress'),
('Angular Version', 'Angular implementation', '$1,000', 0, 'canceled'),
('Mobile App', 'Mobile application', '$2,300', 100, 'completed');

-- Insert sample categories
INSERT INTO categories (name, description) VALUES
('News', 'News and current events'),
('Sports', 'Sports and athletics'),
('Business', 'Business and finance'),
('Entertainment', 'Entertainment and media');

-- Insert sample e-paper
INSERT INTO e_papers (title, description, pdf_path, thumbnail_path, total_pages, status, is_public) VALUES
('Sample E-Paper', 'A sample digital newspaper', '/uploads/papers/sample.pdf', '/uploads/thumbnails/sample.jpg', 4, 'live', TRUE);

-- Subscription Plans table
CREATE TABLE IF NOT EXISTS subscription_plans (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2) NOT NULL DEFAULT 0.00,
    `interval` ENUM('monthly', 'quarterly', 'yearly') NOT NULL DEFAULT 'monthly',
    stripe_price_id VARCHAR(255),
    stripe_product_id VARCHAR(255),
    is_active BOOLEAN DEFAULT TRUE,
    is_free BOOLEAN DEFAULT FALSE,
    features JSON,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- Subscriptions table
CREATE TABLE IF NOT EXISTS subscriptions (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    plan_id INT NOT NULL,
    stripe_subscription_id VARCHAR(255),
    stripe_customer_id VARCHAR(255),
    status ENUM('active', 'canceled', 'past_due', 'unpaid', 'trialing', 'incomplete', 'incomplete_expired') DEFAULT 'incomplete',
    current_period_start TIMESTAMP NULL,
    current_period_end TIMESTAMP NULL,
    cancel_at_period_end BOOLEAN DEFAULT FALSE,
    canceled_at TIMESTAMP NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (plan_id) REFERENCES subscription_plans(id) ON DELETE RESTRICT
);

-- Payment History table
CREATE TABLE IF NOT EXISTS payment_history (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    subscription_id INT,
    stripe_payment_intent_id VARCHAR(255),
    stripe_invoice_id VARCHAR(255),
    amount DECIMAL(10, 2) NOT NULL,
    currency VARCHAR(3) DEFAULT 'USD',
    status ENUM('succeeded', 'pending', 'failed', 'canceled') DEFAULT 'pending',
    payment_method VARCHAR(50),
    description TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    FOREIGN KEY (subscription_id) REFERENCES subscriptions(id) ON DELETE SET NULL
);

-- Settings table for general configuration
CREATE TABLE IF NOT EXISTS settings (
    id INT AUTO_INCREMENT PRIMARY KEY,
    setting_key VARCHAR(100) UNIQUE NOT NULL,
    setting_value TEXT,
    setting_type ENUM('string', 'boolean', 'number', 'json') DEFAULT 'string',
    description TEXT,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    updated_by INT,
    FOREIGN KEY (updated_by) REFERENCES users(id) ON DELETE SET NULL
);

-- Insert default settings
INSERT INTO settings (setting_key, setting_value, setting_type, description) VALUES
('subscription_mode_enabled', 'false', 'boolean', 'When enabled, visitors must have an active subscription to read e-papers. When disabled, all content is freely accessible.'),
('site_name', 'E-Paper Platform', 'string', 'Name of the website displayed in the header and emails'),
('contact_email', 'admin@example.com', 'string', 'Contact email address for support inquiries'),
('maintenance_mode', 'false', 'boolean', 'When enabled, the site shows a maintenance page to non-admin users'),
('logo_url', '/assets/images/logo-ct.png', 'string', 'URL path to the site logo image'),
('favicon_url', '/favicon.png', 'string', 'URL path to the site favicon'),
('meta_keywords', 'e-paper, digital newspaper, online news', 'string', 'SEO meta keywords for search engines'),
('meta_description', 'Your trusted source for digital newspapers and online news', 'string', 'SEO meta description for search engines'),
('contact_phone', '+1 (555) 123-4567', 'string', 'Contact phone number displayed on the website'),
('contact_address', '123 News Street, Media City, MC 12345', 'string', 'Physical address displayed on the website'),
('social_facebook', '', 'string', 'Facebook page URL'),
('social_twitter', '', 'string', 'Twitter profile URL'),
('social_instagram', '', 'string', 'Instagram profile URL'),
('social_linkedin', '', 'string', 'LinkedIn profile URL'),
('social_youtube', '', 'string', 'YouTube channel URL'),
('og_title', '', 'string', 'Open Graph title for social media sharing'),
('og_description', '', 'string', 'Open Graph description for social media sharing'),
('og_image_url', '', 'string', 'Open Graph image URL for social media sharing'),
('smtp_host', 'smtp.gmail.com', 'string', 'SMTP server host for sending emails'),
('smtp_port', '587', 'number', 'SMTP server port'),
('smtp_user', '', 'string', 'SMTP username/email'),
('smtp_password', '', 'string', 'SMTP password'),
('smtp_from_email', 'noreply@example.com', 'string', 'From email address for outgoing emails'),
('smtp_from_name', 'E-Paper Platform', 'string', 'From name for outgoing emails'),
('email_template_welcome', '<h1>Welcome {{name}}!</h1><p>Thank you for joining {{site_name}}.</p>', 'string', 'Welcome email template'),
('email_template_subscription', '<h1>Subscription Confirmed</h1><p>Your {{plan_name}} subscription is now active.</p>', 'string', 'Subscription confirmation email template'),
('email_template_payment', '<h1>Payment Received</h1><p>Thank you for your payment of {{amount}}.</p>', 'string', 'Payment receipt email template'),
('email_template_password_reset', '<h1>Reset Your Password</h1><p>Click the link below to reset your password: {{reset_link}}</p>', 'string', 'Password reset email template');


-- Insert sample subscription plans
INSERT INTO subscription_plans (name, description, price, `interval`, is_active, is_free, features) VALUES
('Free', 'Basic access with limited features', 0.00, 'monthly', TRUE, TRUE, '["Access to free content", "Limited downloads"]'),
('Monthly', 'Full access to all content', 9.99, 'monthly', TRUE, FALSE, '["Unlimited access", "Download e-papers", "Ad-free experience"]'),
('Quarterly', 'Full access with quarterly billing', 24.99, 'quarterly', TRUE, FALSE, '["Unlimited access", "Download e-papers", "Ad-free experience", "Priority support"]'),
('Yearly', 'Full access with yearly billing - Best value', 79.99, 'yearly', TRUE, FALSE, '["Unlimited access", "Download e-papers", "Ad-free experience", "Priority support", "Early access to new features"]');

-- Insert sample advertisement
INSERT INTO advertisements (title, description, image_path, link_url, advertiser_name, status) VALUES
('Sample Ad', 'A sample advertisement', '/uploads/ads/sample-ad.jpg', 'https://example.com', 'Demo Advertiser', 'active');
