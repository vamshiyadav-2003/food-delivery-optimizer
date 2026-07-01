/* ==========================================================================
   Quick Bite | Food Delivery Optimizer
   SPA Core Logic: State Management, CRUD, Visual Dijkstra, Live Tracking, & Charts
   ========================================================================== */

// ---------------------------------------------------------
// 1. Initial State & Data
// ---------------------------------------------------------
let appState = {
    user: {
        fullname: "Vamshi Krishna",
        email: "yadavvamshi@gmail.com",
        phone: "+91 7780705719",
        role: "System Administrator",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
    },
    restaurants: [
        { id: 1, name: "Pizza Hub", address: "Hyderabad", rating: 4.8, image: "https://images.unsplash.com/photo-1513104890138-7c749659a591?w=600" },
        { id: 2, name: "Burger King", address: "Bengaluru", rating: 4.6, image: "https://images.unsplash.com/photo-1550547660-d9450f859349?w=600" },
        { id: 3, name: "Domino's", address: "Chennai", rating: 4.7, image: "https://images.unsplash.com/photo-1565299624946-b28f40a0ae38?w=600" },
        { id: 4, name: "KFC", address: "Vijayawada", rating: 4.5, image: "https://images.unsplash.com/photo-1466978913421-dad2ebd01d17?w=600" }
    ],
    orders: [
        { id: 1001, customer: "Rahul", restaurantId: 1, amount: 450, status: "Delivered", eta: "25 min" },
        { id: 1002, customer: "Priya", restaurantId: 4, amount: 620, status: "Preparing", eta: "15 min" },
        { id: 1003, customer: "Arjun", restaurantId: 2, amount: 300, status: "On Route", eta: "12 min" },
        { id: 1004, customer: "Sneha", restaurantId: 3, amount: 890, status: "Cancelled", eta: "--" },
        { id: 1005, customer: "Vamshi", restaurantId: 1, amount: 380, status: "Preparing", eta: "18 min" }
    ],
    agents: [
        { id: "A001", name: "Rahul Kumar", vehicle: "Bike", phone: "9876543210", rating: 4.9, status: "Available", ordersCount: 5, location: "Sector 21" },
        { id: "A002", name: "Arjun", vehicle: "Scooter", phone: "9123456780", rating: 4.8, status: "Delivering", ordersCount: 3, location: "Main Road" },
        { id: "A003", name: "Sneha", vehicle: "Bike", phone: "9988776655", rating: 4.7, status: "Returning", ordersCount: 4, location: "City Center" },
        { id: "A004", name: "Vijay", vehicle: "Bike", phone: "9345678901", rating: 4.4, status: "Offline", ordersCount: 2, location: "Railway Station" }
    ],
    graph: {
        nodes: [
            { id: 0, name: "Agent Hub 🛵", x: 100, y: 200, type: "agent" },
            { id: 1, name: "Restaurant Zone A 🏠", x: 220, y: 100, type: "restaurant" },
            { id: 2, name: "Transit Hub A 📍", x: 300, y: 250, type: "transit" },
            { id: 3, name: "Transit Hub B 📍", x: 480, y: 120, type: "transit" },
            { id: 4, name: "Customer Drop 🏡", x: 600, y: 280, type: "customer" },
            { id: 5, name: "Restaurant Zone B 🏠", x: 420, y: 340, type: "restaurant" }
        ],
        edges: [
            { u: 0, v: 1, weight: 4 },
            { u: 0, v: 2, weight: 2 },
            { u: 1, v: 2, weight: 1 },
            { u: 1, v: 3, weight: 5 },
            { u: 2, v: 3, weight: 8 },
            { u: 2, v: 4, weight: 10 },
            { u: 3, v: 4, weight: 2 },
            { u: 3, v: 5, weight: 6 },
            { u: 4, v: 5, weight: 3 }
        ]
    }
};

// Global chart variables
let orderChartInstance = null;
let pieChartInstance = null;
let reportsRevenueChartInstance = null;
let reportsStatusChartInstance = null;

// Dijkstra execution state
let lastShortestPath = [];

// ---------------------------------------------------------
// 2. Initialization & Navigation Setup
// ---------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    // Check active user session
    const activeUser = JSON.parse(localStorage.getItem("quickbite_active_user"));
    if (activeUser) {
        appState.user = activeUser;
        const topProfile = document.getElementById("profile-img");
        if (topProfile) topProfile.src = activeUser.avatar;
    }

    // Check saved language preference
    const savedLang = localStorage.getItem("quickbite_language") || "en";
    applyLanguageTranslation(savedLang);
    const langSelect = document.getElementById("set-language");
    if (langSelect) langSelect.value = savedLang;

    initNavigation();
    initTheme();
    loadInitialData();
    initGraphBuilder();
    initTrackingSimulator();
    
    // Auto-clock
    setInterval(updateClock, 1000);
});

function initNavigation() {
    const navItems = document.querySelectorAll(".nav-item");
    const sections = document.querySelectorAll(".spa-section");

    navItems.forEach(item => {
        item.addEventListener("click", () => {
            navItems.forEach(nav => nav.classList.remove("active"));
            item.classList.add("active");

            const target = item.getAttribute("data-target");
            sections.forEach(sec => {
                if (sec.id === `sec-${target}`) {
                    sec.classList.remove("hidden");
                } else {
                    sec.classList.add("hidden");
                }
            });

            // Trigger specific page load actions
            if (target === "dashboard") {
                renderDashboard();
            } else if (target === "restaurants") {
                renderRestaurants();
            } else if (target === "menuitems") {
                populateMenuRestaurantDropdowns();
                renderMenuItems();
            } else if (target === "orders") {
                renderOrders();
            } else if (target === "routes") {
                drawGraph();
                populateNodeSelectors();
            } else if (target === "location") {
                drawTrackingMap();
            } else if (target === "agents") {
                renderAgents();
            } else if (target === "reports") {
                renderReports();
            }
            
            showToast(`Loaded ${target.toUpperCase()} page`, "success");
        });
    });

    // Logout
    document.querySelector(".logout-btn").addEventListener("click", () => {
        if (confirm("Are you sure you want to logout?")) {
            window.location.href = "admin_login.html";
        }
    });

    // Global Search
    const search = document.getElementById("global-search");
    search.addEventListener("keyup", () => {
        const val = search.value.toLowerCase();
        // Simple search feedback
        console.log("Global searching for: " + val);
    });

    // Notification bell alert
    document.getElementById("notification-bell").addEventListener("click", () => {
        alert(
            "🔔 Quick Bite Notifications\n\n" +
            "• New order #1005 created by Vamshi\n" +
            "• Agent Rahul Kumar is returning to Hub\n" +
            "• Peak hour delivery surcharge activated (+15%)"
        );
        document.getElementById("notification-count").textContent = "0";
    });
}

function initTheme() {
    const toggle = document.getElementById("darkModeToggle");
    // Load preference if any
    const isDark = localStorage.getItem("dark-theme") === "true";
    if (isDark) {
        document.body.classList.add("dark-theme");
        if (toggle) toggle.checked = true;
    }

    if (toggle) {
        toggle.addEventListener("change", () => {
            if (toggle.checked) {
                document.body.classList.add("dark-theme");
                localStorage.setItem("dark-theme", "true");
                showToast("Dark theme enabled", "success");
            } else {
                document.body.classList.remove("dark-theme");
                localStorage.setItem("dark-theme", "false");
                showToast("Light theme enabled", "success");
            }
        });
    }
}

