import {normalizeQuote,quoteInserts,quoteDetail,ensureClient,audit,requestBody,validId,apiError,apiResponse,fail,InputError}
  from '../../../../src/server/southbear-commerce.js';
const states={borrador:['enviado','aceptado','rechazado','caducado'],enviado:['aceptado','rechazado','caducado'],aceptado:[],rechazado:[],caducado:[]};
export async function onRequestGet({params,env}){
  if(!validId(params.id))return apiError('Identificador no válido.');
  try{const item=await quoteDetail(env.SOUTHBEAR_DB,params.id);return item?apiResponse({ok:true,item}):apiError('Presupuesto no encontrado.',404);}
  catch(e){return fail(e);}
}
export async function onRequestPatch({params,request,env,data}){
  if(!validId(params.id))return apiError('Identificador no válido.');
  try{
    const db=env.SOUTHBEAR_DB,raw=await requestBody(request,80000),old=await quoteDetail(db,params.id);
    if(!old)return apiError('Presupuesto no encontrado.',404);
    if(old.archived_at){
      if(raw.archived!==false)return apiError('Restaura el presupuesto antes de modificarlo.',409);
      await db.batch([db.prepare('UPDATE quotes SET archived_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(old.id),audit(db,'quote',old.id,'restore',data.southbearUser,['archived_at'])]);
      return apiResponse({ok:true,item:await quoteDetail(db,old.id)});
    }
    const keys=Object.keys(raw);
    if(keys.length===1&&keys[0]==='status'){
      if(typeof raw.status!=='string'||!states[old.status]?.includes(raw.status))return apiError('Transición de estado no permitida.',409);
      const linked=raw.status==='aceptado'
        ?await db.prepare("SELECT id,stage FROM sales_opportunities WHERE quote_id=? AND archived_at IS NULL").bind(old.id).first()
        :null;
      await db.batch([
        db.prepare('UPDATE quotes SET status=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(raw.status,old.id),
        ...(linked?[
          db.prepare("UPDATE sales_opportunities SET stage='ganado',probability=100,next_contact_date='',loss_reason='',updated_at=CURRENT_TIMESTAMP WHERE id=?").bind(linked.id),
          audit(db,'opportunity',linked.id,'update',data.southbearUser,['stage','probability'])
        ]:[]),
        audit(db,'quote',old.id,'update',data.southbearUser,['status'])
      ]);
      return apiResponse({ok:true,item:await quoteDetail(db,old.id)});
    }
    if(old.status!=='borrador')return apiError('Solo se puede modificar el contenido de presupuestos en borrador.',409);
    const obj=normalizeQuote(raw);
    if(obj.client_id!==old.client_id)throw new InputError('El cliente de un presupuesto existente no puede cambiarse.');
    await ensureClient(db,obj.client_id);
    const stmt=db.prepare('UPDATE quotes SET title=?,issue_date=?,valid_until=?,notes=?,subtotal_cents=?,tax_cents=?,total_cents=?,updated_at=CURRENT_TIMESTAMP WHERE id=?')
      .bind(obj.title,obj.issue_date,obj.valid_until,obj.notes,obj.subtotal_cents,obj.tax_cents,obj.total_cents,old.id);
    await db.batch([db.prepare('DELETE FROM quote_lines WHERE quote_id=?').bind(old.id),stmt,...quoteInserts(db,old.id,obj.lines),audit(db,'quote',old.id,'update',data.southbearUser,['lines','title','issue_date','valid_until','notes'])]);
    return apiResponse({ok:true,item:await quoteDetail(db,old.id)});
  }catch(e){return fail(e);}
}
export async function onRequestDelete({params,env,data}){
  if(!validId(params.id))return apiError('Identificador no válido.');
  try{
    const db=env.SOUTHBEAR_DB,old=await quoteDetail(db,params.id);
    if(!old)return apiError('Presupuesto no encontrado.',404);
    if(old.archived_at)return apiResponse({ok:true,archived:true});
    if(old.status==='aceptado')return apiError('No se puede archivar un presupuesto aceptado.',409);
    await db.batch([db.prepare('UPDATE quotes SET archived_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(old.id),audit(db,'quote',old.id,'archive',data.southbearUser,['archived_at'])]);
    return apiResponse({ok:true,archived:true});
  }catch(e){return fail(e);}
}
