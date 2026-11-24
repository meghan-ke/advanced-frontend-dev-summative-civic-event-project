// Event detail: full info, register/cancel, feedback, and (admin only) the registrants list.
$(function () {
  if (!Guard.requireAuth()) return;               // PAGE-LEVEL GUARD
  Navbar.mount(); Footer.mount();

  const E = Utils.esc, id = Utils.param("id"), admin = Auth.isAdmin();
  if (!id) return location.replace(Config.page("errors/404.html"));
  const $d = $("#detail");
  let registered = false;
  const list = x => Array.isArray(x) ? x : (x && (x.items || x.feedback || x.registrations || x.attendees)) || [];

  function view(ev) {
    const img = Utils.eventImage(ev);
    const map = "https://www.google.com/maps/search/?api=1&query=" + encodeURIComponent(ev.location || "");
    const row = (k, v) => `<div><dt class="font-semibold text-burgundy">${k}</dt><dd>${v}</dd></div>`;
    return `
    <div class="panel">
      <div class="grid gap-8 lg:grid-cols-3">
        <div class="lg:col-span-2">
          ${img ? `<img src="${E(img)}" alt="${E(ev.title)}" class="mb-6 max-h-96 w-full rounded-2xl object-cover">`
            : '<div aria-hidden="true" class="mb-6 h-56 rounded-2xl bg-gradient-to-br from-burgundy to-navy sm:h-72"></div>'}
          <h1 class="page-title">${E(ev.title)}</h1>
          <p class="whitespace-pre-line">${E(ev.description)}</p>
        </div>
        <aside class="card h-fit space-y-4 p-5" aria-label="Event details">
          <dl class="space-y-3 text-sm">
            ${row("Starts", E(Utils.fmtDate(ev.starts_at)))}
            ${row("Ends", E(Utils.fmtDate(ev.ends_at)))}
            ${row("Location", E(ev.location) + ` <a class="text-burgundy underline" target="_blank" rel="noopener" href="${map}">Map</a>`)}
          </dl>
          <button data-role="user" id="reg-btn" type="button" class="btn-primary w-full"></button>
          <div data-role="admin" class="flex gap-2">
            <a class="btn-outline flex-1" href="form.html?id=${E(ev.id)}">Edit</a>
            <button id="del-btn" type="button" class="btn-outline flex-1">Delete</button>
          </div>
        </aside>
      </div>
    </div>

    <section class="panel mt-6" aria-labelledby="fb-title">
      <h2 id="fb-title" class="page-title">Feedback</h2>
      <div id="fb-summary" class="mb-4"></div>
      <div id="fb-list" class="mb-8 space-y-3"></div>
      <div data-role="user" id="fb-form-wrap"></div>
    </section>

    <section data-role="admin" class="panel mt-6" aria-labelledby="att-title">
      <h2 id="att-title" class="page-title">Registrants</h2>
      <div id="attendees"></div>
    </section>`;
  }

  async function load() {
    $d.html('<div class="panel h-96 animate-pulse"></div>');
    try {
      const ev = (await Api.get("/events/" + id)).data;
      if (!admin && ev.published === false) return location.replace(Config.page("errors/404.html"));
      if (!admin) {
        const regs = await Api.get("/event-registrations/my-registrations");
        registered = list(regs && regs.data).some(r => r.status !== "cancelled" && String(r.event_id ?? r.id) === String(id));
      }
      $d.html(view(ev));
      Guard.applyRoleUI(document.getElementById("main"));   // ELEMENT-LEVEL GUARD
      setReg(); bind(); loadFeedback();
      if (admin) loadAttendees();
    } catch (e) {
      if (e.status === 404) return location.replace(Config.page("errors/404.html"));
      $d.html('<div class="panel">' + UI.error(e.message) + "</div>");
    }
  }

  function setReg() {
    $("#reg-btn").text(registered ? "Cancel registration" : "Register")
      .toggleClass("btn-outline", registered).toggleClass("btn-primary", !registered);
  }

  function bind() {
    $("#reg-btn").on("click", async function () {
      const $b = $(this).prop("disabled", true);
      try {
        await Api.post("/event-registrations/" + (registered ? "cancel" : "register"), { event_id: id });
        registered = !registered; setReg();
        UI.toast(registered ? "You're registered!" : "Registration cancelled.", "success");
      } catch (e) { UI.toast(e.message, "error"); }
      $b.prop("disabled", false);
    });
    $("#del-btn").on("click", async () => {
      if (!await UI.confirm("Delete this event? This cannot be undone.")) return;
      try {
        await Api.del("/events/" + id);
        Store.setFlash("Event deleted.", "success");
        location.href = Config.page("events/list.html");
      } catch (e) { UI.toast(e.message, "error"); }
    });
  }

  function fbForm(mine) {
    const radios = [1, 2, 3, 4, 5].map(n => `<label class="cursor-pointer"><input class="peer sr-only" type="radio" name="rating" value="${n}" ${mine && Number(mine.rating) === n ? "checked" : ""}>
      <span class="flex h-11 w-11 items-center justify-center rounded-full border-2 border-burgundy font-semibold text-burgundy peer-checked:bg-burgundy peer-checked:text-white peer-focus-visible:ring-2 peer-focus-visible:ring-gold">${n}</span></label>`).join("");
    return `<form id="fb-form" novalidate class="max-w-lg space-y-4">
      <h3 class="text-lg font-semibold">${mine ? "Your feedback" : "Leave feedback"}</h3>
      <fieldset><legend class="mb-1 text-sm font-medium">Rating (1 to 5)</legend><div class="flex gap-2">${radios}</div></fieldset>
      <div><label for="fb-comment" class="mb-1 block text-sm font-medium">Comment</label>
        <textarea id="fb-comment" rows="3" maxlength="500" class="input h-auto py-2">${E(mine ? mine.comment : "")}</textarea></div>
      <button type="submit" class="btn-primary">${mine ? "Update feedback" : "Submit feedback"}</button></form>`;
  }

  // Backend rule: only admins may list all feedback for an event. Users see their own review.
  async function loadFeedback() {
    const $s = $("#fb-summary"), $l = $("#fb-list");
    if (admin) {
      try {
        const all = list((await Api.get("/event-feedback/event/" + id)).data);
        const avg = all.length ? all.reduce((s, f) => s + Number(f.rating || 0), 0) / all.length : 0;
        $s.html(all.length
          ? `<p><span class="font-display text-4xl text-burgundy">${avg.toFixed(1)}</span> / 5 <span class="text-sm text-ink-soft">(${all.length} review${all.length === 1 ? "" : "s"})</span></p>`
          : '<p class="text-ink-soft">No feedback yet.</p>');
        $l.html(all.map(f => `<article class="card p-4">
          <p class="font-semibold">${E(f.full_name || f.user_name || "Attendee")} <span class="text-burgundy" aria-hidden="true">${"★".repeat(Number(f.rating) || 0)}</span><span class="sr-only"> ${E(f.rating)} out of 5</span></p>
          <p class="text-sm">${E(f.comment)}</p></article>`).join(""));
      } catch (e) {
        $s.html(`<div role="alert" class="rounded-lg border border-red-700 bg-red-50 px-4 py-3 text-sm text-red-700">
          <p>${E(e.message)}</p><button type="button" data-retry-feedback class="mt-3 underline">Try feedback again</button>
        </div>`);
        $l.empty();
      }
      return;
    }
    let mine = null;
    try {
      mine = list((await Api.get("/event-feedback/my-feedback")).data).find(f => String(f.event_id) === String(id)) || null;
    } catch (e) {
      $s.html(`<div role="alert" class="rounded-lg border border-red-700 bg-red-50 px-4 py-3 text-sm text-red-700">
        <p>${E(e.message)}</p><button type="button" data-retry-feedback class="mt-3 underline">Try feedback again</button>
      </div>`);
      $l.empty(); $("#fb-form-wrap").empty();
      return;
    }
    $s.html(mine
      ? `<p>Your rating: <span class="text-burgundy" aria-hidden="true">${"★".repeat(Number(mine.rating) || 0)}</span><span class="sr-only">${E(mine.rating)} out of 5</span></p>`
      : '<p class="text-ink-soft">You have not reviewed this event yet. Average ratings are visible to administrators.</p>');
    $("#fb-form-wrap").html(fbForm(mine));
    $("#fb-form").on("submit", e => submitFeedback(e, mine));
  }

  async function submitFeedback(e, mine) {
    e.preventDefault();
    const $f = $(e.currentTarget), $btn = $f.find("button[type=submit]");
    const rating = Number($f.find("[name=rating]:checked").val()), comment = $("#fb-comment").val().trim();
    if (!rating) return UI.toast("Choose a rating from 1 to 5.", "error");
    UI.btnLoading($btn, true, "Saving…");
    try {
      await (mine ? Api.put("/event-feedback/" + mine.id, { rating, comment })
                  : Api.post("/event-feedback", { event_id: id, rating, comment }));
      UI.toast("Thanks for your feedback!", "success");
      loadFeedback();
    } catch (err) {
      UI.toast(err.message, "error");
      UI.btnLoading($btn, false);
    }
  }

  async function loadAttendees() {
    const $a = $("#attendees");
    try {
      const rows = list((await Api.get("/event-registrations/event/" + id + "/attendees")).data);
      $a.html(rows.length ? `<div class="overflow-x-auto"><table class="w-full text-left text-sm">
        <thead><tr class="border-b border-burgundy"><th scope="col" class="py-2 pr-4">Name</th><th scope="col" class="py-2 pr-4">Email</th><th scope="col" class="py-2">Registered</th></tr></thead>
        <tbody>${rows.map(r => `<tr class="border-b border-line"><td class="py-2 pr-4">${E(r.full_name || r.name)}</td><td class="py-2 pr-4">${E(r.email)}</td><td class="py-2">${E(Utils.fmtDate(r.created_at))}</td></tr>`).join("")}</tbody></table></div>`
        : '<p class="text-ink-soft">No registrations yet.</p>');
    } catch (e) { $a.html(UI.error(e.message)); }
  }

  $d.on("click", "[data-retry]", load);
  $d.on("click", "[data-retry-feedback]", loadFeedback);
  load();
});