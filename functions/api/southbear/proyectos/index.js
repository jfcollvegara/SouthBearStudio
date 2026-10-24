import {projectFields,projectColumns,normalizeProject,ensureClient,ensureQuoteLink,audit,requestBody,apiError,apiResponse,fail}
  from '../../../../src/server/southbear-commerce.js';

export async function onRequestGet({request,env}){
  try{
    const p=new URL(request.url).searchParams;
    const q=(p.get('q')||'').trim().slice(0,120),archived=p.get('archived')==='1';
    const status=p.get('status')||'';
    const offset=(Math.min(10000,Math.max(1,Number.parseInt(p.get('page')||'1',10)||1))-1)*50;
    const allowed=['planificado','en_curso','en_revision','entregado','cancelado'];
    if(status&&!allowed.includes(status))return apiError('Filtro no válido.');
    const cond=['p.archived_at IS '+(archived?'NOT NULL':'NULL')];
    const args=[];
    if(status){cond.push('p.status=?');args.push(status);}
    if(q){cond.push('(instr(lower(p.title),lower(?))>0 OR instr(lower(c.display_name),lower(?))>0)');args.push(q,q);}
    const sql='SELECT '+projectColumns+' FROM projects p JOIN clients c ON c.id=p.client_id LEFT JOIN quotes q ON q.id=p.quote_id WHERE '+cond.join(' AND ')+' ORDER BY p.updated_at DESC LIMIT 51 OFFSET ?';
    const result=await env.SOUTHBEAR_DB.prepare(sql).bind(...args,offset).all();
    const rows=result.results||[];
    return apiResponse({ok:true,items:rows.slice(0,50),hasMore:rows.length>50});
  }catch(e){return fail(e);}
}
export async function onRequestPost({request,env,data}){
  try{
    const raw=await requestBody(request),obj=normalizeProject(raw),db=env.SOUTHBEAR_DB;
    await ensureClient(db,obj.client_id);
    await ensureQuoteLink(db,obj.quote_id,obj.client_id);
    const id=crypto.randomUUID();
    const stmt=db.prepare('INSERT INTO projects(id,'+projectFields.join(',')+') VALUES ('+Array(projectFields.length+1).fill('?').join(',')+')').bind(id,...projectFields.map(f=>obj[f]));
    await db.batch([stmt,audit(db,'project',id,'create',data.southbearUser,projectFields)]);
    const item=await db.prepare('SELECT '+projectColumns+' FROM projects p JOIN clients c ON c.id=p.client_id LEFT JOIN quotes q ON q.id=p.quote_id WHERE p.id=?').bind(id).first();
    return apiResponse({ok:true,item},201);
  }catch(e){return fail(e);}
}
