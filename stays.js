// API endpoints
const ADMISSIONS_API = "/api/patient_room";
const PATIENTS_API = "/api/patients";
const ROOMS_API = "/api/rooms";

// DOM elements
const admitForm = document.getElementById("admitForm");
const patientSelect = document.getElementById("patient_id");
const roomSelect = document.getElementById("room_id");
const checkInInput = document.getElementById("check_in");
const notesInput = document.getElementById("notes");
const staysTableBody = document.getElementById("staysTableBody");

// Utility: format datetime to YYYY-MM-DD HH:mm (24h)
function formatDT(dt) {
  if (!dt) return "-";
  const d = new Date(dt);
  const yyyy = d.getFullYear();
  const mm = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  const hh = String(d.getHours()).padStart(2, "0");
  const mi = String(d.getMinutes()).padStart(2, "0");
  return `${yyyy}-${mm}-${dd} ${hh}:${mi}`;
}

// Load dropdowns (patients + available rooms)
async function loadDropdowns() {
  const [patientsRes, roomsRes] = await Promise.all([
    fetch(PATIENTS_API),
    fetch(ROOMS_API)
  ]);
  const patients = await patientsRes.json();
  const rooms = await roomsRes.json();

  // Patients
  patientSelect.innerHTML = `<option value="">Select Patient</option>`;
  patients.forEach(p => {
    patientSelect.innerHTML += `<option value="${p.patient_id}">${p.first_name} ${p.last_name}</option>`;
  });

  // Rooms (only available)
  roomSelect.innerHTML = `<option value="">Select Room</option>`;
  rooms.filter(r => Number(r.is_occupied) === 0).forEach(r => {
    roomSelect.innerHTML += `<option value="${r.room_id}">${r.room_number} (${r.room_type})</option>`;
  });

  // Default check-in = now
  checkInInput.value = new Date().toISOString().slice(0,16);
}

// Refresh only rooms dropdown (after admit/discharge)
async function refreshRoomsDropdown() {
  const roomsRes = await fetch(ROOMS_API);
  const rooms = await roomsRes.json();

  roomSelect.innerHTML = `<option value="">Select Room</option>`;
  rooms.filter(r => Number(r.is_occupied) === 0).forEach(r => {
    roomSelect.innerHTML += `<option value="${r.room_id}">${r.room_number} (${r.room_type})</option>`;
  });
}

// Load admissions (patient_room)
async function loadAdmissions() {
  const res = await fetch(ADMISSIONS_API);
  const admissions = await res.json();

  staysTableBody.innerHTML = "";
  if (admissions.length === 0) {
    staysTableBody.innerHTML = `<tr><td colspan="7" style="text-align:center; color:#888;">No admissions yet</td></tr>`;
    return;
  }

  admissions.forEach(a => {
    const status = a.check_out ? "Discharged" : "Admitted";
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${a.stay_id}</td>
      <td>${a.patient_name}</td>
      <td>${a.room_number}</td>
      <td>${formatDT(a.check_in)}</td>
      <td>${a.check_out ? formatDT(a.check_out) : "-"}</td>
      <td><span class="badge ${status.toLowerCase()}">${status}</span></td>
      <td>
        ${!a.check_out ? `<button onclick="dischargeAdmission(${a.stay_id})">Discharge</button>` : ""}
      </td>
    `;
    staysTableBody.appendChild(row);
  });
}

// Admit patient
admitForm.onsubmit = async e => {
  e.preventDefault();
  const admission = {
    patient_id: patientSelect.value,
    room_id: roomSelect.value,
    check_in: checkInInput.value,
    notes: notesInput.value
  };
  const res = await fetch(ADMISSIONS_API, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(admission)
  });
  if (res.ok) {
    admitForm.reset();
    checkInInput.value = new Date().toISOString().slice(0,16);
    await refreshRoomsDropdown(); // keep rooms list current
    loadAdmissions();
  } else {
    alert("Error admitting patient");
  }
};

// Discharge patient
async function dischargeAdmission(id) {
  if (!confirm("Discharge this patient?")) return;
  const res = await fetch(`${ADMISSIONS_API}/${id}/discharge`, { method: "PUT" });
  if (res.ok) {
    await refreshRoomsDropdown(); // free the room in dropdown
    loadAdmissions();
  } else {
    alert("Error discharging patient");
  }
}

// Init
loadDropdowns();
loadAdmissions();

// Mode toggle buttons
const darkModeBtn = document.getElementById("darkModeBtn");
const contrastModeBtn = document.getElementById("contrastModeBtn");
const compactModeBtn = document.getElementById("compactModeBtn");
const largeTextBtn = document.getElementById("largeTextBtn");

// Helper: clear all mode classes
function clearModes() {
  document.body.classList.remove("dark-mode", "contrast-mode", "compact-mode", "large-text-mode");
}

// Dark Mode
darkModeBtn.addEventListener("click", () => {
  if (document.body.classList.contains("dark-mode")) {
    document.body.classList.remove("dark-mode");
  } else {
    clearModes();
    document.body.classList.add("dark-mode");
  }
});

// High Contrast Mode
contrastModeBtn.addEventListener("click", () => {
  if (document.body.classList.contains("contrast-mode")) {
    document.body.classList.remove("contrast-mode");
  } else {
    clearModes();
    document.body.classList.add("contrast-mode");
  }
});

// Compact Mode
compactModeBtn.addEventListener("click", () => {
  if (document.body.classList.contains("compact-mode")) {
    document.body.classList.remove("compact-mode");
  } else {
    clearModes();
    document.body.classList.add("compact-mode");
  }
});

// Large Text Mode
largeTextBtn.addEventListener("click", () => {
  if (document.body.classList.contains("large-text-mode")) {
    document.body.classList.remove("large-text-mode");
  } else {
    clearModes();
    document.body.classList.add("large-text-mode");
  }
});
