import React from "react";
import { FaUserCircle} from "react-icons/fa";
import { BsThreeDotsVertical } from "react-icons/bs";

const EmailPreview = ({ mail, setMail }) => {
  
  const truncateContent = (content, maxLength = 150) => {
    return content.length > maxLength
      ? content.slice(0, maxLength) + "..."
      : content;
  };
  

  return (
    <div className="" style={{ maxWidth: "300px", minWidth: "250px", width: "30%", margin: '0 auto' }}>
      <div className="d-flex justify-content-center">
        <div className="w-100">
          <div className="bg-white rounded shadow-sm border overflow-hidden">
            {/* Subject */}
            <div className="py-3 px-2 border-bottom" style={{ backgroundColor: "#f1f1f1" }}>
              <span
                className="font-weight-bold mb-0 text-dark"
                style={{ fontSize: "14px" }}
              >
                {truncateContent(mail.subject || "", 50)}
              </span>
            </div>

            {/* Header: From and To */}
            <div className="bg-light border-bottom p-1 d-flex align-items-center">
              <div
                className="bg-secondary rounded-circle"
                style={{
                  width: "30px",
                  height: "30px",
                  display: "flex",
                  justifyContent: "center",
                  alignItems: "center",
                  fontSize: "30px",
                }}
              >
                

                <FaUserCircle />
              </div>
              <div className="flex-grow-1 px-2">
                <span className="font-weight-bold mb-0 text-dark" style={{ fontSize: "12px" }}>
                  From:
                </span>
                <span className="ps-1 font-weight-bold mb-0 text-dark" style={{ fontSize: "12px" }}>
                  {truncateContent(mail?.from || "", 20)}
                </span>
                <p className="text-muted" style={{ fontSize: "12px" }}>
                  <span className="font-weight-bold mb-0 text-dark" style={{ fontSize: "12px" }}>
                    To:
                  </span>
                  <span
                    className="ps-1 font-weight-bold mb-0 text-dark"
                    title={mail?.to}
                    style={{ fontSize: "12px" }}
                  >
                    {truncateContent(mail?.to || "", 15)}
                  </span>
                </p>
              </div>
              <div className="px-1">
                <BsThreeDotsVertical />
              </div>
            </div>

            {/* Email Body */}
            <div
              className="bg-white p-3"
              style={{
                height: "260px",
                overflowY: "auto",
                scrollbarWidth: "none",
                MsOverflowStyle: "none",
                backgroundColor: "#e5ddd5",
              }}
            >
              <div
                style={{
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "wrap",
                }}
              >
                <p
                  id="emailbox"
                  style={{ minHeight: "40px", outline: "none" }}
                  dangerouslySetInnerHTML={{ __html: mail?.body }}
                />
                {mail.attachment && (
                    <div className="mt-2 d-flex justify-content-center">
                      <img
                        src={mail.attachment || "/placeholder.svg"}
                        alt="Attachment"
                        className="img-fluid rounded border shadow-sm"
                        style={{  objectFit: "contain" }}
                      />
                    </div>
                  )}

              </div>
            </div>
          </div>
        </div>
      </div>
    </div>

  );
};

export default EmailPreview;
