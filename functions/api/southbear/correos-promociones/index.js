import {apiResponse,apiError,dbError} from '../../../../src/server/southbear-clients.js';

export async function onRequestGet({request,env}){
  try{
    const url=new URL(request.url);
    const q=(url.searchParams.get('q')||'').trim().slice(0,120);
    const page=Math.min(10000,Math.max(1,parseInt(url.searchParams.get('page')||'1',10)||1));
    const where=q?'WHERE instr(lower(email),lower(?))>0 OR instr(lower(name),lower(?))>0 OR instr(lower(company),lower(?))>0 OR instr(phone,?)>0':'';
    const stmt=env.SOUTHBEAR_DB.prepare('SELECT email,name,phone,company,consent_at,updated_at FROM sb_promotion_contacts '+where+' ORDER BY consent_at DESC LIMIT 51 OFFSET ?').bind(...(q?[q,q,q,q]:[]),(page-1)*50);
    const rows=(await stmt.all()).results||[];
    return apiResponse({ok:true,items:rows.slice(0,50),hasMore:rows.length>50,page});
  }catch(error){return dbError(error);}
}

export async function onRequestDelete({request,env}){
  try{
    const body=await request.json();
    const email=typeof body?.email==='string'?body.email.trim().toLowerCase():'';
    if(!email||email.length>180)return apiError('Correo no válido.',400);
    await env.SOUTHBEAR_DB.prepare('DELETE FROM sb_promotion_contacts WHERE email=?').bind(email).run();
    return apiResponse({ok:true});
  }catch(error){return dbError(error);}
}
