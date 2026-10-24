import {opportunityDetail,opportunityError,apiResponse,apiError,requestBody,validId,audit} from '../../../../../src/server/southbear-opportunities.js';
import {CLIENT_FIELDS,normalizedClient} from '../../../../../src/server/southbear-clients.js';

export async function onRequestPost({env,params,data,request}){
 if(!validId(params.id))return apiError('Oportunidad no válida.',400);
 try{
  // Evita acciones accidentales vía formularios ajenos.
  const raw=await requestBody(request,1000);
  if(raw.confirm!==true)return apiError('Confirma expresamente la creación del cliente.',400);
  const db=env.SOUTHBEAR_DB,lead=await opportunityDetail(db,params.id);
  if(!lead)return apiError('Oportunidad no encontrada.',404);
  if(lead.archived_at)return apiError('Restaura la oportunidad antes de convertirla.',409);
  if(lead.client_id)return apiError('Ya está vinculada a un cliente. Puedes usar esa ficha.',409);
  if(lead.email){
   const found=await db.prepare('SELECT id FROM clients WHERE archived_at IS NULL AND lower(email)=lower(?) LIMIT 1').bind(lead.email).first();
   if(found)return apiError('Ya existe un cliente con ese correo. Edita la oportunidad para vincularlo en lugar de duplicarlo.',409);
  }
  const input=normalizedClient({
   display_name:lead.company_name||lead.contact_name,
   client_type:lead.company_name?'empresa':'particular',
   email:lead.email,
   phone:lead.phone,
   notes:lead.company_name?'Contacto inicial: '+lead.contact_name:'',
   country:'España'
  });
  const id=crypto.randomUUID();
  await db.batch([
   db.prepare('INSERT INTO clients(id,'+CLIENT_FIELDS.join(',')+') VALUES(?,'+CLIENT_FIELDS.map(()=>'?').join(',')+')')
     .bind(id,...CLIENT_FIELDS.map(k=>input[k])),
   db.prepare('UPDATE sales_opportunities SET client_id=?,updated_at=CURRENT_TIMESTAMP WHERE id=? AND client_id IS NULL')
     .bind(id,lead.id),
   audit(db,'client',id,'create',data.southbearUser,CLIENT_FIELDS),
   audit(db,'opportunity',lead.id,'update',data.southbearUser,['client_id'])
  ]);
  return apiResponse({ok:true,client_id:id,item:await opportunityDetail(db,lead.id)},201);
 }catch(error){return opportunityError(error);}
}
