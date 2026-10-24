import {verifySouthbearRequest,apiError} from '../../../src/server/southbear-access.js';

// Toda ruta /api/southbear/* falla cerrada sin identidad verificada.
// La aplicación Cloudflare Access cubre también el dominio pages.dev
// y todas sus URLs de despliegue, pero no confiamos solo en su filtro.
export async function onRequest(context){
  const user=await verifySouthbearRequest(context.request);
  if(!user)return apiError('Acceso no autorizado. Inicia sesión de nuevo.',401);
  if(!context.env?.SOUTHBEAR_DB)return apiError('La base de datos no está disponible en este entorno.',503);
  if(!['GET','HEAD'].includes(context.request.method)){
    const url=new URL(context.request.url);
    const origin=context.request.headers.get('Origin');
    if(origin!==url.origin||context.request.headers.get('X-SouthBear-Request')!=='1'){
      return apiError('Solicitud no autorizada.',403);
    }
  }
  context.data.southbearUser=user;
  return context.next();
}
