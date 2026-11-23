const Config = {
    ROOT: document.currentScript.src.replace(/js\/core\/config\.js.*$/, ""),
    BASE_URL: "http://localhost:4000",
    API: "/api",
    PAGE_SIZE: 9,
    MAX_IMAGE_MB: 5,
    MAX_AUDIO_MB: 20,
    MAX_VIDEO_MB: 100,
    CACHE_TTL_MS: 5 * 60 * 1000, // 5 minutes
    page(p) { return this.ROOT + "pages/" + p; },
};