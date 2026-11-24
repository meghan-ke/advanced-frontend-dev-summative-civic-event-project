// Shared footer: about, quick links, help and contact. Pages call Footer.mount().
const Footer = {
  mount() {
    const L = p => Config.page(p);
    $("#footer").html(`
      <footer class="mt-12 border-t border-cream-text/20 text-cream-text">
        <div class="mx-auto grid max-w-7xl gap-8 px-4 py-10 sm:px-6 md:grid-cols-3">
          <div>
            <p class="font-display text-3xl tracking-widest">CIVIC</p>
            <p class="mt-3 max-w-xs text-sm">Find, join and review civic events in your community.</p>
          </div>
          <nav aria-label="Footer">
            <h2 class="mb-3 font-semibold">Explore</h2>
            <ul class="space-y-2 text-sm">
              <li><a class="underline" href="${L("events/list.html")}">Events</a></li>
              <li><a class="underline" href="${L("announcements/list.html")}">Announcements</a></li>
              <li><a class="underline" href="${L("promos/list.html")}">Promos</a></li>
            </ul>
          </nav>
          <div>
            <h2 class="mb-3 font-semibold">Help and contact</h2>
            <p class="text-sm">Questions or problems? Email <a class="underline" href="mailto:help@civicevents.example">help@civicevents.example</a>.</p>
            <p class="mt-2 text-sm">Account issues? Contact an administrator.</p>
          </div>
        </div>
        <p class="border-t border-cream-text/20 px-4 py-4 text-center text-xs">&copy; ${new Date().getFullYear()} Civic Events. All rights reserved.</p>
      </footer>`);
  },
};