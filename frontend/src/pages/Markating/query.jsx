import Swal from "sweetalert2";
import { DateTimeUtil } from "../../Utility";
import apiClient from "../../services/apiClient";

const Default_Limit = 1000;
const cartDB = "cart_data";
const productDB = "products_data";
const orderDB = "order_history"
const Toast = Swal.mixin({
  toast: true,
  background: "#69aba6",
  position: "top-end",
  showConfirmButton: false,
  timer: 3000,
  timerProgressBar: true,
  didOpen: (toast) => {
    toast.addEventListener("mouseenter", Swal.stopTimer);
    toast.addEventListener("mouseleave", Swal.resumeTimer);
  },
});

const showToast = (icon, title) => {
  Toast.fire({
    icon,
    title,
  });
};

const addCartData = async (data) => {
  try {
    const finalData = prepareData(data);
    if (finalData.error) {
      showToast("error", `Error: ${finalData.error}`);
      return finalData;
    }

    try {
      const docs = await apiClient.post(`/api/${cartDB}/query`, {
        filters: [{ field: "customer_id", op: "==", value: finalData.customer_id }]
      }).then(res => res.data?.data || []);

      const cart_data = docs;

      if (cart_data.length > 0) { // Changed this to > 0 instead of > 1 to match update logic realistically
        await apiClient.put(`/api/${cartDB}/${cart_data[0]._id}`, finalData);
        showToast("success", "Cart Updated Successfully");
      } else {
        await apiClient.post(`/api/${cartDB}`, finalData);
        showToast("success", "Cart Added Successfully");
      }
      return cart_data;
    } catch (error) {
      showToast("error", "An error occurred while updating the cart.");
    } finally {
    }
  } catch (error) {
    showToast("error", "An error occurred while preparing the data.");
  }
};

const prepareData = (data) => {
  const requiredCustomerFields = [
    "customer_id",
    "customer_name",
    "customer_phone",
  ];
  const requiredProductFields = [
    "product_id",
    "product",
    "product_name",
    "quantity",
  ];

  let isValid = true;
  let error = null;

  for (let prop of requiredCustomerFields) {
    if (!(prop in data)) {
      error = `${prop} is missing in customer data`;
      isValid = false;
      break;
    }
  }

  if (isValid && Array.isArray(data.products) && data.products.length > 0) {
    for (let i = 0; i < data.products.length; i++) {
      const product = data.products[i];
      for (let prop of requiredProductFields) {
        if (!(prop in product)) {
          error = `${prop} is missing in product data at index ${i + 1}`;
          isValid = false;
          break;
        }
      }
      if (!isValid) break;
    }
  } else {
    error = "products array is missing or empty";
    isValid = false;
  }

  if (!isValid) {
    return { error };
  }

  const finalData = {
    customer_id: data.customer_id || "",
    customer_name: data.customer_name || "",
    customer_phone: data.customer_phone || "",
    update_date: DateTimeUtil.timestampToISODate(new Date()),
    update_timestamp: new Date(),
    products: data.products.map((product) => ({
      product_id: product.product_id || "",
      product: product.product || "",
      product_name: product.product_name || "",
      quantity: product.quantity || 0,
    })),
  };

  return finalData;
};

export { addCartData, prepareData };

export const fetchCartData = async () => {
  try {
    const docs = await apiClient.post(`/api/${cartDB}/query`, { filters: [] })
      .then(res => res.data?.data || []);
    const cart_data = docs
      .map((doc) => ({
        id: doc._id,
        ...doc,
      }))
      .filter((product) => product.products && product.products.length > 0);
    return cart_data;
  } catch (error) {
    console.error("Error fetching cart: ", error);
  } finally {
  }
};

export const fetchProductsList = async () => {
  try {
    const docs = await apiClient.post(`/api/${productDB}/query`, { filters: [] })
      .then(res => res.data?.data || []);
    const products = docs.map((doc) => {
      const product = { ...doc, id: doc._id };
      return product;
    });
    return products;
  } catch (error) {
  }
};



export const fetchCustomerOrderHistory = async (startDate, endDate) => {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const formattedStartDate = startDate ? DateTimeUtil.timestampToISOHyphenDate(new Date(startDate)) : DateTimeUtil.timestampToISODate(thirtyDaysAgo);
  const formattedEndDate = endDate ? DateTimeUtil.timestampToISOHyphenDate(new Date(endDate)) : DateTimeUtil.timestampToISODate(new Date());


  try {
    const docs = await apiClient.post(`/api/${orderDB}/query`, {
      filters: [
        { field: "order_type", op: "==", value: "OT" },
        { field: "delivery_date", op: ">=", value: formattedStartDate },
        { field: "delivery_date", op: "<=", value: formattedEndDate }
      ]
    }).then(res => res.data?.data || []);
    
    const orderHistory = docs.map((doc) => ({
      id: doc._id,
      ...doc,
    }));

    return orderHistory;
  } catch (error) {
    console.error("Error fetching order history: ", error);
    throw new Error(`Failed to fetch order history: ${error.message}`);
  }
};