import {apiResponse,apiError,dbError,requestBody} from './southbear-clients.js';
import {textValue,audit,InputError} from './southbear-commerce.js';

export const settingFields=[
  'trade_name','legal_name','tax_id','email','phone','address',
  'postal_code','city','province','country','website','quote_footer'
];
const limits={
  trade_name:150,legal_name:180,tax_id:40,email:190,phone:60,address:240,
  postal_code:30,city:120,province:120,country:90,website:240,quote_footer:1500
};
export const defaultSettings=Object.freeze({
  trade_name:'SOUTHBEAR STUDIO',
  legal_name:'',tax_id:'',email:'',phone:'',address:'',
  postal_code:'',city:'',province:'',country:'',website:'',quote_footer:''
});
export function normalizeSettings(body){
  if(!body||typeof body!=='object'||Array.isArray(body))throw new InputError('Los datos de configuración no son válidos.');
  const settings={};
  for(const field of settingFields){
    settings[field]=textValue(body[field]??'',field,limits[field]);
  }
  if(!settings.trade_name)throw new InputError('Introduce el nombre comercial.');
  if(settings.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(settings.email))throw new InputError('El correo electrónico del emisor no es válido.');
  if(settings.website&&!/^https?:\/\/[^\s/]+\.[^\s/]+/i.test(settings.website))throw new InputError('La web debe comenzar por https:// y contener un dominio válido.');
  return settings;
}
export function issuerReady(settings){
  return !!(settings.legal_name&&settings.tax_id&&settings.address&&settings.city&&settings.postal_code&&settings.country);
}
export async function readSettings(db){
  const settings=await db.prepare('SELECT '+settingFields.join(',')+',updated_at FROM studio_settings WHERE id=1').first();
  return {...defaultSettings,...(settings||{})};
}
export function settingsPayload(settings){
  return {ok:true,item:settings,issuer_ready:issuerReady(settings)};
}
export function writeSettings(db,item){
  const columns=['id',...settingFields];
  const sql='INSERT INTO studio_settings ('+columns.join(',')+',updated_at) VALUES ('+
    columns.map(()=>'?').join(',')+',CURRENT_TIMESTAMP) ON CONFLICT(id) DO UPDATE SET '+
    settingFields.map(f=>f+'=excluded.'+f).join(',')+',updated_at=CURRENT_TIMESTAMP';
  return db.prepare(sql).bind(1,...settingFields.map(f=>item[f]));
}
