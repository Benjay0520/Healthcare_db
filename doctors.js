const API_URL = "/api/doctors";
const form = document.getElementById("doctorForm");
const tableBody = document.getElementById("doctorTableBody");
const submitBtn = document.getElementById("submitBtn");
const searchBox = document.getElementById("searchBox");
const sortBy = document.getElementById("sortBy");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");

let editingId = null;
let doctorsData = [];
let currentPage = 1;
const rowsPerPage = 5;

// Fetch doctors
async function fetchDoctors() {
  try {
    const res = await fetch(API_URL);
    if (!res.ok) throw new Error("Failed to fetch doctors");
    doctorsData = await res.json();
    applyFilters();
  } catch (err) {
    alert("Error loading doctors: " + err.message);
  }
}

// Render table
function renderDoctors(doctors) {
  tableBody.innerHTML = "";
  const start = (currentPage - 1) * rowsPerPage;
  const end = start + rowsPerPage;
  const pageDoctors = doctors.slice(start, end);

  pageDoctors.forEach(d => {
    const row = document.createElement("tr");

    row.innerHTML = `
      <td>${d.doctor_id}</td>
      <td>${d.first_name} ${d.last_name}</td>
      <td>${d.specialty}</td>
      <td>${d.contact_no}</td>
      <td>${d.schedule}</td>
      <td>
        <button class="action-btn edit-btn"><i class="fa-solid fa-pen"></i></button>
        <button class="action-btn delete-btn"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;

    // Attach event listeners safely
    const editBtn = row.querySelector(".edit-btn");
    editBtn.addEventListener("click", () => {
      editDoctor(d.doctor_id, d.first_name, d.last_name, d.specialty, d.contact_no, d.schedule);
    });

    const deleteBtn = row.querySelector(".delete-btn");
    deleteBtn.addEventListener("click", () => {
      deleteDoctor(d.doctor_id);
    });

    tableBody.appendChild(row);
  });

  const totalPages = Math.max(1, Math.ceil(doctors.length / rowsPerPage));
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;
}

// Filters, sorting, pagination
function applyFilters() {
  let filtered = [...doctorsData];
  const searchTerm = searchBox.value.trim().toLowerCase();

  if (searchTerm) {
    filtered = filtered.filter(d =>
      `${d.first_name} ${d.last_name}`.toLowerCase().includes(searchTerm)
    );
  }

  switch (sortBy.value) {
    case "idAsc":
      filtered.sort((a, b) => a.doctor_id - b.doctor_id);
      break;
    case "idDesc":
      filtered.sort((a, b) => b.doctor_id - a.doctor_id);
      break;
    case "nameAZ":
      filtered.sort((a, b) => a.last_name.localeCompare(b.last_name));
      break;
    case "nameZA":
      filtered.sort((a, b) => b.last_name.localeCompare(a.last_name));
      break;
  }

  currentPage = 1;
  renderDoctors(filtered);
}

// Pagination
prevPageBtn.addEventListener("click", () => {
  if (currentPage > 1) {
    currentPage--;
    applyFilters();
  }
});

nextPageBtn.addEventListener("click", () => {
  const totalPages = Math.ceil(doctorsData.length / rowsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    applyFilters();
  }
});

// CRUD
form.addEventListener("submit", async e => {
  e.preventDefault();
  const doctor = {
    first_name: document.getElementById("first_name").value,
    last_name: document.getElementById("last_name").value,
    specialty: document.getElementById("specialty").value,
    contact_no: document.getElementById("contact_no").value,
    schedule: document.getElementById("schedule").value
  };

  try {
    if (editingId) {
      await fetch(`${API_URL}/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doctor)
      });
      editingId = null;
      submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Doctor';
    } else {
      await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(doctor)
      });
    }
    form.reset();
    fetchDoctors();
  } catch (err) {
    alert("Error saving doctor: " + err.message);
  }
});

function editDoctor(id, fn, ln, spec, contact, sched) {
  editingId = id;
  document.getElementById("first_name").value = fn;
  document.getElementById("last_name").value = ln;
  document.getElementById("specialty").value = spec;
  document.getElementById("contact_no").value = contact;
  document.getElementById("schedule").value = sched;
  submitBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Update Doctor';
}

async function deleteDoctor(id) {
  if (confirm("Delete doctor?")) {
    try {
      await fetch(`${API_URL}/${id}`, { method: "DELETE" });
      fetchDoctors();
    } catch (err) {
      alert("Error deleting doctor: " + err.message);
    }
  }
}

// Mode buttons
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

// Init
fetchDoctors();