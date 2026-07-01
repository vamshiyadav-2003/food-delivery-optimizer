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

// restaurantMenus is now loaded dynamically from localStorage (set by admin dashboard)
let restaurantMenus = {};

function loadMenus() {
    const raw = localStorage.getItem("quickbite_menus");
    if (raw) {
        const items = JSON.parse(raw);
        let needsMigration = false;
        // Group items by restaurantId
        restaurantMenus = {};
        items.forEach(item => {
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
            if (!restaurantMenus[item.restaurantId]) restaurantMenus[item.restaurantId] = [];
            restaurantMenus[item.restaurantId].push({ 
                name: item.name, 
                price: item.price, 
                desc: item.desc || "", 
                isVeg: item.isVeg,
                image: item.image || "",
                discount: item.discount || 0,
                isBestSeller: !!item.isBestSeller
            });
        });
        if (needsMigration) {
            localStorage.setItem("quickbite_menus", JSON.stringify(items));
        }
    } else {
        // Seed defaults (mirrors dashboard.js defaults)
        restaurantMenus = {
            1: [
                { name: "Pepperoni Special Pizza", price: 450, desc: "Classic pepperoni slices with loaded cheese", isVeg: false },
                { name: "Margherita Pizza", price: 300, desc: "Fresh basil, tomato sauce, mozzarella cheese", isVeg: true },
                { name: "Garlic Bread Sticks", price: 120, desc: "Baked dough sticks brushed with garlic butter", isVeg: true }
            ],
            2: [
                { name: "Double Whopper Burger", price: 250, desc: "Flame-grilled beef patty, lettuce, mayo, pickles", isVeg: false },
                { name: "Crispy Veggie Burger", price: 180, desc: "Crumb-coated potato-veggie patty with special sauce", isVeg: true },
                { name: "Onion Rings Basket", price: 120, desc: "Deep-fried breaded sweet onion rings", isVeg: true }
            ],
            3: [
                { name: "Farmhouse Cheese Burst Pizza", price: 500, desc: "Mushrooms, onions, capsicum, tomatoes, extra cheese", isVeg: true },
                { name: "Peppy Paneer Pizza", price: 420, desc: "Spiced paneer chunks, capsicum, red paprika", isVeg: true },
                { name: "Stuffed Garlic Bread", price: 160, desc: "Garlic bread stuffed with sweet corn and paneer", isVeg: true }
            ],
            4: [
                { name: "Zinger Burger Meal", price: 280, desc: "Crispy chicken zinger burger, fries, and drink", isVeg: false },
                { name: "10 Pcs Chicken Popcorn", price: 180, desc: "Bite-sized tender crispy chicken pieces", isVeg: false },
                { name: "Hot Wings Bucket (6 Pcs)", price: 240, desc: "Spicy breaded chicken wings fried to perfection", isVeg: false }
            ]
        };
    }
}

// ---------------------------------------------------------
// 2. Global State Variables
// ---------------------------------------------------------
let restaurants = [];
let orders = [];
let agents = [];
let cart = [];
let activeRestaurantId = null;
let activeOrder = null;
let gpsLocation = null;
let currentPaymentMethod = 'pod';

// Tracking coordinates/path
let shortestPath = [];
let trackingInterval = null;
let databaseSyncInterval = null;
let lastMenusSnapshot = null; // tracks last seen quickbite_menus string

// Leaflet Map Globals
let leafletMap = null;
let leafletMarkers = { nodes: [], edges: [] };
let leafletRouteLine = null;
let agentMarker = null;
let restaurantMarker = null;
let customerMarker = null;
let activeRoutePath = [];

// Stored real addresses for this order
let customDestCoord = null;     // customer's exact typed address → geocoded or snapped to nearest
let customDestText  = "";       // display text of customer address
let restaurantCoord = null;     // restaurant's real lat/lng
let restaurantText  = "";       // restaurant address text

// Geographically accurate coordinates in Telangana/Hyderabad
let nodeCoords = {
    0: [17.4483, 78.3915], // Agent Hub - Hitech City
    1: [17.4374, 78.4482], // Restaurant Zone A - Ameerpet
    2: [17.4116, 78.4312], // Transit Hub A - Banjara Hills
    3: [17.4062, 78.4682], // Transit Hub B - Himayatnagar
    4: [17.3833, 78.4012], // Customer Drop - Mehdipatnam
    5: [17.3616, 78.4747]  // Restaurant Zone B - Charminar
};

