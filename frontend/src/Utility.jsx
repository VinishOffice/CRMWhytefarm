
import { reconcileWallet as reconcileWalletApi } from "./services/walletService";
import moment from 'moment';
import apiClient from "./services/apiClient";

export const getUserInfo = () => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    const userId = localStorage.getItem("userId");
    const username = localStorage.getItem("username");
    const loggedIn_user = localStorage.getItem("loggedIn_user");
    const role = localStorage.getItem("role");
    const hub_name = localStorage.getItem("hub_name");
    

    return { loggedIn, userId, username , loggedIn_user,role,hub_name };
};


export const handleLogout = () =>{
    localStorage.removeItem("loggedIn");
    localStorage.removeItem("userId");
    localStorage.removeItem("username");
    localStorage.removeItem("loggedIn_user");
    localStorage.removeItem("role");
}

export function calculateChanges(old_data, submit) {
    let changes = {};

    for (let key in submit) {
        if (submit.hasOwnProperty(key) && key !== 'created_date' && key !== 'updated_date') {
            if (key === 'due_date') {
                let oldDueDate, newDueDate;
                try {
                    oldDueDate = moment(old_data[key].toDate().toISOString()).format("YYYY-MM-DD");
                } catch (e) {
                    oldDueDate = moment(old_data[key]).format("YYYY-MM-DD");
                }

                try {
                    newDueDate = moment(submit[key].toDate().toISOString()).format("YYYY-MM-DD");
                } catch (e) {
                    newDueDate = moment(submit[key]).format("YYYY-MM-DD");
                }

                if (oldDueDate !== newDueDate) {
                    changes[key] = {
                        old: oldDueDate,
                        new: newDueDate
                    };
                }
            } else if (submit[key] !== old_data[key]) {
                changes[key] = {
                    old: old_data[key],
                    new: submit[key]
                };
            }
        }
    }

    return changes;
}

export async function reconsileWallet(customer_id) {
    const transaction_id = prompt("Please Enter the last correct transaction id", "");
    if (transaction_id === null || transaction_id === "") {
        alert("Please enter the correct transaction id");
        return;
    }
    await reconcileWalletApi(customer_id, transaction_id);
}

