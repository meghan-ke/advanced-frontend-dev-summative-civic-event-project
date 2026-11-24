// Promos list: published promos for everyone; admins can manage all promos.
$(function () {
  if (!Guard.requiredAuth()) return;
  UI.showFlash(); Navbar.mount(); Footer.mount();

  const E = Utils.esc, admin = Auth.isAdmin(), $grid = $("#grid"), $pager = $("#pager");
  const pageSize = Config.PAGE_SIZE;
  let page = 1, items = [], videoObserver;

  function render() {
    const shown = items.filter(p => admin || p.published !== false);
    const totalPages = Math.max(1, Math.ceil(shown.length / pageSize));
    page = Math.min(page, totalPages);
    const pageItems = shown.slice((page - 1) * pageSize, page * pageSize);
    $grid.html(pageItems.length ? pageItems.map(p => {
      const video = Utils.mediaUrl(p.video_url, "promos");
      const description = p.description || "";
      return `<article class="card flex flex-col overflow-hidden">
        <video controls muted playsinline preload="none" data-src="${E(video)}" class="aspect-video w-full bg-black object-cover" aria-label="Video preview: ${E(p.title)}">
          Your browser can't play this video.
        </video>
        <div class="flex flex-1 flex-col p-5">
          <p class="text-xs font-semibold uppercase tracking-wider text-burgundy">${E(Utils.fmtDate(p.created_at))}
            ${p.published === false ? '<span class="ml-2 rounded bg-amber-700 px-2 py-0.5 text-white">Draft</span>' : ""}
          </p>
          <h2 class="mt-1 text-lg font-semibold">${E(p.title)}</h2>
          <p class="mt-2 flex-1 text-sm text-ink-soft">${E(description.slice(0, 150))}${description.length > 150 ? "…" : ""}</p>
          <div class="mt-4 flex flex-wrap gap-2">
            <a class="btn-primary" href="detail.html?id=${encodeURIComponent(p.id)}">Watch</a>
            <a data-role="admin" class="btn-outline" href="form.html?id=${encodeURIComponent(p.id)}">Edit</a>
            <button data-role="admin" type="button" class="btn-outline" data-toggle="${E(p.id)}" data-pub="${p.published !== false}">${p.published === false ? "Publish" : "Unpublish"}</button>
            <button data-role="admin" type="button" class="btn-outline" data-del="${E(p.id)}">Delete</button>
          </div>
        </div>
      </article>`;
    }).join("") : UI.empty(admin ? "No promos yet." : "No promos are published yet."));

    Guard.applyRoleUI(document.getElementById("main"));
    Pagination.render($pager, page, totalPages, nextPage => {
      page = nextPage;
      render();
      window.scrollTo({ top: 0 });
    });

    if (videoObserver) videoObserver.disconnect();
    const videos = $grid.find("video[data-src]").toArray();
    const loadVideo = video => {
      if (video.src) return;
      video.addEventListener("loadedmetadata", () => {
        if (Number.isFinite(video.duration) && video.duration > 0) {
          video.currentTime = Math.min(0.1, video.duration / 2);
        }
      }, { once: true });
      video.src = video.dataset.src;
      video.preload = "metadata";
      video.load();
    };
    if ("IntersectionObserver" in window) {
      videoObserver = new IntersectionObserver(entries => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            loadVideo(entry.target);
            videoObserver.unobserve(entry.target);
          }
        });
      }, { rootMargin: "200px" });
      videos.forEach(video => videoObserver.observe(video));
    } else {
      videos.forEach(loadVideo);
    }
  }

  function promosFrom(response) {
    return Array.isArray(response.data) ? response.data : (response.data && response.data.promos) || [];
  }

  async function load() {
    $grid.html(UI.skeletonCards(3));
    try {
      const first = await Api.get("/promos?page=1&limit=" + pageSize);
      const pagination = first.pagination || {};
      const apiPages = Math.max(1, Number(pagination.pages) || 1);
      const responses = [first];
      if (apiPages > 1) {
        const remaining = await Promise.all(
          Array.from({ length: apiPages - 1 }, (_, index) =>
            Api.get("/promos?page=" + (index + 2) + "&limit=" + pageSize)
          )
        );
        responses.push(...remaining);
      }
      items = responses.flatMap(promosFrom);
      page = 1;
      render();
    } catch (e) {
      $grid.html(UI.error(e.message));
      $pager.empty();
    }
  }

  $grid.on("click", "[data-retry]", load);
  $grid.on("mouseenter focusin", "video[data-src]", function () {
    if (!this.src) {
      this.src = this.dataset.src;
      this.preload = "metadata";
      this.load();
    }
  });

  $grid.on("click", "[data-toggle]", async function () {
    const $button = $(this), id = String($button.data("toggle"));
    const published = $button.attr("data-pub") === "true";
    $button.prop("disabled", true);
    try {
      await Api.patch("/promos/" + encodeURIComponent(id) + (published ? "/unpublish" : "/publish"));
      const promo = items.find(p => String(p.id) === id);
      if (promo) promo.published = !published;
      UI.toast(published ? "Promo unpublished." : "Promo published.", "success");
      render();
    } catch (e) {
      UI.toast(e.message, "error");
      $button.prop("disabled", false);
    }
  });

  $grid.on("click", "[data-del]", async function () {
    const id = String($(this).data("del"));
    if (!await UI.confirm("Delete this promo? This cannot be undone.")) return;
    try {
      await Api.del("/promos/" + encodeURIComponent(id));
      items = items.filter(p => String(p.id) !== id);
      UI.toast("Promo deleted.", "success");
      render();
    } catch (e) { UI.toast(e.message, "error"); }
  });

  load(1);
});