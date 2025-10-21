const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const path = require("path");

const app = express();
app.use(cors());
app.use(express.json());

// 🧩 Serve the frontend folder (UI files)
app.use(express.static(path.join(__dirname, "public_ui")));

// 🏥 MySQL Connection
const db = mysql.createConnection({
  host: "localhost",
  user: "root",
  password: "admin123", // change if needed
  database: "healthcare_db",
});

db.connect((err) => {
  if (err) {
    console.error("❌ Database connection failed:", err);
    return;
  }
  console.log("✅ Connected to MySQL database!");
});

// =========================
// 👥 PATIENT ROUTES
// =========================

// Get all patients
app.get("/api/patients", (req, res) => {
  db.query("SELECT * FROM patients ORDER BY patient_id ASC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Add new patient
app.post("/api/patients", (req, res) => {
  const { first_name, last_name, age, gender, address, contact_no } = req.body;
  const sql =
    "INSERT INTO patients (first_name, last_name, age, gender, address, contact_no) VALUES (?, ?, ?, ?, ?, ?)";
  db.query(
    sql,
    [first_name, last_name, age, gender, address, contact_no],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        patient_id: result.insertId,
        first_name,
        last_name,
        age,
        gender,
        address,
        contact_no,
      });
    }
  );
});

// Update patient
app.put("/api/patients/:id", (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, age, gender, address, contact_no } = req.body;
  const sql =
    "UPDATE patients SET first_name=?, last_name=?, age=?, gender=?, address=?, contact_no=? WHERE patient_id=?";
  db.query(
    sql,
    [first_name, last_name, age, gender, address, contact_no, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "✅ Patient updated successfully!" });
    }
  );
});

// Delete patient
app.delete("/api/patients/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM patients WHERE patient_id=?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "🗑️ Patient deleted successfully!" });
  });
});

// =========================
// 🩺 DOCTOR ROUTES
// =========================

// Get all doctors
app.get("/api/doctors", (req, res) => {
  db.query("SELECT * FROM doctors ORDER BY doctor_id ASC", (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Add new doctor
app.post("/api/doctors", (req, res) => {
  const { first_name, last_name, specialty, contact_no, schedule } = req.body;
  const sql =
    "INSERT INTO doctors (first_name, last_name, specialty, contact_no, schedule) VALUES (?, ?, ?, ?, ?)";
  db.query(
    sql,
    [first_name, last_name, specialty, contact_no, schedule],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({
        doctor_id: result.insertId,
        first_name,
        last_name,
        specialty,
        contact_no,
        schedule,
      });
    }
  );
});

// Update doctor
app.put("/api/doctors/:id", (req, res) => {
  const { id } = req.params;
  const { first_name, last_name, specialty, contact_no, schedule } = req.body;
  const sql =
    "UPDATE doctors SET first_name=?, last_name=?, specialty=?, contact_no=?, schedule=? WHERE doctor_id=?";
  db.query(
    sql,
    [first_name, last_name, specialty, contact_no, schedule, id],
    (err) => {
      if (err) return res.status(500).json({ error: err.message });
      res.json({ message: "✅ Doctor updated successfully!" });
    }
  );
});

// Delete doctor
app.delete("/api/doctors/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM doctors WHERE doctor_id=?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "🗑️ Doctor deleted successfully!" });
  });
});

