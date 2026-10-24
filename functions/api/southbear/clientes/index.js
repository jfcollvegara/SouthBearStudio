import {CLIENT_FIELDS,CLIENT_COLUMNS,normalizedClient,requestBody,logEvent,dbError,apiError,apiResponse}
  from '../../../../src/server/southbear-clients.js';

export async function onRequestGet(context){
  try{
    const u=new URL(context.request.url);
    const q=(u.searchParams.get('q')||'').trim().slice(0,120);
    const archived=u.searchParams.get('archived')==='1';
    const page=Math.min(10000,Math.max(1,Number.parseInt(u.searchParams.get('page')||'1',10)||1));
    const offset=(page-1)*50;
    const db=context.env.SOUTHBEAR_DB;
    const archivedWhere=archived?'archived_at IS NOT NULL':'archived_at IS NULL';
    const search=q?' AND (instr(lower(display_name),lower(?))>0 OR instr(lower(legal_name),lower(?))>0 OR instr(lower(email),lower(?))>0 OR instr(lower(tax_id),lower(?))>0)':'';
    const where='WHERE '+archivedWhere+search;
    const params=q?[q,q,q,q]:[];
    const sql='SELECT '+CLIENT_COLUMNS+' FROM clients '+where+' ORDER BY updated_at DESC, display_name COLLATE NOCASE ASC LIMIT 51 OFFSET ?';
    const result=await db.prepare(sql).bind(...params,offset).all();
    const rows=result.results||[];
    return apiResponse({ok:true,items:rows.slice(0,50),page,hasMore:rows.length>50});
  }catch(error){return dbError(error);}
}

export async function onRequestPost(context){
  try{
    const raw=await requestBody(context.request);
    const data=normalizedClient(raw);
    const id=crypto.randomUUID();
    const db=context.env.SOUTHBEAR_DB;
    const sql='INSERT INTO clients(id,'+CLIENT_FIELDS.join(',')+') VALUES ('+Array(CLIENT_FIELDS.length+1).fill('?').join(',')+')';
    const insert=db.prepare(sql).bind(id,...CLIENT_FIELDS.map(field=>data[field]));
    await db.batch([insert,logEvent(db,{subjectId:id,operation:'create',user:context.data.southbearUser,fields:CLIENT_FIELDS})]);
    const saved=await db.prepare('SELECT '+CLIENT_COLUMNS+' FROM clients WHERE id=?').bind(id).first();
    return apiResponse({ok:true,item:saved},201);
  }catch(error){
    if(error?.message&&/^(El |Los |Campo |Valor |Tipo |Indica |Introduce |La página web)/.test(error.message))return apiError(error.message,400);
    return dbError(error);
  }
}
