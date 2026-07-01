// Search Restaurant

const search=document.getElementById("searchRestaurant");

search.addEventListener("keyup",()=>{

const value=search.value.toLowerCase();

document.querySelectorAll(".restaurant-card").forEach(card=>{

card.style.display=

card.innerText.toLowerCase().includes(value)

?

"block"

:

"none";

});

});

// Add Restaurant

document.getElementById("addRestaurant").onclick=()=>{

alert("Add Restaurant Form Coming Soon");

};

// Edit

document.querySelectorAll(".edit").forEach(btn=>{

btn.onclick=()=>{

alert("Edit Restaurant");

};

});

// Delete

document.querySelectorAll(".delete").forEach(btn=>{

btn.onclick=()=>{

if(confirm("Delete this Restaurant?")){

btn.closest(".restaurant-card").remove();

}

};

});