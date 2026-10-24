import {apiResponse,apiError,dbError,requestBody,validId} from './southbear-clients.js';
import {InputError,textValue,choice,audit} from './southbear-commerce.js';
export {apiResponse,apiError,dbError,requestBody,validId,audit};
export const DOCUMENT_MAX_BYTES=10485760; // 10 MiB por archivo
export const DOC_CATEGORIES=['contrato','entregable','justificante','autorizacion','otro'];
const EXT_MIME={
  pdf:'application/pdf',png:'image/png',jpg:'image/jpeg',jpeg:'image/jpeg',webp:'image/webp',
  docx:'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
  xlsx:'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
  pptx:'application/vnd.openxmlformats-officedocument.presentationml.presentation',
  txt:'text/plain'
};
export const documentColumns='d.id,d.title,d.category,d.original_name,d.mime_type,d.size_bytes,d.checksum_sha256,d.client_id,d.project_id,d.quote_id,d.expense_id,d.notes,d.created_at,d.archived_at,c.display_name AS client_name,p.title AS project_name,q.code AS quote_code,e.title AS expense_name';
const join=' FROM studio_documents d LEFT JOIN clients c ON c.id=d.client_id LEFT JOIN projects p ON p.id=d.project_id LEFT JOIN quotes q ON q.id=d.quote_id LEFT JOIN expenses e ON e.id=d.expense_id';
export function documentsQuery(where){
  return 'SELECT '+documentColumns+join+' WHERE '+where+' ORDER BY d.created_at DESC LIMIT 51 OFFSET ?';
}
export async function documentDetail(db,id,withKey=false){
  return db.prepare('SELECT '+documentColumns+(withKey?',d.object_key':'')+join+' WHERE d.id=?').bind(id).first();
}
export function documentError(err){
  if(err instanceof InputError)return apiError(err.message,err.status);
  if(err?.message&&/^(El formato|La solicitud|Los datos|El JSON)/.test(err.message))return apiError(err.message,400);
  return dbError(err);
}
export function bucketMissing(env){return !env?.SOUTHBEAR_FILES||typeof env.SOUTHBEAR_FILES.put!=='function'||typeof env.SOUTHBEAR_FILES.get!=='function';}
export function safeFileName(raw){
  const value=textValue(raw,'Nombre del fichero',180,{required:true});
  if(/[\/\\]/.test(value)||value==='.'||value==='..'||/[\r\n]/.test(value))throw new InputError('El nombre del archivo no es válido.');
  const ext=value.split('.').pop().toLowerCase();
  if(!Object.hasOwn(EXT_MIME,ext))throw new InputError('Formato no admitido. Usa PDF, PNG, JPG, WebP, DOCX, XLSX, PPTX o TXT.');
  return {name:value,extension:ext,mime:EXT_MIME[ext]};
}
export function checkSignature(bytes,ext){
  if(bytes.byteLength<4)return false;
  const b=new Uint8Array(bytes);
  if(ext==='pdf')return b[0]===37&&b[1]===80&&b[2]===68&&b[3]===70&&b[4]===45;
  if(ext==='png')return b[0]===137&&b[1]===80&&b[2]===78&&b[3]===71&&b[4]===13&&b[5]===10;
  if(ext==='jpg'||ext==='jpeg')return b[0]===255&&b[1]===216&&b[2]===255;
  if(ext==='webp')return b[0]===82&&b[1]===73&&b[2]===70&&b[3]===70&&b[8]===87&&b[9]===69&&b[10]===66&&b[11]===80;
  if(['docx','xlsx','pptx'].includes(ext))return b[0]===80&&b[1]===75&&b[2]===3&&b[3]===4;
  if(ext==='txt'){
    if(b.includes(0))return false;
    try{new TextDecoder('utf-8',{fatal:true}).decode(b);return true;}catch{return false;}
  }
  return false;
}
export async function validateDocumentLink(db,type,id){
  if(!type||type==='general')return {client_id:null,project_id:null,quote_id:null,expense_id:null};
  if(!['cliente','proyecto','presupuesto','gasto'].includes(type)||!validId(id))throw new InputError('Referencia documental no válida.');
  const map={
    cliente:['clients','client_id'],
    proyecto:['projects','project_id'],
    presupuesto:['quotes','quote_id'],
    gasto:['expenses','expense_id']
  };
  const [table,col]=map[type];
  const found=await db.prepare('SELECT id,archived_at FROM '+table+' WHERE id=?').bind(id).first();
  if(!found||found.archived_at)throw new InputError('El registro vinculado no existe o está archivado.');
  return {client_id:null,project_id:null,quote_id:null,expense_id:null,[col]:id};
}
export async function validateNewDocument(db,fields){
  const title=textValue(fields.title||'','Título',200,{required:true});
  const notes=textValue(fields.notes||'','Notas',3000);
  const category=choice(fields.category||'otro','Categoría',DOC_CATEGORIES);
  const link_type=fields.link_type||'general';
  const link_id=fields.link_id||'';
  if(link_type==='general'&&link_id)throw new InputError('La referencia del documento no corresponde al vínculo seleccionado.');
  const link=await validateDocumentLink(db,link_type,link_id);
  return {title,notes,category,...link};
}
export async function sha256(buffer){
  const digest=new Uint8Array(await crypto.subtle.digest('SHA-256',buffer));
  return Array.from(digest,x=>x.toString(16).padStart(2,'0')).join('');
}
