/**
 * Welcome to Cloudflare Workers! This is your first worker.
 *
 * - Run `npm run dev` in your terminal to start a development server
 * - Open a browser tab at http://localhost:8787/ to see your worker in action
 * - Run `npm run deploy` to publish your worker
 *
 * Learn more at https://developers.cloudflare.com/workers/
 *
 * Vibe coding win? More or less.
 * Saved cookies with: npx wrangler secret put STRAVA_COOKIES, then pasting in cookies
 * (e.g. _strava4_session=...; note that you need sometimes need to copy the raw value in firefox because it truncates)
 * Saved a secret key MY_SECRET that will come in with the request - it's some lazy auth.
 * Example incoming URL: https://strava-proxy.brockmuellers-95e.workers.dev/14/2623/6332.png?secret={my_secret}
 * So URL template is: https://strava-proxy.brockmuellers-95e.workers.dev/{Z}/{X}/{Y}.png?secret={my_secret}
 */
 
// 00000000 = Fully transparent background
// FF0000 = Solid Red text
const EXPIRED_TILE_URL = "https://placehold.co/256x256/00000000/FF0000?text=UPDATE+STRAVA+COOKIES";
// Other color options include blue
const COLOR = "hot"

export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    
    // First check global Cloudflare cache, if available
    // TODO: I have not validated that this works
    const cache = caches.default;
    let cacheResponse = await cache.match(request);
    if (cacheResponse) return cacheResponse;
    
    // Authorization
    const secret = url.searchParams.get("secret");
    if (secret != env.MY_SECRET) return new Response("Unauthorized", { status: 401 });
    
    // Extract Z/X/Y from the incoming request
    const pathParts = url.pathname.split("/");
    if (pathParts.length < 4) return new Response("Invalid Path", { status: 400 });
    
    const [_, z, x, y] = pathParts;
    
    const stravaUrl = `https://content-a.strava.com/identified/globalheat/all/${COLOR}/${z}/${x}/${y}.png?v=19`;

    const response = await fetch(stravaUrl, {
      method: 'GET',
      headers: {
        'Cookie': env.STRAVA_COOKIES,
        'User-Agent': 'Mozilla/5.0 (X11; Ubuntu; Linux x86_64; rv:146.0) Gecko/20100101 Firefox/146.0',
        'Referer': 'https://www.strava.com/',
        'Origin': 'https://www.strava.com'
      }
    });

    // If 401, return a helpful tile
    if (response.status === 401) {
      console.error("Strava returned 401: Cookies likely expired.");

      // Option A: Return a visual warning tile
      return fetch(EXPIRED_TILE_URL);

      // Option B: Fallback to the Public Heatmap (no street level, but better than nothing)
      // const publicUrl = `https://content-a.strava.com/globalheat/all/${color}/${z}/${x}/${y}.png?v=19`;
      // return fetch(publicUrl);
    }

    // If there are any other errors, return before we get to caching
    if (!response.ok) {
      return response;
    }

    // Prepare for caching: create a new response to allow header modification
    const newResponse = new Response(response.body, response);
    
    // s-maxage: 7 days for Cloudflare
    // max-age: 1 hour for browser (so you don't get stuck with old data)
    // Note: I don't know why this is necessary but AI insists that it is
    newResponse.headers.set("Cache-Control", "s-maxage=604800, max-age=3600");

    // Save to cache; clone because the body can only be read once
    ctx.waitUntil(cache.put(request, newResponse.clone()));

    return newResponse;
  }
};
