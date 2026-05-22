import React, { useEffect, useState } from "react";
import Swal from "sweetalert2";
import DateInput from "../../components/Date";
import moment from "moment";
import { FaStore, FaShoppingCart } from "react-icons/fa";
import apiClient from "../../services/apiClient";
import { fromDate } from '../../utils/dateUtils';

const PlaceOrderModal = ({ orderFormData }) => {
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
  const [errors] = useState({});
  const [productList, setProductList] = useState([]);
  const [productsLoading, setProductsLoading] = useState(false);
  const [quantityOptions, setQuantityOptions] = useState([]);
  const [productPrice, setProductPrice] = useState("");
  const [selectedProductData, setSelectedProductData] = useState(null);
  const [loading, setLoading] = useState(false);
  const today = new Date();
  const tomorrow = new Date(today);
  tomorrow.setDate(today.getDate() + 1);
  const initialOrderFormData = {
    product_name: "",
    package_unit: "",
    quantity: "",
    delivery_date: tomorrow,
  };
  const [formData, setFormData] = useState({ ...initialOrderFormData });

  const resetForm = () => {
    setFormData({ ...initialOrderFormData });
  };

  const handleClose = () => {
    resetForm();
  };

  const generateOrderId = () => {
    const timestamp = Date.now().toString();
    const randomComponent = Math.floor(Math.random() * 100);
    const uniqueOrderId =
      (timestamp % 100000000).toString().padStart(6, "0") +
      randomComponent.toString().padStart(2, "0");
    return uniqueOrderId;
  };

  const generateChallanNumber = async () => {
    const docs = await apiClient.post("/api/b2b_orders/query", {
        filters: [],
        sort: [{ field: "created_at", direction: "desc" }],
        limit: 1
    }).then(res => res.data?.data || []);

    if (docs.length > 0) {
      const lastOrder = docs[0];
      if (lastOrder && lastOrder.hasOwnProperty("delivery_challan_no")) {
        const parts = lastOrder.delivery_challan_no.split('-');
        let incrementedNumber = String(Number(parts[0]) + 1);

        // Add leading zeros if needed
        while (incrementedNumber.length < 5) {
          incrementedNumber = "0" + incrementedNumber;
        }

        return `${incrementedNumber}-${parts[1]}-${parts[2]}`;
      }
    }

    const currentYear = moment(new Date()).format("YY");
    const nextYear = String(Number(moment(new Date()).format("YY")) + 1);
    return `00001-${currentYear}-${nextYear}`;
  };

  const handleSubmit = async (e) => {
    setLoading(true);
    e.preventDefault();

    try {
      const updatedData = {
        ...orderFormData,
        formData,
      };


      const deliveryDate = new Date(updatedData.formData.delivery_date);
      if (isNaN(deliveryDate.getTime()) || deliveryDate.getTime() < 0) {
        Toast.fire({
          icon: "error",
          title: "Invalid delivery date",
        });
        return;
      }


      if (updatedData.type === "E-Commerce") {
        updatedData.cafe_location = "";
      }


      const user = localStorage.getItem("loggedIn_user") || "no user";
      const userId = localStorage.getItem("userId") || null;


      const orderId = await generateOrderId();
      const challanNumber = await generateChallanNumber();


      const quantity = Number(updatedData.formData.quantity);
      const totalAmount = productPrice * quantity;


      const orderDetails = {
        order_id: orderId,
        delivery_challan_no: challanNumber,
        cafe_id: updatedData.cafe_id,
        created_date: new Date().toISOString().split("T")[0],
        created_at: new Date(),
        created_by: user,
        created_by_user_id: userId,
        order_date: new Date().toISOString().split("T")[0],
        order_type: updatedData.type,
        package_unit: updatedData.formData.package_unit,
        product_name: updatedData.formData.product_name,
        quantity: quantity,
        delivering_to: updatedData.cafe_name,
        delivery_date: deliveryDate.toISOString().split("T")[0],
        delivery_timestamp: fromDate(deliveryDate),
        hub_name: updatedData.delivery_hub,
        location: updatedData.cafe_location || updatedData.cafe_address,
        total_amount: totalAmount,
        status: 0,
        updated_at: null,
        updated_by: null,
        updated_date: null,
        cancelled_reason: "",
        cancelled_time: "",
        customer_id: "",
        customer_name: "",
        customer_phone: "",
        delivery_exe_id: "",
        delivery_time: "00:00:00",
        handling_charges: 0,
        marked_delivered_by: "",
        price: productPrice,
        subscription_id: "0",
        tax: 0,
      };


      await apiClient.post("/api/b2b_orders/add", orderDetails);


      resetForm();
      window.modelhidePlaceOrder();
      Toast.fire({
        icon: "success",
        title: "Order Created",
      });

    } catch (error) {

      console.error("Error creating order:", error);
      Toast.fire({
        icon: "error",
        title: "Error creating order",
      });
    } finally {
      setLoading(false);
    }
  };

  const [date, setDate] = useState(null);

  useEffect(() => {
    setFormData((prevData) => ({
      ...prevData,
      delivery_date: date,
    }));
  }, [date]);
  const handleChange = async (event) => {
    const { id, value } = event.target;
    setFormData((prevData) => ({
      ...prevData,
      [id]: value,
    }));

    if (id === "product_name") {
      const selectedProduct = productList.find(
        (product) => product.value === value
      );
      if (selectedProduct) {
        const productData = await apiClient.post("/api/products_data/query", {
            filters: [{ field: "_id", op: "==", value: selectedProduct.id }]
        }).then(res => res.data?.data?.[0]);
        if (productData) {
            setSelectedProductData(productData);
            const packageOptions = productData.packagingOptions.map((option) => ({
              value: `${option.packaging} ${option.pkgUnit}`,
              label: `${option.packaging} ${option.pkgUnit}`,
              price: option.price,
            }));
            setQuantityOptions(packageOptions);
        }
      }
    }
    if (id === "package_unit") {
      const selectedOption = quantityOptions.find(
        (option) => option.value === value
      );
      if (selectedOption) {
        const selectedPackaging = selectedProductData.packagingOptions.find(
          (option) => `${option.packaging} ${option.pkgUnit}` === value
        );
        if (selectedPackaging) {
          setProductPrice(selectedPackaging.price);
        }
      }
    }
  };

  const fetchProductList = async () => {
    setProductsLoading(true);
    try {
      const docs = await apiClient.post("/api/products_data/query", {
          filters: [{ field: "publishOnB2B", op: "==", value: true }]
      }).then(res => res.data?.data || []);
      const products = docs.map((data) => {
        return {
          id: data._id,
          value: `${data.productName}`,
          label: `${data.productName}`,
        };
      });
      setProductList(products);
    } catch (error) {
      console.error("Error fetching products: ", error);
    } finally {
      setProductsLoading(false);
    }
  };

  useEffect(() => {
    fetchProductList();
  }, []);

  return (
    <>
      {loading && (
        <div className="loader-overlay">
          <div className="">
            <img
              alt="loader"
              style={{
                height: "6rem",
              }}
              src="images/loader.gif"
            ></img>
          </div>
        </div>
      )}
    <div className="modal-header flex-column align-items-start">
  {/* Cafe Name with Icon */}
  <div className="d-flex align-items-center gap-2 mb-1">
    {orderFormData?.type === "Cafe" ? (
      <FaStore size={18} color="#ff9800" />
    ) : (
      <FaShoppingCart size={18} color="#3f51b5" />
    )}
    <span style={{ fontWeight: 500, fontSize: "15px", color: "#333" }}>
      {orderFormData?.cafe_name || "N/A"}
    </span>
  </div>

  {/* Place Order Heading */}
  <h5
    className="modal-title"
    style={{ fontWeight: "bold", fontSize: "16px", marginBottom: 0 }}
  >
    Place Order
    </h5>

        <button
    type="button"
    className="close position-absolute"
    style={{ right: "1rem", top: "1rem" }}
    data-bs-dismiss="modal"
    aria-label="Close"
    onClick={handleClose}
  >
    <span aria-hidden="true">&times;</span>
  </button>
</div>
      <div className="modal-body" style={{ maxHeight: "90vh", overflow: "auto" }}>
        <form className="myForm" onSubmit={handleSubmit}>
          <div className="form-group row">
            <div className="flex mb-3">
              <label>
                Product<sup style={{ color: "red" }}>*</sup>
              </label>
              <select
                className={`form-control ${errors.product_name ? "is-invalid" : ""
                  }`}
                onChange={handleChange}
                id="product_name"
                value={formData.product_name}
                required
                disabled={productsLoading}
              >
                <option value="">Select Product</option>
                {productList.map((product) => (
                  <option key={product.value} value={product.value}>
                    {product.label}
                  </option>
                ))}
              </select>
            </div>
            <div className="flex flex-row items-center gap-2">
              <div>
                <label>
                  Package Unit<sup style={{ color: "red" }}>*</sup>
                </label>
                <select
                  className={`form-control ${errors.package_unit ? "is-invalid" : ""
                    }`}
                  onChange={handleChange}
                  id="package_unit"
                  value={formData.package_unit}
                  required
                >
                  <option value="">Select Packaging</option>
                  {quantityOptions.map((quantityOptions) => (
                    <option
                      key={quantityOptions.value}
                      value={quantityOptions.value}
                    >
                      {quantityOptions.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="w-full d-flex flex-col gap-2">
            <div className="form-group row">
              <div>
                <label>
                  Quantity<sup style={{ color: "red" }}>*</sup>
                </label>
                <input
                  style={{
                    padding: "6px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    width: "200px",
                    backgroundColor: "#E9ECEF",
                  }}
                  type="number"
                  onChange={handleChange}
                  id="quantity"
                  value={formData.quantity}
                  required
                  autoComplete="off"
                  placeholder="Enter Quantity"
                  min="1"
                  step="1"
                />
                {errors.quantity && (
                  <div className="invalid-feedback">
                    Please enter a valid positive integer for quantity.
                  </div>
                )}
              </div>
            </div>

            <div className="form-group row">
              <div className="flex flex-row">
                <label>
                  Select Delivery Date<sup style={{ color: "red" }}>*</sup>:{" "}
                </label>
                <div>
                  <DateInput
                    date={date}
                    setDate={setDate}
                    style={{ width: "200px", backgroundColor: "#E9ECEF" }}
                  />
                </div>
              </div>
            </div>
          </div>

          <div className="modal-footer">
            <button type="submit" value="submit" className="btn btn-success">
              Submit
            </button>
            <button
              type="button"
              className="btn btn-light"
              data-bs-dismiss="modal"
              onClick={handleClose}
            >
              Cancel
            </button>
          </div>
        </form>
      </div>
    </>
  );
};

export default PlaceOrderModal;
