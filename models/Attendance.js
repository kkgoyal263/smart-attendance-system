const mongoose = require("mongoose");

const attendanceSchema = new mongoose.Schema({
  teacher: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  student: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true
  },

  subject: {
    type: String,
    required: true
  },

  date: {
    type: Date,
    default: Date.now
  },

  status: {
    type: String,
    default: "Present"
  }
});

module.exports = mongoose.model("Attendance", attendanceSchema);
