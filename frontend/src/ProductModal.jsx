import React, { useState, useRef, useEffect } from "react";
import Button from "react-bootstrap/Button";
import { Editor } from "@tinymce/tinymce-react";
import Modal from "react-bootstrap/Modal";
import {storage} from './services/uploadService';
import {ref, getDownloadURL, uploadBytes} from './services/uploadService';
import DatePicker from "react-datepicker";
import "react-datepicker/dist/react-datepicker.css";
import { Form } from "react-bootstrap";

const productModalStyles = `
  .product-modal {
    margin-top: -1.25rem;
    display: flex;
    flex-direction: column;
    gap: 20px;
  }
  .modal-heading {
    font-size: 1.25rem;
    font-weight: 600;
    margin-bottom: 0.75rem;
  }
  .name-input {
    border: 1px solid #e5e7eb;
    height: 2.5rem;
    padding: 0.5rem;
    border-radius: 0.5rem;
    margin-bottom: 0.75rem;
  }
  .first-container {
    display: flex;
    gap: 2.5rem;
    padding: 0.4rem;
    border-radius: 0.75rem;
    background-color: rgba(231, 224, 224, 0.197);
  }
  .editor-container {
    width: 50%;
  }
  .detail-container {
    width: 50%;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .detail-first-sub-container {
    display: flex;
    gap: 0.5rem;
  }
  .category-and-brand {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    padding: 0.25rem 0.75rem;
    gap: 0.25rem;
    background-color: #f3f4f6;
    border-radius: 0.5rem;
    width: 50%;
  }
  .category-and-brand select {
    border-width: 2px;
    margin-top: 0.5rem;
    border-color: #d1d5db;
    border-radius: 0.375rem;
    background-color: #ffffff;
  }
  .detail-second-sub-container {
    display: flex;
    gap: 0.5rem;
  }
  .image-comtainer {
    background-color: #f3f4f6;
    border-radius: 0.5rem;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 0.5rem;
  }
  .tax-container {
    width: 50%;
    display: flex;
    flex-direction: column;
    gap: 0.75rem;
  }
  .tax-container .first {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    border-radius: 0.5rem;
    background-color: #f3f4f6;
    gap: 0.75rem;
    padding-left: 0.75rem;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }
  .tax-container h5 {
    font-weight: bold;
  }
  .tax-info {
    padding-right: 5px;
    border-radius: 0.5rem;
    background-color: #ffffff;
  }
  .tax-info input {
    width: 5rem;
    height: 2.5rem;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    border: none;
    border-top-left-radius: 0.5rem;
    border-bottom-left-radius: 0.5rem;
  }
  .date-container {
    display: flex;
    justify-content: flex-start;
    align-items: center;
    border-radius: 0.5rem;
    background-color: #f3f4f6;
    gap: 0.75rem;
    padding-left: 0.75rem;
    padding-top: 0.5rem;
    padding-bottom: 0.5rem;
  }
  .date {
    height: 2.5rem;
    width: 75%;
    background-color: #ffffff;
    border: none;
    border-radius: 0.5rem;
  }
  .second-container {
    padding: 0.4rem;
    border-radius: 0.75rem;
    background-color: rgba(231, 224, 224, 0.197);
  }
  .packing {
    width: 100%;
    display: flex;
    gap: 0.75rem;
    background-color: #f3f4f6;
    align-items: center;
    padding-left: 0.75rem;
    border-radius: 0.5rem;
  }
  .packing input {
    width: 5rem;
    height: 2.5rem;
    padding-left: 5px;
    border: none;
    border-top-left-radius: 0.5rem;
    border-bottom-left-radius: 0.5rem;
  }
  .packing select {
    width: 7rem;
    height: 2.5rem;
    border-width: 2px;
    margin-top: 0.5rem;
    border-color: #d1d5db;
    border: none;
    border-top-right-radius: 0.375rem;
    border-bottom-right-radius: 0.375rem;
    background-color: #ffffff;
  }
  .price {
    display: flex;
    gap: 0.75rem;
    background-color: #f3f4f6;
    justify-content: space-between;
    align-items: center;
    border-radius: 0.5rem;
    padding: 6px 0.75rem;
  }
  .price input {
    width: 5rem;
    height: 2.5rem;
    padding-left: 0.5rem;
    padding-right: 0.5rem;
    border: none;
    border-radius: 0.5rem;
  }
  .price button {
    font-size: small;
    color: white;
    border: none;
    border-radius: 0.75rem;
    background-color: rgb(56, 95, 221);
  }
`;
function ProductModal({
  show,
  handleClose,
  initialData,
  updateData,
  editProduct,
}) {
  const [submitProduct, setSubmitProduct] = useState(initialData);
  const fileInputRef = useRef(null);
  const [errMsgName, setErrMsgName] = useState("");
  const [errMsgDescription, setErrMsgDescription] = useState("");
  const [errMsgCategory, setErrMsgCategory] = useState("");
  const [errMsgBrand, setErrMsgBrand] = useState("");
  const [errMsgPrice, setErrMsgPrice] = useState("");
  const [errMsgPkg, setErrMsgPkg] = useState("");
  const [errMsgGst, setErrMsgGst] = useState("");
  const [errMsgLaunchDate, setErrMsgLaunchDate] = useState(false);
  const [unitError, setUnitError] = useState("");

  const handleAddPackagingOption = () => {
    setSubmitProduct((prevProduct) => ({
      ...prevProduct,
      packagingOptions: [
        ...prevProduct.packagingOptions,
        { packaging: "", price: "" },
      ],
    }));
  };

  useEffect(() => {
    setSubmitProduct(initialData);
  }, [initialData]);

  const handleChange = (e) => {
    const { name, value } = e.target;

    const specialCharRegex = /[!@#$%^&*(),.?":{}|<>]/;
    const positiveWholeNumber = /^\d+$/;

    if (name === "productName") {
      if (specialCharRegex.test(value)) {
        setErrMsgName("Product name cannot contain special characters");
      } else {
        setErrMsgName("");
      }
    } else if (name === "category") {
      if (value === "") {
        setErrMsgCategory("Please select the category");
      }
    } else if (name === "brand") {
      if (value === "") {
        setErrMsgBrand("Please select the brand");
      }
    } else if (name === "price") {
      if (value === "") {
        setErrMsgPrice("Please enter price");
      } else if (!positiveWholeNumber.test(value)) {
        setErrMsgPrice("Price must be a positive number");
      } else if (isNaN(parseFloat(value))) {
        setErrMsgPrice("Price must be number");
      } else {
        const formattedPrice = parseFloat(value).toFixed(2);
        setErrMsgPrice("");
        setSubmitProduct((prevState) => ({
          ...prevState,
          [name]: formattedPrice,
        }));
        setErrMsgPrice("");
      }
    } else if (name === "pkgUnit") {
      setUnitError(value ? "" : "Please select the unit.");
    } else if (name === "packaging") {
      if (!positiveWholeNumber.test(value)) {
        setErrMsgPkg("Please enter a number");
      } else {
        setErrMsgPkg("");
      }
    } else if (name === "gst") {
      if (!positiveWholeNumber.test(value)) {
        setErrMsgGst("Please enter a number");
      } else {
        setErrMsgGst("");
      }
    } else if (name === "launch_date") {
      if (value === "") {
        setErrMsgLaunchDate("Please select a launch date");
      } else {
        setErrMsgLaunchDate("");
      }
    } else {
      setErrMsgName("");
      setErrMsgDescription("");
      setErrMsgCategory("");
      setErrMsgBrand("");
      setErrMsgPrice("");
      setErrMsgPkg("");
      setUnitError("");
      setErrMsgGst("");
    }

    setSubmitProduct((prevState) => ({
      ...prevState,
      [name]: value,
    }));
  };
  const handleEditorChange = (content) => {
    setSubmitProduct((prevState) => ({
      ...prevState,
      productDescription: content,
    }));
    setErrMsgDescription(content ? "" : "Product description is required");
  };

  const handleDate = (date) => {
    if (date) {
      setSubmitProduct((prevState) => ({
        ...prevState,
        launchDate: date,
      }));
      setErrMsgLaunchDate("");
    } else {
      setErrMsgLaunchDate("Please select a valid date.");
    }
  };

  const handleImageChange = (e) => {
    if (e.target.files && e.target.files[0]) {
      const newImageName = `${e.target.files[0].name}_${Date.now()}`;
      const storageRef = ref(storage, `products_images/${newImageName}`);

      uploadBytes(storageRef, e.target.files[0]).then((data) => {
        getDownloadURL(data.ref).then((val) => {
          setSubmitProduct((prevState) => ({
            ...prevState,
            image: val,
            image_transparent_bg: val,
          }));
        });
      });
    }
  };

  const handleLogistic = () => {
    setSubmitProduct((prevState) => ({
      ...prevState,
      enableLogistic: !submitProduct.enableLogistic,
    }));
  };

  // const handleAppPublish = () => {

  //     setSubmitProduct(prevState => ({
  //         ...prevState,
  //         'publishOnApp': !submitProduct.publishOnApp
  //     }));

  // }

  const handlePublishonlyonCRM = () => {
    setSubmitProduct((prevState) => ({
      ...prevState,
      publishOnCRM: !submitProduct.publishOnCRM,
      inStock: false,
    }));
  };
  const handleB2BPublish = () => {
    setSubmitProduct((prevState) => ({
      ...prevState,
      publishOnB2B: !submitProduct.publishOnB2B,
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    updateData(submitProduct);
    handleClose();
  };

  const handlePackagingChange = (index, e) => {
    const { name, value } = e.target;
    
    const updatedPackagingOptions = [...submitProduct.packagingOptions];
    updatedPackagingOptions[index][name] = value;
    setSubmitProduct((prevProduct) => ({
      ...prevProduct,
      packagingOptions: updatedPackagingOptions,
    }));
  };

  const handleDeleteInput = (index) => {
    const updatedPackagingOptions = [...submitProduct.packagingOptions];
    updatedPackagingOptions.splice(index, 1);

    setSubmitProduct((prevProduct) => ({
      ...prevProduct,
      packagingOptions: updatedPackagingOptions,
    }));
  };

  return (
    <>
      <style>{productModalStyles}</style>
      <Modal show={show} onHide={handleClose} size="xl">
        <Modal.Header closeButton>
          <Modal.Title>Edit Product</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <form className="product-modal" onSubmit={handleSubmit}>
            <div className="">
              <span className="modal-heading">General Information : </span>
              <input
                className="name-input"
                type="text"
                placeholder="Product Name"
                name="productName"
                value={submitProduct.productName}
                onChange={handleChange}
                required
                autoComplete="off"
              />
              {errMsgName && (
                <span
                  style={{
                    color: "red",
                    fontSize: "12px",
                    display: "block",
                    marginBottom: "10px",
                  }}
                >
                  {errMsgName}
                </span>
              )}
            </div>
            <div className="first-container ">
              <div className="editor-container ">
                <Editor
                  apiKey="o7qiqe8bed298gt7bdpx1n1o2zi63hgfpom6rnyd6wmx5g79"
                  value={submitProduct.productDescription}
                  init={{
                    plugins:
                      "anchor autolink charmap codesample emoticons image link lists media searchreplace table visualblocks wordcount",
                    toolbar:
                      "undo redo | blocks fontfamily fontsize | bold italic underline strikethrough | link image media table | align lineheight | numlist bullist indent outdent | emoticons charmap | removeformat",
                  }}
                  onEditorChange={handleEditorChange}
                />
                {errMsgDescription && (
                  <span
                    style={{
                      color: "red",
                      fontSize: "12px",
                      display: "block",
                      marginTop: "5px",
                    }}
                  >
                    {errMsgDescription}
                  </span>
                )}
              </div>
              <div className="detail-container">
                <div className="detail-first-sub-container">
                  <div className="category-and-brand">
                    <strong>Category</strong>
                    <select
                      className=""
                      name="category"
                      value={submitProduct.category}
                      onChange={handleChange}
                      required
                    >
                      <option disabled selected>
                        Select Category
                      </option>
                      <option value="Dairy">Dairy</option>
                      <option value="Breads">Breads</option>
                    </select>
                    {errMsgCategory && (
                      <span
                        style={{
                          color: "red",
                          fontSize: "12px",
                          display: "block",
                        }}
                      >
                        {errMsgCategory}
                      </span>
                    )}
                  </div>
                  <div className="category-and-brand">
                    <strong>Brand</strong>
                    <select
                      className=""
                      name="brand"
                      value={submitProduct.brand}
                      onChange={handleChange}
                    >
                      <option disabled selected>
                        Select Brand
                      </option>
                      <option value="Whyte Farms" selected>
                        Whyte Farms
                      </option>
                    </select>
                    {errMsgBrand && (
                      <span
                        style={{
                          color: "red",
                          fontSize: "12px",
                          display: "block",
                          marginBottom: "10px",
                        }}
                      >
                        {errMsgBrand}
                      </span>
                    )}
                  </div>
                </div>
                <div className="detail-second-sub-container">
                  <div className="">
                    {submitProduct.image ? (
                      <div className="image-comtainer" style={{}}>
                        <img
                          src={submitProduct.image}
                          alt="Preview"
                          style={{
                            height: "250px",

                            marginTop: "10px",
                            display: "block",
                          }}
                        />
                        <input
                          type="file"
                          accept="image/*"
                          id="image"
                          className="form-control"
                          style={{
                            height: "34px",
                            padding: "6px 10px",
                            boxSizing: "border-box",
                            border: "2px solid #ccc",
                            borderRadius: "4px",
                            backgroundColor: "#f8f8f8",
                            fontSize: "16px",
                            resize: "none",
                          }}
                          onChange={handleImageChange}
                          ref={fileInputRef}
                        />
                      </div>
                    ) : (
                      <input
                        type="file"
                        accept="image/*"
                        id="image"
                        className="form-control"
                        style={{
                          height: "34px",
                          padding: "6px 10px",
                          boxSizing: "border-box",
                          border: "2px solid #ccc",
                          borderRadius: "4px",
                          backgroundColor: "#f8f8f8",
                          fontSize: "16px",
                          resize: "none",
                        }}
                        onChange={handleImageChange}
                        ref={fileInputRef}
                      />
                    )}
                  </div>
                  <div className="tax-container">
                    <div className="first">
                      <h5 className="">Tax Information</h5>
                      <span className="tax-info">
                        <input
                          className=""
                          type="number"
                          name="gst"
                          value={submitProduct.gst}
                          placeholder="GST"
                          onChange={handleChange}
                          required
                        />
                        <span className="percentage pr-2">%</span>
                      </span>

                      {errMsgGst && (
                        <span
                          style={{
                            color: "red",
                            fontSize: "12px",
                            display: "block",
                            marginBottom: "10px",
                          }}
                        >
                          {errMsgGst}
                        </span>
                      )}
                    </div>
                    <div className="date-container">
                      <h5 className="">Launch Date</h5>
                      <DatePicker
                        className="date h-10 w-3/4  bg-white rounded-lg"
                        name="launch_date"
                        selected={submitProduct.launchDate}
                        onChange={handleDate}
                        dateFormat="dd/MM/yyyy"
                        placeholderText="Select a launch date"
                      />

                      {errMsgLaunchDate && (
                        <span
                          style={{
                            color: "red",
                            fontSize: "12px",
                            display: "block",
                            marginBottom: "10px",
                          }}
                        >
                          {errMsgLaunchDate}
                        </span>
                      )}
                      {/* {submitProduct.launchDate && <p>Product launch date will be : {formatDate(submitProduct.launchDate)}</p>} */}
                    </div>
                    <div
                      className=""
                      style={{
                        backgroundColor: "#f3f4f6",
                        borderRadius: "0.75rem",
                        padding: "0.5rem",
                      }}
                    >
                      <Form.Switch
                        id="toggle-reverseLogistic"
                        label="Enable Reverse Logistic"
                        checked={submitProduct.enableLogistic}
                        onChange={handleLogistic}
                      />

                      {/* <Form.Switch
                                        id="toggle-enableOnApp"
                                        label="Enable on app"
                                        checked={submitProduct.publishOnApp}
                                        onChange={handleAppPublish}
                                    /> */}
                      <Form.Switch
                        id="toggle-enableOnApp"
                        label="Enable CRM only"
                        checked={submitProduct.publishOnCRM}
                        onChange={handlePublishonlyonCRM}
                      />
                      <Form.Switch
                        id="toggle-enableOnB2B"
                        label="Enable on B2B"
                        checked={submitProduct.publishOnB2B}
                        onChange={handleB2BPublish}
                      />
                    </div>
                  </div>
                </div>
              </div>
            </div>
            <div className="second-container">
              <div>
                <div
                  style={{
                    display: "flex",
                    flexWrap: "wrap",
                    gap: "0.5rem",
                  }}
                >
                  {submitProduct.packagingOptions.map((option, index) => {
                    return (
                      <div
                        key={index}
                        style={{
                          width: "300px",
                          backgroundColor: "#f3f4f6",
                          borderRadius: "0.75rem",
                        }}
                      >
                        <div className="packing">
                          <h5>Packaging</h5>
                          <div>
                            <input
                              type="text"
                              placeholder="Packaging"
                              name="packaging"
                              value={option.packaging}
                              onChange={(e) => handlePackagingChange(index, e)}
                              required
                            />
                            <select
                              name="pkgUnit"
                              value={option.pkgUnit}
                              onChange={(e) => handlePackagingChange(index, e)}
                              required
                            >
                              <option disabled selected>
                                Select Unit
                              </option>
                              <option value="ltr">Liter (ltr)</option>
                              <option value="ml">Milliliter (ml)</option>
                              <option value="kg">Kilogram (kg)</option>
                              <option value="g">Gram (g)</option>
                              <option value="pieces">Pieces</option>
                            </select>
                          </div>
                          {errMsgPkg && (
                            <span
                              style={{
                                color: "red",
                                fontSize: "12px",
                                display: "block",
                                marginBottom: "10px",
                              }}
                            >
                              {errMsgPkg}
                            </span>
                          )}

                          {unitError && (
                            <span
                              style={{
                                color: "red",
                                fontSize: "12px",
                                display: "block",
                                marginBottom: "10px",
                              }}
                            >
                              {unitError}
                            </span>
                          )}
                        </div>

                        <div className="price">
                          <h5>Price</h5>
                          <input
                            type="number"
                            placeholder="price"
                            name="price"
                            value={option.price}
                            onChange={(e) => handlePackagingChange(index, e)}
                            required
                          />
                          {errMsgPrice && (
                            <span
                              style={{
                                color: "red",
                                fontSize: "12px",
                                display: "block",
                                marginBottom: "10px",
                              }}
                            >
                              {errMsgPrice}
                            </span>
                          )}
                        </div>
                        <div className="price">
                          <h5>MRP</h5>
                          <input
                            type="number"
                            placeholder="MRP"
                            name="priceBeforeDiscount"
                            value={option.priceBeforeDiscount}
                            onChange={(e) => handlePackagingChange(index, e)}
                            required
                          />
                          {errMsgPrice && (
                            <span
                              style={{
                                color: "red",
                                fontSize: "12px",
                                display: "block",
                                marginBottom: "10px",
                              }}
                            >
                              {errMsgPrice}
                            </span>
                          )}
                          {submitProduct.packagingOptions.length > 1 && (
                            <button onClick={() => handleDeleteInput(index)}>
                              Remove Packaging
                            </button>
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>

                <Button
                  variant="primary"
                  onClick={handleAddPackagingOption}
                  style={{
                    marginTop: "8px",
                    justifyContent: "end",
                  }}
                >
                  Add More Packaging
                </Button>
              </div>
            </div>
          </form>
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={handleClose}>
            Close
          </Button>
          <Button variant="primary" onClick={handleSubmit}>
            Save Changes
          </Button>
        </Modal.Footer>
      </Modal>
    </>
  );
}

export default ProductModal;
