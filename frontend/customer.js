/* ==========================================================================
   Quick Bite | Food Delivery Optimizer
   Customer Portal JavaScript: LocalStorage Sync, Cart, and Dijkstra Tracker
   ========================================================================== */

// ---------------------------------------------------------
// 1. Initial Mock Database (in case localStorage is empty)
// ---------------------------------------------------------
const defaultState = {
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
            { id: 1, name: "Pizza Hub 🍔", x: 220, y: 100, type: "restaurant" },
            { id: 2, name: "Transit Hub A 📍", x: 300, y: 250, type: "transit" },
            { id: 3, name: "Transit Hub B 📍", x: 480, y: 120, type: "transit" },
            { id: 4, name: "Customer Vamshi 🏠", x: 600, y: 280, type: "customer" },
            { id: 5, name: "Burger King 🍔", x: 420, y: 340, type: "restaurant" }
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

const restaurantMenus = {
    1: [
        { name: "Pepperoni Special Pizza", price: 450, desc: "Classic pepperoni slices with loaded cheese" },
        { name: "Margherita Pizza", price: 300, desc: "Fresh basil, tomato sauce, mozzarella cheese" },
        { name: "Garlic Bread Sticks", price: 120, desc: "Baked dough sticks brushed with garlic butter" }
    ],
    2: [
        { name: "Double Whopper Burger", price: 250, desc: "Flame-grilled beef patty, lettuce, mayo, pickles" },
        { name: "Crispy Veggie Burger", price: 180, desc: "Crumb-coated potato-veggie patty with special sauce" },
        { name: "Onion Rings Basket", price: 120, desc: "Deep-fried breaded sweet onion rings" }
    ],
    3: [
        { name: "Farmhouse Cheese Burst Pizza", price: 500, desc: "Mushrooms, onions, capsicum, tomatoes, extra cheese" },
        { name: "Peppy Paneer Pizza", price: 420, desc: "Spiced paneer chunks, capsicum, red paprika" },
        { name: "Stuffed Garlic Bread", price: 160, desc: "Garlic bread stuffed with sweet corn and paneer" }
    ],
    4: [
        { name: "Zinger Burger Meal", price: 280, desc: "Crispy chicken zinger burger, fries, and drink" },
        { name: "10 Pcs Chicken Popcorn", price: 180, desc: "Bite-sized tender crispy chicken pieces" },
        { name: "Hot Wings Bucket (6 Pcs)", price: 240, desc: "Spicy breaded chicken wings fried to perfection" }
    ]
};

// ---------------------------------------------------------
// 2. Global State Variables
// ---------------------------------------------------------
let restaurants = [];
let orders = [];
let agents = [];
let cart = [];
let activeRestaurantId = null;
let activeOrder = null;

// Tracking coordinates/path
let shortestPath = [];
let trackingInterval = null;
let databaseSyncInterval = null;

// ---------------------------------------------------------
// 3. Initialization
// ---------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    initDatabase();
    initNavigation();
    renderRestaurants();
    populateAddressNodes();
    
    // Cart triggers
    document.getElementById("btn-toggle-cart").onclick = () => document.getElementById("cart-drawer").classList.remove("hidden");
    document.getElementById("btn-close-cart").onclick = () => document.getElementById("cart-drawer").classList.add("hidden");
    document.getElementById("btn-close-menu").onclick = () => document.getElementById("menu-modal").classList.add("hidden");
    
    document.getElementById("btn-place-order").onclick = placeOrder;

    // Settings triggers
    const profileImg = document.getElementById("customer-profile");
    if (profileImg) profileImg.onclick = openCustomerSettings;
    
    const closeSettings = document.getElementById("btn-close-settings");
    if (closeSettings) closeSettings.onclick = () => document.getElementById("settings-modal").classList.add("hidden");

    const cancelSettings = document.getElementById("btn-cancel-settings");
    if (cancelSettings) cancelSettings.onclick = () => document.getElementById("settings-modal").classList.add("hidden");

    // Start background sync with database to listen for Admin status updates
    startAdminSync();
});

