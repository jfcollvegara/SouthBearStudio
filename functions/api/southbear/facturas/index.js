import {listSQL,normalizeDraft,validateReferences,insertDraftLines,draftDetail,draftError,apiResponse,apiError,audit} from '../../../../src/server/southbear-invoice-drafts.js';

export async function onRequestGet({request,env}){
  try{
    const params=new URL(request.url).searchParams;
    const search=(params.get('q')||'').trim().slice(0,120);
    const archived=params.get('archived')==='1';
    const conditions=['d.archived_at IS '+(archived?'NOT NULL':'NULL')],args=[];
    if(search){
      conditions.push('(instr(lower(d.title),lower(?))>0 OR instr(lower(d.reference),lower(?))>0 OR instr(lower(c.display_name),lower(?))>0)');
      args.push(search,search,search);
    }
    const page=Math.min(10000,Math.max(1,Number.parseInt(params.get('page')||'1',10)||1));
    const res=await env.SOUTHBEAR_DB.prepare(listSQL(conditions.join(' AND '))).bind(...args,(page-1)*50).all();
    const rows=res.results||[];
    return apiResponse({ok:true,items:rows.slice(0,50),hasMore:rows.length>50});
  }catch(error){return draftError(error);}
}

export async function onRequestPost({request,env,data}){
  try{
    const raw=await (await import('../../../../src/server/southbear-clients.js')).requestBody(request,80000);
    const obj=normalizeDraft(raw),db=env.SOUTHBEAR_DB;
    await validateReferences(db,obj);
    const id=crypto.randomUUID();
    // Numeración NO fiscal y claramente diferente de cualquier factura.
    const reference='BOR-'+obj.planned_date.slice(0,4)+'-'+id.slice(0,8).toUpperCase();
    const stmt=db.prepare(
      'INSERT INTO invoice_drafts(id,reference,client_id,quote_id,project_id,title,planned_date,due_date,notes,subtotal_cents,tax_cents,total_cents) VALUES (?,?,?,?,?,?,?,?,?,?,?,?)'
    ).bind(id,reference,obj.client_id,obj.quote_id,obj.project_id,obj.title,obj.planned_date,obj.due_date,obj.notes,obj.subtotal_cents,obj.tax_cents,obj.total_cents);
    await db.batch([
      stmt,...insertDraftLines(db,id,obj.lines),
      audit(db,'invoice_draft',id,'create',data.southbearUser,['client_id','quote_id','project_id','title','lines'])
    ]);
    return apiResponse({ok:true,item:await draftDetail(db,id)},201);
  }catch(error){return draftError(error);}
}
