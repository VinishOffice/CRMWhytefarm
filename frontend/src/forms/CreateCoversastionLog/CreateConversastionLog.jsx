import React, { useState, useEffect } from "react";
import { fetch_all_records, fetch_records, create_record, generate_random_id, update_record } from '../../helpers';
import { ROLES, CONVERSASTION_LOGS_REQUIRED_FIELD, INTERACTION_TYPE_REQUIRED_FIELDS, FOLLOW_REQUIRED_FIELD, TASK_TYPE, TASK_STATUS } from '../../constants';
import { getUserInfo } from '../../Utility';
import Swal from "sweetalert2";
import Select from 'react-select';
const CreateConversastionLog = ({ customer_data, setActivePopup, tags, disposition, from, task_data, setRefresh }) => {

  const { loggedIn, userId, username, loggedIn_user } = getUserInfo();
  const [loading, setLoading] = useState(false);
  const [dispositions, setDispositions] = useState([]);
  useEffect(() => {

    // Format and set dispositions
    if (Array.isArray(disposition)) {
      const formatted = disposition.map((d) => {
        return {
          id: d.id,
          name: d.data.name,
          subdispositions: (d.data.subdispositions || []).map((sub) => {
            return typeof sub === "string"
              ? { name: sub, subsubdispositions: [] }
              : {
                name: sub.name || "",
                subsubdispositions: sub.subsubdispositions || [],
              };
          }),
        };
      });

      setDispositions(formatted);  // set properly structured data
    } else {
      setDispositions([]);
    }

    // Fetch users with specific roles
    fetch_records("users", [
      {
        key: "role",
        value: ["Customer Care Agent", "Customer Support Team Lead"],
        operator: "in",
      },
    ]).then((data) => {
      setAvailableUsers(data);
    });

    // Fetch all in-stock products
    fetch_records("products_data", [
      {
        key: "inStock",
        value: true,
        operator: "==",
      },
    ]).then((data) => {
      setAllProducts(data);
    });

    // Set available tags
    setAvailableTags(tags);
  }, []);


  const getCurrentDate = () => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  };

  const [selectedDisposition, setSelectedDisposition] = useState("");
  const [subDispositionOptions, setSubDispositionOptions] = useState([]);
  const [selectedSubDisposition, setSelectedSubDisposition] = useState("");
  const [followUpRequired, setFollowUpRequired] = useState(null);
  const [followUpDate, setFollowUpDate] = useState(getCurrentDate());
  const [interactionType, setInteractionType] = useState("");

  const [availableUsers, setAvailableUsers] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [availableTags, setAvailableTags] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [selectedTags, setSelectedTags] = useState([]);


  const [selectedSubSubDisposition, setSelectedSubSubDisposition] = useState("");

  const [subSubDispositionOptions, setSubSubDispositionOptions] = useState([]);


  const formatDispositions = (data) => {
    return data.map((d) => ({
      id: d.id,
      name: d.data.name,
      subdispositions: (d.data.subdispositions || []).map((sub) =>
        typeof sub === 'string'
          ? { name: sub, subsubdispositions: [] }
          : {
            name: sub.name || '',
            subsubdispositions: sub.subsubdispositions || [],
          }
      ),
    }));
  };

  fetch_all_records('dispositions').then((data) => {
    const formatted = formatDispositions(data);
    setDispositions(formatted);
  });


  const handleDispositionChange = (e) => {
    const selectedName = e.target.value;
    setSelectedDisposition(selectedName);

    const selected = dispositions.find((d) => d.name === selectedName);
    if (selected) {
      setSubDispositionOptions(selected.subdispositions);
      setSelectedSubDisposition('');
      setSelectedSubSubDisposition('');
    }
  };




  const handleSubDispositionChange = (e) => {
    const selectedName = e.target.value;
    setSelectedSubDisposition(selectedName);

    const selected = subDispositionOptions.find((sub) => sub.name === selectedName);
    if (selected) {
      setSubSubDispositionOptions(selected.subsubdispositions || []);
      setSelectedSubSubDisposition('');
    }
  };



  const handleFollowUpChange = (e) => {
    setFollowUpRequired(e.target.value === "yes");
  };




  const handleProductChange = (selectedOptions) => {
    setSelectedProducts(selectedOptions.map(option => option.value));
  };

  const handleTagChange = (selectedOptions) => {
    setSelectedTags(selectedOptions.map(option => option.value));
  };


  const handleFormSubmit = async (e) => {
    try {
      let form_data = {
        interaction_type: interactionType,
        disposition: selectedDisposition,
        sub_disposition: selectedSubDisposition,
        sub_sub_disposition: selectedSubSubDisposition,
        conversation_notes: document.getElementById("conversationNotes").value,
        followup_required: followUpRequired,
        follow_up_date: followUpDate,
        created_at: new Date(),
        tags: selectedTags,
        selected_products: selectedProducts,
        customer_id: customer_data.data.customer_id,
        customer_name: customer_data.data.customer_name,
        customer_phone: customer_data.data.customer_phone,
        customer_email: customer_data.data.customer_email,
        hub: customer_data.data.hub_name,

        created_by: loggedIn_user
      };

      const formatFieldName = (field) => {
        return field.replace(/_/g, ' ').replace(/\b\w/g, char => char.toUpperCase());
      };

      const missingFields = [];
      CONVERSASTION_LOGS_REQUIRED_FIELD.forEach((field) => {
        if (form_data[field] === "" || form_data[field] === null || form_data[field] === undefined) {
          if (field === "followup_required" && from === "ONBOARD_PAGE") {
          } else {
            missingFields.push(formatFieldName(field));

          }
        }
      });
      if (interactionType === "call") {
        try {
          form_data.call_type = document.getElementById("callType1").value;
          form_data.res_type = document.getElementById("callType2").value;
        } catch (error) {

        }
      }
      if (interactionType === "email") {
        try {
          form_data.email_subject = document.getElementById("emailSubject").value;
        } catch (error) {

        }
      }
      if (interactionType === "whatsapp") {
        try {
          form_data.email_subject = document.getElementById("emailSubject").value;
        } catch (error) {

        }
      }
      if (followUpRequired) {
        try {
          form_data.assigned_to = document.getElementById("assignedTo").value;
        } catch (error) {

        }
      }

      if (missingFields.length > 0) {
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          html: `<ul>${missingFields.map(field => `<li>${field} is required</li>`).join('')}</ul>`,
        });
        return;
      }

      if (INTERACTION_TYPE_REQUIRED_FIELDS[interactionType]) {
        const missingInteractionTypeFields = [];
        INTERACTION_TYPE_REQUIRED_FIELDS[interactionType].forEach((field) => {
          if (form_data[field] === "" || form_data[field] === null || form_data[field] === undefined) {
            missingInteractionTypeFields.push(formatFieldName(field));
          }
        });


        if (missingInteractionTypeFields.length > 0) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            html: `<ul>${missingInteractionTypeFields.map(field => `<li>${field} is required</li>`).join('')}</ul>`,
          });
          return;
        }
      }

      if (followUpRequired) {
        const missingFollowUpFields = [];
        FOLLOW_REQUIRED_FIELD.forEach((field) => {
          if (form_data[field] === "" || form_data[field] === null || form_data[field] === undefined) {
            missingFollowUpFields.push(formatFieldName(field));
          }
        });

        if (missingFollowUpFields.length > 0) {
          Swal.fire({
            icon: 'error',
            title: 'Oops...',
            html: `<ul>${missingFollowUpFields.map(field => `<li>${field} is required</li>`).join('')}</ul>`,
          });
          return;
        }
      }
      setLoading(true);
      let task_id = (task_data?.data?.task_id || task_data?.task_id || generate_random_id(8));
      if (followUpRequired) {
        form_data.task_id = task_id
        form_data.task_type = TASK_TYPE.FOLLOW_UP;
        let task_data1 = {
          task_type: TASK_TYPE.FOLLOW_UP,
          task_date: followUpDate,
          assigned_to: form_data.assigned_to,
          created_by: loggedIn_user,
          created_at: new Date(),
          task_status: TASK_STATUS.PENDING,
          customer_id: customer_data.data.customer_id,
          customer_phone: customer_data.data.customer_phone,
          customer_email: customer_data.data.customer_email,
          task_id: task_id,
          attempts: task_data?.data?.attempts + 1 || task_data?.attempts + 1 || 1,
        }
        try {
          const taskResp = await create_record("tasks", task_data);
          const task_data = taskResp
          await create_record("cod_customer", form_data);
        } catch (err) {
          console.error("Error creating records:", err);
        }
      }


      if (task_data) {
        form_data.task_id = task_id;
      }
      
      create_record('conversation_logs', form_data).then((res) => {

        setLoading(false);
        Swal.fire({
          icon: 'success',
          title: 'Success',
          text: 'Conversation Log created successfully',
        });
        setActivePopup("");
        setRefresh("refresh");
      }).catch((error) => {
        setLoading(false);
        Swal.fire({
          icon: 'error',
          title: 'Oops...',
          text: 'Something went wrong!',
        });
      }
      );
    } catch (error) {
      setLoading(false);
      Swal.fire({
        icon: 'error',
        title: 'Oops...',
        text: 'Something went wrong!',
      });

    }
  };

  return (
    <div>
      <div class="">
        <div
        >
          <div className="form-group">
            <label htmlFor="interactionType">Interaction Type</label>
            <select
              className="form-select"
              id="InteractionType"
              aria-label="Default select example"
              onChange={(e) => setInteractionType(e.target.value)}
              required
            >
              <option value="" disabled selected hidden>Choose...</option>
              <option value="call">Call</option>
              <option value="email">Email</option>
              <option value="whatsApp">whatsApp</option>
            </select>
          </div>
          {interactionType === "call" && (
            <>
              <div className="form-group">
                <label htmlFor="callType1">Call Type</label>
                <select
                  className="form-select"
                  id="callType1"
                  aria-label="Default select example"
                >
                  <option value="" disabled selected hidden>Choose...</option>
                  <option value="inbound">Inbound</option>
                  <option value="outbound">Outbound</option>
                </select>
              </div>

            </>
          )}

          {interactionType === "email" && (
            <div className="form-group">
              <label htmlFor="emailSubject">Email Subject</label>
              <input
                type="text"
                className="form-control"
                id="emailSubject"
                placeholder="Enter email subject"
              />
            </div>
          )}
          {interactionType === "whatsApp" && (
            <>
              <div className="form-group">
                {/* <label htmlFor="whatsAppType">WhatsApp</label> */}
                {/* <select
                  className="form-select"
                  id="whatsApp"
                  aria-label="Default select example"
                >
                   <option value="" disabled selected hidden>Choose...</option>
                  <option value="recived">Recived</option>
                  <option value="send">Send</option>
                </select> */}
              </div>
            </>
          )}

          <div className="form-group">
            <label htmlFor="Disposition">Disposition</label>
            <select
              className="form-select"
              id="Disposition"
              onChange={handleDispositionChange}
              value={selectedDisposition}
              required
            >
              <option value="" disabled hidden>Choose...</option>
              {dispositions.map((disposition, index) => (
                <option key={index} value={disposition.name}>
                  {disposition.name}
                </option>
              ))}

            </select>
          </div>

          {selectedDisposition && (
            <div className="form-group">
              <label htmlFor="subDisposition">Sub-Disposition</label>
              <select
                className="form-select"
                id="subDisposition"
                onChange={handleSubDispositionChange}
                value={selectedSubDisposition}
                required
              >
                <option value="" disabled hidden>Choose...</option>
                {subDispositionOptions.map((sub, index) => (
                  <option key={index} value={sub.name}>{sub.name}</option>
                ))}
              </select>
            </div>
          )}

          {selectedSubDisposition && subSubDispositionOptions.length > 0 && (
            <div className="form-group">
              <label htmlFor="subSubDisposition">Sub-Sub-Disposition</label>
              <select
                className="form-select"
                id="subSubDisposition"
                onChange={(e) => setSelectedSubSubDisposition(e.target.value)}
                value={selectedSubSubDisposition}
                required
              >
                <option value="" disabled hidden>Choose...</option>
                {subSubDispositionOptions.map((option, index) => (
                  <option key={index} value={option}>{option}</option>
                ))}
              </select>
            </div>
          )}

          <div className="form-group">
            <label htmlFor="products">Select Products:</label>
            <Select
              id="products"
              isMulti
              options={allProducts.map((product) => ({
                value: product.data.productName,
                label: product.data.productName,
              }))}
              value={selectedProducts.map((product) => ({
                value: product,
                label: product,
              }))}
              onChange={(selectedOptions) =>
                setSelectedProducts(selectedOptions.map((option) => option.value))
              }
            />
          </div>

          {/* Selected Products */}
          <div className="form-group">
            {/* <label>Selected Products:</label> */}
            <div className="d-flex flex-wrap mt-2" style={{ gap: "5px" }}>
              {selectedProducts.map((product, index) => (
                <p key={index} className="subdispo_chip">{product}</p>
              ))}
            </div>
          </div>

          {/* Tag Multi-Select */}
          <div className="form-group">
            <label htmlFor="tags">Select Tags:</label>
            <Select
              options={availableTags.map(tag => ({
                value: tag.data.tag_name,
                label: tag.data.tag_name,
              }))}
              isMulti
              onChange={handleTagChange}
              placeholder="Select tags..."
              value={availableTags
                .filter(tag => selectedTags.includes(tag.data.tag_name))
                .map(tag => ({
                  value: tag.data.tag_name,
                  label: tag.data.tag_name,
                }))}
            />
          </div>

          {/* Selected Tags */}
          <div className="form-group">
            {/* <label>Selected Tags:</label> */}
            <div className="d-flex flex-wrap mt-2" style={{ gap: "5px" }}>
              {selectedTags.map((tag, index) => (
                <p key={index} className="subdispo_chip">{tag}</p>
              ))}
            </div>
          </div>
          <div class="form-group">
            <label for="conversationNotes">Conversation Notes</label>
            <textarea
              style={{ minHeight: "200px" }}
              class="form-control"
              id="conversationNotes"
              placeholder="Enter conversation notes"
              required
            ></textarea>
          </div>
          {from !== "ONBOARD_PAGE" && (
            <div className="form-group">
              <label>Follow-Up Required:</label>
              <div
                style={{
                  display: "flex",
                  flexDirection: "row",
                  alignItems: "center",
                  justifyContent: "flex-start",
                  paddingLeft: "30px",
                  gap: "25px",
                }}
              >
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="followUpRequired"
                    id="followUpYes"
                    value="yes"
                    onChange={handleFollowUpChange}
                    required
                  />
                  <label htmlFor="followUpYes">Yes</label>
                </div>
                <div className="form-check form-check-inline">
                  <input
                    className="form-check-input"
                    type="radio"
                    name="followUpRequired"
                    id="followUpNo"
                    value="no"
                    onChange={handleFollowUpChange}
                    required
                  />
                  <label htmlFor="followUpNo">No</label>
                </div>
              </div>
            </div>
          )}

          {followUpRequired === true && (<>
            <div className="form-group">
              <label htmlFor="followUpDate">Follow-Up Date</label>
              <input
                type="date"
                className="form-control"
                id="followUpDate"
                value={followUpDate}
                onChange={(e) => setFollowUpDate(e.target.value)}
                required={followUpRequired === true}
              />
            </div>
            <div className="form-group">
              <label htmlFor="assignedTo">Assigned To</label>
              <select
                className="form-select"
                id="assignedTo"
                aria-label="Default select example"
              >
                <option value="" disabled selected hidden>Choose...</option>
                {availableUsers.map((user, index) => (
                  <option key={index} value={user.data.username}>
                    {user.data.first_name} {user.data.last_name}
                  </option>
                ))}
              </select>
            </div>

          </>
          )}

          <button class="btn btn-primary" disabled={loading} onClick={(e) => handleFormSubmit(e)}>
            {loading ? "creating..." : "Create Conversation Log"}
          </button>
        </div>
      </div>

    </div>
  );
};

export default CreateConversastionLog;
