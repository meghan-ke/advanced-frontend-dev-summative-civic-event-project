// Promo detail: video playback with a native captions track.
$(function () {
  if (!Guard.requiredAuth()) return;
  Navbar.mount(); Footer.mount();

  const E = Utils.esc, id = Utils.param("id"), $detail = $("#detail");
  let captionsUrl = null;
  if (!id) return location.replace(Config.page("errors/404.html"));

  function escapeCueText(text) {
    return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
  }

  function timestamp(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor(ms / 60000) % 60;
    const seconds = Math.floor(ms / 1000) % 60;
    const millis = ms % 1000;
    return String(hours).padStart(2, "0") + ":" + String(minutes).padStart(2, "0") + ":" +
      String(seconds).padStart(2, "0") + "." + String(millis).padStart(3, "0");
  }

  function toWebVtt(text, duration) {
    const content = String(text || "").trim();
    if (/^\uFEFF?WEBVTT(?:[ \t].*)?(?:\r?\n|$)/.test(content)) return content;

    const lines = content.split(/\r?\n/).map(line => line.trim()).filter(Boolean);
    const interval = Math.max(1000, Number.isFinite(duration) && duration > 0
      ? Math.floor(duration * 1000 / Math.max(lines.length, 1))
      : 5000);
    const cues = lines.map((line, index) => {
      const start = index * interval;
      return `${index + 1}\n${timestamp(start)} --> ${timestamp(start + interval)}\n${escapeCueText(line)}`;
    });
    return "WEBVTT\n\n" + cues.join("\n\n");
  }

  async function load() {
    $detail.html('<div class="panel h-64 animate-pulse"></div>');
    try {
      const promo = (await Api.get("/promos/" + encodeURIComponent(id))).data;
      if (!Auth.isAdmin() && promo.published === false) return location.replace(Config.page("errors/404.html"));

      const videoUrl = Utils.mediaUrl(promo.video_url, "promos");
      const captionText = String(promo.caption_text || "");
      $detail.html(`<article class="panel">
        <p class="text-sm text-ink-soft">${E(Utils.fmtDate(promo.created_at))}
          ${promo.published === false ? '<span class="ml-2 rounded bg-amber-700 px-2 py-0.5 text-white">Draft</span>' : ""}
        </p>
        <h1 class="page-title mt-1">${E(promo.title)}</h1>
        <p class="mt-3 whitespace-pre-line">${E(promo.description || "")}</p>
        <video id="promo-player" controls preload="metadata" playsinline class="mt-6 max-h-[70vh] w-full rounded-xl bg-black" aria-label="${E(promo.title)}">
          <source src="${E(videoUrl)}">
          <track id="caption-track" kind="captions" srclang="en" label="English" default>
          Your browser can't play this video. <a class="underline" href="${E(videoUrl)}">Download the video</a> instead.
        </video>
        <h2 class="mt-6 text-lg font-semibold">Captions transcript</h2>
        <p class="mt-1 whitespace-pre-line">${E(captionText) || "No captions provided."}</p>
      </article>`);

      const player = document.getElementById("promo-player");
      const track = document.getElementById("caption-track");
      const setCaptions = () => {
        if (captionsUrl) URL.revokeObjectURL(captionsUrl);
        const vtt = toWebVtt(captionText, player.duration);
        captionsUrl = URL.createObjectURL(new Blob([vtt], { type: "text/vtt;charset=utf-8" }));
        track.src = captionsUrl;
      };
      player.addEventListener("loadedmetadata", setCaptions, { once: true });
      if (player.readyState >= 1) setCaptions();
    } catch (e) {
      if (e.status === 404) return location.replace(Config.page("errors/404.html"));
      $detail.html('<div class="panel">' + UI.error(e.message) + "</div>");
    }
  }

  $detail.on("click", "[data-retry]", load);
  window.addEventListener("beforeunload", () => { if (captionsUrl) URL.revokeObjectURL(captionsUrl); });
  load();
});