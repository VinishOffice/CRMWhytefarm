import React, { useState, useEffect,useContext } from 'react';
import { CreateConversastionLog } from '../../forms';
import { Disposition, Tags, ConversastionLogCard } from '../'
import { fetch_records, fetch_all_records } from '../../helpers';
import { Spinner } from 'react-bootstrap';
import GlobalContext from '../../context/GlobalContext';

const conversationLogsStyles = `
  .popup {
    position: fixed;
    top: 0;
    left: 0;
    width: 100%;
    height: 100%;
    background-color: rgba(0,0,0,0.5);
    z-index: 100;
    display: flex;
    justify-content: center;
    align-items: center;
  }
  .popup-inner {
    background-color: white;
    padding: 67px;
    border-radius: 5px;
    margin-top: 10px;
    width: 45%;
    height: 80%;
    overflow-y: auto;
    box-shadow: 0 0 10px rgba(0, 0, 0, 0.1);
  }
  .popup-inner_small {
    background-color: white;
    padding: 20px;
  }
  .menu_box {
    display: flex;
    gap: 20px;
    flex-wrap: wrap;
    margin-bottom: 30px;
  }
  .c_btn {
    cursor: pointer;
    background-color: #172D88;
    padding: 5px 15px;
    border-radius: 5px;
    border: none;
    height: 40px;
    color: #f1f1f1;
  }
  .close_btn_position {
    display: flex;
    justify-content: flex-end;
  }
  .close_btn {
    cursor: pointer;
    background-color: red;
    color: white;
    padding: 5px 10px;
    border-radius: 5px;
    border: none;
    position: absolute;
    right: 30%;
    top: 11%;
  }
  .edit_icon_btn {
    cursor: pointer;
    background-color: #f1f1f1;
    padding: 5px 10px;
    border-radius: 5px;
    border: none;
  }
  .subdispo_chip {
    background-color: #f1f1f1;
    padding: 5px 10px;
    border-radius: 5px;
  }
  .remove_subdispo {
    cursor: pointer;
    background-color: red;
    color: white;
    padding: 2.5px 5px;
    border-radius: 5px;
    border: none;
    margin: 0px 2px;
  }
  .delete_btn {
    cursor: pointer;
    background-color: red;
    color: #fff;
    padding: 5px 10px;
    border-radius: 5px;
    border: none;
  }
  .option_look {
    cursor: pointer;
    background-color: #f1f1f1;
    padding: 5px 10px;
    border-radius: 5px;
    border: none;
  }
  .c_select {
    border: 1px solid #ccc;
    height: 35px;
    padding: 5px;
  }
  .select-container {
    display: flex;
    flex-direction: column;
    margin-bottom: 10px;
  }
  .select-label {
    margin-bottom: 5px;
    font-weight: bold;
  }
  .c_input_date {
    border: 1px solid #ccc;
    height: 30px;
    padding: 5px;
  }
`;

