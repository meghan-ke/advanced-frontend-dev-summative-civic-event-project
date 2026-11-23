// Announcement detail: accessible HTML5 audio player, time display and transcript.
$(function () {
  if (!Guard.requireAuth()) return;              // PAGE-LEVEL GUARD
  Navbar.mount(); Footer.mount();

  const E = Utils.esc, id = Utils.param("id"), $d = $("#detail");
  if (!id) return location.replace(Config.page("errors/404.html"));

  async function load() {
    $d.html('<div class="panel h-64 animate-pulse"></div>');
    try {
      const a = (await Api.get("/announcements/" + id)).data;
      const src = Utils.mediaUrl(a.audio_url, "announcements");   
      $d.html(`<section class="panel">
        <p class="text-sm text-ink-soft">${E(Utils.fmtDate(a.created_at))}</p>
        <h1 class="page-title mt-1">${E(a.title)}</h1>
        <audio id="player" controls preload="metadata" class="w-full" aria-label="Audio for ${E(a.title)}">
          <source src="${E(src)}">
          Your browser can't play this audio. <a class="underline" href="${E(src)}">Download the file</a> instead.
        </audio>
        <p class="mt-2 text-sm text-ink-soft" aria-live="off">Time: <span id="cur">0:00</span> / <span id="dur">${Utils.fmtDuration(a.duration_seconds)}</span></p>
        <h2 class="mt-6 text-lg font-semibold">Transcript</h2>
        <p class="mt-1 whitespace-pre-line">${E(a.transcript) || '<span class="text-ink-soft">No transcript provided.</span>'}</p>
      </section>`);
      const p = document.getElementById("player");
      p.addEventListener("timeupdate", () => $("#cur").text(Utils.fmtDuration(p.currentTime)));
      p.addEventListener("loadedmetadata", () => { if (isFinite(p.duration)) $("#dur").text(Utils.fmtDuration(p.duration)); });
    } catch (e) {
      if (e.status === 404) return location.replace(Config.page("errors/404.html"));
      $d.html('<div class="panel">' + UI.error(e.message) + "</div>");
    }
  }
  $d.on("click", "[data-retry]", load);
  load();
});