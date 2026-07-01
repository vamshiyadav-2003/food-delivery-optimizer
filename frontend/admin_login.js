const toggle = document.getElementById("togglePassword");
const passwordInput = document.getElementById("password");

if (toggle) {
    toggle.addEventListener("click", () => {
        const type = passwordInput.getAttribute("type") === "password" ? "text" : "password";
        passwordInput.setAttribute("type", type);
        toggle.classList.toggle("fa-eye-slash");
    });
}

// Load saved Fast2SMS API Key
document.addEventListener("DOMContentLoaded", () => {
    let savedKey = localStorage.getItem("fast2sms_api_key");
    const targetKey = "PjcJCZ7EeI9GFkmgTUp03d68QKD52bYSszBhAf4ORNVqiWwuxXPRs27qCHor91SGyIEmvNYnxuTXLdQt";
    
    // Auto-override placeholder key with your working key
    if (!savedKey || savedKey === "YOUR_FAST2SMS_AUTHORIZATION_KEY_HERE" || savedKey.trim() === "") {
        savedKey = targetKey;
        localStorage.setItem("fast2sms_api_key", savedKey);
    }
    
    const keyInput = document.getElementById("sms-key-input");
    if (keyInput) {
        keyInput.value = savedKey;
    }
});

function saveSMSKey(val) {
    localStorage.setItem("fast2sms_api_key", val.trim());
    alert("Fast2SMS API Key saved! Ready for real SMS delivery.");
}


const form = document.getElementById("adminLoginForm");
form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = passwordInput.value;

    // Get registered users database
    const users = JSON.parse(localStorage.getItem("quickbite_users")) || [];
    
    // Proactively register/update the new admin credentials to avoid conflicts
    const adminIdx = users.findIndex(u => u.email === "yadavvamshi@gmail.com");
    const defaultAdmin = {
        fullname: "Vamshi Krishna",
        email: "yadavvamshi@gmail.com",
        phone: "+91 7780705719",
        password: "vamshi@gmail.com",
        role: "Administrator",
        avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
    };

    if (adminIdx !== -1) {
        users[adminIdx] = defaultAdmin;
    } else {
        users.push(defaultAdmin);
    }
    localStorage.setItem("quickbite_users", JSON.stringify(users));

    const foundUser = users.find(u => {
        if (u.email === email) {
            if (u.email === "yadavvamshi@gmail.com") {
                return password === "vamshi@gmail.com" || password === "vamshigmail.com";
            }
            return u.password === password;
        }
        return false;
    });

    let loggedUser = null;
    const adminEmails = ["admin@quickbite.com", "vamshi@gmail.com", "yadavvamshi@gmail.com"];
    const adminPasswords = ["admin", "admin123", "vamshi@gmail.com", "vamshigmail.com"];

    if (foundUser) {
        loggedUser = foundUser;
    } else if (adminEmails.includes(email) && adminPasswords.includes(password)) {
        loggedUser = {
            fullname: "Vamshi Krishna",
            email: email,
            phone: "+91 7780705719",
            role: "Administrator",
            avatar: "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100"
        };
    } else if (email === "customer@quickbite.com") {
        loggedUser = {
            fullname: "Rahul Customer",
            email: email,
            phone: "+91 9123456780",
            role: "Customer",
            avatar: "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100"
        };
    }

    if (loggedUser) {
        // Enforce role permission validation
        if (loggedUser.role !== "Administrator" && loggedUser.role !== "System Administrator") {
            alert("❌ Access Denied!\n\nStandard customer accounts do not have access permissions for the Admin Console dashboard. Please log in using the Customer Login portal.");
            return;
        }

        pendingUser = loggedUser;
        document.getElementById("otp-modal").classList.remove("hidden");
        document.getElementById("otp-input").value = "";
        document.getElementById("otp-input").focus();
    } else {
        alert("Invalid Admin Credentials! Check your username or password.");
    }
});

let pendingUser = null;

function verifyOTP(e) {
    e.preventDefault();
    const entered = document.getElementById("otp-input").value;
    const validPINs = ["2005", "7780", "1234"];
    
    if (validPINs.includes(entered)) {
        localStorage.setItem("quickbite_active_user", JSON.stringify(pendingUser));
        alert(`Access Granted! Welcome Back, ${pendingUser.fullname}.`);
        window.location.href = "dashboard.html";
    } else {
        alert("❌ Invalid Security PIN!\n\nPlease enter the correct 4-digit administrator passcode.");
        document.getElementById("otp-input").value = "";
        document.getElementById("otp-input").focus();
    }
}



