const API_URL = "/api/appointments";
const form = document.getElementById("appointmentForm");
const tableBody = document.getElementById("appointmentTableBody");
const submitBtn = document.getElementById("submitBtn");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");

let editingId = null;
let appointmentsData = [];
let currentPage = 1;
const rowsPerPage = 5;

/* ---------- Helpers for formatting ---------- */
function formatDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  return d.toISOString().split("T")[0]; // YYYY-MM-DD
}

function formatTime(timeString) {
  if (!timeString) return "";
  // Handle both "HH:mm:ss" and ISO datetime
  const d = new Date(timeString);
  if (!isNaN(d)) {
    return d.toLocaleTimeString("en-GB", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: false
    });
  }
  // fallback if it's already "HH:mm:ss"
  return timeString.substring(0,5);
}

/* ---------- Load dropdowns ---------- */
async function loadDropdowns() {
  const patientRes = await fetch("/api/patients");
  const doctorRes = await fetch("/api/doctors");
  const patients = await patientRes.json();
  const doctors = await doctorRes.json();

  const patientSelect = document.getElementById("patient_id");
  const doctorSelect = document.getElementById("doctor_id");

  patients.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.patient_id;
    opt.textContent = `${p.first_name} ${p.last_name}`;
    patientSelect.appendChild(opt);
  });

  doctors.forEach(d => {
    const opt = document.createElement("option");
    opt.value = d.doctor_id;
    opt.textContent = `${d.first_name} ${d.last_name} (${d.specialty})`;
    doctorSelect.appendChild(opt);
  });
}

/* ---------- Fetch + Render ---------- */
async function fetchAppointments() {
  const res = await fetch(API_URL);
  appointmentsData = await res.json();
  renderAppointments(appointmentsData);
}

function renderAppointments(appointments) {
  tableBody.innerHTML = "";
  const start = (currentPage - 1) * rowsPerPage;
  const pageAppointments = appointments.slice(start, start + rowsPerPage);

  pageAppointments.forEach(a => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${a.appointment_id}</td>
      <td>${a.patient_name}</td>
      <td>${a.doctor_name}</td>
      <td>${a.specialty}</td>
      <td>${formatDate(a.appointment_date)}</td>
      <td>${formatTime(a.appointment_time)}</td>
      <td>${a.status}</td>
      <td>${a.notes || ""}</td>
      <td>
        <button class="action-btn edit-btn"><i class="fa-solid fa-pen"></i></button>
        <button class="action-btn delete-btn"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    row.querySelector(".edit-btn").onclick = () => editAppointment(a);
    row.querySelector(".delete-btn").onclick = () => deleteAppointment(a.appointment_id);
    tableBody.appendChild(row);
  });

  const totalPages = Math.max(1, Math.ceil(appointments.length / rowsPerPage));
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;
}

/* ---------- Pagination ---------- */
prevPageBtn.onclick = () => {
  if (currentPage > 1) {
    currentPage--;
    renderAppointments(appointmentsData);
  }
};

nextPageBtn.onclick = () => {
  const totalPages = Math.ceil(appointmentsData.length / rowsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderAppointments(appointmentsData);
  }
};

/* ---------- Form Submit ---------- */
form.onsubmit = async e => {
  e.preventDefault();
  let time = document.getElementById("appointment_time").value;
  if (time.length === 5) time += ":00"; // ensure HH:mm:ss

  const appointment = {
    patient_id: document.getElementById("patient_id").value,
    doctor_id: document.getElementById("doctor_id").value,
    appointment_date: document.getElementById("appointment_date").value,
    appointment_time: time,
    status: document.getElementById("status").value,
    notes: document.getElementById("notes").value
  };

  try {
    if (editingId) {
      await fetch(`${API_URL}/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointment)
      });
      editingId = null;
      submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Appointment';
    } else {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(appointment)
      });
    }
    form.reset();
    fetchAppointments();
  } catch (err) {
    alert("Error saving appointment: " + err.message);
  }
};

/* ---------- Edit ---------- */
function editAppointment(a) {
  editingId = a.appointment_id;
  document.getElementById("patient_id").value = a.patient_id;
  document.getElementById("doctor_id").value = a.doctor_id;
  document.getElementById("appointment_date").value = formatDate(a.appointment_date);
  document.getElementById("appointment_time").value = formatTime(a.appointment_time);
  document.getElementById("status").value = a.status;
  document.getElementById("notes").value = a.notes || "";
  submitBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Update Appointment';
}

/* ---------- Delete ---------- */
async function deleteAppointment(id) {
  if (confirm("Are you sure you want to delete this appointment?")) {
    await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    fetchAppointments();
  }
}

/* ---------- Mode Toggles ---------- */
function toggleMode(modeClass) {
  document.body.classList.toggle(modeClass);
  ["dark-mode", "contrast-mode", "compact-mode", "large-text-mode"].forEach(cls => {
    if (cls !== modeClass) document.body.classList.remove(cls);
  });
}

document.getElementById("darkModeBtn").onclick = () => toggleMode("dark-mode");
document.getElementById("contrastModeBtn").onclick = () => toggleMode("contrast-mode");
document.getElementById("compactModeBtn").onclick = () => toggleMode("compact-mode");
document.getElementById("largeTextBtn").onclick = () => toggleMode("large-text-mode");

/* ---------- Initialize ---------- */
loadDropdowns();
fetchAppointments();