function initDatabase() {
    // Active User
    const activeUser = JSON.parse(localStorage.getItem("quickbite_active_user"));
    if (activeUser) {
        const avatarImg = document.getElementById("customer-profile");
        if (avatarImg) {
            avatarImg.src = activeUser.avatar;
            avatarImg.alt = activeUser.fullname;
        }
    }

    // Restaurants
    if (!localStorage.getItem("quickbite_restaurants")) {
        localStorage.setItem("quickbite_restaurants", JSON.stringify(defaultState.restaurants));
    }
    restaurants = JSON.parse(localStorage.getItem("quickbite_restaurants"));

    // Orders
    if (!localStorage.getItem("quickbite_orders")) {
        localStorage.setItem("quickbite_orders", JSON.stringify(defaultState.orders));
    }
    orders = JSON.parse(localStorage.getItem("quickbite_orders"));

    // Agents
    if (!localStorage.getItem("quickbite_agents")) {
        localStorage.setItem("quickbite_agents", JSON.stringify(defaultState.agents));
    }
    agents = JSON.parse(localStorage.getItem("quickbite_agents"));
}

function initNavigation() {
    const tabs = document.querySelectorAll(".nav-tab");
    tabs.forEach(tab => {
        tab.onclick = (e) => {
            e.preventDefault();
            tabs.forEach(t => t.classList.remove("active"));
            tab.classList.add("active");

            const target = tab.getAttribute("data-target");
            document.querySelectorAll(".portal-view").forEach(v => {
                if (v.id === `view-${target}`) {
                    v.classList.remove("hidden");
                } else {
                    v.classList.add("hidden");
                }
            });

            if (target === "track") {
                drawTrackingMap();
            }
        };
    });
}

// ---------------------------------------------------------
// 4. Cart & Menu Handlers
// ---------------------------------------------------------
function renderRestaurants() {
    const container = document.getElementById("restaurant-container");
    container.innerHTML = "";

    const searchVal = document.getElementById("restaurant-search").value.toLowerCase();
    const filtered = restaurants.filter(r => r.name.toLowerCase().includes(searchVal));

    filtered.forEach(r => {
        container.innerHTML += `
            <div class="restaurant-card" onclick="openMenu(${r.id})">
                <img src="${r.image}" alt="${r.name}">
                <div class="restaurant-body">
                    <h3>${r.name}</h3>
                    <p><i class="fa-solid fa-location-dot"></i> Address: ${r.address}</p>
                    <div class="rating-pill">⭐ ${r.rating}</div>
                </div>
            </div>
        `;
    });

    document.getElementById("restaurant-search").onkeyup = renderRestaurants;
}

function openMenu(restId) {
    const rest = restaurants.find(r => r.id === restId);
    if (!rest) return;

    activeRestaurantId = restId;
    document.getElementById("menu-restaurant-name").innerText = `${rest.name} Menu`;
    
    const container = document.getElementById("menu-items-container");
    container.innerHTML = "";

    const menu = restaurantMenus[restId] || restaurantMenus[1]; // fallback

    menu.forEach((item, idx) => {
        container.innerHTML += `
            <div class="menu-item-card">
                <div class="menu-item-info">
                    <h4>${item.name}</h4>
                    <p>${item.desc}</p>
                    <strong>₹${item.price}</strong>
                </div>
                <button class="btn btn-primary btn-sm" onclick="addToCart('${item.name}', ${item.price})">
                    <i class="fa-solid fa-plus"></i> Add
                </button>
            </div>
        `;
    });

    document.getElementById("menu-modal").classList.remove("hidden");
}

function addToCart(name, price) {
    cart.push({ name, price });
    updateCartUI();
    showToast(`${name} added to cart`, "success");
}

function removeFromCart(idx) {
    const name = cart[idx].name;
    cart.splice(idx, 1);
    updateCartUI();
    showToast(`${name} removed from cart`, "error");
}

