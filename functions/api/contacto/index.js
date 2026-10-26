// Envío directo de consultas de la web: Cloudflare Pages + Turnstile + Resend.
// La clave de envío RESEND_API_KEY se guarda cifrada en Cloudflare, nunca en GitHub.
// Destinatario fijo para evitar que el endpoint pueda utilizarse como relay abierto.
const RECIPIENT='info@southbearstudio.com';
const SENDER='SouthBear Studio <formularios@notificaciones.southbearstudio.com>';
const SERVICES=new Set([
  'Diseño gráfico',
  'Identidad visual y branding',
  'Diseño y desarrollo web',
  'Producción audiovisual',
  'Soluciones QR/NFC',
  'Otro servicio'
]);
const json=(data,status=200)=>new Response(JSON.stringify(data),{
  status,headers:{
    'Content-Type':'application/json; charset=utf-8',
    'Cache-Control':'no-store',
    'X-Content-Type-Options':'nosniff'
  }
});
const trim=(s,max)=>typeof s==='string'?s.trim().slice(0,max+1):'';
const safe=(v,n)=>typeof v==='string'&&v.length<=n;
const emailValid=s=>/^[^\s@<>]+@[^\s@<>]+\.[^\s@<>]+$/.test(s)&&s.length<=180;
const isConfigured=env=>Boolean(env.RESEND_API_KEY&&env.TURNSTILE_SECRET&&env.SOUTHBEAR_DB);
export const onRequestGet=async({env})=>json({ready:isConfigured(env)});
export const onRequestPost=async({request,env})=>{
  if(!isConfigured(env))return json({ok:false,error:'El envío directo está pendiente de activación.'},503);
  const url=new URL(request.url);
  const origin=request.headers.get('Origin');
  if(origin!==url.origin)return json({ok:false,error:'Origen no permitido.'},403);
  if(!request.headers.get('Content-Type')?.toLowerCase().startsWith('application/json')){
    return json({ok:false,error:'Formato de solicitud no válido.'},415);
  }
  if(Number(request.headers.get('Content-Length')||0)>12000){
    return json({ok:false,error:'El mensaje es demasiado extenso.'},413);
  }
  let body;
  try{
    const raw=await request.text();
    if(raw.length>12000)return json({ok:false,error:'El mensaje es demasiado extenso.'},413);
    body=JSON.parse(raw);
  }catch{return json({ok:false,error:'No se ha podido leer la consulta.'},400);}
  if(!body||typeof body!=='object'||Array.isArray(body))return json({ok:false,error:'Datos no válidos.'},400);
  const name=trim(body.name,120);
  const email=trim(body.email,180).toLowerCase();
  const phone=trim(body.phone,40);
  const company=trim(body.company,160);
  const service=trim(body.service,100);
  const message=trim(body.message,2400);
  const token=trim(body.token,2048);
  if(body.website)return json({ok:false,error:'Solicitud no aceptada.'},400);
  if(!safe(name,120)||name.length<2||!emailValid(email)||!safe(phone,40)||!safe(company,160)||
     !SERVICES.has(service)||!safe(message,2400)||message.length<10||body.consent!==true){
    return json({ok:false,error:'Revisa los campos obligatorios y el consentimiento.'},400);
  }
  if(!token||token.length>2048)return json({ok:false,error:'Completa la verificación de seguridad.'},400);
  const remoteIp=request.headers.get('CF-Connecting-IP')||'unknown';
  let verification;
  try{
    const check=await fetch('https://challenges.cloudflare.com/turnstile/v0/siteverify',{
      method:'POST',headers:{'Content-Type':'application/json'},
      body:JSON.stringify({secret:env.TURNSTILE_SECRET,response:token,remoteip:remoteIp})
    });
    if(!check.ok)throw Error('Turnstile request failed');
    verification=await check.json();
  }catch{
    return json({ok:false,error:'No se pudo validar la seguridad. Inténtalo de nuevo.'},502);
  }
  if(!verification.success||verification.action!=='southbear_contact'||verification.hostname!==url.hostname){
    return json({ok:false,error:'La verificación de seguridad ha caducado. Inténtalo de nuevo.'},400);
  }

  // Como máximo 5 consultas/hora/IP. Nunca se almacena la IP en claro.
  const bucket=Math.floor(Date.now()/3600000);
  const hashData=new TextEncoder().encode(env.TURNSTILE_SECRET+':'+remoteIp);
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',hashData));
  const ipHash=Array.from(digest,x=>x.toString(16).padStart(2,'0')).join('');
  let count;
  try{
    const row=await env.SOUTHBEAR_DB.prepare(
      'INSERT INTO sb_contact_rate_limits (hour_bucket,ip_hash,attempts) VALUES (?,?,1) '+
      'ON CONFLICT(hour_bucket,ip_hash) DO UPDATE SET attempts=attempts+1 RETURNING attempts'
    ).bind(bucket,ipHash).first();
    count=Number(row?.attempts||0);
    if(Math.random()<0.025){
      await env.SOUTHBEAR_DB.prepare('DELETE FROM sb_contact_rate_limits WHERE hour_bucket < ?').bind(bucket-48).run();
    }
  }catch{
    return json({ok:false,error:'No se pudo procesar la solicitud. Inténtalo más tarde.'},503);
  }
  if(count>5)return json({ok:false,error:'Has enviado demasiadas consultas. Inténtalo más tarde.'},429);

  const text=[
    'Nueva consulta recibida desde southbearstudio.com',
    '',
    'Nombre: '+name,
    'Correo electrónico: '+email,
    'Teléfono: '+(phone||'No indicado'),
    'Empresa/marca: '+(company||'No indicada'),
    'Servicio solicitado: '+service,
    '',
    'MENSAJE:',
    message,
    '',
    'Puedes responder directamente a este correo para contactar con el interesado.'
  ].join('\n');
  let sendResult;
  try{
    sendResult=await fetch('https://api.resend.com/emails',{
      method:'POST',
      headers:{
        'Authorization':'Bearer '+env.RESEND_API_KEY,
        'Content-Type':'application/json'
      },
      body:JSON.stringify({
        from:SENDER,
        to:[RECIPIENT],
        reply_to:email,
        subject:'Nueva consulta web · '+service,
        text
      })
    });
  }catch{
    return json({ok:false,error:'No se ha podido conectar con el servicio de correo. Inténtalo más tarde.'},502);
  }
  if(!sendResult.ok){
    console.error('SouthBear contact email provider returned',sendResult.status);
    return json({ok:false,error:'No se ha podido entregar tu consulta. Inténtalo más tarde o contacta por WhatsApp.'},502);
  }
  return json({ok:true,message:'Consulta enviada correctamente.'});
};
