// Reusable pagination buttons.  Pagination.render($container, currentPage, totalPages, onGo)
const Pagination = {
  render($el, page, total, onGo) {
    if (total <= 1) return $el.empty();
    const b = (label, p, o = {}) => `<button type="button" data-p="${p}" ${o.dis ? "disabled" : ""} ${o.cur ? 'aria-current="page"' : ""}
      aria-label="${o.aria}" class="${o.cur ? "btn-primary" : "btn-outline"} min-w-[44px] disabled:opacity-40">${label}</button>`;
    let h = b("Previous", page - 1, { dis: page === 1, aria: "Previous page" });
    for (let i = 1; i <= total; i++) h += b(i, i, { cur: i === page, aria: "Page " + i });
    h += b("Next", page + 1, { dis: page === total, aria: "Next page" });
    $el.html(h).off("click").on("click", "button:not([disabled])", e => onGo(Number($(e.currentTarget).data("p"))));
  },
};