const deliveryNoteData = {
  company: {
    name: "Whyte Farms LLP (2021-24)",
    address: "Shahbad, Teh Tijara, Distt Alwar, Rajasthan 301411",
    gst: "08AACFW1767C1Z8",
    state: "Rajasthan, Code: 08",
    email: "care@whytefarms.com",
  },
  consignee: {
    name: "Muhavra Enterprises Pvt Ltd (CP)",
    address: "Shop No-44, Pratap Building N Block, Connaught Place, New Delhi-110001",
    contact: "7042979993",
    gst: "07AAICM1839L2Z3",
    state: "Delhi, Code: 07",
  },
  buyer: {
    name: "Muhavra Enterprises Pvt Ltd (Warehouse)",
    address: "Udhyog Vihar Ware House, Plot No-326, Udyog Vihar, Phase-2, Gurgaon-122008",
    contact: "N/A",
    gst: "06AAICM1839L2Z5",
    state: "Haryana, Code: 06",
  },
  deliveryDetails: {
    noteNumber: "2024-25/22738",
    referenceNumber: "",
    buyerOrderNumber: "",
    dispatchDocNumber: "",
    dispatchedThrough: "",
    dated: "10-Dec-24",
    paymentTerms: "",
    otherReference: "",
    destination: "",
  },
  termsOfDelivery: "",
  goodsTable: [
    {
      slNo: 1,
      description: "Milk",
      hsnSac: "0401",
      quantity: "42 Ltr.",
      rate: "N/A",
      per: "N/A",
      discount: "N/A",
      amount: "N/A",
    },
  ],
  summary: {
    total: "42 Ltr.",
    taxableValue: "N/A",
    totalAmount: "N/A",
    taxAmount: "NIL",
  },
  footer: {
    receivedCondition: "Recd. in Good Condition",
    companyName: "Whyte Farms LLP (2021-24)",
    authorizedSignatory: "Authorised Signatory",
    note: "This is a Computer Generated Document",
  },
};

export default deliveryNoteData;
