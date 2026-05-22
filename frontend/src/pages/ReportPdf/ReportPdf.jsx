import React from 'react'
import { Image, Text, View, Page, Document, StyleSheet } from '@react-pdf/renderer';
import moment from 'moment';
const ReportPdf = ({ wallet_data, customer_data,start_date,end_date }) => {
    let formattedStartDate = null;
    let formattedEndDate = null;
    if (start_date) {
        formattedStartDate = moment(start_date).format('DD-MM-YYYY');
    }
    if(end_date){
        formattedEndDate = moment(end_date).format('DD-MM-YYYY');
    }else{
        formattedEndDate = moment(new Date()).format('DD-MM-YYYY');
    }
    let customer_name = customer_data?.data?.customer_name ?? ''
    let customer_phone_number = customer_data?.data?.customer_phone ? `+91 ${customer_data.data.customer_phone}` : ''
    let customer_address = customer_data?.data?.customer_address ?? ''
    let customer_email = customer_data?.data?.customer_email ?? ''
    let customer_hub = customer_data?.data?.hub_name ?? ''
    let account_balance = customer_data?.data?.wallet_balance ?? ''

    const styles = StyleSheet.create({
        page: { fontSize: 11, paddingTop: 20, paddingLeft: 40, paddingRight: 40, lineHeight: 1.5, flexDirection: 'column' },

        spaceBetween: { flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', color: "#3E3E3E" },

        titleContainer: { flexDirection: 'row', marginTop: 24 },

        logo: { width: 90 },

        reportTitle: { fontSize: 16, textAlign: 'center', margin: '10px 0px' },

        addressTitle: { fontSize: 11, fontStyle: 'bold' },

        invoice: { fontWeight: 'bold', fontSize: 20 },

        invoiceNumber: { fontSize: 11, fontWeight: 'bold' },

        address: { fontWeight: 400, fontSize: 10 },

        theader: { marginTop: 20, fontSize: 10, fontStyle: 'bold', paddingTop: 4, paddingLeft: 7, flex: 1, height: 20, backgroundColor: '#DEDEDE', borderColor: 'whitesmoke', borderRightWidth: 1, borderBottomWidth: 1 },

        theader2: { flex: 2, borderRightWidth: 0, borderBottomWidth: 1 },

        tbody: { fontSize: 9, paddingTop: 4, paddingLeft: 7, flex: 1, borderColor: 'whitesmoke', borderRightWidth: 1, borderBottomWidth: 1 },

        total: { fontSize: 9, paddingTop: 4, paddingLeft: 7, flex: 1.5, borderColor: 'whitesmoke', borderBottomWidth: 1 },

        tbody2: { flex: 2, borderRightWidth: 1, },

        invoice_body: { backgroundColor: '#fff', padding: '5% 10%' },

        address_body_style: { margin: '10px 0px', backgroundColor: '#fff', borderRadius: '10px', height: 'auto', border: '1px solid #ccc' },

        address_text_style: { padding: '10px 5px', fontSize: 12 },
        icon_style: { width: 20, height: 20 },
        transactionHeader: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            borderBottomWidth: 1,
            borderBottomColor: '#ccc',
            paddingBottom: 5,
            marginBottom: 10,
        },
        headerText: {
            fontSize: 10,
            fontWeight: 'bold',
        },
        transactionRow: {
            flexDirection: 'row',
            justifyContent: 'space-between',
            marginBottom: 5,
        },
        transactionText: {
            fontSize: 10,
        },

    });

    const InvoiceTitle = () => (
        <View style={styles.titleContainer}>
            <View style={styles.spaceBetween}>
                <Image style={styles.logo} src={"/images/walletlogo.png"} />
                <Text style={styles.reportTitle}>{customer_hub}</Text>
            </View>
        </View>
    );

    const Address = () => (
        <View >
            <View>
                <Text style={styles.invoice}>Hi, {customer_name}</Text>
            </View>
            <View style={styles.address_body_style}>
                <View style={{
                    padding: '10px'
                }}>
                    <View style={{
                        display: 'flex',
                        flexDirection: 'row',
                        justifyContent: 'space-between',

                    }}>
                        <View style={{
                            maxWidth: '50%'
                        }}>
                            <Text style={{
                                fontSize: 8,
                                color: '#BC9F8B',
                            }}>ACCOUNT DETAILS</Text>
                            <Text style={{
                                fontSize: 7,
                                fontWeight: 500,
                                margin: '5px 0px'
                            }}>
                                {customer_phone_number}  |  {customer_email}
                            </Text>
                            <Text style={{
                                fontSize: 8,
                                color: '#BC9F8B',
                            }}>ADDRESS</Text>
                            <Text style={{
                                fontSize: 9,
                                fontWeight: 500,
                                margin: '5px 0px'
                            }}>
                                {customer_address}
                            </Text>
                        </View>
                        <View>
                            <Text style={{
                                fontSize: 10,
                            }}>Account Balance (Rs) : <Text style={{
                                fontWeight: 'extra-bold',
                                color: '#3d6911',
                                fontSize: '14px'
                            }}>{account_balance}</Text></Text>
                            <View style={{
                                display: 'flex',
                                flexDirection: 'row',
                                justifyContent: 'space-between',
                                alignItems: 'flex-end',
                                marginTop: '10px'
                            }}>
                                <Text style={{
                                    fontSize: 8,
                                    color: '#BC9F8B',
                                }}>From: {formattedStartDate} </Text>
                                <Text style={{
                                    fontSize: 8,
                                    color: '#BC9F8B',
                                }}>To : {formattedEndDate}</Text>
                            </View>
                        </View>
                    </View>
                </View>
            </View>

        </View>
    );

    const Transaction = (data) => {

        const { seconds, nanoseconds } = data.data.created_date;

        const createdDate = new Date(seconds * 1000 + nanoseconds / 1000000);

        // Format the date using moment.js
        const formattedDate = moment(createdDate).format('DD MM YYYY');

        return (
            <View style={{
                display: 'flex',
                flexDirection: 'row',
                justifyContent: 'space-between',
                margin: '10px 0px',
                borderBottom: '1px solid #ccc'
            }}>
                <View style={{ width: '10%' }}>

                    <Text>{data.data.type === 'Credit' || data.data.type === 'credit'? <Image src={"/images/credit.png"} style={styles.icon_style} /> : <Image src={"/images/debit.png"} style={styles.icon_style} />} </Text>

                </View>


                <View style={{ width: '40%' }}>
                    <Text style={{ fontSize: 8, fontWeight: 500 }}>
                        {data.data.description || data.data.type}
                    </Text>
                    <Text style={{ fontSize: 8, color: '#BC9F8B' }}>
                        TXN DATE: {formattedDate}
                    </Text>

                    {
                        data.data.type === 'Debit' || data.data.type === 'debit' ? (
                            <>
                                <Text style={{ fontSize: 8, color: '#BC9F8B' }}>
                        PRODUCT NAME: {data.data?.product_name || ""}
                    </Text>
                    <Text style={{ fontSize: 8, color: '#BC9F8B' }}>
                        QUANTITY: {data.data?.product_quantity || ""}
                    </Text>
                    <Text style={{ fontSize: 8, color: '#BC9F8B' }}>
                        UNIT PRICE: {data.data?.unit_price || ""}
                    </Text>
                    </>
                        ) : ("")
                    }
               
                </View>

                
                <View style={{ width: '25%', fontSize: 8, color: '#BC9F8B' }}>
                    <Text>{data.data.txn_id}</Text>
                </View>


                <View style={{ width: '12.5%', display: 'flex', flexDirection: 'row', justifyContent: 'space-between' }}>
                    <View style={{
                        fontSize: 8,
                        color: data.data.type === 'Credit' || data.data.type === 'credit' ? '#3d6911' : '#FF6347'
                    }}>
                        <Text>{data.data.type === 'Credit' || data.data.type === 'credit' ? '+ ' : '- '}Rs{" "}{data.data.amount}</Text>
                    </View>

                </View>


                <View style={{
                    width: '12.5%',
                    display: 'flex',
                    flexDirection: 'row',
                    justifyContent: 'space-between'
                }}>
                    <Text style={{ fontSize: 8, color: '#BC9F8B' }}>
                        {data.data.current_wallet_balance}
                    </Text>
                </View>
            </View>
        );
    };

    const TransactionHeader = () => (
        <View style={styles.transactionHeader}>
            <Text style={{
                fontSize: 10,
                fontWeight: 'bold',
                width: '10%'
            }}></Text>
            <Text style={{
                fontSize: 10,
                fontWeight: 'bold',
                width: '40%'
            }}>Description</Text>
            <Text style={{
                fontSize: 10,
                fontWeight: 'bold',
                width: '25%'
            }}>TXN ID</Text>
            <Text style={{
                fontSize: 10,
                fontWeight: 'bold',
                width: '12.5%'
            }}>Amount</Text>
            <Text style={{
                fontSize: 10,
                fontWeight: 'bold',
                width: '12.5%'
            }}>Balance</Text>
        </View>
    );

    return (
        <Document>
            <Page size="A4" style={styles.page}>
                <InvoiceTitle />
                <view style={styles.invoice_body}>
                    <Address />
                    <TransactionHeader />

                    {wallet_data.map((data) => (
                        <Transaction key={data.id} data={data.data
                        } />
                    ))}

                </view>
            </Page>
        </Document>

    )
}

export default ReportPdf