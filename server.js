const express = require("express");
const mongoose = require("mongoose");
const cors = require("cors");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.static("public"));
app.use("/api/auth", require("./routes/auth"));
app.use("/api/attendance", require("./routes/attendance"));
app.use("/api/admin", require("./routes/admin"));



// Test Route
app.get("/", (req, res) => {
  res.send("Smart Attendance Backend Running 🚀");
});

// DB Connect
mongoose.connect(process.env.MONGO_URL)
.then(() => console.log("MongoDB Connected ✅"))
.catch(err => console.log("DB Error:", err));

// Start Server
const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server started on port ${PORT}`);
});

// d4qdw4hf
// 697e02568b2309f354280ef5