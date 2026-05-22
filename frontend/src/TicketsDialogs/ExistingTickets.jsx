import  { useContext, useEffect, useState } from 'react'
import NewTicketForm from './NewTicketForm'
import GlobalContext from '../context/GlobalContext';
import Swal from 'sweetalert2';
import { delete_record, fetch_all_records } from '../helpers';
import { Spinner } from 'react-bootstrap';
import { MdDelete, MdEdit } from 'react-icons/md';


const ExistingTickets = ({ setActivePopUp, permissible_roles }) => {
  const [existingTicketCategory, setExistingTicketCategory] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [loading, setLoading] = useState(true);

  const fetchAllTicketCategory = () => {
    setLoading(true);
    fetch_all_records("ticket_category").then((data) => {
      setExistingTicketCategory(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchAllTicketCategory();
  }, []);

  const editCategory = (index) => {
    if (!permissible_roles.includes("tickets")) {
      rolePermission();
      return;
    }
    setEditIndex(index);
    setShowForm(true);
  };

  const addCategory = () => {
    if (!permissible_roles.includes("tickets")) {
      rolePermission();
      return;
    }
    setShowForm(true);
    setEditIndex(null);
  };

  const deleteCategory = (doc_id) => {
    if (!permissible_roles.includes("tickets")) {
      rolePermission();
      return;
    }
    Swal.fire({
      title: "Are you sure?",
      text: "Do you want to delete this ticket category? This action is irreversible.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#d33",
      cancelButtonColor: "#3085d6",
      confirmButtonText: "Yes, delete it!",
      cancelButtonText: "Cancel",
    }).then((result) => {
      if (result.isConfirmed) {
        delete_record("ticket_category", doc_id).then((data) => {
          if (data) {
            fetch_all_records("ticket_category").then((data) => {
              setExistingTicketCategory(data);
              setLoading(false);
            });
          }
        });
      }
    });
  };

  const rolePermission = () => {
    const Toast = Swal.mixin({
      toast: true,
      background: "#d7e7e6",
      position: "top-end",
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener("mouseenter", Swal.stopTimer);
        toast.addEventListener("mouseleave", Swal.resumeTimer);
      },
    });

    Toast.fire({
      icon: "error",
      title: "You are not authorised to do this action",
    });
  };

  if (loading) {
    return (
      <div
        className="d-flex justify-content-center align-items-center"
        style={{ height: "50vh" }}
      >
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="contaner">
      {showForm ? (
        <></>
      ) : (
        <>
          <h5>Existing Ticket Categories</h5>
          <ul className="list-group mb-3">
            {existingTicketCategory &&
              existingTicketCategory.map((category, index) => (
                <li key={index} className="list-group-item">
                  <div className="d-flex justify-content-between align-items-center">
                    <div>
                      <strong>{category.data.name}</strong>
                      <div
                        className="d-flex flex-wrap mt-2"
                        style={{ gap: "5px" }}
                      >
                        {(category.data.sub_category || []).map(
                          (sub, subIndex) => {
                            const subName =
                              typeof sub === "string" ? sub : sub?.name || "";
                            const subSubs =
                              typeof sub === "object" &&
                              Array.isArray(sub.subsub_category)
                                ? sub.subsub_category
                                : [];

                            return (
                              <div key={subIndex} className="mb-2">
                                <span className="subdispo_chip">{subName}</span>

                                {/* Render sub-sub-dispositions */}
                                <div
                                  className="ms-3 mt-1 d-flex flex-wrap"
                                  style={{ gap: "5px" }}
                                >
                                  {subSubs.map((subsub, subsubIndex) => (
                                    <span
                                      key={subsubIndex}
                                      className="subdispo_chip subsub_chip"
                                      style={{
                                        border: "1px solid #83c8f2",
                                        background: " #bed7e1",
                                      }}
                                    >
                                      {subsub}
                                    </span>
                                  ))}
                                </div>
                              </div>
                            );
                          }
                        )}
                      </div>
                    </div>
                    <div>
                      <button
                        className="edit_icon_btn"
                        onClick={() => editCategory(index)}
                      >
                        <MdEdit />
                      </button>
                      <button
                        className="delete_btn mx-2"
                        onClick={() => {
                          deleteCategory(category.id);
                        }}
                      >
                        <MdDelete />
                      </button>
                    </div>
                  </div>
                </li>
              ))}
          </ul>
          <button className="btn btn-success " onClick={() => addCategory()}>
            Add Ticket category
          </button>
        </>
      )}

      {showForm && (
        <NewTicketForm
          setShowForm={setShowForm}
          existingTicketCategory={existingTicketCategory}
          setExistingTicketCategory={setExistingTicketCategory}
          editIndex={editIndex}
          setEditIndex={setEditIndex}
          setLoading={setLoading}
          setActivePopUp={setActivePopUp}
          refreshTicketCategory={fetchAllTicketCategory}
        />
      )}
    </div>
  );
};

export default ExistingTickets;