function updateCartUI() {
    // Item count badge
    document.getElementById("cart-item-count").innerText = cart.length;

    // Items list
    const container = document.getElementById("cart-items-container");
    container.innerHTML = "";

    let total = 0;
    cart.forEach((item, idx) => {
        total += item.price;
        container.innerHTML += `
            <div class="cart-item">
                <div class="cart-item-details">
                    <h4>${item.name}</h4>
                    <p>₹${item.price}</p>
                </div>
                <span class="cart-item-remove" onclick="removeFromCart(${idx})"><i class="fa-solid fa-trash-can"></i></span>
            </div>
        `;
    });

    // Total label
    document.getElementById("lbl-cart-total").innerText = `₹${total}`;
}

function populateAddressNodes() {
    const select = document.getElementById("address-node-select");
    if (!select) return;

    select.innerHTML = "";
    // Only customer and transit nodes as destination options
    const dests = defaultState.graph.nodes.filter(n => n.type === "customer" || n.type === "transit");
    dests.forEach(node => {
        select.innerHTML += `<option value="${node.id}">${node.name} (Node ${node.id})</option>`;
    });
}

// ---------------------------------------------------------
// 5. Checkout & Ordering Operations
// ---------------------------------------------------------
function placeOrder() {
    if (cart.length === 0) {
        showToast("Your basket is empty", "error");
        return;
    }

    const rest = restaurants.find(r => r.id === activeRestaurantId);
    const destNodeId = parseInt(document.getElementById("address-node-select").value);
    const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);

    // Node details mapping
    const customerName = document.getElementById("customer-profile").alt;
    const orderId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1001;

    // Build Dijkstra route
    const restNodeId = activeRestaurantId === 1 ? 1 : 5; // Node 1 (Pizza Hub) or Node 5 (Burger King)
    const routeInfo = runDijkstraPath(restNodeId, destNodeId);

    const newOrder = {
        id: orderId,
        customer: "Vamshi", // current active user name
        restaurantId: activeRestaurantId,
        amount: totalAmount,
        status: "Preparing",
        eta: `${Math.round(routeInfo.dist * 1.8)} min`
    };

    // Save order in localStorage (Shared Database)
    orders.push(newOrder);
    localStorage.setItem("quickbite_orders", JSON.stringify(orders));

    // Clear Cart
    cart = [];
    updateCartUI();
    document.getElementById("cart-drawer").classList.add("hidden");
    document.getElementById("menu-modal").classList.add("hidden");

    activeOrder = newOrder;

    // Transition to tracking tab
    document.querySelector("[data-target='track']").click();

    // Populate Tracking Card info
    document.getElementById("active-order-details").classList.remove("hidden");
    document.getElementById("no-active-order-msg").classList.add("hidden");

    document.getElementById("lbl-order-id").innerText = `#${orderId}`;
    document.getElementById("lbl-order-status").innerText = "Preparing";
    document.getElementById("lbl-order-status").className = "status-pill status-preparing";
    document.getElementById("lbl-route-dist").innerText = `${routeInfo.dist} km`;
    document.getElementById("lbl-route-eta").innerText = `${Math.round(routeInfo.dist * 1.8)} Min`;
    document.getElementById("lbl-route-origin").innerText = rest.name;
    document.getElementById("lbl-route-dest").innerText = defaultState.graph.nodes.find(n => n.id === destNodeId).name;

    // Start Live tracking animation
    startLiveTracking(restNodeId, destNodeId, routeInfo);
}

