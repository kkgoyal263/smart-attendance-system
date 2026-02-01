const express = require("express");
const jwt = require("jsonwebtoken");
const QRCode = require("qrcode");
const Attendance = require("../models/Attendance");
const auth = require("../middleware/auth");


const router = express.Router();

// Store active QR sessions (in memory for MVP)
let activeSessions = {};

// Generate QR (Teacher)
router.post("/generate", auth, async (req, res) => {
  try {
    const { subject, teacherId } = req.body;

    // Create unique session
    const sessionId = Math.random().toString(36).substring(2, 10);

    // Expire after 2 min
    activeSessions[sessionId] = {
      subject,
      teacherId,
      expiresAt: Date.now() + 2 * 60 * 1000
    };

    const qrData = JSON.stringify({
      sessionId
    });

    const qrImage = await QRCode.toDataURL(qrData);

    res.json({
      qr: qrImage,
      sessionId,
      expiresAt: activeSessions[sessionId].expiresAt
    });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "QR generation failed" });
  }
});


// Mark Attendance (Student)
router.post("/mark", auth, async (req, res) => {
  try {
    const { sessionId, studentId } = req.body;

    const session = activeSessions[sessionId];

    if (!session) {
      return res.status(400).json({ msg: "Invalid QR" });
    }

    if (Date.now() > session.expiresAt) {
      delete activeSessions[sessionId];
      return res.status(400).json({ msg: "QR expired" });
    }

    // Save attendance
    const attendance = new Attendance({
      student: studentId,
      teacher: session.teacherId,
      subject: session.subject
    });

    await attendance.save();

    res.json({ msg: "Attendance marked ✅" });

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Attendance failed" });
  }
});

// Get Student Report
router.get("/student/:id", auth, async (req, res) => {
  try {
    const records = await Attendance
      .find({ student: req.params.id })
      .populate("student", "name email");

    res.json(records);

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Report error" });
  }
});


// Get Subject Report
router.get("/subject/:name", auth, async (req, res) => {
  try {
    const records = await Attendance.find({
      subject: req.params.name
    }).populate("student", "name email");

    res.json(records);

  } catch (err) {
    console.error(err);
    res.status(500).json({ msg: "Report error" });
  }
});

// Teacher Subject-wise Summary (Only Own Courses)
router.get("/teacher-summary/:teacherId", auth, async (req, res) => {
  try {

    // Security: Only allow self
    if(req.user.id !== req.params.teacherId){
      return res.status(403).json({ msg: "Access denied" });
    }

    const data = await Attendance.aggregate([

      {
        $match: {
          teacher: new require("mongoose").Types.ObjectId(req.params.teacherId)
        }
      },

      {
        $group: {
          _id: {
            subject: "$subject",
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$date"
              }
            }
          },
          count: { $sum: 1 }
        }
      },

      {
        $sort: { "_id.date": -1 }
      }

    ]);

    res.json(data);

  } catch(err){
    console.error(err);
    res.status(500).json({ msg: "Summary error" });
  }
});

// Admin Full Summary (All Teachers)
router.get("/admin-summary", auth, async (req, res) => {
  try {

    // Only admin allowed
    if(req.user.role !== "admin"){
      return res.status(403).json({ msg: "Admin only" });
    }

    const data = await Attendance.aggregate([

      {
        $group: {
          _id: {
            subject: "$subject",
            teacher: "$teacher",
            date: {
              $dateToString: {
                format: "%Y-%m-%d",
                date: "$date"
              }
            }
          },
          count: { $sum: 1 }
        }
      },

      {
        $sort: { "_id.date": -1 }
      }

    ]);

    res.json(data);

  } catch(err){
    res.status(500).json({ msg: "Admin summary error" });
  }
});

module.exports = router;
