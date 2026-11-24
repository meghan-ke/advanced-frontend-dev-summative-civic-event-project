// Small helpers used on every page.
const Utils = {
  // Escape user content before putting it in HTML. This is our XSS defence, important because of localStorage.
  esc: s => String(s ?? "").replace(/[&<>"']/g, c => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c])),

  // Read a URL parameter, e.g. detail.html?id=123 -> Utils.param("id")
  param: name => new URLSearchParams(location.search).get(name),

  fmtDate: d => d ? new Date(d).toLocaleString([], { dateStyle: "medium", timeStyle: "short" }) : "",
  fmtDuration: s => { s = Math.round(Number(s) || 0); return Math.floor(s / 60) + ":" + String(s % 60).padStart(2, "0"); },

  // ISO date -> value for <input type="datetime-local">
  toLocalInput(d) {
    if (!d) return "";
    const x = new Date(d); x.setMinutes(x.getMinutes() - x.getTimezoneOffset());
    return x.toISOString().slice(0, 16);
  },

  // metadata can arrive as an object or as a JSON string
  meta(o) {
    let m = o && o.metadata;
    if (typeof m === "string") { try { m = JSON.parse(m); } catch { m = null; } }
    return m || {};
  },

  // Turns a stored value into a full URL. Full URLs pass through; filenames get <BASE_URL>/uploads/<folder>/
  mediaUrl(v, folder) {
    if (!v) return "";
    if (/^https?:/i.test(v)) return v;
    return Config.BASE_URL + (v.startsWith("/") ? v : "/uploads/" + folder + "/" + v);
  },
  eventImage(ev) { return Utils.mediaUrl(Utils.meta(ev).image_url || ev.image_url, "events"); },

  // Checks a File before upload. Returns an error message, or "" when fine.
  validateFile(file, types, maxMb) {
    if (!file) return "";
    if (!types.some(t => file.type.startsWith(t))) return "Wrong file type. Allowed: " + types.join(", ");
    if (file.size > maxMb * 1024 * 1024) return "File is too large. Maximum size is " + maxMb + " MB.";
    return "";
  },
};