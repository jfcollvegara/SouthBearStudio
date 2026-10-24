import {plansSQL,normalizeNewPlan,planDetail,failCollection,apiResponse,requestBody,audit} from '../../../../src/server/southbear-collections.js';

export async function onRequestGet({env,request}){
  try{
    const db=env.SOUTHBEAR_DB,p=new URL(request.url).searchParams;
    const search=(p.get('q')||'').trim().slice(0,120),archived=p.get('archived')==='1';
    const where=['p.archived_at IS '+(archived?'NOT NULL':'NULL')],args=[];
    if(search){
      where.push('(instr(lower(p.title),lower(?))>0 OR instr(lower(c.display_name),lower(?))>0 OR instr(lower(q.code),lower(?))>0)');
      args.push(search,search,search);
    }
    const page=Math.min(10000,Math.max(1,Number.parseInt(p.get('page')||'1',10)||1));
    const [list,summary]=await Promise.all([
      db.prepare(plansSQL(where.join(' AND '))).bind(...args,(page-1)*50).all(),
      db.prepare('SELECT '+
         '(SELECT COALESCE(SUM(total_cents),0) FROM collection_plans WHERE archived_at IS NULL) AS planned_cents,'+
         '(SELECT COALESCE(SUM(r.amount_cents),0) FROM collection_receipts r JOIN collection_plans p ON p.id=r.plan_id WHERE r.canceled_at IS NULL AND p.archived_at IS NULL) AS paid_active_cents,'+
         '(SELECT COALESCE(SUM(amount_cents),0) FROM collection_receipts WHERE canceled_at IS NULL) AS collected_cents,'+
         '(SELECT COUNT(*) FROM collection_plans WHERE archived_at IS NULL) AS plan_count'
      ).first()
    ]);
    const rows=list.results||[];
    return apiResponse({ok:true,items:rows.slice(0,50),hasMore:rows.length>50,summary:{
      planned_cents:summary.planned_cents,
      received_cents:summary.collected_cents,
      pending_cents:summary.planned_cents-summary.paid_active_cents,
      active_plans:summary.plan_count
    }});
  }catch(error){return failCollection(error);}
}

export async function onRequestPost({env,request,data}){
  try{
    const db=env.SOUTHBEAR_DB,raw=await requestBody(request,30000);
    const plan=await normalizeNewPlan(db,raw);
    const id=crypto.randomUUID();
    const stmt=db.prepare(
      'INSERT INTO collection_plans(id,client_id,quote_id,project_id,draft_id,title,total_cents,advance_cents,advance_due_date,final_due_date,notes) VALUES (?,?,?,?,?,?,?,?,?,?,?)'
    ).bind(id,plan.client_id,plan.quote_id,plan.project_id,plan.draft_id,plan.title,plan.total_cents,plan.advance_cents,plan.advance_due_date,plan.final_due_date,plan.notes);
    await db.batch([stmt,audit(db,'collection_plan',id,'create',data.southbearUser,['client_id','quote_id','project_id','draft_id','total_cents','advance_cents','advance_due_date','final_due_date'])]);
    return apiResponse({ok:true,item:await planDetail(db,id)},201);
  }catch(error){return failCollection(error);}
}
