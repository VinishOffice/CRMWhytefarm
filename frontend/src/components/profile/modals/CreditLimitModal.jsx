import React, { useState } from "react";
import Swal from "sweetalert2";
import moment from "moment";
import { addCreditLimitHistory, updateCustomerData } from "../../../services/walletService";
import { createCustomerActivity } from "../../../services/customerActivitiesService";

const CreditLimitModal = ({ customer, loggedIn_user, userId, onCreditLimitUpdated }) => {
  const [loading, setLoading] = useState(false);
  const [submit, setSubmit] = useState({
    credit_limit: 0,
    send_notification: false,
  });

  React.useEffect(() => {
    if (customer) {
      setSubmit((prev) => ({
        ...prev,
        credit_limit: customer.credit_limit || 0,
      }));
    }
  }, [customer]);

  if (!customer) return null;

  const handleChange = (e) => {
    const { id, value, type, checked } = e.target;
    setSubmit((prev) => ({
      ...prev,
      [id]: type === "checkbox" ? checked : value,
    }));
  };

  const generateTxnId = () => {
    return Math.floor(Math.random() * 1000000000).toString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const creditLimit = parseInt(submit.credit_limit);

    if (isNaN(creditLimit)) {
      Swal.fire("Error", "Please enter a valid credit limit", "error");
      return;
    }

    setLoading(true);
    try {
      await addCreditLimitHistory({
        txn_id: generateTxnId(),
        credit_limit: creditLimit,
        send_notification: submit.send_notification,
        customer_phone: customer.customer_phone,
        customer_id: customer.customer_id,
        customer_name: customer.customer_name,
        status: "1",
        user: "Admin",
        created_date: new Date(),
        credit_date: moment().format("YYYY-MM-DD"),
        user_name: loggedIn_user,
        userId: userId,
      });

      await updateCustomerData(customer._id, {
        credit_limit: creditLimit,
      });

      await createCustomerActivity({
        customer_phone: customer.customer_phone,
        customer_id: customer.customer_id,
        customer_name: customer.customer_name,
        user: loggedIn_user,
        object: "Customer",
        action: "Change Credit Limit",
        description: `Credit amount changed from ${customer.credit_limit || 0} to Rs ${creditLimit} by ${loggedIn_user}`,
        date: new Date().toISOString(),
        created_date: new Date().toISOString(),
      });

      Swal.fire("Success", `Credit limit updated to ${creditLimit}`, "success");
      if (onCreditLimitUpdated) onCreditLimitUpdated();

      // Close modal
      const closeBtn = document.querySelector("#exampleModal-credit .close");
      if (closeBtn) closeBtn.click();
    } catch (error) {
      console.error("Error updating credit limit:", error);
      Swal.fire("Error", "Failed to update credit limit", "error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal credit fade"
      id="exampleModal-credit"
      tabIndex="-1"
      role="dialog"
      aria-labelledby="exampleModalLabel-credit"
      aria-hidden="true"
    >
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="exampleModalLabel-credit">
              Credit Limit
            </h5>
            <button
              type="button"
              className="close"
              data-bs-dismiss="modal"
              aria-label="Close"
            >
              <span aria-hidden="true">&times;</span>
            </button>
          </div>
          <div className="modal-body">
            <form className="myForm" onSubmit={handleSubmit}>
              <div className="form-group">
                <label htmlFor="credit_limit">Credit Limit:</label>
                <input
                  className="form-control"
                  type="number"
                  id="credit_limit"
                  value={submit.credit_limit}
                  onChange={handleChange}
                  required
                />
              </div>
              <div className="form-group">
                <div className="form-check">
                  <input
                    type="checkbox"
                    className="form-check-input"
                    id="send_notification"
                    checked={submit.send_notification}
                    onChange={handleChange}
                  />
                  <label className="form-check-label" htmlFor="send_notification">
                    Send Notification
                  </label>
                </div>
              </div>
              <div className="modal-footer">
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={loading}
                >
                  {loading ? "Processing..." : "Submit"}
                </button>
                <button
                  type="button"
                  className="btn btn-light"
                  data-bs-dismiss="modal"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CreditLimitModal;
