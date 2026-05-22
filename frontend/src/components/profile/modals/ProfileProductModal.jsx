import React from "react";
import DatePicker from "react-datepicker";

const productModalStyles = `
  .modal-content {
    display: flex;
    flex-direction: column;
  }
  .panel-group {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 10px;
  }
  .panel {
    background-color: #f9f9f9;
    padding: 20px;
    border-radius: 10px;
  }
  .panel h2 {
    margin-top: 0;
  }
  .panel input,
  .panel select {
    width: 100%;
    margin-bottom: 10px;
    padding: 8px;
    border-radius: 5px;
    border: 1px solid #ccc;
  }
  .second-row {
    display: grid;
    grid-template-columns: repeat(3, 1fr);
    gap: 20px;
    margin-top: 20px;
  }
  .percentage {
    font-size: 1rem;
    color: #333;
    margin-left: 4px;
  }
  .third-row {
    display: grid;
    grid-template-columns: repeat(2, 1fr);
    gap: 20px;
    margin-top: 20px;
  }
  .panel input[type="text"][placeholder="GST"] {
    width: 20%;
  }
  .validation-message {
    color: red;
    font-size: 0.8rem;
    margin-top: 2px;
  }
  .image-upload-container {
    display: flex;
    flex-direction: column;
    align-items: center;
  }
  .upload-label {
    display: block;
    position: relative;
    width: 150px;
    height: 150px;
    border-radius: 50%;
    overflow: hidden;
    cursor: pointer;
  }
  .preview-image {
    width: 100%;
    height: 100%;
    object-fit: cover;
  }
  .upload-placeholder {
    display: flex;
    justify-content: center;
    align-items: center;
    width: 100%;
    height: 100%;
    background-color: #f2f2f2;
  }
  .upload-placeholder span {
    font-size: 16px;
  }
  .error-bubble {
    position: absolute;
    background-color: #ffcccc;
    color: #ff0000;
    padding: 5px;
    border-radius: 5px;
    font-size: 0.8em;
    box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  }
  .switch-label {
    display: flex;
    align-items: center;
  }
  .toggle-switch {
    position: relative;
    display: inline-block;
    width: 50px;
    height: 24px;
  }
  .toggle-switch input[type="checkbox"] {
    opacity: 0;
    width: 0;
    height: 0;
  }
  .toggle-switch input[type="checkbox"] + label {
    position: absolute;
    top: 0;
    left: 0;
    width: 50px;
    height: 24px;
    background-color: #ccc;
    border-radius: 12px;
    cursor: pointer;
  }
  .toggle-switch input[type="checkbox"] + label:before {
    content: '';
    position: absolute;
    top: 2px;
    left: 2px;
    width: 20px;
    height: 20px;
    background-color: white;
    border-radius: 50%;
    transition: transform 0.3s ease;
  }
  .toggle-switch input[type="checkbox"]:checked + label {
    background-color: #6ab04c;
  }
  .toggle-switch input[type="checkbox"]:checked + label:before {
    transform: translateX(26px);
  }
  .form-switch {
    padding-left: 2.5em;
  }
  .side-by-side {
    display: flex;
    flex-direction: row;
  }
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

const ProfileProductModal = ({
  showModal,
  setCartItems,
  handleSearchChange,
  filteredProducts,
  discounts,
  handleDiscountChange,
  calculateFinalPrice,
  handleAddToCart,
  cartItems,
  handleChangeCartDate,
  handleChangeEndDate,
  startDate,
  handleQuantityChange,
  handleChangeCart,
  changeCart,
  handleInterval,
  showNth,
  handleChangenth,
  handleRemoveFromCart,
  handleChangenCustom,
  handleCheckout,
  adhocDeliveryDate,
  setAdhocDeliveryDate,
  handleConfirmOrder,
  loading,
}) => {
  return (
    <>
      <style>{productModalStyles}</style>
      <div
      className="modal fade"
      id="exampleModal"
      tabIndex="-1"
      role="dialog"
      aria-labelledby="exampleModalLabel"
      aria-hidden="true"
    >
      <div className="modal-dialog modal-lg" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="exampleModalLabel">
              {showModal === "addSubscription" ? "Subscription" : "Adhoc Order"}
            </h5>

            <button
              type="button"
              className="close"
              data-bs-dismiss="modal"
              aria-label="Close"
              onClick={() => setCartItems([])}
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div
            style={{
              display: "flex",
              justifyContent: "end",
              paddingRight: "11px",
            }}
          >
            <div className="btn-wrapper"></div>
          </div>
          <div className="modal-body" style={{ padding: "8px 8px" }}>
            <div className="row">
              <div className="col-md-7 grid-margin grid-margin-md-0 stretch-card">
                <div className="card">
                  <div className="card-body">
                    <div
                      className="product-src"
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                      }}
                    >
                      <div className="product-src1">
                        <h4 className="card-title">Products </h4>
                      </div>
                      <div className="product-src2">
                        <form>
                          <input
                            type="search"
                            placeholder="Search products"
                            onChange={handleSearchChange}
                          />
                        </form>
                      </div>
                    </div>
                    <div className="table-responsive">
                      <table className="table">
                        <thead>
                          <tr>
                            <th className="pt-1 ps-0">Image</th>
                            <th className="pt-1 ps-0">Name</th>
                            <th className="pt-1">Price</th>
                            <th className="pt-1">Discount</th>
                            <th className="pt-1">Add</th>
                          </tr>
                        </thead>
                        <tbody>
                          {filteredProducts?.map(({ id, data }, index) => (
                            <React.Fragment key={id}>
                              {data.packagingOptions.map((option, optIndex) => (
                                <tr key={`${id}-${optIndex}`}>
                                  <td className="py-1 ps-0">
                                    <div
                                      className="d-flex align-items-center"
                                      style={{ paddingBottom: "1rem" }}
                                    >
                                      <img
                                        src={data.image}
                                        alt="product"
                                        style={{
                                          height: "70px",
                                          width: "93px",
                                        }}
                                      />
                                    </div>
                                  </td>
                                  <td>{data.productName}</td>
                                  <td>
                                    ₹ {option.price}.00
                                    <p>
                                      {option.packaging} {option.pkgUnit}
                                    </p>
                                  </td>
                                  <td>
                                    <input
                                      type="number"
                                      style={{ width: "5rem" }}
                                      placeholder="Discount"
                                      min="0"
                                      value={
                                        discounts[
                                          data.productName + option.price
                                        ] || ""
                                      }
                                      onChange={(e) =>
                                        handleDiscountChange(
                                          data.productName + option.price,
                                          e
                                        )
                                      }
                                    />
                                    <p>
                                      Final Price: ₹{" "}
                                      {calculateFinalPrice(
                                        option.price,
                                        discounts[
                                          data.productName + option.price
                                        ]
                                      )}
                                    </p>
                                  </td>
                                  <td>
                                    {cartItems.findIndex(
                                      (cartItem) =>
                                        cartItem.price ===
                                        calculateFinalPrice(
                                          option.price,
                                          discounts[
                                            data.productName + option.price
                                          ] || ""
                                        ) &&
                                        cartItem.product_name ===
                                          data.productName
                                    ) === -1 ? (
                                      <label
                                        className="badge badge-success"
                                        style={{ cursor: "pointer" }}
                                        onClick={() =>
                                          handleAddToCart({
                                            package_unit: `${option.packaging} ${option.pkgUnit}`,
                                            product_name: data.productName,
                                            price: calculateFinalPrice(
                                              option.price,
                                              discounts[
                                                data.productName + option.price
                                              ] || ""
                                            ),
                                            discount:
                                              discounts[
                                                data.productName + option.price
                                              ] || "",
                                            start_date: "",
                                            end_date: "",
                                            subscription_type: "Everyday",
                                            quantity: 1,
                                          })
                                        }
                                      >
                                        Add
                                      </label>
                                    ) : null}
                                  </td>
                                </tr>
                              ))}
                            </React.Fragment>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-md-5 grid-margin grid-margin-md-0 stretch-card border-primary">
                <div className="card">
                  {showModal === "addSubscription" ? (
                    <div className="card-body">
                      <h4 className="card-title">Cart Items</h4>

                      {cartItems.map((item, index) => (
                        <div key={index} className="card mb-2">
                          <div className="card-body">
                            <div
                              className="form-group"
                              style={{
                                marginBottom: "0.5rem",
                                display: "flex",
                              }}
                            >
                              <div className="col">
                                <p>
                                  <DatePicker
                                    selected={
                                      item.start_date
                                        ? new Date(item.start_date)
                                        : null
                                    }
                                    onChange={(date) =>
                                      handleChangeCartDate(date, index)
                                    }
                                    dateFormat="dd-MM-yyyy"
                                    selectsStart
                                    startDate={
                                      item.start_date
                                        ? new Date(item.start_date)
                                        : null
                                    }
                                    placeholderText="From Date"
                                    className="form-control"
                                    minDate={
                                      new Date(
                                        new Date().setDate(
                                          new Date().getDate() + 1
                                        )
                                      )
                                    }
                                  />

                                  <b>
                                    {item.start_date
                                      ? new Date(
                                          item.start_date
                                        ).toLocaleDateString("en-GB")
                                      : "No start date selected"}
                                  </b>
                                </p>
                              </div>
                              <div className="col">
                                {item.subscription_type === "One Time" ? (
                                  <></>
                                ) : (
                                  <>
                                    <p>
                                      <DatePicker
                                        selected={
                                          item.end_date
                                            ? new Date(item.end_date)
                                            : null
                                        }
                                        onChange={(date) =>
                                          handleChangeEndDate(date, index)
                                        }
                                        dateFormat="dd-MM-yyyy"
                                        selectsEnd
                                        startDate={
                                          item.start_date
                                            ? new Date(item.start_date)
                                            : null
                                        }
                                        endDate={
                                          item.end_date
                                            ? new Date(item.end_date)
                                            : null
                                        }
                                        placeholderText="To Date"
                                        className="form-control"
                                        minDate={
                                          item.start_date
                                            ? new Date(
                                                new Date(
                                                  item.start_date
                                                ).getTime() +
                                                  24 * 60 * 60 * 1000
                                              )
                                            : null
                                        }
                                      />

                                      <b>
                                        {item.end_date
                                          ? new Date(
                                              item.end_date
                                            ).toLocaleDateString("en-GB")
                                          : "No end date selected"}
                                      </b>
                                    </p>
                                  </>
                                )}
                              </div>
                            </div>

                            <p className="mt-2 card-text">
                              Name : {item.product_name}
                            </p>
                            <div className="form-group row">
                              <div className="col">
                                <p className="mt-2 card-text">
                                  Price : ₹ {item.price}
                                </p>
                              </div>
                              <div className="col">
                                <p className="mt-2 card-text">
                                  Quantity :{" "}
                                  <i
                                    className="mdi mdi-minus-circle"
                                    style={{
                                      paddingRight: "4px",
                                      cursor: "pointer",
                                    }}
                                    onClick={() =>
                                      handleQuantityChange(index, "subtract")
                                    }
                                  ></i>{" "}
                                  {item.quantity}{" "}
                                  <i
                                    className="mdi mdi-plus-circle"
                                    style={{
                                      paddingLeft: "4px",
                                      cursor: "pointer",
                                    }}
                                    onClick={() =>
                                      handleQuantityChange(index, "add")
                                    }
                                  ></i>
                                </p>
                              </div>
                            </div>
                            {item.subscription_type === "Everyday" ||
                            item.subscription_type === "On-Interval" ||
                            item.subscription_type === "Custom" ? (
                              <>
                                <div
                                  className="form-group"
                                  style={{
                                    display: "flex",
                                    marginBottom: "0.5rem",
                                  }}
                                >
                                  <div className="col">
                                    <label style={{ paddingRight: "11px" }}>
                                      Everyday
                                    </label>
                                    <input
                                      type="radio"
                                      id={`Everyday-${index}`}
                                      value="Everyday"
                                      checked={
                                        item.subscription_type === "Everyday"
                                      }
                                      onChange={(e) =>
                                        handleChangeCart(e, index)
                                      }
                                    />
                                  </div>
                                  <div className="col">
                                    <label style={{ paddingRight: "11px" }}>
                                      On Interval
                                    </label>
                                    <input
                                      type="radio"
                                      id={`On-Interval-${index}`}
                                      value="On-Interval"
                                      checked={
                                        item.subscription_type === "On-Interval"
                                      }
                                      onChange={(e) =>
                                        handleChangeCart(e, index)
                                      }
                                    />
                                  </div>
                                  <div className="col">
                                    <label style={{ paddingRight: "11px" }}>
                                      Custom
                                    </label>
                                    <input
                                      type="radio"
                                      id={`Custom-${index}`}
                                      value="Custom"
                                      checked={
                                        item.subscription_type === "Custom"
                                      }
                                      onChange={(e) =>
                                        handleChangeCart(e, index)
                                      }
                                    />
                                  </div>
                                </div>
                              </>
                            ) : (
                              <></>
                            )}

                            <div
                              style={{
                                display: "flex",
                                justifyContent: "end",
                                paddingRight: "11px",
                              }}
                            >
                              <div
                                className="btn-wrapper"
                                style={{ display: "ruby" }}
                              >
                                {item.subscription_type === "Everyday" ||
                                item.subscription_type === "On-Interval" ||
                                item.subscription_type === "Custom" ? (
                                  <>
                                    <a
                                      href="#"
                                      className={
                                        item.subscription_type ===
                                        "Subscription"
                                          ? "btn btn-success text-white me-0 mr-2"
                                          : "btn btn-dark text-white me-0 mr-2"
                                      }
                                      style={{
                                        padding: "4px",
                                        fontSize: "11px",
                                      }}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        changeCart("Subscription", index);
                                      }}
                                    >
                                      <i className="icon-add"></i>Subscription
                                    </a>
                                  </>
                                ) : (
                                  <>
                                    <a
                                      href="#"
                                      className={
                                        item.subscription_type ===
                                        "Subscription"
                                          ? "btn btn-success text-white me-0 mr-2"
                                          : "btn btn-dark text-white me-0 mr-2"
                                      }
                                      style={{
                                        padding: "4px",
                                        fontSize: "11px",
                                        textDecoration: "line-through",
                                      }}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        changeCart("Subscription", index);
                                      }}
                                    >
                                      <i className="icon-add"></i>Subscription
                                    </a>
                                  </>
                                )}
                                {item.subscription_type === "One Time" ? (
                                  <>
                                    <a
                                      href="#"
                                      className={
                                        item.subscription_type === "One Time"
                                          ? "btn btn-success text-white me-0 mr-2"
                                          : "btn btn-dark text-white me-0"
                                      }
                                      style={{
                                        padding: "4px",
                                        marginLeft: "1rem",
                                        fontSize: "11px",
                                      }}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        changeCart("One Time", index);
                                      }}
                                    >
                                      One Time
                                    </a>
                                  </>
                                ) : (
                                  <>
                                    <a
                                      href="#"
                                      className={
                                        item.subscription_type === "One Time"
                                          ? "btn btn-success text-white me-0 mr-2"
                                          : "btn btn-dark text-white me-0"
                                      }
                                      style={{
                                        padding: "4px",
                                        marginLeft: "1rem",
                                        fontSize: "11px",
                                        textDecoration: "line-through",
                                      }}
                                      onClick={(e) => {
                                        e.preventDefault();
                                        changeCart("One Time", index);
                                      }}
                                    >
                                      One Time
                                    </a>
                                  </>
                                )}

                                {item.subscription_type === "On-Interval" ? (
                                  <>
                                    <div className="dropdown">
                                      <button
                                        className="btn btn-danger btn-xs dropdown-toggle"
                                        type="button"
                                        id={`dropdownMenuSizeButton3-${index}`}
                                        data-bs-toggle="dropdown"
                                        aria-haspopup="true"
                                        aria-expanded="false"
                                        style={{
                                          height: "22px",
                                          padding: "5px",
                                          marginRight: "14px",
                                          marginLeft: "1rem",
                                        }}
                                      >
                                        {item.interval === ""
                                          ? "Days"
                                          : `Every ${item.interval} day`}
                                      </button>
                                      <div
                                        className="dropdown-menu"
                                        aria-labelledby={`dropdownMenuSizeButton3-${index}`}
                                      >
                                        <h6
                                          className="dropdown-item"
                                          onClick={() =>
                                            handleInterval("2", index)
                                          }
                                        >
                                          Every 2nd day
                                        </h6>
                                        <h6
                                          className="dropdown-item"
                                          onClick={() =>
                                            handleInterval("3", index)
                                          }
                                        >
                                          Every 3rd day
                                        </h6>
                                        <h6
                                          className="dropdown-item"
                                          onClick={() =>
                                            handleInterval("4", index)
                                          }
                                        >
                                          Every 4th day
                                        </h6>
                                        <div className="dropdown-divider"></div>
                                        <h6
                                          className="dropdown-item"
                                          onClick={() =>
                                            handleInterval("nth", index)
                                          }
                                        >
                                          Every nth day
                                        </h6>
                                      </div>
                                    </div>
                                  </>
                                ) : (
                                  <></>
                                )}

                                {item.subscription_type === "On-Interval" ? (
                                  <>
                                    {" "}
                                    {showNth ? (
                                      <>
                                        <input
                                          type="tel"
                                          pattern="[0-9]*"
                                          onChange={(e) =>
                                            handleChangenth(e, index)
                                          }
                                          id={`interval-${index}`}
                                          maxLength={2}
                                          className=""
                                          style={{
                                            width: "2rem",
                                            border: "1px solid #dee2e6",
                                            fontWeight: "400",
                                            borderRadius: "4px",
                                            height: "22px",
                                            marginRight: "1rem",
                                            fontSize: "11px",
                                          }}
                                          placeholder="value"
                                        />
                                      </>
                                    ) : (
                                      <></>
                                    )}
                                  </>
                                ) : (
                                  <></>
                                )}
                              </div>
                              <div>
                                <i
                                  className="menu-icon mdi mdi-delete"
                                  onClick={() => handleRemoveFromCart(index)}
                                  style={{
                                    color: "red",
                                    cursor: "pointer",
                                    fontSize: "23px",
                                    paddingLeft: "5px",
                                  }}
                                ></i>
                              </div>
                            </div>
                            {item.subscription_type === "Custom" ? (
                              <>
                                <div
                                  style={{
                                    display: "flex",
                                    marginTop: "1rem",
                                    justifyContent: "space-around",
                                  }}
                                >
                                  {[
                                    "S",
                                    "M",
                                    "T",
                                    "W",
                                    "T",
                                    "F",
                                    "S",
                                  ].map((day, dIdx) => (
                                    <div
                                      key={dIdx}
                                      className="badge badge-pill badge-outline-primary"
                                      style={{ marginRight: "1rem" }}
                                    >
                                      {day}
                                    </div>
                                  ))}
                                </div>
                                <div
                                  style={{
                                    display: "flex",
                                    marginTop: "1rem",
                                    justifyContent: "space-around",
                                  }}
                                >
                                  {[
                                    "sunday",
                                    "monday",
                                    "tuesday",
                                    "wednesday",
                                    "thursday",
                                    "friday",
                                    "saturday",
                                  ].map((day) => (
                                    <input
                                      key={day}
                                      type="tel"
                                      pattern="[0-9]*"
                                      onChange={(e) =>
                                        handleChangenCustom(e, index, day)
                                      }
                                      id={`${day}-${index}`}
                                      maxLength={2}
                                      className=""
                                      style={{
                                        width: "2rem",
                                        border: "1px solid #dee2e6",
                                        fontWeight: "400",
                                        borderRadius: "4px",
                                        height: "22px",
                                        marginRight: "1rem",
                                        fontSize: "11px",
                                      }}
                                      placeholder="value"
                                    />
                                  ))}
                                </div>
                              </>
                            ) : (
                              <></>
                            )}
                          </div>
                        </div>
                      ))}
                      <p></p>
                      <div style={{ display: "flex", justifyContent: "end" }}>
                        {cartItems.length === 0 ? (
                          <></>
                        ) : (
                          <>
                            <button
                              onClick={handleCheckout}
                              className="btn btn-info btn-sm mt-3 mb-4"
                            >
                              Checkout
                            </button>
                          </>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div className="card-body">
                      <h4 className="card-title">Order Items</h4>

                      {cartItems.map((item, index) => (
                        <div key={index} className="card mb-2">
                          <div className="card-body">
                            <p className="mt-2 card-text">
                              Name : {item.product_name}
                            </p>
                            <div className="form-group row">
                              <div className="col">
                                <p className="mt-2 card-text">
                                  Price : ₹ {item.price}
                                </p>
                              </div>
                              <div className="col">
                                <p className="mt-2 card-text">
                                  Quantity :{" "}
                                  <i
                                    className="mdi mdi-minus-circle"
                                    style={{
                                      paddingRight: "4px",
                                      cursor: "pointer",
                                    }}
                                    onClick={() =>
                                      handleQuantityChange(index, "subtract")
                                    }
                                  ></i>{" "}
                                  {item.quantity}{" "}
                                  <i
                                    className="mdi mdi-plus-circle"
                                    style={{
                                      paddingLeft: "4px",
                                      cursor: "pointer",
                                    }}
                                    onClick={() =>
                                      handleQuantityChange(index, "add")
                                    }
                                  ></i>
                                </p>
                              </div>
                            </div>
                            <div>
                              <p>Total Price : {item.price * item.quantity}</p>
                            </div>
                            <br />
                            <div>
                              <DatePicker
                                selected={adhocDeliveryDate}
                                onChange={(date) => setAdhocDeliveryDate(date)}
                                maxDate={new Date()}
                                dateFormat="dd-MM-yyyy"
                                className="datepicker-input"
                                placeholderText="Order Date"
                              />
                            </div>

                            <div
                              style={{
                                display: "flex",
                                justifyContent: "end",
                                paddingRight: "11px",
                              }}
                            >
                              <div></div>
                              <div>
                                <i
                                  className="menu-icon mdi mdi-delete"
                                  onClick={() => handleRemoveFromCart(index)}
                                  style={{
                                    color: "red",
                                    cursor: "pointer",
                                    fontSize: "23px",
                                    paddingLeft: "5px",
                                  }}
                                ></i>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))}
                      <p></p>
                      <div style={{ display: "flex", justifyContent: "end" }}>
                        {cartItems.length === 0 ? (
                          <></>
                        ) : (
                          <button
                            onClick={handleConfirmOrder}
                            className="btn btn-info btn-sm mt-3 mb-4"
                            disabled={loading}
                          >
                            {loading ? "Processing..." : "Confirm order"}
                          </button>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      </div>
    </>
  );
};

export default ProfileProductModal;
