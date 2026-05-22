import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import { addVacation, updateVacation, getVacations, checkOverlap } from "../../../services/vacationService";
import { createCustomerActivity } from "../../../services/customerActivitiesService";

const VacationModal = ({ customer, loggedIn_user, onVacationAdded, editData = null }) => {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitVacation, setSubmitVacation] = useState({
    start_date: "",
    end_date: "",
    source: "CRM",
    status: "1",
    created_date: new Date(),
    updated_date: new Date(),
  });

  useEffect(() => {
    if (editData) {
      setSubmitVacation({
        ...editData,
        start_date: editData.start_date.split("T")[0],
        end_date: editData.end_date.split("T")[0],
      });
    } else {
      setSubmitVacation({
        start_date: "",
        end_date: "",
        source: "CRM",
        status: "1",
        created_date: new Date(),
        updated_date: new Date(),
      });
    }
  }, [editData]);

  const handleChangeVacation = (e) => {
    const { name, value } = e.target;
    setSubmitVacation((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmitVacation = async (e) => {
    e.preventDefault();
    const today = new Date().setHours(0, 0, 0, 0);
    const startDate = new Date(submitVacation.start_date).setHours(0, 0, 0, 0);

    if (startDate <= today && !editData) {
      Swal.fire("Error", "Start date must be a future date.", "error");
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await getVacations(customer.customer_id);
      const existingVacations = res.data?.data || [];

      if (checkOverlap(submitVacation.start_date, submitVacation.end_date, existingVacations, editData?._id)) {
        Swal.fire("Overlap", "New vacation overlaps with an existing one!", "warning");
        setIsSubmitting(false);
        return;
      }

      if (editData) {
        await updateVacation(editData._id, {
          ...submitVacation,
          start_date: new Date(submitVacation.start_date),
          end_date: new Date(submitVacation.end_date),
          updated_date: new Date(),
          updated_by: loggedIn_user,
        });

        await createCustomerActivity({
          customer_phone: customer.customer_phone,
          customer_id: customer.customer_id,
          customer_name: customer.customer_name,
          user: loggedIn_user,
          object: "Vacation",
          action: "Update",
          description: `Vacation updated: ${submitVacation.start_date} to ${submitVacation.end_date}`,
          date: new Date().toISOString(),
          created_date: new Date().toISOString(),
        });
      } else {
        await addVacation({
          ...submitVacation,
          customer_id: customer.customer_id,
          start_date: new Date(submitVacation.start_date),
          end_date: new Date(submitVacation.end_date),
        });

        await createCustomerActivity({
          customer_phone: customer.customer_phone,
          customer_id: customer.customer_id,
          customer_name: customer.customer_name,
          user: loggedIn_user,
          object: "Vacation",
          action: "Create",
          description: `New vacation added: ${submitVacation.start_date} to ${submitVacation.end_date}`,
          date: new Date().toISOString(),
          created_date: new Date().toISOString(),
        });
      }

      Swal.fire("Success", `Vacation ${editData ? "updated" : "added"} successfully`, "success");
      if (onVacationAdded) onVacationAdded();
      
      const closeBtn = document.querySelector(".modal.vacation .close");
      if (closeBtn) closeBtn.click();
      
    } catch (error) {
      console.error("Error processing vacation:", error);
      Swal.fire("Error", "Failed to process vacation", "error");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="modal vacation fade"
      id="exampleModal-vacation"
      tabIndex="-1"
      role="dialog"
      aria-labelledby="exampleModalLabel-vacation"
      aria-hidden="true"
    >
      <div className="modal-dialog" role="document">
        <div className="modal-content">
          <div className="modal-header">
            <h5 className="modal-title" id="exampleModalLabel-vacation">
              Add Vacation
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
            <form className="myForm" onSubmit={handleSubmitVacation}>
              <div className="form-group">
                <label htmlFor="start_date">Start Date</label>
                <input
                  type="date"
                  className="form-control"
                  id="start_date"
                  name="start_date"
                  min={new Date(new Date().setDate(new Date().getDate() + 1)).toISOString().split("T")[0]}
                  value={submitVacation.start_date}
                  onChange={handleChangeVacation}
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="end_date">End Date</label>
                <input
                  type="date"
                  className="form-control"
                  id="end_date"
                  name="end_date"
                  min={submitVacation.start_date || new Date().toISOString().split("T")[0]}
                  value={submitVacation.end_date}
                  onChange={handleChangeVacation}
                  required
                />
              </div>

              <div className="modal-footer">
                <button
                  type="submit"
                  className="btn btn-success"
                  disabled={isSubmitting}
                >
                  {isSubmitting ? "Processing..." : "Submit"}
                </button>
                <button
                  type="button"
                  className="btn btn-light"
                  data-bs-dismiss="modal"
                  disabled={isSubmitting}
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

export default VacationModal;
