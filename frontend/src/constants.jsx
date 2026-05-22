export const ROLES = ["Admin","Customer Care Agent","Accounts team lead","Marketing Associate","Customer care Agent-part Time"]
export const CONVERSASTION_LOGS_REQUIRED_FIELD = ["interaction_type","conversation_notes","disposition","sub_disposition","tags","followup_required"]
export const FOLLOW_REQUIRED_FIELD = ["follow_up_date","assigned_to"]
export const INTERACTION_TYPE_REQUIRED_FIELDS = {
  
    call: ["call_type"],
    email: ["email_subject"],
}

export const TASK_TYPE = Object.freeze({
    FOLLOW_UP: "FOLLOW_UP",
    ONBOARD: "ONBOARD",
})

export const TASK_STATUS = Object.freeze({
    PENDING: "PENDING",
    COMPLETED: "COMPLETED",
    CANCELLED: "CANCELLED",
})


// Email/communications external APIs are proxied via backend now.
export const API_URL = null;
export const API_KEY = null;

export const ROLES_REDIRECTION = {
    "admin":"/",
    "Admin":"/",
    "customer":"/profile",
    "delivery boy":"/profile",
    "Customer Care Agent":"/customers",
    "Hub Manager":"/vendors_data",
    "Accounts team lead":"/",
    "accounts team lead":"/",
    "Marketing Associate":"/",
    "Customer care Agent-part Time":"/customers",
    "customer care agent part lead":"/customers",
    "Hub Manager":"/vendors_data",
    "hub manager":"/vendors_data",
    "Customer support team lead":"/customers",
    "customer support team lead":"/customers",
    "junior accounts":"/",
    "Junior Accounts":"/"
}

export const AVAILABLE_HUBS = [
    "Dwarka","North Hub","East Delhi","Whyte Farms Delhi","Noida","West Delhi","Whyte Farms Gurgaon"
]

