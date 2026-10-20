const enc = new TextEncoder();
function json(data, status=200, headers={}) {
  return new Response(JSON.stringify(data), { status, headers: { "content-type":"application/json; charset=utf-8", "cache-control":"no-store", ...headers } });
}
function b64url(bytes) {
  let s = ""; for (const b of new Uint8Array(bytes)) s += String.fromCharCode(b);
  return btoa(s).replace(/\+/g,"-").replace(/\//g,"_").replace(/=+$/,"");
}
async function sign(value, secret) {
  const key = await crypto.subtle.importKey("raw", enc.encode(secret), {name:"HMAC",hash:"SHA-256"}, false, ["sign"]);
  return b64url(await crypto.subtle.sign("HMAC", key, enc.encode(value)));
}
export async function makeSession(secret) {
  const payload = b64url(enc.encode(JSON.stringify({ exp: Date.now()+8*60*60*1000 })));
  return payload+"."+await sign(payload,secret);
}
export async function validSession(request, secret) {
  if (!secret) return false;
  const cookie = request.headers.get("Cookie") || "";
  const match = cookie.match(/(?:^|;\s*)p360_session=([^;]+)/);
  if (!match) return false;
  const parts=match[1].split(".");
  if(parts.length!==2) return false;
  const expected=await sign(parts[0],secret);
  if(expected.length!==parts[1].length) return false;
  let diff=0; for(let i=0;i<expected.length;i++) diff |= expected.charCodeAt(i)^parts[1].charCodeAt(i);
  if(diff!==0) return false;
  try {
    const payload=JSON.parse(atob(parts[0].replace(/-/g,"+").replace(/_/g,"/")));
    return Number(payload.exp)>Date.now();
  } catch { return false; }
}
export const cookieHeader = value => `p360_session=${value}; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=28800`;
export const clearCookie = "p360_session=; Path=/; HttpOnly; Secure; SameSite=Strict; Max-Age=0";
export async function requireAuth(request, env) {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) return json({error:"Admin secrets are not configured."}, 503);
  if (!(await validSession(request, env.SESSION_SECRET))) return json({error:"Login required."}, 401);
  return null;
}
export { json };
