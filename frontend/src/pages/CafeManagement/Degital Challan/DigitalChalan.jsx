import React, { useEffect } from "react";
import { usePDF } from "react-to-pdf";
import deliveryNoteData from "./deliveryNoteData";
import moment from "moment";
import { FaFilePdf } from "react-icons/fa";
const DigitalChalan = ({ order, cafeData }) => {



    const { toPDF, targetRef } = usePDF({ filename: "digital-chalan.pdf" });
    return (
        <div>
            <div ref={targetRef} style={{ width: "210mm", hight: "297mm", padding: "20px", paddingRight: "20px", fontFamily: "Arial, sans-serif", fontSize: "11px", position: "absolute", left: "-9999px" }}>
                {/* Header */}
                <h4 style={{ textAlign: "center", marginBottom: "20px" }}>Digital Chalan</h4>

                {/* From, To, Bill To Section */}
                <div style={{ display: "flex", wordWrap: "break-word", borderCollapse: "collapse", width: "90%" }}>
                    <div style={{ flex: 1, border: "1px solid #000", width: "50%" }}>
                        <div style={{ flex: 1, borderBottom: "1px solid #000", padding: "4px" }}>
                            {deliveryNoteData?.company?.name && (
                                <p className="m-0 text-wrap" style={{ margin: 0, fontWeight: "bold" }}>
                                    {deliveryNoteData.company.name}
                                </p>
                            )}

                            {deliveryNoteData?.company?.address && (
                                <p className="m-0 text-wrap" style={{
                                    margin: 0,
                                    wordBreak: "break-word",
                                    overflowWrap: "break-word",
                                    whiteSpace: "normal",
                                    width: "100%"
                                }}>
                                    {deliveryNoteData.company.address}
                                </p>
                            )}

                            {deliveryNoteData?.company?.gst && (
                                <p className="m-0 text-wrap" style={{ margin: 0 }}>
                                    <span>GSTIN/UIN:</span> {deliveryNoteData.company.gst}
                                </p>
                            )}

                            {deliveryNoteData?.company?.state && (
                                <p className="m-0 text-wrap" style={{ margin: 0 }}>
                                    <span>State Name:</span> {deliveryNoteData.company.state}
                                </p>
                            )}

                            {deliveryNoteData?.company?.email && (
                                <p className="m-0 text-wrap" style={{ margin: 0 }}>
                                    <span>Email:</span> {deliveryNoteData.company.email}
                                </p>
                            )}
                        </div>

                        <div className="m-0 text-wrap" style={{ flex: 1, borderBottom: "1px solid #000", padding: "4px" }}>
                            <p className="m-0 text-wrap" style={{ margin: 0 }}>
                                <span>Consignee (Ship To)</span>
                            </p>

                            {cafeData?.consignee_name && (
                                <p className="m-0 text-wrap" style={{ margin: 0, fontWeight: "bold" }}>
                                    {cafeData.consignee_name}
                                </p>
                            )}

                            {cafeData?.consignee_address && (
                                <p className="m-0 text-wrap" style={{
                                    margin: 0,
                                    wordBreak: "break-word",
                                    overflowWrap: "break-word",
                                    whiteSpace: "normal",
                                    width: "100%"
                                }}>
                                    {cafeData.consignee_address}
                                </p>
                            )}

                            {/* {cafeData?.contact_no && (
                                <p className="m-0 text-wrap" style={{ margin: 0 }}>
                                    <span>Contact:</span> {cafeData.contact_no}
                                </p>
                            )} */}

                            {cafeData?.gst_no_ship && (
                                <p className="m-0 text-wrap" style={{ margin: 0 }}>
                                    <span>GSTIN/UIN:</span> {cafeData.gst_no_ship}
                                </p>
                            )}

                            {cafeData?.state && (
                                <p className="m-0 text-wrap" style={{ margin: 0 }}>
                                    <span>State Name:</span> {cafeData.state}
                                </p>
                            )}
                        </div>


                        <div className="m-0 text-wrap" style={{ flex: 1, padding: "4px" }}>
                            <p className="m-0 text-wrap" style={{ margin: 0 }}>
                                <span>Buyer (Bill To)</span>
                            </p>

                            {cafeData?.buyer_name && (
                                <p className="m-0 text-wrap" style={{ margin: 0, fontWeight: "bold" }}>
                                    {cafeData.buyer_name}
                                </p>
                            )}

                            {cafeData?.cafe_location && (
                                <p className="m-0 text-wrap" style={{
                                    margin: 0,
                                    wordBreak: "break-word",
                                    overflowWrap: "break-word",
                                    whiteSpace: "normal",
                                    width: "100%"
                                }}>
                                    {cafeData.cafe_location}
                                </p>
                            )}

                            {cafeData?.gst_no_buyer && (
                                <p className="m-0 text-wrap" style={{ margin: 0 }}>
                                    <span>GSTIN/UIN:</span> {cafeData.gst_no_buyer}
                                </p>
                            )}

                            {cafeData?.state && (
                                <p className="m-0 text-wrap" style={{ margin: 0 }}>
                                    <span>State Name:</span> {cafeData.state}
                                </p>
                            )}
                        </div>

                    </div>
                    <div style={{ flex: 1, borderCollapse: "collapse", border: "1px solid #000" }}>
                        {/* Top Half */}
                        <div style={{ display: "flex" }}>
                            <div style={{ flex: 1, borderCollapse: "collapse", borderRight: "1px solid #000" }}>
                                <div style={{ flex: 1, borderBottom: "1px solid #000", padding: "1px" }}>
                                    <p style={{ margin: 0 }}>Delivery Note No.</p>
                                    <p><strong>{order[0].delivery_challan_no || " "}</strong></p>
                                </div>
                                {/* <div style={{ flex: 1, borderBottom: "1px solid #000", padding: "1px" }}>
                                    <p style={{ margin: 0 }}>&nbsp; </p>
                                </div>
                                <div style={{ flex: 1, borderBottom: "1px solid #000", padding: "1px" }}>
                                    <p style={{ margin: 0 }}>Reference No. & Date</p>
                                    <p>{deliveryNoteData.deliveryDetails.referenceNumber || " "} </p>
                                </div> */}
                                {/* <div style={{ flex: 1, borderBottom: "1px solid #000", padding: "1px" }}>
                                    <p style={{ margin: 0 }}>Buyer's Order No.</p>
                                    <p>{deliveryNoteData.deliveryDetails.buyerOrderNumber || " "}</p>
                                </div> */}
                                <div style={{ flex: 1, borderBottom: "1px solid #000", padding: "1px" }}>
                                    <p style={{ margin: 0 }}>Order ID.</p>
                                    <p><strong>{order[0].order_id || " "}</strong></p>
                                </div>
                                {/* <div style={{ flex: 1, borderBottom: "1px solid #000", padding: "1px" }}>
                                    <p style={{ margin: 0 }}>Dispatch Doc No.</p>
                                    <p>{deliveryNoteData.deliveryDetails.dispatchDocNumber || " "}</p>
                                </div>
                                <div style={{ flex: 1, borderBottom: "1px solid #000", padding: "1px" }}>
                                    <p style={{ margin: 0 }}>Dispatched Through</p>
                                    <p>{deliveryNoteData.deliveryDetails.dispatchedThrough || " "}</p>
                                </div> */}
                            </div>
                            <div style={{ flex: 1, borderCollapse: "collapse" }}>
                                <div style={{ flex: 1, borderBottom: "1px solid #000", padding: "1px" }}>
                                    <p style={{ margin: 0 }}>Delivery Dated</p>
                                    <p><strong>{moment(order[0].delivery_date || " ", "YYYY-MM-DD").format("DD-MMM-YY")}</strong></p>
                                </div>
                                {/* <div style={{ flex: 1, borderBottom: "1px solid #000", padding: "1px" }}>
                                    <p style={{ margin: 0 }}>Mode/Terms of Payment</p>
                                    <p>{deliveryNoteData.deliveryDetails.paymentTerms || " "}</p>
                                </div> */}
                                {/* <div style={{ flex: 1, borderBottom: "1px solid #000", padding: "1px" }}>
                                    <p style={{ margin: 0 }}>Other Reference</p>
                                    <p>{deliveryNoteData.deliveryDetails.otherReference || " "}</p>
                                </div> */}
                                <div style={{ flex: 1, borderBottom: "1px solid #000", padding: "1px" }}>
                                    <p style={{ margin: 0 }}>Ordered Dated</p>
                                    <p><strong>{moment(order[0].order_date || " ", "YYYY-MM-DD").format("DD-MMM-YY")}</strong></p>
                                </div>
                                {/* <div style={{ flex: 1, borderBottom: "1px solid #000", padding: "1px" }}>
                                    <p style={{ margin: 0 }}>&nbsp;</p>
                                </div> */}
                                {/* <div style={{ flex: 1, borderBottom: "1px solid #000", padding: "1px" }}>
                                    <p style={{ margin: 0 }}>Destination </p>
                                    <p>{deliveryNoteData.deliveryDetails.destination || " "}</p>
                                </div> */}
                            </div>
                        </div>
                        {/* Bottom Half */}
                        <div style={{ padding: "5px" }}>
                            <p style={{ margin: 0 }}><strong>Terms of Delivery:</strong>{deliveryNoteData.termsOfDelivery} </p>
                        </div>
                    </div>
                </div>

                {/* Product Details Table */}
                <table style={{ width: "90%", borderCollapse: "collapse", marginBottom: "20px" }}>
                    <thead style={{ backgroundColor: "white", color: "black" }}>
                        <tr>
                            <th style={{ border: "1px solid #000", padding: "4px" }}>Sl No.</th>
                            <th style={{ border: "1px solid #000", padding: "4px" }}>Description of Goods</th>
                            <th style={{ border: "1px solid #000", padding: "4px" }}>HSN/SAC</th>
                            <th style={{ border: "1px solid #000", padding: "4px" }}>Quantity</th>
                            {/* <th style={{ border: "1px solid #000", padding: "4px" }}>Rate</th> */}
                            {/* <th style={{ border: "1px solid #000", padding: "4px" }}>per</th> */}
                            <th style={{ border: "1px solid #000", padding: "4px" }}>Disc. %</th>
                            <th style={{ border: "1px solid #000", padding: "4px" }}>Amount</th>
                        </tr>
                    </thead>
                    <tbody>
                        {order?.map((item, index) => (
                            <tr key={index}>
                                <td style={{ border: "1px solid #000", padding: "4px" }}>{index + 1}</td>
                                <td style={{ border: "1px solid #000", padding: "4px" }}>{item?.product_name}</td>
                                <td style={{ border: "1px solid #000", padding: "4px" }}>{item?.hsn || ""}</td>
                                <td className="text-end" style={{ border: "1px solid #000", padding: "4px" }}>{item?.quantity}</td>
                                {/* <td style={{ border: "1px solid #000", padding: "4px" }}>{item?.price}</td> */}
                                {/* <td style={{ border: "1px solid #000", padding: "4px" }}>{item?.price_per || 1}</td> */}
                                <td style={{ border: "1px solid #000", padding: "4px" }}>{item?.display || ""}</td>
                                <td className="text-end" style={{ border: "1px solid #000", padding: "4px" }}>{item?.quantity * item.price}</td>
                            </tr>
                        ))}
                        <tr className="text-end fw-bold">
                            <td style={{ border: "1px solid #000", padding: "4px" }}></td>
                            <td colSpan="2" style={{ border: "1px solid #000", padding: "4px", textAlign: "right" }}>
                                <strong>Total:</strong>
                            </td>
                            <td className="text-end" style={{ border: "1px solid #000", padding: "4px" }}>
                                {Number(order.reduce((acc, item) => acc + item.quantity, 0))}
                            </td>
                            {/* <td style={{ border: "1px solid #000", padding: "4px" }}></td> */}
                            {/* <td style={{ border: "1px solid #000", padding: "4px" }}></td> */}
                            <td style={{ border: "1px solid #000", padding: "4px" }}></td>
                            <td className="text-end" style={{ border: "1px solid #000", padding: "4px" }}>
                                {order.reduceRight((acc, item) => acc + item.quantity * item.price, 0)}
                            </td>
                        </tr>
                        <tr className="text-end fw-bold">
                            <td colSpan={6} style={{ border: "1px solid #000", padding: "4px" }}>E. & O.E</td>
                        </tr>
                        <tr className="text-end">
                            <td colSpan={5} style={{ border: "1px solid #000", padding: "4px" }}>HSN/SAC</td>
                            <td style={{ border: "1px solid #000", padding: "4px" }}>Taxable Value</td>
                        </tr>
                        <tr className="text-start">
                            <td colSpan={5} style={{ border: "1px solid #000", padding: "4px" }}>04012000</td>
                            <td style={{ border: "1px solid #000", padding: "4px" }}></td>
                        </tr>
                        <tr className="text-end">
                            <td colSpan={5} className="fw-bold" style={{ border: "1px solid #000", padding: "4px" }}>Total</td>
                            <td style={{ border: "1px solid #000", padding: "4px" }}></td>
                        </tr>
                        <tr className="text-start">
                            <td colSpan={6} style={{ border: "1px solid #000", padding: "4px" }}>
                                <p><strong>Tax Amount (in words):</strong> NIL</p>
                                <p>&nbsp;</p>
                                <p>&nbsp;</p>
                                <p>&nbsp;</p>
                            </td>
                        </tr>
                        <tr>
                            <td colSpan={2} className="text-start align-top" style={{ border: "1px solid #000", padding: "4px", verticalAlign: "top" }}>
                                <p><strong>Recd. in Good Condition:</strong> {deliveryNoteData.footer.receivedCondition}</p>
                            </td>
                            <td colSpan={4} className="text-end" style={{ border: "1px solid #000", padding: "4px", verticalAlign: "bottom", height: "90px" }}>
                                <p><strong>{deliveryNoteData.footer.companyName}</strong></p>
                                <p>&nbsp;</p>
                                <p>Authorised Signatory</p>
                            </td>
                        </tr>
                    </tbody>
                </table>




                {/* Footer */}
                <div style={{ marginTop: "20px" }}>
                    <p className="text-start" style={{ margin: 0, fontSize: "12px" }}>
                        Note:{deliveryNoteData.footer.note} {moment(new Date()).format(
                            "DD-MM-YYYY, HH:mm:ss"
                        )}
                    </p>
                </div>
            </div>

            {/* Download PDF Button */}
            <button
                onClick={() => toPDF()}
                className="btn btn-primary btn-sm"
                style={{
                    marginRight: "1rem",
                    padding: "0.3rem 0.85rem",
                    cursor: "pointer",
                }}
            >
                <FaFilePdf style={{ color: "white" }} />
                &nbsp;Download PDF
            </button>

        </div>
    );
};

export default DigitalChalan;