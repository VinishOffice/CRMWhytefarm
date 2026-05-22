from datetime import datetime, timedelta, timezone
import logging
import os
import requests
from pymongo import MongoClient

log_filename = "/var/log/low_report_processor.log"
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s %(levelname)s %(message)s",
    handlers=[logging.FileHandler(log_filename), logging.StreamHandler()],
)

mongo_uri = os.getenv("MONGO_URI")
mongo_db_name = os.getenv("MONGO_DB", "test")

if not mongo_uri:
    raise RuntimeError("MONGO_URI is not set")

client = MongoClient(mongo_uri)
db = client[mongo_db_name]

subscription_ref = db["subscriptions_data"]
customers_ref = db["customers_data"]

tomorrow = datetime.now(timezone.utc) + timedelta(days=1)
tomorrow_str = tomorrow.strftime("%Y-%m-%d")

try:
    subscriptions_query = list(subscription_ref.find({"next_delivery_date": tomorrow_str}))
    logging.info(f"Fetched {len(subscriptions_query)} subscriptions for tomorrow's date.")
except Exception as e:
    logging.error(f"Error fetching subscriptions: {e}")
    subscriptions_query = []

customer_subscription_totals = {}

for subscription in subscriptions_query:
    try:
        customer_id = subscription.get("customer_id")
        price = subscription.get("price", 0)
        quantity = subscription.get("quantity", 0)
        total_amount = price * quantity

        if customer_id in customer_subscription_totals:
            customer_subscription_totals[customer_id] += total_amount
        else:
            customer_subscription_totals[customer_id] = total_amount
    except Exception as e:
        logging.error(f"Error processing subscription {subscription.get('_id')}: {e}")


def send_sms(phone_number, balance, total_amount):
    url = (
        "https://api.textlocal.in/send/"
        "?apikey=SsSIU4tDHEo-DWKzpHRKAWG8AtBIe3cMmkksUGCfPH"
        "&sender=WHYTEF"
        f"&numbers=91{phone_number}"
        f"&message=Dear Customer, Your account balance is low (Rs. {balance} ). "
        "Please recharge with the link https://pmny.in/AIuL89hOjgFN "
        "immediately to avoid service disruption - Whyte Farms"
    )

    headers = {"Cookie": "PHPSESSID=rrf18apus13hs3iiu59839u5q4"}
    response = requests.get(url, headers=headers)
    if response.status_code == 200:
        logging.info(f"SMS sent successfully to 91{phone_number}")
    else:
        logging.error(
            f"Failed to send SMS to {phone_number}. "
            f"Status Code: {response.status_code}. Response: {response.text}"
        )


for customer_id, total_subscription_amount in customer_subscription_totals.items():
    try:
        customer_doc = customers_ref.find_one({"customer_id": customer_id})
        if not customer_doc:
            logging.warning(f"No customer found with customer_id: {customer_id}")
            continue

        wallet_balance = customer_doc.get("wallet_balance", 0)
        phone_number = customer_doc.get("customer_phone")
        if wallet_balance < total_subscription_amount:
            logging.info(
                f"Customer {customer_id} has insufficient balance. "
                f"Wallet balance: {wallet_balance}, Total subscription amount: {total_subscription_amount}"
            )
            if phone_number:
                send_sms(phone_number, wallet_balance, total_subscription_amount)
            else:
                logging.warning(f"Customer {customer_id} does not have a phone number on record.")
        else:
            logging.info(
                f"Customer {customer_id} has sufficient balance. "
                f"Wallet balance: {wallet_balance}, Total subscription amount: {total_subscription_amount}"
            )
    except Exception as e:
        logging.error(f"Error checking wallet balance for customer {customer_id}: {e}")
