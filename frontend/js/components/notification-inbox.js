// Shared notifications inbox used by the user and admin pages.
const NotificationInbox = (() => {
  const E = Utils.esc;
  let items = [], userId = null, $inbox = null;

  function related(n) {
    const meta = Utils.meta(n);
    if (meta.event_id) return { label: "View event", href: Config.page("events/detail.html?id=" + encodeURIComponent(meta.event_id)) };
    if (meta.announcement_id) return { label: "Listen to announcement", href: Config.page("announcements/detail.html?id=" + encodeURIComponent(meta.announcement_id)) };
    if (meta.promo_id) return { label: "Watch promo", href: Config.page("promos/detail.html?id=" + encodeURIComponent(meta.promo_id)) };
    return null;
  }

  function unseen() {
    const seen = Store.seenIds(userId);
    return items.filter(n => !seen.has(n.id));
  }

  function updateReadState() {
    const unreadCount = unseen().length;
    $("#unread-count").text(unreadCount
      ? unreadCount + (unreadCount === 1 ? " unread notification" : " unread notifications")
      : "You’re all caught up.");
    $("#mark-all-read").prop("disabled", unreadCount === 0);
    Navbar.setCount(unreadCount);
  }

  function renderList() {
    const seen = Store.seenIds(userId);
    const sorted = items.slice().sort((a, b) => new Date(b.created_at) - new Date(a.created_at));
    if (!sorted.length) {
      $inbox.html(UI.empty("You have no notifications."));
      updateReadState();
      return;
    }

    $inbox.html('<ul class="space-y-3">' + sorted.map(n => {
      const unread = !seen.has(n.id);
      return `<li><article class="card flex flex-col gap-4 p-4 sm:flex-row sm:items-start sm:justify-between">
        <button type="button" data-view="${E(n.id)}" class="min-w-0 flex-1 text-left focus-visible:outline focus-visible:outline-2 focus-visible:outline-burgundy">
          <span class="flex flex-wrap items-center gap-2">
            <span class="font-semibold">${E(n.title || "Notification")}</span>
            <span class="rounded-full bg-cream px-2 py-0.5 text-xs uppercase text-burgundy">${E(n.type || "notice")}</span>
            ${unread ? '<span class="rounded-full bg-burgundy px-2 py-0.5 text-xs text-white">Unread</span>' : ""}
          </span>
          <span class="mt-1 block text-sm text-ink-soft">${E(String(n.message || "").slice(0, 180))}${String(n.message || "").length > 180 ? "…" : ""}</span>
          <span class="mt-2 block text-xs text-ink-soft">${E(Utils.fmtDate(n.created_at))}</span>
        </button>
        <div class="flex shrink-0 gap-2">
          <button type="button" data-view="${E(n.id)}" class="btn-outline">View</button>
          <button data-role="admin" type="button" data-delete="${E(n.id)}" class="btn-outline">Delete</button>
        </div>
      </article></li>`;
    }).join("") + "</ul>");

    Guard.applyRoleUI(document.getElementById("main"));
    updateReadState();
  }

  function renderDetail(n) {
    Store.markSeen(userId, [n.id]);
    const link = related(n);
    $inbox.html(`<button type="button" data-back class="mb-4 text-sm font-semibold text-burgundy underline">&larr; Back to notifications</button>
      <article class="card p-5">
        <p class="text-xs font-semibold uppercase tracking-wider text-burgundy">${E(n.type || "Notice")}</p>
        <h2 class="mt-1 text-2xl font-semibold">${E(n.title || "Notification")}</h2>
        <p class="mt-1 text-sm text-ink-soft">${E(Utils.fmtDate(n.created_at))}</p>
        <p class="mt-4 whitespace-pre-line">${E(n.message || "")}</p>
        <div class="mt-5 flex flex-wrap gap-2">
          ${link ? `<a href="${E(link.href)}" class="btn-primary">${E(link.label)}</a>` : ""}
          <button data-role="admin" type="button" data-delete="${E(n.id)}" class="btn-outline">Delete</button>
        </div>
      </article>`);
    Guard.applyRoleUI(document.getElementById("main"));
    updateReadState();
  }

  async function load() {
    $inbox.html(UI.skeletonCards(3));
    try {
      const data = (await Api.get("/notifications")).data;
      items = Array.isArray(data) ? data : (data && (data.items || data.notifications)) || [];
      renderList();
    } catch (e) {
      $inbox.html(UI.error(e.message));
      $("#unread-count").empty();
      $("#mark-all-read").prop("disabled", true);
    }
  }

  function bind() {
    $inbox.off(".notificationInbox")
      .on("click.notificationInbox", "[data-view]", function () {
        const n = items.find(item => String(item.id) === String($(this).data("view")));
        if (n) renderDetail(n);
      })
      .on("click.notificationInbox", "[data-back]", renderList)
      .on("click.notificationInbox", "[data-retry]", load)
      .on("click.notificationInbox", "[data-delete]", async function () {
        const $button = $(this), id = String($button.data("delete"));
        if (!Auth.isAdmin()) return;
        if (!await UI.confirm("Delete this notification? This cannot be undone.")) return;
        $button.prop("disabled", true);
        try {
          await Api.del("/notifications/" + encodeURIComponent(id));
          items = items.filter(item => String(item.id) !== id);
          renderList();
          UI.toast("Notification deleted.", "success");
        } catch (e) {
          UI.toast(e.message, "error");
          $button.prop("disabled", false);
        }
      });

    $("#mark-all-read").off(".notificationInbox").on("click.notificationInbox", () => {
      Store.markSeen(userId, items.map(n => n.id));
      renderList();
      UI.toast("All notifications marked as read.", "success");
    });
  }

  return {
    mount() {
      userId = (Auth.user() || {}).id;
      $inbox = $("#inbox");
      bind();
      load();
    },
  };
})();
