// Admin user directory.
$(function () {
  if (!Guard.requireRole("admin")) return;
  UI.showFlash(); Navbar.mount(); Footer.mount();

  const E = Utils.esc, PER_PAGE = 10;
  const $body = $("#users-body"), $count = $("#user-count"), $error = $("#users-error");
  let users = [], page = 1;

  function filteredUsers() {
    const query = $("#user-search").val().trim().toLowerCase();
    return users.filter(user =>
      !query || [user.full_name, user.email].some(value => String(value || "").toLowerCase().includes(query))
    );
  }

  function render() {
    const shown = filteredUsers();
    const pages = Math.max(1, Math.ceil(shown.length / PER_PAGE));
    page = Math.min(page, pages);
    const pageUsers = shown.slice((page - 1) * PER_PAGE, page * PER_PAGE);
    $count.text(`${shown.length} user${shown.length === 1 ? "" : "s"}`);
    $body.html(pageUsers.length ? pageUsers.map(user => `<tr class="border-b border-line">
      <td class="py-3 pr-4 font-medium">${E(user.full_name)}</td>
      <td class="py-3 pr-4">${E(user.email)}</td>
      <td class="py-3 pr-4 capitalize">${E(user.role)}</td>
      <td class="py-3 pr-4"><span class="${user.is_active ? "text-green-700" : "text-red-700"}">${user.is_active ? "Active" : "Disabled"}</span></td>
      <td class="py-3"><div class="flex flex-wrap gap-2">
        <button type="button" class="btn-outline" data-view="${E(user.id)}">View</button>
        <button type="button" class="btn-outline" data-status="${E(user.id)}" data-active="${user.is_active}">${user.is_active ? "Disable" : "Enable"}</button>
      </div></td>
    </tr>`).join("") : '<tr><td colspan="5" class="py-8 text-center text-ink-soft">No users match your search.</td></tr>');
    Pagination.render($("#users-pager"), page, pages, nextPage => {
      page = nextPage;
      render();
    });
  }

  async function load() {
    $error.addClass("hidden").empty();
    $body.html('<tr><td colspan="5" class="py-8 text-center text-ink-soft">Loading users…</td></tr>');
    try {
      const response = await Api.get("/users?page=1&limit=1000");
      users = Array.isArray(response.data) ? response.data : (response.data && response.data.users) || [];
      render();
    } catch (e) {
      $body.empty(); $("#users-pager").empty(); $count.empty();
      $error.html(UI.error(e.message)).removeClass("hidden");
    }
  }

  $("#user-search").on("input", () => { page = 1; render(); });
  $error.on("click", "[data-retry]", load);

  $body.on("click", "[data-view]", async function () {
    const id = String($(this).data("view")), $panel = $("#user-detail");
    $panel.data("user-id", id);
    $panel.removeClass("hidden").html('<div class="h-24 animate-pulse rounded bg-line"></div>');
    try {
      const user = (await Api.get("/users/" + encodeURIComponent(id))).data;
      $panel.html(`<div class="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h2 id="user-detail-title" class="page-title">${E(user.full_name)}</h2>
          <dl class="mt-4 grid gap-3 sm:grid-cols-2">
            <div><dt class="text-sm font-semibold text-ink-soft">Email</dt><dd>${E(user.email)}</dd></div>
            <div><dt class="text-sm font-semibold text-ink-soft">Role</dt><dd class="capitalize">${E(user.role)}</dd></div>
            <div><dt class="text-sm font-semibold text-ink-soft">Status</dt><dd>${user.is_active ? "Active" : "Disabled"}</dd></div>
            <div><dt class="text-sm font-semibold text-ink-soft">Joined</dt><dd>${E(Utils.fmtDate(user.created_at))}</dd></div>
          </dl>
        </div>
        <button type="button" class="btn-outline" data-close-detail>Close</button>
      </div>`);
      $panel[0].scrollIntoView({ behavior: "smooth", block: "nearest" });
    } catch (e) {
      $panel.html(UI.error(e.message));
    }
  });

  $("#user-detail").on("click", "[data-close-detail]", function () {
    $("#user-detail").addClass("hidden").empty();
  }).on("click", "[data-retry]", function () {
    const id = $("#user-detail").data("user-id");
    if (id) $("#users-body [data-view]").filter((_, button) => String($(button).data("view")) === String(id)).trigger("click");
  });

  $body.on("click", "[data-status]", async function () {
    const $button = $(this), id = String($button.data("status"));
    const active = $button.attr("data-active") === "true";
    $button.prop("disabled", true);
    try {
      const response = await Api.patch("/users/" + encodeURIComponent(id) + (active ? "/disable" : "/enable"));
      const updated = response.data;
      users = users.map(user => String(user.id) === id ? { ...user, ...updated } : user);
      UI.toast(active ? "User disabled." : "User enabled.", "success");
      render();
    } catch (e) {
      UI.toast(e.message, "error");
      $button.prop("disabled", false);
    }
  });

  load();
});