// ---------------------------------------------------------
// 3. Initialization
// ---------------------------------------------------------
document.addEventListener("DOMContentLoaded", () => {
    loadMenus();
    initDatabase();
    initNavigation();
    renderRestaurants();
    populateAddressNodes();
    
    // Cart triggers
    document.getElementById("btn-toggle-cart").onclick = () => document.getElementById("cart-drawer").classList.remove("hidden");
    document.getElementById("btn-close-cart").onclick = () => document.getElementById("cart-drawer").classList.add("hidden");
    document.getElementById("btn-close-menu").onclick = () => document.getElementById("menu-modal").classList.add("hidden");

    const closeMenuX = document.getElementById("btn-close-menu-x");
    if (closeMenuX) closeMenuX.onclick = () => document.getElementById("menu-modal").classList.add("hidden");
    
    document.getElementById("btn-place-order").onclick = placeOrder;

    // GPS location detection trigger
    const detectLocBtn = document.getElementById("btn-detect-location");
    if (detectLocBtn) {
        detectLocBtn.onclick = () => {
            if (navigator.geolocation) {
                showToast("Detecting GPS coordinates...", "success");
                navigator.geolocation.getCurrentPosition(
                    async (position) => {
                        const lat = position.coords.latitude;
                        const lng = position.coords.longitude;
                        gpsLocation = [lat, lng];
                        
                        document.getElementById("lbl-gps-coords").innerText = `${lat.toFixed(4)}, ${lng.toFixed(4)}`;
                        document.getElementById("gps-coords-indicator").style.display = "flex";
                        
                        // Reverse geocode to text address input
                        try {
                            const response = await fetch(`https://nominatim.openstreetmap.org/reverse?format=json&lat=${lat}&lon=${lng}`);
                            const data = await response.json();
                            if (data && data.display_name) {
                                document.getElementById("customer-address-input").value = data.display_name;
                            } else {
                                document.getElementById("customer-address-input").value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                            }
                        } catch (err) {
                            document.getElementById("customer-address-input").value = `${lat.toFixed(6)}, ${lng.toFixed(6)}`;
                        }
                        showToast("GPS Location detected!", "success");
                    },
                    (error) => {
                        showToast("Could not retrieve GPS location. Please type address manually.", "error");
                    }
                );
            } else {
                showToast("Geolocation is not supported by your browser.", "error");
            }
        };
    }

    // Reset GPS coordinates if the user starts typing manually
    const addressInput = document.getElementById("customer-address-input");
    if (addressInput) {
        addressInput.oninput = () => {
            gpsLocation = null;
            const gpsInd = document.getElementById("gps-coords-indicator");
            if (gpsInd) gpsInd.style.display = "none";
        };
    }

    // Format credit card number as they type (adding space every 4 digits)
    const cardNumInput = document.getElementById("pay-card-num");
    if (cardNumInput) {
        cardNumInput.oninput = function(e) {
            let val = e.target.value.replace(/\s+/g, '').replace(/[^0-9]/gi, '');
            let matches = val.match(/\d{4,16}/g);
            let match = matches && matches[0] || '';
            let parts = [];
            for (let i=0, len=match.length; i<len; i+=4) {
                parts.push(match.substring(i, i+4));
            }
            if (parts.length > 0) {
                e.target.value = parts.join(' ');
            } else {
                e.target.value = val;
            }
        };
    }

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
            avatarImg.onclick = openCustomerSettings; // Register click handler on initialization too
        }
        // Set Pay Later Phone Number in Cart Drawer if element exists
        const plPhone = document.getElementById("paylater-phone");
        if (plPhone) plPhone.innerText = activeUser.phone || "9876543210";
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
                setTimeout(() => {
                    initLeafletMap();
                    if (leafletMap) leafletMap.invalidateSize();
                    drawTrackingMap();
                }, 100);
            }
        };
    });
}

function initLeafletMap() {
    if (leafletMap) return;
    
    leafletMap = L.map('deliveryMap').setView([17.4116, 78.4312], 12);
    
    L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; OpenStreetMap contributors'
    }).addTo(leafletMap);
    
    drawLeafletNodes();
    
    // Map click sets custom customer drop location
    leafletMap.on('click', function(e) {
        const lat = e.latlng.lat;
        const lng = e.latlng.lng;
        
        nodeCoords[4] = [lat, lng];
        drawLeafletNodes();
        
        const select = document.getElementById("address-node-select");
        if (select) {
            select.value = "4"; // Set to Customer Drop (Node 4)
        }
        showToast("Address location updated on Telangana Map!", "success");
    });
}

