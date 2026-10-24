import {serviceColumns,serviceFields,normalizeService,serviceDetail,serviceError,recordPrice,apiResponse,apiError,requestBody,audit} from '../../../../src/server/southbear-catalog.js';

export async function onRequestGet({request,env}){
  try{
    const p=new URL(request.url).searchParams;
    const archived=p.get('archived')==='1',q=(p.get('q')||'').trim().slice(0,120);
    const category=p.get('category')||'',kind=p.get('kind')||'';
    if(category&&!['diseno','web','audiovisual','otro'].includes(category))return apiError('Categoría no válida.',400);
    if(kind&&!['servicio','paquete','extra'].includes(kind))return apiError('Tipo de servicio no válido.',400);
    const where=['archived_at IS '+(archived?'NOT NULL':'NULL')],args=[];
    if(category){where.push('category=?');args.push(category);}
    if(kind){where.push('service_kind=?');args.push(kind);}
    if(q){where.push('(instr(lower(name),lower(?))>0 OR instr(lower(description),lower(?))>0)');args.push(q,q);}
    const page=Math.min(10000,Math.max(1,Number.parseInt(p.get('page')||'1',10)||1));
    const all=await env.SOUTHBEAR_DB.prepare('SELECT '+serviceColumns+' FROM studio_services WHERE '+where.join(' AND ')+' ORDER BY sort_order ASC,name COLLATE NOCASE ASC LIMIT 51 OFFSET ?')
      .bind(...args,(page-1)*50).all();
    const rows=all.results||[];
    return apiResponse({ok:true,items:rows.slice(0,50),hasMore:rows.length>50});
  }catch(error){return serviceError(error);}
}
export async function onRequestPost({request,env,data}){
  try{
    const db=env.SOUTHBEAR_DB,obj=normalizeService(await requestBody(request,22000));
    const id=crypto.randomUUID();
    const stmt=db.prepare('INSERT INTO studio_services(id,'+serviceFields.join(',')+') VALUES(?,'+serviceFields.map(()=>'?').join(',')+')')
      .bind(id,...serviceFields.map(k=>obj[k]));
    await db.batch([
      stmt,recordPrice(db,id,obj,data.southbearUser),
      audit(db,'service',id,'create',data.southbearUser,serviceFields)
    ]);
    return apiResponse({ok:true,item:await serviceDetail(db,id)},201);
  }catch(error){return serviceError(error);}
}
