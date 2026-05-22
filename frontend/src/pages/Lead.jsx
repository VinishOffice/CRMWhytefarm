import React, { useState, useEffect } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { fetch_records, fetch_all_records } from "../helpers";
import Footer from "../Footer";
import TopPanel from "../TopPanel";
import Sidebar from "../Sidebar";
import { CreateConversastionLog } from "../forms";
import { ConversastionLogCard } from "../components";
import { Spinner } from "react-bootstrap";
import Modal from "react-bootstrap/Modal";
import { makingRef } from "../Utility";
import apiClient from "../services/apiClient";

const Lead = ({ task_id, show, handleClose }) => {
  const navigate = useNavigate();
  // const { task_id } = useParams();
  const [loading, setLoading] = useState(false);
  const [taskDetails, setTaskDetails] = useState(null);
  const [activePopup, setActivePopup] = useState("");
  const [dispositions, setDispositions] = useState([]);
  const [tags, setTags] = useState([]);
  const [customer_data, setCustomerData] = useState(null);
  const [conversation_logs, setConversationLogs] = useState([]);
  const [refresh, setRefresh] = useState("");
  // const [assignedTo, setAssignedTo] = useState("");
  const [availableUsers, setAvailableUsers] = useState([]);
  useEffect(() => {
    const loggedIn = localStorage.getItem("loggedIn") === "true";
    if (!loggedIn) {
      navigate("/login");
    }
  }, [navigate]);

  useEffect(() => {
    if (task_id) {
      setLoading(true);

      fetch_records("tasks", [
        {
          key: "task_id",
          value: task_id,
          operator: "==",
        },
      ])
        .then((data) => {
          setLoading(false);
          if (data.length > 0) {
            setTaskDetails(data[0]);
            fetch_records("customers_data", [
              {
                key: "customer_id",
                value: data[0].data.customer_id,
                operator: "==",
              },
            ])
              .then((data) => {
                if (data.length > 0) {
                  setCustomerData(data[0]);
                } else {
                }
              })
              .catch((error) => {
                console.error("Error fetching customer details:", error);
              });
          } else {
          }
        })
        .catch((error) => {
          setLoading(false);
          console.error("Error fetching task details:", error);
        });
    }
  }, [task_id]);

  useEffect(() => {
    fetch_records("conversation_logs", [
      {
        key: "task_id",
        value: task_id,
        operator: "==",
      },
    ], true)
      .then((data) => {
        if (data.length > 0) {
          setConversationLogs(data);
        } else {
        }
      })
      .catch((error) => {
        console.error("Error fetching conversation logs:", error);
      });
  }, [refresh]);

  const togglePopup = (value) => {
    setActivePopup(value);
  };
  useEffect(() => {
    fetch_all_records("dispositions").then((data) => {
      setDispositions(data);
    });
    fetch_all_records("tags").then((data) => {
      setTags(data);
    });
    fetch_records("users", [
      {
        key: "role",
        value: ["Customer Care Agent", "Customer Support Team Lead"], // Specify required roles
        operator: "in",
      },
    ]).then((data) => {
      setAvailableUsers(data);
    });
  }, []);

  //Assign task to the team member..
  const UpdateTeamMemberAndStatus = async ({ member, status }) => {
    const taskRef = await makingRef("tasks", task_id);
    if (member) {
      await taskRef.update({ assign_to: member });
    } else if (status) {
      await taskRef.update({ status: status });
    }
    
    // Fetch updated task details
    fetch_records("tasks", [{ key: "task_id", value: task_id, operator: "==" }])
      .then(data => {
        if (data.length > 0) {
          setTaskDetails(data[0]);
        }
      });
  };

  return (
    <Modal show={show} onHide={handleClose} size="xl">
      <Modal.Header closeButton className="modal-card-header">
        <Modal.Title>Task Details</Modal.Title>
      </Modal.Header>
      <Modal.Body>
        {loading && (
          <div className="loader-overlay">
            <img
              style={{ height: "6rem" }}
              src="/images/loader.gif"
              alt="Loading..."
            />
          </div>
        )}

        {taskDetails ? (
          <div className="row">
            <div className="d-flex">
              <div className="col-md-4">
                <p>
                  <strong>Customer Name:</strong>{" "}
                  {taskDetails.data.customer_name}
                </p>
              </div>
              <div className="col-md-4">
                <p>
                  <strong>Customer Phone:</strong>{" "}
                  {taskDetails.data.customer_phone}
                </p>
              </div>
              <p>
                <strong>Assigned Member : </strong>{" "}
                {taskDetails?.data?.assign_to}
              </p>
            </div>
            <div className="d-flex">
              <div className="col-md-4">
               <p>
  <strong>Change Member:</strong>
  <select
    value={taskDetails?.data?.assign_to || ""}
    onChange={(e) =>
      UpdateTeamMemberAndStatus({ member: e.target.value })
    }
  >
    <option value="" disabled>
      Select Agent
    </option>
    {availableUsers.map((user, index) => (
      <option
      
        key={index}
        value={user.data.first_name + " " + user.data.last_name}
      >
        {user.data.first_name} {user.data.last_name}
      </option>
    ))}
  </select>
</p>

              </div>
              <div className="col-md-4">
                <p>
                  <strong>Status:</strong>
                  <select
                    value={taskDetails?.data?.status}
                    onChange={(e) =>
                      UpdateTeamMemberAndStatus({ status: e.target.value })
                    }
                  >
                    <option value="LEAD">LEAD</option>
                    <option value="CUSTOMER">CUSTOMER</option>
                    <option value="SUBSCRIBER">SUBSCRIBER</option>
                  </select>
                </p>
              </div>
              <div className="col-md-4">
                <p>
                  <strong>Attempts:</strong> {taskDetails.data.attempts}
                </p>
              </div>
            </div>
            <div className="d-flex justify-content-end mt-2">
              <button
                className="c_btn"
                onClick={() => togglePopup("conversation_logs")}
              >
                + Create Conversation
              </button>
            </div>
          </div>
        ) : (
          <p>No task details available.</p>
        )}

        {/* Modal Content for Conversation Logs */}
        {activePopup === "conversation_logs" && (
          <CreateConversastionLog
            customer_data={customer_data}
            setActivePopup={setActivePopup}
            tags={tags}
            disposition={dispositions}
            from="ONBOARD_PAGE"
            task_data={taskDetails}
            setRefresh={setRefresh}
          />
        )}

        {/* Display Conversation Logs */}
        {conversation_logs.length > 0 && (
          <div className="container">
            {conversation_logs.map((log) => (
              <ConversastionLogCard key={log.id} data={log.data} />
            ))}
          </div>
        )}
      </Modal.Body>
    </Modal>
  );
};

export default Lead;
