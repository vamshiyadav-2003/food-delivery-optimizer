const dark=document.getElementById("darkMode");

dark.addEventListener("change",()=>{

document.body.classList.toggle("dark");

});

document.getElementById("settingsForm")
.addEventListener("submit",(e)=>{

e.preventDefault();

alert("✅ Settings Saved Successfully");

});