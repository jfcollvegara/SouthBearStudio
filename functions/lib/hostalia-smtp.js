import { connect } from 'cloudflare:sockets';

// Cliente SMTP mínimo y restringido a Hostalia.
// No registra ni expone respuestas SMTP, contraseñas o contenido del mensaje.
const encoder=new TextEncoder();
function base64Utf8(text){
  const bytes=encoder.encode(text);
  let binary='';
  for(const byte of bytes)binary+=String.fromCharCode(byte);
  return btoa(binary);
}
function socketIO(socket){
  const reader=socket.readable.getReader();
  const writer=socket.writable.getWriter();
  const decoder=new TextDecoder();
  let pending='';
  async function line(){
    for(;;){
      const end=pending.indexOf('\n');
      if(end>=0){
        const value=pending.slice(0,end).replace(/\r$/,'');
        pending=pending.slice(end+1);
        return value;
      }
      const {value,done}=await reader.read();
      if(done)throw Error('SMTP_CONNECTION_CLOSED');
      pending+=decoder.decode(value,{stream:true});
      if(pending.length>20000)throw Error('SMTP_REPLY_TOO_LARGE');
    }
  }
  async function reply(){
    const lines=[];
    let code='';
    for(let i=0;i<100;i++){
      const value=await line();
      const match=/^(\d{3})([ -])(.*)$/.exec(value);
      if(!match||code&&match[1]!==code)throw Error('SMTP_INVALID_REPLY');
      code=match[1];
      lines.push(match[3]);
      if(match[2]===' ')return {code:Number(code),lines};
    }
    throw Error('SMTP_TOO_MANY_REPLY_LINES');
  }
  async function write(command){
    await writer.write(encoder.encode(command+'\r\n'));
  }
  async function command(text,allowed){
    await write(text);
    const response=await reply();
    if(!allowed.includes(response.code))throw Error('SMTP_UNEXPECTED_REPLY_'+response.code);
    return response;
  }
  function release(){
    reader.releaseLock();
    writer.releaseLock();
  }
  return {reply,write,command,release};
}
function configured(env){
  return Boolean(env.SMTP_HOST&&env.SMTP_PORT&&env.SMTP_USER&&env.SMTP_PASSWORD&&env.SMTP_FROM);
}
export function smtpConfigured(env){return configured(env);}

/**
 * Entrega el mensaje al SMTP autenticado de Hostalia. Solo envía a la
 * dirección fija de SouthBear Studio y solo después de establecer STARTTLS.
 */
export async function sendContactSmtp(env,{to,replyTo,subject,text,html}){
  if(!configured(env))throw Error('SMTP_NOT_CONFIGURED');
  if(env.SMTP_HOST!=='smtp.servidor-correo.net'||Number(env.SMTP_PORT)!==587){
    throw Error('SMTP_HOST_NOT_ALLOWED');
  }
  if(env.SMTP_USER!=='info@southbearstudio.com'||env.SMTP_FROM!==env.SMTP_USER||
     !/^[a-zA-Z0-9.!#$%&'*+/=?^_\x60{|}~-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(to)||to.length>180){
    throw Error('SMTP_SENDER_NOT_ALLOWED');
  }
  if(!/^[a-zA-Z0-9.!#$%&'*+/=?^_\x60{|}~-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/.test(replyTo)||/[\r\n]/.test(subject)||subject.length>180){
    throw Error('SMTP_REPLY_TO_INVALID');
  }
  const initial=connect({hostname:env.SMTP_HOST,port:587},{secureTransport:'starttls'});
  let socket=initial;
  let io;
  try{
    await socket.opened;
    io=socketIO(socket);
    const greeting=await io.reply();
    if(greeting.code!==220)throw Error('SMTP_GREETING_FAILED');
    const hello=await io.command('EHLO southbearstudio.com',[250]);
    if(!hello.lines.some(s=>/^STARTTLS(?:\s|$)/i.test(s))){
      throw Error('SMTP_STARTTLS_UNAVAILABLE');
    }
    await io.command('STARTTLS',[220]);
    // Liberar lectores antiguos antes de pasar al socket seguro.
    io.release();
    socket=initial.startTls();
    await socket.opened;
    io=socketIO(socket);
    const capabilities=await io.command('EHLO southbearstudio.com',[250]);
    const authLine=capabilities.lines.find(s=>/^AUTH\s+/i.test(s))||'';
    const authMethods=authLine.toUpperCase().split(/\s+/).slice(1);
    if(authMethods.includes('PLAIN')){
      await io.command('AUTH PLAIN '+base64Utf8('\0'+env.SMTP_USER+'\0'+env.SMTP_PASSWORD),[235]);
    }else if(authMethods.includes('LOGIN')){
      await io.command('AUTH LOGIN',[334]);
      await io.command(base64Utf8(env.SMTP_USER),[334]);
      await io.command(base64Utf8(env.SMTP_PASSWORD),[235]);
    }else{
      throw Error('SMTP_AUTH_UNAVAILABLE');
    }
    await io.command('MAIL FROM:<'+env.SMTP_FROM+'>',[250]);
    await io.command('RCPT TO:<'+to+'>',[250,251]);
    await io.command('DATA',[354]);
    // MIME Base64 permite caracteres españoles sin SMTPUTF8 ni dot-stuffing.
    const id=crypto.randomUUID();
    const boundary='sb-'+id;
    const message=[
      'From: SouthBear Studio <'+env.SMTP_FROM+'>',
      'To: <'+to+'>',
      'Reply-To: <'+replyTo+'>',
      'Subject: '+subject,
      'Date: '+new Date().toUTCString(),
      'Message-ID: <'+id+'@southbearstudio.com>',
      'MIME-Version: 1.0',
      ...(html?['Content-Type: multipart/alternative; boundary="'+boundary+'"','','--'+boundary,'Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',base64Utf8(text).match(/.{1,76}/g).join('\r\n'),'--'+boundary,'Content-Type: text/html; charset=UTF-8','Content-Transfer-Encoding: base64','',base64Utf8(html).match(/.{1,76}/g).join('\r\n'),'--'+boundary+'--']:['Content-Type: text/plain; charset=UTF-8','Content-Transfer-Encoding: base64','',base64Utf8(text).match(/.{1,76}/g).join('\r\n')])
    ].join('\r\n');
    await io.write(message+'\r\n.');
    const accepted=await io.reply();
    if(accepted.code!==250)throw Error('SMTP_MESSAGE_NOT_ACCEPTED');
    try{await io.command('QUIT',[221]);}catch{} // El 250 anterior ya confirma aceptación.
    return true;
  }finally{
    try{await socket.close();}catch{}
  }
}
