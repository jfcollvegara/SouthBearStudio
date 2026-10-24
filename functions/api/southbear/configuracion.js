import {apiResponse,dbError,requestBody} from '../../../src/server/southbear-clients.js';
import {readSettings,normalizeSettings,writeSettings,settingsPayload,settingFields} from '../../../src/server/southbear-settings.js';
import {InputError,audit} from '../../../src/server/southbear-commerce.js';

export async function onRequestGet({env}){
  try{return apiResponse(settingsPayload(await readSettings(env.SOUTHBEAR_DB)));}
  catch(error){return dbError(error);}
}

export async function onRequestPut({env,request,data}){
  try{
    const body=await requestBody(request);
    const item=normalizeSettings(body);
    const db=env.SOUTHBEAR_DB;
    await db.batch([
      writeSettings(db,item),
      audit(db,'settings','1','update',data.southbearUser,settingFields)
    ]);
    return apiResponse(settingsPayload(await readSettings(db)));
  }catch(error){
    if(error instanceof InputError)return apiResponse({ok:false,error:error.message},400);
    if(error?.message&&/^(El |Los |La )/.test(error.message))return apiResponse({ok:false,error:error.message},400);
    return dbError(error);
  }
}
