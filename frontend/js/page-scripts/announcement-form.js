// Admin: upload an announcement (multipart, audio under the key 'audio').
$(function () {
  if (!Guard.requireRole("admin")) return;   // PAGE-LEVEL GUARD: admins only
  Navbar.mount(); Footer.mount();

  const $form = $("#ann-form"), $btn = $("#save"), $alert = $("#form-alert");
  const allowedExtensions = [".mp3", ".wav", ".m4a", ".ogg"];
  let previewUrl = null;

  $("#audio").on("change", function () {
    $(this).next(".field-error").remove();
    const f = this.files[0];
    if (!f) return;
    const extension = f.name.slice(f.name.lastIndexOf(".")).toLowerCase();
    const msg = !allowedExtensions.includes(extension)
      ? "Choose an MP3, WAV, M4A or OGG audio file."
      : f.size > Config.MAX_AUDIO_MB * 1024 * 1024
        ? "The audio file must be no larger than " + Config.MAX_AUDIO_MB + " MB."
        : "";
    if (msg) {
      this.value = "";
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = null;
      $("#preview").attr("src", "").addClass("hidden");
      return UI.fieldError($(this), msg);
    }
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(f);
    $("#preview").attr("src", previewUrl).removeClass("hidden")[0].load();
  });

  $form.on("submit", async e => {
    e.preventDefault();
    UI.clearErrors($form); $alert.addClass("hidden");
    const $t = $("#title"), $a = $("#audio"), file = $a[0].files[0];
    let ok = true;
    if (!$t.val().trim()) { UI.fieldError($t, "Title is required."); ok = false; }
    if (!file) { UI.fieldError($a, "Choose an audio file."); ok = false; }
    if (!ok) return;

    const fd = new FormData();
    fd.append("title", $t.val().trim());
    fd.append("audio", file);
    fd.append("published", $("#published").is(":checked"));

    UI.btnLoading($btn, true, "Uploading…");
    $("#progress-wrap").removeClass("hidden");
    try {
      const res = await Api.upload("POST", "/announcements", fd, pct => {
        $("#progress").css("width", pct + "%"); $("#progress-text").text("Uploading " + pct + "%");
      });
    
      const created = res.data;
      if ($("#published").is(":checked") && created && created.id && created.published !== true) {
        try {
          await Api.patch("/announcements/" + encodeURIComponent(created.id) + "/publish");
        } catch (publishError) {
          Store.setFlash("Announcement uploaded as a draft, but could not be published: " + publishError.message, "error");
          location.href = Config.page("announcements/list.html");
          return;
        }
      }
      Store.setFlash($("#published").is(":checked")
        ? "Announcement published. Users will be notified."
        : "Announcement saved as a draft.", "success");
      location.href = Config.page("announcements/list.html");
    } catch (err) {
      $alert.text(err.message).removeClass("hidden");
      UI.btnLoading($btn, false);
      $("#progress-wrap").addClass("hidden");
    }
  });

  window.addEventListener("beforeunload", () => { if (previewUrl) URL.revokeObjectURL(previewUrl); });
});