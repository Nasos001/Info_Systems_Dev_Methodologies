# Database Schema: City Problem Reporting System

This document contains the SQL script to initialize the MySQL database in XAMPP.

## SQL Script

```sql
-- Create Database
CREATE DATABASE IF NOT EXISTS city_problem_reporting;
USE city_problem_reporting;

-- Users Table
CREATE TABLE IF NOT EXISTS users (
    id INT AUTO_INCREMENT PRIMARY KEY,
    email VARCHAR(255) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    role ENUM('citizen', 'admin', 'technician') NOT NULL,
    full_name VARCHAR(255) NOT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
) ENGINE=InnoDB;

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
    id INT AUTO_INCREMENT PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE
) ENGINE=InnoDB;

-- Reports Table
CREATE TABLE IF NOT EXISTS reports (
    id INT AUTO_INCREMENT PRIMARY KEY,
    user_id INT NOT NULL,
    category_id INT NOT NULL,
    address VARCHAR(255) NOT NULL,
    description TEXT NOT NULL,
    status ENUM('NEW', 'REJECTED', 'DUPLICATE', 'ONGOING', 'COMPLETED') DEFAULT 'NEW',
    image_path VARCHAR(512),
    assigned_tech_id INT DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT fk_user FOREIGN KEY (user_id) REFERENCES users(id) ON DELETE CASCADE,
    CONSTRAINT fk_category FOREIGN KEY (category_id) REFERENCES categories(id) ON DELETE RESTRICT,
    CONSTRAINT fk_tech FOREIGN KEY (assigned_tech_id) REFERENCES users(id) ON DELETE SET NULL
) ENGINE=InnoDB;

-- Seed Data: Initial Categories
INSERT INTO categories (name) VALUES
('Roadwork/Potholes'),
('Street Lighting'),
('Waste Management'),
('Water/Sewage'),
('Park Maintenance');

-- Seed Data: Initial Admin
-- IMPORTANT: The admin user is seeded via the backend `seed.js` script to ensure
-- the password is correctly hashed using bcrypt (10 salt rounds).
-- Do not manually insert the admin user unless the password is pre-hashed.
```

## Schema Details

### Relationships

- **Users $\rightarrow$ Reports:** One-to-many (`user_id`). A citizen can report multiple issues.
- **Categories $\rightarrow$ Reports:** One-to-many (`category_id`). A category can have multiple reports.
- **Users (Technicians) $\rightarrow$ Reports:** One-to-many (`assigned_tech_id`). A technician is assigned to resolve a specific report.

### Design Decisions

- **Engine=InnoDB:** Used for Transactional support and Foreign Key constraints.
- **ON DELETE RESTRICT (Categories):** Prevents deleting a category that is currently linked to an active report.
- **ON DELETE SET NULL (Technicians):** If a technician account is deleted, the report remains but the `assigned_tech_id` becomes NULL so the Admin can reassign it.
- **Sizing:** `image_path` is set to 512 chars to accommodate the relative path or filename of the uploaded image.
