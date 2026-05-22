import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { addWalletTransaction, updateCustomerData } from "../../../services/walletService";
import { createCustomerActivity } from "../../../services/customerActivitiesService";

const WalletModal = ({ customer, loggedIn_user, hubData, deliveryExecutive, onTransactionAdded }) => {
  const [loading, setLoading] = useState(false);
  const [submit, setSubmit] = useState({
    amount: "",
    description: "",
    reason: "",
  });

  if (!customer) return null;

  const reasons = [
    { name: "Cash Collection", action: "plus" },
    { name: "Online Recharge", action: "plus" },
    { name: "Refund", action: "plus" },
    { name: "Adjustment", action: "plus" },
    { name: "Correction", action: "plus" },
    { name: "Other", action: "plus" },
  ];

  const handleChange = (e) => {
    const { id, value } = e.target;
    setSubmit((prev) => ({ ...prev, [id]: value }));
  };

  const generateTxnId = () => {
    return Math.floor(Math.random() * 1000000000).toString();
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    const selectedReason = reasons.find((item) => item.name === submit.reason);
    const txnId = generateTxnId();
    const amount = parseFloat(submit.amount);

    try {
      if (selectedReason && selectedReason.action === "plus") {
        const newWalletBalance = (customer.wallet_balance || 0) + amount;

        await addWalletTransaction({
          txn_id: txnId,
          amount: submit.amount,
          description: submit.description,
          reason: submit.reason,
          customer_phone: customer.customer_phone,
          customer_id: customer.customer_id,
          customer_name: customer.customer_name,
          hub_name: hubData?.hub_name,
          delivery_executive: deliveryExecutive ? `${deliveryExecutive.first_name} ${deliveryExecutive.last_name}` : "N/A",
          current_wallet_balance: newWalletBalance,
          status: "1",
          type: "Credit",
          user: loggedIn_user,
          source: "Backend",
          created_date: new Date(),
        });

        await updateCustomerData(customer._id, {
          wallet_balance: newWalletBalance,
          credit_limit: 0,
        });

        await createCustomerActivity({
          description: `${amount} added to Wallet by ${loggedIn_user}`,
          customer_phone: customer.customer_phone,
          customer_id: customer.customer_id,
          customer_name: customer.customer_name,
          user: loggedIn_user,
          object: "Wallet",
          action: "Credit",
          date: new Date().toISOString(),
          created_date: new Date().toISOString(),
        });

        Swal.fire("Success", `${amount} added to wallet balance`, "success");
        if (onTransactionAdded) onTransactionAdded();
        
        // Close modal manually
        const closeBtn = document.querySelector("#exampleModal-wallet .close");
        if (closeBtn) closeBtn.click();
      }
    } catch (error) {
      console.error("Error processing wallet transaction:", error);
      Swal.fire("Error", "Failed to process transaction", "error");
    } finally {
      setLoading(false);
    }
  };

  return customer ? (
    <div
      className="modal wallet fade"
      id="exampleModal-wallet"
      tabIndex="-1"
      role="dialog"
      aria-labelledby="exampleModalLabel-wallet"
      aria-hidden="true"
    >
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="exampleModalLabel-wallet">
              Add Wallet Balance
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
                <label htmlFor="amount">Amount:</label>
                <input
                  className="form-control"
                  type="number"
                  id="amount"
                  value={submit.amount}
                  onChange={handleChange}
                  required
                  min="1"
                />
              </div>
              <div className="form-group">
                <label htmlFor="description">Description:</label>
                <textarea
                  className="form-control"
                  id="description"
                  value={submit.description}
                  onChange={handleChange}
                  rows="2"
                />
              </div>
              <div className="form-group">
                <label htmlFor="reason">Reason:</label>
                <select
                  className="form-control"
                  id="reason"
                  value={submit.reason}
                  onChange={handleChange}
                  required
                >
                  <option value="">Select Reason</option>
                  {reasons.map((r, i) => (
                    <option key={i} value={r.name}>
                      {r.name}
                    </option>
                  ))}
                </select>
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
  ) : null;
};

export default WalletModal;
