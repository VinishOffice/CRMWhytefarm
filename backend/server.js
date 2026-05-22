const express = require("express");
const cors = require("cors");
const path = require("path");
const dotenv = require("dotenv");
const connectDB = require("./db");
const fs = require("fs");
const uploadRoutes = require("./routes/uploadRoutes");
const batchRoutes = require("./routes/batchRoutes");
const customerRoutes = require("./routes/customers");
const ordersRoutes = require("./routes/orders");
const subscriptionRoutes = require("./routes/subscriptions");
const userRoutes = require("./routes/users");
const walletRoutes = require("./routes/wallet");
const analyticsRoutes = require("./routes/analytics");
const telephonyRoutes = require("./routes/telephony");
const messagingRoutes = require("./routes/messaging");
const emailRoutes = require("./routes/email");
const reportsRoutes = require("./routes/reports");

dotenv.config({ path: path.resolve(__dirname, ".env") });

const app = express();
app.use(
  cors({
    origin: true,
    credentials: true,
  })
);
app.use(express.json({ limit: "20mb" }));
app.use(express.urlencoded({ extended: true, limit: "20mb" }));

// Alias POST .../add to POST .../ for backward compatibility with frontend helpers
app.use((req, res, next) => {
  if (req.method === "POST" && req.path.endsWith("/add")) {
    req.url = req.url.replace(/\/add$/, "");
    console.log(`Aliasing ${req.method} ${req.originalUrl} to ${req.url}`);
  }
  next();
});

const uploadDir = path.join(__dirname, "uploads");
app.use("/uploads", express.static(uploadDir));

app.use("/api/upload", uploadRoutes);
app.use("/api/batch", batchRoutes);
app.use("/api/customers", customerRoutes);
app.use("/api/orders", ordersRoutes);
app.use("/api/subscriptions", subscriptionRoutes);
app.use("/api/users", userRoutes);
app.use("/api/wallet", walletRoutes);
app.use("/api/analytics", analyticsRoutes);
app.use("/api/telephony", telephonyRoutes);
app.use("/api/messaging", messagingRoutes);
app.use("/api/email", emailRoutes);
app.use("/api/reports", reportsRoutes);

// Auto-mount domain collection routes
const domainsDir = path.join(__dirname, "routes", "domains");
if (fs.existsSync(domainsDir)) {
  fs.readdirSync(domainsDir).forEach((domain) => {
    const domainPath = path.join(domainsDir, domain);
    if (!fs.statSync(domainPath).isDirectory()) return;
    fs.readdirSync(domainPath).forEach((collection) => {
      const routePath = path.join(domainPath, collection, "index.js");
      if (fs.existsSync(routePath)) {
        // eslint-disable-next-line global-require, import/no-dynamic-require
        const router = require(routePath);
        app.use(`/api/${collection}`, router);
      }
    });
  });
}

const port = process.env.BACKEND_PORT || 5001;

connectDB(process.env.MONGO_URI)
  .then(() => {
    app.listen(port, () => {
      console.log(`Backend running on port ${port}`);
    });
  })
  .catch((err) => {
    console.error("Failed to start backend:", err.message);
    process.exit(1);
  });
