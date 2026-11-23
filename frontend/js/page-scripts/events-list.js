// Events list: search/date/location filters, pagination, register/cancel, admin edit/delete.
$(function () {
  if (!Guard.requireAuth()) return;               // PAGE-LEVEL GUARD: logged-in users only
  UI.showFlash(); Navbar.mount(); Footer.mount();

  const E = Utils.esc, PER = Config.PAGE_SIZE, admin = Auth.isAdmin();
  const state = { all: [], regs: new Set(), page: 1, f: { q: Utils.param("q") || "", date: "", loc: "" } };
  const $grid = $("#grid");
  const list = x => Array.isArray(x) ? x : (x && (x.items || x.events || x.registrations)) || [];
  const regEventId = r => String(r.event_id ?? r.id);
  $("#f-q").val(state.f.q);

  async function load() {
    $grid.html(UI.skeletonCards(6));
    try {
      const calls = [Api.get("/events")];
      if (!admin) calls.push(Api.get("/event-registrations/my-registrations").catch(() => null));
      const [ev, regs] = await Promise.all(calls);
      state.all = list(ev.data);
      state.regs = new Set(list(regs && regs.data).filter(r => r.status !== "cancelled").map(regEventId));
      render();
    } catch (e) { $grid.html(UI.error(e.message)); }
  }

  function filtered() {
    const { q, date, loc } = state.f, ql = q.toLowerCase(), ll = loc.toLowerCase();
    return state.all
      .filter(ev => !ql || [ev.title, ev.description, ev.location].some(s => String(s || "").toLowerCase().includes(ql)))
      .filter(ev => !ll || String(ev.location || "").toLowerCase().includes(ll))
      .filter(ev => !date || (ev.starts_at && new Date(ev.starts_at).toLocaleDateString("en-CA") === date))
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
  }

  function card(ev) {
    const img = Utils.eventImage(ev), on = state.regs.has(String(ev.id)), desc = ev.description || "";
    return `<article class="card flex flex-col">
      ${img ? `<img src="${E(img)}" alt="${E(ev.title)}" loading="lazy" class="h-44 w-full object-cover">`
            : '<div aria-hidden="true" class="h-44 bg-gradient-to-br from-burgundy to-navy"></div>'}
      <div class="flex flex-1 flex-col p-5">
        <p class="text-xs font-semibold uppercase tracking-wider text-burgundy">${E(Utils.fmtDate(ev.starts_at))}</p>
        <h2 class="mt-1 text-lg font-semibold">${E(ev.title)}</h2>
        <p class="mt-1 text-sm text-ink-soft">${E(ev.location)}</p>
        <p class="mt-2 flex-1 text-sm">${E(desc.slice(0, 110))}${desc.length > 110 ? "…" : ""}</p>
        <div class="mt-4 flex flex-wrap gap-2">
          <a class="btn-primary" href="detail.html?id=${E(ev.id)}">View</a>
          <button data-role="user" type="button" class="btn-outline" data-reg="${E(ev.id)}" data-on="${on}">${on ? "Cancel registration" : "Register"}</button>
          <a data-role="admin" class="btn-outline" href="form.html?id=${E(ev.id)}">Edit</a>
          <button data-role="admin" type="button" class="btn-outline" data-del="${E(ev.id)}">Delete</button>
        </div></div></article>`;
  }

  function render() {
    const items = filtered(), pages = Math.max(1, Math.ceil(items.length / PER));
    state.page = Math.min(state.page, pages);
    const slice = items.slice((state.page - 1) * PER, state.page * PER);
    $grid.html(slice.length ? slice.map(card).join("") : UI.empty("No events match your search."));
    Guard.applyRoleUI(document.getElementById("main"));   // ELEMENT-LEVEL GUARD: strips Register/Edit/Delete by role
    Pagination.render($("#pager"), state.page, pages, p => { state.page = p; render(); window.scrollTo({ top: 0 }); });
  }

  $("#filters").on("submit", e => {
    e.preventDefault();
    state.f = { q: $("#f-q").val().trim(), date: $("#f-date").val(), loc: $("#f-loc").val().trim() };
    state.page = 1; render();
  });
  $("#f-reset").on("click", () => { $("#filters")[0].reset(); state.f = { q: "", date: "", loc: "" }; state.page = 1; render(); });
  $grid.on("click", "[data-retry]", load);

  // Register / cancel
  $grid.on("click", "[data-reg]", async function () {
    const $b = $(this), id = String($b.data("reg")), on = $b.attr("data-on") === "true";
    $b.prop("disabled", true);
    try {
      await Api.post("/event-registrations/" + (on ? "cancel" : "register"), { event_id: id });
      on ? state.regs.delete(id) : state.regs.add(id);
      UI.toast(on ? "Registration cancelled." : "You're registered!", "success");
      render();
    } catch (e) { UI.toast(e.message, "error"); $b.prop("disabled", false); }
  });

  // Delete (admin)
  $grid.on("click", "[data-del]", async function () {
    const id = String($(this).data("del"));
    if (!await UI.confirm("Delete this event? This cannot be undone.")) return;
    try {
      await Api.del("/events/" + id);
      state.all = state.all.filter(e => String(e.id) !== id);
      UI.toast("Event deleted.", "success"); render();
    } catch (e) { UI.toast(e.message, "error"); }
  });

  load();
});