// Lưu lượt "yêu thích" theo từng listingId vào localStorage
const KEY = "favorites_map"; // dạng { [listingId]: number }

function read() {
  try { return JSON.parse(localStorage.getItem(KEY) || "{}"); }
  catch { return {}; }
}
function write(map) { localStorage.setItem(KEY, JSON.stringify(map)); }

export function getFavoriteCount(id) {
  const map = read();
  return Number(map[id] || 0);
}

export function addFavorite(id) {
  const map = read();
  map[id] = (map[id] || 0) + 1;
  write(map);
  return map[id];
}

export function setFavoriteCount(id, count) {
  const map = read();
  map[id] = Math.max(0, Number(count || 0));
  write(map);
  return map[id];
}

export function getAllFavorites() {
  const map = read();
  return Object.entries(map)
    .map(([id, count]) => ({ id, count }))
    .sort((a, b) => b.count - a.count);
}

export function clearFavorites() {
  localStorage.removeItem(KEY);
}
