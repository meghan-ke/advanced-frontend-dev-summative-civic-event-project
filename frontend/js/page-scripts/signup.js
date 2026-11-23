// Signup page: live strength meter, validation, then Auth.signup.
$(function () {
  if (!Guard.requireGuest()) return;

  const RULES = [
    { id: "len",  test: p => p.length >= 8 },
    { id: "case", test: p => /[a-z]/.test(p) && /[A-Z]/.test(p) },
    { id: "num",  test: p => /\d/.test(p) },
    { id: "sym",  test: p => /[\W_]/.test(p) },
  ];
  const COLORS = ["", "bg-red-700", "bg-amber-700", "bg-sky-700", "bg-green-700"];
  const LABELS = ["—", "Weak", "Fair", "Good", "Strong"];

  const $form = $("#signup-form"), $btn = $("#submit"), $alert = $("#form-alert");
  const $pw = $("#password"), $confirm = $("#confirm_password"), $segs = $("#meter .seg");

  function updateMeter() {
    const p = $pw.val();
    let score = 0;
    RULES.forEach(r => {
      const met = r.test(p);
      if (met) score++;
      const $li = $(`#rules [data-rule="${r.id}"]`);
      $li.toggleClass("text-green-700", met).toggleClass("text-ink-soft", !met);
      $li.find(".mark").text(met ? "✓" : "○");
      $li.find(".status").text(met ? " met" : " not met");
    });
    if (!p) score = 0;
    $segs.each((i, el) => { el.className = "seg h-1.5 flex-1 rounded " + (i < score ? COLORS[score] : "bg-line"); });
    $("#meter-label").text("Password strength: " + LABELS[score]);
  }
  $pw.on("input", updateMeter);


  $confirm.on("input", () => {
    $confirm.next(".field-error").remove();
    if ($confirm.val() && $confirm.val() !== $pw.val()) UI.fieldError($confirm, "Passwords do not match.");
  });

  $form.on("submit", async e => {
    e.preventDefault();
    UI.clearErrors($form);
    $alert.addClass("hidden");

    const $name = $("#full_name"), $email = $("#email");
    const name = $name.val().trim(), email = $email.val().trim(), p = $pw.val();

    let ok = true;
    if (name.length < 2) { UI.fieldError($name, "Enter your full name."); ok = false; }
    if (!/^\S+@\S+\.\S+$/.test(email)) { UI.fieldError($email, "Enter a valid email address."); ok = false; }
    if (!RULES.every(r => r.test(p))) { UI.fieldError($pw, "Password does not meet all the requirements."); ok = false; }
    if ($confirm.val() !== p) { UI.fieldError($confirm, "Passwords do not match."); ok = false; }
    if (!ok) return;

    UI.btnLoading($btn, true, "Creating account…");
    try {
      await Auth.signup(name, email, p);
      Store.setFlash("Account created. Please log in.", "success");   // shown by login.js
      location.href = Config.page("auth/login.html");
    } catch (err) {
      if (err.status === 409) UI.fieldError($email, "That email is already registered.");
      else $alert.text(err.message).removeClass("hidden");
      UI.btnLoading($btn, false);
    }
  });
});