// ---------------------------------------------------------
// 6. Dijkstra Finder Code
// ---------------------------------------------------------
function runDijkstraPath(srcId, tgtId) {
    const V = defaultState.graph.nodes.length;
    const dist = {};
    const prev = {};
    const unvisited = new Set();

    defaultState.graph.nodes.forEach(n => {
        dist[n.id] = Infinity;
        prev[n.id] = null;
        unvisited.add(n.id);
    });
    dist[srcId] = 0;

    while (unvisited.size > 0) {
        let u = null;
        let minDist = Infinity;
        unvisited.forEach(nodeId => {
            if (dist[nodeId] < minDist) {
                minDist = dist[nodeId];
                u = nodeId;
            }
        });

        if (u === null) break;
        if (u === tgtId) break;

        unvisited.delete(u);

        defaultState.graph.edges.forEach(edge => {
            let v = null;
            if (edge.u === u && unvisited.has(edge.v)) v = edge.v;
            else if (edge.v === u && unvisited.has(edge.u)) v = edge.u;

            if (v !== null) {
                const alt = dist[u] + edge.weight;
                if (alt < dist[v]) {
                    dist[v] = alt;
                    prev[v] = u;
                }
            }
        });
    }

    const path = [];
    let curr = tgtId;
    if (prev[curr] !== null || curr === srcId) {
        while (curr !== null) {
            path.unshift(curr);
            curr = prev[curr];
        }
    }

    return { path, dist: dist[tgtId] };
}

// ---------------------------------------------------------
// 7. Dynamic Tracker & Map Animation
// ---------------------------------------------------------
let trCanvas, trCtx;

function drawTrackingMap(agentPos = null) {
    trCanvas = document.getElementById("customerTrackingCanvas");
    if (!trCanvas) return;
    trCtx = trCanvas.getContext("2d");

    trCtx.clearRect(0, 0, trCanvas.width, trCanvas.height);

    // Draw Map grid streets
    trCtx.strokeStyle = "#e2e8f0";
    trCtx.lineWidth = 14;
    for (let i = 40; i < trCanvas.width; i += 60) {
        trCtx.beginPath();
        trCtx.moveTo(i, 0);
        trCtx.lineTo(i, trCanvas.height);
        trCtx.stroke();
    }
    for (let j = 40; j < trCanvas.height; j += 60) {
        trCtx.beginPath();
        trCtx.moveTo(0, j);
        trCtx.lineTo(trCanvas.width, j);
        trCtx.stroke();
    }

    // Draw active pathways (edges)
    defaultState.graph.edges.forEach(edge => {
        const u = defaultState.graph.nodes.find(n => n.id === edge.u);
        const v = defaultState.graph.nodes.find(n => n.id === edge.v);
        if (!u || !v) return;

        trCtx.beginPath();
        trCtx.moveTo(u.x, u.y);
        trCtx.lineTo(v.x, v.y);
        trCtx.strokeStyle = "rgba(203, 213, 225, 0.4)";
        trCtx.lineWidth = 4;
        trCtx.stroke();
    });

    // Draw Restaurant and Customer Destination Nodes
    if (activeOrder) {
        const restNodeId = activeRestaurantId === 1 ? 1 : 5;
        const destNodeId = parseInt(document.getElementById("address-node-select").value);
        
        const rNode = defaultState.graph.nodes.find(n => n.id === restNodeId);
        const cNode = defaultState.graph.nodes.find(n => n.id === destNodeId);

        // Restaurant
        trCtx.beginPath();
        trCtx.arc(rNode.x, rNode.y, 16, 0, 2*Math.PI);
        trCtx.fillStyle = "#ef4444";
        trCtx.fill();
        trCtx.fillStyle = "white";
        trCtx.font = "12px Poppins";
        trCtx.textAlign = "center";
        trCtx.fillText("🍔", rNode.x, rNode.y + 4);

        // Customer Destination
        trCtx.beginPath();
        trCtx.arc(cNode.x, cNode.y, 16, 0, 2*Math.PI);
        trCtx.fillStyle = "#10b981";
        trCtx.fill();
        trCtx.fillStyle = "white";
        trCtx.fillText("🏠", cNode.x, cNode.y + 4);

        // Draw Agent Pos
        const pos = agentPos || { x: rNode.x, y: rNode.y };
        trCtx.beginPath();
        trCtx.arc(pos.x, pos.y, 18, 0, 2*Math.PI);
        trCtx.fillStyle = "#3b82f6";
        trCtx.strokeStyle = "white";
        trCtx.lineWidth = 2;
        trCtx.fill();
        trCtx.stroke();
        trCtx.fillStyle = "white";
        trCtx.fillText("🛵", pos.x, pos.y + 4);
    } else {
        // Just draw empty nodes
        defaultState.graph.nodes.forEach(node => {
            trCtx.beginPath();
            trCtx.arc(node.x, node.y, 16, 0, 2*Math.PI);
            trCtx.fillStyle = "#cbd5e1";
            trCtx.fill();
            trCtx.fillStyle = "white";
            trCtx.font = "10px Poppins";
            trCtx.textAlign = "center";
            trCtx.fillText(node.id, node.x, node.y + 4);
        });
    }
}