function loadInitialData() {
    // Sync with localStorage (Shared Database Layer)
    if (localStorage.getItem("quickbite_restaurants")) {
        appState.restaurants = JSON.parse(localStorage.getItem("quickbite_restaurants"));
    } else {
        localStorage.setItem("quickbite_restaurants", JSON.stringify(appState.restaurants));
    }

    if (localStorage.getItem("quickbite_orders")) {
        appState.orders = JSON.parse(localStorage.getItem("quickbite_orders"));
    } else {
        localStorage.setItem("quickbite_orders", JSON.stringify(appState.orders));
    }

    if (localStorage.getItem("quickbite_agents")) {
        appState.agents = JSON.parse(localStorage.getItem("quickbite_agents"));
    } else {
        localStorage.setItem("quickbite_agents", JSON.stringify(appState.agents));
    }

    // Load menus from localStorage, or seed defaults for the 4 built-in restaurants
    if (localStorage.getItem("quickbite_menus")) {
        appState.menus = JSON.parse(localStorage.getItem("quickbite_menus"));
        let needsMigration = false;
        appState.menus.forEach(item => {
            if (!item.hasOwnProperty('isVeg')) {
                needsMigration = true;
                item.isVeg = !(
                    item.name.toLowerCase().includes('chicken') || 
                    item.name.toLowerCase().includes('pepperoni') || 
                    item.name.toLowerCase().includes('wings') || 
                    item.name.toLowerCase().includes('whopper') || 
                    item.name.toLowerCase().includes('popcorn') ||
                    item.name.toLowerCase().includes('biryani') ||
                    item.name.toLowerCase().includes('mutton') ||
                    item.name.toLowerCase().includes('fish')
                );
            }
        });
        if (needsMigration) {
            localStorage.setItem("quickbite_menus", JSON.stringify(appState.menus));
        }
    } else {
        appState.menus = [
            { id: 1, restaurantId: 1, name: "Pepperoni Special Pizza",       price: 450, desc: "Classic pepperoni slices with loaded cheese", isVeg: false },
            { id: 2, restaurantId: 1, name: "Margherita Pizza",               price: 300, desc: "Fresh basil, tomato sauce, mozzarella cheese", isVeg: true },
            { id: 3, restaurantId: 1, name: "Garlic Bread Sticks",            price: 120, desc: "Baked dough sticks brushed with garlic butter", isVeg: true },
            { id: 4, restaurantId: 2, name: "Double Whopper Burger",          price: 250, desc: "Flame-grilled beef patty, lettuce, mayo, pickles", isVeg: false },
            { id: 5, restaurantId: 2, name: "Crispy Veggie Burger",           price: 180, desc: "Crumb-coated potato-veggie patty with special sauce", isVeg: true },
            { id: 6, restaurantId: 2, name: "Onion Rings Basket",             price: 120, desc: "Deep-fried breaded sweet onion rings", isVeg: true },
            { id: 7, restaurantId: 3, name: "Farmhouse Cheese Burst Pizza",   price: 500, desc: "Mushrooms, onions, capsicum, tomatoes, extra cheese", isVeg: true },
            { id: 8, restaurantId: 3, name: "Peppy Paneer Pizza",             price: 420, desc: "Spiced paneer chunks, capsicum, red paprika", isVeg: true },
            { id: 9, restaurantId: 3, name: "Stuffed Garlic Bread",           price: 160, desc: "Garlic bread stuffed with sweet corn and paneer", isVeg: true },
            { id: 10, restaurantId: 4, name: "Zinger Burger Meal",            price: 280, desc: "Crispy chicken zinger burger, fries, and drink", isVeg: false },
            { id: 11, restaurantId: 4, name: "10 Pcs Chicken Popcorn",        price: 180, desc: "Bite-sized tender crispy chicken pieces", isVeg: false },
            { id: 12, restaurantId: 4, name: "Hot Wings Bucket (6 Pcs)",      price: 240, desc: "Spicy breaded chicken wings fried to perfection", isVeg: false }
        ];
        localStorage.setItem("quickbite_menus", JSON.stringify(appState.menus));
    }

    // Set Settings page default values
    const setName = document.getElementById("set-fullname");
    const setEmail = document.getElementById("set-email");
    const setPhone = document.getElementById("set-phone");
    const setAvatar = document.getElementById("set-avatar");
    if (setName && appState.user) {
        setName.value = appState.user.fullname;
        setEmail.value = appState.user.email;
        setPhone.value = appState.user.phone;
        setAvatar.value = appState.user.avatar || 'https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100';
        
        const settingsNameDisplay = document.getElementById("settings-username-display");
        const settingsPicDisplay = document.querySelector(".settings-profile-card img");
        if (settingsNameDisplay) settingsNameDisplay.innerText = appState.user.fullname;
        if (settingsPicDisplay && appState.user.avatar) settingsPicDisplay.src = appState.user.avatar;
    }

    // Render default dashboard
    renderDashboard();
    
    // Forms select prep
    populateRestaurantDropdowns();

    // Start poller listening to new customer orders
    startCustomerSync();
}

function startCustomerSync() {
    setInterval(() => {
        const isDashboardVisible = !document.getElementById("sec-dashboard").classList.contains("hidden");
        const isOrdersVisible = !document.getElementById("sec-orders").classList.contains("hidden");
        
        if (isDashboardVisible || isOrdersVisible) {
            const dbOrders = JSON.parse(localStorage.getItem("quickbite_orders"));
            if (dbOrders && dbOrders.length !== appState.orders.length) {
                appState.orders = dbOrders;
                if (isDashboardVisible) renderDashboard();
                if (isOrdersVisible) renderOrders();
                showToast("New order received from customer!", "success");
            }
        }
    }, 2000);
}



function updateClock() {
    const greeting = document.getElementById("greeting-text");
    const hour = new Date().getHours();
    
    let welcome = "Welcome Back, " + appState.user.fullname.split(" ")[0] + " 👋";
    if (hour < 12) {
        welcome = "☀️ Good Morning, Admin";
    } else if (hour < 17) {
        welcome = "🌤️ Good Afternoon, Admin";
    } else {
        welcome = "🌙 Good Evening, Admin";
    }
    
    if (greeting) {
        greeting.innerHTML = welcome + `<span style="font-size: 14px; color: var(--text-muted); margin-left: 20px; font-weight: normal;"><i class="fa-solid fa-clock"></i> ${new Date().toLocaleTimeString()}</span>`;
    }
}

// ---------------------------------------------------------
// 3. UI Renderers
// ---------------------------------------------------------
function renderDashboard() {
    // Stats Calculations
    const totalOrders = appState.orders.length;
    const totalRestaurants = appState.restaurants.length;
    const totalAgents = appState.agents.length;
    const activeAgents = appState.agents.filter(a => a.status !== "Offline").length;
    
    const deliveredRevenue = appState.orders
        .filter(o => o.status === "Delivered")
        .reduce((sum, o) => sum + o.amount, 0);

    // Update stats text
    document.getElementById("stat-total-orders").innerText = totalOrders;
    document.getElementById("stat-total-restaurants").innerText = totalRestaurants;
    document.getElementById("stat-total-agents").innerText = totalAgents;
    document.getElementById("stat-active-agents").innerText = `${activeAgents} Active`;
    document.getElementById("stat-total-revenue").innerText = `₹${(deliveredRevenue / 1000).toFixed(1)}K`;

    // Populate Agent table
    const agentTable = document.getElementById("dashboard-agent-table");
    agentTable.innerHTML = "";
    appState.agents.slice(0, 4).forEach(a => {
        let statusClass = "green";
        if (a.status === "Delivering") statusClass = "orange";
        if (a.status === "Returning") statusClass = "blue";
        if (a.status === "Offline") statusClass = "red";

        agentTable.innerHTML += `
            <tr>
                <td><strong>${a.name}</strong></td>
                <td>${a.vehicle}</td>
                <td>${a.location || 'Hub'}</td>
                <td>⭐ ${a.rating}</td>
                <td><span class="${statusClass}">${a.status}</span></td>
            </tr>
        `;
    });

    // Populate Recent Orders table
    const ordersTable = document.getElementById("dashboard-orders-table");
    ordersTable.innerHTML = "";
    appState.orders.slice(-4).reverse().forEach(o => {
        const rest = appState.restaurants.find(r => r.id === o.restaurantId) || { name: "Unknown" };
        let statusClass = "green";
        if (o.status === "Preparing") statusClass = "orange";
        if (o.status === "On Route") statusClass = "blue";
        if (o.status === "Cancelled") statusClass = "red";

        ordersTable.innerHTML += `
            <tr>
                <td>#${o.id}</td>
                <td>${o.customer}</td>
                <td>${rest.name}</td>
                <td><span class="${statusClass}">${o.status}</span></td>
                <td>${o.eta}</td>
            </tr>
        `;
    });

    // Render dashboard charts
    renderDashboardCharts();
}

function renderRestaurants() {
    const container = document.getElementById("restaurant-grid-container");
    container.innerHTML = "";

    const searchVal = document.getElementById("searchRestaurant").value.toLowerCase();
    
    const filtered = appState.restaurants.filter(r => 
        r.name.toLowerCase().includes(searchVal) || r.address.toLowerCase().includes(searchVal)
    );

    filtered.forEach(r => {
        container.innerHTML += `
            <div class="restaurant-card">
                <img src="${r.image}" alt="${r.name}">
                <div class="restaurant-details">
                    <h2>${r.name}</h2>
                    <p><i class="fa-solid fa-location-dot"></i> Address: ${r.address}</p>
                    <p><i class="fa-solid fa-star" style="color: #ff9800;"></i> Rating: <strong>${r.rating}</strong></p>
                    <div class="restaurant-card-actions">
                        <button class="btn btn-secondary btn-sm" onclick="openManageMenuModal(${r.id})" style="color: var(--primary-color);">
                            <i class="fa-solid fa-burger"></i> Menu Items
                        </button>
                        <button class="btn btn-secondary btn-sm" onclick="openEditRestaurantModal(${r.id})">
                            <i class="fa-solid fa-pen-to-square"></i> Edit
                        </button>
                        <button class="btn btn-secondary btn-sm" style="color: var(--danger-color);" onclick="deleteRestaurant(${r.id})">
                            <i class="fa-solid fa-trash"></i> Delete
                        </button>
                    </div>
                </div>
            </div>
        `;
    });

    // Bind filter search
    document.getElementById("searchRestaurant").onkeyup = renderRestaurants;
}

