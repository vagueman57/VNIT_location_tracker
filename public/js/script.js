// ===========================================================
// SOCKET.IO
// ===========================================================
const socket = io();

let username = null;
let lastUpdate = 0;

loadGraph();

// ===========================================================
// USERNAME MODAL
// ===========================================================
const modal = document.getElementById("nameModal");
document.getElementById("joinBtn").addEventListener("click", () => {
  const name = document.getElementById("usernameInput").value.trim();
  if (!name) return;

  username = name;
  modal.style.display = "none";
  socket.emit("join", { name });

  startLocationTracking();
});


// ===========================================================
// MAP INITIALIZATION
// ===========================================================
const VNIT_BOUNDS = L.latLngBounds(
  L.latLng(21.1170, 79.0445),
  L.latLng(21.1320, 79.0585)
);

const map = L.map("map", {
  maxBounds: VNIT_BOUNDS,
  maxBoundsViscosity: 1.0
}).setView([21.1250, 79.0515], 16);

L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png").addTo(map);

L.rectangle(VNIT_BOUNDS, { color: "blue", weight: 4, fillOpacity: 0.1 }).addTo(map);


// ===========================================================
// LIVE LOCATION TRACKING
// ===========================================================
function startLocationTracking() {
  if (navigator.geolocation) {
    navigator.geolocation.watchPosition(
      (pos) => {
        const now = Date.now();
        if (now - lastUpdate < 1200) return; // smooth & fast
        lastUpdate = now;

        socket.emit("send-location", {
          latitude: pos.coords.latitude,
          longitude: pos.coords.longitude
        });
      },
      (err) => console.error("GPS ERROR:", err.message),
      { enableHighAccuracy: true, timeout: 5000, maximumAge: 0 }
    );
  }
}

const markers = {};
const trails = {};

socket.on("receive-location", (data) => {
  const { id, name, color, latitude, longitude } = data;

  // trail
  if (!trails[id]) {
    trails[id] = L.polyline([], { color, weight: 4 }).addTo(map);
  }
  trails[id].addLatLng([latitude, longitude]);

  // marker
  if (!markers[id]) {
    const customIcon = L.divIcon({
      className: "custom-marker",
      html: `
        <div class="marker-label" style="background:${color}">${name}</div>
        <div class="marker-dot" style="background:${color}"></div>
      `,
      iconSize: [80, 30],
      iconAnchor: [40, 30]
    });

    markers[id] = L.marker([latitude, longitude], { icon: customIcon }).addTo(map);
  } else {
    markers[id].setLatLng([latitude, longitude]);
  }

  if (socket.id === id) {
    map.setView([latitude, longitude], 16);
  }
});

socket.on("user-disconnected", (id) => {
  if (markers[id]) map.removeLayer(markers[id]);
  if (trails[id]) map.removeLayer(trails[id]);
  delete markers[id];
  delete trails[id];
});


// ===========================================================
// ROUTING (A* SEARCH)
// ===========================================================
let campusGraph = null;
let nodeIndex = {};
let edges = {};

async function loadGraph() {
  const res = await fetch("/data/campus_graph.json");
  campusGraph = await res.json();

  nodeIndex = {};
  edges = {};

  for (const [id, n] of Object.entries(campusGraph.nodes)) {
    nodeIndex[id] = n;
    edges[id] = [];
  }

  for (const [id, neighbors] of Object.entries(campusGraph.edges)) {
    for (const nid of neighbors) {
      const a = nodeIndex[id];
      const b = nodeIndex[nid];
      const dist = haversine(a.lat, a.lng, b.lat, b.lng);

      edges[id].push({ to: nid, w: dist });
      edges[nid].push({ to: id, w: dist });
    }
  }
}

function haversine(lat1, lon1, lat2, lon2) {
  const R = 6371000;
  const toRad = x => x * Math.PI / 180;
  const dLat = toRad(lat2 - lat1);
  const dLon = toRad(lon2 - lon1);
  const a =
    Math.sin(dLat/2)**2 +
    Math.cos(toRad(lat1))*Math.cos(toRad(lat2))*
    Math.sin(dLon/2)**2;

  return R * 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
}

function aStar(start, goal) {
  const open = new Set([start]);
  const g = {};
  const f = {};
  const parent = {};

  for (const k in nodeIndex) {
    g[k] = Infinity;
    f[k] = Infinity;
  }

  g[start] = 0;
  f[start] = haversine(
    nodeIndex[start].lat, nodeIndex[start].lng,
    nodeIndex[goal].lat, nodeIndex[goal].lng
  );

  while (open.size > 0) {
    let best = null;
    for (const n of open)
      if (best === null || f[n] < f[best]) best = n;

    if (best === goal) {
      const path = [];
      let c = goal;
      while (c) {
        path.unshift(c);
        c = parent[c];
      }
      return path;
    }

    open.delete(best);

    for (const nb of edges[best]) {
      const tentative = g[best] + nb.w;
      if (tentative < g[nb.to]) {
        parent[nb.to] = best;
        g[nb.to] = tentative;
        f[nb.to] = tentative + haversine(
          nodeIndex[nb.to].lat, nodeIndex[nb.to].lng,
          nodeIndex[goal].lat, nodeIndex[goal].lng
        );
        open.add(nb.to);
      }
    }
  }

  return null;
}


// ===========================================================
// ROUTE UI
// ===========================================================
let routeLine = null;
let destMarker = null;

function clearRoute() {
  if (routeLine) map.removeLayer(routeLine);
  if (destMarker) map.removeLayer(destMarker);
  document.getElementById("directionsList").innerHTML = "";
}

document.getElementById("clearRoute").onclick = clearRoute;

document.getElementById("searchBtn").onclick = () => {
  handleSearch(document.getElementById("placeSearch").value);
};
document.getElementById("placeSearch").onkeydown = (e) => {
  if (e.key === "Enter") handleSearch(e.target.value);
};

async function handleSearch(query) {
  if (!campusGraph) await loadGraph();

  query = query.trim().toLowerCase();
  if (!query) return alert("Enter a valid place.");

  const match = Object.values(nodeIndex)
    .find(n => n.name.toLowerCase().includes(query));

  if (!match) return alert("No place found!");

  const dest = match;

  let userLat, userLng;

  await new Promise(resolve => {
    navigator.geolocation.getCurrentPosition(
      pos => {
        userLat = pos.coords.latitude;
        userLng = pos.coords.longitude;
        resolve();
      },
      () => {
        const c = map.getCenter();
        userLat = c.lat;
        userLng = c.lng;
        resolve();
      }
    );
  });

  let start = null, minD = Infinity;
  for (const [id, n] of Object.entries(nodeIndex)) {
    const d = haversine(userLat, userLng, n.lat, n.lng);
    if (d < minD) {
      minD = d;
      start = id;
    }
  }

  const path = aStar(start, dest.id);

  if (!path) return alert("No route found!");

  clearRoute();

  const coords = path.map(id => [nodeIndex[id].lat, nodeIndex[id].lng]);
  routeLine = L.polyline(coords, { color: "magenta", weight: 5 }).addTo(map);

  destMarker = L.marker([dest.lat, dest.lng]).addTo(map)
    .bindPopup(dest.name).openPopup();

  map.fitBounds(routeLine.getBounds(), { padding: [40, 40] });

  const UL = document.getElementById("directionsList");
  UL.innerHTML = "";
  for (let i = 0; i < path.length - 1; i++) {
    const a = nodeIndex[path[i]];
    const b = nodeIndex[path[i+1]];
    const li = document.createElement("li");
    li.innerText = `${a.name} → ${b.name}`;
    UL.appendChild(li);
  }
}
