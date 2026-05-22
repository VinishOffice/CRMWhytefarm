import { validate } from "uuid";
import moment from "moment";
import AbandonedCartFilter from "./AbandonedCartFilter";
import TrialUsersFilter from "./TrialUsersFilter";
import { listCommunicationHistory, createCommunicationHistory } from "../../../services/communicationHistoryService";
import apiClient from "../../../services/apiClient";

const db = { 
  collection: (name) => ({
    where: (field, op, value) => ({
      limit: (n) => ({
        get: () => apiClient.post(`/api/${name}/query`, { filters: [{ field, op, value }], limit: n }).then(res => ({ docs: res.data?.data?.map(d => ({ id: d._id || d.id, data: () => d })) || [] }))
      }),
      get: () => apiClient.post(`/api/${name}/query`, { filters: [{ field, op, value }] }).then(res => ({ docs: res.data?.data?.map(d => ({ id: d._id || d.id, data: () => d })) || [] }))
    }),
    limit: (n) => ({
      get: () => apiClient.post(`/api/${name}/query`, { filters: [], limit: n }).then(res => ({ docs: res.data?.data?.map(d => ({ id: d._id || d.id, data: () => d })) || [] }))
    }),
    get: () => apiClient.post(`/api/${name}/query`, { filters: [] }).then(res => ({ docs: res.data?.data?.map(d => ({ id: d._id || d.id, data: () => d })) || [] }))
  })
};

const DEFAULT_LIMIT = 1;

const subscription_type = ['Custom', 'Everyday', 'On-Interval', 'One Time']

export const fetchCommunicationHistory = async ()=>{
    try{
        const resp = await listCommunicationHistory();
        const rows = resp?.data || [];
        return rows;
    } catch (error) {
        console.error("Error fetching communication history:", error);
        return [];
    }
}


export const newCommunicationHistory = async (data, loggedInUser) => {
    try {
        // Validate and log missing required fields
        const requiredFields = ["title", "medium", "msgData"];
        requiredFields.forEach(field => {
            if (!data?.[field]) console.warn(`Warning: Missing required field '${field}'`);
        });

        const communicationDoc = {
            title: data?.title || "N/A",
            medium: data?.medium || "N/A",
            stats: data?.stats || {},

            sms_template: data.medium.includes('SMS') ? data?.msgData?.sms?.template?.title || null : null,
            email_template: data.medium.includes('Email') ? data?.msgData?.email?.template?.elementName || null : null,
            whatsapp_template: data.medium.includes('WhatsApp') ? data?.msgData?.whatsapp?.template?.elementName || null : null,
            AbandonedCart: data.filter?.AbandendCart?.status ? data.filter.AbandendCart.date : null,
            TrialUser: data.filter?.TrailedUser?.status ? data.filter.TrailedUser.date : null,
            status: data?.filter?.status || "N/A",
            platform: data?.filter?.platform || "N/A",
            subscription_type: data?.filter?.subscription_type || "N/A",
            source: data?.filter?.source || "N/A",
            hub: data?.filter?.hub || "N/A",
            wallet_balance_range: data?.filter?.wallet || "N/A",
            created_date: new Date(),
            user_id: loggedInUser?.user_id || "N/A",
            created_by: {
                id: loggedInUser?.user_id || "N/A",
                role: loggedInUser?.role || "N/A",
                name: loggedInUser?.first_name || "Admin/Unknown User",
                phone: loggedInUser?.phone_no || "N/A",
                email: loggedInUser?.email || "N/A",
            },
            metadata: {
                status: "pending",
                timestamp: Date.now(),
                source: "web_app_CRM",
            },
        };


        // Save to backend (Mongo)
        const created = await createCommunicationHistory(communicationDoc);
        return { id: created?.id, ...communicationDoc };

    } catch (error) {
        console.error("Error in newCommunicationHistory:", error);
        return { success: false, message: "Failed to create communication history", error };
    }
};

const CUSTOMER_COLLECTION = "customers_data";
const SUBSCRIPTION_COLLECTION = "subscriptions_data";



