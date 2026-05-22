import React from 'react';
import { generateRandomId } from '../../Utility';
import apiClient from '../../services/apiClient';
const AddTransaction = ({ customer_data, setShowTransaction, fetchWalletData, fetchCustomerData }) => {
  const handleSubmit = () => {
    let txn_id = generateRandomId();
    let amount = document.getElementById("amount").value;
    let txn_description = document.getElementById("txn_description").value;
    let txn_type = document.getElementById("txn_type").value;
    let txn_reason = document.getElementById("txn_reason").value;
    let txn_date = document.getElementById("txn_date").value;
    let final_balance = document.getElementById("final_balance").value;

    if (!txn_id || !amount || !txn_description || !txn_type || !txn_reason || !txn_date || !final_balance) {
      alert("Please fill all the fields");
      return;
    }

    let txn_created_date = new Date(txn_date);

    const confirmationMessage = `
      Transaction Details:
      - ID: ${txn_id}
      - Amount: ${amount}
      - Description: ${txn_description}
      - Type: ${txn_type}
      - Reason: ${txn_reason}
      - Date: ${txn_date}
      - Final Balance: ${final_balance}
      
      Do you want to add this wallet history and update the wallet balance?
    `;

    if (window.confirm(confirmationMessage)) {
      // 1. Add to wallet history
      apiClient.post("/api/wallet_history", {
          txn_id: txn_id,
          amount: amount,
          description: txn_description,
          reason: txn_reason,
          customer_phone: customer_data.data && customer_data.data.customer_phone,
          customer_id: customer_data.data && customer_data.data.customer_id,
          customer_name: customer_data.data && customer_data.data.customer_name,
          hub_name: customer_data.data.hub_name,
          current_wallet_balance: final_balance,
          status: "1",
          type: txn_type,
          source: "Backend",
          created_date: txn_created_date,
        }).then(() => {
          // 2. Update customer main wallet balance
          apiClient.patch(`/api/customers_data/${customer_data.id}`, {
            wallet_balance: parseInt(final_balance)
          }).then(() => {
            // 3. Refresh data
            if (fetchWalletData) fetchWalletData();
            if (fetchCustomerData) fetchCustomerData();
            alert("Transaction added and balance updated successfully!");
          }).catch((err) => {
            console.error("Error updating balance: ", err);
            // Even if balance update fails, let's refresh history
            if (fetchWalletData) fetchWalletData();
          });
        }).catch((error) => {
          console.error("Error adding transaction: ", error);
        });
      setShowTransaction(false);
    }
  }

  return (
    <>
      <div>
        <div className="mb-3">
          <label className="form-label">Description</label>
          <input type="text" className="form-control" id="txn_description" />
        </div>
        <div className="mb-3">
          <label className="form-label">Type</label>
          <select className="form-select" id="txn_type">
            <option selected value="">Open this select menu</option>
            <option value="debit">Debit</option>
            <option value="credit">Credit</option>
          </select>
        </div>
        <div className="mb-3">
          <label className="form-label">Amount</label>
          <input type="number" className="form-control" id="amount" />
        </div>
        <div className="mb-3">
          <label className="form-label">Date</label>
          <input type="datetime-local" className="form-control" id="txn_date" />
        </div>
        <div className="mb-3">
          <label htmlFor="">Reason</label>
          <textarea className="form-control" name="reason" id="txn_reason" cols="30" rows="10"></textarea>
        </div>
        <div className="mb-3">
          <label className="form-label">Final Balance</label>
          <input type="number" className="form-control" id="final_balance" />
        </div>
        <button type="submit" className="btn btn-primary my-2" onClick={handleSubmit}>Create Transaction</button>
      </div>
    </>
  )
}

export default AddTransaction;