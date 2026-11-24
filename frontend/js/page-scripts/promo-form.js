// Admin promo form: create or edit a promo, including video upload and progress.
$(function () {
  if (!Guard.requireRole("admin")) return;
  Navbar.mount(); Footer.mount();

  const id = Utils.param("id"), editing = !!id;
  const $form = $("#promo-form"), $button = $("#save"), $alert = $("#form-alert");
  const allowedExtensions = [".mp4", ".mov", ".avi", ".mkv"];
  let previewUrl = null;

  if (editing) {
    $("#form-title").text("Edit promo");
    $button.text("Save changes");
    Api.get("/promos/" + encodeURIComponent(id)).then(response => {
      const promo = response.data;
      $("#title").val(promo.title || "");
      $("#description").val(promo.description || "");
      $("#caption_text").val(promo.caption_text || "");
      const videoUrl = Utils.mediaUrl(promo.video_url, "promos");
      if (videoUrl) $("#preview").attr("src", videoUrl).removeClass("hidden");
    }).catch(e => {
      if (e.status === 404) location.replace(Config.page("errors/404.html"));
      else $alert.text(e.message).removeClass("hidden");
    });
  }

  $("#video").on("change", function () {
    const $input = $(this);
    $input.next(".field-error").remove();
    const file = this.files[0];
    if (!file) return;

    const extension = file.name.slice(file.name.lastIndexOf(".")).toLowerCase();
    const error = !allowedExtensions.includes(extension)
      ? "Choose an MP4, MOV, AVI or MKV video."
      : file.size > Config.MAX_VIDEO_MB * 1024 * 1024
        ? "The video must be no larger than " + Config.MAX_VIDEO_MB + " MB."
        : "";
    if (error) {
      this.value = "";
      if (previewUrl) URL.revokeObjectURL(previewUrl);
      previewUrl = null;
      $("#preview").attr("src", "").addClass("hidden");
      return UI.fieldError($input, error);
    }

    if (previewUrl) URL.revokeObjectURL(previewUrl);
    previewUrl = URL.createObjectURL(file);
    $("#preview").attr("src", previewUrl).removeClass("hidden")[0].load();
  });

  $form.on("submit", async e => {
    e.preventDefault();
    UI.clearErrors($form); $alert.addClass("hidden");

    const $title = $("#title"), $description = $("#description"), $captions = $("#caption_text");
    const file = $("#video")[0].files[0];
    let valid = true;
    if (!$title.val().trim()) { UI.fieldError($title, "Title is required."); valid = false; }
    if (!$description.val().trim()) { UI.fieldError($description, "Description is required."); valid = false; }
    if (!$captions.val().trim()) { UI.fieldError($captions, "Captions are required."); valid = false; }
    if (!editing && !file) { UI.fieldError($("#video"), "Choose a video to upload."); valid = false; }
    if (!valid) return;

    const body = new FormData();
    body.append("title", $title.val().trim());
    body.append("description", $description.val().trim());
    body.append("caption_text", $captions.val().trim());
    if (file) body.append("video", file);

    UI.btnLoading($button, true, editing ? "Saving…" : "Uploading…");
    $("#progress-wrap").removeClass("hidden");
    try {
      await Api.upload(editing ? "PUT" : "POST", editing ? "/promos/" + encodeURIComponent(id) : "/promos", body, pct => {
        $("#progress").css("width", pct + "%");
        $("#progress-text").text("Uploading " + pct + "%");
      });
      Store.setFlash(editing ? "Promo updated." : "Promo created.", "success");
      location.href = Config.page("promos/list.html");
    } catch (err) {
      $alert.text(err.message).removeClass("hidden");
      UI.btnLoading($button, false);
      $("#progress-wrap").addClass("hidden");
    }
  });

  window.addEventListener("beforeunload", () => { if (previewUrl) URL.revokeObjectURL(previewUrl); });
});