function startLiveTracking(srcId, tgtId, routeInfo) {
    if (trackingInterval) clearInterval(trackingInterval);

    const feed = document.getElementById("customer-feed-list");
    feed.innerHTML = "";

    const addFeedItem = (text) => {
        feed.innerHTML = `<div class="feed-item"><span class="time">${new Date().toLocaleTimeString()}</span><span class="text">${text}</span></div>` + feed.innerHTML;
    };

    addFeedItem("✅ Order successfully routed in cloud server database.");
    addFeedItem("👨‍🍳 Kitchen has received order and is preparing items...");

    let interpolationPoints = [];
    const path = routeInfo.path;
    
    for (let i = 0; i < path.length - 1; i++) {
        const u = defaultState.graph.nodes.find(n => n.id === path[i]);
        const v = defaultState.graph.nodes.find(n => n.id === path[i+1]);
        if (!u || !v) continue;

        const steps = 40;
        for (let s = 0; s <= steps; s++) {
            const r = s / steps;
            interpolationPoints.push({
                x: u.x + (v.x - u.x) * r,
                y: u.y + (v.y - u.y) * r,
                targetName: v.name
            });
        }
    }

    let currentFrame = 0;

    // Simulate preparation time before agent starts moving
    setTimeout(() => {
        if (!activeOrder || activeOrder.status === "Cancelled") return;
        addFeedItem("🛵 Rider Rahul Kumar picked up your packet. En route!");
        document.getElementById("lbl-order-status").innerText = "On Route";
        document.getElementById("lbl-order-status").className = "status-pill status-on-route";

        trackingInterval = setInterval(() => {
            if (currentFrame >= interpolationPoints.length) {
                clearInterval(trackingInterval);
                document.getElementById("lbl-order-status").innerText = "Delivered";
                document.getElementById("lbl-order-status").className = "status-pill status-delivered";
                addFeedItem("🎉 Order Delivered successfully! Thank you for choosing Quick Bite.");
                
                // Update active state in localStorage
                updateOrderStatus(activeOrder.id, "Delivered");
                return;
            }

            const currentPos = interpolationPoints[currentFrame];
            drawTrackingMap(currentPos);

            if (currentFrame === Math.floor(interpolationPoints.length / 2)) {
                addFeedItem("🛵 Scooter traversing shortest transit path at " + currentPos.targetName.split(" ")[0]);
            }
            if (currentFrame === Math.floor(interpolationPoints.length * 3 / 4)) {
                addFeedItem("📍 Rider is approaching your block node!");
            }

            currentFrame++;
        }, 100);

    }, 4000); // 4 seconds kitchen preparation time
}

