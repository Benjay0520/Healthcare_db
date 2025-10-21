(function () {
  const FLOORS_API = "/api/floors";
  const ROOMS_API = "/api/rooms";

  function setLoading(container, isLoading) {
    if (!container) return;
    container.innerHTML = isLoading ? '<p class="loading">Loading floors & rooms…</p>' : '';
  }

  async function fetchFloorsAndRooms() {
    const container = document.getElementById("floorsList");
    if (!container) return;

    setLoading(container, true);

    try {
      const [floorsRes, roomsRes] = await Promise.all([
        fetch(FLOORS_API),
        fetch(ROOMS_API)
      ]);

      if (!floorsRes.ok || !roomsRes.ok) {
        throw new Error("Failed to fetch floors or rooms");
      }

      const floors = await floorsRes.json();
      const rooms = await roomsRes.json();

      renderFloorsAndRooms(floors, rooms);
    } catch (err) {
      console.error("Error loading floors/rooms:", err);
      const container = document.getElementById("floorsList");
      if (container) container.innerHTML = `<p style="color:red;">⚠️ Failed to load floors and rooms.</p>`;
    }
  }

  function createRoomCard(r) {
    const status = (r.status || (r.is_occupied ? "Occupied" : "Available") || "").toString().toLowerCase();
    const statusClass = status.includes("maint") ? "maintenance" : (status === "occupied" ? "occupied" : "available");

    const roomDiv = document.createElement("div");
    roomDiv.className = `room-card ${statusClass}`;
    roomDiv.setAttribute("role", "button");
    roomDiv.setAttribute("tabindex", "0");
    roomDiv.dataset.roomId = r.room_id ?? r.id ?? "";

    const numberEl = document.createElement("div");
    numberEl.className = "room-number";
    numberEl.textContent = r.room_number ?? r.number ?? r.id ?? "—";

    const typeEl = document.createElement("div");
    typeEl.className = "room-type";
    typeEl.textContent = r.room_type ?? r.type ?? "";

    const statusEl = document.createElement("div");
    statusEl.className = "room-status";
    statusEl.textContent = statusClass === "maintenance" ? "Maintenance" : (statusClass === "occupied" ? "Occupied" : "Available");

    roomDiv.append(numberEl, typeEl, statusEl);

    function toggleSelected() {
      roomDiv.classList.toggle("selected");
    }
    roomDiv.addEventListener("click", toggleSelected);
    roomDiv.addEventListener("keypress", (e) => {
      if (e.key === "Enter" || e.key === " ") {
        e.preventDefault();
        toggleSelected();
      }
    });

    return roomDiv;
  }

  function renderFloorsAndRooms(floors = [], rooms = []) {
    const container = document.getElementById("floorsList");
    if (!container) return;
    container.innerHTML = "";

    if (!Array.isArray(floors) || floors.length === 0) {
      container.innerHTML = "<p>No floors available.</p>";
      return;
    }

    floors.forEach(floor => {
      const floorDiv = document.createElement("div");
      floorDiv.className = "floor-card";

      const title = document.createElement("h2");
      title.textContent = `Floor ${floor.floor_number}${floor.description ? ' — ' + floor.description : ''}`;
      floorDiv.appendChild(title);

      const roomsGrid = document.createElement("div");
      roomsGrid.className = "rooms-grid";

      const floorRooms = Array.isArray(rooms) ? rooms.filter(r => r.floor_id === floor.floor_id || r.floor_id === floor.id) : [];

      if (floorRooms.length === 0) {
        const p = document.createElement("p");
        p.textContent = "No rooms assigned to this floor.";
        roomsGrid.appendChild(p);
      } else {
        floorRooms.forEach(r => {
          roomsGrid.appendChild(createRoomCard(r));
        });
      }

      floorDiv.appendChild(roomsGrid);
      container.appendChild(floorDiv);
    });
  }

  /* Mode toggles: ensure Rooms page responds even if script.js isn't loaded */
  (function modeModule() {
    const BODY = document.body;
    const STORAGE_KEY = 'icct_ui_modes';
    const ids = {
      dark: 'darkModeBtn',
      contrast: 'contrastModeBtn',
      compact: 'compactModeBtn',
      largeText: 'largeTextBtn'
    };

    const getBtn = id => document.getElementById(id);

    function load() {
      try { return JSON.parse(localStorage.getItem(STORAGE_KEY)) || {}; }
      catch { return {}; }
    }
    function save(m) { localStorage.setItem(STORAGE_KEY, JSON.stringify(m)); }

    function apply(m) {
      BODY.classList.toggle('dark-mode', !!m.dark);
      BODY.classList.toggle('contrast-mode', !!m.contrast);
      BODY.classList.toggle('compact-mode', !!m.compact);
      BODY.classList.toggle('large-text-mode', !!m.largeText);
      if (m.dark && m.contrast) { m.contrast = false; BODY.classList.remove('contrast-mode'); }
      Object.keys(ids).forEach(k => {
        const b = getBtn(ids[k]);
        if (b) b.setAttribute('aria-pressed', !!m[k]);
      });
      save(m);
    }

    const modes = load();
    apply(modes);

    function toggle(name) {
      if (name === 'dark') { modes.dark = !modes.dark; if (modes.dark) modes.contrast = false; }
      else if (name === 'contrast') { modes.contrast = !modes.contrast; if (modes.contrast) modes.dark = false; }
      else if (name === 'compact') modes.compact = !modes.compact;
      else if (name === 'largeText') modes.largeText = !modes.largeText;
      apply(modes);
    }

    Object.entries(ids).forEach(([name, id]) => {
      const el = getBtn(id);
      if (el) el.addEventListener('click', () => toggle(name));
    });

    // keyboard shortcut for quick testing
    window.addEventListener('keydown', (e) => { if (e.shiftKey && e.key.toLowerCase() === 'm') toggle('dark'); });
  })();

  document.addEventListener("DOMContentLoaded", fetchFloorsAndRooms);
})();
