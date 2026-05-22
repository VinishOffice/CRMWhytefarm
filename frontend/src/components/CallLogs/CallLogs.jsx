import React, { useEffect, useState, useContext } from 'react';
import GlobalContext from '../../context/GlobalContext';
import { Spinner } from 'react-bootstrap';
import { DateTimeUtil } from '../../Utility';
import { fetchKnowlarityCallLogs } from "../../services/telephonyService";
import apiClient from "../../services/apiClient";
const AgentCollection = "users";

const CallLogs = ({ customer_data }) => {
    const { permissible_roles } = useContext(GlobalContext);
    const [customerPhone, setCustomerPhone] = useState(null);
    const [callLogs, setCallLogs] = useState([]); 
    const [loading, setLoading] = useState(true);
    const [agents, setAgents] = useState(new Map());

    useEffect(() => {
        if (callLogs.length > 0) {
            const agentNumbers = callLogs.map(({ destination }) => {
                const match = destination.match(/^\+91(\d{10})$/);
                return match ? match[1] : "NA"; 
            }).filter(number => number !== "NA");

            if (agentNumbers.length > 0) {
                updateAgents(agentNumbers);
            }
        }
    }, [callLogs]);

    const fetchAgentData = async (agentNumbers) => {
        try {
            const { data } = await apiClient.post("/api/users/query", {
                filters: [{ field: "phone_no", op: "in", value: agentNumbers }],
            });
            return data?.data || [];
        } catch (error) {
            console.error("Agent data fetch error: ", error);
            return [];
        }
    };

    const updateAgents = async (agentNumbers) => {
        const agentsData = await fetchAgentData(agentNumbers);
        const newAgentsMap = new Map();

        agentsData.forEach(agent => {
            newAgentsMap.set(agent.phone_no, `${agent.first_name || ""} ${agent.last_name || ""}`);
        });

        setAgents(newAgentsMap);
    };

    const fetchCustomerCallLogs = (customerPhone) => {
        fetchKnowlarityCallLogs(customerPhone)
            .then((resp) => {
                setCallLogs(resp.data?.objects || []);
                setLoading(false);
            })
            .catch((err) => {
                console.error("Error fetching call logs:", err);
                setLoading(false);
            });
    };

    useEffect(() => {
        if (customer_data) {
            setCustomerPhone(customer_data?.data?.customer_phone);
        }
    }, [customer_data]);

    useEffect(() => {
        if (customerPhone) {
            fetchCustomerCallLogs(customerPhone);
        }
    }, [customerPhone]);

    if (!customerPhone) {
        return <div>Customer does not have a phone number</div>;
    }

    return (
        <>
            {loading ? (
                <Spinner animation="border" role="status" />
            ) : (
                <div className="container mt-4">
                    {callLogs.map((callLog, index) => {
                        const agentPhone = (callLog.destination.match(/^\+91(\d{10})$/) || [])[1] || "NA";
                        return (
                            <div key={index} className="card mb-3" style={{ width: '100%' }}>
                                <div className="card-body">
                                    <div className="row mb-2">
                                        <div className="col">
                                            <p className="card-text"><strong>Call Type:</strong> {callLog.Call_Type === 1 ? 'Outgoing' : 'Incoming'}</p>
                                        </div>
                                        <div className="col">
                                            <p className="card-text"><strong>Agent Phone:</strong> {agentPhone}</p>
                                        </div>
                                    </div>
                                    <div className="row mb-2">
                                        <div className="col">
                                            <p className="card-text"><strong>Call Date:</ strong> {DateTimeUtil.timestampToDate(callLog.start_time)+" "+DateTimeUtil.timestampToTimeAMPM(callLog.start_time)}</p>
                                        </div>
                                        <div className="col">
                                            <p className="card-text"><strong>Agent Name:</strong> {agents.get(agentPhone) || "Unknown"}</p>
                                        </div>
                                    </div>
                                    <div className="row mb-2">
                                        <div className="col">
                                            <p className="card-text"><strong>Call Duration:</strong> {callLog.call_duration} seconds</p>
                                        </div>
                                    </div>
                                    <div className="d-flex justify-content-between align-items-center">
                                        <audio controls>
                                            <source src={callLog.call_recording} type="audio/wav" />
                                            Your browser does not support the audio element.
                                        </audio>
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            )}
        </>
    );
};

export default CallLogs;