function renderOrders() {
    const tbody = document.getElementById("orders-table-body");
    tbody.innerHTML = "";

    const searchVal = document.getElementById("searchOrder").value.toLowerCase();

    // Stats calculations
    const total = appState.orders.length;
    const pending = appState.orders.filter(o => o.status === "Preparing" || o.status === "On Route").length;
    const delivered = appState.orders.filter(o => o.status === "Delivered").length;
    const cancelled = appState.orders.filter(o => o.status === "Cancelled").length;

    document.getElementById("order-card-total").innerText = total;
    document.getElementById("order-card-pending").innerText = pending;
    document.getElementById("order-card-delivered").innerText = delivered;
    document.getElementById("order-card-cancelled").innerText = cancelled;

    const filtered = appState.orders.filter(o => {
        const rest = appState.restaurants.find(r => r.id === o.restaurantId) || { name: "" };
        return o.customer.toLowerCase().includes(searchVal) || rest.name.toLowerCase().includes(searchVal);
    });

    filtered.forEach(o => {
        const rest = appState.restaurants.find(r => r.id === o.restaurantId) || { name: "Unknown" };
        let statusClass = "status-delivered";
        if (o.status === "Preparing") statusClass = "status-preparing";
        if (o.status === "On Route") statusClass = "status-on-route";
        if (o.status === "Cancelled") statusClass = "status-cancelled";

        let statusTextClass = "green";
        if (o.status === "Preparing") statusTextClass = "orange";
        if (o.status === "On Route") statusTextClass = "blue";
        if (o.status === "Cancelled") statusTextClass = "red";

        tbody.innerHTML += `
            <tr>
                <td>#${o.id}</td>
                <td><strong>${o.customer}</strong></td>
                <td>${rest.name}</td>
                <td>₹${o.amount}</td>
                <td><span class="${statusTextClass}">${o.status}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit-btn" onclick="openEditOrderModal(${o.id})" title="Edit Order">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteOrder(${o.id})" title="Delete Order">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    // Bind filter search
    document.getElementById("searchOrder").onkeyup = renderOrders;
}

function renderAgents() {
    const tbody = document.getElementById("agents-table-body");
    tbody.innerHTML = "";

    const searchVal = document.getElementById("searchAgent").value.toLowerCase();

    // Stats calculations
    const total = appState.agents.length;
    const available = appState.agents.filter(a => a.status === "Available").length;
    const delivering = appState.agents.filter(a => a.status === "Delivering").length;
    const offline = appState.agents.filter(a => a.status === "Offline").length;

    document.getElementById("agent-card-total").innerText = total;
    document.getElementById("agent-card-available").innerText = available;
    document.getElementById("agent-card-delivery").innerText = delivering;
    document.getElementById("agent-card-offline").innerText = offline;

    const filtered = appState.agents.filter(a => 
        a.name.toLowerCase().includes(searchVal) || a.vehicle.toLowerCase().includes(searchVal) || a.status.toLowerCase().includes(searchVal)
    );

    filtered.forEach(a => {
        let statusTextClass = "green";
        if (a.status === "Delivering") statusTextClass = "orange";
        if (a.status === "Returning") statusTextClass = "blue";
        if (a.status === "Offline") statusTextClass = "red";

        tbody.innerHTML += `
            <tr>
                <td>${a.id}</td>
                <td>
                    <img src="${a.image_url || 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150'}" class="agent-table-img" alt="${a.name}">
                    <strong>${a.name}</strong>
                </td>
                <td>${a.vehicle}</td>
                <td>${a.phone}</td>
                <td>⭐ ${a.rating}</td>
                <td><span class="${statusTextClass}">${a.status}</span></td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit-btn" onclick="openEditAgentModal('${a.id}')" title="Edit Agent">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteAgent('${a.id}')" title="Delete Agent">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });

    // Bind filter search
    document.getElementById("searchAgent").onkeyup = renderAgents;
}

function renderReports() {
    const deliveredRevenue = appState.orders
        .filter(o => o.status === "Delivered")
        .reduce((sum, o) => sum + o.amount, 0);

    const totalOrders = appState.orders.length;
    
    // Fill Cards
    document.getElementById("rep-card-revenue").innerText = `₹${deliveredRevenue.toLocaleString()}`;
    document.getElementById("rep-card-orders").innerText = totalOrders;
    
    // Dynamic Top Agents Table
    const performanceTbody = document.getElementById("reports-agent-performance-table");
    performanceTbody.innerHTML = "";
    
    // Sort agents by orders count desc
    const sortedAgents = [...appState.agents].sort((a, b) => b.ordersCount - a.ordersCount);
    sortedAgents.forEach(a => {
        let speed = "Good";
        if (a.rating >= 4.8) speed = "Excellent";
        else if (a.rating >= 4.6) speed = "Very Good";
        
        performanceTbody.innerHTML += `
            <tr>
                <td><strong>${a.name}</strong></td>
                <td>${a.ordersCount * 12}</td> <!-- scaling order simulation -->
                <td>⭐ ${a.rating}</td>
                <td><span class="${a.rating >= 4.8 ? 'green' : 'blue'}">${speed}</span></td>
            </tr>
        `;
    });

    renderReportsCharts();
}

// ---------------------------------------------------------
// 4. Modal Handlers (CRUD implementation)
// ---------------------------------------------------------
function openModal(id) {
    document.getElementById(id).classList.remove("hidden");
}

function closeModal(id) {
    document.getElementById(id).classList.add("hidden");
}

// Restaurants
function openAddRestaurantModal() {
    document.getElementById("restaurant-modal-title").innerText = "Add Restaurant";
    document.getElementById("rest-form-id").value = "";
    document.getElementById("restaurant-form").reset();
    openModal("restaurant-modal");
}

function openEditRestaurantModal(id) {
    const r = appState.restaurants.find(item => item.id === id);
    if (!r) return;
    
    document.getElementById("restaurant-modal-title").innerText = "Edit Restaurant";
    document.getElementById("rest-form-id").value = r.id;
    document.getElementById("rest-form-name").value = r.name;
    document.getElementById("rest-form-address").value = r.address;
    document.getElementById("rest-form-rating").value = r.rating;
    document.getElementById("rest-form-image").value = r.image;
    document.getElementById("rest-form-lat").value = r.lat || "";
    document.getElementById("rest-form-lng").value = r.lng || "";
    
    openModal("restaurant-modal");
}

function submitRestaurantForm(e) {
    e.preventDefault();
    const id      = document.getElementById("rest-form-id").value;
    const name    = document.getElementById("rest-form-name").value;
    const address = document.getElementById("rest-form-address").value;
    const rating  = parseFloat(document.getElementById("rest-form-rating").value);
    const latVal  = document.getElementById("rest-form-lat").value;
    const lngVal  = document.getElementById("rest-form-lng").value;
    const lat     = latVal  ? parseFloat(latVal)  : null;
    const lng     = lngVal  ? parseFloat(lngVal)  : null;
    let image     = document.getElementById("rest-form-image").value;

    if (!image) {
        image = "https://images.unsplash.com/photo-1498837167922-ddd27525d352?w=600";
    }

    if (id) {
        // Edit Mode
        const index = appState.restaurants.findIndex(r => r.id === parseInt(id));
        if (index !== -1) {
            appState.restaurants[index] = { id: parseInt(id), name, address, rating, image, lat, lng };
            showToast("Restaurant updated successfully", "success");
        }
    } else {
        // Add Mode
        const newId = appState.restaurants.length > 0 ? Math.max(...appState.restaurants.map(r => r.id)) + 1 : 1;
        appState.restaurants.push({ id: newId, name, address, rating, image, lat, lng });
        showToast("New restaurant added successfully", "success");
    }

    // Save to shared database (localStorage)
    localStorage.setItem("quickbite_restaurants", JSON.stringify(appState.restaurants));

    closeModal("restaurant-modal");
    renderRestaurants();
    populateRestaurantDropdowns();
}

function deleteRestaurant(id) {
    if (confirm("Are you sure you want to delete this restaurant? This will remove related menu bindings.")) {
        appState.restaurants = appState.restaurants.filter(r => r.id !== id);
        localStorage.setItem("quickbite_restaurants", JSON.stringify(appState.restaurants));
        showToast("Restaurant removed", "error");
        renderRestaurants();
        populateRestaurantDropdowns();
    }
}

