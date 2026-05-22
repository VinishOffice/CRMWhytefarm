import moment from "moment";
import { DateTimeUtil } from "../../../Utility";
import apiClient from '../../../services/apiClient';



class FetchInventory {
  constructor() {
    this.stockDB = "stock_data";
    this.dispatchDB = "dispatch_data";
    this.farmStockDB = "farm_stock_data";
    this.stockHistoryDB = "stock_history";
    this.farmStockHistoryDB = "farm_stock_history";

  }

  async fetchStock() {
  try {
    const today = moment().format("YYYY-MM-DD");
    const yesterday = moment().add(-1, 'days').format("YYYY-MM-DD");

    const stockDocs = await apiClient.post(`/api/${this.stockDB}/query`, { filters: [{ field: "created_date", op: "==", value: today }] }).then(res => res.data?.data || []);

    if (stockDocs.length === 0) {
      const yesterdayDocs = await apiClient.post(`/api/${this.stockDB}/query`, { filters: [{ field: "created_date", op: "==", value: yesterday }] }).then(res => res.data?.data || []);

      const data = yesterdayDocs;

      for (const item of data) {
        // ⛔ Skip if productName contains "milk"
        if (item.productName?.toLowerCase().includes("milk")) continue;

        const updatData = {
          ...item,
          damagedStock: 0,
          goodStock: item.goodStock,
          quantity_change: 0,
          totalStock: item.goodStock,
          yesterday_stock : item.goodStock,
          created_date: today,
          updated_date: today,
          created_at: new Date(),
          update_type: "System Update",
          user: localStorage.getItem("loggedIn_user"),
          user_id: localStorage.getItem("userId"),
        };

        await apiClient.post(`/api/${this.stockDB}`, updatData);
      }

      // Re-fetch today's stock after adding
      const updatedDocs = await apiClient.post(`/api/${this.stockDB}/query`, { filters: [{ field: "created_date", op: "==", value: today }] }).then(res => res.data?.data || []);

      return updatedDocs
        .filter(item => !item.productName?.toLowerCase().includes("milk")); // ✅ Filter here too
    }

    // ✅ Return filtered stock from today
    return stockDocs
      .filter(item => !item.productName?.toLowerCase().includes("milk"));

  } catch (error) {
    console.error("❌ Error fetching stock data:", error);
    return [];
  }
}

  async fetchFarmStock() {
    try {
      const docs = await apiClient.post(`/api/${this.farmStockDB}/query`, { filters: [] }).then(res => res.data?.data || []);
      return docs;
    } catch (error) {
      console.error("Error fetching farms stock data:", error);
      return [];
    }
  }

