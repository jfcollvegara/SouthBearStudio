import {apiResponse,apiError,dbError} from '../../../src/server/southbear-clients.js';
import {dateValue,InputError} from '../../../src/server/southbear-commerce.js';

// Movimientos: fechas de cobros y pagos anotados. Proyectos: cifras de toda su vida.
// Ningún indicador constituye una factura ni un resultado fiscal.
function monthsBetween(from,to){
  const months=[];
  let year=Number(from.slice(0,4)),month=Number(from.slice(5,7));
  const endYear=Number(to.slice(0,4)),endMonth=Number(to.slice(5,7));
  while(year<endYear||(year===endYear&&month<=endMonth)){
    months.push(String(year)+'-'+String(month).padStart(2,'0'));
    if(++month===13){month=1;year++;}
  }
  return months;
}
const receivedSql="SELECT substr(paid_date,1,7) AS month,COALESCE(SUM(amount_cents),0) AS cents FROM collection_receipts WHERE canceled_at IS NULL AND paid_date BETWEEN ? AND ? GROUP BY substr(paid_date,1,7)";
const paidSql="SELECT substr(paid_date,1,7) AS month,COALESCE(SUM(amount_cents),0) AS cents FROM expense_payments WHERE canceled_at IS NULL AND paid_date BETWEEN ? AND ? GROUP BY substr(paid_date,1,7)";
const costCategoriesSql="SELECT e.category,COALESCE(SUM(pay.amount_cents),0) AS paid_cents FROM expense_payments pay JOIN expenses e ON e.id=pay.expense_id WHERE pay.canceled_at IS NULL AND pay.paid_date BETWEEN ? AND ? GROUP BY e.category ORDER BY paid_cents DESC";
const projectCashCondition=[
  '(',
  'cp.project_id=p.id',
  'OR (cp.project_id IS NULL AND p.quote_id IS NOT NULL AND cp.quote_id=p.quote_id)',
  'OR (cp.project_id IS NULL AND cp.quote_id IS NULL AND EXISTS (',
  ' SELECT 1 FROM invoice_drafts d WHERE d.id=cp.draft_id AND',
  ' (d.project_id=p.id OR (d.project_id IS NULL AND p.quote_id IS NOT NULL AND d.quote_id=p.quote_id))',
  '))',
  ')'
].join(' ');
const projectsSql='SELECT '+
 'p.id,p.title,p.status,p.category,p.start_date,p.due_date,p.client_id,c.display_name AS client_name,q.code AS quote_code,'+
 "CASE WHEN q.status='aceptado' THEN q.total_cents ELSE NULL END AS approved_quote_cents,"+
 '(SELECT COUNT(*) FROM expenses e WHERE e.project_id=p.id AND e.archived_at IS NULL) AS expense_count,'+
 'COALESCE((SELECT SUM(e.gross_cents) FROM expenses e WHERE e.project_id=p.id AND e.archived_at IS NULL),0) AS expense_cents,'+
 'COALESCE((SELECT SUM(ep.amount_cents) FROM expense_payments ep JOIN expenses e ON e.id=ep.expense_id WHERE e.project_id=p.id AND ep.canceled_at IS NULL),0) AS paid_cost_cents,'+
 'COALESCE((SELECT SUM(cr.amount_cents) FROM collection_receipts cr JOIN collection_plans cp ON cp.id=cr.plan_id WHERE cr.canceled_at IS NULL AND '+projectCashCondition+'),0) AS received_cents'+
 ' FROM projects p JOIN clients c ON c.id=p.client_id LEFT JOIN quotes q ON q.id=p.quote_id'+
 ' WHERE p.archived_at IS NULL ORDER BY p.updated_at DESC LIMIT 501';

export async function onRequestGet({request,env}){
  try{
    const params=new URL(request.url).searchParams;
    const now=new Date().toISOString().slice(0,10);
    const from=dateValue(params.get('desde')||now.slice(0,4)+'-01-01','Fecha inicial',{required:true});
    const to=dateValue(params.get('hasta')||now,'Fecha final',{required:true});
    if(from>to)return apiError('La fecha inicial no puede ser posterior a la final.',400);
    const months=monthsBetween(from,to);
    if(months.length>24)return apiError('Selecciona un intervalo máximo de 24 meses.',400);
    const db=env.SOUTHBEAR_DB;
    const [incomeRows,expenseRows,categoriesRows,projectRows]=await Promise.all([
      db.prepare(receivedSql).bind(from,to).all(),
      db.prepare(paidSql).bind(from,to).all(),
      db.prepare(costCategoriesSql).bind(from,to).all(),
      db.prepare(projectsSql).all()
    ]);
    const income=new Map((incomeRows.results||[]).map(r=>[r.month,r.cents]));
    const expense=new Map((expenseRows.results||[]).map(r=>[r.month,r.cents]));
    const timeline=months.map(month=>{
      const received_cents=income.get(month)||0,paid_cents=expense.get(month)||0;
      return {month,received_cents,paid_cents,balance_cents:received_cents-paid_cents};
    });
    const received_cents=timeline.reduce((s,x)=>s+x.received_cents,0);
    const paid_cents=timeline.reduce((s,x)=>s+x.paid_cents,0);
    const allProjects=projectRows.results||[];
    const projects=allProjects.slice(0,500).map(p=>({
      ...p,
      estimated_margin_cents:p.approved_quote_cents===null?null:p.approved_quote_cents-p.expense_cents,
      cash_balance_cents:p.received_cents-p.paid_cost_cents
    }));
    return apiResponse({
      ok:true,period:{from,to},
      summary:{received_cents,paid_cents,balance_cents:received_cents-paid_cents,projects_count:projects.length},
      timeline,categories:categoriesRows.results||[],projects,projects_truncated:allProjects.length>500,
      definitions:{
        movements:'Entradas y pagos anotados por fecha, sin anulaciones, incluyendo movimientos de registros archivados.',
        project_margin:'Presupuesto aceptado con IVA menos gastos activos vinculados con IVA. Es una diferencia comercial orientativa, no un beneficio.',
        project_cash:'Cobros vinculados al proyecto, presupuesto o borrador menos pagos de gastos asociados, durante toda la vida del proyecto.'
      }
    });
  }catch(error){
    if(error instanceof InputError)return apiError(error.message,error.status);
    return dbError(error);
  }
}
