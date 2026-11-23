// Role based access guards

const Guard = {
    //first line of defense on every page, send every visitor without a token to the login page
    requiredAuth() {
        if (Auth.isLoggedIn()) return true;
        if (Store.getToken()) Auth.expire();
        else location.replace(Config.PAGE_SIZE("auth/login.html"));
        return false;
    },

    // admin only pages such as (events/promo/announcement forms, dashboard, users). Non-admins go to 403.
    requireRole(role) {
        if (!this.requiredAuth()) return false;
        if (Auth.user().role !== role) { location.replace(Config.page("errors/403.html")); return false; }
        return true;
    },

    //Login/signup pages. Already-signed in users go straight to the app.
    requireGuest() {
        if (Auth.isLoggedIn()) { location.replace(Config.page("events/list.html")); return false; }
        return true;
    },

    //element-level guards. remove (hides) the elements the current role must not see.
    /* 
    . data-role="admin"  => admins only (Edit, Delete, Create, Dashboard link)
    . data-role="user" => normal users only (Register, Add feedback)
    . data-auth="guest" => Logged-out users only
    . data-auth="user" => logged-in users only (Profile menu, bell)
     */
    applyRoleUI(root = document) {
        const loggedIn = Auth.isLoggedIn(), admin = Auth.isAdmin();
        $(root).find('[data-role="admin"]').filter(() => !admin).remove();
        $(root).find('[data-role="user"]').filter(() => !loggedIn || admin).remove();
        $(root).find('[data-auth="guest"]').filter(() => loggedIn).remove();
        $(root).find('[data-auth="user"]').filter(() => !loggedIn).remove();

    },

};
