// Announcements list: published ones for everyone; admins also see drafts.
$(function () {
  if (!Guard.requireAuth()) return;              // PAGE-LEVEL GUARD
  UI.showFlash(); Navbar.mount(); Footer.mount();

  const E = Utils.esc, admin = Auth.isAdmin(), $grid = $("#grid");
  let items = [];

  async function load() {
    $grid.html(UI.skeletonCards(3));
    try {
      const d = (await Api.get("/announcements")).data;
      items = Array.isArray(d) ? d : (d && d.items) || [];
      render();
    } catch (e) { $grid.html(UI.error(e.message)); }
  }

  function card(a) {
    return `<article class="card flex flex-col p-5">
      <p class="text-xs font-semibold uppercase tracking-wider text-burgundy">${E(Utils.fmtDate(a.created_at))}
        ${a.published === false ? '<span class="ml-2 rounded bg-amber-700 px-2 py-0.5 text-white">Draft</span>' : ""}</p>
      <h2 class="mt-1 flex-1 text-lg font-semibold">${E(a.title)}</h2>
      <p class="mt-1 text-sm text-ink-soft">Length: ${Utils.fmtDuration(a.duration_seconds)}</p>
      <div class="mt-4 flex flex-wrap gap-2">
        <a class="btn-primary" href="detail.html?id=${E(a.id)}" aria-label="Play ${E(a.title)}">&#9654; Play</a>
        <button data-role="admin" type="button" class="btn-outline" data-toggle="${E(a.id)}" data-pub="${a.published !== false}">${a.published === false ? "Publish" : "Unpublish"}</button>
        <button data-role="admin" type="button" class="btn-outline" data-del="${E(a.id)}">Delete</button>
      </div></article>`;
  }

  function render() {
    const shown = items.filter(a => admin || a.published !== false);   // normal users: published only
    $grid.html(shown.length ? shown.map(card).join("") : UI.empty("No announcements yet."));
    Guard.applyRoleUI(document.getElementById("main"));   // ELEMENT-LEVEL GUARD: strips admin buttons for users
  }

  $grid.on("click", "[data-retry]", load);

  $grid.on("click", "[data-toggle]", async function () {
    const id = String($(this).data("toggle")), pub = $(this).attr("data-pub") === "true";
    $(this).prop("disabled", true);
    try {
      await Api.patch("/announcements/" + id + "/" + (pub ? "unpublish" : "publish"));
      items.find(a => String(a.id) === id).published = !pub;
      UI.toast(pub ? "Announcement unpublished." : "Announcement published.", "success");
      render();
    } catch (e) { UI.toast(e.message, "error"); $(this).prop("disabled", false); }
  });

  $grid.on("click", "[data-del]", async function () {
    const id = String($(this).data("del"));
    if (!await UI.confirm("Delete this announcement?")) return;
    try {
      await Api.del("/announcements/" + id);
      items = items.filter(a => String(a.id) !== id);
      UI.toast("Announcement deleted.", "success"); render();
    } catch (e) { UI.toast(e.message, "error"); }
  });

  load();
});