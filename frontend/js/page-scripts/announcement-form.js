// Admin: upload an announcement (multipart, audio under the key 'audio').
$(function () {
  if (!Guard.requireRole("admin")) return;   // PAGE-LEVEL GUARD: admins only
  Navbar.mount(); Footer.mount();

  const $form = $("#ann-form"), $btn = $("#save"), $alert = $("#form-alert");

  $("#audio").on("change", function () {
    $(this).next(".field-error").remove();
    const f = this.files[0];
    if (!f) return;
    const msg = Utils.validateFile(f, ["audio/"], Config.MAX_AUDIO_MB);
    if (msg) { this.value = ""; $("#preview").addClass("hidden"); return UI.fieldError($(this), msg); }
    $("#preview").attr("src", URL.createObjectURL(f)).removeClass("hidden");
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
        try { await Api.patch("/announcements/" + created.id + "/publish"); } catch { /* admin can publish from the list */ }
      }
      Store.setFlash("Announcement created. Users will be notified.", "success");
      location.href = Config.page("announcements/list.html");
    } catch (err) {
      $alert.text(err.message).removeClass("hidden");
      UI.btnLoading($btn, false);
      $("#progress-wrap").addClass("hidden");
    }
  });
});