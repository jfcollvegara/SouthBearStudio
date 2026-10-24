import {planDetail,failCollection,apiResponse,apiError,requestBody,validId,audit} from '../../../../../../src/server/southbear-collections.js';
import {textValue,InputError} from '../../../../../../src/server/southbear-commerce.js';

export async function onRequestPatch({env,params,request,data}){
  if(!validId(params.id)||!validId(params.receipt))return apiError('Movimiento no válido.',400);
  try{
    const db=env.SOUTHBEAR_DB;
    const payload=await requestBody(request,2000);
    const reason=textValue(payload.reason??'','Motivo de anulación',300,{required:true});
    const plan=await planDetail(db,params.id);
    if(!plan)return apiError('No existe ese plan.',404);
    const receipt=plan.receipts.find(x=>x.id===params.receipt);
    if(!receipt)return apiError('Movimiento no encontrado.',404);
    if(receipt.canceled_at)return apiError('Este movimiento ya está anulado.',409);
    const result=await db.prepare('UPDATE collection_receipts SET canceled_at=CURRENT_TIMESTAMP,cancel_reason=? WHERE id=? AND plan_id=? AND canceled_at IS NULL')
      .bind(reason,receipt.id,plan.id).run();
    if(!result.meta?.changes)return apiError('El movimiento ya ha sido anulado.',409);
    await audit(db,'collection_plan',plan.id,'update',data.southbearUser,['receipt_canceled','reason']).run();
    return apiResponse({ok:true,item:await planDetail(db,plan.id)});
  }catch(error){
    if(error instanceof InputError)return apiError(error.message,error.status);
    return failCollection(error);
  }
}
