const button=document.getElementById("trackBtn");

const status=document.getElementById("status");

button.onclick=()=>{

status.innerHTML="🚚 Delivery Agent Reached Halfway";

button.innerHTML="Tracking Started";

};

setInterval(()=>{

const agent=document.querySelector(".agent");

let left=agent.offsetLeft;

if(left<650){

agent.style.left=(left+5)+"px";

}

},100);