export function generateRandomId() {
    const now = new Date();
    const timestamp = now.getTime(); // Get the timestamp in milliseconds since January 1, 1970
    const random4Digits = Math.floor(Math.random() * 10000)
      .toString()
      .padStart(4, "0"); 

    const customerId =
      (timestamp % 10000).toString().padStart(4, "0") + random4Digits;

    return customerId;
  }





  export class DateTimeUtil {
    // Get today's date as a Date object
    static today() {
      return new Date();
    }
  
    // Get today's date in dd/mm/yyyy format
    static todayDate() {
      const today = new Date();
      return this.formatDate(today);
    }
  
    // Get current time in hh:mm:ss format
    static todayTime() {
      const today = new Date();
      return this.formatTime(today);
    }
  
    // Convert timestamp to date in dd/mm/yyyy format
    static timestampToDate(timestamp) {
      const date = new Date(timestamp);
      return this.formatDate(date);
    }
  
    // Convert timestamp to time in hh:mm:ss format
    static timestampToTime(timestamp) {
      const date = new Date(timestamp);
      return this.formatTime(date);
    }
  
    // Convert timestamp to time in hh:mm AM/PM format
    static timestampToTimeAMPM(timestamp) {
      const date = new Date(timestamp);
      return this.formatTimeAMPM(date);
    }
  
    // Convert date in dd/mm/yyyy format to yyyy/mm/dd format
    static dateToISOFormat(dateString) {
        const [day, month, year] = dateString.split('/');
        return `${year}/${month}/${day}`;
    }
    
    // Convert timestamp to yyyy/mm/dd format
    static timestampToISODate(timestamp) {
        if (!(timestamp instanceof Date) && isNaN(timestamp)) {
          console.error("Input must be a valid timestamp or Date object", timestamp);
          return null;
        }
    
        const date = new Date(timestamp);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
        const day = String(date.getDate()).padStart(2, "0");
        
        return `${year}/${month}/${day}`;
      }
    
    // Convert date in dd/mm/yyyy format to timestamp
    static dateToTimestamp(dateString) {
      const [day, month, year] = dateString.split('/');
      const date = new Date(`${month}/${day}/${year}`);
      return date.getTime();
    }
  
    // Helper function to format date to dd/mm/yyyy
    static formatDate(date) {
      const day = String(date.getDate()).padStart(2, '0');
      const month = String(date.getMonth() + 1).padStart(2, '0'); // Months are 0-indexed
      const year = date.getFullYear();
      return `${day}/${month}/${year}`;
    }
  
    // Helper function to format time to hh:mm:ss
    static formatTime(date) {
      const hours = String(date.getHours()).padStart(2, '0');
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const seconds = String(date.getSeconds()).padStart(2, '0');
      return `${hours}:${minutes}:${seconds}`;
    }
  
    // Helper function to format time to hh:mm AM/PM
    static formatTimeAMPM(date) {
      let hours = date.getHours();
      const minutes = String(date.getMinutes()).padStart(2, '0');
      const ampm = hours >= 12 ? 'PM' : 'AM';
      hours = hours % 12;
      hours = hours ? hours : 12; // the hour '0' should be '12'
      const strTime = `${hours}:${minutes} ${ampm}`;
      return strTime;
    }

    
    // Convert date in dd/mm/yyyy format to yyyy-mm-dd format
    static dateToISOHyphenFormat(dateString) {
      const [day, month, year] = dateString.split('/');
      return `${year}-${month}-${day}`;
  }

  // Convert timestamp to yyyy-mm-dd format
  static timestampToISOHyphenDate(timestamp) {
      if (!(timestamp instanceof Date) && isNaN(timestamp)) {
        console.error("Input must be a valid timestamp or Date object", timestamp);
        return null;
      }

      const date = new Date(timestamp);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
      const day = String(date.getDate()).padStart(2, "0");
      
      return `${year}-${month}-${day}`;
  }
    // Convert timestamp to yyyy/mm/dd format
    static timestampFromDBToISODate(timestamp) {
      if (!(timestamp instanceof Date) && isNaN(timestamp)) {
        console.error("Input must be a valid timestamp or Date object", timestamp);
        return null;
      }
  
      const date = new Date(timestamp.seconds*1000);
      const year = date.getFullYear();
      const month = String(date.getMonth() + 1).padStart(2, "0"); // Months are 0-indexed
      const day = String(date.getDate()).padStart(2, "0");
      
      return `${year}/${month}/${day}`;
    }

    // Convert timestamp to time in hh:mm AM/PM format
    static timestampFromDBToTimeAMPM(timestamp) {
      const date = new Date(timestamp.seconds*1000);
      return this.formatTimeAMPM(date);
    }

  }
  


  export class TimeAgo {
    constructor() {}
  
    // Convert timestamp to "time ago" string
    static fromTimestamp(timestamp) {
      const now = new Date();
      const time = new Date(timestamp);
      const difference = now - time;
  
      if (isNaN(difference) || difference < 0) {
        return "Invalid time";
      }
  
      const seconds = Math.floor(difference / 1000);
      const minutes = Math.floor(seconds / 60);
      const hours = Math.floor(minutes / 60);
      const days = Math.floor(hours / 24);
      const weeks = Math.floor(days / 7);
      const months = Math.floor(days / 30);
      const years = Math.floor(days / 365);
  
      if (seconds < 60) {
        return `${seconds} second${seconds !== 1 ? "s" : ""} ago`;
      } else if (minutes < 60) {
        return `${minutes} minute${minutes !== 1 ? "s" : ""} ago`;
      } else if (hours < 24) {
        return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
      } else if (days < 7) {
        return `${days} day${days !== 1 ? "s" : ""} ago`;
      } else if (weeks < 4) {
        return `${weeks} week${weeks !== 1 ? "s" : ""} ago`;
      } else if (months < 12) {
        return `${months} month${months !== 1 ? "s" : ""} ago`;
      } else {
        return `${years} year${years !== 1 ? "s" : ""} ago`;
      }
    }
  }

  //Get customer details (tushar)
export const getCustomerDetails = async (customer_id) => {
  try {
    const res = await apiClient.post("/api/customers_data/query", {
      filters: [{ field: "customer_id", op: "==", value: customer_id }],
      limit: 1
    });
    
    const docs = res.data?.data;
    if (!docs || docs.length === 0) return false;
    return docs[0];
  } catch (err) {
  }
};

export const getProdutDetails = async (productName) => {
  try {
    const res = await apiClient.post("/api/products_data/query", {
      filters: [{ field: "productName", op: "==", value: productName }],
      limit: 1
    });
    
    const docs = res.data?.data;
    if (!docs || docs.length === 0) return false;
    return docs[0];
  } catch (err) {
  }
};

export const makingRef = async (collectionName, doc_id) => {
   try {
    if (doc_id) {
      const res = await apiClient.post(`/api/${collectionName}/query`, {
        filters: [{ field: "task_id", op: "==", value: doc_id }],
        limit: 1
      });
      const first = res.data?.data?.[0];
      if (!first) return null;
      return {
        id: first._id,
        update: async (data) => apiClient.patch(`/api/${collectionName}/${first._id}`, { data }),
        set: async (data) => apiClient.put(`/api/${collectionName}/${first._id}`, { data }),
        delete: async () => apiClient.delete(`/api/${collectionName}/${first._id}`)
      };
    } else {
      return {
         add: async (data) => apiClient.post(`/api/${collectionName}`, { data })
      };
    }
   } catch (error) {
   }
};

export const getAllData = async (collectionName) => {
  try {
    const res = await apiClient.get(`/api/${collectionName}`);
    const docs = res.data?.data;
    if (docs && docs.length > 0) {
      return docs.map(doc => ({ id: doc._id, data: () => doc }));
    }
    return null;
  } catch (error) {
  }
}
