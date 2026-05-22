from datetime import datetime, timedelta, timezone
import random
import logging
import os
import glob
from pymongo import MongoClient
from mongo_compat import MongoCompatDB
# Initialize logging
now = datetime.now(timezone(timedelta(hours=5, minutes=30)))  # IST timezone
tomorrow = now + timedelta(days=2)
log_dir = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(log_dir, exist_ok=True)
log_filename = os.path.join(log_dir, f"{datetime.now().strftime('%Y-%m-%d')}-subscription_processor.log")
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.FileHandler(log_filename),
        logging.StreamHandler()
    ]
)

mongo_uri = os.getenv("MONGO_URI")
mongo_db_name = os.getenv("MONGO_DB", "test")
if not mongo_uri:
    raise RuntimeError("MONGO_URI is not set")
client = MongoClient(mongo_uri)
db = MongoCompatDB(client[mongo_db_name])

subscription_ref = db.collection("subscriptions_data")
order_data_ref = db.collection("order_history")
customers_ref = db.collection("customers_data")
log_ref = db.collection("customer_activities")
bulk_update_ref = db.collection("bulk_update_quantity")
wallet_record_ref = db.collection("wallet_history")
product_ref = db.collection("products_data")
now = datetime.now()
local_timezone = timezone(timedelta(hours=5, minutes=30))
c_date = now.astimezone(local_timezone)
tomorrow_date = now.astimezone(local_timezone) + timedelta(days=1)
tomorrow_date_str = tomorrow_date.strftime("%Y-%m-%d")
next_tomorrow_date  =  now.astimezone(local_timezone) + timedelta(days=2)
next_tomorrow_date_str = next_tomorrow_date.strftime("%Y-%m-%d")
delivery_timestamp12hr = now.astimezone(local_timezone) + timedelta(days=1)
delivery_timestamp = delivery_timestamp12hr.strftime("%B %d, %Y at %I:%M:%S %p UTC%z")
logging.info(f"Tomorrow's Date: {tomorrow_date_str}")

# Get tomorrow's date and normalize it to start of the day (midnight)
tomorrow_date = datetime.now(timezone.utc) + timedelta(days=1)
tomorrow_date = tomorrow_date.replace(hour=0, minute=0, second=0, microsecond=0)
# Fetch all vacation records
try:
    vacation_ref = db.collection('customers_vacation')
    vacation_docs = vacation_ref.stream()
except Exception as e:
    logging.error(f"Error fetching vacation records: {e}")
    vacation_docs = []

products_data = product_ref.stream()

product_hash_map = {}

for product in products_data:
    product_data = product.to_dict()
    for option in product_data.get("packagingOptions", []):
        product_key = f"{product_data.get('productName')}_{option.get('packaging')}"
        product_hash_map[product_key] = option.get('priceBeforeDiscount')
    
logging.info(f"Product Hash Map: {product_hash_map}")

def get_product_price(subscription_data):
    product_key = f"{subscription_data.get('product_name')}_{subscription_data.get('package_unit')}"
    price = product_hash_map.get(product_key)
    if price is None:
        return subscription_data.get('price',0)
    else:
        return price

# Process vacation records to find those that cover tomorrow's date
vacation_data_list = set()
for doc in vacation_docs:
    try:
        vacation_data = doc.to_dict()
        start_date = vacation_data['start_date'].replace(hour=0, minute=0, second=0, microsecond=0)
        end_date = vacation_data['end_date'].replace(hour=0, minute=0, second=0, microsecond=0)
        if start_date <= tomorrow_date <= end_date:
            vacation_data_list.add(vacation_data['customer_id'])
    except Exception as e:
        logging.error(f"Error processing vacation record {doc.id}: {e}")

try:
    subscriptions_query = subscription_ref.where("status", "==", "1").get()
except Exception as e:
    logging.error(f"Error fetching subscriptions: {e}")
    subscriptions_query = []

