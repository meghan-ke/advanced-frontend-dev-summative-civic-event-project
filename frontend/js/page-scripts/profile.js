// View and update the signed-in user's name and email.
$(function () {
  if (!Guard.requiredAuth()) return;
  UI.showFlash(); Navbar.mount(); Footer.mount();

  const $form = $("#profile-form"), $button = $("#save-profile"), $alert = $("#form-alert");
  function showProfile(user) {
    $("#profile-role").text(user.role || "user");
    $("#profile-status").text(user.is_active ? "Active" : "Disabled");
    $("#profile-created").text(Utils.fmtDate(user.created_at) || "Not available");
    $("#full-name").val(user.full_name || "");
    $("#email").val(user.email || "");
    $("#profile-loading").addClass("hidden");
    $("#profile-content").removeClass("hidden");
  }

  async function load() {
    $("#profile-error").addClass("hidden").empty();
    $("#profile-loading").removeClass("hidden");
    $("#profile-content").addClass("hidden");
    try {
      const user = (await Api.get("/users/profile/me")).data;
      showProfile(user);
    } catch (e) {
      $("#profile-loading").addClass("hidden");
      $("#profile-error").html(UI.error(e.message)).removeClass("hidden");
    }
  }

  $("#profile-error").on("click", "[data-retry]", load);

  $form.on("submit", async e => {
    e.preventDefault();
    UI.clearErrors($form); $alert.addClass("hidden");

    const $name = $("#full-name"), $email = $("#email");
    const fullName = $name.val().trim(), email = $email.val().trim();
    let valid = true;
    if (!fullName) { UI.fieldError($name, "Full name is required."); valid = false; }
    if (!email || !$email[0].validity.valid) { UI.fieldError($email, "Enter a valid email address."); valid = false; }
    if (!valid) return;

    UI.btnLoading($button, true, "Saving…");
    try {
      const updated = (await Api.patch("/users/profile/me", { full_name: fullName, email })).data;
      Store.updateUser(updated);
      $("#profile-role").text(updated.role || "user");
      $("#profile-status").text(updated.is_active ? "Active" : "Disabled");
      $("#profile-created").text(Utils.fmtDate(updated.created_at) || "Not available");
      $("#profile-btn").children("span").eq(0).text(
        fullName.trim().split(/\s+/).map(part => part[0]).slice(0, 2).join("").toUpperCase()
      );
      $("#profile-btn").children("span").eq(1).text(fullName);
      UI.toast("Profile updated.", "success");
      UI.btnLoading($button, false);
    } catch (err) {
      $alert.text(err.status === 409
        ? "That email address is already in use. Try a different email."
        : err.message).removeClass("hidden");
      UI.btnLoading($button, false);
    }
  });

  load();
});