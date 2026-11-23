// Shared top navigation. Every page calls Navbar.mount() after its auth guard.

const Navbar = (() => {
  const E = Utils.esc;
  const NAV = [
    ["Events", "events/list.html", "events"],
    ["Announcements", "announcements/list.html", "announcements"],
    ["Promos", "promos/list.html", "promos"],
  ];
  const current = folder => location.pathname.includes("/pages/" + folder + "/") ? ' aria-current="page"' : "";
  const initials = n => (n || "?").trim().split(/\s+/).map(w => w[0]).slice(0, 2).join("").toUpperCase();

  const links = cls => NAV.map(([label, href, folder]) =>
      `<a href="${Config.page(href)}" class="${cls}"${current(folder)}>${label}</a>`).join("") +
    `<a data-role="admin" href="${Config.page("admin/dashboard.html")}" class="${cls}"${current("admin")}>Admin</a>`;

  const searchForm = id => `
    <form class="search-form" role="search">
      <label for="${id}" class="sr-only">Search events</label>
      <input id="${id}" type="search" placeholder="Search events"
        class="h-11 w-full rounded-full border border-cream-text/40 bg-navy-dark px-4 text-cream-text placeholder:text-cream-text/70 focus:outline-none focus:ring-2 focus:ring-gold">
    </form>`;

  const ring = "focus-visible:outline focus-visible:outline-2 focus-visible:outline-gold";

  function html() {
    const u = Auth.user() || {};
    return `
    <header class="text-cream-text">
      <div class="mx-auto flex max-w-7xl items-center gap-3 px-4 py-4 sm:px-6">
        <a href="${Config.ROOT}index.html" class="font-display text-3xl tracking-widest ${ring}">CIVIC</a>
        <nav data-auth="user" aria-label="Main" class="ml-6 hidden items-center gap-6 lg:flex">${links("nav-link")}</nav>
        <div class="flex-1"></div>

        <div data-auth="user" class="hidden w-64 md:block">${searchForm("global-q")}</div>

        <div data-auth="guest" class="flex items-center gap-2">
          <a href="${Config.page("auth/login.html")}" class="nav-link px-3 py-2">Log in</a>
          <a href="${Config.page("auth/signup.html")}" class="btn bg-gold text-navy-dark hover:bg-white">Sign up</a>
        </div>

        <button data-auth="user" id="bell" type="button" aria-label="Notifications" aria-haspopup="dialog" aria-expanded="false"
          class="relative h-11 w-11 rounded-full border border-cream-text/40 hover:bg-white/10 ${ring}">
          <svg aria-hidden="true" class="mx-auto h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 9a6 6 0 0 1 12 0c0 7 3 8 3 8H3s3-1 3-8M10 21h4"/></svg>
          <span id="bell-count" aria-hidden="true" class="absolute -right-1 -top-1 hidden min-w-[1.25rem] rounded-full bg-gold px-1 text-xs font-bold text-navy-dark">0</span>
        </button>

        <div data-auth="user" class="relative">
          <button id="profile-btn" type="button" aria-haspopup="true" aria-expanded="false" aria-controls="profile-menu"
            class="flex h-11 items-center gap-2 rounded-full border border-cream-text/40 pl-1 pr-3 hover:bg-white/10 ${ring}">
            <span aria-hidden="true" class="flex h-9 w-9 items-center justify-center rounded-full bg-gold text-sm font-bold text-navy-dark">${E(initials(u.full_name))}</span>
            <span class="hidden max-w-[8rem] truncate text-sm sm:inline">${E(u.full_name)}</span>
          </button>
          <div id="profile-menu" class="absolute right-0 z-30 mt-2 hidden w-56 overflow-hidden rounded-xl bg-white py-1 text-ink shadow-xl">
            <p class="border-b border-line px-4 py-2 text-xs text-ink-soft">Signed in as <span class="font-semibold text-ink">${E(u.role)}</span></p>
            <a href="${Config.page("profile.html")}" class="block px-4 py-3 text-sm hover:bg-cream">My profile</a>
            <a data-role="user" href="${Config.page("my-registrations.html")}" class="block px-4 py-3 text-sm hover:bg-cream">My registrations</a>
            <a data-role="admin" href="${Config.page("admin/dashboard.html")}" class="block px-4 py-3 text-sm hover:bg-cream">Admin dashboard</a>
            <button id="logout-btn" type="button" class="block w-full px-4 py-3 text-left text-sm text-red-700 hover:bg-cream">Log out</button>
          </div>
        </div>

        <button data-auth="user" id="menu-toggle" type="button" aria-label="Menu" aria-expanded="false" aria-controls="mobile-menu"
          class="h-11 w-11 rounded-full border border-cream-text/40 hover:bg-white/10 lg:hidden ${ring}">
          <svg aria-hidden="true" class="mx-auto h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"><path d="M4 7h16M4 12h16M4 17h16"/></svg>
        </button>
      </div>

      <div id="mobile-menu" data-auth="user" class="hidden border-t border-cream-text/20 px-4 pb-4 lg:hidden">
        <div class="py-3 md:hidden">${searchForm("mobile-q")}</div>
        <nav aria-label="Mobile" class="flex flex-col">${links("nav-link block py-3")}</nav>
      </div>
    </header>`;
  }

  function bind() {
    $("#bell").on("click", () => { if (typeof NotificationDrawer !== "undefined") NotificationDrawer.open(); });

    // Profile dropdown: click toggles; outside click and Esc close it
    const $btn = $("#profile-btn"), $menu = $("#profile-menu");
    const setMenu = open => { $menu.toggleClass("hidden", !open); $btn.attr("aria-expanded", String(open)); };
    $btn.on("click", e => { e.stopPropagation(); setMenu($menu.hasClass("hidden")); });
    $(document).on("click", e => { if (!$(e.target).closest("#profile-menu, #profile-btn").length) setMenu(false); });
    $(document).on("keydown", e => {
      if (e.key === "Escape" && !$menu.hasClass("hidden")) { setMenu(false); $btn.trigger("focus"); }
    });
    $("#logout-btn").on("click", () => Auth.logout());

    // Mobile menu
    $("#menu-toggle").on("click", function () {
      const open = $("#mobile-menu").toggleClass("hidden").hasClass("hidden") === false;
      $(this).attr("aria-expanded", String(open));
    });

    // Global search: sends the query to the events list page
    $(".search-form input").val(Utils.param("q") || "");
    $(".search-form").on("submit", e => {
      e.preventDefault();
      const q = $(e.currentTarget).find("input").val().trim();
      location.href = Config.page("events/list.html") + (q ? "?q=" + encodeURIComponent(q) : "");
    });
  }

  return {
    mount() {
      $("#navbar").html(html());
      Guard.applyRoleUI(document.getElementById("navbar"));   // strips elements the current role must not have
      bind();
      if (Auth.isLoggedIn() && typeof NotificationDrawer !== "undefined") NotificationDrawer.init();
    },
    setCount(n) {
      $("#bell-count").text(n > 99 ? "99+" : n).toggleClass("hidden", n === 0);
      $("#bell").attr("aria-label", n ? `Notifications, ${n} unread` : "Notifications");
    },
  };
})();