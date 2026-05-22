
import moment from "moment";
export const mapCartProducts = (details) => {
    const summaryMap = new Map();
    const uniqueCustomers = new Map();
    let totalCount = 0;
  
   
// First loop: For building the summaryMap
details.forEach((customer) => {
  // Create a set to track already processed product_names for this customer
  const processedProductNames = new Set();

  customer.products.forEach((item) => {
    // Only process unique product names for each customer
    if (!processedProductNames.has(item.product_name)) {
      // Mark this product as processed for this customer
      processedProductNames.add(item.product_name);

      if (summaryMap.has(item.product_name)) {
        const existing = summaryMap.get(item.product_name);
        existing.quantity += item.quantity;
        existing.customer_list.push(customer);
      } else {
        summaryMap.set(item.product_name, {
          quantity: item.quantity,
          title: item.product_name,
          customer_list: [customer],
        });
      }

      // totalCount += item.quantity; // Keep track of the total quantity
    }
  });
});

// Second loop: For building the uniqueCustomers map
details.forEach((customer) => {
  customer.products.forEach((item) => {
    if (!uniqueCustomers.has(customer.customer_id)) {
      uniqueCustomers.set(customer.customer_id, {
        customer_id: customer.customer_id,
        customer_name: customer.customer_name,
        customer_phone: customer.customer_phone,
        quantity: item.quantity,
        products: [{ product: item.product_name, quantity: item.quantity }],
      });
    } else {
      const existingCustomer = uniqueCustomers.get(customer.customer_id);
      existingCustomer.quantity += item.quantity;
      const productEntry = existingCustomer.products.find(
        (p) => p.product === item.product_name
      );
      if (productEntry) {
        productEntry.quantity += item.quantity;
      } else {
        existingCustomer.products.push({
          product: item.product_name,
          quantity: item.quantity,
        });
      }
    }

    totalCount += item.quantity;
    
  });
});
  
    summaryMap.set("Total Quantity", {
      quantity: totalCount,
      title: "Total Quantity",
      customer_list: details,
    });
  
    return Object.fromEntries(summaryMap);
  };


  export const CartMatrix = (details, columns) => {
    const matrix = [];
    let columnMap = new Map();
    
    // Map each column name to its index
    columns.forEach((item, index) => {
      columnMap.set(item, index);
    });
    
  
    details?.forEach((customer) => {
      // Initialize a row with empty strings, same length as columns
    const row = Array(columns.length).fill(0).map((value, index) => 
      columns[index].includes("added") ? "" : value
    );
    

  
      // Populate row with customer details
      row[columnMap.get("Customer Name")] = customer.customer_name || "N/A";
      row[columnMap.get("Customer Phone")] = customer.customer_phone || "N/A";
      row[columnMap.get("Customer ID")] = customer.customer_id || "N/A";
  
      // Initialize total count for this customer
      let totalCount = 0;
      customer.products?.forEach((item) => {
        // Add product quantity to the corresponding column
        if (columnMap.has(item.product_name)) {
          const currentQuantity = parseInt(row[columnMap.get(item.product_name)], 10) || 0;
          row[columnMap.get(item.product_name)] = currentQuantity + item.quantity || 0;
        }
        if (columnMap.has(`${item.product_name} added on`)) {
          row[columnMap.get(`${item.product_name} added on`)] = `${moment(item.Timestamp).format("DD-MM-YYYY")}  ${moment(item.Timestamp).format("hh:mm:ss A")} `|| "no date";
        }
        // if (columnMap.has(`${item.product_name} added at`)) {
        //   row[columnMap.get(`${item.product_name} added at`)] = moment(item.Timestamp).format("hh:mm:ss A") || "no time";
        // }
        // Update total count
        totalCount += item.quantity;
      });
  
      // Populate the "Total Quantity" column
      if (columnMap.has("Total Quantity")) {
        row[columnMap.get("Total Quantity")] = totalCount;
      }
  
      // Push the completed row to the matrix
      matrix.push(row);
    });
  
    return {
      columns,
      data: matrix,
    };
  };
  
  // export const CartMatrix1 = (details, columns) => {
  //   const matrix = [];
  //   let totalCount = 0;
  //   let columnMap = new Map()
  //   columns.forEach((item, index) => {
  //     columnMap.set(item, index)
  //     })
  //   details.forEach((customer) => {
      
      
  //     let row = [] 
  
  //     customer.products.forEach((item) => {
  //       // Only process unique product names for each customer
  //       if (!processedProductNames.has(item.product_name)) {
  //         // Mark this product as processed for this customer
  //         processedProductNames.add(item.product_name);
  
  //         // Add the product information as a row in the matrix
  //         matrix.push([
  //           row[item.product_name] += item.quantity
  //           customer.customer_id,           // Customer ID
  //           customer.customer_name || 'N/A',// Customer Name
  //           customer.customer_phone || 'N/A',// Customer Phone
  //           item.subscription_type || 'N/A',// Subscription Type
  //           item.Timestamp,                 // Timestamp
  //         ]);
  
  //         totalCount += item.quantity;
  //       }
  //     });
  //   });
  
  //   return {
  //     columns,
  //     data: matrix,
  //   };
  // };
  