// Orders
function openAddOrderModal() {
    document.getElementById("order-modal-title").innerText = "Create Order";
    document.getElementById("order-form-id").value = "";
    document.getElementById("order-form").reset();
    openModal("order-modal");
}

function openEditOrderModal(id) {
    const o = appState.orders.find(item => item.id === id);
    if (!o) return;

    document.getElementById("order-modal-title").innerText = "Edit Order Details";
    document.getElementById("order-form-id").value = o.id;
    document.getElementById("order-form-customer").value = o.customer;
    document.getElementById("order-form-restaurant").value = o.restaurantId;
    document.getElementById("order-form-amount").value = o.amount;
    document.getElementById("order-form-status").value = o.status;

    openModal("order-modal");
}

function submitOrderForm(e) {
    e.preventDefault();
    const id = document.getElementById("order-form-id").value;
    const customer = document.getElementById("order-form-customer").value;
    const restaurantId = parseInt(document.getElementById("order-form-restaurant").value);
    const amount = parseInt(document.getElementById("order-form-amount").value);
    const status = document.getElementById("order-form-status").value;
    
    // Estimate ETA based on status
    let eta = "--";
    if (status === "Preparing") eta = "15 min";
    if (status === "On Route") eta = "10 min";
    if (status === "Delivered") eta = "Delivered";

    if (id) {
        // Edit Mode
        const index = appState.orders.findIndex(o => o.id === parseInt(id));
        if (index !== -1) {
            appState.orders[index] = { id: parseInt(id), customer, restaurantId, amount, status, eta };
            showToast("Order status updated", "success");
        }
    } else {
        // Add Mode
        const newId = appState.orders.length > 0 ? Math.max(...appState.orders.map(o => o.id)) + 1 : 1001;
        appState.orders.push({ id: newId, customer, restaurantId, amount, status, eta });
        showToast("New order placed", "success");
    }

    // Save database
    localStorage.setItem("quickbite_orders", JSON.stringify(appState.orders));

    closeModal("order-modal");
    renderOrders();
}

function deleteOrder(id) {
    if (confirm("Delete order record #" + id + "?")) {
        appState.orders = appState.orders.filter(o => o.id !== id);
        localStorage.setItem("quickbite_orders", JSON.stringify(appState.orders));
        showToast("Order record removed", "error");
        renderOrders();
    }
}

// Agents
function openAddAgentModal() {
    document.getElementById("agent-modal-title").innerText = "Register Delivery Agent";
    document.getElementById("agent-form-id").value = "";
    document.getElementById("agent-form").reset();
    openModal("agent-modal");
}

function openEditAgentModal(id) {
    const a = appState.agents.find(item => item.id === id);
    if (!a) return;

    document.getElementById("agent-modal-title").innerText = "Edit Agent Credentials";
    document.getElementById("agent-form-id").value = a.id;
    document.getElementById("agent-form-name").value = a.name;
    document.getElementById("agent-form-vehicle").value = a.vehicle;
    document.getElementById("agent-form-phone").value = a.phone;
    document.getElementById("agent-form-rating").value = a.rating;
    document.getElementById("agent-form-status").value = a.status;
    document.getElementById("agent-form-image").value = a.image_url || '';
    // Populate latitude and longitude if available
    document.getElementById("agent-form-lat").value = a.lat || '';
    document.getElementById("agent-form-lng").value = a.lng || '';

    openModal("agent-modal");
}

function submitAgentForm(e) {
    e.preventDefault();
    const id = document.getElementById("agent-form-id").value;
    const name = document.getElementById("agent-form-name").value;
    const vehicle = document.getElementById("agent-form-vehicle").value;
    const phone = document.getElementById("agent-form-phone").value;
    const rating = parseFloat(document.getElementById("agent-form-rating").value);
    const status = document.getElementById("agent-form-status").value;
    const image_url = document.getElementById("agent-form-image").value;

    if (id) {
        // Edit Mode
        const index = appState.agents.findIndex(a => a.id === id);
        if (index !== -1) {
            const old = appState.agents[index];
            appState.agents[index] = { ...old, name, vehicle, phone, rating, status, image_url, lat: document.getElementById("agent-form-lat").value, lng: document.getElementById("agent-form-lng").value };
            showToast("Agent info saved", "success");
        }
    } else {
        // Add Mode
        const count = appState.agents.length + 1;
        const newId = "A00" + count;
        appState.agents.push({ id: newId, name, vehicle, phone, rating, status, ordersCount: 0, location: "Hub", image_url, lat: document.getElementById("agent-form-lat").value, lng: document.getElementById("agent-form-lng").value });
        showToast("New agent registered", "success");
    }

    // Save database
    localStorage.setItem("quickbite_agents", JSON.stringify(appState.agents));

    closeModal("agent-modal");
    renderAgents();
}

function deleteAgent(id) {
    if (confirm("Remove agent " + id + " from duty?")) {
        appState.agents = appState.agents.filter(a => a.id !== id);
        localStorage.setItem("quickbite_agents", JSON.stringify(appState.agents));
        showToast("Agent removed from system", "error");
        renderAgents();
    }
}

// Helpers
function populateRestaurantDropdowns() {
    const selects = [
        document.getElementById("order-form-restaurant"),
        document.getElementById("mi-form-restaurant")
    ];
    selects.forEach(select => {
        if (!select) return;
        select.innerHTML = "";
        appState.restaurants.forEach(r => {
            select.innerHTML += `<option value="${r.id}">${r.name}</option>`;
        });
    });
}

function populateMenuRestaurantDropdowns() {
    // Fill the filter dropdown in the Food Items section
    const filterSel = document.getElementById("menu-filter-restaurant");
    if (!filterSel) return;
    const prev = filterSel.value;
    filterSel.innerHTML = `<option value="">All Restaurants</option>`;
    appState.restaurants.forEach(r => {
        filterSel.innerHTML += `<option value="${r.id}">${r.name}</option>`;
    });
    // Restore selection if still valid
    if (prev && appState.restaurants.find(r => String(r.id) === prev)) {
        filterSel.value = prev;
    }
    // Also repopulate the modal dropdown
    populateRestaurantDropdowns();
}

// ----------------------------------------------------------
// Menu Items CRUD
// ----------------------------------------------------------
function renderMenuItems() {
    const tbody = document.getElementById("menu-items-table-body");
    if (!tbody) return;
    tbody.innerHTML = "";

    const filterRestId = document.getElementById("menu-filter-restaurant").value;
    const searchVal = (document.getElementById("searchMenuItem").value || "").toLowerCase();

    let items = appState.menus || [];

    if (filterRestId) {
        items = items.filter(m => String(m.restaurantId) === filterRestId);
    }
    if (searchVal) {
        items = items.filter(m => m.name.toLowerCase().includes(searchVal) || (m.desc || "").toLowerCase().includes(searchVal));
    }

    if (items.length === 0) {
        tbody.innerHTML = `<tr><td colspan="6" style="text-align:center; color:var(--text-muted); padding:30px;">No food items found. Click "Add Food Item" to get started.</td></tr>`;
        return;
    }

    items.forEach((item, idx) => {
        const rest = appState.restaurants.find(r => r.id === item.restaurantId) || { name: "Unknown" };
        const vegDot = item.isVeg
            ? `<span title="Veg" style="display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border:2px solid #16a34a;border-radius:3px;margin-right:6px;"><span style="width:8px;height:8px;border-radius:50%;background:#16a34a;"></span></span>`
            : `<span title="Non-Veg" style="display:inline-flex;align-items:center;justify-content:center;width:16px;height:16px;border:2px solid #dc2626;border-radius:3px;margin-right:6px;"><span style="width:8px;height:8px;border-radius:50%;background:#dc2626;"></span></span>`;
        
        // Image preview
        const imgHtml = item.image
            ? `<img src="${item.image}" style="width:36px; height:36px; object-fit:cover; border-radius:6px; margin-right:8px;" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'"/>`
            : `<span style="width:36px; height:36px; border-radius:6px; background:#f1f5f9; display:inline-flex; align-items:center; justify-content:center; margin-right:8px; color:#94a3b8; font-size:12px;"><i class="fa-solid fa-image"></i></span>`;

        // Discounted price
        const hasDiscount = item.discount && parseInt(item.discount) > 0;
        const discountVal = hasDiscount ? parseInt(item.discount) : 0;
        const discPrice = hasDiscount ? Math.round(item.price * (1 - discountVal / 100)) : item.price;
        const priceHtml = hasDiscount
            ? `<span>₹${discPrice} <small style="text-decoration:line-through; color:#94a3b8; margin-left:4px;">₹${item.price}</small> <span style="background:#fef2f2; color:#ef4444; border:1px solid #fee2e2; border-radius:4px; padding:1px 4px; font-size:10px; font-weight:700; margin-left:4px;">${discountVal}% OFF</span></span>`
            : `<span>₹${item.price}</span>`;

        // Best seller badge
        const bestSellerBadge = item.isBestSeller
            ? `<span style="background:linear-gradient(135deg, #f59e0b, #d97706); color:white; border-radius:6px; padding:2px 6px; font-size:10px; font-weight:800; text-transform:uppercase; margin-left:8px; display:inline-flex; align-items:center; gap:2px;"><i class="fa-solid fa-star"></i> Best Seller</span>`
            : ``;

        tbody.innerHTML += `
            <tr>
                <td>${idx + 1}</td>
                <td>
                    <span style="display:flex;align-items:center;">
                        ${imgHtml}
                        <span style="display:flex; flex-direction:column;">
                            <span style="display:flex; align-items:center;">
                                ${vegDot}<strong>${item.name}</strong>
                                ${bestSellerBadge}
                            </span>
                        </span>
                    </span>
                </td>
                <td style="color:var(--text-muted); font-size:13px;">${item.desc || "—"}</td>
                <td>${priceHtml}</td>
                <td>${rest.name}</td>
                <td>
                    <div class="table-actions">
                        <button class="action-btn edit-btn" onclick="openEditMenuItemModal(${item.id})" title="Edit Item">
                            <i class="fa-solid fa-pen-to-square"></i>
                        </button>
                        <button class="action-btn delete-btn" onclick="deleteMenuItem(${item.id})" title="Delete Item">
                            <i class="fa-solid fa-trash"></i>
                        </button>
                    </div>
                </td>
            </tr>
        `;
    });
}

