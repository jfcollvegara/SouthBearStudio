import {documentsQuery,documentColumns,documentDetail,documentError,apiResponse,apiError,validId,audit,DOCUMENT_MAX_BYTES,safeFileName,checkSignature,validateNewDocument,sha256,bucketMissing} from '../../../../src/server/southbear-documents.js';

export async function onRequestGet({request,env}){
  try{
    const p=new URL(request.url).searchParams;
    const q=(p.get('q')||'').trim().slice(0,120),category=p.get('category')||'';
    const archived=p.get('archived')==='1';
    const kind=p.get('link_type')||'',linkId=p.get('link_id')||'';
    if(category&&!['contrato','entregable','justificante','autorizacion','otro'].includes(category))return apiError('Categoría no válida.',400);
    const where=['d.archived_at IS '+(archived?'NOT NULL':'NULL')],args=[];
    if(q){where.push('(instr(lower(d.title),lower(?))>0 OR instr(lower(d.original_name),lower(?))>0)');args.push(q,q);}
    if(category){where.push('d.category=?');args.push(category);}
    if(kind||linkId){
      const cols={cliente:'client_id',proyecto:'project_id',presupuesto:'quote_id',gasto:'expense_id'};
      if(!cols[kind]||!validId(linkId))return apiError('Filtro de documento no válido.',400);
      where.push('d.'+cols[kind]+'=?');args.push(linkId);
    }
    const page=Math.min(10000,Math.max(1,parseInt(p.get('page')||'1',10)||1));
    const r=await env.SOUTHBEAR_DB.prepare(documentsQuery(where.join(' AND '))).bind(...args,(page-1)*50).all();
    const records=r.results||[];
    return apiResponse({ok:true,items:records.slice(0,50),hasMore:records.length>50});
  }catch(e){return documentError(e);}
}

export async function onRequestPost({request,env,data}){
  if(bucketMissing(env))return apiError('El almacenamiento privado todavía no está habilitado. Es necesario activar R2 y vincular SOUTHBEAR_FILES.',503);
  try{
    const type=request.headers.get('content-type')||'';
    if(!type.toLowerCase().startsWith('multipart/form-data'))return apiError('La subida debe ser multipart/form-data.',400);
    const byteLength=Number(request.headers.get('content-length')||0);
    if(byteLength>DOCUMENT_MAX_BYTES+65536)return apiError('Archivo demasiado grande. Máximo 10 MiB.',413);
    const form=await request.formData();
    const file=form.get('file');
    if(!file||typeof file.arrayBuffer!=='function'||typeof file.name!=='string')return apiError('Selecciona un archivo válido.',400);
    if(!Number.isSafeInteger(file.size)||file.size<1||file.size>DOCUMENT_MAX_BYTES)return apiError('El archivo debe ocupar entre 1 byte y 10 MiB.',413);
    const meta=await validateNewDocument(env.SOUTHBEAR_DB,{
      title:form.get('title'),notes:form.get('notes'),category:form.get('category'),
      link_type:form.get('link_type'),link_id:form.get('link_id')
    });
    const original=safeFileName(file.name);
    const content=await file.arrayBuffer();
    if(content.byteLength!==file.size||!checkSignature(content,original.extension))return apiError('La firma del archivo no coincide con un formato permitido.',400);
    const checksum=await sha256(content);
    const id=crypto.randomUUID();
    const key='private/'+new Date().toISOString().slice(0,7).replace('-','/')+'/'+id;
    const stored=await env.SOUTHBEAR_FILES.put(key,content,{httpMetadata:{contentType:'application/octet-stream'},customMetadata:{sha256:checksum}});
    if(!stored)return apiError('No se ha podido guardar el archivo en el almacenamiento privado.',503);
    try{
      const fields=['title','category','original_name','mime_type','size_bytes','checksum_sha256','object_key','client_id','project_id','quote_id','expense_id','notes','uploaded_by'];
      const payload={...meta,original_name:original.name,mime_type:original.mime,size_bytes:content.byteLength,checksum_sha256:checksum,object_key:key,uploaded_by:data.southbearUser.email};
      await env.SOUTHBEAR_DB.batch([
        env.SOUTHBEAR_DB.prepare('INSERT INTO studio_documents(id,'+fields.join(',')+') VALUES(?,'+fields.map(()=>'?').join(',')+')').bind(id,...fields.map(f=>payload[f])),
        audit(env.SOUTHBEAR_DB,'document',id,'create',data.southbearUser,['file','category','title','link'])
      ]);
    }catch(err){
      await env.SOUTHBEAR_FILES.delete(key).catch(()=>{});
      throw err;
    }
    return apiResponse({ok:true,item:await documentDetail(env.SOUTHBEAR_DB,id)},201);
  }catch(e){return documentError(e);}
}
