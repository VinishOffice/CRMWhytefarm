from datetime import datetime, timedelta, timezone
import random
import logging
import os
import glob
import json
from pymongo import MongoClient
from mongo_compat import MongoCompatDB
# Initialize logging

log_dir = os.path.join(os.path.dirname(__file__), 'logs')
os.makedirs(log_dir, exist_ok=True)
log_filename = os.path.join(log_dir, f"{datetime.now().strftime('%Y-%m-%d')}-bulk_data_correction.log")
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s %(levelname)s %(message)s',
    handlers=[
        logging.FileHandler(log_filename),
        logging.StreamHandler()
    ]
)

now = datetime.now()
local_timezone = timezone(timedelta(hours=5, minutes=30))
c_date = now.astimezone(local_timezone)
todays_date = now.astimezone(local_timezone)
todays_date_str = todays_date.strftime("%Y-%m-%d")
tomorrow_date = now.astimezone(local_timezone) + timedelta(days=1)
tomorrow_date_str = tomorrow_date.strftime("%Y-%m-%d")
wrong_tomorrow_date_str =tomorrow_date_str.replace("-0","-")
mongo_uri = os.getenv("MONGO_URI")
mongo_db_name = os.getenv("MONGO_DB", "test")
if not mongo_uri:
    raise RuntimeError("MONGO_URI is not set")
client = MongoClient(mongo_uri)
db = MongoCompatDB(client[mongo_db_name])


bulk_update_ref = db.collection("bulk_update_quantity")
subscription_ref = db.collection("subscriptions_data")
order_ref = db.collection("order_history")
vacation_ref = db.collection("customers_vacation")
# Get tomorrow's date and normalize it to start of the day (midnight)
tomorrow_date = datetime.now(timezone.utc) + timedelta(days=1)
tomorrow_date = tomorrow_date.replace(hour=0, minute=0, second=0, microsecond=0)


bulk_updates_query = bulk_update_ref.where("delivery_date", "==", wrong_tomorrow_date_str).get()

bulk_upload_list = []
for doc in bulk_updates_query:
    doc_dict = doc.to_dict()
    doc_id = doc.id
    doc_ref = bulk_update_ref.document(doc_id)
    doc_ref.update({"delivery_date": tomorrow_date_str})
    bulk_upload_list.append(doc_id)

logging.info(f"Updated {len(bulk_upload_list)} documents in bulk_update_quantity collection")
logging.info(f"Updated documents: {bulk_upload_list}")

subscriptions_everyday_query = subscription_ref.where("next_delivery_date","<",tomorrow_date_str).where("subscription_type","==","Everyday").where("status","==","1").get()

subscription_list = []
for doc in subscriptions_everyday_query:
    doc_dict = doc.to_dict()
    doc_id = doc.id
    doc_ref = subscription_ref.document(doc_id)
    subscription_id = doc_dict.get("subscription_id")
    doc_ref.update({"next_delivery_date": tomorrow_date_str,"status":"1"})
    subscription_list.append(subscription_id)

logging.info(f"Updated {len(subscription_list)} documents in subscriptions_data collection")
logging.info(f"Updated documents: {subscription_list}")

# fixing wrong interval
subscriptions_interval_query = subscription_ref.where("interval","==","0").where("subscription_type","==","Everyday").where("status","==","1").get()

subscription_interval = []
for doc in subscriptions_interval_query:
    doc_dict = doc.to_dict()
    doc_id = doc.id
    subscription_id = doc_dict.get("subscription_id")
    doc_ref = subscription_ref.document(doc_id)
    doc_ref.update({"interval": "1"})
    subscription_interval.append(subscription_id)

logging.info(f"Updated {len(subscription_interval)} documents in subscriptions_data collection")
logging.info(f"Updated documents: {subscription_interval}")



# pausing one time  subscriptions which  end date is today
subscriptions_one_time_query = subscription_ref.where("subscription_type","==","One Time").where("status","==","1").where("next_delivery_date","<=",todays_date_str).get()
subscription_one_time = []
for doc in subscriptions_one_time_query:
    doc_dict = doc.to_dict()
    doc_id = doc.id
    doc_ref = subscription_ref.document(doc_id)
    subscription_id = doc_dict.get("subscription_id")
    doc_ref.update({"status": "0","customer_id":f"{doc_dict.get('customer_id')}_paused"})
    subscription_one_time.append(subscription_id)