function openAddMenuItemModal(presetRestaurantId = null) {
    document.getElementById("menuitem-modal-title").innerText = "Add Food Item";
    document.getElementById("mi-form-idx").value = "";
    document.getElementById("menuitem-form").reset();
    populateRestaurantDropdowns();
    if (presetRestaurantId) {
        const sel = document.getElementById("mi-form-restaurant");
        if (sel) sel.value = presetRestaurantId;
    }
    openModal("menuitem-modal");
}

function openEditMenuItemModal(id) {
    const item = (appState.menus || []).find(m => m.id === id);
    if (!item) return;
    document.getElementById("menuitem-modal-title").innerText = "Edit Food Item";
    document.getElementById("mi-form-idx").value = item.id;
    populateRestaurantDropdowns();
    document.getElementById("mi-form-restaurant").value = item.restaurantId;
    document.getElementById("mi-form-name").value = item.name;
    document.getElementById("mi-form-desc").value = item.desc || "";
    document.getElementById("mi-form-price").value = item.price;
    // Restore veg/nonveg radio
    document.getElementById(item.isVeg ? "mi-form-veg" : "mi-form-nonveg").checked = true;
    
    // Restore new fields
    document.getElementById("mi-form-image").value = item.image || "";
    document.getElementById("mi-form-discount").value = item.discount || 0;
    document.getElementById("mi-form-bestseller").checked = !!item.isBestSeller;
    
    openModal("menuitem-modal");
}

function openManageMenuModal(restaurantId) {
    // Switch to menuitems section and pre-filter to that restaurant
    document.querySelectorAll(".nav-item").forEach(n => n.classList.remove("active"));
    const menuNav = document.querySelector(".nav-item[data-target='menuitems']");
    if (menuNav) menuNav.classList.add("active");
    document.querySelectorAll(".spa-section").forEach(s => s.classList.add("hidden"));
    const sec = document.getElementById("sec-menuitems");
    if (sec) sec.classList.remove("hidden");
    populateMenuRestaurantDropdowns();
    const filterSel = document.getElementById("menu-filter-restaurant");
    if (filterSel) filterSel.value = restaurantId;
    renderMenuItems();
}

function submitMenuItemForm(e) {
    e.preventDefault();
    if (!appState.menus) appState.menus = [];

    const id = document.getElementById("mi-form-idx").value;
    const restaurantId = parseInt(document.getElementById("mi-form-restaurant").value);
    const name = document.getElementById("mi-form-name").value.trim();
    const desc = document.getElementById("mi-form-desc").value.trim();
    const price = parseInt(document.getElementById("mi-form-price").value);
    const isVeg = document.getElementById("mi-form-veg").checked;
    
    // Get new fields
    const image = document.getElementById("mi-form-image").value.trim();
    const discount = parseInt(document.getElementById("mi-form-discount").value) || 0;
    const isBestSeller = document.getElementById("mi-form-bestseller").checked;

    if (id) {
        // Edit mode
        const index = appState.menus.findIndex(m => m.id === parseInt(id));
        if (index !== -1) {
            appState.menus[index] = { 
                id: parseInt(id), 
                restaurantId, 
                name, 
                desc, 
                price, 
                isVeg,
                image,
                discount,
                isBestSeller
            };
            showToast("Food item updated", "success");
        }
    } else {
        // Add mode
        const newId = appState.menus.length > 0 ? Math.max(...appState.menus.map(m => m.id)) + 1 : 1;
        appState.menus.push({ 
            id: newId, 
            restaurantId, 
            name, 
            desc, 
            price, 
            isVeg,
            image,
            discount,
            isBestSeller
        });
        showToast(`"${name}" added to menu`, "success");
    }

    localStorage.setItem("quickbite_menus", JSON.stringify(appState.menus));
    closeModal("menuitem-modal");
    renderMenuItems();
}

function deleteMenuItem(id) {
    const item = (appState.menus || []).find(m => m.id === id);
    if (!item) return;
    if (confirm(`Remove "${item.name}" from the menu?`)) {
        appState.menus = appState.menus.filter(m => m.id !== id);
        localStorage.setItem("quickbite_menus", JSON.stringify(appState.menus));
        showToast("Menu item removed", "error");
        renderMenuItems();
    }
}

// ---------------------------------------------------------
// 5. Interactive Canvas Dijkstra Pathfinding Engine
// ---------------------------------------------------------
let canvas, ctx;
let selectedNode = null;
let dragNode = null;
let linkingNode = null;

function initGraphBuilder() {
    canvas = document.getElementById("graphCanvas");
    if (!canvas) return;
    ctx = canvas.getContext("2d");

    // Events
    canvas.addEventListener("mousedown", handleCanvasMouseDown);
    canvas.addEventListener("mousemove", handleCanvasMouseMove);
    canvas.addEventListener("mouseup", handleCanvasMouseUp);
    canvas.addEventListener("dblclick", handleCanvasDblClick);

    document.getElementById("btn-clear-graph").addEventListener("click", () => {
        appState.graph.nodes = [];
        appState.graph.edges = [];
        lastShortestPath = [];
        drawGraph();
        populateNodeSelectors();
        showToast("Graph cleared", "error");
    });

    document.getElementById("btn-reset-demo-graph").addEventListener("click", () => {
        appState.graph = {
            nodes: [
                { id: 0, name: "Agent Hub 🛵", x: 100, y: 200, type: "agent" },
                { id: 1, name: "Restaurant Zone A 🏠", x: 220, y: 100, type: "restaurant" },
                { id: 2, name: "Transit Hub A 📍", x: 300, y: 250, type: "transit" },
                { id: 3, name: "Transit Hub B 📍", x: 480, y: 120, type: "transit" },
                { id: 4, name: "Customer Drop 🏡", x: 600, y: 280, type: "customer" },
                { id: 5, name: "Restaurant Zone B 🏠", x: 420, y: 340, type: "restaurant" }
            ],
            edges: [
                { u: 0, v: 1, weight: 4 },
                { u: 0, v: 2, weight: 2 },
                { u: 1, v: 2, weight: 1 },
                { u: 1, v: 3, weight: 5 },
                { u: 2, v: 3, weight: 8 },
                { u: 2, v: 4, weight: 10 },
                { u: 3, v: 4, weight: 2 },
                { u: 3, v: 5, weight: 6 },
                { u: 4, v: 5, weight: 3 }
            ]
        };
        lastShortestPath = [];
        drawGraph();
        populateNodeSelectors();
        showToast("Demo network loaded", "success");
    });

    document.getElementById("btn-run-dijkstra").addEventListener("click", runVisualDijkstra);
}

function populateNodeSelectors() {
    const srcSel = document.getElementById("route-source");
    const tgtSel = document.getElementById("route-target");
    if (!srcSel || !tgtSel) return;

    srcSel.innerHTML = "";
    tgtSel.innerHTML = "";

    appState.graph.nodes.forEach(node => {
        srcSel.innerHTML += `<option value="${node.id}">${node.name} (Node ${node.id})</option>`;
        tgtSel.innerHTML += `<option value="${node.id}">${node.name} (Node ${node.id})</option>`;
    });

    // Default defaults
    if (srcSel.options.length > 0) srcSel.selectedIndex = 0;
    if (tgtSel.options.length > 1) tgtSel.selectedIndex = 4; // Node 4 default destination
}

