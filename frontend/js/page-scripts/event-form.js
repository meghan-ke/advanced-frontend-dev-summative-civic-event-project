// Admin event form (create and edit) with image preview, validation and upload progress.
$(function () {
  if (!Guard.requireRole("admin")) return;   // PAGE-LEVEL GUARD: admins only, everyone else goes to 403
  Navbar.mount(); Footer.mount();

  const id = Utils.param("id"), editing = !!id;
  const $form = $("#event-form"), $btn = $("#save"), $alert = $("#form-alert");
  const IMG_TYPES = ["image/jpeg", "image/png", "image/webp"];

  // Edit mode: load the event and fill the form
  if (editing) {
    $("#form-title").text("Edit event");
    Api.get("/events/" + id).then(r => {
      const ev = r.data;
      $("#title").val(ev.title); $("#description").val(ev.description); $("#location").val(ev.location);
      $("#starts_at").val(Utils.toLocalInput(ev.starts_at)); $("#ends_at").val(Utils.toLocalInput(ev.ends_at));
      const img = Utils.eventImage(ev);
      if (img) $("#preview").attr("src", img).removeClass("hidden");
    }).catch(e => {
      if (e.status === 404) location.replace(Config.page("errors/404.html"));
      else $alert.text(e.message).removeClass("hidden");
    });
  }

  // Check the file BEFORE uploading (type and size), then show a preview
  $("#image").on("change", function () {
    $(this).next(".field-error").remove();
    const f = this.files[0];
    if (!f) return;
    const msg = Utils.validateFile(f, IMG_TYPES, Config.MAX_IMAGE_MB);
    if (msg) { this.value = ""; return UI.fieldError($(this), msg); }
    $("#preview").attr("src", URL.createObjectURL(f)).removeClass("hidden");
  });

  $form.on("submit", async e => {
    e.preventDefault();
    UI.clearErrors($form); $alert.addClass("hidden");

    const $t = $("#title"), $d = $("#description"), $l = $("#location"), $s = $("#starts_at"), $en = $("#ends_at");
    let ok = true;
    if (!$t.val().trim()) { UI.fieldError($t, "Title is required."); ok = false; }
    if (!$d.val().trim()) { UI.fieldError($d, "Description is required."); ok = false; }
    if (!$l.val().trim()) { UI.fieldError($l, "Location is required."); ok = false; }
    if (!$s.val()) { UI.fieldError($s, "Start date and time are required."); ok = false; }
    if (!$en.val()) { UI.fieldError($en, "End date and time are required."); ok = false; }
    if ($s.val() && $en.val() && new Date($en.val()) < new Date($s.val())) { UI.fieldError($en, "The end must be after the start."); ok = false; }
    if (!ok) return;

    // multipart/form-data: text fields plus the file under the key 'image'
    const fd = new FormData();
    fd.append("title", $t.val().trim());
    fd.append("description", $d.val().trim());
    fd.append("location", $l.val().trim());
    fd.append("starts_at", new Date($s.val()).toISOString());
    fd.append("ends_at", new Date($en.val()).toISOString());
    const file = $("#image")[0].files[0];
    if (file) fd.append("image", file);

    UI.btnLoading($btn, true, "Saving…");
    $("#progress-wrap").toggleClass("hidden", !file);
    try {
      await Api.upload(editing ? "PUT" : "POST", editing ? "/events/" + id : "/events", fd, pct => {
        $("#progress").css("width", pct + "%"); $("#progress-text").text("Uploading " + pct + "%");
      });
      Store.setFlash(editing ? "Event updated." : "Event created.", "success");
      location.href = Config.page("events/list.html");
    } catch (err) {
      $alert.text(err.message).removeClass("hidden");
      UI.btnLoading($btn, false);
      $("#progress-wrap").addClass("hidden");
    }
  });
});