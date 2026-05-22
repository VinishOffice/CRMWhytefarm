import React, { useEffect } from 'react';
import { Col, Dropdown } from 'react-bootstrap';
import { useInventoryContext } from '../InventoryContext';


export const HubDropdown = ({
  selectedHub,
  setSelectedHub,
  defaultHub = "All Hubs", // Renamed for better clarity and provided a default value
}) => {
  const { hubs } = useInventoryContext();

  useEffect(() => {
    setSelectedHub(defaultHub); // Initialize with default hub
    return () => {
      setSelectedHub(defaultHub); // Reset to default on unmount
    };
  }, [setSelectedHub, defaultHub]);

  return (
    <div className="d-flex justify-content-end align-items-center">
      <Dropdown>
        <Dropdown.Toggle variant="secondary" id="hub-dropdown">
          {selectedHub || "Select Hub"}
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {/* Default Option */}
          <Dropdown.Item onClick={() => setSelectedHub(defaultHub)}>
            {defaultHub}
          </Dropdown.Item>
          {/* Dynamically Rendered Hub Options */}
          {hubs?.map(({ hub_name }, index) => (
            <Dropdown.Item
              key={index}
              onClick={() => setSelectedHub(hub_name)}
            >
              {hub_name}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};


export const ProductDropdown = ({
  selectedProduct,
  setSelectedProduct,
  defaultProduct = "All Products", // Default value for better reusability
}) => {
  const { products } = useInventoryContext();

  useEffect(() => {
    setSelectedProduct(defaultProduct); // Initialize with the default product
    return () => {
      setSelectedProduct(defaultProduct); // Reset on unmount
    };
  }, [setSelectedProduct, defaultProduct]);

  return (
    <div className="d-flex justify-content-end align-items-center">
      <Dropdown>
        <Dropdown.Toggle variant="secondary" id="product-dropdown">
          {selectedProduct || "Select Product"}
        </Dropdown.Toggle>
        <Dropdown.Menu>
          {/* Default Option */}
          <Dropdown.Item onClick={() => setSelectedProduct(defaultProduct)}>
            {defaultProduct}
          </Dropdown.Item>
          {/* Dynamically Rendered Product Options */}
          {products?.map(({ productName }, index) => (
            <Dropdown.Item
              key={index}
              onClick={() => setSelectedProduct(productName)}
            >
              {productName}
            </Dropdown.Item>
          ))}
        </Dropdown.Menu>
      </Dropdown>
    </div>
  );
};

export default { HubDropdown, ProductDropdown };

