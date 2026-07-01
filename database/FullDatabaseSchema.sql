-- ==========================================================================
-- Quick Bite | Food Delivery Optimizer
-- Complete Database Schema (MySQL)
-- ==========================================================================

CREATE DATABASE IF NOT EXISTS food_delivery_optimizer;
USE food_delivery_optimizer;

-- 1. Users / Admins Table
CREATE TABLE IF NOT EXISTS users (
    id INT PRIMARY KEY AUTO_INCREMENT,
    fullname VARCHAR(100) NOT NULL,
    email VARCHAR(100) UNIQUE NOT NULL,
    phone VARCHAR(20) NOT NULL,
    password_hash VARCHAR(255) NOT NULL,
    role VARCHAR(50) DEFAULT 'Administrator',
    avatar_url VARCHAR(255) DEFAULT NULL,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Restaurants Table
CREATE TABLE IF NOT EXISTS restaurants (
    id INT PRIMARY KEY AUTO_INCREMENT,
    name VARCHAR(100) NOT NULL,
    address VARCHAR(200) NOT NULL,
    rating FLOAT DEFAULT 4.0,
    image_url VARCHAR(255) DEFAULT NULL
);

-- 3. Delivery Agents Table
CREATE TABLE IF NOT EXISTS agents (
    id VARCHAR(10) PRIMARY KEY, -- e.g., 'A001'
    name VARCHAR(100) NOT NULL,
    vehicle VARCHAR(50) NOT NULL, -- e.g., 'Bike', 'Scooter'
    phone VARCHAR(20) NOT NULL,
    rating FLOAT DEFAULT 4.0,
    status VARCHAR(50) DEFAULT 'Available', -- 'Available', 'Delivering', 'Offline'
    current_location VARCHAR(100) DEFAULT 'Hub',
    image_url VARCHAR(255) DEFAULT NULL
);

-- 4. Orders Table
CREATE TABLE IF NOT EXISTS orders (
    id INT PRIMARY KEY AUTO_INCREMENT, -- e.g., 1001
    customer_name VARCHAR(100) NOT NULL,
    restaurant_id INT,
    amount DECIMAL(10, 2) NOT NULL,
    status VARCHAR(50) DEFAULT 'Preparing', -- 'Preparing', 'On Route', 'Delivered', 'Cancelled'
    eta VARCHAR(20) DEFAULT '--',
    order_time TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    FOREIGN KEY (restaurant_id) REFERENCES restaurants(id) ON DELETE SET NULL
);

-- 5. Graph Edges Table (For Dijkstra Router Graph)
CREATE TABLE IF NOT EXISTS graph_edges (
    id INT PRIMARY KEY AUTO_INCREMENT,
    source_node INT NOT NULL,
    target_node INT NOT NULL,
    distance INT NOT NULL -- Distance in km (weight)
);


-- ==========================================================================
-- Insert Seed Data (Match initial Web Dashboard State)
-- ==========================================================================

-- Seed Users (Password is 'vamshi@gmail.com' for demo purposes)
INSERT INTO users (fullname, email, phone, password_hash, role, avatar_url)
VALUES ('Vamshi Krishna', 'yadavvamshi@gmail.com', '+91 7780705719', 'vamshi@gmail.com', 'System Administrator', 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100')
ON DUPLICATE KEY UPDATE id=id;

-- Seed Restaurants
INSERT INTO restaurants (id, name, address, rating, image_url) VALUES
(1, 'Pizza Hub', 'Hyderabad', 4.8, 'https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600'),
(2, 'Burger King', 'Bengaluru', 4.6, 'https://images.unsplash.com/photo-1550547660-d9450f859349?w=600'),
(3, 'Domino\'s', 'Chennai', 4.7, 'https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600'),
(4, 'KFC', 'Vijayawada', 4.5, 'https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=600')
ON DUPLICATE KEY UPDATE id=id;

-- Seed Delivery Agents
INSERT INTO agents (id, name, vehicle, phone, rating, status, current_location, image_url) VALUES
('A001', 'Rahul Kumar', 'Bike', '9876543210', 4.9, 'Available', 'Sector 21', 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'),
('A002', 'Arjun', 'Scooter', '9123456780', 4.8, 'Delivering', 'Main Road', 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?w=150'),
('A003', 'Sneha', 'Bike', '9988776655', 4.7, 'Returning', 'City Center', 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?w=150'),
('A004', 'Vijay', 'Bike', '9345678901', 4.4, 'Offline', 'Railway Station', 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=150')
ON DUPLICATE KEY UPDATE id=id;

-- Seed Orders
INSERT INTO orders (id, customer_name, restaurant_id, amount, status, eta) VALUES
(1001, 'Rahul', 1, 450.00, 'Delivered', '25 min'),
(1002, 'Priya', 4, 620.00, 'Preparing', '15 min'),
(1003, 'Arjun', 2, 300.00, 'On Route', '12 min'),
(1004, 'Sneha', 3, 890.00, 'Cancelled', '--'),
(1005, 'Vamshi', 1, 380.00, 'Preparing', '18 min')
ON DUPLICATE KEY UPDATE id=id;

-- Seed Dijkstra Route Optimizer Nodes (Matching dashboard graph)
INSERT INTO graph_edges (source_node, target_node, distance) VALUES
(0, 1, 4),
(0, 2, 2),
(1, 2, 1),
(1, 3, 5),
(2, 3, 8),
(2, 4, 10),
(3, 4, 2),
(3, 5, 6),
(4, 5, 3)
ON DUPLICATE KEY UPDATE id=id;
