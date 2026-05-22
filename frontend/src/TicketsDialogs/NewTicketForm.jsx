import React, { useEffect, useState } from 'react'
import Swal from 'sweetalert2';
import { create_record, update_record } from '../helpers';
import { Spinner } from 'react-bootstrap';

const NewTicketForm = ({
  editIndex,
  setShowForm,
  existingTicketCategory,
  setEditIndex,
  setActivePopUp,
  refreshTicketCategory,
}) => {
  const [name, setName] = useState("");
  const [sub_category, setSub_category] = useState([]);
  const [subCategoryName, setSubCategoryName] = useState("");
  const [loading, setLoading] = useState(false);
  const [subSubInput, setSubSubInput] = useState({});

    useEffect(() => {
      if (editIndex !== null) {
        const category = existingTicketCategory[editIndex];
        setName(category.data.name);

        // Format old or inconsistent data
        const formattedSubs = (category.data.sub_category || []).map((sub) => {
          if (typeof sub === 'string') {
            return { name: sub, subsub_category: [] };
          }
          return {
            name: sub.name || '',
            subsub_category: sub.subsub_category || [],
          };
        });

        setSub_category(formattedSubs);
      }
    }, [editIndex, existingTicketCategory]);

  const addSubCategory = () => {
    if (subCategoryName.trim() !== "") {
      setSub_category([
        ...sub_category,
        { name: subCategoryName.trim(), subsub_category: [] },
      ]);
      setSubCategoryName("");
    }
  };

  const removeSubCategory = (index) => {
    const updated = [...sub_category];
    updated.splice(index, 1);
    setSub_category(updated);
  };

  const addSubSubCategory = (index) => {
    const input = subSubInput[index]?.trim();
    if (input) {
      const updated = [...sub_category];
      if (!Array.isArray(updated[index].subsub_category)) {
        updated[index].subsub_category = [];
      }
      updated[index].subsub_category.push(input);
      setSub_category(updated);
      setSubSubInput({ ...subSubInput, [index]: "" });
    }
  };

  const removeSubSubDisposition = (subIndex, subSubIndex) => {
    const updated = [...sub_category];
    updated[subIndex].subsub_category.splice(subSubIndex, 1);
    setSub_category(updated);
  };

  const saveTicketCategory = () => {
    if (name.trim() === "") return;

    setLoading(true);
    const ticket_data = {
      name: name.trim(),
      sub_category: sub_category,
    };

    const savePromise =
      editIndex !== null
        ? update_record('tickets', existingTicketCategory[editIndex].id, ticket_data):
          create_record("ticket_category", ticket_data);

    savePromise.then((data) => {
      if (data) {
        Swal.fire({
          title:
            editIndex !== null
              ? "Ticket category Updated"
              : "Ticket category Added",
          text: "The category has been saved successfully.",
          icon: "success",
          confirmButtonText: "OK",
        });

        // Reset state only on success
        setName("");
        setSub_category([]);
        setEditIndex(null);
        setShowForm(false);
        setActivePopUp("");
        refreshTicketCategory(); //
      }
    });
  };

  return (
    <div>
      <h5>
        {editIndex !== null ? "Edit Ticket Category" : "Add Ticket Category"}
      </h5>

      <div className="form-group">
        <label>Ticket category :</label>
        <input
          type="text"
          className="form-control"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Sub-category:</label>
        <input
          type="text"
          className="form-control"
          value={subCategoryName}
          onChange={(e) => setSubCategoryName(e.target.value)}
        />
        <button className="btn btn-secondary mt-2" onClick={addSubCategory}>
          Add Sub-category
        </button>
      </div>

      <div>
        <h6>Sub-Category:</h6>
        {sub_category.map((sub, subIndex) => (
          <div key={subIndex} className="mb-3 border p-2 rounded">
            <div className="d-flex justify-content-between align-items-center">
              <strong>{sub.name}</strong>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => removeSubCategory(subIndex)}
              >
                Remove
              </button>
            </div>

            {/* <div className="mt-2">
              <label>Add Sub-Sub-Category:</label>
              <input
                type="text"
                className="form-control"
                value={subSubInput[subIndex] || ""}
                onChange={(e) =>
                  setSubSubInput({ ...subSubInput, [subIndex]: e.target.value })
                }
              />
              <button
                className="btn btn-sm btn-info mt-1"
                onClick={() => addSubSubCategory(subIndex)}
              >
                Add
              </button>
            </div>

            {sub.subsub_category.length > 0 && (
              <div className="mt-2">
                {sub.subsub_category.map((subsub, subSubIndex) => (
                  <div
                    key={subSubIndex}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <span>{subsub}</span>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() =>
                        removeSubSubDisposition(subIndex, subSubIndex)
                      }
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )} */}
          </div>
        ))}
      </div>

      <button
        className="btn btn-primary mt-3"
        onClick={saveTicketCategory}
        disabled={loading}
      >
        {loading ? (
          <>
            <Spinner animation="border" size="sm" /> Processing...
          </>
        ) : (
          <>{editIndex !== null ? "Update Ticket" : "Save Ticket"}</>
        )}
      </button>

      <button
        className="btn btn-danger mt-3 ml-2 mx-2"
        onClick={() => setShowForm(false)}
      >
        Cancel
      </button>
    </div>
  );
};


export default NewTicketForm