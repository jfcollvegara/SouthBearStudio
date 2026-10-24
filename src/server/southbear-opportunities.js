import {apiResponse,apiError,requestBody,validId,dbError} from './southbear-clients.js';
import {InputError,textValue,dateValue,choice,audit,ensureClient} from './southbear-commerce.js';
export {apiResponse,apiError,requestBody,validId,audit};
export const stages=['nuevo','contactado','propuesta','negociacion','ganado','perdido'];
export const categories=['diseno','web','audiovisual','otro'];
export const sources=['web','referido','redes','email','telefono','presencial','otro'];
export const opportunityFields=['title','contact_name','company_name','email','phone','client_id','category','source','stage','probability','estimated_gross_cents','next_contact_date','description','notes','loss_reason'];
export const opportunityColumns='o.id,o.title,o.contact_name,o.company_name,o.email,o.phone,o.client_id,o.quote_id,o.category,o.source,o.stage,o.probability,o.estimated_gross_cents,o.next_contact_date,o.description,o.notes,o.loss_reason,o.created_at,o.updated_at,o.archived_at,c.display_name AS client_name,q.code AS quote_code,q.status AS quote_status';

export function normalizeOpportunity(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new InputError('Los datos de la oportunidad no son válidos.');
 const obj={
  title:textValue(raw.title,'Trabajo o oportunidad',200,{required:true}),
  contact_name:textValue(raw.contact_name,'Nombre del contacto',160,{required:true}),
  company_name:textValue(raw.company_name??'','Empresa',160),
  email:textValue(raw.email??'','Email',190),
  phone:textValue(raw.phone??'','Teléfono',60),
  client_id:raw.client_id||null,
  category:choice(raw.category??'otro','Servicio',categories),
  source:choice(raw.source??'otro','Origen',sources),
  stage:choice(raw.stage??'nuevo','Etapa',stages),
  probability:raw.probability??10,
  estimated_gross_cents:raw.estimated_gross_cents??0,
  next_contact_date:dateValue(raw.next_contact_date??'','Fecha del próximo contacto'),
  description:textValue(raw.description??'','Descripción',3000),
  notes:textValue(raw.notes??'','Notas internas',4000),
  loss_reason:textValue(raw.loss_reason??'','Motivo de pérdida',500)
 };
 if(obj.client_id&&!validId(obj.client_id))throw new InputError('El cliente vinculado no es válido.');
 if(!Number.isInteger(obj.probability)||obj.probability<0||obj.probability>100)throw new InputError('La probabilidad debe estar entre 0 y 100 %.');
 if(!Number.isSafeInteger(obj.estimated_gross_cents)||obj.estimated_gross_cents<0||obj.estimated_gross_cents>100000000000)
   throw new InputError('El importe previsto con IVA no es válido.');
 if(obj.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(obj.email))throw new InputError('Introduce un email válido.');
 if(obj.stage==='perdido'&&!obj.loss_reason)throw new InputError('Indica el motivo de pérdida de la oportunidad.');
 if(obj.stage!=='perdido')obj.loss_reason='';
 return obj;
}
export async function validateOpportunityClient(db,obj){
 if(obj.client_id)await ensureClient(db,obj.client_id);
}
export async function opportunityDetail(db,id){
 return db.prepare('SELECT '+opportunityColumns+' FROM sales_opportunities o LEFT JOIN clients c ON c.id=o.client_id LEFT JOIN quotes q ON q.id=o.quote_id WHERE o.id=?').bind(id).first();
}
export function opportunityError(error){
 if(error instanceof InputError)return apiError(error.message,error.status);
 if(error?.message&&/^(El formato|La solicitud|Los datos|El JSON)/.test(error.message))return apiError(error.message,400);
 if(/La oportunidad ya tiene presupuesto/.test(error?.message||''))return apiError('Esta oportunidad ya tiene un presupuesto asociado.',409);
 return dbError(error);
}
