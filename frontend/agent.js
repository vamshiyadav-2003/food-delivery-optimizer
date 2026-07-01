// ==========================================================================
// Quick Bite | Food Delivery Optimizer
// Delivery Agent Rider Portal JS Controller
// ==========================================================================

const defaultState = {
    restaurants: [
        { id: 1, name: "Pizza Hub", x: 80, y: 100 },
        { id: 2, name: "Burger King", x: 280, y: 40 },
        { id: 3, name: "Domino's", x: 420, y: 160 },
        { id: 4, name: "KFC", x: 180, y: 220 }
    ],
    graph: {
        nodes: [
            { id: 0, label: "Hub", x: 40, y: 140 },
            { id: 1, label: "Node 1", x: 140, y: 80 },
            { id: 2, label: "Node 2", x: 240, y: 140 },
            { id: 3, label: "Node 3", x: 340, y: 80 },
            { id: 4, label: "Node 4", x: 380, y: 200 },
            { id: 5, label: "Node 5", x: 440, y: 100 }
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

let currentAgent = null;
let activeTasks = [];
let selectedTaskId = null;
let trackingInterval = null;
let trCanvas, trCtx;

document.addEventListener("DOMContentLoaded", () => {
    initAgentSession();
    loadTasks();
    drawTrackingMap();

    // Trigger settings modal
    const profileAvatar = document.getElementById("agent-profile-avatar");
    if (profileAvatar) profileAvatar.onclick = openAgentSettings;

    document.getElementById("btn-close-settings").onclick = () => document.getElementById("settings-modal").classList.add("hidden");
    document.getElementById("btn-cancel-settings").onclick = () => document.getElementById("settings-modal").classList.add("hidden");

    // Sync poller for new orders
    setInterval(loadTasks, 2000);
});

function initAgentSession() {
    const activeUser = JSON.parse(localStorage.getItem("quickbite_active_user"));
    if (activeUser && activeUser.role === "Delivery Agent") {
        currentAgent = activeUser;
        const avatar = document.getElementById("agent-profile-avatar");
        if (avatar) avatar.src = currentAgent.avatar;
        
        const ratingDisp = document.getElementById("lbl-rating-display");
        if (ratingDisp) ratingDisp.innerText = currentAgent.rating || "4.8";
    } else {
        // Fallback mockup rider
        currentAgent = {
            fullname: "Rahul Kumar (Agent)",
            email: "agent@quickbite.com",
            phone: "+91 9876543210",
            role: "Delivery Agent",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150",
            rating: "4.9"
        };
        localStorage.setItem("quickbite_active_user", JSON.stringify(currentAgent));
    }
}

function loadTasks() {
    const orders = JSON.parse(localStorage.getItem("quickbite_orders")) || [];
    const restaurantsList = JSON.parse(localStorage.getItem("quickbite_restaurants")) || defaultState.restaurants;

    // Active tasks: status is "Preparing" or "On Route"
    activeTasks = orders.filter(o => o.status === "Preparing" || o.status === "On Route");
    
    // Update counter badge
    document.getElementById("lbl-assigned-count").innerText = activeTasks.length;

    const listContainer = document.getElementById("assigned-tasks-list");
    if (activeTasks.length === 0) {
        listContainer.innerHTML = `
            <div class="no-tasks">
                <i class="fa-solid fa-face-smile"></i>
                <p>No active delivery tasks assigned to you right now. Stay ready!</p>
            </div>
        `;
        return;
    }

    listContainer.innerHTML = "";
    activeTasks.forEach(task => {
        const rest = restaurantsList.find(r => r.id === task.restaurantId) || { name: "Unknown Kitchen", address: "City Node" };
        const statusClass = task.status === "Preparing" ? "status-preparing" : "status-on-route";
        const actionBtnText = task.status === "Preparing" ? `<i class="fa-solid fa-truck-ramp-box"></i> Start Delivery Route` : `<i class="fa-solid fa-house-circle-check"></i> Complete Delivery`;
        const actionBtnClass = task.status === "Preparing" ? "btn-primary" : "btn-primary";
        
        listContainer.innerHTML += `
            <div class="task-card ${selectedTaskId === task.id ? 'active-border' : ''}" onclick="selectTask(${task.id})">
                <div class="task-card-header">
                    <h4>Order #${task.id}</h4>
                    <span class="status-pill ${statusClass}">${task.status}</span>
                </div>
                <div class="task-meta-info">
                    <p><i class="fa-solid fa-user"></i> <strong>Customer:</strong> ${task.customer}</p>
                    <p><i class="fa-solid fa-utensils"></i> <strong>Restaurant:</strong> ${rest.name}</p>
                    <p><i class="fa-solid fa-house-chimney"></i> <strong>Destination Node:</strong> Node 4 (Mock Address)</p>
                    <p><i class="fa-solid fa-indian-rupee-sign"></i> <strong>Payment:</strong> ₹${task.amount} (Cash/Online)</p>
                </div>
                <div class="task-actions">
                    <button class="btn ${actionBtnClass}" onclick="handleTaskAction(event, ${task.id}, '${task.status}')">
                        ${actionBtnText}
                    </button>
                </div>
            </div>
        `;
    });
}

function selectTask(id) {
    selectedTaskId = id;
    loadTasks();
    
    // Stop previous tracking animation if running
    if (trackingInterval) clearInterval(trackingInterval);
    drawTrackingMap();
    
    const orders = JSON.parse(localStorage.getItem("quickbite_orders")) || [];
    const task = orders.find(o => o.id === id);
    if (!task) return;

    // Display Dijkstra details
    const destNodeId = 4; // Mock node coordinate
    const restNodeId = task.restaurantId === 1 ? 1 : 5; // Node mapped to restaurant
    
    // Dijkstra pathway mock
    const pathNodes = restNodeId === 1 ? [1, 2, 3, 4] : [5, 3, 4];
    const pathDist = restNodeId === 1 ? "11 km" : "8 km";

    document.getElementById("agent-order-status").innerText = task.status;
    document.getElementById("agent-order-status").className = `status-pill ${task.status === 'Preparing' ? 'status-preparing' : 'status-on-route'}`;
    document.getElementById("agent-route-nodes").innerText = pathNodes.join(" ➔ ");
    document.getElementById("agent-route-distance").innerText = pathDist;

    if (task.status === "On Route") {
        startRiderAnimation(restNodeId, destNodeId, pathNodes);
    }
}

function handleTaskAction(event, id, status) {
    event.stopPropagation(); // prevent card selection trigger

    const orders = JSON.parse(localStorage.getItem("quickbite_orders")) || [];
    const index = orders.findIndex(o => o.id === id);
    if (index === -1) return;

    if (status === "Preparing") {
        // Start route
        orders[index].status = "On Route";
        orders[index].eta = "10 min";
        localStorage.setItem("quickbite_orders", JSON.stringify(orders));
        showToast(`Delivery started! Order #${id} is on the way.`, "success");
        selectTask(id);
    } else if (status === "On Route") {
        // Complete delivery
        orders[index].status = "Delivered";
        orders[index].eta = "Delivered";
        localStorage.setItem("quickbite_orders", JSON.stringify(orders));
        
        // Add to completed today count
        const completedLabel = document.getElementById("lbl-completed-count");
        if (completedLabel) {
            completedLabel.innerText = parseInt(completedLabel.innerText) + 1;
        }

        showToast(`Success! Order #${id} has been delivered.`, "success");
        selectedTaskId = null;
        if (trackingInterval) clearInterval(trackingInterval);
        
        document.getElementById("agent-order-status").innerText = "Idle";
        document.getElementById("agent-order-status").className = "status-pill";
        document.getElementById("agent-route-nodes").innerText = "--";
        document.getElementById("agent-route-distance").innerText = "--";

        loadTasks();
        drawTrackingMap();
    }
}

// ---------------------------------------------------------
// Visual Tracking Animation
// ---------------------------------------------------------
function drawTrackingMap(riderPos = null) {
    trCanvas = document.getElementById("agentTrackingCanvas");
    if (!trCanvas) return;
    trCtx = trCanvas.getContext("2d");

    trCtx.clearRect(0, 0, trCanvas.width, trCanvas.height);

    // Streets grid
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

    // Graph nodes connection
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

    if (selectedTaskId) {
        const orders = JSON.parse(localStorage.getItem("quickbite_orders")) || [];
        const task = orders.find(o => o.id === selectedTaskId);
        if (!task) return;

        const restNodeId = task.restaurantId === 1 ? 1 : 5;
        const destNodeId = 4;
        
        const rNode = defaultState.graph.nodes.find(n => n.id === restNodeId);
        const cNode = defaultState.graph.nodes.find(n => n.id === destNodeId);

        // Restaurant
        trCtx.beginPath();
        trCtx.arc(rNode.x, rNode.y, 14, 0, 2*Math.PI);
        trCtx.fillStyle = "#ef4444";
        trCtx.fill();
        trCtx.fillStyle = "white";
        trCtx.font = "12px Poppins";
        trCtx.textAlign = "center";
        trCtx.fillText("🍔", rNode.x, rNode.y + 4);

        // Destination
        trCtx.beginPath();
        trCtx.arc(cNode.x, cNode.y, 14, 0, 2*Math.PI);
        trCtx.fillStyle = "#10b981";
        trCtx.fill();
        trCtx.fillStyle = "white";
        trCtx.fillText("🏠", cNode.x, cNode.y + 4);

        // Rider Icon
        const pos = riderPos || { x: rNode.x, y: rNode.y };
        trCtx.beginPath();
        trCtx.arc(pos.x, pos.y, 16, 0, 2*Math.PI);
        trCtx.fillStyle = "#3b82f6";
        trCtx.strokeStyle = "white";
        trCtx.lineWidth = 2;
        trCtx.fill();
        trCtx.stroke();
        trCtx.fillStyle = "white";
        trCtx.fillText("🛵", pos.x, pos.y + 4);
    } else {
        // Draw standard graph layout nodes
        defaultState.graph.nodes.forEach(node => {
            trCtx.beginPath();
            trCtx.arc(node.x, node.y, 14, 0, 2*Math.PI);
            trCtx.fillStyle = "#cbd5e1";
            trCtx.fill();
            trCtx.fillStyle = "white";
            trCtx.font = "10px Poppins";
            trCtx.textAlign = "center";
            trCtx.fillText(node.id, node.x, node.y + 4);
        });
    }
}

function startRiderAnimation(srcId, tgtId, pathNodes) {
    if (trackingInterval) clearInterval(trackingInterval);

    const coords = [];
    pathNodes.forEach(nodeId => {
        const node = defaultState.graph.nodes.find(n => n.id === nodeId);
        if (node) coords.push({ x: node.x, y: node.y });
    });

    let segmentIndex = 0;
    let step = 0;
    const speed = 0.05; // speed parameter

    trackingInterval = setInterval(() => {
        if (segmentIndex >= coords.length - 1) {
            clearInterval(trackingInterval);
            return;
        }

        const p1 = coords[segmentIndex];
        const p2 = coords[segmentIndex + 1];

        const x = p1.x + (p2.x - p1.x) * step;
        const y = p1.y + (p2.y - p1.y) * step;

        drawTrackingMap({ x, y });

        step += speed;
        if (step >= 1.0) {
            step = 0;
            segmentIndex++;
        }
    }, 60);
}

// ---------------------------------------------------------
// Rider Profile Settings
// ---------------------------------------------------------
function openAgentSettings() {
    document.getElementById("agent-set-name").value = currentAgent.fullname;
    document.getElementById("agent-set-email").value = currentAgent.email;
    document.getElementById("agent-set-phone").value = currentAgent.phone;
    document.getElementById("agent-set-avatar").value = currentAgent.avatar || '';
    document.getElementById("agent-set-password").value = '';

    document.getElementById("settings-modal").classList.remove("hidden");
}

function saveAgentSettings(e) {
    e.preventDefault();
    const name = document.getElementById("agent-set-name").value;
    const phone = document.getElementById("agent-set-phone").value;
    const avatar = document.getElementById("agent-set-avatar").value;
    const pass = document.getElementById("agent-set-password").value;

    currentAgent.fullname = name;
    currentAgent.phone = phone;
    currentAgent.avatar = avatar;

    localStorage.setItem("quickbite_active_user", JSON.stringify(currentAgent));

    const avatarImg = document.getElementById("agent-profile-avatar");
    if (avatarImg) avatarImg.src = avatar;

    // Update in users registry
    const users = JSON.parse(localStorage.getItem("quickbite_users")) || [];
    const index = users.findIndex(u => u.email === currentAgent.email);
    if (index !== -1) {
        users[index].fullname = name;
        users[index].phone = phone;
        users[index].avatar = avatar;
        if (pass) users[index].password = pass;
        localStorage.setItem("quickbite_users", JSON.stringify(users));
    }

    document.getElementById("settings-modal").classList.add("hidden");
    showToast("Profile settings updated", "success");
}

function confirmAgentLogout() {
    if (confirm("Log out of Rider Console?")) {
        window.location.href = "login.html";
    }
}

// Toast alerts
function showToast(msg, type = "success") {
    const toast = document.getElementById("toast");
    if (!toast) return;

    toast.innerText = msg;
    toast.className = `toast ${type === "success" ? "success-toast" : "error-toast"}`;
    toast.classList.remove("hidden");

    setTimeout(() => toast.classList.add("hidden"), 3000);
}