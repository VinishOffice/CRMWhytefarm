const mongoose = require('mongoose');

const subscriptionsDataSchema = new mongoose.Schema({
    coupon_code: { type: String },
    created_date: { type: String },
    customer_address: { type: String },
    customer_id: { type: String },
    customer_name: { type: String },
    customer_phone: { type: String },
    end_date: { type: String },
    friday: { type: Number },
    hub_name: { type: String },
    interval: { type: Number },
    monday: { type: Number },
    next_delivery_date: { type: String },
    package_unit: { type: String },
    platform: { type: String },
    price: { type: Number },
    product_name: { type: String },
    quantity: { type: Number },
    reason: { type: String },
    resume_date: { type: String },
    saturday: { type: Number },
    start_date: { type: String },
    status: { type: String },
    subscription_id: { type: String },
    subscription_type: { type: String },
    sunday: { type: Number },
    thursday: { type: Number },
    tuesday: { type: Number },
    updated_date: { type: String },
    utm_campaign: { type: String, default: null },
    utm_medium: { type: String, default: null },
    utm_source: { type: String, default: null },
    wednesday: { type: Number }
}, { collection: 'subscriptions_data' });

module.exports = mongoose.model('SubscriptionsData', subscriptionsDataSchema);