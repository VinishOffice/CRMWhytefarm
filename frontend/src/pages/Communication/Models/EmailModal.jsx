import { useState, useRef, useEffect } from "react";
import { Editor } from "@tinymce/tinymce-react";

const EmailModal = ({ isOpen, onClose, initialEmail, onSave }) => {
  const editorRef = useRef(null);
  const [email, setEmail] = useState(initialEmail);
  const [previewHtml, setPreviewHtml] = useState("");


  useEffect(() => {
    setPreviewHtml(email?.body);
  }, [email.body]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setEmail((prev) => ({ ...prev, [name]: value }));
  };

  const handleAttachmentChange = (event) => {
    const file = event.target.files[0]
    if (file) {
      const fileURL = URL.createObjectURL(file)
      setEmail({ ...email, attachment: fileURL })
    }
  }


  const handleSave = () => {
    onSave(email);
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
        display: "flex",
        justifyContent: "center",
      }}
    >
      <div
        className="modal-dialog modal-lg"
        style={{
          maxWidth: "95%",
          margin: "0 auto",
          height: "95%",
          display: "flex",
          flexDirection: "column",
        }}
      >
        <div className="modal-content h-100 d-flex flex-column">
          <div className="modal-header">
            <h5 className="modal-title">
              <i className="bi bi-envelope-fill me-2"></i>Edit Email Message
            </h5>
            <button type="button" className="btn-close btn-close-black" onClick={onClose}></button>
          </div>
          <div className="modal-body p-0 flex-grow-1 overflow-hidden d-flex">
            <div
              className="d-flex flex-column"
              style={{ width: "50%", padding: "1rem", overflowY: "auto" }}
            >
              <form className="d-flex flex-column flex-grow-1">
                <div className="row g-2 mb-2">
                  <div className="col-md-2 col-form-label text-md-end">
                    <label htmlFor="emailFrom" className="text-primary">
                      <i className="bi bi-person-fill me-1"></i>From:
                    </label>
                  </div>
                  <div className="col-md-10">
                    <input
                      type="email"
                      className="form-control form-control-sm"
                      id="emailFrom"
                      name="from"
                      value={email.from}
                      onChange={handleChange}
                      placeholder="sender@example.com"
                    />
                  </div>
                </div>
                <div className="row g-2 mb-2">
                  <div className="col-md-2 col-form-label text-md-end">
                    <label htmlFor="emailTo" className="text-primary">
                      <i className="bi bi-person me-1"></i>To:
                    </label>
                  </div>
                  <div className="col-md-10">
                    <input
                      type="email"
                      className="form-control form-control-sm"
                      id="emailTo"
                      name="to"
                      value={email.to}
                      onChange={handleChange}
                      placeholder="recipient@example.com"
                    />
                  </div>
                </div>
                <div className="row g-2 mb-2">
                  <div className="col-md-2 col-form-label text-md-end">
                    <label htmlFor="emailSubject" className="text-primary">
                      <i className="bi bi-chat-square-text-fill me-1"></i>Subject:
                    </label>
                  </div>
                  <div className="col-md-10">
                    <input
                      type="text"
                      className="form-control form-control-sm"
                      id="emailSubject"
                      name="subject"
                      value={email.subject}
                      onChange={handleChange}
                      placeholder="Email subject"
                    />
                  </div>
                </div>
                <div className="mt-2 flex-grow-1">
                  <Editor
                    apiKey="o7qiqe8bed298gt7bdpx1n1o2zi63hgfpom6rnyd6wmx5g79"
                    onInit={(evt, editor) => (editorRef.current = editor)}
                    value={email?.body}
                    init={{
                      menubar: false,
                      plugins: [
                        "advlist autolink lists link image charmap print preview anchor",
                        "searchreplace visualblocks code fullscreen",
                        "insertdatetime media table paste code help wordcount",
                      ],
                      toolbar:
                        "undo redo | formatselect | bold italic backcolor | alignleft aligncenter alignright alignjustify | bullist numlist outdent indent | removeformat | help",
                      content_style: "body { font-family: Arial, sans-serif; font-size: 14px; }",
                    }}
                    onEditorChange={(content) => setEmail((prev) => ({ ...prev, body: content }))}
                  />
                </div>
                
                <div className="m-3">
                  <label className="form-label fw-bold">Attachment (Image)</label>
                  <input type="file" accept="image/*" className="form-control" onChange={handleAttachmentChange} />
                </div>
              </form>
            </div>
            <div
              className="d-flex flex-column"
              style={{
                width: "50%",
                padding: "1rem",
                backgroundColor: "#f8f9fa",
                overflowY: "auto",
                maxHeight: "80vh",
              }}
            >
              <h6 className="text-primary mb-3">
                <i className="bi bi-eye-fill me-2"></i>Preview
              </h6>
              <div className="border rounded p-3 bg-light">
                <div className="mb-2">
                  <span className="text-muted">From: </span>
                  <span className="text-primary">{email.from}</span>
                </div>
                <div className="mb-2">
                  <span className="text-muted">To: </span>
                  <span className="text-primary">{email.to}</span>
                </div>
                <div className="mb-2">
                  <span className="text-muted">Subject: </span>
                  <span className="text-primary">{email.subject}</span>
                </div>
                <hr className="my-3" />
                <div
                  style={{
                    minHeight: "200px",
                    padding: "1rem",
                    overflowY: "auto",
                    backgroundColor: "#e5ddd5",
                  }}
                >
                  <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
                  {email.attachment && (
                    <div className="mt-2 d-flex justify-content-center">
                      <img
                        src={email.attachment || "/placeholder.svg"}
                        alt="Attachment"
                        className="img-fluid rounded border shadow-sm"
                        style={{ maxHeight: "150px", objectFit: "contain" }}
                      />
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
          <div className="modal-footer bg-light py-2">
            <button type="button" className="btn btn-outline-secondary btn-sm" onClick={onClose}>
              <i className="bi bi-x-circle me-1"></i>Close
            </button>
            <button type="button" className="btn btn-primary btn-sm" onClick={handleSave}>
              <i className="bi bi-save me-1"></i>Save changes
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default EmailModal;
