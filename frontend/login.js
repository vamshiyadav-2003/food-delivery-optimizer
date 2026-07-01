const toggle = document.getElementById("togglePassword");
const password = document.getElementById("password");

toggle.addEventListener("click", () => {

    if(password.type==="password"){

        password.type="text";
        toggle.classList.replace("fa-eye","fa-eye-slash");

    }else{

        password.type="password";
        toggle.classList.replace("fa-eye-slash","fa-eye");

    }

});

const form = document.getElementById("loginForm");
form.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("email").value.trim().toLowerCase();
    const password = document.getElementById("password").value;

    // Get registered users
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
    } else if (email === "agent@quickbite.com") {
        loggedUser = {
            fullname: "Rahul Kumar (Agent)",
            email: email,
            phone: "+91 9876543210",
            role: "Delivery Agent",
            avatar: "https://images.unsplash.com/photo-1500648767791-00dcc994a43e?w=150"
        };
    }

    if (loggedUser) {
        if (loggedUser.role === "Administrator" || loggedUser.role === "System Administrator") {
            alert("❌ Administrator account detected!\n\nPlease use the dedicated Admin Login portal to sign in.");
            window.location.href = "admin_login.html";
            return;
        }

        localStorage.setItem("quickbite_active_user", JSON.stringify(loggedUser));
        alert(`Login Successful! Welcome, ${loggedUser.fullname}.`);
        
        if (loggedUser.role === "Delivery Agent") {
            window.location.href = "agent.html";
        } else {
            window.location.href = "customer.html";
        }
    } else {
        alert("Invalid Email or Password! Please register if you don't have an account.");
    }
});

