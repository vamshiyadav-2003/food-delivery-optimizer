fetch("http://localhost:8080/api/orders")
  .then(response => response.json())
  .then(data => {
      console.log(data);
  })
  .catch(error => console.error(error));
  function loadOrders(orders) {
    const body = document.getElementById("ordersBody");
    body.innerHTML = "";

    orders.forEach(order => {
        body.innerHTML += `
        <tr>
            <td>${order.id}</td>
            <td>${order.customer}</td>
            <td>${order.restaurant}</td>
            <td>${order.amount}</td>
            <td>${order.status}</td>
        </tr>`;
    });
}