function drawGraph() {
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Draw Edges (Connections)
    appState.graph.edges.forEach(edge => {
        const uNode = appState.graph.nodes.find(n => n.id === edge.u);
        const vNode = appState.graph.nodes.find(n => n.id === edge.v);
        if (!uNode || !vNode) return;

        // Highlight if part of computed shortest path
        let isShortest = false;
        for (let i = 0; i < lastShortestPath.length - 1; i++) {
            if ((lastShortestPath[i] === edge.u && lastShortestPath[i+1] === edge.v) ||
                (lastShortestPath[i] === edge.v && lastShortestPath[i+1] === edge.u)) {
                isShortest = true;
                break;
            }
        }

        ctx.beginPath();
        ctx.moveTo(uNode.x, uNode.y);
        ctx.lineTo(vNode.x, vNode.y);
        
        if (isShortest) {
            ctx.strokeStyle = "#4caf50";
            ctx.lineWidth = 5;
            ctx.shadowColor = "#4caf50";
            ctx.shadowBlur = 10;
        } else {
            ctx.strokeStyle = document.body.classList.contains("dark-theme") ? "#555555" : "#b2bec3";
            ctx.lineWidth = 2.5;
            ctx.shadowBlur = 0;
        }
        ctx.stroke();
        ctx.shadowBlur = 0; // reset

        // Draw Edge Weights (Distance)
        const midX = (uNode.x + vNode.x) / 2;
        const midY = (uNode.y + vNode.y) / 2;
        ctx.beginPath();
        ctx.arc(midX, midY, 12, 0, 2 * Math.PI);
        ctx.fillStyle = "var(--card-bg)";
        ctx.strokeStyle = "var(--border-color)";
        ctx.lineWidth = 1;
        ctx.fill();
        ctx.stroke();

        ctx.fillStyle = "var(--text-color)";
        ctx.font = "bold 10px Poppins";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(edge.weight + "k", midX, midY);
    });

    // Draw Nodes
    appState.graph.nodes.forEach(node => {
        ctx.beginPath();
        ctx.arc(node.x, node.y, 22, 0, 2 * Math.PI);
        
        // Node Type Colors
        let color = "#7f8c8d"; // transit
        if (node.type === "agent") color = "#0984e3";
        if (node.type === "restaurant") color = "#ff6b35";
        if (node.type === "customer") color = "#2ecc71";

        ctx.fillStyle = color;
        ctx.shadowColor = color;
        
        // Highlight active link building / selection
        if (linkingNode === node) {
            ctx.strokeStyle = "#f1c40f";
            ctx.lineWidth = 4;
            ctx.shadowBlur = 15;
        } else if (lastShortestPath.includes(node.id)) {
            ctx.strokeStyle = "#2ecc71";
            ctx.lineWidth = 4;
            ctx.shadowBlur = 15;
        } else {
            ctx.strokeStyle = "white";
            ctx.lineWidth = 2;
            ctx.shadowBlur = 4;
        }

        ctx.fill();
        ctx.stroke();
        ctx.shadowBlur = 0; // reset

        // Node ID or Type Symbol inside
        ctx.fillStyle = "white";
        ctx.font = "12px Poppins";
        ctx.textAlign = "center";
        ctx.textBaseline = "middle";
        ctx.fillText(node.id, node.x, node.y);

        // Labels underneath
        ctx.fillStyle = "var(--text-color)";
        ctx.font = "10px Poppins";
        ctx.fillText(node.name, node.x, node.y + 36);
    });
}

function handleCanvasMouseDown(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Check if mouse hits a node
    dragNode = null;
    appState.graph.nodes.forEach(node => {
        const dist = Math.hypot(node.x - mouseX, node.y - mouseY);
        if (dist <= 22) {
            dragNode = node;
        }
    });

    if (dragNode) {
        if (e.shiftKey) {
            // Shift + click starts edge linking
            linkingNode = dragNode;
            showToast("Click destination node to add path link", "success");
        } else {
            linkingNode = null;
        }
        drawGraph();
    }
}

function handleCanvasMouseMove(e) {
    if (!dragNode || e.shiftKey) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Constrain to canvas boundaries
    dragNode.x = Math.max(25, Math.min(canvas.width - 25, mouseX));
    dragNode.y = Math.max(25, Math.min(canvas.height - 25, mouseY));

    drawGraph();
}

function handleCanvasMouseUp(e) {
    if (linkingNode) {
        const rect = canvas.getBoundingClientRect();
        const mouseX = e.clientX - rect.left;
        const mouseY = e.clientY - rect.top;

        // Check if mouse is released over another node
        let targetNode = null;
        appState.graph.nodes.forEach(node => {
            const dist = Math.hypot(node.x - mouseX, node.y - mouseY);
            if (dist <= 22 && node !== linkingNode) {
                targetNode = node;
            }
        });

        if (targetNode) {
            // Prompt for edge weight
            const weightInput = prompt("Enter distance weight in km:", "5");
            const weight = parseInt(weightInput);
            if (!isNaN(weight) && weight > 0) {
                // Ensure edge doesn't already exist
                const duplicate = appState.graph.edges.find(edge => 
                    (edge.u === linkingNode.id && edge.v === targetNode.id) ||
                    (edge.u === targetNode.id && edge.v === linkingNode.id)
                );
                if (!duplicate) {
                    appState.graph.edges.push({ u: linkingNode.id, v: targetNode.id, weight });
                    showToast(`Linked Node ${linkingNode.id} & Node ${targetNode.id}`, "success");
                } else {
                    duplicate.weight = weight;
                    showToast("Updated existing path distance", "success");
                }
            }
        }
        linkingNode = null;
        drawGraph();
    }
    dragNode = null;
}

function handleCanvasDblClick(e) {
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;

    // Add node
    const newId = appState.graph.nodes.length > 0 ? Math.max(...appState.graph.nodes.map(n => n.id)) + 1 : 0;
    
    // Prompt name
    const name = prompt("Enter Node Label:", "Transit Hub " + newId);
    if (!name) return;

    // Prompt Node Type
    const typeSel = prompt("Enter type (agent / restaurant / customer / transit):", "transit");
    let type = "transit";
    if (["agent", "restaurant", "customer"].includes(typeSel)) {
        type = typeSel;
    }

    appState.graph.nodes.push({ id: newId, name, x: mouseX, y: mouseY, type });
    populateNodeSelectors();
    drawGraph();
    showToast(`Created Node ${newId}: ${name}`, "success");
}

