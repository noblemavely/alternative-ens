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
  industry VARCHAR(255),
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Experts table
CREATE TABLE IF NOT EXISTS experts (
  id INT AUTO_INCREMENT PRIMARY KEY,
  firstName VARCHAR(255),
  lastName VARCHAR(255),
  email VARCHAR(255) NOT NULL UNIQUE,
  phone VARCHAR(20),
  sector VARCHAR(255),
  `function` VARCHAR(255),
  linkedinUrl VARCHAR(255),
  biography TEXT,
  cvUrl VARCHAR(255),
  cvKey VARCHAR(255),
  verificationToken VARCHAR(255),
  verificationTokenExpiry DATETIME,
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
