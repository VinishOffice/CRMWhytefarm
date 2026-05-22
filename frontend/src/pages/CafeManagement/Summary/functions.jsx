



export const formateOrder = (data) => {
  const orders = [];
  const hubMap = {};

  data?.forEach((order) => {
    const hubName = order.data.hub_name;
    const productName = order.data.product_name;
    const quantity = parseInt(order.data.quantity, 10);
    const status = order.data.status;

    if (!hubMap[hubName]) {
      hubMap[hubName] = {};
    }

    if (!hubMap[hubName][productName]) {
      hubMap[hubName][productName] = {
        delivered: 0,
        pending: 0,
      };
    }

    if (status === 1) {
      hubMap[hubName][productName].delivered += quantity;
    } else {
      hubMap[hubName][productName].pending += quantity;
    }
  });

  for (const hubName in hubMap) {
    const aggregate = [];
    for (const productName in hubMap[hubName]) {
      aggregate.push({
        productName: productName,
        delivered: hubMap[hubName][productName].delivered,
        pending: hubMap[hubName][productName].pending,
      });
    }

    orders.push({
      hubName: hubName,
      aggregate: aggregate,
    });
  }

  return orders;
};