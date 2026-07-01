const form = document.getElementById("registerForm");

form.addEventListener("submit", function(e){

    e.preventDefault();

    const fullname = document.getElementById("fullname").value;
    const email = document.getElementById("email").value.trim().toLowerCase();
    const phone = document.getElementById("phone").value;
    const password = document.getElementById("password").value;
    const confirm = document.getElementById("confirmPassword").value;
    let avatar = document.getElementById("avatar").value;
    const role = document.getElementById("role").value;

    if(password !== confirm){
        alert("Passwords do not match.");
        return;
    }

    if (!avatar) {
        avatar = role === "Administrator" 
            ? "https://images.unsplash.com/photo-1535713875002-d1d0cf377fde?w=100" 
            : "https://images.unsplash.com/photo-1544005313-94ddf0286df2?w=100";
    }

    // Get current users from localStorage
    const users = JSON.parse(localStorage.getItem("quickbite_users")) || [];

    // Check if email already registered
    const duplicate = users.find(u => u.email === email);
    if (duplicate) {
        alert("This email address is already registered!");
        return;
    }

    // Save user
    users.push({ fullname, email, phone, password, role, avatar });
    localStorage.setItem("quickbite_users", JSON.stringify(users));

    alert("Registration Successful! You can now log in.");
    window.location.href="login.html";

});