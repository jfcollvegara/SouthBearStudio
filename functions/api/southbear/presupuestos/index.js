import {quoteColumns,normalizeQuote,ensureClient,quoteInserts,quoteDetail,audit,requestBody,apiError,apiResponse,fail}
  from '../../../../src/server/southbear-commerce.js';
import {validId} from '../../../../src/server/southbear-clients.js';

export async function onRequestGet({request,env}){
  try{
    const p=new URL(request.url).searchParams;
    const search=(p.get('q')||'').trim().slice(0,120),archived=p.get('archived')==='1',status=p.get('status')||'';
    if(status&&!['borrador','enviado','aceptado','rechazado','caducado'].includes(status))return apiError('Filtro no válido.');
    const conditions=['q.archived_at IS '+(archived?'NOT NULL':'NULL')],args=[];
    if(status){conditions.push('q.status=?');args.push(status);}
    if(search){conditions.push('(instr(lower(q.title),lower(?))>0 OR instr(lower(q.code),lower(?))>0 OR instr(lower(c.display_name),lower(?))>0)');args.push(search,search,search);}
    const page=Math.min(10000,Math.max(1,Number.parseInt(p.get('page')||'1',10)||1));
    const sql='SELECT '+quoteColumns+' FROM quotes q JOIN clients c ON c.id=q.client_id WHERE '+conditions.join(' AND ')+' ORDER BY q.created_at DESC LIMIT 51 OFFSET ?';
    const res=await env.SOUTHBEAR_DB.prepare(sql).bind(...args,(page-1)*50).all();
    const rows=res.results||[];
    return apiResponse({ok:true,items:rows.slice(0,50),hasMore:rows.length>50});
  }catch(e){return fail(e);}
}
export async function onRequestPost({request,env,data}){
  try{
    const raw=await requestBody(request,80000),obj=normalizeQuote(raw),db=env.SOUTHBEAR_DB;
    await ensureClient(db,obj.client_id);
    const oppId=raw.opportunity_id||null;
    if(oppId){
      if(!validId(oppId))return apiError('Oportunidad de origen no válida.',400);
      const opp=await db.prepare('SELECT id,client_id,quote_id,stage,archived_at FROM sales_opportunities WHERE id=?').bind(oppId).first();
      if(!opp||opp.archived_at||opp.client_id!==obj.client_id||opp.quote_id||['ganado','perdido'].includes(opp.stage))
        return apiError('La oportunidad debe estar activa, vinculada a este cliente y sin presupuesto anterior.',409);
    }
    const id=crypto.randomUUID(),code='PRE-'+obj.issue_date.slice(0,4)+'-'+id.slice(0,8).toUpperCase();
    const stmt=db.prepare('INSERT INTO quotes(id,code,client_id,title,issue_date,valid_until,notes,subtotal_cents,tax_cents,total_cents) VALUES (?,?,?,?,?,?,?,?,?,?)')
      .bind(id,code,obj.client_id,obj.title,obj.issue_date,obj.valid_until,obj.notes,obj.subtotal_cents,obj.tax_cents,obj.total_cents);
    await db.batch([
      stmt,...quoteInserts(db,id,obj.lines),
      ...(oppId?[db.prepare("UPDATE sales_opportunities SET quote_id=?,stage='propuesta',updated_at=CURRENT_TIMESTAMP WHERE id=? AND quote_id IS NULL AND archived_at IS NULL").bind(id,oppId),
      audit(db,'opportunity',oppId,'update',data.southbearUser,['quote_id','stage'])]:[]),
      audit(db,'quote',id,'create',data.southbearUser,['lines','title','client_id'])
    ]);
    return apiResponse({ok:true,item:await quoteDetail(db,id)},201);
  }catch(e){return fail(e);}
}
