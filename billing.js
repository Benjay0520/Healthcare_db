const API_URL = "/api/billing";
const form = document.getElementById("billingForm");
const tableBody = document.getElementById("billingTableBody");
const submitBtn = document.getElementById("submitBtn");
const prevPageBtn = document.getElementById("prevPage");
const nextPageBtn = document.getElementById("nextPage");
const pageInfo = document.getElementById("pageInfo");
const statusFilter = document.getElementById("statusFilter");
const searchBox = document.getElementById("searchBox");

let editingId = null;
let billingData = [];
let currentPage = 1;
const rowsPerPage = 5;

// 🔧 Utility: format date as YYYY-MM-DD
function formatDate(dateString) {
  if (!dateString) return "";
  const d = new Date(dateString);
  if (isNaN(d)) return dateString; // fallback if invalid
  return d.toISOString().split("T")[0];
}

// 🔧 Populate patients dropdown
async function loadPatients() {
  const res = await fetch("/api/patients");
  const patients = await res.json();
  const select = document.getElementById("patient_id");
  select.innerHTML = `<option value="">Select Patient</option>`;
  patients.forEach(p => {
    const opt = document.createElement("option");
    opt.value = p.patient_id;
    opt.textContent = `${p.first_name} ${p.last_name}`;
    select.appendChild(opt);
  });
}

// 🔧 Populate status dropdown (matches ENUM in DB)
function loadStatusOptions() {
  const statusSelect = document.getElementById("status");
  const statuses = ["Unpaid", "Paid", "Pending"];
  statusSelect.innerHTML = "";
  statuses.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    statusSelect.appendChild(opt);
  });

  // Also populate filter dropdown
  statusFilter.innerHTML = `<option value="">All</option>`;
  statuses.forEach(s => {
    const opt = document.createElement("option");
    opt.value = s;
    opt.textContent = s;
    statusFilter.appendChild(opt);
  });
}

async function fetchBilling() {
  const res = await fetch(API_URL);
  billingData = await res.json();
  applyFilters();
}

// 🔧 Apply filters before rendering
function applyFilters() {
  const selectedStatus = statusFilter.value;
  const searchTerm = searchBox.value.toLowerCase();
  let filteredData = billingData;

  // Filter by status
  if (selectedStatus) {
    filteredData = filteredData.filter(b => b.status === selectedStatus);
  }

  // Filter by search term (patient name or notes)
  if (searchTerm) {
    filteredData = filteredData.filter(b =>
      (b.patient_name && b.patient_name.toLowerCase().includes(searchTerm)) ||
      (b.notes && b.notes.toLowerCase().includes(searchTerm))
    );
  }

  currentPage = 1; // reset to first page
  renderBilling(filteredData);
}

function renderBilling(data) {
  tableBody.innerHTML = "";
  const start = (currentPage - 1) * rowsPerPage;
  const pageData = data.slice(start, start + rowsPerPage);

  pageData.forEach(b => {
    const row = document.createElement("tr");
    row.innerHTML = `
      <td>${b.billing_id}</td>
      <td>${b.patient_name}</td>
      <td>₱${parseFloat(b.amount).toFixed(2)}</td>
      <td>${formatDate(b.billing_date)}</td>
      <td>${b.status}</td>
      <td>${b.notes || ""}</td>
      <td>
        <button class="action-btn edit-btn"><i class="fa-solid fa-pen"></i></button>
        <button class="action-btn delete-btn"><i class="fa-solid fa-trash"></i></button>
      </td>
    `;
    row.querySelector(".edit-btn").onclick = () => editBilling(b);
    row.querySelector(".delete-btn").onclick = () => deleteBilling(b.billing_id);
    tableBody.appendChild(row);
  });

  const totalPages = Math.max(1, Math.ceil(data.length / rowsPerPage));
  pageInfo.textContent = `Page ${currentPage} of ${totalPages}`;
  prevPageBtn.disabled = currentPage === 1;
  nextPageBtn.disabled = currentPage === totalPages;
}

prevPageBtn.onclick = () => {
  if (currentPage > 1) {
    currentPage--;
    applyFilters();
  }
};

nextPageBtn.onclick = () => {
  const selectedStatus = statusFilter.value;
  const searchTerm = searchBox.value.toLowerCase();
  let filteredData = billingData;

  if (selectedStatus) {
    filteredData = filteredData.filter(b => b.status === selectedStatus);
  }
  if (searchTerm) {
    filteredData = filteredData.filter(b =>
      (b.patient_name && b.patient_name.toLowerCase().includes(searchTerm)) ||
      (b.notes && b.notes.toLowerCase().includes(searchTerm))
    );
  }

  const totalPages = Math.ceil(filteredData.length / rowsPerPage);
  if (currentPage < totalPages) {
    currentPage++;
    renderBilling(filteredData);
  }
};

form.onsubmit = async e => {
  e.preventDefault();
  const billing = {
    patient_id: document.getElementById("patient_id").value,
    amount: parseFloat(document.getElementById("amount").value),
    billing_date: document.getElementById("billing_date").value,
    status: document.getElementById("status").value,
    notes: document.getElementById("notes").value
  };

  try {
    let res;
    if (editingId) {
      res = await fetch(`${API_URL}/${editingId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billing)
      });
      editingId = null;
      submitBtn.innerHTML = '<i class="fa-solid fa-plus"></i> Add Billing';
    } else {
      res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(billing)
      });
    }

    if (!res.ok) {
      const err = await res.json();
      throw new Error(err.error || "Failed to save billing");
    }

    console.log("Billing saved:", await res.json());
    form.reset();
    fetchBilling();
  } catch (err) {
    console.error("Billing save error:", err);
    alert("Error saving billing: " + err.message);
  }
};

function editBilling(b) {
  editingId = b.billing_id;
  document.getElementById("patient_id").value = b.patient_id;
  document.getElementById("amount").value = b.amount;
  document.getElementById("billing_date").value = formatDate(b.billing_date);
  document.getElementById("status").value = b.status;
  document.getElementById("notes").value = b.notes || "";
  submitBtn.innerHTML = '<i class="fa-solid fa-pen"></i> Update Billing';
}

async function deleteBilling(id) {
  if (confirm("Delete this billing record?")) {
    const res = await fetch(`${API_URL}/${id}`, { method: "DELETE" });
    if (!res.ok) {
      const err = await res.json();
      alert("Error deleting billing: " + err.error);
      return;
    }
    fetchBilling();
  }
}

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

// Initialize
loadPatients();
loadStatusOptions();
fetchBilling();
statusFilter.onchange = () => applyFilters();
searchBox.oninput = () => applyFilters();