// Admin overview and shortcuts for creating and managing community content.
$(function () {
  if (!Guard.requireRole("admin")) return;
  UI.showFlash(); Navbar.mount(); Footer.mount();

  const E = Utils.esc, $stats = $("#stats"), $error = $("#stats-error"), $chart = $("#growth-chart");
  const number = value => {
    const parsed = Number(value);
    return Number.isFinite(parsed) ? parsed.toLocaleString() : "0";
  };

  function statCard(label, value, note, color) {
    return `<article class="card border-t-4 ${color} p-5">
      <p class="text-sm font-semibold text-ink-soft">${E(label)}</p>
      <p class="mt-2 font-display text-4xl text-ink">${number(value)}</p>
      <p class="mt-1 text-xs text-ink-soft">${E(note)}</p>
    </article>`;
  }

  function renderGrowth(rows) {
    if (!Array.isArray(rows) || !rows.length) {
      $chart.html('<p class="text-sm text-ink-soft">No user growth data is available yet.</p>');
      return;
    }

    const max = Math.max(1, ...rows.map(row => Number(row.new_users) || 0));
    $chart.html(`<div class="space-y-4">${rows.map(row => {
      const count = Number(row.new_users) || 0;
      const width = Math.max(count > 0 ? 2 : 0, count / max * 100);
      const monthDate = new Date(String(row.month) + "-01T00:00:00");
      const label = Number.isNaN(monthDate.getTime())
        ? String(row.month)
        : monthDate.toLocaleDateString(undefined, { month: "short", year: "numeric" });
      return `<div class="grid grid-cols-[5.5rem_minmax(0,1fr)_2.5rem] items-center gap-3">
        <span class="text-sm text-ink-soft">${E(label)}</span>
        <div class="h-4 overflow-hidden rounded-full bg-line" role="img" aria-label="${E(label)}: ${number(count)} new users">
          <div class="h-full rounded-full bg-burgundy" style="width:${width}%"></div>
        </div>
        <span class="text-right text-sm font-semibold">${number(count)}</span>
      </div>`;
    }).join("")}</div>`);
  }

  function render(data) {
    const users = data.users || {}, events = data.events || {};
    const registrations = data.registrations || {}, feedbacks = data.feedbacks || {};
    const promos = data.promos || {}, announcements = data.announcements || {};
    const notifications = data.notifications || {};

    $stats.html([
      statCard("Total users", users.total_users, `${number(users.active_users)} active · ${number(users.inactive_users)} disabled`, "border-burgundy"),
      statCard("Events", events.total_events, `${number(events.upcoming_events)} upcoming · ${number(events.past_events)} past`, "border-gold"),
      statCard("Registrations", registrations.total_registrations, "All event registrations", "border-sky-700"),
      statCard("Feedback", feedbacks.total_feedback, "Reviews submitted", "border-green-700"),
      statCard("Promos", promos.total_promos, "Video promotions", "border-violet-700"),
      statCard("Announcements", announcements.total_announcements, "Audio updates", "border-amber-700"),
      statCard("Notifications", notifications.total_notifications, "All notification records", "border-cyan-700"),
    ].join(""));
    renderGrowth(data.user_growth);
  }

  async function load() {
    $error.addClass("hidden").empty();
    $stats.html(Array.from({ length: 6 }, () =>
      '<article class="card animate-pulse p-5"><div class="h-3 w-1/2 rounded bg-line"></div><div class="mt-4 h-8 w-1/3 rounded bg-line"></div></article>'
    ).join(""));
    $chart.html('<div class="h-28 animate-pulse rounded-xl bg-line"></div>');
    try {
      const data = (await Api.get("/dashboard/admin")).data;
      render(data);
    } catch (e) {
      $stats.empty();
      $chart.empty();
      $error.html(UI.error(e.message)).removeClass("hidden");
    }
  }

  $("#refresh-dashboard").on("click", load);
  $error.on("click", "[data-retry]", load);
  load();
});