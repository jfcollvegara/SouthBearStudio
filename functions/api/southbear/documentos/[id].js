import {documentDetail,documentError,apiResponse,apiError,validId,audit} from '../../../../src/server/southbear-documents.js';

export async function onRequestGet({env,params}){
  if(!validId(params.id))return apiError('Documento no válido.',400);
  try{
    const item=await documentDetail(env.SOUTHBEAR_DB,params.id);
    return item?apiResponse({ok:true,item}):apiError('Documento no encontrado.',404);
  }catch(e){return documentError(e);}
}
export async function onRequestPatch({env,params,request,data}){
  if(!validId(params.id))return apiError('Documento no válido.',400);
  try{
    if(!request.headers.get('content-type')?.startsWith('application/json'))return apiError('Formato no válido.',400);
    const input=await request.json();
    if(!input||Object.keys(input).length!==1||input.archived!==false)return apiError('Solo se permite restaurar con archived=false.',400);
    const db=env.SOUTHBEAR_DB,item=await documentDetail(db,params.id);
    if(!item)return apiError('Documento no encontrado.',404);
    if(!item.archived_at)return apiResponse({ok:true,item});
    await db.batch([
      db.prepare('UPDATE studio_documents SET archived_at=NULL WHERE id=?').bind(params.id),
      audit(db,'document',params.id,'restore',data.southbearUser,['archived_at'])
    ]);
    return apiResponse({ok:true,item:await documentDetail(db,params.id)});
  }catch(e){return documentError(e);}
}
export async function onRequestDelete({env,params,data}){
  if(!validId(params.id))return apiError('Documento no válido.',400);
  try{
    const db=env.SOUTHBEAR_DB,item=await documentDetail(db,params.id);
    if(!item)return apiError('Documento no encontrado.',404);
    if(item.archived_at)return apiResponse({ok:true,archived:true});
    await db.batch([
      db.prepare('UPDATE studio_documents SET archived_at=CURRENT_TIMESTAMP WHERE id=?').bind(params.id),
      audit(db,'document',params.id,'archive',data.southbearUser,['archived_at'])
    ]);
    return apiResponse({ok:true,archived:true});
  }catch(e){return documentError(e);}
}