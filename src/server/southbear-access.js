/*
 * Seguridad de las funciones privadas de SouthBear Studio.
 * Cloudflare Access restringe las rutas en el edge; verificamos de nuevo
 * la firma RS256 del JWT, su audiencia, emisor, caducidad y correo en el servidor.
 * Ningún dato personal ni secreto se incluye en el bundle del navegador.
 */
const ISSUER='https://twilight-tree-71e4.cloudflareaccess.com';
const AUDIENCE='7a3990e0590c5ceae76977231ebbcb6cff41d5cbd7ead502730ef444a57f8569';
const OWNER_EMAIL='jf.collvegara@gmail.com';
let jwksCache=null;
let expiresCacheAt=0;
const clock=()=>Math.floor(Date.now()/1000);
function decodeBase64URL(value){
  if(typeof value!=='string'||!/^[A-Za-z0-9_-]+$/.test(value))throw new Error('token');
  const normalized=value.replace(/-/g,'+').replace(/_/g,'/');
  const pad=normalized+'='.repeat((4-normalized.length%4)%4);
  return Uint8Array.from(atob(pad),ch=>ch.charCodeAt(0));
}
function fromJSON(value){
  return JSON.parse(new TextDecoder().decode(decodeBase64URL(value)));
}
async function getKeys(refresh=false){
  const now=Date.now();
  if(!refresh&&jwksCache&&now<expiresCacheAt)return jwksCache;
  const response=await fetch(ISSUER+'/cdn-cgi/access/certs',{headers:{Accept:'application/json'}});
  if(!response.ok)throw new Error('key-fetch');
  const body=await response.json();
  if(!body||!Array.isArray(body.keys))throw new Error('key-set');
  jwksCache=body.keys;
  expiresCacheAt=now+5*60*1000;
  return body.keys;
}
export async function verifySouthbearRequest(request){
  const token=request.headers.get('Cf-Access-Jwt-Assertion');
  if(!token||token.length>14000)return false;
  const parts=token.split('.');
  if(parts.length!==3)return false;
  try{
    const header=fromJSON(parts[0]);
    const claims=fromJSON(parts[1]);
    if(header.alg!=='RS256'||typeof header.kid!=='string'||header.kid.length>200)return false;
    const current=clock();
    if(claims.iss!==ISSUER||!(typeof claims.aud==='string'?claims.aud===AUDIENCE:Array.isArray(claims.aud)&&claims.aud.includes(AUDIENCE)))return false;
    if(!Number.isSafeInteger(claims.exp)||claims.exp<=current-15)return false;
    if(!Number.isSafeInteger(claims.iat)||claims.iat>current+60)return false;
    if(claims.nbf!=null&&(!Number.isSafeInteger(claims.nbf)||claims.nbf>current+15))return false;
    if(typeof claims.email!=='string'||claims.email.toLowerCase()!==OWNER_EMAIL)return false;
    let keys=await getKeys(false);
    let jwk=keys.find(key=>key.kid===header.kid&&key.kty==='RSA');
    if(!jwk){
      keys=await getKeys(true);
      jwk=keys.find(key=>key.kid===header.kid&&key.kty==='RSA');
    }
    if(!jwk)return false;
    const publicKey=await crypto.subtle.importKey('jwk',jwk,{name:'RSASSA-PKCS1-v1_5',hash:'SHA-256'},false,['verify']);
    const verified=await crypto.subtle.verify('RSASSA-PKCS1-v1_5',publicKey,decodeBase64URL(parts[2]),new TextEncoder().encode(parts[0]+'.'+parts[1]));
    return verified?{email:claims.email,sub:claims.sub||null}:false;
  }catch{
    return false;
  }
}
export function apiResponse(payload,status=200){
  return new Response(JSON.stringify(payload),{
    status,headers:{'Content-Type':'application/json; charset=utf-8','Cache-Control':'private, no-store, max-age=0','X-Content-Type-Options':'nosniff','X-Frame-Options':'DENY','Referrer-Policy':'no-referrer'}
  });
}
export function apiError(message,status=400){
  return apiResponse({ok:false,error:message},status);
}
