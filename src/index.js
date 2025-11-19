// src/index.js
import sharp from "sharp";

addEventListener("fetch", (event) => {
    event.respondWith(handle(event.request));
});

const ORIGIN_BASE = "https://firebasestorage.googleapis.com/v0/b/netfliz-19a9c.appspot.com/o";

async function handle(request) {
    const url = new URL(request.url);
    let path = url.pathname.replace(/^\/images/, '')
    if (!path || path === '/') return new Response('Not found', {status: 404})
    if (path.startsWith('/')) path = path.substring(1)

    const match = path.match(/^(.*?)(?:-w(\d+))?\.(jpg|jpeg|png)$/i);
    if (!match) return new Response("Invalid URL", {status: 400});

    const baseName = match[1];
    const width = match[2] ? parseInt(match[2]) : null;
    const ext = match[3].toLowerCase();

    // map extension → sharp output format
    const formatMap = {jpg: "jpeg", jpeg: "jpeg", png: "png"};
    const outputFormat = formatMap[ext];

    const objectPath = `${baseName}-original.${ext}`;
    const encodedPath = encodeURIComponent(objectPath);
    const originUrl = `${ORIGIN_BASE}/${encodedPath}?alt=media`;

    // Fetch original file from firebase storage
    const originResponse = await fetch(originUrl);
    if (!originResponse.ok) {
        return new Response("Not found", {status: originResponse.status});
    }

    const arrayBuffer = await originResponse.arrayBuffer();
    let imageBuffer = arrayBuffer;

    // Resize nếu cần
    if (width) {
        imageBuffer = await sharp(arrayBuffer)
            .resize({width: width})
            .toFormat(outputFormat)
            .toBuffer();
    }

    const headers = new Headers(originResponse.headers);
    if (!headers.has("Cache-Control")) {
        headers.set("Cache-Control", "public, max-age=31536000, s-maxage=31536000, immutable");
    }

    return new Response(imageBuffer, {
        headers: {
            "Content-Type": `image/${outputFormat}`,
            "Cache-Control": "public, max-age=31536000, immutable",
            "Access-Control-Allow-Origin": "*"
        }
    });
}