export const AVAILABLE_ROLES = ["Admin","Customer Care Agent","Hub Manager","Marketing Associate","Customer support team lead", "Customer care Agent-part Time","Accounts team lead","junior accounts"]
export const USER_PERMESSION_LIST = [
    {
        "label":"Menu Module",
        "permissions":[
            {
                "label":"Dashboard",
                "key":"dashboard"
            },
            {
                "label":"Customers",
                "key":"customers"
            },
            {
                "label":"Hubs/Dist",
                "key":"hubs_dist"
            },
            {
                "label":"Marketing",
                "key":"marketing"
            },
            {
                "label":"Locations",
                "key":"locations"
            },
            {
                "label":"Reports",
                "key":"reports"
            },
            {
                "label":"Products",
                "key":"products"
            },
            {
                "label":"Tickets",
                "key":"tickets"
            },
            {
                "label":"Activity Logs",
                "key":"activity_logs"
            },
            
            {
                "label":"B 2 B",
                "key":"b2b"
            },
            
            {
                "label":"Inventory",
                "key":"inventory"
            },
            
            {
                "label":"Low Balance",
                "key":"lowbalance"
            },
            {
                "label":"Orders-Table",
                "key":"Tablecod"
            },
        ]
    },
    {
        "label":"Customers",
        "permissions":[
            {
                "label":"View Customers",
                "key":"view_customers"
            },
            {
                "label":"View Customer Profile",
                "key":"profile"
            },
            {
                "label":"Add Customers",
                "key":"add_customers"
            },
            {
                "label":"Edit Customers",
                "key":"edit_customers"
            },
            {
                "label":"Create Subscription",
                "key":"create_subscription"
            },
            {
                "label":"View Subscription",
                "key":"view_subscription"
            },
            {
                "label":"Edit Subscription",
                "key":"edit_subscription"
            },
            {
                "label":"View Wallet",
                "key":"view_wallet"
            },
            {
                "label":"Edit Wallet",
                "key":"edit_wallet"
            },
            {
                "label":"View Orders",
                "key":"view_orders"
            },
            {
                "label":"Add Credit Limit",
                "key":"add_credit_limit"
            },
            {
                "label":"Create Conversation Logs",
                "key":"create_conversation_logs"
            },
            {
                "label":"Customers Report",
                "key":"customers_report"
            },
            {
                "label":"Wallet Transactions",
                "key":"wallet_transactions"
            },
            {
                "label":"Delivery Preference",
                "key":"delivery_preference"
            },
            {
               "label":"Cash Collection",
               "key":"cash_collection"   
            },
            {
                "label":"Add Vacation",
                "key":"add_vacation"
            },
            {
                "label":"Edit Vacation",
                "key":"edit_vacation"
            },
            {
                "label":"Add Ticket",
                "key":"add_ticket"
            },
            {
                "label":"View Call Logs",
                "key":"view_call_logs"
            }
            
        ]
    },
    {
        "label":"Marketing",
        "permissions":[
            {
                "label":"View Banners",
                "key":"view_banners"
            },
            {
                "label":"Add Banners",
                "key":"add_banners"
            },
            {
                "label":"Edit Banners",
                "key":"edit_banners"
            },
            {
                "label":"Delete Banners",
                "key":"delete_banners"
            }
        ]
    },
    {
        "label":"Dispositions",
        "permissions":[
            {
                "label":"View Dispositions",
                "key":"view_dispositions"
            },
            {
                "label":"Add Dispositions",
                "key":"add_dispositions"
            },
            {
                "label":"Edit Dispositions",
                "key":"edit_dispositions"
            },
            {
                "label":"Delete Dispositions",
                "key":"delete_dispositions"
            }
        ]
    },
    {
        "label":"Tags",
        "permissions":[
            {
                "label":"View Tags",
                "key":"view_tags"
            },
            {
                "label":"Add Tags",
                "key":"add_tags"
            },
            {
                "label":"Edit Tags",
                "key":"edit_tags"
            },
            {
                "label":"Delete Tags",
                "key":"delete_tags"
            }
        ]
    },
    { "label":"B 2 B",
        "permissions":[
            {
                "label":"View B2B Orders",
                "key":"view_b2b_orders"
            },
            {
                "label":"Place B2B Orders",
                "key":"place_b2b_orders"
            },
            {
                "label":"Add Cafe/Ecommmerce",
                "key":"add_cafe_ecommerce"
            },
            {
                "label":"Edit Cafe/Ecommmerce",
                "key":"edit_cafe_ecommerce"
            },
            {
                "label":"Delete Cafe/Ecommmerce",
                "key":"delete_cafe_ecommerce"
            },
            {
                "label":"B2b Banner",
                "key":"b2b_banner"
            },
            {
                "label":"Mark B2B delivery",
                "key":"mark_b2b_delivery"
            },

        ]
    },
    {
        "label":"Reports",
        "permissions":[
            {
                "label":"low credit report",
                "key":"low_credit_report"
            },
            {
                "label":"On board report",
                "key":"on_board_report"
            },
            {
                "label":"Predictive Analysis",
                "key":"predictive_analysis"
            },
            {
                "label":"Hub Deliveries",
                "key":"hub_deliveries_report"
            },
            {
                "label":"Subcription Report",
                "key":"subscription_report"
            },
            {
                "label":"Customer Vactions",
                 "key":"customer_vactions"
            },
            {
                "label":"BlukReport Quantity",
                 "key":"bluk_quantity"
            },
            {
                "label":"Order Sheet",
                "key":"order_sheet_report"
            },
            {
                "label":"Order Sorting",
                "key":"order_sorting_report"
            },
            {
                "label":"Cash Collection",
                "key":"cash_colection"
            },
            {
                "label":"Conversation Logs Report",
                "key":"conversation_logs_report"
            },
            {
                "label":"Auto Paused Report",
                "key":"Auto_Paused_report"
            },
            {
                "label":"Paused Report",
                "key":"paused_report"
            },
            {
                "label":"Wallet Report",
                "key":"wallet__report"
            },
           
            
            {
                "label":"Cumalative Sales Report",
                "key":"cumalative_sales_report"
            },
            {
                "label":"Customer Sales Report",
                "key":"customer_sales_report"
            },
            {
                "label":"Wallet Transactions Report",
                "key":"wallet_transaction_report"
            },
            {
                "label":"One Time Orders",
                "key":"one_time_orders"
            },
            {
                "label":"Order Report",
                "key":"order_report"
            },
            {
                "label":"Return Reports",
                "key":"return_reports"
            },
            {
                "label":"Activity Logs Report",
                "key":"activity_logs_report"
            },
            {
                "label":"customer Life Cycle Report",
                "key":"customer_life_report"
            },
            {
                "label":"Future Prediction Report",
                "key":"future_prediction_report"
            },
        ]
    },
    {
        "label":"Manage User Roles",
        "permissions":[
            {
                "label":"Add User",
                "key":"add_users",
            },
            {
                "label":"Update User",
                "key":"update_users"
            },
            {
                "label":"View Users Page",
                "key":"view_users"
            },
            {
                "label":"Manage User Roles",
                "key":"manage_users_roles"
            }
        ]
    },
    {
        "label":"Marketting",
        "permissions":[
            {
                "label":"Banner",
                "key":"banner"
            },
            {
                "label":"Create Banner",
                "key":"create_banner"
            },
            {
                "label":"View Banner",
                "key":"view_banner"
            },
            {
                "label":"Edit Banner",
                "key":"edit_banner"
            },
            {
                "label":"Delete Banner",
                "key":"delete_banner"
            }
        ]
    },
    {
        "label":"Products",
        "permissions":[
            {
                "label":"Create Product",
                "key":"create_product"
            },
            {
                "label":"View Product",
                "key":"view_product"
            },
            {
                "label":"Edit Product",
                "key":"edit_product"
            },
            {
                "label":"Delete Product",
                "key":"delete_product"
            }
        ]
    },
    {
        "label":"Hubs Dist",
        "permissions":[
            {
                "label":"Transer Location Hub Wise",
                "key":"transfer_location_hub_wise"
            },
            {
                "label":"Transfer Location",
                "key":"transfer_location"
            },
            {
                "label":"Add Route",
                "key":"add_route"
            },
            {
                "label":"Edit Route",
                "key":"edit_route"
            },
            {
                "label":"Delete Route",
                "key":"delete_route"
            },
            {
                "label":"Edit Location Route",
                "key":"edit_location_route"
            },
            {
                "label":"Add Hub Users",
                "key":"add_hub_users"
            },
            {
                "label":"Edit Hub Users",
                "key":"edit_hub_users"
            },
            {
                "label":"Add Hub",
                "key":"add_hub"
            },
            {
                "label":"Edit Hub",
                "key":"edit_hub"
            },
            {
                "label":"View Hub",
                "key":"view_hub"
            }
        ]
    },
    {
        "label":"Locations",
        "permissions":[
            {
                "label":"Add Location",
                "key":"add_location"
            },
            {
                "label":"Edit Location",
                "key":"edit_location"
            },
            {
                "label":"Delete Location",
                "key":"delete_location"
            },
            {
                "label":"Routes",
                "key":"routes"
            }
        ]
    },
    {
        "label":"Inventory",
        "permissions":[
            {
                "label":"Inventory Home Tab",
                "key":"inventory_home"
            },
            {
                "label":"Order Prediction Tab",
                "key":"view_order_prediction"
            },
            {
                "label":"Dispatch Tab",
                "key":"view_dispatch"
            },
            {
                "label":"Stock Tab",
                "key":"view_stock"
            },
            {
                "label":"Deliveries Tab",
                "key":"view_deliverise"
            },
            {
                "label":"Report Tab",
                "key":"view_reports"
            },
            {
                "label":"Create New Dispatch",
                "key":"create_new_dispatch"
            },
            {
                "label":"Edit Dispatch",
                "key":"edit_dispatch"
            },
            {
                "label":"Accept Dispatch",
                "key":"accept_dispatch"
            },
            {
                "label":"Change Buffer",
                "key":"change_buffer"
            },
            {
                "label":"Update Hub Stock",
                "key":"update_hub_stock"
            },
        ]
    },
    {
        "label":"Low Balance",
        "permissions":[
            {
                "label":"Low Balance Dashboard",
                "key":"lb_dashboard"
            },
            {
                "label":"Low Balance Task",
                "key":"lb_task"
            },
        ]
    }
]


