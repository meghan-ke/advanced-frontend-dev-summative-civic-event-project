// Full notification inbox; read state is stored per user in this browser.
$(function () {
  if (!Guard.requiredAuth()) return;
  UI.showFlash(); Navbar.mount(); Footer.mount();
  NotificationInbox.mount();
});