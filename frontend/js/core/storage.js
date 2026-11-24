// The ONLY file that touches Web Storage.
// Default: sessionStorage (cleared when the tab closes).
// "Remember me": localStorage (persists, but is exposed to XSS, so we escape all rendered user content).
const Store = (() => {
  const MODE_KEY = "civic_store", TOKEN = "civic_token", USER = "civic_user";
  const active = () => localStorage.getItem(MODE_KEY) === "local" ? localStorage : sessionStorage;

  return {
    saveSession(token, user, remember) {
      this.clear();
      if (remember) localStorage.setItem(MODE_KEY, "local");
      active().setItem(TOKEN, token);
      active().setItem(USER, JSON.stringify(user));
    },
    getToken() { return active().getItem(TOKEN); },
    getUser() {
      try { return JSON.parse(active().getItem(USER)); } catch { return null; }
    },
    updateUser(user) {
      const updated = { ...(this.getUser() || {}), ...user };
      active().setItem(USER, JSON.stringify(updated));
      return updated;
    },

    // One-time message that survives a redirect (e.g. "Account created")
    setFlash(msg, type = "info") { sessionStorage.setItem("civic_flash", JSON.stringify({ msg, type })); },
    popFlash() {
      try { const f = JSON.parse(sessionStorage.getItem("civic_flash")); sessionStorage.removeItem("civic_flash"); return f; }
      catch { return null; }
    },

    // Which notifications this user has seen in this browser (the backend has no read endpoint)
    seenIds(userId) {
      try { return new Set(JSON.parse(localStorage.getItem("civic_seen_" + userId)) || []); }
      catch { return new Set(); }
    },
    markSeen(userId, ids) {
      const s = this.seenIds(userId);
      ids.forEach(i => s.add(i));
      localStorage.setItem("civic_seen_" + userId, JSON.stringify([...s]));
    },

    // List cache (events, promos) with a time limit
    cacheSet(key, data) {
      sessionStorage.setItem("cache_" + key, JSON.stringify({ t: Date.now(), data }));
    },
    cacheGet(key) {
      try {
        const c = JSON.parse(sessionStorage.getItem("cache_" + key));
        return c && Date.now() - c.t < Config.CACHE_TTL_MS ? c.data : null;
      } catch { return null; }
    },
    cacheClear(key) { sessionStorage.removeItem("cache_" + key); },

    // Logout: wipe the session and every cache entry
    clear() {
      [localStorage, sessionStorage].forEach(s => {
        s.removeItem(TOKEN); s.removeItem(USER);
        Object.keys(s).filter(k => k.startsWith("cache_")).forEach(k => s.removeItem(k));
      });
      localStorage.removeItem(MODE_KEY);
    },
  };
})();