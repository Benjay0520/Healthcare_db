const API_URL = "/api/patients";
const form = document.getElementById("patientForm");
const tableBody = document.getElementById("patientTableBody");
const submitBtn = document.getElementById("submitBtn");
const searchBox = document.getElementById("searchBox");
const filterGender = document.getElementById("filterGender");
const sortBy = document.getElementById("sortBy");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");

let editingId = null;
let patientsData = [];
let currentPage = 1;
const rowsPerPage = 5;

// Fetch patients with error handling
async function fetchPatients() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Failed to fetch patients");
    patientsData = await res.json();
    applyFilters();
  } catch (err) {
    alert("Error loading patients: " + err.message);
  }
}

// Render Table
function renderPatients(patients) {
  tableBody.innerHTML = "";
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pagePatients = patients.slice(start, end);

  pagePatients.forEach(p => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${p.patient_id}</td>
      <td>${p.first_name} ${p.last_name}</td>
      <td>${p.age}</td>
      <td>${p.gender}</td>
      <td>${p.contact_no || ""}</td>
      <td>${p.address || ""}</td>
      <td>
        <span class="status-badge">Active</span>
        <button class="action-btn edit-btn" onclick="editPatient(${p.patient_id}, '${p.first_name}', '${p.last_name}', ${p.age}, '${p.gender}', '${p.contact_no}', '${p.address}')"><i class="fa-solid fa-pen"></i></button>
        <button class="action-btn delete-btn" onclick="deletePatient(${p.patient_id})"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    tableBody.appendChild(row);
  });

  // Update pagination info
  const totalPages = Math.max(1, Math.ceil(patients.length / rowsPerPage));
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;
}

// Filters, Sorting, and Pagination
function applyFilters() {
  let filtered = [...patientsData];

  // Search
  const searchTerm = searchBox.value.trim().toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter(p =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm)
    );
  }

  // Gender Filter
  if (filterGender.value) {
    filtered = filtered.filter(p => p.gender === filterGender.value);
  }

  // Sorting
  switch (sortBy.value) {
    case "idAsc":
      filtered.sort((a, b) => a.patient_id - b.patient_id);
      break;
    case "idDesc":
      filtered.sort((a, b) => b.patient_id - a.patient_id);
      break;
    case "nameAZ":
      filtered.sort((a, b) => a.last_name.localeCompare(b.last_name));
      break;
    case "nameZA":
      filtered.sort((a, b) => b.last_name.localeCompare(a.last_name));
      break;
    case "ageAsc":
      filtered.sort((a, b) => a.age - b.age);
      break;
    case "ageDesc":
      filtered.sort((a, b) => b.age - a.age);
      break;
  }

  // Reset page if filter changes
  currentPage = 1;
  renderPatients(filtered);
}

// Pagination buttons
prevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    applyFilters();
  }
});

nextPageBtn.addEventListener("click", () => {
  const filtered = getFilteredPatients();
  const totalPages = Math.max(1, Math.ceil(filtered.length / rowsPerPage));
  if (currentPage < totalPages) {
    currentPage++;
    renderPatients(filtered);
  }
});

// Helper to get filtered patients for pagination
function getFilteredPatients() {
  let filtered = [...patientsData];
  const searchTerm = searchBox.value.trim().toLowerCase();
  if (searchTerm) {
    filtered = filtered.filter(p =>
      `${p.first_name} ${p.last_name}`.toLowerCase().includes(searchTerm)
    );
  }
  if (filterGender.value) {
    filtered = filtered.filter(p => p.gender === filterGender.value);
  }
  return filtered;
}

// CRUD
form.addEventListener("submit", async e => {
  e.preventDefault();
  const ageValue = parseInt(document.getElementById("age").value, 10);
  if (isNaN(ageValue) || ageValue < 0 || ageValue > 120) {
    alert("Please enter a valid age (0-120).");
    return;
  }
  const patient = {
    first_name: document.getElementById("first_name").value,
    last_name: document.getElementById("last_name").value,
    age: ageValue,
    gender: document.getElementById("gender").value,
    contact_no: document.getElementById("contact_no").value,
    address: document.getElementById("address").value
  };

  try {
    if (editingId) {
      await fetch(`${API_URL}/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patient)
      });
      editingId = null;
      submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Patient';
    } else {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(patient)
      });
    }
    form.reset();
    fetchPatients();
  } catch (err) {
    alert("Error saving patient: " + err.message);
  }
});

window.editPatient = function(id, fn, ln, age, gender, contact, address) {
  editingId = id;
  document.getElementById("first_name").value = fn;
  document.getElementById("last_name").value = ln;
  document.getElementById("age").value = age;
  document.getElementById("gender").value = gender;
  document.getElementById("contact_no").value = contact;
  document.getElementById("address").value = address;
  submitBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Update Patient';
};

window.deletePatient = async function(id) {
  if (confirm("Delete patient?")) {
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      fetchPatients();
    } catch (err) {
      alert("Error deleting patient: " + err.message);
    }
  }
};

// Init
searchBox.addEventListener("input", applyFilters);
filterGender.addEventListener("change", applyFilters);
sortBy.addEventListener("change", applyFilters);

function toggleMode(modeClass) {
  document.body.classList.toggle(modeClass);
  // Remove other modes if this one is activated
  ["dark-mode", "contrast-mode", "compact-mode", "large-text-mode"].forEach(cls => {
    if (cls !== modeClass) document.body.classList.remove(cls);
  });
}

document.getElementById("darkModeBtn").onclick = function() {
  toggleMode("dark-mode");
};
document.getElementById("contrastModeBtn").onclick = function() {
  toggleMode("contrast-mode");
};
document.getElementById("compactModeBtn").onclick = function() {
  toggleMode("compact-mode");
};
document.getElementById("largeTextBtn").onclick = function() {
  toggleMode("large-text-mode");
};

fetchPatients();