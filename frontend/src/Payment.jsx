import React, { useState } from 'react';
import { createPaymentLink as createPaymentLinkApi } from "./services/paymentsService";

const PayUMoneyPayment = () => {
    const [paymentUrl, setPaymentUrl] = useState('');
    const [error, setError] = useState('');

    const createPaymentLink = async () => {
        try {
            setError('');
            const resp = await createPaymentLinkApi({
                amount: 100,
                product: 'Example Product',
            });
            setPaymentUrl(resp?.paymentLink || '');
        } catch (error) {
            console.error('Error creating payment link:', error);
            setPaymentUrl('');
            setError(error?.response?.data?.error || 'Payment link not available');
        }
    };

    return (
        <div>
            <button onClick={createPaymentLink}>Create Payment Link</button>
            {error && <p style={{ color: 'red' }}>{error}</p>}
            {paymentUrl && <a href={paymentUrl} target="_blank" rel="noopener noreferrer">Proceed to Payment</a>}
        </div>
    );
};

export default PayUMoneyPayment;
