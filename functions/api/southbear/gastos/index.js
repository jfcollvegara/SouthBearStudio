import {expensesQuery,normalizeExpense,validateProject,expenseDetail,expenseError,apiResponse,requestBody,audit} from '../../../../src/server/southbear-expenses.js';

export async function onRequestGet({env,request}){
  try{
    const db=env.SOUTHBEAR_DB,p=new URL(request.url).searchParams;
    const archived=p.get('archived')==='1',search=(p.get('q')||'').trim().slice(0,120),category=p.get('category')||'';
    const where=['e.archived_at IS '+(archived?'NOT NULL':'NULL')],args=[];
    if(search){where.push('(instr(lower(e.title),lower(?))>0 OR instr(lower(e.supplier_name),lower(?))>0 OR instr(lower(e.document_ref),lower(?))>0)');args.push(search,search,search);}
    if(category){if(!['software','materiales','subcontratacion','equipo','transporte','marketing','alojamiento','otros'].includes(category))return new Response(JSON.stringify({ok:false,error:'Filtro no válido.'}),{status:400,headers:{'Content-Type':'application/json'}});where.push('e.category=?');args.push(category);}
    const page=Math.min(10000,Math.max(1,parseInt(p.get('page')||'1',10)||1));
    const [list,sum]=await Promise.all([
      db.prepare(expensesQuery(where.join(' AND '))).bind(...args,(page-1)*50).all(),
      db.prepare('SELECT '+
        '(SELECT COALESCE(SUM(gross_cents),0) FROM expenses WHERE archived_at IS NULL) AS committed_cents,'+
        '(SELECT COALESCE(SUM(pay.amount_cents),0) FROM expense_payments pay WHERE pay.canceled_at IS NULL) AS paid_cents,'+
        '(SELECT COALESCE(SUM(pay.amount_cents),0) FROM expense_payments pay JOIN expenses e ON e.id=pay.expense_id WHERE pay.canceled_at IS NULL AND e.archived_at IS NULL) AS paid_active_cents,'+
        "(SELECT COALESCE(SUM(amount_cents),0) FROM expense_payments WHERE canceled_at IS NULL AND substr(paid_date,1,7)=strftime('%Y-%m','now')) AS paid_month_cents"
      ).first()
    ]);
    const items=list.results||[];
    return apiResponse({ok:true,items:items.slice(0,50),hasMore:items.length>50,summary:{
      recorded_paid_cents:sum.paid_cents,paid_month_cents:sum.paid_month_cents,
      committed_cents:sum.committed_cents,pending_cents:sum.committed_cents-sum.paid_active_cents
    }});
  }catch(error){return expenseError(error);}
}

export async function onRequestPost({env,request,data}){
  try{
    const db=env.SOUTHBEAR_DB;
    const expense=normalizeExpense(await requestBody(request,25000));
    await validateProject(db,expense.project_id);
    const id=crypto.randomUUID();
    const fields=['supplier_name','title','category','project_id','expense_date','due_date','document_ref','notes','gross_cents','vat_bps','base_cents','vat_cents'];
    const stmt=db.prepare('INSERT INTO expenses(id,'+fields.join(',')+') VALUES (?,'+fields.map(()=>'?').join(',')+')')
      .bind(id,...fields.map(f=>expense[f]));
    await db.batch([stmt,audit(db,'expense',id,'create',data.southbearUser,fields)]);
    return apiResponse({ok:true,item:await expenseDetail(db,id)},201);
  }catch(error){return expenseError(error);}
}
