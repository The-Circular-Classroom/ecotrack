const path = require('path');
require('dotenv').config({ path: path.join(__dirname, '../../.env') });
const express = require("express");
const cors = require("cors");
const compression = require("compression");

// Inventory routes
const donationRoutes = require('./routes/donationHandling');
const itemTypeRoutes = require("./routes/itemTypeHandling");
const inventoryRoutes = require("./routes/inventoryHandling");
const transactionRoutes = require('./routes/transactionHandling');
const tagRoutes = require('./routes/tagHandling');
const categoryRoutes = require('./routes/categoryHandling');
const sizeRoutes = require('./routes/sizeHandling');
const colourRoutes = require('./routes/colourHandling');
const patternRoutes = require('./routes/patternHandling');
const materialRoutes = require('./routes/materialHandling');
const brandRoutes = require('./routes/brandHandling');

// Analytics routes
const collectionRoutes = require('./routes/collectionHandling');
const assemblyRoutes = require('./routes/assemblyHandling');
const overviewRoutes = require('./routes/overviewHandling');
const reportRoutes = require('./routes/reportHandling');
const schoolRoutes = require('./routes/schoolHandling');

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(compression());

//Routes - Inventory
app.use("/api/brand", brandRoutes);
app.use("/api/category", categoryRoutes);
app.use("/api/colour", colourRoutes);
app.use("/api/donation-drive", donationRoutes);
app.use("/api/inventory", inventoryRoutes);
app.use("/api/item-type", itemTypeRoutes);
app.use("/api/material", materialRoutes);
app.use("/api/pattern", patternRoutes);
app.use("/api/size", sizeRoutes);
app.use("/api/tag", tagRoutes);
app.use("/api/transaction", transactionRoutes);

//Routes - Analytics
app.use("/api/collection", collectionRoutes);
app.use("/api/assembly", assemblyRoutes);
app.use("/api/overview", overviewRoutes);
app.use("/api/report", reportRoutes);
app.use("/api/school", schoolRoutes);

// Health check endpoint
app.get("/health", (req, res) => {
  res.status(200).json({ status: "ok" });
});

// 404 handler
app.use((req, res) => {
  console.warn(`404 Not Found: ${req.method} ${req.originalUrl}`);
  res.status(404).json({
    error: 'Not found',
    message: 'The requested resource was not found',
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: 'An unexpected error occurred',
  });
});

//to log responses sizes
app.use((req, res, next) => {
  const originalSend = res.send;
  res.send = function (body) {
    let sizeBytes = 0;
    try {
      if (body === null || body === undefined) {
        sizeBytes = 0;
      } else if (Buffer.isBuffer(body)) {
        sizeBytes = body.length;
      } else if (typeof body === 'string') {
        sizeBytes = Buffer.byteLength(body);
      } else {
        // For numbers, booleans, objects, etc., approximate size via JSON
        const serialized = JSON.stringify(body);
        sizeBytes = Buffer.byteLength(serialized);
      }
      const sizeMB = (sizeBytes / 1024 / 1024).toFixed(2);
      const status = sizeBytes > 10485760 ? '❌ OVER' : '✅ OK';
      console.log(`${status} ${req.method} ${req.path} → ${sizeMB} MB (${sizeBytes} bytes)`);
    } catch (e) {
      console.warn('Failed to calculate response size:', e);
    }
    return originalSend.call(this, body);
  };
  next();
});

if (require.main === module) {
  const PORT = process.env.PORT || 3000;
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}

module.exports = app;
