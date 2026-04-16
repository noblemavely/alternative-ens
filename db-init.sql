-- Create tables for the alternative-ens application

-- Sectors table
CREATE TABLE IF NOT EXISTS sectors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Functions table
CREATE TABLE IF NOT EXISTS `functions` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  company_name VARCHAR(255),
  company_website VARCHAR(255),
  contact_person VARCHAR(255),
  sector VARCHAR(255),
  industry VARCHAR(255),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Experts table
CREATE TABLE IF NOT EXISTS experts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firstName VARCHAR(255),
  lastName VARCHAR(255),
  email VARCHAR(320) NOT NULL UNIQUE,
  phone VARCHAR(20),
  sector VARCHAR(255),
  `function` VARCHAR(255),
  linkedinUrl VARCHAR(500),
  biography LONGTEXT,
  cvUrl VARCHAR(500),
  cvKey VARCHAR(500),
  verificationToken VARCHAR(255),
  verificationTokenExpiry TIMESTAMP NULL,
  isVerified BOOLEAN DEFAULT FALSE,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email),
  INDEX idx_verified (isVerified)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expert Employment table
CREATE TABLE IF NOT EXISTS expert_employment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expert_id INT NOT NULL,
  company_name VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  start_date VARCHAR(50),
  end_date VARCHAR(50),
  is_current BOOLEAN DEFAULT FALSE,
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (expert_id) REFERENCES experts(id) ON DELETE CASCADE,
  INDEX idx_expert_id (expert_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expert Education table
CREATE TABLE IF NOT EXISTS expert_education (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expert_id INT NOT NULL,
  school_name VARCHAR(255) NOT NULL,
  degree VARCHAR(255) NOT NULL,
  field_of_study VARCHAR(255),
  start_date VARCHAR(50),
  end_date VARCHAR(50),
  description TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (expert_id) REFERENCES experts(id) ON DELETE CASCADE,
  INDEX idx_expert_id (expert_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expert Verification table
CREATE TABLE IF NOT EXISTS expert_verification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expert_id INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expires_at DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (expert_id) REFERENCES experts(id) ON DELETE CASCADE,
  INDEX idx_expert_id (expert_id),
  INDEX idx_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin Users table
CREATE TABLE IF NOT EXISTS admin_users (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  is_active BOOLEAN DEFAULT TRUE,
  last_login TIMESTAMP NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Client Contacts table
CREATE TABLE IF NOT EXISTS client_contacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_id INT NOT NULL,
  contact_name VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(255),
  work_type VARCHAR(255),
  is_active BOOLEAN DEFAULT TRUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_email (email),
  INDEX idx_client_id (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  client_contact_id INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description LONGTEXT,
  project_type ENUM('Call', 'Advisory', 'ID') NOT NULL,
  target_companies TEXT,
  target_persona TEXT,
  rate DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
  status ENUM('Active', 'On Hold', 'Closed') DEFAULT 'Active' NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (client_contact_id) REFERENCES client_contacts(id) ON DELETE CASCADE,
  INDEX idx_client_contact_id (client_contact_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Screening Questions table
CREATE TABLE IF NOT EXISTS screening_questions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  question LONGTEXT NOT NULL,
  `order` INT DEFAULT 0 NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_project_id (project_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shortlists table
CREATE TABLE IF NOT EXISTS shortlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  project_id INT NOT NULL,
  expert_id INT NOT NULL,
  status ENUM('pending', 'interested', 'rejected', 'new', 'contacted', 'attempting_contact', 'engaged', 'qualified', 'proposal_sent', 'negotiation', 'verbal_agreement', 'closed_won', 'closed_lost') DEFAULT 'pending' NOT NULL,
  notes LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (project_id) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (expert_id) REFERENCES experts(id) ON DELETE CASCADE,
  INDEX idx_project_id (project_id),
  INDEX idx_expert_id (expert_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expert-Client Mapping table
CREATE TABLE IF NOT EXISTS expert_client_mapping (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expert_id INT NOT NULL,
  client_id INT NOT NULL,
  status ENUM('shortlisted', 'contacted', 'attempting_contact', 'engaged', 'qualified', 'proposal_sent', 'negotiation', 'verbal_agreement', 'closed_won', 'closed_lost') DEFAULT 'shortlisted' NOT NULL,
  notes LONGTEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (expert_id) REFERENCES experts(id) ON DELETE CASCADE,
  FOREIGN KEY (client_id) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_expert_id (expert_id),
  INDEX idx_client_id (client_id)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Insert sample data (optional, can be commented out)
INSERT INTO sectors (name, description) VALUES
('Technology', 'Software, IT, and tech sector'),
('Finance', 'Banking, investment, and financial services'),
('Healthcare', 'Medical, pharmaceuticals, and health services'),
('Consulting', 'Management consulting and advisory services'),
('Marketing', 'Digital marketing and brand management')
ON DUPLICATE KEY UPDATE description = VALUES(description);

INSERT INTO `functions` (name, description) VALUES
('Senior Executive', 'C-level and senior management roles'),
('Management', 'Department heads and managers'),
('Specialist', 'Technical specialists and experts'),
('Analyst', 'Data, business, and financial analysts'),
('Other', 'Other professional roles')
ON DUPLICATE KEY UPDATE description = VALUES(description);

-- Insert default admin user
-- Password: admin123 (should be changed in production)
-- Hash generated with: bcrypt.hash('admin123', 10)
INSERT INTO admin_users (name, email, password, role) VALUES
('Admin User', 'admin@alternative.com', '$2b$10$ldOJcekvvcFly715QREIKOrE2bNt66nR/Zqt/9b/ZwCWYGdFup96O', 'admin')
ON DUPLICATE KEY UPDATE password = VALUES(password);