logging.info(f"Updated {len(subscription_one_time)} documents in subscriptions_data collection")
logging.info(f"Updated documents: {subscription_one_time}")



product_ref = db.collection("products_data")
product_hash_map = {}
possible_wrong_package_unit = []
products_data = product_ref.stream()
for product in products_data:
    product_data = product.to_dict()
    for option in product_data.get("packagingOptions", []):
        product_key = f"{product_data.get('productName')}_{int(option.get('price'))}"
        product_hash_map[product_key] = f\"{option.get('packaging')} {option.get('pkgUnit')}\"
        possible_wrong_package_unit.append(f\"{option.get('packaging')}{option.get('pkgUnit')}\")


def get_product_package_unit(subscription_data):
    key = f"{subscription_data.get('product_name')}_{int(subscription_data.get('price'))}"
    return product_hash_map.get(key)

# fetch all subscription that does not have a valid package unit
subscriptions_invalid_package_unit = subscription_ref.where("package_unit", "==", "").where("status","==","1").get()

subscription_invalid_package_unit = []
for doc in subscriptions_invalid_package_unit:
    doc_dict = doc.to_dict()
    doc_id = doc.id
    doc_ref = subscription_ref.document(doc_id)
    package_unit = get_product_package_unit(doc_dict)
    doc_ref.update({"package_unit": package_unit})
    subscription_id = doc_dict.get("subscription_id")
    subscription_invalid_package_unit.append(subscription_id)

logging.info(f"Updated {len(subscription_invalid_package_unit)} documents in subscriptions_data collection")
logging.info(f"Updated documents: {subscription_invalid_package_unit}")

# fixing wrong package unit
subscriptions_invalid_package_unit_query = subscription_ref.where("package_unit", "in", possible_wrong_package_unit).where("status","==","1").get()

subscription_invalid_package_unit = []

for doc in subscriptions_invalid_package_unit_query:
    doc_dict = doc.to_dict()
    doc_id = doc.id
    doc_ref = subscription_ref.document(doc_id)
    package_unit = get_product_package_unit(doc_dict)
    doc_ref.update({"package_unit": package_unit})
    subscription_id = doc_dict.get("subscription_id")
    subscription_invalid_package_unit.append(subscription_id)

logging.info(f"Updated {len(subscription_invalid_package_unit)} documents in subscriptions_data collection")
logging.info(f"Updated documents: {subscription_invalid_package_unit}")

todays_start_date_time = datetime.combine(todays_date, datetime.min.time()).astimezone(local_timezone)
end_of_todays_date_time = datetime.combine(todays_date, datetime.max.time()).astimezone(local_timezone)


# pause subscriptions which end date is today
subscriptions_end_date_query = subscription_ref.where("end_date",">=",todays_start_date_time).where("end_date","<=",end_of_todays_date_time).where("subscription_type","in",['Everyday','Custom','On-Interval']).where("status","==","1").get()

subscription_end_date = []



for doc in subscriptions_end_date_query:
    doc_dict = doc.to_dict()
    doc_id = doc.id
    doc_ref = subscription_ref.document(doc_id)
    subscription_id = doc_dict.get("subscription_id")
    doc_ref.update({"status": "0","customer_id":f"{doc_dict.get('customer_id')}_paused"})
    subscription_end_date.append(subscription_id)

logging.info(f"Paused {len(subscription_end_date)} documents in subscriptions_data collection")
logging.info(f"Paused documents: {subscription_end_date}")


# fix vacation data end date which ends 12:00 AM
tomorrow_utc_start_datetime = datetime.combine(tomorrow_date, datetime.min.time()).astimezone(timezone.utc)
eight_hours_past_tomorrow_utc_start_datetime = tomorrow_utc_start_datetime + timedelta(hours=8)

vacation_end_date_query = vacation_ref.where("end_date","==",tomorrow_utc_start_datetime).get()

vacation_end_date = []

for doc in vacation_end_date_query:
    doc_dict = doc.to_dict()
    doc_id = doc.id
    doc_ref = vacation_ref.document(doc_id)
    doc_ref.update({"end_date": eight_hours_past_tomorrow_utc_start_datetime})
    customer_id = doc_dict.get('customer_id')
    vacation_end_date.append(customer_id)

logging.info(f"Updated {len(vacation_end_date)} documents in customers_vacation collection")
logging.info(f"Updated documents: {vacation_end_date}")

day_after_tomorrow = now.astimezone(local_timezone) + timedelta(days=2)
day_after_tomorrow_utc_start_datetime = datetime.combine(day_after_tomorrow, datetime.min.time()).astimezone(timezone.utc)
eight_past_hours_day_after_tomorrow_utc_start_datetime = day_after_tomorrow_utc_start_datetime + timedelta(hours=8)
vacation_start_date_query = vacation_ref.where("start_date","==",day_after_tomorrow_utc_start_datetime).get()

vacation_start_date = []
for doc in vacation_start_date_query:
    doc_dict = doc.to_dict()
    doc_id = doc.id
    doc_ref = vacation_ref.document(doc_id)
    doc_ref.update({"start_date": eight_past_hours_day_after_tomorrow_utc_start_datetime})
    customer_id = doc_dict.get('customer_id')
    vacation_start_date.append(customer_id)


logging.info(f"Updated {len(vacation_start_date)} documents in customers_vacation collection")
logging.info(f"Updated documents: {vacation_start_date}")



# Function to resume specific types of subscriptions based on resumed_date
def resume_specific_subscriptions_iOS():
    todays_date = datetime.now().date()
    tomorrows_date = todays_date + timedelta(days=1)
    tomorrows_date_str = tomorrows_date.strftime("%Y-%m-%d")

    # Query to find subscriptions with specific subscription types and a valid resumed_date
    subscriptions_resumed_query = subscription_ref.where("subscription_type", "in", ['Everyday', 'Custom', 'On-Interval', 'One Time']) \
        .where("status", "==", "0") \
        .where("resume_date", "==", tomorrows_date_str).get()

    subscriptions_resumed = []
    for doc in subscriptions_resumed_query:
        doc_dict = doc.to_dict()
        doc_id = doc.id
        doc_ref = subscription_ref.document(doc_id)
        
        resumed_date = doc_dict.get("resume_date")
        subscription_id = doc_dict.get("subscription_id")
        
        # Update status, next_delivery_date, and clear resumed_date
        doc_ref.update({
            "status": "1",
            "next_delivery_date": resumed_date,
            # "resume_date": "",
        })

        subscriptions_resumed.append(subscription_id)

    # Logging information about the updates
    logging.info(f"Resumed {len(subscriptions_resumed)} iOS subscriptions in subscriptions_data collection")
    logging.info(f"Updated subscriptions: {subscriptions_resumed}")

# Call the function
resume_specific_subscriptions_iOS()

# # Function to resume specific types of subscriptions based on resumed_date
# def resume_specific_subscriptions_other():
#     todays_date = datetime.now().date()
#     tomorrows_date = todays_date + timedelta(days=1)
#     tomorrows_date_str = tomorrows_date.strftime("%Y-%m-%d")

#     # Query to find subscriptions with specific subscription types and a valid resumed_date
#     subscriptions_resumed_query = subscription_ref.where("subscription_type", "in", ['Everyday', 'Custom', 'On-Interval', 'One Time']) \
#         .where("status", "==", "0") \
#         .where("next_delivery_date", "==", tomorrows_date_str).get()

#     subscriptions_resumed = []
#     for doc in subscriptions_resumed_query:
        
#         doc_dict = doc.to_dict()
#         doc_id = doc.id
#         doc_ref = subscription_ref.document(doc_id)
#         subscription_id = doc_dict.get("subscription_id")
        
#         resumed_date = doc_dict.get("resume_date")
#         # Check if resumed_date is a timestamp (e.g., a datetime object)
#        # Check if resumed_date is invalid or irrelevant (None, empty, or string)
#         if resumed_date is None or resumed_date == "" or isinstance(resumed_date, str):
#             pass  # Skip processing

#         # If resumed_date is a datetime, perform the update
#         elif isinstance(resumed_date, datetime) and resumed_date.date().strftime("%Y-%m-%d") == todays_date.strftime("%Y-%m-%d"):
#             doc_ref.update({
#                 "status": "1",
#                 # "resume_date": "",
#             })
#             subscriptions_resumed.append(subscription_id)

        


#     # Logging information about the updates
#     logging.info(f"Resumed {len(subscriptions_resumed)} non-iOS subscriptions in subscriptions_data collection")
#     logging.info(f"Updated subscriptions: {subscriptions_resumed}")

# # Call the function
# resume_specific_subscriptions_other()
