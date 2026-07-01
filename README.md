# Quick Bite | Food Delivery Optimizer

A graph-theory logistics optimization web dashboard and C++ backend that computes and visualizes the shortest, most efficient delivery paths using **Dijkstra's Algorithm**.

---

## 🌟 Key Features

### 🖥️ Unified SPA Admin Dashboard
- **Consolidated Panel**: Clean, premium Single Page Application (SPA) structure linking Restaurants, Orders, Route optimization, Live tracking, Agents, Analytics, and Settings.
- **Dynamic State**: Fully interactive lists and tables with real-time CRUD actions (Add / Edit / Delete).
- **Responsive Layout**: Designed for mobile, tablet, and desktop screens with custom animations.
- **🌗 Dark Mode**: Full dark theme support toggled seamlessly in Settings.

### 🗺️ Interactive Graph Route Optimizer
- **Visual Graph Builder**: Double-click the canvas to add coordinates, drag nodes to move, and Shift+Click connect nodes with distance values (weights).
- **Animated Dijkstra Engine**: Visualizes Dijkstra's algorithm executing step-by-step. Highlights neighbor scans and paints the final shortest path in a glowing animated route.
- **Real-Time Log**: Console log panel displays distance relaxation values step-by-step.

### 📍 Live Delivery Tracking Map
- **Live Simulator**: A custom city grid mapping nodes.
- **Path Animation**: Animates the delivery agent scooter (🛵) driving along the optimal path calculated by Dijkstra.
- **Live Status Feed**: Dynamic status box updates (e.g. "Order preparing", "Picked up", "En route", "Arrived").

### 📊 Dynamic Analytics & Reports
- **Interactive Graphs**: Live Chart.js analytics updating automatically with order state changes (Weekly Orders, Order Status Breakdown, Monthly Revenue).
- **Excel/CSV Export**: Instantly download client records as CSV spreadsheets.
- **PDF Performance Reports**: Compile printable performance documents.

### ⚙️ C++ Core Engine
- **Algorithmic Solver**: Dijkstra pathfinding implementation in C++17 using priority queues.
- **MySQL DevAPI Connectivity**: Connection handlers linking to local databases via modern X DevAPI.

---

## 🛠️ Technology Stack

- **Frontend**: HTML5, Vanilla CSS3 (Custom Variables, Keyframes), JavaScript ES6+, Chart.js, FontAwesome.
- **Backend**: C++17, CMake 3.20, MySQL Connector/C++ 9.7 (mysqlcppconnx).
- **Database**: MySQL.

---

## 🚀 Quick Start Guide

### 1. Launching the Frontend (Web Dashboard)
Since the frontend is engineered as a unified SPA, it runs completely local without complex node installations or CORS issues:
1. Open the project directory on your computer.
2. Navigate to the `frontend/` folder.
3. Double-click [index.html](file:///c:/Users/HP/OneDrive/Desktop/Food%20delivery%20optimizer/frontend/index.html) to open it directly in any modern browser.
4. Click **Get Started**, register a mock user, log in, and explore the dashboard!

### 2. Building the C++ Backend Solver
To build and execute the C++ shortest path printer:
1. Open your terminal in the `backend/` directory.
2. If you have CMake installed, execute:
   ```bash
   mkdir build
   cd build
   cmake ..
   cmake --build .
   ```
3. Alternatively, compile directly with `g++` (make sure you link your MySQL library folders if database calls are active):
   ```bash
   g++ -std=c++17 src/server.cpp src/database.cpp src/graph.cpp -Iinclude -o optimizer.exe
   ```
4. Run the compiled executable:
   ```bash
   ./optimizer.exe
   ```

---

## 📁 Project Directory Structure

```
Food delivery optimizer/
├── backend/                   # C++ Pathfinding Core
│   ├── include/               # Header Files (.h)
│   ├── src/                   # Source Files (.cpp)
│   └── CMakeLists.txt         # Build Configuration
├── database/                  # Database Scripts
│   └── RestaurantTable.sql    # Schema Setup
├── frontend/                  # Web SPA Application
│   ├── dashboard.html         # Admin Portal Dashboard
│   ├── dashboard.css          # Admin Stylesheet
│   ├── dashboard.js           # Admin Logic
│   ├── customer.html          # Customer Portal Browse & Order
│   ├── customer.css           # Customer Stylesheet
│   ├── customer.js            # Customer Cart & Dijkstra Tracker
│   ├── agent.html             # Rider Portal Dashboard
│   ├── agent.css              # Rider Stylesheet
│   ├── agent.js               # Rider Task & Dijkstra Tracker
│   ├── index.html             # Landing Homepage
│   ├── index.css              # Landing Styles
│   ├── login.html             # Authorization Page (Admin/Customer/Rider routing)
│   ├── login.js               # Toggle & Submit handlers
│   ├── register.html          # Registration Page
│   └── register.js            # Registration Logic
└── README.md                  # Project Documentation (This File)
```
