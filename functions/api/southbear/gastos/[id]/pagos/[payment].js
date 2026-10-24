import {expenseDetail,expenseError,apiResponse,apiError,requestBody,validId,audit} from '../../../../../../src/server/southbear-expenses.js';
import {textValue,InputError} from '../../../../../../src/server/southbear-commerce.js';

export async function onRequestPatch({env,request,params,data}){
  if(!validId(params.id)||!validId(params.payment))return apiError('Movimiento no válido.',400);
  try{
    const db=env.SOUTHBEAR_DB,payload=await requestBody(request,2000);
    const reason=textValue(payload.reason??'','Motivo de anulación',300,{required:true});
    const expense=await expenseDetail(db,params.id);
    if(!expense)return apiError('No existe el gasto.',404);
    const payment=expense.payments.find(p=>p.id===params.payment);
    if(!payment)return apiError('Pago no encontrado.',404);
    if(payment.canceled_at)return apiError('Este pago ya está anulado.',409);
    const r=await db.prepare('UPDATE expense_payments SET canceled_at=CURRENT_TIMESTAMP,cancel_reason=? WHERE id=? AND expense_id=? AND canceled_at IS NULL')
      .bind(reason,payment.id,expense.id).run();
    if(!r.meta?.changes)return apiError('El pago ya está anulado.',409);
    await audit(db,'expense',expense.id,'update',data.southbearUser,['payment_canceled','reason']).run();
    return apiResponse({ok:true,item:await expenseDetail(db,expense.id)});
  }catch(e){return e instanceof InputError?apiError(e.message,e.status):expenseError(e);}
}
