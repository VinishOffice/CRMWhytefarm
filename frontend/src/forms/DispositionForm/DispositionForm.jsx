
import React, { useState, useEffect } from 'react';
import { create_record, update_record } from '../../helpers';
import { Spinner } from 'react-bootstrap';
import Swal from 'sweetalert2';

const DispositionForm = ({
  setShowForm,
  existingDispositions,
  setExistingDispositions,
  editIndex,
  setEditIndex,
  setActivePopup,
   refreshDispositions, 
}) => {
  const [name, setName] = useState('');
  const [subdispositions, setSubdispositions] = useState([]);
  const [subdispositionName, setSubdispositionName] = useState('');
  const [loading, setLoading] = useState(false);
  const [subSubInput, setSubSubInput] = useState({});

  useEffect(() => {
    if (editIndex !== null) {
      const disposition = existingDispositions[editIndex];
      setName(disposition.data.name);

      // Format old or inconsistent data
      const formattedSubs = (disposition.data.subdispositions || []).map((sub) => {
        if (typeof sub === 'string') {
          return { name: sub, subsubdispositions: [] };
        }
        return {
          name: sub.name || '',
          subsubdispositions: sub.subsubdispositions || [],
        };
      });

      setSubdispositions(formattedSubs);
    }
  }, [editIndex, existingDispositions]);

  const addSubdisposition = () => {
    if (subdispositionName.trim() !== '') {
      setSubdispositions([
        ...subdispositions,
        { name: subdispositionName.trim(), subsubdispositions: [] },
      ]);
      setSubdispositionName('');
    }
  };

  const removeSubdisposition = (index) => {
    const updated = [...subdispositions];
    updated.splice(index, 1);
    setSubdispositions(updated);
  };

  const addSubSubDisposition = (index) => {
    const input = subSubInput[index]?.trim();
    if (input) {
      const updated = [...subdispositions];
      if (!Array.isArray(updated[index].subsubdispositions)) {
        updated[index].subsubdispositions = [];
      }
      updated[index].subsubdispositions.push(input);
      setSubdispositions(updated);
      setSubSubInput({ ...subSubInput, [index]: '' });
    }
  };

  const removeSubSubDisposition = (subIndex, subSubIndex) => {
    const updated = [...subdispositions];
    updated[subIndex].subsubdispositions.splice(subSubIndex, 1);
    setSubdispositions(updated);
  };

  const saveDisposition = () => {
    if (name.trim() === '') return;

    setLoading(true);
    const dispo_data = {
      name: name.trim(),
      subdispositions: subdispositions,
    };

    const savePromise =
      editIndex !== null
        ? update_record('dispositions', existingDispositions[editIndex].id, dispo_data)
        : create_record('dispositions', dispo_data);

   savePromise.then((data) => {
  if (data) {
    Swal.fire({
      title: editIndex !== null ? 'Disposition Updated' : 'Disposition Added',
      text: 'The disposition has been saved successfully.',
      icon: 'success',
      confirmButtonText: 'OK',
    });

    // Reset state only on success
    setName('');
    setSubdispositions([]);
    setEditIndex(null);
    setShowForm(false);
    setActivePopup('');
    refreshDispositions(); // 
  }
  })
  };

  return (
    <div>
      <h5>{editIndex !== null ? 'Edit Disposition' : 'Add Disposition'}</h5>

      <div className="form-group">
        <label>Disposition Name:</label>
        <input
          type="text"
          className="form-control"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
      </div>

      <div className="form-group">
        <label>Add Subdisposition:</label>
        <input
          type="text"
          className="form-control"
          value={subdispositionName}
          onChange={(e) => setSubdispositionName(e.target.value)}
        />
        <button className="btn btn-secondary mt-2" onClick={addSubdisposition}>
          Add Subdisposition
        </button>
      </div>

      <div>
        <h6>Subdispositions:</h6>
        {subdispositions.map((sub, subIndex) => (
          <div key={subIndex} className="mb-3 border p-2 rounded">
            <div className="d-flex justify-content-between align-items-center">
              <strong>{sub.name}</strong>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => removeSubdisposition(subIndex)}
              >
                Remove
              </button>
            </div>

            <div className="mt-2">
              <label>Add Sub-Sub-Disposition:</label>
              <input
                type="text"
                className="form-control"
                value={subSubInput[subIndex] || ''}
                onChange={(e) =>
                  setSubSubInput({ ...subSubInput, [subIndex]: e.target.value })
                }
              />
              <button
                className="btn btn-sm btn-info mt-1"
                onClick={() => addSubSubDisposition(subIndex)}
              >
                Add
              </button>
            </div>

            {sub.subsubdispositions.length > 0 && (
              <div className="mt-2">
                {sub.subsubdispositions.map((subsub, subSubIndex) => (
                  <div
                    key={subSubIndex}
                    className="d-flex justify-content-between align-items-center"
                  >
                    <span>{subsub}</span>
                    <button
                      className="btn btn-sm btn-outline-danger"
                      onClick={() => removeSubSubDisposition(subIndex, subSubIndex)}
                    >
                      &times;
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      <button
        className="btn btn-primary mt-3"
        onClick={saveDisposition}
        disabled={loading}
      >
        {loading ? (
          <>
            <Spinner animation="border" size="sm" /> Processing...
          </>
        ) : (
          <>{editIndex !== null ? 'Update Disposition' : 'Save Disposition'}</>
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

export default DispositionForm;