export const fetchSubscribedCustomerDetails = async () => {
    let customers = [];
    
    try {
        const docs = await apiClient.post("/api/subscriptions_data/query", {
            filters: [{ field: "customer_id", op: "!=", value: "" }],
            limit: 3
        }).then(res => res.data?.data || []);

        customers = docs
            .map(({ customer_id }) => customer_id)
            .filter(id => typeof id === 'string' && !isNaN(Number(id)) && Number(id) >= 0);
    } catch (e) {
    } finally {
    }

    let customerData = [];
    if (customers.length > 0) {
        try {
            const docs = await apiClient.post("/api/customers_data/query", {
                filters: [{ field: "customer_id", op: "in", value: customers }],
                limit: 3
            }).then(res => res.data?.data || []);

            customerData = docs.map((data) => ({
                id: data._id || data.id,
                name: data.customer_name,
                phone: data.customer_phone,
                email: data.customer_email,
            }));
            return customerData;
        } catch (e) {
        } finally {
        }
    } else {
    }
}

export const fetchPausedCustomerDetails = async () => {
    let customers = [];
    
    try {
        const docs = await apiClient.post("/api/subscriptions_data/query", {
            filters: [{ field: "status", op: "==", value: "0" }],
            limit: 3
        }).then(res => res.data?.data || []);

        customers = docs
            .map(({ customer_id }) => customer_id) // Extract customer_id as strings
            .filter(id => typeof id === 'string' && !isNaN(Number(id)));
    } catch (e) {
    } finally {
    }

    // Fetching customer details from the customer collection
    let customerData = [];
    if (customers.length > 0) { // Only proceed if there are customer IDs
        try {
            const docs = await apiClient.post("/api/customers_data/query", {
                filters: [{ field: "customer_id", op: "in", value: customers }],
                limit: 3
            }).then(res => res.data?.data || []);

            customerData = docs.map((data) => ({
                id: data._id || data.id,
                name: data.customer_name,
                phone: data.customer_phone,
                email: data.customer_email,
            }));
            return customerData;
        } catch (e) {
        } finally {
        }
    } else {
    }
}


  // const fetchAllSubscriptionType = async () => {
  //   try {
  //     let types = [];
  //     const initialSnapshot = await collection("subscriptions_data")
  //       .where("subscription_type", "!=", "")
  //       .limit(1)
  //       .get();
  
  //     // Check if there are any documents in the initial snapshot
  //     if (!initialSnapshot.empty) {
  //       const initialType = initialSnapshot.docs[0].data(); // Access the first document
  //       types.push(initialType.subscription_type); // Push the initial type
  //     }
  
  //     while (true) {
  //       const snapshot = await collection("subscriptions_data")
  //         .where("subscription_type", "not-in", types)
  //         .limit(1)
  //         .get();
  
  //       // Check if the snapshot is empty
  //       if (snapshot.empty) {
  //         break; // Exit the loop if no more types are found
  //       }
  
  //       const temp = snapshot.docs[0].data(); // Access the first document
  //       types.push(temp.subscription_type); // Push the new type
  //     }
  
  
  //   } catch (e) {
  //   }
  // }



const handleError = (error) => {
    console.error("Error creating communication history:", error);
    const errorMap = {
        'permission-denied': "You don't have permission to create this record",
        'failed-precondition': "Invalid data provided",
        'unavailable': "Firestore service is currently unavailable",
        'default': "Failed to create communication history"
    };
    const errorMessage = errorMap[error.code] || errorMap['default'];
    throw new Error(errorMessage);
};

const validateData = (data) => {
    const requiredFields = ['title', 'customer_count', 'filter'];
    requiredFields.forEach(field => {
        if (!data[field]) {
            throw new Error(`Missing required field: ${field}`);
        }
    });
    if (data.customer_count <= 0) {
        throw new Error('Customer count must be greater than zero');
    }

    if (data.title.length > 100) {
        throw new Error('Title is too long (max 100 characters)');
    }
};



