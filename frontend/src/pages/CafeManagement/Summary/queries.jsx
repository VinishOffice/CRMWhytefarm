import apiClient from "../../../services/apiClient";
const Default_Limit = 100;
const formatDate = (date) => {
  if (!(date instanceof Date)) {
    console.error("Input must be a Date object", date); 
    return null; 
  }
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, "0");
  const day = String(date.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
};
export const fetchOrderList = async (startDate, endDate) => {
  try {
      let filters = [];
      if (startDate && endDate) {
          filters.push({ field: "delivery_date", op: ">=", value: startDate });
          filters.push({ field: "delivery_date", op: "<=", value: endDate });
      }
      const docs = await apiClient.post("/api/b2b_orders/query", { filters }).then(res => res.data?.data || []);
      const orders = docs.map((doc) => ({
          id: doc._id,
          data: doc,
      }));
      return orders;
  } catch (error) {
      console.error("Error fetching orders: ", error);
  } finally {
  }
};

export const fetchOrderListForHub = async (startDate, endDate, hub) => {
    try {
        let filters = [{ field: "hub_name", op: "==", value: hub }];
        if (startDate && endDate) {
            filters.push({ field: "delivery_date", op: ">=", value: startDate });
            filters.push({ field: "delivery_date", op: "<=", value: endDate });
        }
        const docs = await apiClient.post("/api/b2b_orders/query", { filters }).then(res => res.data?.data || []);
        const orders = docs.map((doc) => ({
            id: doc._id,
            data: doc,
        }));
        return orders;
    } catch (error) {
        console.error("Error fetching orders: ", error);
    } finally {
    }
};
export const fetchOrderListForProduct = async (startDate, endDate, hub, product) => {
    try {
        let filters = [
            { field: "hub_name", op: "==", value: hub },
            { field: "product_name", op: "==", value: product }
        ];
        if (startDate && endDate) {
            filters.push({ field: "delivery_date", op: ">=", value: startDate });
            filters.push({ field: "delivery_date", op: "<=", value: endDate });
        }
        const docs = await apiClient.post("/api/b2b_orders/query", { filters }).then(res => res.data?.data || []);
        const orders = docs.map((doc) => ({
            id: doc._id,
            data: doc,
        }));
        return orders;
    } catch (error) {
        console.error("Error fetching orders: ", error);
    } finally {
    }
};

export const fetchUniqueHubNames = async () => {
    try {
      const hubNamesArray = [];

      let firstHubName = await getFirstHubName();
      if (firstHubName) {
        hubNamesArray.push(firstHubName);
      }

      while (true) {
        const newHubNames = await getHubNamesNotInArray(hubNamesArray);
        if (newHubNames.length === 0) {
          break;
        }
        hubNamesArray.push(...newHubNames);
      }
      return hubNamesArray;
    } catch (error) {
      console.error("Error fetching unique hubs: ", error);
    }
  };

const getFirstHubName = async () => {
    const docs = await apiClient.post("/api/b2b_orders/query", { filters: [], limit: 1 }).then(res => res.data?.data || []);

    if (docs.length === 0) {
      return null;
    }

    let firstHubName = null;
    docs.forEach(data => {
      if (data.hub_name) {
        firstHubName = data.hub_name;
      }
    });

    return firstHubName;
  };

  const getHubNamesNotInArray = async (hubNamesArray) => {
    if (hubNamesArray.length === 0) return [];
    const docs = await apiClient.post("/api/b2b_orders/query", { 
        filters: [{ field: "hub_name", op: "not-in", value: hubNamesArray }],
        limit: 1
    }).then(res => res.data?.data || []);

    if (docs.length === 0) {
      return [];
    }

    const newHubNames = [];
    docs.forEach(data => {
      if (data.hub_name) {
        newHubNames.push(data.hub_name);
      }
    });

    return newHubNames;
  };

export const fetchCafeDetails = async () => {
    try {
      const docs = await apiClient.post("/api/b2b_orders/query", { filters: [] }).then(res => res.data?.data || []);
      const orders = docs.map(doc => ({
        id: doc._id,
        data: doc,
      }));

      return orders;
    } catch (error) {
      console.error("Error fetchind orders details", error)
    }
}
