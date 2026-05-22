import React, { useState, useRef, useEffect, useContext } from "react";
import { CommunicationContext } from "../CommunicationContext";

const SmsModal = ({ isOpen, onClose, initialMessage }) => {
  const editorRef = useRef(null);
  const { smsTemplates , setSmsData} = useContext(CommunicationContext);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [smsMessage, setSmsMessage] = useState({ text: initialMessage, attachment: null });

  useEffect(() => {
  }, [smsTemplates]);

  // Ensure smsTemplates is always an array
  const templateList = Array.isArray(smsTemplates) ? smsTemplates : [];

  // Filter templates based on search query
  const filteredTemplates = templateList.filter(
    (t) =>
      t.title.toLowerCase().includes(search.trim().toLowerCase()) ||
      t.body.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleTemplateSelect = (template) => {
    setSelected(template.id);
    setSmsMessage({ ...smsMessage, text: template.body, template: template });
  };
  
  const handleSave = () => {
    setSmsData(prev => ({ ...prev, message: smsMessage.template.body, template: smsMessage.template}));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{
        backgroundColor: "rgba(0,0,0,0.5)",
        paddingTop: "20px",
        height: "100vh",
        overflow: "auto",
      }}
    >
      <div className="modal-dialog modal-lg" style={{ height: "90%", margin: "0 auto" }}>
        <div className="modal-content h-100 d-flex flex-column">
          <div className="modal-header">
            <h5 className="modal-title">Edit SMS Message</h5>
            <button type="button" className="btn-close" onClick={onClose}></button>
          </div>
          <div className="modal-body flex-grow-1 overflow-auto">
            {/* Search Input */}
            <div className="mb-3">
              <input
                type="text"
                className="form-control"
                placeholder="Search SMS Templates..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>

            {/* Template List */}
            <div className="list-group overflow-auto" style={{ maxHeight: "250px" }}>
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((template) => (
                  <button
                    key={template.id}
                    className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center 
                      ${selected === template.id ? "active" : ""}`}
                    onClick={() => handleTemplateSelect(template)}
                  >
                    <div>
                      <strong>{template.title}</strong>
                      <p className="mb-0 small text-muted">{template.body}</p>
                    </div>
                    {selected === template.id && <i className="bi bi-check-circle-fill text-primary"></i>}
                  </button>
                ))
              ) : (
                <p className="text-muted text-center py-3">No templates found</p>
              )}
            </div>
          </div>

          <div className="modal-footer">
            <button type="button" className="btn btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn-primary" onClick={handleSave}>
              Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SmsModal;
