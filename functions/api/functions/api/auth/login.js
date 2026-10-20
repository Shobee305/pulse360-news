
import {
  json,
  makeSession,
  cookieHeader
} from "../_utils.js";

export async function onRequestPost({ request, env }) {
  if (!env.ADMIN_PASSWORD || !env.SESSION_SECRET) {
    return json({
      error: "Admin secrets are not configured."
    }, 503);
  }

  let data;

  try {
    data = await request.json();
  } catch {
    return json({
      error: "Invalid request."
    }, 400);
  }

  if (
    typeof data.password !== "string" ||
    data.password !== env.ADMIN_PASSWORD
  ) {
    return json({
      error: "پاس ورڈ غلط ہے۔"
    }, 401);
  }

  const session = await makeSession(env.SESSION_SECRET);

  return json(
    { ok: true },
    200,
    {
      "Set-Cookie": cookieHeader(session)
    }
  );
}