// Visual Dijkstra Algorithm Execution
function runVisualDijkstra() {
    const srcId = parseInt(document.getElementById("route-source").value);
    const tgtId = parseInt(document.getElementById("route-target").value);
    const logsList = document.getElementById("dijkstra-step-logs");
    const detailsDiv = document.getElementById("route-result-details");
    const placeholderDiv = document.querySelector(".result-placeholder");
    
    if (srcId === tgtId) {
        showToast("Source and Target nodes must be different", "error");
        return;
    }

    logsList.innerHTML = "<li>[Init] Starting Dijkstra Path Optimization...</li>";
    detailsDiv.classList.add("hidden");
    placeholderDiv.classList.remove("hidden");

    // Standard Dijkstra setup
    const V = appState.graph.nodes.length;
    const dist = {};
    const prev = {};
    const unvisited = new Set();

    appState.graph.nodes.forEach(n => {
        dist[n.id] = Infinity;
        prev[n.id] = null;
        unvisited.add(n.id);
    });

    dist[srcId] = 0;

    let stepDelay = 400; // interval in ms for logs/animation
    let steps = [];

    while (unvisited.size > 0) {
        // Find node with minimum distance
        let u = null;
        let minDist = Infinity;
        unvisited.forEach(nodeId => {
            if (dist[nodeId] < minDist) {
                minDist = dist[nodeId];
                u = nodeId;
            }
        });

        if (u === null) break; // unreachable nodes remaining
        if (u === tgtId) {
            steps.push({ type: "finish", node: u, log: `[Finish] Target Node ${tgtId} reached!` });
            break;
        }

        unvisited.delete(u);
        steps.push({ type: "relax", node: u, log: `[Scan] Inspecting neighbors of Node ${u} (current dist: ${dist[u]}km)...` });

        // Neighbors
        appState.graph.edges.forEach(edge => {
            let alt = null;
            let v = null;
            if (edge.u === u && unvisited.has(edge.v)) {
                v = edge.v;
            } else if (edge.v === u && unvisited.has(edge.u)) {
                v = edge.u;
            }

            if (v !== null) {
                alt = dist[u] + edge.weight;
                if (alt < dist[v]) {
                    dist[v] = alt;
                    prev[v] = u;
                    steps.push({ type: "update", node: v, parent: u, log: `   -> Relaxing Node ${v}: path distance reduced to ${alt}km via Node ${u}` });
                }
            }
        });
    }

    // Build path
    const path = [];
    let curr = tgtId;
    if (prev[curr] !== null || curr === srcId) {
        while (curr !== null) {
            path.unshift(curr);
            curr = prev[curr];
        }
    }

    // Animation step-by-step
    let sIdx = 0;
    const interval = setInterval(() => {
        if (sIdx >= steps.length) {
            clearInterval(interval);
            
            // Finish pathing
            if (path.length > 0 && path[0] === srcId) {
                lastShortestPath = path;
                drawGraph();

                // Compute output metrics
                const totalDist = dist[tgtId];
                const estTime = Math.round(totalDist * 1.8); // 1.8 mins per km
                const estCost = Math.round(30 + totalDist * 4); // base + 4rs per km

                document.getElementById("res-distance").innerText = totalDist + " km";
                document.getElementById("res-time").innerText = estTime + " Min";
                
                // Draw path flow
                const flowDiv = document.getElementById("res-path-flow");
                flowDiv.innerHTML = "";
                path.forEach((nId, idx) => {
                    const node = appState.graph.nodes.find(n => n.id === nId);
                    flowDiv.innerHTML += `<span class="p-node">${node.name.split(" ")[0]}</span>`;
                    if (idx < path.length - 1) {
                        flowDiv.innerHTML += `<span class="p-arrow"><i class="fa-solid fa-arrow-right"></i></span>`;
                    }
                });

                // Update location tracking values dynamically based on routes selection
                document.getElementById("track-rest").innerText = appState.graph.nodes.find(n => n.id === path[1] || n.id === path[0]).name;
                document.getElementById("track-cust").innerText = appState.graph.nodes.find(n => n.id === tgtId).name;
                document.getElementById("track-dist").innerText = totalDist + " km";
                document.getElementById("track-eta").innerText = estTime + " Min";

                placeholderDiv.classList.add("hidden");
                detailsDiv.classList.remove("hidden");
                showToast("Shortest route computed!", "success");
            } else {
                logsList.innerHTML += `<li style="color: var(--danger-color);">[Error] No path connection found between Node ${srcId} & Node ${tgtId}.</li>`;
                showToast("Nodes are disconnected", "error");
            }
            return;
        }

        logsList.innerHTML += `<li>${steps[sIdx].log}</li>`;
        logsList.scrollTop = logsList.scrollHeight; // auto scroll logs
        sIdx++;
    }, stepDelay);
}

// ---------------------------------------------------------
// 6. Live Location Tracking Map Simulator
// ---------------------------------------------------------
let trackCanvas, trackCtx;
let simulationInterval = null;

function initTrackingSimulator() {
    trackCanvas = document.getElementById("trackingCanvas");
    if (!trackCanvas) return;
    trackCtx = trackCanvas.getContext("2d");

    document.getElementById("btn-start-tracking").addEventListener("click", startTrackingSimulation);
}

function drawTrackingMap(agentPos = null) {
    if (!trackCtx) return;
    trackCtx.clearRect(0, 0, trackCanvas.width, trackCanvas.height);

    // Draw grid lines (stylized street map)
    trackCtx.strokeStyle = document.body.classList.contains("dark-theme") ? "#222222" : "#e6f0fa";
    trackCtx.lineWidth = 15;
    for (let i = 40; i < trackCanvas.width; i += 60) {
        trackCtx.beginPath();
        trackCtx.moveTo(i, 0);
        trackCtx.lineTo(i, trackCanvas.height);
        trackCtx.stroke();
    }
    for (let j = 40; j < trackCanvas.height; j += 60) {
        trackCtx.beginPath();
        trackCtx.moveTo(0, j);
        trackCtx.lineTo(trackCanvas.width, j);
        trackCtx.stroke();
    }

    // Draw active paths
    appState.graph.edges.forEach(edge => {
        const u = appState.graph.nodes.find(n => n.id === edge.u);
        const v = appState.graph.nodes.find(n => n.id === edge.v);
        if (!u || !v) return;

        trackCtx.beginPath();
        trackCtx.moveTo(u.x, u.y);
        trackCtx.lineTo(v.x, v.y);
        trackCtx.strokeStyle = "rgba(189, 195, 199, 0.4)";
        trackCtx.lineWidth = 4;
        trackCtx.stroke();
    });

    // Draw source and destination labels
    const rNode = appState.graph.nodes.find(n => n.type === "restaurant") || { x: 220, y: 100, name: "Restaurant" };
    const cNode = appState.graph.nodes.find(n => n.type === "customer") || { x: 600, y: 280, name: "Customer" };

    // Restaurant
    trackCtx.beginPath();
    trackCtx.arc(rNode.x, rNode.y, 16, 0, 2 * Math.PI);
    trackCtx.fillStyle = "#e74c3c";
    trackCtx.fill();
    trackCtx.fillStyle = "white";
    trackCtx.font = "12px Poppins";
    trackCtx.textAlign = "center";
    trackCtx.fillText("🍔", rNode.x, rNode.y + 4);

    // Customer
    trackCtx.beginPath();
    trackCtx.arc(cNode.x, cNode.y, 16, 0, 2 * Math.PI);
    trackCtx.fillStyle = "#2ecc71";
    trackCtx.fill();
    trackCtx.fillStyle = "white";
    trackCtx.fillText("🏠", cNode.x, cNode.y + 4);

    // Draw Moving Delivery Agent
    const pos = agentPos || { x: rNode.x, y: rNode.y };
    trackCtx.beginPath();
    trackCtx.arc(pos.x, pos.y, 18, 0, 2 * Math.PI);
    trackCtx.fillStyle = "#0984e3";
    trackCtx.strokeStyle = "white";
    trackCtx.lineWidth = 2;
    trackCtx.fill();
    trackCtx.stroke();
    trackCtx.fillStyle = "white";
    trackCtx.fillText("🛵", pos.x, pos.y + 4);
}

function startTrackingSimulation() {
    if (simulationInterval) clearInterval(simulationInterval);

    const feedList = document.getElementById("tracking-feed-list");
    const statusText = document.getElementById("track-status-text");
    
    feedList.innerHTML = "";
    statusText.innerText = "Order Received";
    statusText.className = "orange";

    const path = lastShortestPath.length > 0 ? lastShortestPath : [1, 2, 3, 4]; // fallback demo path
    let pathCoordinates = [];

    // Build continuous animation coordinates along graph path
    for (let i = 0; i < path.length - 1; i++) {
        const u = appState.graph.nodes.find(n => n.id === path[i]);
        const v = appState.graph.nodes.find(n => n.id === path[i+1]);
        if (!u || !v) continue;

        // Interpolate points between u and v
        const steps = 30; // animation smoothness
        for (let s = 0; s <= steps; s++) {
            const ratio = s / steps;
            pathCoordinates.push({
                x: u.x + (v.x - u.x) * ratio,
                y: u.y + (v.y - u.y) * ratio,
                nodeName: v.name
            });
        }
    }

    let frameIdx = 0;
    const addFeed = (text) => {
        feedList.innerHTML = `<div class="feed-item"><span class="time">${new Date().toLocaleTimeString()}</span><span class="text">${text}</span></div>` + feedList.innerHTML;
    };

    addFeed("🛵 Food Delivery Request Assigned to Agent Rahul Kumar.");
    setTimeout(() => addFeed("🍔 Agent arrived at Restaurant and picked up package."), 1500);

    simulationInterval = setInterval(() => {
        if (frameIdx >= pathCoordinates.length) {
            clearInterval(simulationInterval);
            statusText.innerText = "Delivered";
            statusText.className = "green";
            addFeed("🎉 Delivery completed! Customer Vamshi Krishna received order.");
            drawTrackingMap(pathCoordinates[pathCoordinates.length - 1]);
            showToast("Delivery Simulation Successful!", "success");
            return;
        }

        const currentPos = pathCoordinates[frameIdx];
        drawTrackingMap(currentPos);

        if (frameIdx === Math.floor(pathCoordinates.length / 3)) {
            statusText.innerText = "Food Picked Up";
            statusText.className = "blue";
            addFeed("🛵 Agent is leaving restaurant, heading towards " + currentPos.nodeName.split(" ")[0]);
        }
        if (frameIdx === Math.floor(pathCoordinates.length * 2 / 3)) {
            statusText.innerText = "En Route";
            statusText.className = "orange";
            addFeed("🚚 Agent passed through " + currentPos.nodeName.split(" ")[0]);
        }

        frameIdx++;
    }, 80); // Speed control
}

