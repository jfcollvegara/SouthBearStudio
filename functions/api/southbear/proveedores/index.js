import {supplierCols,statColumns,supplierCategories,normalizeSupplier,supplierDetail,supplierError,apiResponse,apiError,requestBody,audit} from '../../../../src/server/southbear-suppliers.js';

export async function onRequestGet({request,env}){
 try{
  const p=new URL(request.url).searchParams,archived=p.get('archived')==='1',q=(p.get('q')||'').trim().slice(0,120);
  const cat=p.get('category')||'';
  const where=['s.archived_at IS '+(archived?'NOT NULL':'NULL')],args=[];
  if(cat){
   if(!supplierCategories.includes(cat))return apiError('Categoría de proveedor no válida.',400);
   where.push('s.service_category=?');args.push(cat);
  }
  if(q){where.push('(instr(lower(s.display_name),lower(?))>0 OR instr(lower(s.legal_name),lower(?))>0 OR instr(lower(s.tax_id),lower(?))>0 OR instr(lower(s.email),lower(?))>0)');args.push(q,q,q,q);}
  const page=Math.min(10000,Math.max(1,Number.parseInt(p.get('page')||'1',10)||1));
  const list=await env.SOUTHBEAR_DB.prepare('SELECT '+supplierCols+','+statColumns+' FROM suppliers s WHERE '+where.join(' AND ')+' ORDER BY s.display_name COLLATE NOCASE ASC LIMIT 51 OFFSET ?')
    .bind(...args,(page-1)*50).all();
  const items=list.results||[];
  return apiResponse({ok:true,items:items.slice(0,50),hasMore:items.length>50});
 }catch(error){return supplierError(error);}
}
export async function onRequestPost({request,env,data}){
 try{
  const obj=normalizeSupplier(await requestBody(request,28000)),db=env.SOUTHBEAR_DB;
  const id=crypto.randomUUID();
  const fields=Object.keys(obj);
  await db.batch([
   db.prepare('INSERT INTO suppliers(id,'+fields.join(',')+') VALUES (?,'+fields.map(()=>'?').join(',')+')').bind(id,...fields.map(x=>obj[x])),
   audit(db,'supplier',id,'create',data.southbearUser,fields)
  ]);
  return apiResponse({ok:true,item:await supplierDetail(db,id)},201);
 }catch(error){return supplierError(error);}
}
