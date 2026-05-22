import React, { useState, useEffect, useContext } from 'react';
import { DispositionForm } from '../../forms';
import { fetch_all_records, delete_record } from '../../helpers';
import { Spinner } from 'react-bootstrap';
import Swal from 'sweetalert2';
import { MdDelete, MdEdit } from "react-icons/md";
import GlobalContext from '../../context/GlobalContext';



const Disposition = ({ setActivePopup }) => {
  const { permissible_roles } = useContext(GlobalContext);
  const [existingDispositions, setExistingDispositions] = useState([]);
  const [showForm, setShowForm] = useState(false);
  const [editIndex, setEditIndex] = useState(null);
  const [loading, setLoading] = useState(true);




  const fetchAllDispositions = () => {
    setLoading(true);
    fetch_all_records('dispositions').then((data) => {
      setExistingDispositions(data);
      setLoading(false);
    });
  };

  useEffect(() => {
    fetchAllDispositions();
  }, []);


  const editDisposition = (index) => {
    if (!permissible_roles.includes('edit_dispositions')) {
      rolePermission();
      return;

    }
    setEditIndex(index);
    setShowForm(true);
  };

  const addDisposition = () => {
    if (!permissible_roles.includes('add_dispositions')) {
      rolePermission();
      return;

    }
    setShowForm(true);
    setEditIndex(null);
  }

  const deleteDisposition = (doc_id) => {
    if (!permissible_roles.includes('delete_dispositions')) {
      rolePermission();
      return;
    }
    Swal.fire({
      title: 'Are you sure?',
      text: 'Do you want to delete the disposition? This action is irreversible.',
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#d33',
      cancelButtonColor: '#3085d6',
      confirmButtonText: 'Yes, delete it!',
      cancelButtonText: 'Cancel'
    }).then((result) => {
      if (result.isConfirmed) {
        delete_record('dispositions', doc_id).then((data) => {
          if (data) {
            fetch_all_records('dispositions').then((data) => {
              setExistingDispositions(data);
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
      background: '#d7e7e6',
      position: 'top-end',
      showConfirmButton: false,
      timer: 3000,
      timerProgressBar: true,
      didOpen: (toast) => {
        toast.addEventListener('mouseenter', Swal.stopTimer);
        toast.addEventListener('mouseleave', Swal.resumeTimer);
      }
    });

    Toast.fire({
      icon: 'error',
      title: 'You are not authorised to do this action'
    });

  }

  if (loading) {
    return (
      <div className="d-flex justify-content-center align-items-center" style={{ height: "50vh" }}>
        <Spinner animation="border" />
      </div>
    );
  }

  return (
    <div className="contaner">
      {showForm ? <></> : <>
        <h5>Existing Dispositions</h5>
        <ul className="list-group mb-3">
          {existingDispositions && existingDispositions.map((disposition, index) => (
            <li key={index} className="list-group-item">
              <div className="d-flex justify-content-between align-items-center">
                <div>
                  <strong>{disposition.data.name}</strong>
                  <div className="d-flex flex-wrap mt-2" style={{ gap: "5px" }}>
                    {(disposition.data.subdispositions || []).map((sub, subIndex) => {
                      const subName = typeof sub === 'string' ? sub : sub?.name || '';
                      const subSubs = typeof sub === 'object' && Array.isArray(sub.subsubdispositions) ? sub.subsubdispositions : [];

                      return (
                        <div key={subIndex} className="mb-2">
                          <span className="subdispo_chip">{subName}</span>

                          {/* Render sub-sub-dispositions */}
                          <div className="ms-3 mt-1 d-flex flex-wrap" style={{ gap: "5px"  }}>
                            {subSubs.map((subsub, subsubIndex) => (
                              <span key={subsubIndex} className="subdispo_chip subsub_chip" style={{border:"1px solid #83c8f2",background:" #bed7e1"}}>
                                {subsub}
                              </span>
                            ))}
                          </div>
                        </div>
                      );
                    })}


                  </div>
                </div>
                <div>

                  <button className="edit_icon_btn" onClick={() => editDisposition(index)}><MdEdit /></button>
                  <button className='delete_btn mx-2' onClick={() => { deleteDisposition(disposition.id) }}><MdDelete /></button>
                </div>
              </div>
            </li>
          ))}
        </ul>
        <button className="btn btn-success " onClick={() => addDisposition()}>Add Disposition</button>

      </>}

      {showForm && (
        <DispositionForm
          setShowForm={setShowForm}
          existingDispositions={existingDispositions}
          setExistingDispositions={setExistingDispositions}
          editIndex={editIndex}
          setEditIndex={setEditIndex}
          setLoading={setLoading}
          setActivePopup={setActivePopup}
          refreshDispositions={fetchAllDispositions}
        />

      )}
    </div>
  );
};

export default Disposition;