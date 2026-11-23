const Auth = (() => {
    const decode = t => {
        try { return JSON.parse(atob(t.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"))); }
        catch { return null; }
    };
    const toLogin = () => {location.href = Config.page("auth/login.html");};

    return {
        async login(email, password, remember) {
            const res = await Api.post("/auth/login", { email, password });
            Store.saveSession(res.data.token, res.data.user, remember);
            return res.data.user;
        },

        signup(full_name, email, password) {
            return Api.post("/auth/signup", { full_name, email, password}); 
        },
        user: () => Store.getUser(),
        isAdmin() { const u = Store.getUser(); return !!u && u.role === "admin"; },
        isExpired() { const t = Store.getToken(); const p = t && decode(t); return !p || p.exp * 1000 < Date.now(); },
        isLoggedIn() { return !!Store.getToken() && !this.isExpired(); },
        logout() { Store.clear(); toLogin(); },
        expire() { Store.clear(); Store.setFlash("Your session expired. Please log in again.", "error"); toLogin(); },
    };
})();