// =========================
// 📅 APPOINTMENT ROUTES
// =========================
app.get("/api/appointments", (req, res) => {
  const sql = `
    SELECT a.appointment_id, a.appointment_date, a.appointment_time, a.status, a.notes,
           p.patient_id, CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
           d.doctor_id, CONCAT(d.first_name, ' ', d.last_name) AS doctor_name, d.specialty
    FROM appointments a
    JOIN patients p ON a.patient_id = p.patient_id
    JOIN doctors d ON a.doctor_id = d.doctor_id
    ORDER BY a.appointment_date, a.appointment_time
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post("/api/appointments", (req, res) => {
  const { patient_id, doctor_id, appointment_date, appointment_time, status, notes } = req.body;
  console.log("Incoming appointment:", req.body);
  const sql = `
    INSERT INTO appointments (patient_id, doctor_id, appointment_date, appointment_time, status, notes)
    VALUES (?, ?, ?, ?, ?, ?)
  `;
  db.query(sql, [patient_id, doctor_id, appointment_date, appointment_time, status, notes], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ appointment_id: result.insertId, patient_id, doctor_id, appointment_date, appointment_time, status, notes });
  });
});

app.put("/api/appointments/:id", (req, res) => {
  const { id } = req.params;
  const { patient_id, doctor_id, appointment_date, appointment_time, status, notes } = req.body;
  const sql = `
    UPDATE appointments
    SET patient_id=?, doctor_id=?, appointment_date=?, appointment_time=?, status=?, notes=?
    WHERE appointment_id=?
  `;
  db.query(sql, [patient_id, doctor_id, appointment_date, appointment_time, status, notes, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "✅ Appointment updated successfully!" });
  });
});

app.delete("/api/appointments/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM appointments WHERE appointment_id=?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "🗑️ Appointment deleted successfully!" });
  });
});

// =========================
// 💳 BILLING ROUTES
// =========================

// Get all billing records
app.get("/api/billing", (req, res) => {
  const sql = `
    SELECT b.billing_id, b.patient_id, b.amount, b.billing_date, b.status, b.notes,
           CONCAT(p.first_name, ' ', p.last_name) AS patient_name
    FROM billing b
    JOIN patients p ON b.patient_id = p.patient_id
    ORDER BY b.billing_date DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Add new billing record
app.post("/api/billing", (req, res) => {
  const { patient_id, amount, billing_date, status, notes } = req.body;
  console.log("Incoming billing:", req.body);

  if (!patient_id || !amount || !billing_date || !status) {
    return res.status(400).json({ error: "Missing required fields" });
  }

  const sql = `
    INSERT INTO billing (patient_id, amount, billing_date, status, notes)
    VALUES (?, ?, ?, ?, ?)
  `;
    db.query(sql, [patient_id, amount, billing_date, status, notes || null], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({
      billing_id: result.insertId,
      patient_id,
      amount,
      billing_date,
      status,
      notes
    });
  });
});

// Update billing record
app.put("/api/billing/:id", (req, res) => {
  const { id } = req.params;
  const { patient_id, amount, billing_date, status, notes } = req.body;

  const sql = `
    UPDATE billing
    SET patient_id=?, amount=?, billing_date=?, status=?, notes=?
    WHERE billing_id=?
  `;
  db.query(sql, [patient_id, amount, billing_date, status, notes || null, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "✅ Billing record updated successfully!" });
  });
});

// Delete billing record
app.delete("/api/billing/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM billing WHERE billing_id=?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "🗑️ Billing record deleted successfully!" });
  });
});

// =========================
// 🏢 FLOORS ROUTES
// =========================

// Get all floors
app.get("/api/floors", (req, res) => {
  const sql = "SELECT floor_id, floor_number, description FROM floors ORDER BY floor_number ASC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Add new floor
app.post("/api/floors", (req, res) => {
  const { floor_number, description } = req.body;
  const sql = "INSERT INTO floors (floor_number, description) VALUES (?, ?)";
  db.query(sql, [floor_number, description], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ floor_id: result.insertId, floor_number, description });
  });
});

// Update floor
app.put("/api/floors/:id", (req, res) => {
  const { id } = req.params;
  const { floor_number, description } = req.body;
  const sql = "UPDATE floors SET floor_number=?, description=? WHERE floor_id=?";
  db.query(sql, [floor_number, description, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "✅ Floor updated successfully!" });
  });
});

// Delete floor
app.delete("/api/floors/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM floors WHERE floor_id=?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "🗑️ Floor deleted successfully!" });
  });
});

// =========================
// 🚪 ROOMS ROUTES
// =========================

