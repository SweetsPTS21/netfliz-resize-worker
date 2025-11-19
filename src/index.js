// src/index.js
addEventListener("fetch", (event) => {
    event.respondWith(handle(event.request));
});

const ORIGIN_BASE = "https://firebasestorage.googleapis.com/v0/b/netfliz-19a9c.appspot.com/o";

async function handle(request) {
    const url = new URL(request.url);
    let originPath = url.pathname.replace(/^\/images/, '')
    if (!originPath || originPath === '/') return new Response('Not found', { status: 404 })
    if (originPath.startsWith('/')) originPath = originPath.substring(1)

    const originUrl = `${ORIGIN_BASE}/${encodeURIComponent(originPath)}?alt=media` ;
    const originResponse = await fetch(originUrl, {
        method: "GET",
        cf: {
            // enable Cloudflare cache (edge). You can tune cacheTtl here as seconds.
            cacheTtl: 86400,
            // 1 day at edge, Workers KV Cache TTL hint
            cacheEverything: true
        }
    });
    if (!originResponse.ok) {
        return new Response("Not found", { status: originResponse.status });
    }
    const headers = new Headers(originResponse.headers);
    if (!headers.has("Cache-Control")) {
        headers.set("Cache-Control", "public, max-age=31536000, s-maxage=31536000, immutable");
    }
    return new Response(originResponse.body, {
        status: originResponse.status,
        statusText: originResponse.statusText,
        headers
    });
}
