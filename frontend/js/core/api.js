// The ONLY place that talks to the backend. Pages never call $.ajax directly.
// Resolves with the backend's full JSON ({status, message, data}); rejects with {status, message}.
const Api = (() => {
  function toError(xhr) {
    const status = xhr.status;
    let message = xhr.responseJSON && xhr.responseJSON.message;
    if (!message) {
      message = status === 0 ? "Can't reach the server. Check your connection and try again."
              : status >= 500 ? "Server error. Please try again."
              : "Request failed.";
    }
    // A rejected token signs the user out. A 401 with no token (wrong password at login) does not.
    if (status === 401 && Store.getToken()) Auth.expire();
    return { status, message };
  }

  function request(method, path, body, isForm, onProgress) {
    const opts = { url: Config.BASE_URL + Config.API + path, method, headers: {} };
    const token = Store.getToken();
    if (token) opts.headers.Authorization = "Bearer " + token;   // required by every protected route
    if (body !== undefined) {
      if (isForm) { opts.data = body; opts.processData = false; opts.contentType = false; }   // multipart uploads
      else { opts.data = JSON.stringify(body); opts.contentType = "application/json"; }
    }
    if (onProgress) {   // upload progress, 0 to 100
      opts.xhr = () => {
        const x = $.ajaxSettings.xhr();
        if (x.upload) x.upload.addEventListener("progress", e => { if (e.lengthComputable) onProgress(Math.round(e.loaded / e.total * 100)); });
        return x;
      };
    }
    return new Promise((resolve, reject) => $.ajax(opts).done(resolve).fail(x => reject(toError(x))));
  }

  return {
    get: p => request("GET", p),
    post: (p, b) => request("POST", p, b),
    put: (p, b) => request("PUT", p, b),
    patch: (p, b) => request("PATCH", p, b),
    del: p => request("DELETE", p),
    upload: (method, p, formData, onProgress) => request(method, p, formData, true, onProgress),
  };
})();