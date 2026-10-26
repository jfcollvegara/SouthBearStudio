import {apiResponse,apiError,dbError} from '../../../../src/server/southbear-clients.js';
import {TEMPLATE_IDS} from '../../../lib/email-templates.js';
export async function onRequestGet({env}){
 try{
 const data=await env.SOUTHBEAR_DB.prepare('SELECT id,subject,headline,body,button_label,button_url FROM sb_email_templates ORDER BY id').all();
 return apiResponse({ok:true,items:data.results||[]});
 }catch(e){return dbError(e);}
}
export async function onRequestPut({request,env}){
 try{
 const b=await request.json();if(!TEMPLATE_IDS.includes(b?.id))return apiError('Plantilla no válida',400);
 for(const [k,n] of [['subject',180],['headline',180],['body',6000],['button_label',100],['button_url',400]]){
  if(typeof b[k]!=='string'||b[k].length>n)return apiError('Contenido no válido: '+k,400);
 }
 if(!b.subject.trim()||!b.headline.trim()||!b.body.trim())return apiError('Completa los campos obligatorios',400);
 if(b.button_url&&!/^https:\/\/southbearstudio\.com(?:\/|$)/.test(b.button_url))return apiError('El botón debe enlazar a SouthBear Studio',400);
 await env.SOUTHBEAR_DB.prepare('UPDATE sb_email_templates SET subject=?,headline=?,body=?,button_label=?,button_url=?,updated_at=CURRENT_TIMESTAMP WHERE id=?').bind(b.subject,b.headline,b.body,b.button_label,b.button_url,b.id).run();
 return apiResponse({ok:true});
 }catch(e){return dbError(e);}
}
