import {validId,apiError,dbError} from '../../../../src/server/southbear-clients.js';
import {quoteDetail} from '../../../../src/server/southbear-commerce.js';
import {readSettings,issuerReady} from '../../../../src/server/southbear-settings.js';
import {createQuotePDF} from '../../../../src/server/southbear-quote-pdf.js';

// Descarga bajo Cloudflare Access + JWT comprobado en el middleware privado.
// Nunca se guarda una copia con datos de clientes en una ruta pública.
export async function onRequestGet({request,env}){
  const id=new URL(request.url).searchParams.get('id');
  if(!validId(id))return apiError('Presupuesto no válido.',400);
  try{
    const db=env.SOUTHBEAR_DB;
    const quote=await quoteDetail(db,id);
    if(!quote)return apiError('No se ha encontrado el presupuesto.',404);
    const [client,issuer]=await Promise.all([
      db.prepare('SELECT display_name,legal_name,tax_id,address,postal_code,city,province,country,email,phone FROM clients WHERE id=?').bind(quote.client_id).first(),
      readSettings(db)
    ]);
    if(!client)return apiError('El cliente asociado no está disponible.',404);
    const bytes=await createQuotePDF({quote,client,issuer,ready:issuerReady(issuer)});
    const filename=(quote.code||'Presupuesto').replace(/[^a-zA-Z0-9_-]/g,'_')+'.pdf';
    return new Response(bytes,{
      status:200,
      headers:{
        'Content-Type':'application/pdf',
        'Content-Disposition':'attachment; filename="'+filename+'"',
        'Cache-Control':'private, no-store, max-age=0',
        'X-Content-Type-Options':'nosniff',
        'Referrer-Policy':'no-referrer'
      }
    });
  }catch(error){return dbError(error);}
}
