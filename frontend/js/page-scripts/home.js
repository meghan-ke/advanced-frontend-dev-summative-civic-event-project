// Home page. PUBLIC: no page guard, because logged-out visitors see the landing content.
// ELEMENT-LEVEL GUARD: Guard.applyRoleUI() removes the guest-only or user-only blocks (data-auth) for the current visitor.
$(function () {
  UI.showFlash(); Navbar.mount(); Footer.mount();
  Guard.applyRoleUI(document.getElementById("main"));
  if (!Auth.isLoggedIn()) return;            // nothing more to load for visitors: the API needs a token

  const E = Utils.esc, $grid = $("#grid");

  async function load() {
    $grid.html(UI.skeletonCards(3));
    try {
      const d = (await Api.get("/events")).data;
      const all = (Array.isArray(d) ? d : (d && d.items) || [])
        .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
      const upcoming = all.filter(e => new Date(e.starts_at) >= new Date());
      const next = (upcoming.length ? upcoming : all.slice(-3)).slice(0, 3);

      $grid.html(next.length ? next.map(card).join("") : UI.empty("No events yet. Check back soon."));

      // Photo strip and hero tile come from real event images
      const imgs = all.map(Utils.eventImage).filter(Boolean);
      if (imgs.length) {
        $("#hero-tile").css({ "background-image": `url("${imgs[0]}")`, "background-size": "cover", "background-position": "center" });
        const heights = ["h-32", "h-40", "h-48", "h-36", "h-44"];
        $("#strip").removeClass("hidden").addClass("flex").html(imgs.slice(0, 5).map((src, i) =>
          `<img src="${E(src)}" alt="" loading="lazy" class="${heights[i]} w-48 shrink-0 rounded-md object-cover">`).join(""));
      }
    } catch (e) { $grid.html(UI.error(e.message)); }
  }

  function card(ev) {
    const img = Utils.eventImage(ev), desc = ev.description || "";
    return `<article class="card flex flex-col">
      ${img ? `<img src="${E(img)}" alt="${E(ev.title)}" loading="lazy" class="h-44 w-full object-cover">`
            : '<div aria-hidden="true" class="h-44 bg-gradient-to-br from-burgundy to-navy"></div>'}
      <div class="flex flex-1 flex-col p-5">
        <p class="text-xs font-semibold uppercase tracking-wider text-burgundy">${E(Utils.fmtDate(ev.starts_at))}</p>
        <h3 class="mt-1 text-lg font-semibold">${E(ev.title)}</h3>
        <p class="mt-1 text-sm text-ink-soft">${E(ev.location)}</p>
        <p class="mt-2 flex-1 text-sm">${E(desc.slice(0, 100))}${desc.length > 100 ? "…" : ""}</p>
        <a class="btn-primary mt-4 self-start" href="pages/events/detail.html?id=${E(ev.id)}">View event</a>
      </div></article>`;
  }

  $grid.on("click", "[data-retry]", load);
  load();
});