$(function() {
    if (!Guard.requireGuest()) return;
    UI.showFlash();

    const $form = $("#login-form"), 
    $btn = $("#submit"),
    $alert = $("#form-alert");

    $form.on("submit", async e => {
        e.preventDefault();
        UI.clearErrors($form);
        $alert.addClass("hidden");

        const $email = $("#email"), $pw = $("#password");
        const email = $email.val().trim(), pw = $pw.val();

        let ok = true;
        if (!/^\S+@\S+\.\S+$/.test(email)) { UI.fieldError($email, "Enter a valid email address."); ok = false; }
        if (!pw) { UI.fieldError($pw, "Enter your password."); ok = false; }
        if (!ok) return;

        UI.btnLoading($btn, true, "Logging in...");
        try{
            const user = await Auth.login(email, pw, $("#remember").is(":checked"));
            // Admins land on the dashboard, normal users on the events list
            location.href = Config.page(user.role === "admin" ? "admin/dashboard.html" : "events/list.html");
        } catch (err) {
            $alert.text(err.message).removeClass("hidden");
            UI.btnLoading($btn, false);
            
        }
    });
});