// ---------------------------------------------------------
// 7. Dynamic Analytics Charts (Chart.js integrations)
// ---------------------------------------------------------
function renderDashboardCharts() {
    const isDark = document.body.classList.contains("dark-theme");
    const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
    const fontColor = isDark ? "#aaaaaa" : "#666666";

    // Chart 1: Order Chart (Line)
    const ctxOrder = document.getElementById("dashboardOrderChart");
    if (ctxOrder) {
        if (orderChartInstance) orderChartInstance.destroy();
        orderChartInstance = new Chart(ctxOrder, {
            type: 'line',
            data: {
                labels: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
                datasets: [{
                    label: "Orders Delivered",
                    data: [65, 78, 72, 85, 99, 120, 110],
                    borderColor: "#ff6b35",
                    backgroundColor: "rgba(255, 107, 53, 0.1)",
                    borderWidth: 3,
                    fill: true,
                    tension: 0.3
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: gridColor }, ticks: { color: fontColor } },
                    y: { grid: { color: gridColor }, ticks: { color: fontColor } }
                }
            }
        });
    }

    // Chart 2: Status Breakdown (Pie)
    const ctxPie = document.getElementById("dashboardPieChart");
    if (ctxPie) {
        if (pieChartInstance) pieChartInstance.destroy();
        
        const counts = { Delivered: 0, Preparing: 0, OnRoute: 0, Cancelled: 0 };
        appState.orders.forEach(o => {
            if (o.status === "Delivered") counts.Delivered++;
            else if (o.status === "Preparing") counts.Preparing++;
            else if (o.status === "On Route") counts.OnRoute++;
            else if (o.status === "Cancelled") counts.Cancelled++;
        });

        pieChartInstance = new Chart(ctxPie, {
            type: 'doughnut',
            data: {
                labels: ["Delivered", "Preparing", "On Route", "Cancelled"],
                datasets: [{
                    data: [counts.Delivered, counts.Preparing, counts.OnRoute, counts.Cancelled],
                    backgroundColor: ["#2ecc71", "#ff9800", "#3498db", "#e74c3c"],
                    borderWidth: 0
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: { color: fontColor }
                    }
                }
            }
        });
    }
}

function renderReportsCharts() {
    const isDark = document.body.classList.contains("dark-theme");
    const gridColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.05)";
    const fontColor = isDark ? "#aaaaaa" : "#666666";

    const ctxRev = document.getElementById("reportsRevenueChart");
    if (ctxRev) {
        if (reportsRevenueChartInstance) reportsRevenueChartInstance.destroy();
        reportsRevenueChartInstance = new Chart(ctxRev, {
            type: 'bar',
            data: {
                labels: ["Jan", "Feb", "Mar", "Apr", "May", "Jun"],
                datasets: [{
                    label: "Monthly Revenue (₹ in Lakhs)",
                    data: [12, 15, 18, 22, 26, 31],
                    backgroundColor: "#ff9800",
                    borderRadius: 6
                }]
            },
            options: {
                responsive: true,
                plugins: { legend: { display: false } },
                scales: {
                    x: { grid: { color: gridColor }, ticks: { color: fontColor } },
                    y: { grid: { color: gridColor }, ticks: { color: fontColor } }
                }
            }
        });
    }

    const ctxStatus = document.getElementById("reportsStatusChart");
    if (ctxStatus) {
        if (reportsStatusChartInstance) reportsStatusChartInstance.destroy();
        
        const counts = { Delivered: 0, Preparing: 0, OnRoute: 0, Cancelled: 0 };
        appState.orders.forEach(o => {
            if (o.status === "Delivered") counts.Delivered++;
            else if (o.status === "Preparing") counts.Preparing++;
            else if (o.status === "On Route") counts.OnRoute++;
            else if (o.status === "Cancelled") counts.Cancelled++;
        });

        reportsStatusChartInstance = new Chart(ctxStatus, {
            type: 'pie',
            data: {
                labels: ["Delivered", "Preparing", "On Route", "Cancelled"],
                datasets: [{
                    data: [counts.Delivered, counts.Preparing, counts.OnRoute, counts.Cancelled],
                    backgroundColor: ["#4caf50", "#ff9800", "#03a9f4", "#f44336"]
                }]
            },
            options: {
                responsive: true,
                plugins: {
                    legend: {
                        position: 'right',
                        labels: { color: fontColor }
                    }
                }
            }
        });
    }
}

// ---------------------------------------------------------
// 8. Exports (CSV & PDF mockups)
// ---------------------------------------------------------
function exportCSV() {
    let csvContent = "data:text/csv;charset=utf-8,";
    csvContent += "Order ID,Customer,Restaurant Name,Amount,Status\n";

    appState.orders.forEach(o => {
        const rest = appState.restaurants.find(r => r.id === o.restaurantId) || { name: "Unknown" };
        csvContent += `${o.id},${o.customer},${rest.name},${o.amount},${o.status}\n`;
    });

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute("download", `quickbite_orders_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    showToast("CSV file exported successfully", "success");
}

function exportPDF() {
    showToast("Generating PDF report file...", "success");
    setTimeout(() => {
        alert("📊 PDF Export Simulation\n\nYour print-ready summary report (QuickBite_Performance_Report.pdf) has been compiled and is ready for download in your browser downloads queue.");
    }, 800);
}

// ---------------------------------------------------------
// 9. Profile & Settings Updates
// ---------------------------------------------------------
function saveSettings(e) {
    e.preventDefault();
    const name = document.getElementById("set-fullname").value;
    const email = document.getElementById("set-email").value;
    const phone = document.getElementById("set-phone").value;
    const avatar = document.getElementById("set-avatar").value;
    const pass = document.getElementById("set-password").value;

    appState.user.fullname = name;
    appState.user.email = email;
    appState.user.phone = phone;
    appState.user.avatar = avatar;

    document.getElementById("settings-username-display").innerText = name;
    const settingsPic = document.querySelector(".settings-profile-card img");
    if (settingsPic) settingsPic.src = avatar;
    
    const topProfile = document.getElementById("profile-img");
    if (topProfile) topProfile.src = avatar;

    // Save session user
    localStorage.setItem("quickbite_active_user", JSON.stringify(appState.user));

    // Update user in users registry
    const users = JSON.parse(localStorage.getItem("quickbite_users")) || [];
    const index = users.findIndex(u => u.email === appState.user.email);
    if (index !== -1) {
        users[index].fullname = name;
        users[index].phone = phone;
        users[index].avatar = avatar;
        if (pass) users[index].password = pass;
        localStorage.setItem("quickbite_users", JSON.stringify(users));
    }

    showToast("Profile settings updated", "success");
    
    // Refresh greeting
    updateClock();
}

const TRANSLATIONS = {
    en: {
        dashboard: "Dashboard",
        restaurants: "Restaurants",
        orders: "Orders",
        routes: "Routes",
        location: "Location",
        agents: "Delivery Agents",
        reports: "Reports",
        settings: "Settings",
        logout: "Logout"
    },
    te: {
        dashboard: "డ్యాష్‌బోర్డ్",
        restaurants: "రెస్టారెంట్లు",
        orders: "ఆర్డర్లు",
        routes: "మార్గదర్శకాలు",
        location: "స్థానం",
        agents: "డెలివరీ ఏజెంట్లు",
        reports: "నివేదికలు",
        settings: "అమరికలు",
        logout: "లాగ్ అవుట్"
    },
    hi: {
        dashboard: "डैशबोर्ड",
        restaurants: "रेस्तरां",
        orders: "आदेश",
        routes: "मार्ग",
        location: "स्थान",
        agents: "वितरण एजेंट",
        reports: "रिपोर्ट",
        settings: "समायोजन",
        logout: "लॉग आउट"
    }
};

function applyLanguageTranslation(lang) {
    const dict = TRANSLATIONS[lang] || TRANSLATIONS.en;
    
    // Translate sidebar items
    const navItems = document.querySelectorAll(".sidebar ul li");
    navItems.forEach(item => {
        const target = item.getAttribute("data-target");
        const span = item.querySelector("span");
        if (span && dict[target]) {
            span.innerText = dict[target];
        }
    });

    // Translate sidebar logo
    const logoSpan = document.querySelector(".sidebar .logo span");
    if (logoSpan) {
        logoSpan.innerText = lang === "te" ? "త్వరిత బైట్" : (lang === "hi" ? "क्विक बाइट" : "Quick Bite");
    }

    // Translate sidebar logout
    const logoutBtn = document.querySelector(".sidebar .logout-btn span");
    if (logoutBtn && dict.logout) {
        logoutBtn.innerText = dict.logout;
    }

    localStorage.setItem("quickbite_language", lang);
}

// ---------------------------------------------------------
// 10. UI Toast Helper
// ---------------------------------------------------------
function showToast(message, type = "success") {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.innerText = (type === "success" ? "✅ " : "⚠️ ") + message;
    toast.className = `toast ${type === "success" ? "success-toast" : "error-toast"}`;
    toast.classList.remove("hidden");

    setTimeout(() => {
        toast.classList.add("hidden");
    }, 3000);
}