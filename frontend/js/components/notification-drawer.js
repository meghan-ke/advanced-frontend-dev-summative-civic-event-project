// In-app notifications drawer (GET /api/notifications).

const NotificationDrawer = (() => {
  const E = Utils.esc;
  let items = [], loaded = false, err = null;
  let built = false, isOpen = false, detailOpen = false, lastFocus = null, timer = null, polling = null;
  const uid = () => (Auth.user() || {}).id;

  const meta = n => {
    let m = n.metadata;
    if (typeof m === "string") { try { m = JSON.parse(m); } catch { m = null; } }
    return m || {};
  };
  // Link to the related resource using the notification's metadata (event_id, announcement_id, promo_id)
  const related = n => {
    const m = meta(n);
    if (m.event_id) return { label: "View event", href: Config.page("events/detail.html?id=" + encodeURIComponent(m.event_id)) };
    if (m.announcement_id) return { label: "Listen to announcement", href: Config.page("announcements/detail.html?id=" + encodeURIComponent(m.announcement_id)) };
    if (m.promo_id) return { label: "Watch promo", href: Config.page("promos/detail.html?id=" + encodeURIComponent(m.promo_id)) };
    return null;
  };
  const unread = () => { const seen = Store.seenIds(uid()); return items.filter(n => !seen.has(n.id)); };
  const updateCount = () => Navbar.setCount(unread().length);

  // Optimistic: the badge drops straight away (state is local, so there is nothing to roll back)
  function markSeen(ids) { Store.markSeen(uid(), ids); updateCount(); }

  function build() {
    if (built) return;
    built = true;
    $("body").append(`
      <div id="drawer-overlay" class="fixed inset-0 z-40 hidden bg-black/50"></div>
      <aside id="drawer" role="dialog" aria-modal="true" aria-labelledby="drawer-title" tabindex="-1"
        class="invisible fixed right-0 top-0 z-50 flex h-full w-full max-w-md translate-x-full flex-col bg-cream text-ink shadow-2xl transition-transform duration-300 motion-reduce:transition-none">
        <div class="flex items-center justify-between gap-2 border-b border-burgundy px-5 py-4">
          <h2 id="drawer-title" class="font-display text-3xl uppercase text-burgundy">Notifications</h2>
          <div class="flex items-center gap-2">
            <button id="drawer-readall" type="button" class="text-sm font-semibold text-burgundy underline">Mark all read</button>
            <button id="drawer-close" type="button" aria-label="Close notifications" class="h-11 w-11 rounded-full text-2xl leading-none text-burgundy hover:bg-white">&times;</button>
          </div>
        </div>
        <div id="drawer-body" class="flex-1 overflow-y-auto px-5 py-4"></div>
        <div class="border-t border-line px-5 py-3 text-sm">
          <a href="${Config.page("notifications.html")}" class="font-semibold text-burgundy underline">View all notifications</a>
        </div>
      </aside>`);
      

    $("#drawer-overlay, #drawer-close").on("click", close);
    $("#drawer-readall").on("click", () => { markSeen(items.map(n => n.id)); renderList(); });
    $("#drawer-body")
      .on("click", "[data-id]", e => showDetail($(e.currentTarget).data("id")))
      .on("click", "#drawer-back", () => { renderList(); $("#drawer-close").trigger("focus"); })
      .on("click", "[data-retry]", () => { err = null; renderList(); refresh(); });

    // Esc closes; Tab and Shift+Tab stay inside the drawer
    $(document).on("keydown", e => {
      if (!isOpen) return;
      if (e.key === "Escape") return close();
      if (e.key !== "Tab") return;
      const f = $("#drawer").find("a[href], button:not([disabled])").filter(":visible").toArray();
      if (!f.length) return;
      const first = f[0], last = f[f.length - 1];
      if (e.shiftKey && document.activeElement === first) { e.preventDefault(); last.focus(); }
      else if (!e.shiftKey && document.activeElement === last) { e.preventDefault(); first.focus(); }
    });
  }

  function renderList() {
    detailOpen = false;
    const $b = $("#drawer-body");
    if (!loaded && !err) return $b.html(Array(3).fill('<div class="mb-3 h-20 animate-pulse rounded-xl bg-line"></div>').join(""));
    if (!loaded && err) return $b.html(UI.error(err));
    if (!items.length) return $b.html(UI.empty("You have no notifications."));
    const seen = Store.seenIds(uid());
    const sorted = items.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    $b.html('<ul class="space-y-3">' + sorted.map(n => {
      const isNew = !seen.has(n.id);
      return `<li><button type="button" data-id="${E(n.id)}"
          class="flex w-full gap-3 rounded-xl bg-white p-4 text-left shadow hover:shadow-md focus-visible:outline focus-visible:outline-2 focus-visible:outline-burgundy">
          <span aria-hidden="true" class="mt-1.5 h-2.5 w-2.5 shrink-0 rounded-full ${isNew ? "bg-burgundy" : "bg-transparent"}"></span>
          <span class="min-w-0">
            ${isNew ? '<span class="sr-only">Unread: </span>' : ""}
            <span class="block ${isNew ? "font-semibold" : "font-medium"}">${E(n.title || "Notification")}</span>
            <span class="block truncate text-sm text-ink-soft">${E(n.message)}</span>
            <span class="mt-1 block text-xs text-ink-soft">${E(Utils.fmtDate(n.created_at))}</span>
          </span></button></li>`;
    }).join("") + "</ul>");
  }

  function showDetail(id) {
    const n = items.find(x => String(x.id) === String(id));
    if (!n) return;
    detailOpen = true;
    markSeen([n.id]);
    const link = related(n);
    $("#drawer-body").html(`
      <button type="button" id="drawer-back" class="mb-4 text-sm font-semibold text-burgundy underline">&larr; Back to all</button>
      <article class="card p-5">
        <p class="text-xs font-semibold uppercase tracking-wider text-burgundy">${E(n.type || "Notice")}</p>
        <h3 class="mt-1 text-xl font-semibold">${E(n.title || "Notification")}</h3>
        <p class="mt-1 text-sm text-ink-soft">${E(Utils.fmtDate(n.created_at))}</p>
        <p class="mt-4 whitespace-pre-line">${E(n.message)}</p>
        ${link ? `<a href="${E(link.href)}" class="btn-primary mt-5">${link.label}</a>` : ""}
      </article>`);
    $("#drawer-back").trigger("focus");
  }

  async function refresh() {
    try {
      const d = (await Api.get("/notifications")).data;
      items = Array.isArray(d) ? d : (d && (d.items || d.notifications)) || [];
      loaded = true; err = null;
    } catch (e) { if (!loaded) err = e.message; }
    updateCount();
    if (isOpen && !detailOpen) renderList();
  }

  function open() {
    build();
    clearTimeout(timer);
    lastFocus = document.activeElement;
    isOpen = true;
    $("#drawer-overlay").removeClass("hidden");
    $("#drawer").removeClass("invisible")[0].offsetWidth;   // force a reflow so the slide-in animates
    $("#drawer").removeClass("translate-x-full");
    $("#bell").attr("aria-expanded", "true");
    renderList();
    $("#drawer-close").trigger("focus");
    refresh();
  }

  function close() {
    isOpen = false;
    $("#drawer").addClass("translate-x-full");
    $("#drawer-overlay").addClass("hidden");
    $("#bell").attr("aria-expanded", "false");
    timer = setTimeout(() => $("#drawer").addClass("invisible"), 300);
    if (lastFocus) lastFocus.focus();
  }

  return {
    open, close,
    init() {                    
      build();
      refresh();
      if (!polling) polling = setInterval(refresh, 60000);
    },
  };
})();