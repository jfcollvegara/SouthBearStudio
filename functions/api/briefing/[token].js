import {BRIEFING_QUESTIONS,BRIEFING_SERVICES} from '../../../src/data/briefing-questions.js';
import {apiError,apiResponse} from '../../../src/server/southbear-access.js';

const validToken=x=>typeof x==='string'&&/^[a-zA-Z0-9_-]{43}$/.test(x);
function getQuestion(id){return BRIEFING_QUESTIONS.find(q=>q.id===id);}
function cleanAnswers(selected,input){
 if(!input||typeof input!=='object'||Array.isArray(input))throw Error('No se han recibido respuestas válidas.');
 const out={};
 for(const id of selected){
  const question=getQuestion(id);if(!question)throw Error('Pregunta no reconocida.');
  const value=input[id];
  if(question.type==='multi'){
   const a=value==null?[]:value;
   if(!Array.isArray(a)||a.length>(question.max||question.options.length)||new Set(a).size!==a.length||a.some(x=>typeof x!=='string'||!question.options.includes(x)))throw Error('Selección no válida en: '+question.label);
   if(question.required&&!a.length)throw Error('Responde a: '+question.label);
   out[id]=a;
  }else{
   const v=value==null?'':value;
   if(typeof v!=='string'||v.length>3000||/[\u0000-\u0008\u000b\u000c\u000e-\u001f\u007f]/.test(v))throw Error('Respuesta demasiado larga o no válida.');
   const text=v.trim();
   if(question.type==='single'&&text&&!question.options.includes(text))throw Error('Opción no válida.');
   if(question.required&&!text)throw Error('Responde a: '+question.label);
   out[id]=text;
  }
 }
 return out;
}
export async function onRequestGet({env,params}){
 const secret=params.token;
 if(!validToken(secret))return apiError('El enlace no es válido.',404);
 if(!env?.SOUTHBEAR_DB)return apiError('El formulario no está disponible.',503);
 try{
  const row=await env.SOUTHBEAR_DB.prepare(
   "SELECT company_name,service_slug,title,question_ids,status FROM sb_briefing_forms WHERE token=?"
  ).bind(secret).first();
  if(!row)return apiError('El enlace no existe o ha sido retirado.',404);
  if(row.status!=='pendiente')return apiError(row.status==='recibido'||row.status==='cerrado'?'Este briefing ya ha sido enviado. Gracias.':'Este enlace ya no está disponible.',410);
  const chosen=JSON.parse(row.question_ids);
  const questions=BRIEFING_QUESTIONS.filter(q=>chosen.includes(q.id));
  return apiResponse({ok:true,company_name:row.company_name,title:row.title,
   service:BRIEFING_SERVICES.find(s=>s.id===row.service_slug)?.label||'Proyecto creativo',questions});
 }catch(e){console.error('Public briefing lookup failed');return apiError('No hemos podido cargar el formulario.',503);}
}
export async function onRequestPost({request,env,params}){
 const secret=params.token;
 if(!validToken(secret))return apiError('El enlace no es válido.',404);
 const origin=new URL(request.url).origin;
 if(request.headers.get('Origin')!==origin)return apiError('Solicitud no autorizada.',403);
 if(!request.headers.get('content-type')?.startsWith('application/json'))return apiError('Formato no válido.',415);
 if(Number(request.headers.get('content-length')||0)>40000)return apiError('El formulario es demasiado grande.',413);
 let data;
 try{
  const txt=await request.text();
  if(txt.length>40000)throw Error('El formulario es demasiado grande.');
  data=JSON.parse(txt);
 }catch(e){return apiError(e.message==='El formulario es demasiado grande.'?e.message:'No se pudieron leer las respuestas.',400);}
 if(!data||typeof data!=='object'||data.accepted!==true)return apiError('Confirma el tratamiento de las respuestas para preparar tu proyecto.',400);
 if(!env?.SOUTHBEAR_DB)return apiError('El formulario no está disponible.',503);
 try{
  const db=env.SOUTHBEAR_DB;
  const row=await db.prepare('SELECT question_ids,status FROM sb_briefing_forms WHERE token=?').bind(secret).first();
  if(!row)return apiError('El enlace no existe.',404);
  if(row.status!=='pendiente')return apiError('Este enlace ya no admite respuestas.',410);
  let answers;
  try{answers=cleanAnswers(JSON.parse(row.question_ids),data.answers);}catch(e){return apiError(e.message,400);}
  const result=await db.prepare(
   "UPDATE sb_briefing_forms SET answers_json=?,status='recibido',submitted_at=CURRENT_TIMESTAMP,updated_at=CURRENT_TIMESTAMP WHERE token=? AND status='pendiente' AND answers_json IS NULL"
  ).bind(JSON.stringify(answers),secret).run();
  if(!result.meta?.changes)return apiError('Este briefing ya se ha enviado.',409);
  return apiResponse({ok:true,message:'Hemos recibido tus respuestas. Muchas gracias.'});
 }catch(e){console.error('Public briefing submission failed');return apiError('No se pudo enviar. Inténtalo de nuevo.',503);}
}
