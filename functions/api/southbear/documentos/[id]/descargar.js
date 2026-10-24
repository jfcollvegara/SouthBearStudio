import {documentDetail,apiError,validId,bucketMissing} from '../../../../../src/server/southbear-documents.js';
export async function onRequestGet({env,params,data}){
  if(!validId(params.id))return apiError('Documento no válido.',400);
  if(bucketMissing(env))return apiError('El almacenamiento privado no está configurado.',503);
  try{
    const item=await documentDetail(env.SOUTHBEAR_DB,params.id,true);
    if(!item)return apiError('Documento no encontrado.',404);
    const object=await env.SOUTHBEAR_FILES.get(item.object_key);
    if(!object)return apiError('No se ha encontrado el archivo. Los metadatos se han conservado.',503);
    // Nunca renderizamos documentos aportados por usuarios en el origen del panel.
    const ascii=item.original_name.replace(/[^a-z0-9._-]/gi,'_').slice(0,110).replace(/"/g,'_')||'documento';
    const encoded=encodeURIComponent(item.original_name);
    const headers=new Headers({
      'Content-Type':'application/octet-stream',
      'Content-Disposition':'attachment; filename="'+ascii+'"; filename*=UTF-8\\'\\''+encoded,
      'Cache-Control':'private, no-store, max-age=0',
      'X-Content-Type-Options':'nosniff',
      'Content-Security-Policy':'sandbox',
      'X-Robots-Tag':'noindex, nofollow',
      'Content-Length':String(object.size)
    });
    return new Response(object.body,{status:200,headers});
  }catch(e){
    console.error('Private file download failed:',e?.message||'unknown');
    return apiError('No se ha podido descargar el documento.',503);
  }
}