const ConversationLogs = ({ customer_data }) => {
  const { permissible_roles } = useContext(GlobalContext);
  const [activePopup, setActivePopup] = useState("");
  const [conversastionLogs, setConversastionLogs] = useState([]);
  const [dispositions, setDispositions] = useState([]);
  const [selectedDisposition, setSelectedDisposition] = useState();
  const [sub_dispositions, setSubDispositions] = useState([]);
  const [tags, setTags] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refesh, setRefresh] = useState("");

  const [conversastion_filters, setConversastionFilters] = useState([
    {
      "key": "customer_id",
      "value": customer_data?.data?.customer_id,
      "operator": "=="
    }
  ]);

  const togglePopup = (value) => {
    setActivePopup(value);
  };
  useEffect(() => {
    fetch_all_records('dispositions').then((data) => {
      setDispositions(data);

    });
    fetch_all_records('tags').then((data) => {
      setTags(data);
    });

  }
    , []);

  


  useEffect(() => {
    setLoading(true);
    fetch_records('conversation_logs',conversastion_filters,true).then((data) => {
      setConversastionLogs(data);
      setLoading(false);
    });
  }, [conversastion_filters,refesh]);

  const handleDispositionChange = (selected) => {
    if (selected === "all") {
      setSelectedDisposition(null);
      setSubDispositions([]);
      applyFilterChange("remove",{
        "key": "disposition",
        "value": selectedDisposition,
        "operator": "=="
      });
      return;
    }
    setSelectedDisposition(selected);
    dispositions.map((disposition) => {
      if (disposition.data.name === selected) {
        setSubDispositions(disposition.data.subdispositions);
        applyFilterChange("add",{
          "key": "disposition",
          "value": selected,
          "operator": "=="
        });
      
      }
    }
    )
  }

  const handleFollowupChange = (selected) => {
    if (selected === "all") {
      applyFilterChange("remove",{
        "key": "followup_required",
        "value": "yes",
        "operator": "=="
      });
      return;
    }
    let choice = null;
    if (selected === "yes") {
      choice = true;
    }
    if (selected === "no") {
      choice = false;
    }
  


    applyFilterChange("add",{
      "key": "followup_required",
      "value": choice,
      "operator": "=="
    });
  }

  const handleTagChange = (selected) => {
    
    if (selected === "all") {
      applyFilterChange("remove",{
        "key": "tags",
        "value": selected,
        "operator": "=="
      });
      return;

    }
    applyFilterChange("add",{
      "key": "tags",
      "value": [selected],
      "operator": "array-contains-any"
    });
  }



  const handleCommunicationTypeChange = (selected) => {
    if (selected === "all") {
      applyFilterChange("remove",{
        "key": "interaction_type",
        "value": selected,
        "operator": "=="
      });
      return;
    }
    applyFilterChange("add",{
      "key": "interaction_type",
      "value": selected,
      "operator": "=="
    });
  }


  const applyFilterChange = (type, object = null) => {
    if (type === "remove") {
      setConversastionFilters(conversastion_filters.filter((filter) => filter.key !== object.key));
    }
    if (type === "add") {
      const existingFilterIndex = conversastion_filters.findIndex((filter) => filter.key === object.key);
      if (existingFilterIndex !== -1) {
 
        const updatedFilters = [...conversastion_filters];
        updatedFilters[existingFilterIndex] = object;
        setConversastionFilters(updatedFilters);
      } else {
        setConversastionFilters([...conversastion_filters, object]);
      }
    }
  };

  const handleDateChange = ()=>{
    const from_date = document.getElementById('from_date').value;
    const to_date = document.getElementById('to_date').value;
    if(from_date){
      const fromDateObject = new Date(from_date);

      applyFilterChange("add",{
        "key": "created_at",
        "value": fromDateObject,
        "operator": ">="
      });
    }
    if(to_date){
      const toDateObject = new Date(to_date);
      applyFilterChange("add",{
        "key": "created_at",
        "value": toDateObject,
        "operator": "<="
      });
    }
  }

  return (
    <>
      <style>{conversationLogsStyles}</style>
      <div className="menu_box">
        <button className="c_btn" onClick={() => togglePopup("conversation_logs")}>
          + Create New Conversation Log
        </button>
        {permissible_roles.includes('view_dispositions') ? <button className="c_btn" onClick={() => togglePopup("disposition")}> + Disposition</button> : <></>}
        {permissible_roles.includes('view_tags') ? <button className="c_btn" onClick={() => { togglePopup("tags") }}> + Tags</button> : <></>}
        <select className='c_select' onChange={(e)=>{handleCommunicationTypeChange(e.target.value)}}>
          <option value={"all"}>Communication Type</option>
          <option value="email">Email</option>
          <option value="call">Call</option>
        </select>

        <div className='flex' style={{
          gap: '10px',
        }}>
          <span>FROM:</span>
          <input type='date' className='c_input_date mx-2' placeholder='From Date' id='from_date' onChange={()=>{handleDateChange()}}/>
          <span>TO:</span>
          <input type='date' className='c_input_date mx-2' placeholder='To Date' id='to_date' onChange={()=>{handleDateChange()}}/>
        </div>
        <select className='c_select' onChange={(e) => { handleDispositionChange(e.target.value) }}>
          <option value={"all"}>Disposition</option>
          {dispositions.map((disposition) => (
            <option key={disposition.id} value={disposition.data.name}>{disposition.data.name}</option>
          ))}
        </select>

        <select className='c_select' onChange={(e)=>{handleFollowupChange(e.target.value)}}>
          <option value={"all"}>Followup Required</option>
          <option value="yes" >Yes</option>
          <option value="no">No</option>
        </select>

        <select className='c_select' onChange={(e)=>{handleTagChange(e.target.value)}}>
          <option value={"all"}>Tags</option>
          {tags.map((tag) => (
            <option key={tag.doc_id} value={tag.data.tag_name}>{tag.data.tag_name}</option>
          ))}
        </select>
      </div>

      {activePopup === "conversation_logs" && (
        <div className="popup">
          <div className="popup-inner">
            <div className='close_btn_position'>
              <button className="close_btn" onClick={() => togglePopup("")}>
                X
              </button>
            </div>
            <CreateConversastionLog customer_data={customer_data} setActivePopup={setActivePopup} tags={tags} disposition={dispositions} setRefresh={setRefresh}/>
          </div>
        </div>
      )}
      {activePopup === "disposition" && (
        <div className="popup">
          <div className="popup-inner">
            <div className='close_btn_position'>
              <button className="close_btn" onClick={() => togglePopup("")}>
                X
              </button>
            </div>
            <Disposition setActivePopup={setActivePopup} dispositions={dispositions} />
          </div>
        </div>
      )}

      {activePopup === "tags" && (
        <div className="popup">
          <div className="popup-inner_small">
            <div className='close_btn_position'>
              <button className="close_btn" onClick={() => togglePopup("")}>
                X
              </button>
            </div>
            <Tags tags={tags} />
          </div>
        </div>
      )}
      {loading ? <>
        <div style={{
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          height: '50vh'
        }}>
          <Spinner animation="border" variant="primary" />
        </div>
      </> : <>
        <div className="conversation_logs">
          {conversastionLogs.map((log) => (
            <ConversastionLogCard key={log.id} data={log.data} />
          ))}
        </div>
      </>}


    </>
  );
};

export default ConversationLogs;