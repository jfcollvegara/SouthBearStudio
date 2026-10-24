import {apiResponse,dbError} from '../../../src/server/southbear-clients.js';

// Resumen basado únicamente en registros reales; no infiere facturación
// desde presupuestos (un presupuesto NO constituye un ingreso).
export async function onRequestGet({env}){
  try{
    const db=env.SOUTHBEAR_DB;
    const [clients,quotes,projects,activity]=await Promise.all([
      db.prepare('SELECT COUNT(*) AS count FROM clients WHERE archived_at IS NULL').first(),
      db.prepare("SELECT COUNT(*) AS count FROM quotes WHERE archived_at IS NULL AND status IN ('borrador','enviado')").first(),
      db.prepare("SELECT COUNT(*) AS count FROM projects WHERE archived_at IS NULL AND status IN ('planificado','en_curso','en_revision')").first(),
      db.prepare("SELECT kind,id,title,status,updated_at FROM (SELECT 'cliente' AS kind,id,display_name AS title,'' AS status,updated_at FROM clients WHERE archived_at IS NULL UNION ALL SELECT 'presupuesto',id,title,status,updated_at FROM quotes WHERE archived_at IS NULL UNION ALL SELECT 'proyecto',id,title,status,updated_at FROM projects WHERE archived_at IS NULL) ORDER BY updated_at DESC LIMIT 8").all()
    ]);
    return apiResponse({ok:true,metrics:{clients:clients.count,quotes_pending:quotes.count,projects_active:projects.count},activity:activity.results||[],financials_ready:false});
  }catch(error){return dbError(error);}
}
