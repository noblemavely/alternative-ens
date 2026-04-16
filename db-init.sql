-- Create tables for the alternative-ens application

-- Sectors table
CREATE TABLE IF NOT EXISTS sectors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Functions table
CREATE TABLE IF NOT EXISTS `functions` (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL UNIQUE,
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Clients table
CREATE TABLE IF NOT EXISTS clients (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  companyName VARCHAR(255),
  companyWebsite VARCHAR(255),
  contactPerson VARCHAR(255),
  sector VARCHAR(255),
  industry VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
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
CREATE TABLE IF NOT EXISTS expertEmployment (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expertId INT NOT NULL,
  companyName VARCHAR(255) NOT NULL,
  position VARCHAR(255) NOT NULL,
  startDate VARCHAR(50),
  endDate VARCHAR(50),
  isCurrent BOOLEAN DEFAULT FALSE,
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (expertId) REFERENCES experts(id) ON DELETE CASCADE,
  INDEX idx_expertId (expertId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expert Education table
CREATE TABLE IF NOT EXISTS expertEducation (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expertId INT NOT NULL,
  schoolName VARCHAR(255) NOT NULL,
  degree VARCHAR(255) NOT NULL,
  fieldOfStudy VARCHAR(255),
  startDate VARCHAR(50),
  endDate VARCHAR(50),
  description TEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (expertId) REFERENCES experts(id) ON DELETE CASCADE,
  INDEX idx_expertId (expertId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expert Verification table
CREATE TABLE IF NOT EXISTS expertVerification (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expertId INT NOT NULL,
  token VARCHAR(255) NOT NULL,
  expiresAt DATETIME NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (expertId) REFERENCES experts(id) ON DELETE CASCADE,
  INDEX idx_expertId (expertId),
  INDEX idx_token (token)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Admin Users table
CREATE TABLE IF NOT EXISTS adminUsers (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  email VARCHAR(255) NOT NULL UNIQUE,
  password VARCHAR(255) NOT NULL,
  role VARCHAR(50) DEFAULT 'admin',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  INDEX idx_email (email)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Client Contacts table
CREATE TABLE IF NOT EXISTS clientContacts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clientId INT NOT NULL,
  contactName VARCHAR(255) NOT NULL,
  email VARCHAR(320) NOT NULL,
  phone VARCHAR(20),
  role VARCHAR(255),
  workType VARCHAR(255),
  isActive BOOLEAN DEFAULT TRUE NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_email (email),
  INDEX idx_clientId (clientId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Projects table
CREATE TABLE IF NOT EXISTS projects (
  id INT AUTO_INCREMENT PRIMARY KEY,
  clientContactId INT NOT NULL,
  name VARCHAR(255) NOT NULL,
  description LONGTEXT,
  projectType ENUM('Call', 'Advisory', 'ID') NOT NULL,
  targetCompanies TEXT,
  targetPersona TEXT,
  rate DECIMAL(10, 2),
  currency VARCHAR(3) DEFAULT 'USD' NOT NULL,
  status ENUM('Active', 'On Hold', 'Closed') DEFAULT 'Active' NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (clientContactId) REFERENCES clientContacts(id) ON DELETE CASCADE,
  INDEX idx_clientContactId (clientContactId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Screening Questions table
CREATE TABLE IF NOT EXISTS screeningQuestions (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projectId INT NOT NULL,
  question LONGTEXT NOT NULL,
  `order` INT DEFAULT 0 NOT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
  INDEX idx_projectId (projectId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Shortlists table
CREATE TABLE IF NOT EXISTS shortlists (
  id INT AUTO_INCREMENT PRIMARY KEY,
  projectId INT NOT NULL,
  expertId INT NOT NULL,
  status ENUM('pending', 'interested', 'rejected', 'new', 'contacted', 'attempting_contact', 'engaged', 'qualified', 'proposal_sent', 'negotiation', 'verbal_agreement', 'closed_won', 'closed_lost') DEFAULT 'pending' NOT NULL,
  notes LONGTEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (projectId) REFERENCES projects(id) ON DELETE CASCADE,
  FOREIGN KEY (expertId) REFERENCES experts(id) ON DELETE CASCADE,
  INDEX idx_projectId (projectId),
  INDEX idx_expertId (expertId)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Expert-Client Mapping table
CREATE TABLE IF NOT EXISTS expertClientMapping (
  id INT AUTO_INCREMENT PRIMARY KEY,
  expertId INT NOT NULL,
  clientId INT NOT NULL,
  status ENUM('shortlisted', 'contacted', 'attempting_contact', 'engaged', 'qualified', 'proposal_sent', 'negotiation', 'verbal_agreement', 'closed_won', 'closed_lost') DEFAULT 'shortlisted' NOT NULL,
  notes LONGTEXT,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  FOREIGN KEY (expertId) REFERENCES experts(id) ON DELETE CASCADE,
  FOREIGN KEY (clientId) REFERENCES clients(id) ON DELETE CASCADE,
  INDEX idx_expertId (expertId),
  INDEX idx_clientId (clientId)
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
INSERT INTO adminUsers (name, email, password, role) VALUES
('Admin User', 'admin@alternative.com', '$2b$10$ldOJcekvvcFly715QREIKOrE2bNt66nR/Zqt/9b/ZwCWYGdFup96O', 'admin')
ON DUPLICATE KEY UPDATE password = VALUES(password);
