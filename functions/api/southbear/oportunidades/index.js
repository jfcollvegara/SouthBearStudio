import {opportunityFields,opportunityColumns,normalizeOpportunity,validateOpportunityClient,opportunityDetail,opportunityError,apiResponse,apiError,requestBody,audit} from '../../../../src/server/southbear-opportunities.js';

export async function onRequestGet({env,request}){
 try{
  const params=new URL(request.url).searchParams,q=(params.get('q')||'').trim().slice(0,120),
   stage=params.get('stage')||'',archived=params.get('archived')==='1';
  if(stage&&!['nuevo','contactado','propuesta','negociacion','ganado','perdido'].includes(stage))return apiError('Etapa no válida.',400);
  const where=['o.archived_at IS '+(archived?'NOT NULL':'NULL')],args=[];
  if(stage){where.push('o.stage=?');args.push(stage);}
  if(q){where.push('(instr(lower(o.title),lower(?))>0 OR instr(lower(o.company_name),lower(?))>0 OR instr(lower(o.contact_name),lower(?))>0 OR instr(lower(o.email),lower(?))>0)');args.push(q,q,q,q);}
  const page=Math.min(10000,Math.max(1,Number.parseInt(params.get('page')||'1',10)||1));
  const db=env.SOUTHBEAR_DB;
  const [list,summary]=await Promise.all([
   db.prepare('SELECT '+opportunityColumns+' FROM sales_opportunities o LEFT JOIN clients c ON c.id=o.client_id LEFT JOIN quotes q ON q.id=o.quote_id WHERE '+where.join(' AND ')+' ORDER BY CASE o.stage WHEN "nuevo" THEN 0 WHEN "contactado" THEN 1 WHEN "propuesta" THEN 2 WHEN "negociacion" THEN 3 WHEN "ganado" THEN 4 ELSE 5 END, o.updated_at DESC LIMIT 51 OFFSET ?').bind(...args,(page-1)*50).all(),
   db.prepare(
     "SELECT COALESCE(SUM(CASE WHEN stage NOT IN ('ganado','perdido') THEN estimated_gross_cents ELSE 0 END),0) AS open_gross_cents,"+
     "COALESCE(SUM(CASE WHEN stage NOT IN ('ganado','perdido') THEN ROUND(estimated_gross_cents * probability / 100.0) ELSE 0 END),0) AS weighted_cents,"+
     "COALESCE(SUM(CASE WHEN stage NOT IN ('ganado','perdido') THEN 1 ELSE 0 END),0) AS open_count,"+
     "COALESCE(SUM(CASE WHEN stage='ganado' THEN 1 ELSE 0 END),0) AS won_count,"+
     "COALESCE(SUM(CASE WHEN stage NOT IN ('ganado','perdido') AND next_contact_date!='' AND next_contact_date < ? THEN 1 ELSE 0 END),0) AS overdue_count"+
     ' FROM sales_opportunities WHERE archived_at IS NULL'
   ).bind(new Date().toISOString().slice(0,10)).first()
  ]);
  const rows=list.results||[];
  return apiResponse({ok:true,items:rows.slice(0,50),hasMore:rows.length>50,summary});
 }catch(error){return opportunityError(error);}
}

export async function onRequestPost({env,request,data}){
 try{
  const db=env.SOUTHBEAR_DB,obj=normalizeOpportunity(await requestBody(request,27000));
  await validateOpportunityClient(db,obj);
  const id=crypto.randomUUID(),fields=opportunityFields;
  await db.batch([
   db.prepare('INSERT INTO sales_opportunities(id,'+fields.join(',')+') VALUES(?,'+fields.map(()=>'?').join(',')+')').bind(id,...fields.map(x=>obj[x])),
   audit(db,'opportunity',id,'create',data.southbearUser,fields)
  ]);
  return apiResponse({ok:true,item:await opportunityDetail(db,id)},201);
 }catch(error){return opportunityError(error);}
}
