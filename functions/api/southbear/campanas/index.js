import {apiResponse,apiError,dbError} from '../../../../src/server/southbear-clients.js';
import {sendContactSmtp} from '../../../lib/hostalia-smtp.js';
import {renderEmail} from '../../../lib/email-templates.js';

// Una campaña se procesa en tandas de 20, sin exponer direcciones a otros receptores.
export async function onRequestPost({request,env}){
 try{
  const b=await request.json();
  if(!b||typeof b!=='object'||!Array.isArray(b.emails)||b.emails.length<1||b.emails.length>20)return apiError('Selecciona entre 1 y 20 destinatarios por envío.',400);
  const valid=(v,n)=>typeof v==='string'&&v.trim()&&v.length<=n;
  if(!valid(b.subject,180)||!valid(b.headline,180)||!valid(b.body,6000)||!valid(b.campaign_id,100))return apiError('Completa los datos de la campaña.',400);
  if(/[\r\n]/.test(b.subject)||!/^[a-zA-Z0-9-]{20,100}$/.test(b.campaign_id))return apiError('Datos no válidos.',400);
  const emails=[...new Set(b.emails.map(e=>typeof e==='string'?e.toLowerCase().trim():''))];
  if(emails.length!==b.emails.length||emails.some(e=>e.length>180||!/^\S+@\S+\.\S+$/.test(e)))return apiError('Destinatarios no válidos.',400);
  const template={id:'campaign',subject:b.subject,headline:b.headline,body:b.body,button_label:typeof b.button_label==='string'?b.button_label.slice(0,100):'',button_url:typeof b.button_url==='string'?b.button_url.slice(0,400):''};
  if(template.button_url&&!/^https:\/\/southbearstudio\.com(?:\/|$)/.test(template.button_url))return apiError('El enlace debe usar southbearstudio.com.',400);
  let sent=0,failed=0,skipped=0;
  for(const email of emails){
   // Comprobar consentimiento actual en servidor justo antes de enviar.
   const subscriber=await env.SOUTHBEAR_DB.prepare('SELECT email,name FROM sb_promotion_contacts WHERE email=?').bind(email).first();
   if(!subscriber){skipped++;continue;}
   const claim=await env.SOUTHBEAR_DB.prepare('INSERT OR IGNORE INTO sb_campaign_deliveries(campaign_id,email,subject) VALUES (?,?,?)').bind(b.campaign_id,email,b.subject).run();
   if(!claim.meta?.changes){skipped++;continue;}
   try{
    const message=renderEmail(template,subscriber.name);
    const footer='\n\nPara darte de baja de las promociones, escribe a info@southbearstudio.com indicando BAJA.';
    await sendContactSmtp(env,{to:email,replyTo:'info@southbearstudio.com',subject:message.subject,text:message.text+footer,html:message.html});
    await env.SOUTHBEAR_DB.prepare("UPDATE sb_campaign_deliveries SET status='accepted' WHERE campaign_id=? AND email=?").bind(b.campaign_id,email).run();
    sent++;
   }catch{
    failed++;
    await env.SOUTHBEAR_DB.prepare("UPDATE sb_campaign_deliveries SET status='failed' WHERE campaign_id=? AND email=?").bind(b.campaign_id,email).run();
   }
  }
  return apiResponse({ok:true,sent,failed,skipped});
 }catch(error){return dbError(error);}
}
