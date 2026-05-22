// InventoryContext.js
import React, { createContext, useContext, useState } from 'react';

const InventoryContext = createContext();
 
export const InventoryProvider = ({ children }) => {
    const [user, setUser] = useState({});
    const [cummulativeDeliveryList, setCummulativeDeliveryList] = useState([]);
    const [hubProducts, setHubWiesProduct] = useState([]);
    const [bufferPercentage, setBufferPercentage] = useState(20);
    const [defaultStock, setDefaultStock] = useState(100);
    const [hubs, setHubs] = useState([]);
    const [products, setProducts] = useState([]);
    const [selectedHub, setSelectedHub] = useState('All Hub');
    const [loading, setLoading] = useState(false);
    const [dispatches, setDispatches] = useState([]);
    const [farmsDispatches, setFarmsDispatches] = useState([]);
    const [hubDispatches, setHubDispatches] = useState([]);
    const [stockHistory, setStockHistory] = useState([]);
    const [stockData, setStockData] = useState([]);
    const [farmstockHistory, setFarmStockHistory] = useState([]);
    const [farmstockData, setFarmStockData] = useState([]);
    const [B2BPridiction, setB2BPridiction] = useState([]);
    const [role, setRole] = useState('');
    const [orders, setOrders] = useState([]);
    const [deliveryExecutive, setDeliveryExecutive] = useState(null);

    const handleCustomerID = (customer_id) => {
        window.open(`/profile/${customer_id}`, "_blank");
      };
    return (
        <InventoryContext.Provider value={{
            user,
            setUser,
            cummulativeDeliveryList,
            setCummulativeDeliveryList,
            hubProducts, 
            setHubWiesProduct,
            bufferPercentage,
            setBufferPercentage,
            defaultStock,
            setDefaultStock,
            hubs,
            setHubs,
            products,
            setProducts,
            selectedHub,
            setSelectedHub,
            loading,
            setLoading,
            dispatches,
            setDispatches,
            hubDispatches,
            setHubDispatches,
            stockHistory,
            setStockHistory,
            stockData,
            setStockData,
            farmstockHistory,
            setFarmStockHistory,
            farmstockData, 
            setFarmStockData,
            setB2BPridiction,
            B2BPridiction,
            role,
            setRole,
            orders, 
            setOrders,
            deliveryExecutive,
            setDeliveryExecutive,
            handleCustomerID,
            farmsDispatches, setFarmsDispatches,

        }}>
            {children}
        </InventoryContext.Provider>
    );
};

export const useInventoryContext = () => {
    const context = useContext(InventoryContext);
    if (!context) {
        throw new Error('useInventoryContext must be used within an InventoryProvider');
    }
    return context;
};