# Fetch updated quantities
try:
    bulk_updates_query = bulk_update_ref.where("delivery_date", "==", tomorrow_date_str).get()
    bulk_updates = {update.to_dict()['subscription_id']: update.to_dict()['quantity'] for update in bulk_updates_query}
    logging.info(f"{bulk_updates}")
except Exception as e:
    logging.error(f"Error fetching bulk updates: {e}")
    bulk_updates = {}

def process_subscription(subscription):
    try:
        subscription_data = subscription.to_dict()
        subscription_type = subscription_data.get('subscription_type')
        customer_id = subscription_data.get("customer_id")
        sid = subscription_data.get("subscription_id")
        customer_id = subscription_data.get("customer_id")
        customer_name = subscription_data.get("customer_name")
        customer_phone = subscription_data.get("customer_phone")
        customer_address = subscription_data.get("customer_address")
        customer_lat = subscription_data.get("latitude")
        customer_lan = subscription_data.get("longitude")
        customer_query = customers_ref.where("customer_id", "==", customer_id).limit(1).get()
        sid = subscription_data.get("subscription_id")
        random_number = random.randint(10000000, 99999999)
        #on_vacation = any(vacation['customer_id'] == customer_id for vacation in vacation_data_list)
        quantity_all = None
        if customer_id in vacation_data_list:
            customer_subscriptions = subscription_ref.where("customer_id", "==", customer_id).stream()
            for sub in customer_subscriptions:
                subscription_ref.document(sub.id).update({"next_delivery_date": next_tomorrow_date_str})
            logging.info(f"{customer_id} is on vacation")
            return 
        for customer_doc in customer_query:
            customer_data = customer_doc.to_dict()
            if customer_data:
                wallet_balance = customer_data.get("wallet_balance", 0)
                credit_limit = customer_data.get("credit_limit", 0)
                delivery_executive_id = customer_data.get("delivery_exe_id")
                hub_name = customer_data.get("hub_name")
                location = customer_data.get("location")
                total_balance = wallet_balance + credit_limit if wallet_balance > 0 else credit_limit

                logging.info(f"running for customer_id {customer_id}")
                logging.info(f"Total Balance of this customer: {total_balance}")

                utilised_credit_limit = 0
                utilised_wallet_balance = 0

                if subscription_type == "Custom":
                    day = (tomorrow_date + timedelta(days=0)).strftime("%A").lower()
                    logging.info(f"in custom searching for: {day}")
                    for i in range(1, 8):
                        next_day = (tomorrow_date + timedelta(days=i)).strftime("%A").lower()
                        if subscription_data.get(next_day, 0) > 0:
                            new_delivery_date = (tomorrow_date + timedelta(days=i)).strftime("%Y-%m-%d")
                            break
                    if subscription_data.get(day, 0) > 0:
                        if sid in bulk_updates:
                            quantity_all = bulk_updates[sid]
                            logging.info(f"in custom found bulk quantity for: {day}")
                        else:
                            quantity_all = subscription_data[day]

                        if quantity_all <= 0:
                            logging.info(f"Subscription {sid} has zero quantity update, skipping order placement.")
                            continue

                        day_price = get_product_price(subscription_data)
                        day_order_amount = quantity_all * day_price
                        order_amount = quantity_all * day_price

                        if total_balance >= day_order_amount or credit_limit >= day_order_amount:
                            if wallet_balance >= day_order_amount:
                                wallet_balance -= day_order_amount
                                utilised_wallet_balance += day_order_amount
                            else:
                                if wallet_balance > 0:
                                    day_order_amount -= wallet_balance
                                    utilised_wallet_balance += wallet_balance
                                    wallet_balance = 0
                                    credit_limit -= day_order_amount
                                    utilised_credit_limit += day_order_amount
                                else:
                                    credit_limit -= day_order_amount
                                    utilised_credit_limit += day_order_amount

                            # Update the wallet balance to reflect the utilised credit limit
                            wallet_balance -= utilised_credit_limit

                            logging.info(f"Subscription {sid} punched the order.")
                            wallet_record_ref.add({
                                'txn_id': random_number,
                                'amount': order_amount,
                                'description': "Order placed",
                                'reason': "Cron",
                                "customer_phone": customer_data.get("customer_phone"),
                                "customer_id": subscription_data.get("customer_id"),
                                "customer_name": customer_data.get("customer_name"),
                                "hub_name": hub_name,
                                "delivery_executive": '',
                                'current_wallet_balance': wallet_balance,
                                'status': "1",
                                'type': 'Debit',
                                "user": "Cron",
                                "source": "Backend",
                                "created_date": c_date,
                                "utilised_credit_limit": utilised_credit_limit,
                                "utilised_wallet_balance": utilised_wallet_balance
                            })
                            order_data_ref.add({
                                "created_date": c_date,
                                "delivery_timestamp": delivery_timestamp12hr,
                                "delivery_exe_id": delivery_executive_id,
                                "customer_id": subscription_data.get("customer_id"),
                                "customer_name": customer_data.get("customer_name"),
                                "customer_phone": customer_data.get("customer_phone"),
                                "delivering_to": customer_data.get("customer_address"),
                                "latitude": customer_data.get("latitude"),
                                "longitude": customer_data.get("longitude"),
                                "quantity": quantity_all,
                                "quantity_backup" : quantity_all,
                                "package_unit": subscription_data.get("package_unit"),
                                "product_name": subscription_data.get("product_name"),
                                "hub_name": hub_name,
                                "location": location,
                                "delivery_date": tomorrow_date_str,
                                "delivery_time": "",
                                "handling_charges": "0",
                                "marked_delivered_by": "",
                                "order_id": subscription_data.get("customer_id") + tomorrow_date_str.replace("-", ""),
                                "order_type": "sub",
                                "subscription_id": subscription_data.get("subscription_id"),
                                "tax": 0,
                                "total_amount": day_order_amount,
                                "price": subscription_data.get("price"),
                                "update_date": c_date,
                                "status": "0",
                                "cancelled_reason": "",
                                "cancelled_time": "",
                                "utilised_credit_limit": utilised_credit_limit,
                                "utilised_wallet_balance": utilised_wallet_balance
                            })
                            subscription_ref.document(subscription.id).update({"next_delivery_date": new_delivery_date})
                            logging.info(f"Subscription {sid} date updated to {new_delivery_date}.")
                            customers_ref.document(customer_doc.id).update({"wallet_balance": wallet_balance, "credit_limit": credit_limit})
                            break
                        else:
                            logging.info(f"custom: Insufficient balance for customer: {customer_id}")
                            # added the following reason to pause the subscription for auto resume
                            db.collection("subscriptions_data").document(subscription.id).update({"status": "0", "reason": "cron"})
                            log_message = f"Subscription ID {subscription_data['subscription_id']} was auto paused by system because of low balance"
                            log_ref.add({
                                "description": log_message,
                                "object": subscription_data['subscription_id'],
                                "user": "server",
                                "action": "Auto Pause",
                                "customer_address": customer_data.get("customer_address"),
                                "customer_id": customer_data.get("customer_id"),
                                "customer_name": customer_data.get("customer_name"),
                                "customer_phone": customer_data.get("customer_phone"),
                                "delivery_exe_id": delivery_executive_id,
                                "hub_name": hub_name,
                                "created_date": c_date
                            })
                            break
                elif subscription_type == "One Time":
                    logging.info(f"Subscription {sid} calling one time.")
                    next_delivery_date = subscription_data.get('next_delivery_date')
                    st = subscription_data.get('subscription_type')
                    price = get_product_price(subscription_data)
                    if sid in bulk_updates:
                        quantity_all = bulk_updates[sid]
                    else:
                        quantity_all = subscription_data.get("quantity")
                    if quantity_all <= 0:
                        logging.info(f"Subscription {sid} has zero quantity update, skipping order placement.")
                        continue
                    day_order_amount = quantity_all * price
                    order_amount = quantity_all * price
                    logging.info(f"Next Delivery Date (One Time): {next_delivery_date}")
                    if next_delivery_date == tomorrow_date_str:
                        if total_balance >= day_order_amount or credit_limit >= day_order_amount:
                            if wallet_balance >= day_order_amount:
                                wallet_balance -= day_order_amount
                                utilised_wallet_balance += day_order_amount
                            else:
                                if (wallet_balance > 0):
                                    day_order_amount -= wallet_balance
                                    utilised_wallet_balance += wallet_balance
                                    wallet_balance = 0
                                    credit_limit -= day_order_amount
                                    utilised_credit_limit += day_order_amount
                                else:
                                    credit_limit -= day_order_amount
                                    utilised_credit_limit += day_order_amount
                            wallet_balance -= utilised_credit_limit
                            logging.info(f"Subscription {sid} punched the order.")
                            wallet_record_ref.add({
                                'txn_id': random_number,
                                'amount': order_amount,
                                'description': "Order placed",
                                'reason': "Cron",
                                "customer_phone": customer_data.get("customer_phone"),
                                "customer_id": subscription_data.get("customer_id"),
                                "customer_name": customer_data.get("customer_name"),
                                "hub_name": hub_name,
                                "delivery_executive": '',
                                'current_wallet_balance': wallet_balance,
                                'status': "1",
                                'type': 'Debit',
                                "user": "Cron",
                                "source": "Backend",
                                "created_date": c_date,
                                "utilised_credit_limit": utilised_credit_limit,
                                "utilised_wallet_balance": utilised_wallet_balance
                            })
                            order_data_ref.add({
                                "created_date": c_date,
                                "delivery_timestamp": delivery_timestamp12hr,
                                "delivery_exe_id": delivery_executive_id,
                                "customer_id": subscription_data.get("customer_id"),
                                "customer_name": customer_data.get("customer_name"),
                                "customer_phone": customer_data.get("customer_phone"),
                                "delivering_to": customer_data.get("customer_address"),
                                "latitude": customer_data.get("latitude"),
                                "longitude": customer_data.get("longitude"),
                                "quantity": quantity_all,
                                "quantity_backup" : quantity_all,
                                "package_unit": subscription_data.get("package_unit"),
                                "product_name": subscription_data.get("product_name"),
                                "hub_name": hub_name,
                                "location" : location,
                                "delivery_date": tomorrow_date_str,
                                "delivery_time": "",
                                "handling_charges": "0",
                                "marked_delivered_by": "",
                                "order_id": subscription_data.get("customer_id") + tomorrow_date_str.replace("-", ""),
                                "order_type": "OT",
                                "subscription_id": subscription_data.get("subscription_id"),
                                "tax": 0,
                                "total_amount": quantity_all * subscription_data.get("price"),
                                "price": subscription_data.get("price"),
                                "update_date": c_date,
                                "status": "0",
                                "cancelled_reason": "",
                                "cancelled_time": "",
                                "utilised_credit_limit": utilised_credit_limit,
                                "utilised_wallet_balance": utilised_wallet_balance
                            })
                            logging.info(f"Subscription {sid} punched for one time.")
                            db.collection("subscriptions_data").document(subscription.id).update({"status": "0"})
                            # subscription_ref.document(subscription.id).update({"next_delivery_date": new_delivery_date_str})
                            customers_ref.document(customer_doc.id).update({"wallet_balance": wallet_balance, "credit_limit": credit_limit})
                            # db.collection("subscriptions_data").document(subscription.id).delete()
                            logging.info(f"Subscription {sid} deleted one time.")
                        else:
                            logging.info(f"Interval:Insufficient balance for customer {customer_id}")
                            logging.info(f"subscription id: {sid}")
                            # added the following reason to pause the subscription for auto resume
                            db.collection("subscriptions_data").document(subscription.id).update({"status": "0", "reason": "cron"})
                            log_message = f"Order for {subscription_data['subscription_id']} was not placed by system because of low balance"
                            log_ref.add({
                                "description": log_message,
                                "object": subscription_data['subscription_id'],
                                "user" : "server",
                                "action" : "Auto Pause",
                                "customer_address": customer_data.get("customer_address"),
                                "customer_id": customer_data.get("customer_id"),
                                "customer_name": customer_data.get("customer_name"),
                                "customer_phone": customer_data.get("customer_phone"),
                                "delivery_exe_id": delivery_executive_id,
                                "hub_name": hub_name,
                                "created_date": c_date
                            })
                else:
                    interval = subscription_data.get('interval')
                    next_delivery_date = subscription_data.get('next_delivery_date')
                    new_delivery_date_oc = datetime.strptime(next_delivery_date, "%Y-%m-%d") + timedelta(days=interval)
                    new_delivery_date_str_oc = new_delivery_date_oc.strftime("%Y-%m-%d")
                    st = subscription_data.get('subscription_type')
                    logging.info(f"Subscription {sid} calling {st}")
                    logging.info(f"-- {st}")
                    price = get_product_price(subscription_data)
                    if sid in bulk_updates:
                        quantity_all = bulk_updates[sid]
                        logging.info(f"Subscription {sid} found bulk quantity update.")
                    else:
                        quantity_all = subscription_data.get("quantity")
                    if quantity_all <= 0:
                        logging.info(f"Subscription {sid} {st} has zero quantity update, skipping order placement.")
                        logging.info(f"{sid}")
                        if next_delivery_date == tomorrow_date_str:
                            subscription_ref.document(subscription.id).update({"next_delivery_date": new_delivery_date_str_oc})
                        logging.info(f"Subscription {sid} updated next delivery date to {new_delivery_date_str_oc}")
                        continue
                    day_order_amount = quantity_all * price
                    order_amount = quantity_all * price
                    logging.info(f"Next Delivery Date (Everyday): {next_delivery_date} ")
                    if next_delivery_date == tomorrow_date_str:
                        old_delivery_date = subscription_data.get('next_delivery_date')
                        new_delivery_date = datetime.strptime(old_delivery_date, "%Y-%m-%d") + timedelta(days=interval)
                        new_delivery_date_str = new_delivery_date.strftime("%Y-%m-%d")
                        logging.info(f"New Delivery Date (Everyday): {new_delivery_date_str}" )
                        logging.info(f"{subscription_data.get("customer_id")}")
                        logging.info(f"{subscription_data.get("subscription_id")}")
                        logging.info(f"{total_balance}")
                        logging.info(f"{day_order_amount}")
                        logging.info(f"{credit_limit}")
                        logging.info(f"{day_order_amount}")
                        if total_balance >= day_order_amount or credit_limit >= day_order_amount:
                            if wallet_balance >= day_order_amount:
                                wallet_balance -= day_order_amount
                                utilised_wallet_balance += day_order_amount
                            else:
                                if wallet_balance > 0:
                                    day_order_amount -= wallet_balance
                                    utilised_wallet_balance += wallet_balance
                                    wallet_balance = 0
                                    credit_limit -= day_order_amount
                                    utilised_credit_limit += day_order_amount
                                else:
                                    credit_limit -= day_order_amount
                                    utilised_credit_limit += day_order_amount
                            wallet_balance -= utilised_credit_limit
                            logging.info(f"Subscription {sid} punched the order.")
                            wallet_record_ref.add({
                                'txn_id': random_number,
                                'amount': order_amount,
                                'description': "Order placed",
                                'reason': "Cron",
                                "customer_phone": customer_data.get("customer_phone"),
                                "customer_id": subscription_data.get("customer_id"),
                                "customer_name": customer_data.get("customer_name"),
                                "hub_name": hub_name,
                                "delivery_executive": '',
                                'current_wallet_balance': wallet_balance,
                                'status': "1",
                                'type': 'Debit',
                                "user": "Cron",
                                "source": "Backend",
                                "created_date": c_date,
                                "utilised_credit_limit": utilised_credit_limit,
                                "utilised_wallet_balance": utilised_wallet_balance
                            })
                            order_data_ref.add({
                                "created_date": c_date,
                                "delivery_timestamp": delivery_timestamp12hr,
                                "delivery_exe_id": delivery_executive_id,
                                "customer_id": subscription_data.get("customer_id"),
                                "customer_name": customer_data.get("customer_name"),
                                "customer_phone": customer_data.get("customer_phone"),
                                "delivering_to": customer_data.get("customer_address"),
                                "latitude": customer_data.get("latitude"),
                                "longitude": customer_data.get("longitude"),
                                "quantity": quantity_all,
                                "quantity_backup" : quantity_all,
                                "package_unit": subscription_data.get("package_unit"),
                                "product_name": subscription_data.get("product_name"),
                                "hub_name": hub_name,
                                "location": location,
                                "delivery_date": tomorrow_date_str,
                                "delivery_time": "",
                                "handling_charges": "0",
                                "marked_delivered_by": "",
                                "order_id": subscription_data.get("customer_id") + tomorrow_date_str.replace("-", ""),
                                "order_type": "Sub",
                                "subscription_id": subscription_data.get("subscription_id"),
                                "tax": 0,
                                "total_amount": quantity_all * subscription_data.get("price"),
                                "price": subscription_data.get("price"),
                                "update_date": c_date,
                                "status": "0",
                                "cancelled_reason": "",
                                "cancelled_time": "",
                                "utilised_credit_limit": utilised_credit_limit,
                                "utilised_wallet_balance": utilised_wallet_balance

                            })
                            logging.info(f"Subscription {sid} punched order")
                            subscription_ref.document(subscription.id).update({"next_delivery_date": new_delivery_date_str})
                            logging.info(f"Subscription {sid} updated next delivery date to {new_delivery_date_str}")
                            customers_ref.document(customer_doc.id).update({"wallet_balance": wallet_balance, "credit_limit": credit_limit})
                        else:
                            old_delivery_date = subscription_data.get('next_delivery_date')
                            new_delivery_date = datetime.strptime(old_delivery_date, "%Y-%m-%d") + timedelta(days=interval)
                            new_delivery_date_str = new_delivery_date.strftime("%Y-%m-%d")
                            logging.info(f"Interval:Insufficient balance for customer: {customer_id}")
                            logging.info(f"subscription id: {sid}")
                            # added the following reason to pause the subscription for auto resume
                            db.collection("subscriptions_data").document(subscription.id).update({"status": "0", "next_delivery_date": new_delivery_date_str, "reason": "cron"})
                            log_message = f"Subscription ID {subscription_data['subscription_id']} was auto paused by system because of low balance"
                            log_ref.add({
                                "description": log_message,
                                "object": subscription_data['subscription_id'],
                                "user" : "server",
                                "action" : "Auto Pause",
                                "customer_address": customer_data.get("customer_address"),
                                "customer_id": customer_data.get("customer_id"),
                                "customer_name": customer_data.get("customer_name"),
                                "customer_phone": customer_data.get("customer_phone"),
                                "delivery_exe_id": delivery_executive_id,
                                "hub_name": hub_name,
                                "created_date": c_date
                            })
    except Exception as e:
        logging.error(f"Error processing subscription {subscription.id}: {e}")

def delete_old_logs():
    log_directory = "/var/log/"
    current_time = datetime.now()
    for log_file in glob.glob(f"{log_directory}*-subscription_processor.log"):
        file_creation_time = datetime.fromtimestamp(os.path.getctime(log_file))
        if (current_time - file_creation_time).days > 7:
            try:
                os.remove(log_file)
                logging.info(f"Deleted old log file: {log_file}")
            except Exception as e:
                logging.error(f"Error deleting old log file {log_file}: {e}")

# Process each subscription sequentially
for subscription in subscriptions_query:
    process_subscription(subscription)

delete_old_logs()

logging.info(f"Cron job has ended.")
