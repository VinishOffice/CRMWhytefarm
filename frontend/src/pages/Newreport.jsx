import React, { useState, useEffect } from 'react';
import * as XLSX from 'xlsx';
import { CSVLink } from 'react-csv';


import { fetch_records, fetch_all_records } from '../helpers';
import moment from 'moment';
import CustomDateRangePicker from '../components/CustomDateRangePicker';
import { fromDate, now, serverTimestamp, fromSecondsNanoseconds, toDate } from '../utils/dateUtils';



const subDispositionOptions = {
  Interested: ['Callback Later', 'Follow Up'],
  NotInterested: ['Wrong Number', 'Not Required'],
  Converted: ['Order Placed']
};

const Newreport = () => {
  const [logs, setLogs] = useState([]);
  const [customer, setCustomer] = useState([])
  const [DispositionOption, setDispositionsOption] = useState([])
  const [followUp, setFollowUp] = useState([])
  const [Agentname, setAgentName] = useState([])
  const [subDisposition, setSubDispositions] = useState([])
  const [filtered, setFiltered] = useState([]);
  const [tags, setTags] = useState([]);
  const [Interaction, setInteraction] = useState([])
  const [Products, setProducts] = useState([])
  const [loading, setLoading] = useState(true);
  const [refesh, setRefresh] = useState("");
  const [CsvData, setCsvData] = useState([])
  const [showDropdown, setShowDropdown] = useState(false);
  const [SelectedDisposition, setSelectedDisposition] = useState([])
  const [SelectedSubDisposition, setSelectedSubDisposition] = useState("");
  const [subSubDisposition, setSubSubDisposition] = useState({});
  const [subSubDispositions, setSubSubDispositions] = useState([]);





  const [conversastionLogs, setConversastionLogs] = useState([]);












  const [conversastion_filters, setConversastionFilters] = useState([
    // {
    //   "key": "customer_id",
    //   "value": "",
    //   "operator": "=="
    // }
    {
      key: "dateFrom",
      operator: ">=",
      value: moment("2025-05-16")
    }

  ]);


  const [filters, setFilters] = useState({
    dateFrom: new Date().setHours(0, 0, 0, 0),
    dateTo: new Date().setHours(23, 59, 59, 999),
    disposition: '',
    subDisposition: '',
    tags: '',
    Interaction: "",
    followUp: '',
    product: '',
    notes: '',
    search: '',
    customerid: ""


  });
  const [filters1, setFilters1] = useState({
    disposition: "",
    subDisposition: "",
    tags: "",
    Interaction: "",
    followUp: "",
    product: "",
    Agentname: "",
    search: "",
    customerid: "",
    communicationType: "",
    subSubDisposition: "",
  })




  const headers = [
    { label: 'Customer ID', key: 'customer_id' },
    { label: 'Customer Name', key: 'customer_name' },
    { label: 'Customer Phone', key: 'customer_phone' },
    { label: 'Date', key: 'created_at' },
    { label: 'Disposition', key: 'disposition' },
    { label: 'Sub-Disposition', key: 'sub_disposition' },
      { label: 'Sub-Sub-Disposition', key: 'sub_sub_disposition' },
    { label: 'Tags', key: 'tags' },
    { label: 'Interaction', key: 'interaction_type' },
    { label: 'Follow-Up Date', key: 'follow_up_date' },
    { label: 'Product', key: 'selected_products' },
    { label: 'Notes', key: 'conversation_notes' },
    { label: 'Agent Name', key: 'Agentname' },
    { label: 'hub', key: 'hub' },
  


  ];



  const handleRowClick = (customer_id) => {
    window.open(`/profile/${customer_id}`, "_blank");
  };








  const ApplyFilter = (e) => {
    if (e) e.preventDefault(); // Prevent page reload if used in form

    let filteredData = conversastionLogs;

    if (filters1.disposition) {
      filteredData = filteredData.filter(
        (logItem) => logItem.data.disposition === filters1.disposition
      );
    }

    if (filters1.subDisposition) {
      filteredData = filteredData.filter(
        (logItem) => logItem.data.sub_disposition === filters1.subDisposition
      );
    }

    if (filters1.subSubDisposition) {
      filteredData = filteredData.filter(
        (logItem) => logItem.data.sub_sub_disposition === filters1.subSubDisposition
      );
    }





    if (filters1.tags) {
      filteredData = filteredData.filter((logItem) =>
        Array.isArray(logItem.data.tags) &&
        logItem.data.tags.some((tag) => typeof tag === "string" &&
          tag.toLowerCase().includes(filters1.tags.toLowerCase())
        )
      );
    }

    if (filters1.Interaction) {
      filteredData = filteredData.filter(
        (logItem) => logItem.data.interaction_type === filters1.Interaction
      );
    }


    if (filters1.followUp) {
      filteredData = filteredData.filter(
        (logItem) => logItem.data.follow_up_date === filters1.followUp
      );
    }

    if (filters1.product) {
      filteredData = filteredData.filter(logItem =>
        logItem.data.selected_products.some(product =>
          product.toLowerCase().includes(filters1.product.toLowerCase())
        )
      );
    }

  if (filters1.Agentname) {
  filteredData = filteredData.filter(
    (logItem) => logItem.data.created_by === filters1.Agentname
  );

}


    if (filters1.search) {
      filteredData = filteredData.filter(
        (logItem) => logItem.data.search === filters1.search
      );
    }

    if (filters1.customerid) {
      filteredData = filteredData.filter(
        (logItem) => logItem.data.customerid === filters1.customerid
      );
    }

    setLogs(filteredData);
  };

  const handleFilterChange = (e) => {
    setFilters({ ...filters, [e.target.name]: e.target.value });
  };



  const handleFilterChange1 = (e) => {
    const { name, value } = e.target;

    setFilters1(prev => ({
      ...prev,
      [name]: value,
      ...(name === "disposition" && { subDisposition: "", subSubDisposition: "" }),
      ...(name === "subDisposition" && { subSubDisposition: "" }),
    }));

    if (name === "disposition") {
      setSelectedDisposition(value); // for sub-disposition dropdown
    }

    if (name === "subDisposition") {
      setSelectedSubDisposition(value); // ← for sub-sub-disposition dropdown
    }
  };


  useEffect(() => {
    if (filters.dateFrom && filters.dateTo) {
      const filterData = [
        {
          key: "created_at",
          operator: ">=",
          value: fromDate(new Date(new Date(filters.dateFrom).setHours(0, 0, 0, 0))),
        },
        {
          key: "created_at",
          operator: "<=",
          value: fromDate(new Date(new Date(filters.dateTo).setHours(23, 59, 59, 999))),
        },
      ];

      let CustmName = [];
      setLoading(true);

      fetch_records('conversation_logs', filterData, false).then(async (data) => {

        const promises = data.map(async (item) => {
          if (item.data.customer_name === undefined) {
            const customerid = item.data.customer_id;
            const query = [{ value: customerid, operator: "==", key: "customer_id" }];
            const name = await fetch_records('customers_data', query, false);
            const mergedData = {
              ...item,
              data: {
                ...item.data,
                ...(name[0]?.data || {})
              }
            };
            return mergedData;
          } else {
            return item;
          }
        });

        CustmName = await Promise.all(promises);
        setConversastionLogs(CustmName);

        setLogs(CustmName)
      });



      setLoading(false);
    }
  }, [filters]);


  useEffect(() => {
    if (conversastionLogs.length > 0) {
      const Disp = conversastionLogs
        .map((data) => data.data.disposition)
        .reduce((accum, data) => {

          if (!accum.includes(data)) {
            accum.push(data);
          }
          return accum;
        }, []);


      setDispositionsOption(Disp)
    }
  }, [conversastionLogs]);

  useEffect(() => {
    if (conversastionLogs.length > 0) {
      const SubDisp = conversastionLogs
        .map((data) => data.data.sub_disposition)
        .reduce((accum, data) => {

          if (!accum.includes(data)) {
            accum.push(data);
          }
          return accum;
        }, []);


      // setLogs(conversastionLogs);
      setSubDispositions(SubDisp)
    }
  }, [conversastionLogs]);


  useEffect(() => {
    if (conversastionLogs.length > 0) {
      const tags = conversastionLogs
        .map((data) => data?.data?.tags)
        .flat()
        .filter((tag) => typeof tag === "string");

      const uniqueTags = [...new Set(tags)];
      setTags(uniqueTags);
    }
  }, [conversastionLogs]);

  useEffect(() => {
    if (conversastionLogs.length > 0) {
      const Interaction = conversastionLogs
        .map((data) => data.data.interaction_type)
        .reduce((accum, data) => {

          if (!accum.includes(data)) {
            accum.push(data);
          }
          return accum;
        }, []);


      setInteraction(Interaction)
    }
  }, [conversastionLogs]);



  useEffect(() => {
    if (conversastionLogs.length > 0) {
      const Products = conversastionLogs
        .flatMap(log => log.data.selected_products)
        .filter((item, index, self) => self.indexOf(item) === index);


      setProducts(Products)
    }
  }, [conversastionLogs]);


  useEffect(() => {
    if (conversastionLogs.length > 0) {
      const customer = conversastionLogs
        .map((data) => data.data.customer_id)
        .reduce((accum, data) => {

          if (!accum.includes(data)) {
            accum.push(data);
          }
          return accum;
        }, []);


      setCustomer(customer)
    }
  }, [conversastionLogs]);



  useEffect(() => {
    if (conversastionLogs.length > 0) {
      const Agent = conversastionLogs
        .map((data) => data.data.created_by
        )
        .reduce((accum, data) => {

          if (!accum.includes(data)) {
            accum.push(data);
          }
          return accum;
        }, []);


      setAgentName(Agent)
    }
  }, [conversastionLogs]);


  useEffect(() => {
    if (conversastionLogs.length > 0) {
      const follow = conversastionLogs
        .map((data) => data.data.follow_up_date)
        .reduce((accum, data) => {

          if (!accum.includes(data)) {
            accum.push(data);
          }
          return accum;
        }, []);


      setFollowUp(follow)
    }
  }, [conversastionLogs]);



  const handleReset = () => {
    const DefaultFilters = {
      disposition: "",
      subDisposition: "",
      tags: "",
      Interaction: "",
      followUp: "",
      product: "",
      Agentname: "",
      search: "",
      customerid: ""
    }
    setFilters1(DefaultFilters)
    // setFiltered(logs)
    setLogs(conversastionLogs)
  }






  const handleDateChange = (startDate, endDate) => {
    setFilters(prev => {
      return { ...prev, dateFrom: startDate, dateTo: endDate }

    })

  }



  const exportToExcel = () => {
    const excelData = data;
    const worksheet = XLSX.utils.json_to_sheet(excelData);
    const workbook = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(workbook, worksheet, 'Conversation Logs');
    XLSX.writeFile(workbook, 'conversation_logs.xlsx');
  };

  const handleCsvUpload = (rows) => {
    setCsvData(rows);
    setLogs(rows);
  };
  const data = logs.map(log => ({
    customer_id: log.data.customer_id,
    customer_name: log.data.customer_name,
    customer_phone: log.data.customer_phone,
    created_at: moment(log.data.created_at.seconds * 1000).format('DD-MM-YYYY'),
    disposition: log.data.disposition,
    sub_disposition: log.data.sub_disposition,
    sub_sub_disposition: log.data.sub_sub_disposition || '',
    tags: log.data.tags.join(', '),
    interaction_type: log.data.interaction_type,
    follow_up_date: moment(log.data.follow_up_date).format('DD-MM-YYYY') || '',
    selected_products: log.data.selected_products.join(', '),
    conversation_notes: log.data.conversation_notes,
    Agentname: log.data.created_by,
    hub: log.data.hub



  }));



  useEffect(() => {
    if (conversastionLogs.length > 0) {
      const grouped = {};

      conversastionLogs.forEach(log => {
        const disp = log.data.disposition;
        const subDisp = log.data.sub_disposition;

        if (disp && subDisp) {
          if (!grouped[disp]) grouped[disp] = [];
          if (!grouped[disp].includes(subDisp)) {
            grouped[disp].push(subDisp);
          }
        }
      });

      setSubDispositions(grouped);
    }
  }, [conversastionLogs]);


  useEffect(() => {
    if (conversastionLogs.length > 0 && filters1.subDisposition) {
      const subSubDispOptions = conversastionLogs
        .filter(log => log.data.sub_disposition === filters1.subDisposition)
        .map(log => log.data.sub_sub_disposition)
        .filter((val, i, self) => val && self.indexOf(val) === i);

      setSubSubDispositions(subSubDispOptions); // ← create this state
    }
  }, [filters1.subDisposition, conversastionLogs]);


  return (
    <>
      <div className="container py-4">
        <h2 className="text-center mb-4">Conversation Logs Report</h2>
        <div className="col-12 mt-4">
          <div className='d-flex flex-row justify-content-between'>
            <div className="form-group" style={{ maxWidth: '300px', position: 'relative', zIndex: 1050 }}>
              <label className="form-label mb-1 fw-bold">Date Range</label>
              <CustomDateRangePicker onDateChange={handleDateChange} />
            </div>
            <div> <button onClick={exportToExcel} className="btn btn-success me-2">
              Export to Excel
            </button>


              <CSVLink
                data={data}
                headers={headers}
                filename="conversation_logs.csv"
                className="btn btn-success me-2"
              >
                Export to CSV
              </CSVLink></div>
          </div>




          {/* Filters */}
          <div className="col-md-12">
            <div className="row g-3">
              <div className="col-md-3">
                <label className="form-label">Disposition</label>
                <select name="disposition" onChange={handleFilterChange1} value={filters1.disposition} className="form-control">
                  <option value="">Select All</option>
                  {DispositionOption.map((dispval, idx) => (
                    <option key={idx} value={dispval}>{dispval}</option>
                  ))}
                </select>
              </div>




              <div className="col-md-3">
                <label className="form-label">Sub-Disposition</label>

                <select name="subDisposition" onChange={handleFilterChange1} value={filters1.subDisposition} className="form-control">
                  <option value="">Sub-Disposition</option>
                  {(subDisposition[SelectedDisposition] || []).map((sub, idx) => (
                    <option key={idx} value={sub}>{sub}</option>
                  ))}
                </select>
              </div>
              
              <div className="col-md-3">
                <label className="form-label">Sub-Sub-Disposition</label>
              <select
                name="subSubDisposition"
                value={filters1.subSubDisposition}
                onChange={handleFilterChange1}
                className="form-control"
              >
                <option value="">sub-sub Disposition</option>
                {subSubDispositions.map((subSub, index) => (
                  <option key={index} value={subSub}>
                    {subSub}
                  </option>
                ))}
              </select>
                 </div>


              <div className="col-md-3 position-relative">
                <label className="form-label">Tags</label>
                <input
                  type="text"
                  name="tags"
                  className="form-control"
                  placeholder="Tags"
                  value={filters1.tags}
                  onChange={(e) => setFilters1({ ...filters1, tags: e.target.value })}
                  onFocus={() => setShowDropdown(true)}
                  onBlur={() => setTimeout(() => setShowDropdown(false), 100)}
                  autoComplete="off"
                />
                {showDropdown && filters1.tags && (
                  <div className="dropdown-menu show w-100">
                    {tags
                      .filter(tag => tag.toLowerCase().includes(filters1.tags.toLowerCase()))
                      .map((tag, idx) => (
                        <div
                          key={idx}
                          className="dropdown-item"
                          onMouseDown={() => {
                            setFilters1({ ...filters1, tags: tag });
                            setShowDropdown(false);
                          }}
                        >
                          {tag}
                        </div>
                      ))}
                  </div>
                )}
              </div>

              <div className="col-md-3">
                <label className="form-label">Interaction</label>
                <select name="Interaction" value={filters1.Interaction} onChange={handleFilterChange1} className="form-control">
                  <option value="">All</option>
                  {Interaction.map((comm, idx) => (
                    <option key={idx} value={comm}>{comm}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">Follow-Up Date</label>
                <select name="followUp" onChange={handleFilterChange1} value={filters1.followUp} className="form-control">
                  <option value="">All</option>
                  {followUp.map((folo, idx) => (
                    <option key={idx} value={folo}>{folo}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3">
                <label className="form-label">Product</label>
                <select name="product" onChange={handleFilterChange1} value={filters1.product} className="form-control">
                  <option value="">All</option>
                  {Products.map((prod, idx) => (
                    <option key={idx} value={prod}>{prod}</option>
                  ))}
                </select>
              </div>

              <div className="col-md-3 mb-4">
                <label className="form-label">Agent-Name</label>
                <select name="Agentname" onChange={handleFilterChange1} value={filters1.Agentname} className="form-control">
                  <option value="">All</option>
                  {Agentname.map((Agent, idx) => (
                    <option key={idx} value={Agent}>{Agent}</option>
                  ))}
                </select>
              </div>
              <div className="col-md-3 mb-4 ">
                <button onClick={ApplyFilter} className="btn btn-success me-3 mt-4  ">Search</button>



                <button onClick={handleReset} className="btn btn-success me-3 mt-4 ">
                  Reset
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Buttons */}

      </div>
      {/* Table */}
      <div className="table-responsive">
        <table className="table table-bordered table-striped">
          <thead className="table-dark">
            <tr>

              <th>Customer ID</th>
              <th>Customer Name</th>
              <th>Customer Phone</th>
              <th>Agent Name</th>
              <th>Date</th>
              <th>Disposition</th>
              <th>Sub-Disposition</th>
               <th>Sub-Sub-Disposition</th>
              <th>Tags</th>
              <th>Hub</th>
              <th>Interaction</th>
              <th>Follow-Up Date</th>
              <th>Product</th>
              <th>Notes</th>
              <th>Timestamp</th>
             

            </tr>
          </thead>
          <tbody>
            {logs && logs.length > 0 ? logs.map((conversation, idx) => (
              <tr key={idx} onClick={() => handleRowClick(conversation.data.customer_id)}>
                <td>{conversation.data.customer_id || ''}</td>
                <td>{conversation.data.customer_name || ''}</td>
                <td>{conversation.data.customer_phone || ''}</td>
                <td>{conversation.data.created_by || ''}</td>
                <td>{moment(conversation.data.created_at.seconds * 1000).format('DD-MM-YYYY') || ''}</td>
                <td>{conversation.data.disposition || ''}</td>
                <td>{conversation.data.sub_disposition || ''}</td>
                 <td>{conversation.data.sub_sub_disposition || ''}</td>
                <td>{(conversation.data.tags || []).join(', ')}</td>
                <td>{conversation.data.hub || ''}</td>


                <td>{conversation.data.interaction_type || ''}</td>
                <td>{moment(conversation.data.follow_up_date).format('DD-MM-YYYY') || ''}</td>
                <td>{(conversation.data.selected_products || []).join(', ')}</td>
                <td style={{ padding: 0 }}>
                  <div style={{
                    maxHeight: "200px",      // allow vertical space
                    overflowY: "auto",       // scroll if text too long
                    whiteSpace: "pre-wrap",  // respect newlines and wrap text
                    wordBreak: "break-word", // break long words
                    overflowWrap: "break-word",
                    padding: "8px",          // spacing inside
                    width: "50vw"            // fill the td width
                  }}>
                    {conversation.data.conversation_notes || ''}
                  </div>
                </td>


                <td>{moment(conversation.data.created_at.seconds * 1000).format('DD-MM-YYYY hh:mm:ss') || ''}</td>
               

              </tr>
            )) : (
              <tr>
                <td colSpan="11" className="text-center">No data found.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </>
  );

};

export default Newreport;