  async fetchStockHistory() {
    try {
      const docs = await apiClient.post(`/api/${this.stockHistoryDB}/query`, { filters: [] }).then(res => res.data?.data || []);
      return docs.sort((a,b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error("Error fetching stock history data:", error);
      return [];
    }
  }

  async fetchFarmStockHistory() {
    try {
      const docs = await apiClient.post(`/api/${this.farmStockHistoryDB}/query`, { filters: [] }).then(res => res.data?.data || []);
      return docs.sort((a,b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error("Error fetching stock history data:", error);
      return [];
    }
  }

  async fetchDispatch() {
    try {
      const docs = await apiClient.post(`/api/${this.dispatchDB}/query`, { filters: [] }).then(res => res.data?.data || []);
      return docs.sort((a,b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error("Error fetching dispatch data:", error);
      return [];
    }
  }
  async fetchHubDispatch() {
    try {
      const docs = await apiClient.post(`/api/${this.dispatchDB}/query`, { filters: [{ field: "type", op: "==", value: "Hub Dispatch" }] }).then(res => res.data?.data || []);
      return docs.sort((a,b) => new Date(b.date) - new Date(a.date));
    } catch (error) {
      console.error("Error fetching dispatch data:", error);
      return [];
    }
  }
  async fetchDispatchesByDateRange(date) {

    // Create a new Date object for the start of the day: 00:00:00
    const startOfDay = new Date(date);
    startOfDay.setHours(0, 0, 0, 0);
    // Create a new Date object for the end of the day: 23:59:59

    // Create a new Date object for the end of the day: 23:59:59.999
    const endOfDay = new Date(date);
    endOfDay.setHours(23, 59, 59, 999);
    try {
      const docs = await apiClient.post(`/api/${this.dispatchDB}/query`, { filters: [{ field: "date", op: ">=", value: startOfDay }, { field: "date", op: "<=", value: endOfDay }] }).then(res => res.data?.data || []);

      // Map and return the data
      const data = docs.sort((a,b) => new Date(b.date) - new Date(a.date));

      return data;
    } catch (error) {
      console.error("Error fetching dispatches by date range:", error);
      return [];
    }
  }

}

class AddInventory {
  constructor() {
    this.dispatchDB = "dispatch_data";
    this.stockHistoryDB = "stock_history";
    this.farmStockHistoryDB = "farm_stock_history";
  }

  async addStockHistory(data) {
    const payload = {
      ...data,
      created_date: DateTimeUtil.timestampToISOHyphenDate(new Date()),
      date: new Date(),
    };
    try {
      const response = await apiClient.post(`/api/${this.stockHistoryDB}`, payload);
      return { id: response.data?.data?._id || new Date().getTime().toString(), ...payload };
    } catch (error) {
      console.error("Error adding stock history data:", error);
      return null;
    }
  }
  async addFarmStockHistory(data) {
    const payload = {
      ...data,
      created_date: DateTimeUtil.timestampToISOHyphenDate(new Date()),
      date: new Date(),
    };
    try {
      const response = await apiClient.post(`/api/${this.farmStockHistoryDB}`, payload);
      return { id: response.data?.data?._id || new Date().getTime().toString(), ...payload };
    } catch (error) {
      console.error("Error adding stock history data:", error);
      return null;
    }
  }

  async addDispatch(data) {
    const payload = {
      ...data,
      created_date: DateTimeUtil.timestampToISOHyphenDate(new Date())
    };
    try {
      const response = await apiClient.post(`/api/${this.dispatchDB}`, payload);
      return { id: response.data?.data?._id || new Date().getTime().toString(), ...payload };
    } catch (error) {
      console.error("Error adding dispatch data:", error);
      return null;
    }
  }
}

class UpdateInventory {
  constructor() {
    this.stockDB = "stock_data";
    this.farmStockDB = "farm_stock_data";
    this.dispatchDB = "dispatch_data";
    this.stockHistoryDB = "stock_history";
  }

  validateInput(data, requiredFields) {
    requiredFields.forEach((field) => {
      if (!data[field]) {
        throw new Error(`Validation error: Missing required field '${field}'.`);
      }
    });

    if (data.quantity !== undefined && (isNaN(data.quantity) || data.quantity <= 0)) {
      throw new Error("Validation error: 'quantity' must be a positive number.");
    }
  }

  async updateStock(hub, productId, product, quantity, updateType, user, userId) {
    try {
      this.validateInput({ hub, productId, product, quantity, updateType, user, userId }, ["hub", "productId", "product", "quantity", "updateType", "user", "userId"]);

      const docs = await apiClient.post(`/api/${this.stockDB}/query`, {
        filters: [{ field: "hub", op: "==", value: hub }, { field: "productId", op: "==", value: productId }]
      }).then(res => res.data?.data || []);


      if (docs.length === 0 || docs[0]?.created_date != moment()?.format("YYYY-MM-DD")) {
        const initialData = {
          hub,
          productName: product,
          productId: productId,
          goodStock: updateType === "Damaged" || updateType === "Out for Delivery" ? 0 : quantity,
          damagedStock: updateType === "Damaged" ? quantity : 0,
          totalStock: quantity,
          quantity_change: quantity,
          update_type: updateType,
          user,
          user_id: userId,
          update_at: new Date(),
          previous_data: null,
          created_at: new Date(),
          created_date: moment().format("YYYY-MM-DD"),
        };

        const newDocRef = await apiClient.post(`/api/${this.stockDB}`, initialData);
        return { id: newDocRef.data?.data?._id || new Date().getTime().toString(), ...initialData };
      }

      const stockHistory = docs.map((doc) => ({ id: doc._id, ...doc }));
      const previousRecord = stockHistory[0];

      const goodStock =
        updateType === "Damaged" || updateType === "Out for Delivery"
          ? (Number(previousRecord.goodStock) || 0) - Number(quantity)
          : (Number(previousRecord.goodStock) || 0) + Number(quantity);

      const damagedStock =
        updateType === "Damaged"
          ? (Number(previousRecord.damagedStock) || 0) + Number(quantity)
          : (Number(previousRecord.damagedStock) || 0)

      if (goodStock < 0) {
        throw new Error("Insufficient stock to complete the update.");
      }

      const totalStock = goodStock + damagedStock;

      const updatedData = {
        hub,
        productName: product,
        productId: productId,
        goodStock,
        damagedStock,
        totalStock,
        quantity_change: quantity,
        update_type: updateType,
        user,
        user_id: userId,
        update_at: new Date(),
        previous_data: previousRecord,
      };

      await apiClient.patch(`/api/${this.stockDB}/${previousRecord.id}`, updatedData);
      return updatedData;
    } catch (error) {
      console.error("Error updating stock data:", error);
      return null;
    }
  }
  async updateFarmStock(hub, productId, product, quantity, updateType, user, userId) {
    try {
      this.validateInput({ hub, productId, product, quantity, updateType, user, userId }, ["hub", "productId", "product", "quantity", "updateType", "user", "userId"]);

      const docsFarm = await apiClient.post(`/api/${this.farmStockDB}/query`, {
        filters: [{ field: "hub", op: "==", value: hub }, { field: "productId", op: "==", value: productId }]
      }).then(res => res.data?.data || []);

      if (docsFarm.length === 0) {
        const initialData = {
          hub,
          productName: product,
          productId: productId,
          goodStock: updateType === "Damaged" || updateType === "Dispatch" ? 0 : quantity,
          damagedStock: updateType === "Damaged" ? quantity : 0,
          totalStock: quantity,
          quantity_change: quantity,
          update_type: updateType,
          user,
          user_id: userId,
          update_at: new Date(),
          previous_data: null,
        };

        const newDocRef = await apiClient.post(`/api/${this.farmStockDB}`, initialData);
        return { id: newDocRef.data?.data?._id || new Date().getTime().toString(), ...initialData };
      }

      const stockHistory = docsFarm.map((doc) => ({ id: doc._id, ...doc }));
      const previousRecord = stockHistory[0];

      const goodStock =
        updateType === "Damaged" || updateType === "Dispatch"
          ? (Number(previousRecord.goodStock) || 0) - Number(quantity)
          : (Number(previousRecord.goodStock) || 0) + Number(quantity);

      const damagedStock =
        updateType === "Damaged"
          ? (Number(previousRecord.damagedStock) || 0) + Number(quantity)
          : (Number(previousRecord.damagedStock) || 0)

      if (goodStock < 0) {
        throw new Error("Insufficient stock to complete the update.");
      }

      const totalStock = goodStock + damagedStock;

      const updatedData = {
        hub,
        productName: product,
        productId: productId,
        goodStock,
        damagedStock,
        totalStock,
        quantity_change: quantity,
        update_type: updateType,
        user,
        user_id: userId,
        update_at: new Date(),
        previous_data: previousRecord,
      };

      await apiClient.patch(`/api/${this.farmStockDB}/${previousRecord.id}`, updatedData);
      return updatedData;
    } catch (error) {
      console.error("Error updating stock data:", error);
      return null;
    }
  }
  async updateDispatch(dispatch_sub_id, quantity, updatedStatus, user, userId) {
    try {
      this.validateInput({ dispatch_sub_id, quantity, updatedStatus, user, userId }, ["dispatch_sub_id", "quantity", "updatedStatus", "user", "userId"]);

      const docsDispatch = await apiClient.post(`/api/${this.dispatchDB}/query`, {
        filters: [{ field: "dispatch_sub_id", op: "==", value: dispatch_sub_id }]
      }).then(res => res.data?.data || []);
      if (docsDispatch.length === 0) {
        throw new Error("No dispatch found with the given sub ID.");
      }
      const dispatchData = docsDispatch.map((doc) => ({ id: doc._id, ...doc }));
      const previousRecord = dispatchData[0];

      const updatedData = {
        ...previousRecord,
        user,
        user_id: userId,
        update_at: new Date(),
        previous_data: previousRecord,
        quantity,
        status: updatedStatus,
        dispatch_date: updatedStatus === "Dispatched" ? new Date() : null,
      };

      await apiClient.patch(`/api/${this.dispatchDB}/${previousRecord.id}`, updatedData);
      return updatedData;
    } catch (error) {
      console.error("Error updating stock data:", error);
      return null;
    }
  }
  async acceptDispatch(dispatch_sub_id, user, userId) {
    try {
      this.validateInput({ dispatch_sub_id, user, userId }, ["dispatch_sub_id", "user", "userId"]);

      const docsDispatch = await apiClient.post(`/api/${this.dispatchDB}/query`, {
        filters: [{ field: "dispatch_sub_id", op: "==", value: dispatch_sub_id }]
      }).then(res => res.data?.data || []);
      if (docsDispatch.length === 0) {
        throw new Error("No dispatch found with the given sub ID.");
      }
      const dispatchData = docsDispatch.map((doc) => ({ id: doc._id, ...doc }));
      const previousRecord = dispatchData[0];

      const updatedData = {
        ...previousRecord,
        accept_user: user,
        accept_user_id: userId,
        accept_at: new Date(),
        status: "Delivered",
      };

      await apiClient.patch(`/api/${this.dispatchDB}/${previousRecord.id}`, updatedData);
      return updatedData;
    } catch (error) {
      console.error("Error updating stock data via dispatch:", error);
      return null;
    }
  }

}

export default FetchInventory;
export { AddInventory, UpdateInventory };
