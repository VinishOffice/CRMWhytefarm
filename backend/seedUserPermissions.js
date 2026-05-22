const mongoose = require("mongoose");
const path = require("path");
const dotenv = require("dotenv");

dotenv.config({ path: path.resolve(__dirname, ".env") });

// Define schema with custom _id that allows strings
const usersPermissionsSchema = new mongoose.Schema({
  _id: String,  // Allow string IDs
}, { strict: false });
const UserPermissions = mongoose.models['user_permissions'] || mongoose.model('user_permissions', usersPermissionsSchema, 'user_permissions');

async function seedUserPermissions() {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });

    console.log("Connected to MongoDB");

    // Delete existing permissions for all roles we are seeding
    const rolesToDelete = [
      "admin", "Admin", 
      "customer", "Customer", 
      "hub manager", "Hub Manager",
      "customer support team lead", "Customer Support Team Lead",
      "customer care agent part lead", "Customer Care Agent Part Lead",
      "accounts team lead", "Accounts Team Lead",
      "junior accounts", "Junior Accounts"
    ];
    for (const roleId of rolesToDelete) {
      await UserPermissions.deleteOne({ _id: roleId });
    }
    console.log("Deleted existing permissions for all roles");

    // Create admin permissions
    const adminData = {
      permission: [
        "Auto_Paused_report", "Tablecod", "accept_dispatch", "activity_logs_report", "add_cafe_ecommerce", "add_credit_limit", "add_customers", "add_dispositions", "add_hub", "add_hub_users", "add_location", "add_route", "add_tags", "add_ticket", "add_users", "add_vacation", "b2b", "b2b_banner", "bluk_quantity", "cash_colection", "cash_collection", "conversation_logs_report", "create_banner", "create_new_dispatch", "create_product", "cumalative_sales_report", "customer_life_report", "customer_sales_report", "customer_vactions", "customers", "dashboard", "delete_banner", "delete_cafe_ecommerce", "delete_dispositions", "delete_hub_users", "delete_location", "delete_product", "delete_route", "delete_tags", "delivery_prefrence", "edit_banners", "edit_cafe_ecommerce", "edit_customers", "edit_dispatch", "edit_dispositions", "edit_hub", "edit_hub_users", "edit_location", "edit_location_route", "edit_product", "edit_route", "edit_wallet", "future_prediction_report", "hub_deliveries_report", "hubs_dist", "inventory", "inventory_home", "lb_dashboard", "lb_task", "locations", "low_credit_report", "lowbalance", "manage_users_roles", "mark_b2b_delivery", "marketing", "newCampaign", "on_board_report", "one_time_orders", "order_report", "order_sheet_report", "order_sorting_report", "paused_report", "place_b2b_orders", "predictive_analysis", "products", "profile", "reports", "return_report", "routes", "subscription_report", "tickets", "transfer_location", "transfer_location_hub_wise", "update_hub_stock", "view_b2b_orders", "view_customers", "view_deliverise", "view_dispatch", "view_dispositions", "view_hub", "view_order_prediction", "view_reports", "view_stock", "view_tags", "view_users", "wallet__report", "wallet_transaction_report", "wallet_transactions",
        "create", "read", "update", "delete", "export", "import", "manage", "manageUsersRoles", "create_subscription", "users"
      ],
      Menu: [
        "dashboard", "customers", "orders", "subscriptions", "wallet", "analytics", "reports", "users", "hubs_dist", "locations", "routes", "marketing", "Tablecod", "products", "tickets", "b2b", "inventory", "lb_dashboard", "lb_task",
        "profile", "manageUsersRoles"
      ],
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };

    // Seed both "admin" and "Admin"
    await new UserPermissions({ ...adminData, _id: "admin", role: "admin", roleData: { user_role: "admin" } }).save();
    await new UserPermissions({ ...adminData, _id: "Admin", role: "Admin", roleData: { user_role: "Admin" } }).save();
    console.log("Admin permissions created successfully (both cases)");

    // Create customer permissions (Minimal)
    const customerData = {
      permission: ["profile", "read"],
      Menu: ["profile"],
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };
    await new UserPermissions({ ...customerData, _id: "customer", role: "customer", roleData: { user_role: "customer" } }).save();
    await new UserPermissions({ ...customerData, _id: "Customer", role: "Customer", roleData: { user_role: "Customer" } }).save();
    console.log("Customer permissions created successfully (both cases)");

    // Generic data for new roles (Minimal)
    const genericData = {
      permission: ["profile", "read"],
      Menu: ["profile"],
      created_date: new Date().toISOString(),
      updated_date: new Date().toISOString(),
    };

    const rolesToSeed = [
      { id: "hub manager", label: "Hub Manager" },
      { id: "customer support team lead", label: "Customer Support Team Lead" },
      { id: "customer care agent part lead", label: "Customer Care Agent Part Lead" },
      { id: "accounts team lead", label: "Accounts Team Lead" },
      { id: "junior accounts", label: "Junior Accounts" }
    ];

    for (const role of rolesToSeed) {
      await new UserPermissions({ ...genericData, _id: role.id, role: role.id, roleData: { user_role: role.id } }).save();
      await new UserPermissions({ ...genericData, _id: role.label, role: role.label, roleData: { user_role: role.label } }).save();
    }
    console.log("New roles seeded successfully (both cases)");

  } catch (err) {
    console.error("Error seeding permissions:", err.message);
  } finally {
    await mongoose.connection.close();
  }
}

seedUserPermissions();
