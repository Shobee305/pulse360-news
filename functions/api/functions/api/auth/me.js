
import { json, validSession } from "../_utils.js";

export async function onRequestGet({ request, env }) {
  if (!env.SESSION_SECRET) {
    return json({ error: "Admin secrets are not configured." }, 503);
  }

  const authenticated = await validSession(
    request,
    env.SESSION_SECRET
  );

  return json({ authenticated });
}