function drawLeafletNodes() {
    // Clear old markers/lines
    if (leafletMarkers.nodes) {
        leafletMarkers.nodes.forEach(m => leafletMap.removeLayer(m));
    }
    if (leafletMarkers.edges) {
        leafletMarkers.edges.forEach(l => leafletMap.removeLayer(l));
    }
    leafletMarkers.nodes = [];
    leafletMarkers.edges = [];
    
    // Draw edges
    defaultState.graph.edges.forEach(edge => {
        const uCoord = nodeCoords[edge.u];
        const vCoord = nodeCoords[edge.v];
        if (uCoord && vCoord) {
            const polyline = L.polyline([uCoord, vCoord], {
                color: '#cbd5e1',
                weight: 3,
                opacity: 0.6,
                dashArray: '5, 8'
            }).addTo(leafletMap);
            leafletMarkers.edges.push(polyline);
        }
    });
    
    // Draw nodes
    defaultState.graph.nodes.forEach(node => {
        const coord = nodeCoords[node.id];
        if (!coord) return;
        
        let iconHtml = '';
        let color = '#94a3b8';
        
        if (node.type === 'restaurant') {
            iconHtml = '🍔';
            color = '#ef4444';
        } else if (node.type === 'customer') {
            iconHtml = '🏠';
            color = '#10b981';
        } else if (node.type === 'agent') {
            iconHtml = '🛵';
            color = '#3b82f6';
        } else {
            iconHtml = '📍';
            color = '#64748b';
        }
        
        const customIcon = L.divIcon({
            html: `<div style="background:${color}; width:30px; height:30px; border-radius:50%; display:flex; align-items:center; justify-content:center; border:2px solid white; box-shadow:0 2px 8px rgba(0,0,0,0.15); font-size:14px; cursor:pointer;">${iconHtml}</div>`,
            className: 'custom-leaflet-icon',
            iconSize: [30, 30],
            iconAnchor: [15, 15]
        });
        
        const marker = L.marker(coord, { icon: customIcon })
            .bindPopup(`<b>${node.name}</b><br>Zone type: ${node.type}`)
            .addTo(leafletMap);
            
        leafletMarkers.nodes.push(marker);
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
                    <h3 style="
                        font-family: 'Nunito Sans', Poppins, sans-serif;
                        font-size: 20px;
                        font-weight: 900;
                        letter-spacing: -0.4px;
                        margin-bottom: 6px;
                        background: linear-gradient(135deg, #ff5722 0%, #e91e63 55%, #7c3aed 100%);
                        -webkit-background-clip: text;
                        -webkit-text-fill-color: transparent;
                        background-clip: text;
                    ">${r.name}</h3>
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

    // Style the modal header title
    const titleEl = document.getElementById("menu-restaurant-name");
    titleEl.innerText = `${rest.name} Menu`;
    Object.assign(titleEl.style, {
        fontFamily: "'Nunito Sans', Poppins, sans-serif",
        fontSize: "20px",
        fontWeight: "900",
        color: "#ffffff",
        webkitTextFillColor: "#ffffff",
        background: "none",
        flex: "1",
        letterSpacing: "-0.3px"
    });

    // Style the modal header box itself
    const modalHeader = document.querySelector(".menu-modal-header");
    if (modalHeader) {
        Object.assign(modalHeader.style, {
            background: "linear-gradient(135deg, #ff5722 0%, #e91e63 50%, #7c3aed 100%)",
            padding: "20px 24px",
            display: "flex",
            alignItems: "center",
            gap: "12px"
        });
    }

    // Style the modal box
    const modalBox = document.querySelector(".menu-modal-box");
    if (modalBox) {
        Object.assign(modalBox.style, {
            borderRadius: "22px",
            overflow: "hidden",
            padding: "0",
            border: "none",
            boxShadow: "0 25px 60px rgba(0,0,0,0.25)"
        });
    }

    const container = document.getElementById("menu-items-container");
    Object.assign(container.style, {
        background: "#f8fafc",
        padding: "20px 22px",
        display: "flex",
        flexDirection: "column",
        gap: "14px",
        overflowY: "auto"
    });
    container.innerHTML = "";

    const menu = restaurantMenus[restId];

    if (!menu || menu.length === 0) {
        container.innerHTML = `<p style="color:#64748b; padding:30px 0; text-align:center;">No menu items yet for this restaurant.</p>`;
    } else {
        const vegItems = menu.filter(item => item.isVeg);
        const nonVegItems = menu.filter(item => !item.isVeg);

        const renderItemCard = (item) => {
            const indicatorColor = item.isVeg ? "#16a34a" : "#dc2626";
            const vegDot = item.isVeg
                ? `<span style="display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border:2px solid #16a34a;border-radius:3px;margin-right:8px;vertical-align:middle;flex-shrink:0;"><span style="width:7px;height:7px;border-radius:50%;background:#16a34a;"></span></span>`
                : `<span style="display:inline-flex;align-items:center;justify-content:center;width:15px;height:15px;border:2px solid #dc2626;border-radius:3px;margin-right:8px;vertical-align:middle;flex-shrink:0;"><span style="width:7px;height:7px;border-radius:50%;background:#dc2626;"></span></span>`;

            // Calculate discounts
            const hasDiscount = item.discount && parseInt(item.discount) > 0;
            const discountVal = hasDiscount ? parseInt(item.discount) : 0;
            const finalPrice = hasDiscount ? Math.round(item.price * (1 - discountVal / 100)) : item.price;

            const priceLabelHtml = hasDiscount
                ? `<strong style="font-family:'Nunito Sans',Poppins,sans-serif; font-size:15px; font-weight:900; color:#1e1b4b; margin-top:6px; display:inline-block;">
                       ₹${finalPrice}
                       <span style="text-decoration:line-through; font-size:12px; color:#94a3b8; font-weight:500; margin-left:6px;">₹${item.price}</span>
                       <span style="background:#fee2e2; color:#ef4444; font-size:10px; font-weight:800; border-radius:6px; padding:2px 6px; margin-left:6px; vertical-align:middle; display:inline-block;">${discountVal}% OFF</span>
                   </strong>`
                : `<strong style="font-family:'Nunito Sans',Poppins,sans-serif; font-size:15px; font-weight:900; background:linear-gradient(90deg, #ff5722, #e91e63); -webkit-background-clip:text; -webkit-text-fill-color:transparent; background-clip:text; display:inline-block; margin-top:6px;">₹${item.price}</strong>`;

            // Best seller badge
            const bestSellerBadge = item.isBestSeller
                ? `<span style="background:linear-gradient(135deg, #f59e0b, #d97706); color:white; border-radius:6px; padding:2px 6px; font-size:9px; font-weight:800; text-transform:uppercase; margin-left:8px; display:inline-flex; align-items:center; gap:2px; vertical-align:middle;"><i class="fa-solid fa-star"></i> Best Seller</span>`
                : ``;

            // Image tag
            const imgHtml = item.image
                ? `<img src="${item.image}" style="width:65px; height:65px; object-fit:cover; border-radius:10px; flex-shrink:0; border:1px solid #e2e8f0; margin-right:12px;" onerror="this.src='https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=100'"/>`
                : `<div style="width:65px; height:65px; border-radius:10px; background:#f1f5f9; flex-shrink:0; border:1px dashed #cbd5e1; margin-right:12px; display:flex; align-items:center; justify-content:center; color:#94a3b8; font-size:20px;"><i class="fa-solid fa-utensils"></i></div>`;

            return `
                <div class="menu-item-card" style="
                    display: flex;
                    justify-content: space-between;
                    align-items: center;
                    background: #ffffff;
                    border: 1px solid #e8eaf0;
                    border-left: 4px solid ${indicatorColor};
                    border-radius: 14px;
                    padding: 12px 16px;
                    box-shadow: 0 2px 10px rgba(0,0,0,0.05);
                    transition: transform 0.2s, box-shadow 0.2s;
                ">
                    <div style="display:flex; align-items:center; flex:1;">
                        ${imgHtml}
                        <div class="menu-item-info">
                            <h4 style="
                                font-family: 'Nunito Sans', Poppins, sans-serif;
                                font-size: 15px;
                                font-weight: 800;
                                color: #1e1b4b;
                                margin: 0;
                                display: flex;
                                align-items: center;
                                flex-wrap: wrap;
                                gap: 4px;
                            ">
                                <span style="display:inline-flex; align-items:center;">${vegDot}${item.name}</span>
                                ${bestSellerBadge}
                            </h4>
                            <p style="font-size:12px; color:#64748b; margin:4px 0 0 0; max-width:280px; line-height:1.3;">${item.desc}</p>
                            ${priceLabelHtml}
                        </div>
                    </div>
                    <button onclick="addToCart('${item.name.replace(/'/g, "\\'")}', ${finalPrice})" style="
                        background: linear-gradient(135deg, #ff5722, #e91e63);
                        border: none;
                        border-radius: 10px;
                        padding: 9px 18px;
                        font-family: 'Nunito Sans', Poppins, sans-serif;
                        font-weight: 700;
                        font-size: 13px;
                        color: white;
                        cursor: pointer;
                        white-space: nowrap;
                        flex-shrink: 0;
                        box-shadow: 0 4px 12px rgba(255,87,34,0.3);
                        transition: opacity 0.2s;
                        display: flex;
                        align-items: center;
                        gap: 6px;
                    ">
                        <i class="fa-solid fa-plus"></i> Add
                    </button>
                </div>
            `;
        };

        // Render Veg Section
        if (vegItems.length > 0) {
            container.innerHTML += `
                <div style="margin: 10px 0 5px 0; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 13px; font-weight: 800; color: #16a34a; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Nunito Sans', sans-serif;">🟢 Vegetarian Specials</span>
                    <span style="flex: 1; height: 1px; background: #e2e8f0;"></span>
                </div>
            `;
            vegItems.forEach(item => {
                container.innerHTML += renderItemCard(item);
            });
        }

        // Render Non-Veg Section
        if (nonVegItems.length > 0) {
            container.innerHTML += `
                <div style="margin: 20px 0 5px 0; display: flex; align-items: center; gap: 8px;">
                    <span style="font-size: 13px; font-weight: 800; color: #dc2626; text-transform: uppercase; letter-spacing: 0.5px; font-family: 'Nunito Sans', sans-serif;">🔴 Non-Vegetarian Delights</span>
                    <span style="flex: 1; height: 1px; background: #e2e8f0;"></span>
                </div>
            `;
            nonVegItems.forEach(item => {
                container.innerHTML += renderItemCard(item);
            });
        }
    }

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
    // Keep the hidden select populated for Dijkstra routing compatibility
    const select = document.getElementById("address-node-select");
    if (!select) return;
    select.innerHTML = "";
    const dests = defaultState.graph.nodes.filter(n => n.type === "customer" || n.type === "transit");
    dests.forEach(node => {
        select.innerHTML += `<option value="${node.id}">${node.name}</option>`;
    });
}

// ---------------------------------------------------------
// 5. Checkout & Ordering Operations
// ---------------------------------------------------------
// Payment selection handler
function selectPaymentMethod(method) {
    currentPaymentMethod = method;
    document.querySelectorAll(".pay-card").forEach(card => {
        if (card.getAttribute("data-method") === method) {
            card.classList.add("active");
            card.style.border = "2px solid #ff5722";
            card.style.background = "#fff5f2";
        } else {
            card.classList.remove("active");
            card.style.border = "1.5px solid #e2e8f0";
            card.style.background = "none";
        }
    });

    document.getElementById("pay-details-pod").style.display = "none";
    document.getElementById("pay-details-upi").style.display = "none";
    document.getElementById("pay-details-card").style.display = "none";
    document.getElementById("pay-details-paylater").style.display = "none";

    document.getElementById(`pay-details-${method}`).style.display = "block";
}

function verifyPayLaterOtp() {
    const activeUser = JSON.parse(localStorage.getItem("quickbite_active_user"));
    const phone = activeUser ? activeUser.phone : "9876543210";
    const otp = prompt(`Enter 4-digit OTP code sent to +91 ${phone}:`);
    if (otp && otp.length === 4) {
        showToast("Pay Later limit verified! Approved limit: ₹5,000", "success");
    } else {
        showToast("Verification failed. Invalid OTP.", "error");
    }
}

async function geocodeAddress(address) {
    try {
        let searchQuery = address;
        // Append Hyderabad and Telangana to limit search results to correct area
        if (!searchQuery.toLowerCase().includes("hyderabad") && !searchQuery.toLowerCase().includes("telangana")) {
            searchQuery += ", Hyderabad, Telangana, India";
        }
        const response = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(searchQuery)}&limit=1`);
        const data = await response.json();
        if (data && data.length > 0) {
            return [parseFloat(data[0].lat), parseFloat(data[0].lon)];
        }
    } catch (e) {
        console.error("Geocoding failed, using fallback:", e);
    }
    return null;
}

async function placeOrder() {
    if (cart.length === 0) {
        showToast("Your basket is empty", "error");
        return;
    }

    // Read the customer's typed real address
    const addressInput = document.getElementById("customer-address-input");
    const typedAddress = addressInput ? addressInput.value.trim() : "";
    if (!typedAddress) {
        showToast("Please enter your delivery address", "error");
        if (addressInput) addressInput.focus();
        return;
    }

    // Validate payment inputs
    let paymentDetails = {};
    if (currentPaymentMethod === "upi") {
        const upiVal = document.getElementById("pay-upi-id").value.trim();
        if (!upiVal || !upiVal.includes("@")) {
            showToast("Please enter a valid UPI ID (e.g. name@ybl)", "error");
            document.getElementById("pay-upi-id").focus();
            return;
        }
        paymentDetails.upiId = upiVal;
    } else if (currentPaymentMethod === "card") {
        const name = document.getElementById("pay-card-name").value.trim();
        const num = document.getElementById("pay-card-num").value.trim();
        const exp = document.getElementById("pay-card-exp").value.trim();
        const cvv = document.getElementById("pay-card-cvv").value.trim();

        if (!name || !num || !exp || !cvv) {
            showToast("Please fill all Debit Card fields", "error");
            return;
        }
        if (num.replace(/\s/g, '').length < 16) {
            showToast("Invalid card details", "error");
            return;
        }
        paymentDetails.cardholder = name;
        paymentDetails.cardNumber = "**** **** **** " + num.replace(/\s/g, '').slice(-4);
    }

    const rest = restaurants.find(r => r.id === activeRestaurantId);
    const totalAmount = cart.reduce((sum, item) => sum + item.price, 0);
    const orderId = orders.length > 0 ? Math.max(...orders.map(o => o.id)) + 1 : 1001;

    // Geocoding the location
    let resolvedCoord = null;
    if (gpsLocation) {
        resolvedCoord = gpsLocation;
    } else {
        showToast("Locating your address on map...", "success");
        resolvedCoord = await geocodeAddress(typedAddress);
    }

    if (!resolvedCoord) {
        resolvedCoord = nodeCoords[4]; // Fallback to Mehdipatnam
        showToast("Snapping delivery address to nearest zone drop point", "warning");
    }

    // Routing: map restaurant to graph node, destination always node 4
    const restNodeId = (activeRestaurantId % 2 !== 0) ? 1 : 5;
    const destNodeId = 4; // fixed destination node for Dijkstra

    // Override nodeCoords for customer destination drop node dynamically
    nodeCoords[destNodeId] = resolvedCoord;
    customDestCoord = resolvedCoord;
    customDestText  = typedAddress;

    // Use admin-set coordinates for the restaurant if available
    restaurantText  = rest.address || rest.name;
    if (rest.lat && rest.lng) {
        restaurantCoord = [parseFloat(rest.lat), parseFloat(rest.lng)];
    } else {
        restaurantCoord = nodeCoords[restNodeId];
    }
    // Update nodeCoords for restaurant zone node dynamically as well
    nodeCoords[restNodeId] = restaurantCoord;

    // Run Dijkstra routing
    const routeInfo = runDijkstraPath(restNodeId, destNodeId);

    const newOrder = {
        id: orderId,
        customer: JSON.parse(localStorage.getItem("quickbite_active_user"))?.fullname || "Vamshi",
        restaurantId: activeRestaurantId,
        amount: totalAmount,
        status: "Preparing",
        eta: `${Math.round(routeInfo.dist * 1.8)} min`,
        deliveryAddress: typedAddress,
        payment: {
            method: currentPaymentMethod,
            details: paymentDetails
        }
    };

    // Save order in localStorage (Shared Database)
    orders.push(newOrder);
    localStorage.setItem("quickbite_orders", JSON.stringify(orders));

    // Clear Cart & resets
    cart = [];
    gpsLocation = null;
    const gpsInd = document.getElementById("gps-coords-indicator");
    if (gpsInd) gpsInd.style.display = "none";
    updateCartUI();
    document.getElementById("cart-drawer").classList.add("hidden");
    document.getElementById("menu-modal").classList.add("hidden");
    if (addressInput) addressInput.value = "";

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
    document.getElementById("lbl-route-origin").innerText = `${rest.name} — ${restaurantText}`;
    document.getElementById("lbl-route-dest").innerText = typedAddress;

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
function drawTrackingMap(agentPos = null) {
    if (!leafletMap) initLeafletMap();
    if (leafletRouteLine) { leafletMap.removeLayer(leafletRouteLine); leafletRouteLine = null; }

    const rCoord = restaurantCoord || nodeCoords[1];
    const cCoord = customDestCoord || nodeCoords[4];

    if (restaurantMarker) { leafletMap.removeLayer(restaurantMarker); restaurantMarker = null; }
    if (rCoord) {
        restaurantMarker = L.marker(rCoord, {
            icon: L.divIcon({ html: `🍔`, className: 'map-icon rest-icon', iconSize: [30, 30] })
        }).addTo(leafletMap);
    }

    if (customerMarker) { leafletMap.removeLayer(customerMarker); customerMarker = null; }
    if (cCoord) {
        customerMarker = L.marker(cCoord, {
            icon: L.divIcon({ html: `🏠`, className: 'map-icon cust-icon', iconSize: [30, 30] })
        }).addTo(leafletMap);
    }

    if (activeOrder && activeRoutePath) {
        const pathCoords = activeRoutePath.map(id => nodeCoords[id]).filter(Boolean);
        leafletRouteLine = L.polyline(pathCoords, { color: '#3b82f6', weight: 4 }).addTo(leafletMap);
        
        if (agentMarker) leafletMap.removeLayer(agentMarker);
        if (agentPos || rCoord) {
            agentMarker = L.marker(agentPos || rCoord, {
                icon: L.divIcon({ html: `🛵`, className: 'map-icon agent-icon', iconSize: [120, 120] })
            }).addTo(leafletMap);
        }
    } else if (agentMarker) { leafletMap.removeLayer(agentMarker); agentMarker = null; }
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
    activeRoutePath = path;

    for (let i = 0; i < path.length - 1; i++) {
        const uCoord = nodeCoords[path[i]];
        const vCoord = nodeCoords[path[i+1]];
        const vNode = defaultState.graph.nodes.find(n => n.id === path[i+1]);
        if (!uCoord || !vCoord) continue;

        const steps = 45;
        for (let s = 0; s <= steps; s++) {
            const r = s / steps;
            interpolationPoints.push({
                lat: uCoord[0] + (vCoord[0] - uCoord[0]) * r,
                lng: uCoord[1] + (vCoord[1] - uCoord[1]) * r,
                targetName: vNode ? vNode.name : `Node ${path[i+1]}`
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
            drawTrackingMap([currentPos.lat, currentPos.lng]);

            if (currentFrame === Math.floor(interpolationPoints.length / 2)) {
                addFeedItem("🛵 Scooter traversing shortest transit path at " + currentPos.targetName.split(" ")[0]);
            }
            if (currentFrame === Math.floor(interpolationPoints.length * 3 / 4)) {
                addFeedItem("📍 Rider is approaching your block node!");
            }

            currentFrame++;
        }, 120);

    }, 4000); // 4 seconds kitchen preparation time
}

// ---------------------------------------------------------
// 8. Dynamic localStorage Database Sync
// ---------------------------------------------------------
function startAdminSync() {
    if (databaseSyncInterval) clearInterval(databaseSyncInterval);

    databaseSyncInterval = setInterval(() => {
        // --- Sync Restaurant List from Admin ---
        const dbRestaurants = JSON.parse(localStorage.getItem("quickbite_restaurants")) || [];
        if (JSON.stringify(dbRestaurants) !== JSON.stringify(restaurants)) {
            restaurants = dbRestaurants;
            renderRestaurants();
            showToast("Restaurant list updated by admin", "success");
        }

        // --- Sync Menu Items from Admin ---
        const dbMenusRaw = localStorage.getItem("quickbite_menus") || "[]";
        if (dbMenusRaw !== lastMenusSnapshot) {
            lastMenusSnapshot = dbMenusRaw;
            loadMenus();
        }

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
                const destNodeId = parseInt(document.getElementById("address-node-select").value);
                if (nodeCoords[destNodeId]) {
                    drawTrackingMap(nodeCoords[destNodeId]);
                } else {
                    drawTrackingMap();
                }
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

    const preview = document.getElementById("cust-avatar-preview");
    if (preview) {
        preview.src = activeUser.avatar || 'https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100';
    }

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