const subscriptionDB = "subscriptions_data"
const customerDB = "customers_data"

  export const fetchAllSubscription = async () => {
    try {
      const snapshot = await db.collection(subscriptionDB)
        .limit(30)
        .get();

        const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
            customer_id: doc.data().customer_id,
        }));
        return data;
  
    } catch (e) {
      return []
    }
  }

  export const fetchSubscription = async (filter) => {
    try {
      let query = db.collection(subscriptionDB);
  
      if (filter.status?.length === 1) {
        const isSubscriber = filter.status.includes("Subscribers");
        const status = isSubscriber ? "1" : "0";
        query = query.where("status", "==", status);
      }

      if (filter.type ?.length > 0) {
        query = query.where("subscription_type", "in", filter.type);
      }
  
      const snapshot = await query.limit(3).get();

      const data = snapshot.docs.map((doc) => ({
        id: doc.id,
        customer_id: doc.data().customer_id,
        status: doc.data().status,
        ...doc.data(),
      }));
      return data;
    } catch (error) {
      console.error("Error fetching subscriptions:", error.message);
      return [];
    }
  };
  
  
  
  export const fetchSubscriptionByStatus = async (status) => {
    try {
      const snapshot = await db.collection(subscriptionDB)
        .where("status", "==", status)
        .limit(30)
        .get();

        const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
            customer_id: doc.data().customer_id,
        }));
        return data;
  
    } catch (e) {
      return []
    }
  }
  export const fetchSubscriptionByType = async (type) => {
    try {
      const snapshot = await db.collection(subscriptionDB)
        .where("subscription_type", "in", type)
        .limit(30)
        .get();

        const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
            customer_id: doc.data().customer_id,
        }));
        return data;
  
    } catch (e) {
      return []
    }
  }
  export const fetchAllCustomers = async () => {
    try {
      const snapshot = await db.collection(customerDB)
        .limit(30)
        .get();

        const data = snapshot.docs.map((doc) => ({
            id: doc.id,
            data: doc.data(),
            customer_id: doc.data().customer_id,
        }));
        return data;
  
    } catch (e) {
      return []
    }
  }

  export const fetchSubscribedCustomer = async (customerIDs) => {
    try {
      if (!customerIDs || customerIDs.length === 0) return [];
  
      const chunks = chunkArray(customerIDs, 10); // Firebase allows max 10 "in" values
      const customerPromises = chunks.map((chunk) =>
        db
          .collection(customerDB)
          .where("customer_id", "in", chunk)
          .limit(3)
          .get()
      );
  
      const results = await Promise.all(customerPromises);
  
      return results.flatMap((querySnapshot) =>
        querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
        }))
      );
    } catch (e) {
      console.error("Error fetching subscribed customers:", e);
      return [];
    }
  };
  
  // Helper: Chunk array for "in" queries
  const chunkArray = (array, size) =>
    array.reduce((acc, _, i) => (i % size ? acc : [...acc, array.slice(i, i + size)]), []);
  

  export const fetchCustomer = async (filter) => {
    try {
      let query = db.collection(customerDB);
  
      if (filter.hub && filter.hub.length > 0) {
        query = query.where("hub_name", "in", filter.hub);
      }
  
      const min = filter.wallet.min ?? -1e10;
      const max = filter.wallet.max ?? 1e10;
  
      if (!isNaN(min)) {
        query = query.where("wallet_balance", ">=", min);
      }
      if (!isNaN(max)) {
        query = query.where("wallet_balance", "<=", max);
      }
  
      const snapshot = await query.limit(3).get();
      return snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));
    } catch (e) {
      console.error("Error fetching customers:", e);
      return [];
    }
  };
  
  export const fetchCustomerbyWalletRange = async (min, max) => {
    try {
        const filters = [];
        if(min && !isNaN(min)){
            filters.push({ field: "wallet_balance", op: ">=", value: min });
        }
        if(max && !isNaN(max)){
            filters.push({ field: "wallet_balance", op: "<=", value: max });
        }
        const docs = await apiClient.post(`/api/${customerDB}/query`, {
            filters,
            limit: 3
        }).then(res => res.data?.data || []);

        const customerData = docs.map((data) => ({
            id: data._id || data.id,
            data: data,
            name: data.customer_name,
            phone: data.customer_phone,
            email: data.customer_email,
        }));
        return customerData;
    } catch (e) {
        return [];
    } finally {
    }
  }