// ---------------------------------------------------------
// 8. Dynamic localStorage Database Sync
// ---------------------------------------------------------
function startAdminSync() {
    if (databaseSyncInterval) clearInterval(databaseSyncInterval);

    databaseSyncInterval = setInterval(() => {
        if (!activeOrder) return;

        // Pull orders from database again to check status
        const currentOrders = JSON.parse(localStorage.getItem("quickbite_orders")) || [];
        const dbOrder = currentOrders.find(o => o.id === activeOrder.id);
        
        if (dbOrder && dbOrder.status !== activeOrder.status) {
            // Admin modified order status
            activeOrder.status = dbOrder.status;
            document.getElementById("lbl-order-status").innerText = dbOrder.status;

            const feed = document.getElementById("customer-feed-list");
            const timeStr = new Date().toLocaleTimeString();

            if (dbOrder.status === "On Route") {
                document.getElementById("lbl-order-status").className = "status-pill status-on-route";
                feed.innerHTML = `<div class="feed-item"><span class="time">${timeStr}</span><span class="text">🚚 Admin dispatched rider! Status: On Route</span></div>` + feed.innerHTML;
            }
            if (dbOrder.status === "Cancelled") {
                document.getElementById("lbl-order-status").className = "status-pill status-cancelled";
                feed.innerHTML = `<div class="feed-item" style="color: var(--red-color);"><span class="time">${timeStr}</span><span class="text">❌ Order cancelled by Admin Portal.</span></div>` + feed.innerHTML;
                clearInterval(trackingInterval);
                drawTrackingMap();
            }
            if (dbOrder.status === "Delivered") {
                document.getElementById("lbl-order-status").className = "status-pill status-delivered";
                feed.innerHTML = `<div class="feed-item"><span class="time">${timeStr}</span><span class="text">🎉 Order delivery completed by Admin check.</span></div>` + feed.innerHTML;
                clearInterval(trackingInterval);
                drawTrackingMap(defaultState.graph.nodes.find(n => n.id === parseInt(document.getElementById("address-node-select").value)));
            }
        }
    }, 2000); // poll database status changes every 2 seconds
}

function updateOrderStatus(orderId, status) {
    const currentOrders = JSON.parse(localStorage.getItem("quickbite_orders")) || [];
    const index = currentOrders.findIndex(o => o.id === orderId);
    if (index !== -1) {
        currentOrders[index].status = status;
        currentOrders[index].eta = "Delivered";
        localStorage.setItem("quickbite_orders", JSON.stringify(currentOrders));
    }
}

// ---------------------------------------------------------
// 9. UI Toast Alerts
// ---------------------------------------------------------
function showToast(msg, type = "success") {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.innerText = msg;
    toast.className = `toast ${type === "success" ? "success-toast" : "error-toast"}`;
    toast.classList.remove("hidden");

    setTimeout(() => toast.classList.add("hidden"), 3000);
}

function openCustomerSettings() {
    const activeUser = JSON.parse(localStorage.getItem("quickbite_active_user"));
    if (!activeUser) return;

    document.getElementById("cust-set-name").value = activeUser.fullname;
    document.getElementById("cust-set-email").value = activeUser.email;
    document.getElementById("cust-set-phone").value = activeUser.phone;
    document.getElementById("cust-set-avatar").value = activeUser.avatar || '';
    document.getElementById("cust-set-password").value = '';

    document.getElementById("settings-modal").classList.remove("hidden");
}

function saveCustomerSettings(e) {
    e.preventDefault();
    const activeUser = JSON.parse(localStorage.getItem("quickbite_active_user"));
    if (!activeUser) return;

    const name = document.getElementById("cust-set-name").value;
    const phone = document.getElementById("cust-set-phone").value;
    const avatar = document.getElementById("cust-set-avatar").value;
    const pass = document.getElementById("cust-set-password").value;

    activeUser.fullname = name;
    activeUser.phone = phone;
    activeUser.avatar = avatar;

    localStorage.setItem("quickbite_active_user", JSON.stringify(activeUser));

    // Update avatar image in UI
    const avatarImg = document.getElementById("customer-profile");
    if (avatarImg) {
        avatarImg.src = avatar;
        avatarImg.alt = name;
    }

    // Update in users registry
    const users = JSON.parse(localStorage.getItem("quickbite_users")) || [];
    const index = users.findIndex(u => u.email === activeUser.email);
    if (index !== -1) {
        users[index].fullname = name;
        users[index].phone = phone;
        users[index].avatar = avatar;
        if (pass) users[index].password = pass;
        localStorage.setItem("quickbite_users", JSON.stringify(users));
    }

    document.getElementById("settings-modal").classList.add("hidden");
    showToast("Profile settings updated successfully", "success");
}

function confirmLogout() {
    if (confirm("Are you sure you want to log out from the Customer Portal?")) {
        window.location.href = "login.html";
    }
}


