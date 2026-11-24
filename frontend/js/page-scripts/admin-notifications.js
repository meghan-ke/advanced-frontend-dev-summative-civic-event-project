// Admin notification management; the API limits results to the admin's own and broadcast notifications.
$(function () {
  if (!Guard.requireRole("admin")) return;
  UI.showFlash(); Navbar.mount(); Footer.mount();
  NotificationInbox.mount();
});