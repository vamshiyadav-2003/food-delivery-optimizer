new Chart(document.getElementById("revenueChart"),{

type:"bar",

data:{

labels:["Jan","Feb","Mar","Apr","May","Jun"],

datasets:[{

label:"Revenue",

data:[120,150,180,220,260,310],

backgroundColor:"#ff9800"

}]

},

options:{

responsive:true

}

});