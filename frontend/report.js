document.getElementById("pdf").onclick=()=>{

alert("PDF Export Feature Coming Soon");

};

document.getElementById("excel").onclick=()=>{

alert("Excel Export Feature Coming Soon");

};

new Chart(document.getElementById("revenueChart"),{

type:"bar",

data:{

labels:["Jan","Feb","Mar","Apr","May","Jun"],

datasets:[{

label:"Revenue",

data:[8,12,15,18,22,26],

backgroundColor:"#ff5722"

}]

}

});

new Chart(document.getElementById("statusChart"),{

type:"doughnut",

data:{

labels:["Delivered","Preparing","Cancelled"],

datasets:[{

data:[82,14,4],

backgroundColor:[

"#2ecc71",

"#f39c12",

"#e74c3c"

]

}]

}

});