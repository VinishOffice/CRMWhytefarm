import { useState, useContext, useEffect } from "react";
import { CommunicationContext } from "../CommunicationContext";
import { FaSearch } from "react-icons/fa";

const WhatsappModal = ({ isOpen, onClose, initialMessage = "" }) => {
  const { whatsappTemplates, setWhatsappData } = useContext(CommunicationContext);
  const [search, setSearch] = useState("");
  const [selected, setSelected] = useState(null);
  const [whatsappMessage, setWhatsappMessage] = useState({
    text: initialMessage,
    attachment: null,
  });

  useEffect(() => {
  }, [whatsappTemplates]);

  const templateList = Array.isArray(whatsappTemplates) ? whatsappTemplates : [];
  const filteredTemplates = templateList.filter(
    (t) =>
      t.elementName.toLowerCase().includes(search.trim().toLowerCase()) ||
      t.body.toLowerCase().includes(search.trim().toLowerCase())
  );

  const handleTemplateSelect = (template) => {
    setSelected(template.id);
    setWhatsappMessage((prev) => ({ ...prev, text: template.bodyOriginal || "", template: template }));
  };

  const handleSave = () => {
    setWhatsappData((prev) => ({
      ...prev,
      template: whatsappMessage.template,
      message: whatsappMessage.template.bodyOriginal || "",
    }));
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="modal show d-block"
      tabIndex="-1"
      style={{
        backgroundColor: "rgba(0,0,0,0.5)",
        paddingTop: "10px",
        height: "100vh",
        overflow: "auto",
      }}
    >
      <div className="modal-dialog modal-lg" style={{ height: "95%", margin: "0 auto" }}>
        <div className="modal-content h-100 d-flex flex-column">
        <div className="modal-header bg-light py-2 px-3 border-bottom d-flex align-items-center">
  <h6 className="modal-title m-0 text-primary fw-semibold">Edit WhatsApp Message</h6>
  <button
  type="button"
  className="btn position-relative d-flex align-items-center justify-content-center p-0"
  onClick={onClose}
  style={{
    width: "24px",
    height: "24px",
    borderRadius: "50%",
    backgroundColor: "#dc3545", // Bootstrap danger color
    border: "none",
    color: "white",
    fontSize: "14px",
    fontWeight: "bold",
    boxShadow: "0 2px 6px rgba(0, 0, 0, 0.2)",
    transition: "0.2s ease-in-out",
  }}
  onMouseOver={(e) => (e.target.style.opacity = "0.8")}
  onMouseOut={(e) => (e.target.style.opacity = "1")}
>
  ✖
</button>

</div>

          <div className="modal-body flex-grow-1 overflow-auto px-3 py-2">
            {/* Search Input */}
            <div className="d-flex align-items-center gap-2 mb-2">
  <span className="text-muted">
    <FaSearch size={14} />
  </span>
  <input
    type="text"
    className="form-control form-control-sm border-0 shadow-sm"
    placeholder="Search templates..."
    value={search}
    onChange={(e) => setSearch(e.target.value)}
    style={{ fontSize: "14px" }}
  />
</div>


            {/* Template List */}
            <div className="list-group overflow-auto" style={{ minHeight: "100px" }}>
              {filteredTemplates.length > 0 ? (
                filteredTemplates.map((template) => (
                  <button
  key={template.id}
  className={`list-group-item list-group-item-action d-flex justify-content-between align-items-center p-2 
    ${selected === template.id ? "active" : ""}`}
  onClick={() => handleTemplateSelect(template)}
  style={{ fontSize: "16px" }}
>
  <div>
    <strong className="d-block">{template.elementName}</strong>
    <p
      className="mb-0"
      style={{
        fontSize: "14px",
        lineHeight: "1.2",
        color: selected === template.id ? "black" : "#6c757d", // Black if selected, muted gray otherwise
      }}
    >
      {template.bodyOriginal}
    </p>
  </div>
  {selected === template.id && <i className="bi bi-check-circle-fill text-primary small"></i>}
</button>

                ))
              ) : (
                <p className="text-muted text-center py-2" style={{ fontSize: "16px" }}>
                  No templates found
                </p>
              )}
            </div>
          </div>

          <div className="modal-footer py-2 px-3 d-flex justify-content-end">
            <button type="button" className="btn btn-sm btn-secondary" onClick={onClose}>
              Close
            </button>
            <button type="button" className="btn btn-sm btn-primary ms-2" onClick={handleSave}>
              Save
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default WhatsappModal;
