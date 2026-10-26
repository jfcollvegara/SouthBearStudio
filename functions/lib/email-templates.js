export const TEMPLATE_IDS=['contact_receipt','promotion_welcome'];
const escapeHtml=value=>String(value??'').replace(/[&<>"']/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[c]));
export function renderEmail(template,name){
 const interpolate=value=>String(value||'').replace(/\{nombre\}/gi,name||'cliente');
 const subject=interpolate(template.subject).replace(/[\r\n]/g,' ').slice(0,180);
 const headline=escapeHtml(interpolate(template.headline));
 const text=interpolate(template.body);
 const paragraphs=text.split(/\n\s*\n/).map(s=>'<p style="margin:0 0 19px;font-size:15px;line-height:1.75;color:#27332e;">'+escapeHtml(s).replace(/\n/g,'<br>')+'</p>').join('');
 const url=/^https:\/\/southbearstudio\.com(?:\/|$)/.test(template.button_url||'')?template.button_url:'https://southbearstudio.com/';
 const button=template.button_label?'<p style="margin:28px 0"><a href="'+escapeHtml(url)+'" style="background:#233b2d;color:#ffffff;text-decoration:none;border-radius:10px;padding:14px 24px;font-weight:bold;display:inline-block;">'+escapeHtml(template.button_label)+'</a></p>':'';
 const html='<!doctype html><html lang="es"><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1"></head><body style="margin:0;background:#edf1ed;font-family:Arial,Helvetica,sans-serif"><table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#edf1ed;padding:24px 10px"><tr><td align="center"><table role="presentation" width="600" cellpadding="0" cellspacing="0" style="max-width:600px;width:100%;background:#ffffff;border-radius:16px;overflow:hidden"><tr><td style="background:#101b16;padding:28px 36px;text-align:center"><img src="https://southbearstudio.com/southbear-logo.svg" width="235" alt="SOUTHBEAR STUDIO" style="max-width:100%;height:auto;display:inline-block;background:#ffffff;padding:8px;border-radius:5px"></td></tr><tr><td style="padding:40px 36px"><h1 style="font-size:29px;line-height:1.2;color:#183122;margin:0 0 25px">'+headline+'</h1>'+paragraphs+button+'</td></tr><tr><td style="background:#e7eee7;padding:24px 36px;text-align:center;font-size:12px;line-height:1.7;color:#4c6051">SOUTHBEAR STUDIO · Diseño, web y audiovisual<br>info@southbearstudio.com<br>'+ (template.id==='promotion_welcome'?'Para cancelar las comunicaciones comerciales, escribe a info@southbearstudio.com.':'')+'</td></tr></table></td></tr></table></body></html>';
 return {subject,text,html};
}
export async function loadTemplate(db,id){
 if(!TEMPLATE_IDS.includes(id))return null;
 return db.prepare('SELECT id,subject,headline,body,button_label,button_url FROM sb_email_templates WHERE id=?').bind(id).first();
}