// Get all rooms (with floor info)
app.get("/api/rooms", (req, res) => {
  const sql = `
    SELECT r.room_id, r.room_number, r.room_type, r.room_rate, r.is_occupied,
           r.floor_id, f.floor_number, f.description
    FROM rooms r
    JOIN floors f ON r.floor_id = f.floor_id
    ORDER BY r.room_number ASC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Add new room
app.post("/api/rooms", (req, res) => {
  const { floor_id, room_number, room_type, room_rate, is_occupied } = req.body;
  const sql = `
    INSERT INTO rooms (floor_id, room_number, room_type, room_rate, is_occupied)
    VALUES (?, ?, ?, ?, ?)
  `;
  db.query(sql, [floor_id, room_number, room_type, room_rate, is_occupied], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ room_id: result.insertId, floor_id, room_number, room_type, room_rate, is_occupied });
  });
});

// Update room
app.put("/api/rooms/:id", (req, res) => {
  const { id } = req.params;
  const { floor_id, room_number, room_type, room_rate, is_occupied } = req.body;
  const sql = `
    UPDATE rooms
    SET floor_id=?, room_number=?, room_type=?, room_rate=?, is_occupied=?
    WHERE room_id=?
  `;
  db.query(sql, [floor_id, room_number, room_type, room_rate, is_occupied, id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "✅ Room updated successfully!" });
  });
});

// Delete room
app.delete("/api/rooms/:id", (req, res) => {
  const { id } = req.params;
  db.query("DELETE FROM rooms WHERE room_id=?", [id], (err) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json({ message: "🗑️ Room deleted successfully!" });
  });
});

// =========================
// 🛏️ PATIENT_ROOM (Admissions)
// =========================

// Get all admissions with patient + room info
app.get("/api/patient_room", (req, res) => {
  const sql = `
    SELECT pr.stay_id, pr.patient_id, pr.room_id, pr.check_in, pr.check_out, pr.notes,
           CONCAT(p.first_name, ' ', p.last_name) AS patient_name,
           r.room_number
    FROM patient_room pr
    JOIN patients p ON pr.patient_id = p.patient_id
    JOIN rooms r ON pr.room_id = r.room_id
    ORDER BY pr.check_in DESC
  `;
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

// Admit (insert into patient_room)
app.post("/api/patient_room", (req, res) => {
  const { patient_id, room_id, check_in, notes } = req.body;
  const sql = "INSERT INTO patient_room (patient_id, room_id, check_in, notes) VALUES (?, ?, ?, ?)";
  db.query(sql, [patient_id, room_id, check_in, notes], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });

    // Mark room occupied
    db.query("UPDATE rooms SET is_occupied = 1 WHERE room_id = ?", [room_id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });
      res.json({
        stay_id: result.insertId,
        patient_id,
        room_id,
        check_in,
        notes,
        message: "✅ Patient admitted successfully!"
      });
    });
  });
});

// Discharge (update patient_room + free room)
app.put("/api/patient_room/:id/discharge", (req, res) => {
  const { id } = req.params;
  const checkOut = new Date();

  // Find room for this admission
  db.query("SELECT room_id FROM patient_room WHERE stay_id = ?", [id], (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    if (results.length === 0) return res.status(404).json({ error: "Admission not found" });

    const room_id = results[0].room_id;

    // Update check_out
    db.query("UPDATE patient_room SET check_out = ? WHERE stay_id = ?", [checkOut, id], (err2) => {
      if (err2) return res.status(500).json({ error: err2.message });

      // Free the room
      db.query("UPDATE rooms SET is_occupied = 0 WHERE room_id = ?", [room_id], (err3) => {
        if (err3) return res.status(500).json({ error: err3.message });
        res.json({ message: "✅ Patient discharged successfully!", check_out: checkOut });
      });
    });
  });
});

// =========================
// start Server
// =========================
const PORT = 5000;
app.listen(PORT, () => {
  console.log(`🚀 ICCT Healthcare System Server running at http://localhost:${PORT}`);
});