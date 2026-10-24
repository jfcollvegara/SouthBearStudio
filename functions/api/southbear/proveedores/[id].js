import {supplierFields,normalizeSupplier,supplierDetail,supplierError,apiResponse,apiError,requestBody,validId,audit} from '../../../../src/server/southbear-suppliers.js';
export async function onRequestGet({env,params}){
 if(!validId(params.id))return apiError('Proveedor no válido.',400);
 try{
  const item=await supplierDetail(env.SOUTHBEAR_DB,params.id);
  return item?apiResponse({ok:true,item}):apiError('Proveedor no encontrado.',404);
 }catch(error){return supplierError(error);}
}
export async function onRequestPatch({env,request,params,data}){
 if(!validId(params.id))return apiError('Proveedor no válido.',400);
 try{
  const db=env.SOUTHBEAR_DB,raw=await requestBody(request,28000);
  const old=await supplierDetail(db,params.id);
  if(!old)return apiError('Proveedor no encontrado.',404);
  if(old.archived_at){
   if(Object.keys(raw).length!==1||raw.archived!==false)return apiError('Restaura el proveedor para editarlo.',409);
   await db.batch([
    db.prepare('UPDATE suppliers SET archived_at=NULL,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(old.id),
    audit(db,'supplier',old.id,'restore',data.southbearUser,['archived_at'])
   ]);
   return apiResponse({ok:true,item:await supplierDetail(db,old.id)});
  }
  if(Object.keys(raw).includes('archived'))return apiError('Operación no permitida.',400);
  const obj=normalizeSupplier(raw);
  await db.batch([
   db.prepare('UPDATE suppliers SET '+supplierFields.map(k=>k+'=?').join(',')+',updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(...supplierFields.map(k=>obj[k]),old.id),
   audit(db,'supplier',old.id,'update',data.southbearUser,supplierFields)
  ]);
  // Los gastos históricos conservan el nombre que figuraba al registrarlos.
  return apiResponse({ok:true,item:await supplierDetail(db,old.id)});
 }catch(error){return supplierError(error);}
}
export async function onRequestDelete({env,params,data}){
 if(!validId(params.id))return apiError('Proveedor no válido.',400);
 try{
  const db=env.SOUTHBEAR_DB,old=await supplierDetail(db,params.id);
  if(!old)return apiError('Proveedor no encontrado.',404);
  if(old.archived_at)return apiResponse({ok:true,archived:true});
  await db.batch([
   db.prepare('UPDATE suppliers SET archived_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(old.id),
   audit(db,'supplier',old.id,'archive',data.southbearUser,['archived_at'])
  ]);
  return apiResponse({ok:true,archived:true});
 }catch(error){return supplierError(error);}
}
