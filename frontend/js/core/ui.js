// Shared UI helpers: toasts, confirm dialog, loading/empty/error states, form errors.
const UI = {
  toast(message, type = "info") {
    let box = $("#toasts");
    if (!box.length) box = $('<div id="toasts" aria-live="polite" class="fixed top-4 right-4 z-50 flex flex-col gap-2"></div>').appendTo("body");
    const color = { success: "bg-green-700", error: "bg-red-700", info: "bg-sky-700" }[type] || "bg-sky-700";
    const $t = $('<div role="status" class="text-white px-4 py-3 rounded-lg shadow-lg max-w-sm"></div>').addClass(color).text(message);
    box.append($t);
    setTimeout(() => $t.fadeOut(300, () => $t.remove()), 4500);
  },
  showFlash() { const f = Store.popFlash(); if (f) this.toast(f.msg, f.type); },   // call on every page load

  btnLoading($btn, on, label = "Please wait…") {
    if (on) { $btn.data("label", $btn.text()).prop("disabled", true).text(label); }
    else { $btn.prop("disabled", false).text($btn.data("label") || $btn.text()); }
  },

  // Native : focus trap and Esc come for free. Resolves true/false.
  confirm(message, okLabel = "Delete") {
    return new Promise(resolve => {
      const $d = $('<dialog class="rounded-2xl p-6 max-w-sm"><p class="mb-6 text-ink"></p><div class="flex justify-end gap-3"><button class="btn-outline" value="no">Cancel</button><button class="btn-primary" value="yes"></button></div></dialog>');
      $d.find("p").text(message);
      $d.find("[value=yes]").text(okLabel);
      $d.on("click", "button", e => { resolve(e.currentTarget.value === "yes"); $d[0].close(); });
      $d.on("cancel", () => resolve(false));
      $d.on("close", () => $d.remove());
      $("body").append($d);
      $d[0].showModal();
    });
  },

  skeletonCards(n = 6) {
    return Array.from({ length: n }, () => '<div class="card animate-pulse"><div class="h-36 bg-line"></div><div class="p-5 space-y-3"><div class="h-3 bg-line rounded w-1/3"></div><div class="h-5 bg-line rounded w-2/3"></div><div class="h-3 bg-line rounded w-1/2"></div></div></div>').join("");
  },
  empty: msg => `<p class="col-span-full text-center text-ink-soft py-12">${Utils.esc(msg)}</p>`,
  error: msg => `<div class="col-span-full text-center py-12" role="alert"><p class="text-red-700 mb-4">${Utils.esc(msg)}</p><button class="btn-outline" data-retry>Try again</button></div>`,

  fieldError($input, msg) {
    $input.attr("aria-invalid", "true");
    $input.next(".field-error").remove();
    $input.after($('<p class="field-error text-sm text-red-700 mt-1" role="alert"></p>').text(msg));
  },
  clearErrors($form) { $form.find(".field-error").remove(); $form.find("[aria-invalid]").removeAttr("aria-invalid"); },
};