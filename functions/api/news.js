import { json, requireAuth } from "./_utils.js";
export async function onRequestGet({ request, env }) {
  const url=new URL(request.url);
  const isPublic=url.searchParams.get("public")==="1";
  if(!isPublic){const denied=await requireAuth(request,env);if(denied)return denied;}
  if(!env.DB)return json({error:"D1 database binding DB is missing."},503);
  const status=isPublic?"published":(url.searchParams.get("status")||"draft");
  const {results=[]}=await env.DB.prepare("SELECT id,title,category,summary,body,image_url,source_url,status,created_at,updated_at,published_at FROM news WHERE status=? ORDER BY COALESCE(published_at,created_at) DESC LIMIT 100").bind(status).all();
  return json({news:results});
}
export async function onRequestPost({ request, env }) {
  const denied=await requireAuth(request,env);if(denied)return denied;
  if(!env.DB)return json({error:"D1 database binding DB is missing."},503);
  let d;try{d=await request.json()}catch{return json({error:"Invalid JSON."},400)}
  const title=String(d.title||"").trim(), body=String(d.body||"").trim();
  if(!title||!body)return json({error:"عنوان اور خبر لازمی ہیں۔"},400);
  const category=String(d.category||"عالمی خبریں").slice(0,80);
  const summary=String(d.summary||"").slice(0,600);
  const image_url=String(d.image_url||"").slice(0,1500);
  const source_url=String(d.source_url||"").slice(0,1500);
  const status=d.status==="published"?"published":"draft";
  const now=new Date().toISOString();
  const result=await env.DB.prepare("INSERT INTO news (title,category,summary,body,image_url,source_url,status,created_at,updated_at,published_at) VALUES (?,?,?,?,?,?,?,?,?,?)").bind(title,category,summary,body,image_url,source_url,status,now,now,status==="published"?now:null).run();
  return json({ok:true,id:result.meta.last_row_id},201);
}
export async function onRequestPatch({ request, env }) {
  const denied=await requireAuth(request,env);if(denied)return denied;
  if(!env.DB)return json({error:"D1 database binding DB is missing."},503);
  let d;try{d=await request.json()}catch{return json({error:"Invalid JSON."},400)}
  const id=Number(d.id);if(!Number.isInteger(id)||id<1)return json({error:"Invalid ID."},400);
  const status=d.status==="published"?"published":"draft";const now=new Date().toISOString();
  const r=await env.DB.prepare("UPDATE news SET status=?, updated_at=?, published_at=CASE WHEN ?='published' THEN COALESCE(published_at,?) ELSE NULL END WHERE id=?").bind(status,now,status,now,id).run();
  return json({ok:true,changes:r.meta.changes||0});
}
export async function onRequestDelete({ request, env }) {
  const denied=await requireAuth(request,env);if(denied)return denied;
  if(!env.DB)return json({error:"D1 database binding DB is missing."},503);
  let d;try{d=await request.json()}catch{return json({error:"Invalid JSON."},400)}
  const id=Number(d.id);if(!Number.isInteger(id)||id<1)return json({error:"Invalid ID."},400);
  const r=await env.DB.prepare("DELETE FROM news WHERE id=?").bind(id).run();
  return json({ok:true,changes:r.meta.changes||0});
}
