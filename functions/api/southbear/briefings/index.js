import {BRIEFING_SERVICES,BRIEFING_QUESTIONS,activeBriefingQuestions} from '../../../../src/data/briefing-questions.js';
import {apiError,apiResponse,requestBody,dbError} from '../../../../src/server/southbear-clients.js';

const questionIds=new Set(activeBriefingQuestions().map(q=>q.id));
const services=new Set(BRIEFING_SERVICES.map(s=>s.id));
const invalid=text=>/[\u0000-\u001f\u007f]/.test(text);
const validId=id=>typeof id==='string'&&/^[\da-f-]{36}$/i.test(id);
function token(){
 const raw=crypto.getRandomValues(new Uint8Array(32));
 return btoa(String.fromCharCode(...raw)).replace(/\+/g,'-').replace(/\//g,'_').replace(/=+$/,'');
}
export async function onRequestGet({env}){
 try{
  const result=await env.SOUTHBEAR_DB.prepare(
    'SELECT id,token,company_name,service_slug,title,question_ids,answers_json,status,created_at,submitted_at,closed_at FROM sb_briefing_forms ORDER BY created_at DESC LIMIT 300'
  ).all();
  return apiResponse({ok:true,items:(result.results||[]).map(row=>({
    ...row,question_ids:JSON.parse(row.question_ids),
    answers:row.answers_json?JSON.parse(row.answers_json):null,answers_json:undefined
  }))});
 }catch(error){return dbError(error);}
}
export async function onRequestPost({request,env}){
 let data;
 try{data=await requestBody(request,16000);}catch(e){return apiError(e.message,400);}
 const company_name=typeof data.company_name==='string'?data.company_name.trim():'';
 const title=typeof data.title==='string'?data.title.trim():'';
 const service_slug=data.service_slug;
 const selected=data.question_ids;
 if(!company_name||company_name.length>160||invalid(company_name))return apiError('Escribe el nombre de la empresa o profesional (máximo 160 caracteres).',400);
 if(title.length>180||invalid(title))return apiError('El título del briefing no es válido.',400);
 if(!services.has(service_slug))return apiError('Selecciona un servicio válido.',400);
 if(!Array.isArray(selected)||selected.length<1||selected.length>BRIEFING_QUESTIONS.length||selected.some(id=>typeof id!=='string'||!questionIds.has(id))||new Set(selected).size!==selected.length)
   return apiError('Selecciona preguntas válidas.',400);
 const permitted=new Set(BRIEFING_SERVICES.find(s=>s.id===service_slug).sections);
 if(selected.some(id=>!permitted.has(BRIEFING_QUESTIONS.find(q=>q.id===id)?.section)))
   return apiError('Las preguntas deben corresponder al servicio seleccionado.',400);
 const sorted=BRIEFING_QUESTIONS.filter(q=>!q.legacy&&selected.includes(q.id)).map(q=>q.id);
 const id=crypto.randomUUID(),secret=token(),label=title||'Briefing de '+BRIEFING_SERVICES.find(s=>s.id===service_slug).label;
 try{
  await env.SOUTHBEAR_DB.prepare(
   'INSERT INTO sb_briefing_forms (id,token,company_name,service_slug,title,question_ids) VALUES (?,?,?,?,?,?)'
  ).bind(id,secret,company_name,service_slug,label,JSON.stringify(sorted)).run();
  return apiResponse({ok:true,item:{id,token:secret,company_name,service_slug,title:label,question_ids:sorted,status:'pendiente',url:'https://southbearstudio.com/briefing/?token='+encodeURIComponent(secret)}},201);
 }catch(error){return dbError(error);}
}
export async function onRequestPatch({request,env}){
 let data;try{data=await requestBody(request,3000);}catch(e){return apiError(e.message,400);}
 if(!validId(data.id)||!['revocar','reactivar','cerrar'].includes(data.action))return apiError('Acción no válida.',400);
 const transitions={
  revocar:{from:['pendiente'],to:'revocado'},
  reactivar:{from:['revocado'],to:'pendiente'},
  cerrar:{from:['recibido'],to:'cerrado'}
 };
 const change=transitions[data.action];
 try{
  const row=await env.SOUTHBEAR_DB.prepare('SELECT status FROM sb_briefing_forms WHERE id=?').bind(data.id).first();
  if(!row)return apiError('No se ha encontrado el formulario.',404);
  if(!change.from.includes(row.status))return apiError('No se puede realizar esa acción en el estado actual.',409);
  const result=await env.SOUTHBEAR_DB.prepare(
   "UPDATE sb_briefing_forms SET status=?,updated_at=CURRENT_TIMESTAMP,closed_at=CASE WHEN ?='cerrado' THEN CURRENT_TIMESTAMP ELSE closed_at END WHERE id=? AND status=?"
  ).bind(change.to,change.to,data.id,row.status).run();
  if(!result.meta?.changes)return apiError('El formulario ha cambiado de estado. Actualiza la página.',409);
  return apiResponse({ok:true,status:change.to});
 }catch(error){return dbError(error);}
}
