import {normalizeReceipt,receiptStatement,planDetail,failCollection,apiResponse,apiError,requestBody,validId,audit} from '../../../../../../src/server/southbear-collections.js';

export async function onRequestPost({env,params,request,data}){
  if(!validId(params.id))return apiError('Plan de cobro no válido.',400);
  try{
    const db=env.SOUTHBEAR_DB;
    const plan=await planDetail(db,params.id);
    if(!plan)return apiError('No se ha encontrado el plan.',404);
    if(plan.archived_at)return apiError('Restaura el plan antes de registrar un cobro.',409);
    const payment=normalizeReceipt(await requestBody(request,15000));
    if(payment.amount_cents>plan.total_cents-plan.paid_cents)return apiError('El importe supera la cantidad pendiente de cobro.',409);
    // El trigger SQL impide exceder el total aun con escrituras simultáneas.
    await db.batch([
      receiptStatement(db,plan.id,payment),
      audit(db,'collection_plan',plan.id,'update',data.southbearUser,['receipt_added','amount_cents','paid_date','method'])
    ]);
    return apiResponse({ok:true,item:await planDetail(db,plan.id)},201);
  }catch(error){return failCollection(error);}
}
