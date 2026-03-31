-- SQL schema for hospital appointment prototype
-- Create database and tables then insert sample doctors

CREATE DATABASE IF NOT EXISTS hospital_db CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci;
USE hospital_db;

CREATE TABLE IF NOT EXISTS doctors (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(128) NOT NULL,
  specialization VARCHAR(128) NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

CREATE TABLE IF NOT EXISTS appointments (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(150) NOT NULL,
  email VARCHAR(200) NOT NULL,
  phone VARCHAR(50) NOT NULL,
  disease VARCHAR(200) NOT NULL,
  doctor_id INT NULL,
  appointment_date DATETIME NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY (doctor_id) REFERENCES doctors(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Sample doctors
INSERT INTO doctors (name, specialization) VALUES
('Dr. Asha Patel','Cardiology'),
('Dr. Rohit Kumar','General Medicine'),
('Dr. Meera Singh','Dermatology'),
('Dr. Karan Verma','Pediatrics'),
('Dr. Anjali Rao','Orthopedics')
ON DUPLICATE KEY UPDATE name=VALUES(name);
