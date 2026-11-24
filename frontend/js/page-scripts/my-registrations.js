// Show the signed-in user's active event registrations and allow cancellation.
$(function () {
  if (!Guard.requireRole("user")) return;
  UI.showFlash(); Navbar.mount(); Footer.mount();

  const E = Utils.esc, $list = $("#registrations"), $summary = $("#results-summary");
  let registrations = [];
  const getEventId = registration => String(registration.event_id);

  function render() {
    const active = registrations
      .filter(registration => registration.status === "registered")
      .sort((a, b) => new Date(a.starts_at) - new Date(b.starts_at));
    $summary.text(active.length
      ? `${active.length} active registration${active.length === 1 ? "" : "s"}.`
      : "You have no active event registrations.");
    $list.html(active.length ? active.map(registration => {
      const eventId = getEventId(registration);
      const startsAt = registration.starts_at ? new Date(registration.starts_at) : null;
      const isPast = startsAt && startsAt < new Date();
      return `<article class="card flex flex-col overflow-hidden">
        <div aria-hidden="true" class="h-36 bg-gradient-to-br from-burgundy to-navy"></div>
        <div class="flex flex-1 flex-col p-5">
          <p class="text-xs font-semibold uppercase tracking-wider text-burgundy">${E(Utils.fmtDate(registration.starts_at))}
            ${isPast ? '<span class="ml-2 rounded bg-line px-2 py-0.5 text-ink-soft">Past event</span>' : ""}
          </p>
          <h2 class="mt-1 text-lg font-semibold">${E(registration.title || "Event")}</h2>
          <p class="mt-1 text-sm text-ink-soft">${E(registration.location || "Location to be announced")}</p>
          <div class="mt-auto flex flex-wrap gap-2 pt-4">
            <a class="btn-primary" href="events/detail.html?id=${encodeURIComponent(eventId)}">View event</a>
            <button type="button" class="btn-outline" data-cancel="${E(eventId)}">Cancel registration</button>
          </div>
        </div>
      </article>`;
    }).join("") : `<div class="col-span-full py-10 text-center">
      <p class="text-ink-soft">When you register for an event, it will appear here.</p>
      <a href="events/list.html" class="btn-primary mt-4 inline-flex">Browse events</a>
    </div>`);
  }

  async function load() {
    $list.html(UI.skeletonCards(3));
    $summary.text("Loading registrations…");
    try {
      const data = (await Api.get("/event-registrations/my-registrations")).data;
      registrations = Array.isArray(data) ? data : (data && (data.items || data.registrations)) || [];
      render();
    } catch (e) {
      $summary.empty();
      $list.html(UI.error(e.message));
    }
  }

  $list.on("click", "[data-retry]", load);
  $list.on("click", "[data-cancel]", async function () {
    const $button = $(this), eventId = String($button.data("cancel"));
    $button.prop("disabled", true);
    try {
      await Api.post("/event-registrations/cancel", { event_id: eventId });
      registrations = registrations.map(registration =>
        getEventId(registration) === eventId ? { ...registration, status: "cancelled" } : registration
      );
      UI.toast("Registration cancelled.", "success");
      render();
    } catch (e) {
      UI.toast(e.message, "error");
      $button.prop("disabled", false);
    }
  });

  load();
});