import {expenseDetail,normalizePayment,paymentStatement,expenseError,apiResponse,apiError,requestBody,validId,audit} from '../../../../../../src/server/southbear-expenses.js';

export async function onRequestPost({env,params,request,data}){
  if(!validId(params.id))return apiError('Gasto no válido.',400);
  try{
    const db=env.SOUTHBEAR_DB,expense=await expenseDetail(db,params.id);
    if(!expense)return apiError('Gasto no encontrado.',404);
    if(expense.archived_at)return apiError('Restaura el gasto antes de registrar pagos.',409);
    const payment=normalizePayment(await requestBody(request,15000));
    if(payment.amount_cents>expense.gross_cents-expense.paid_cents)return apiError('El pago excede el importe pendiente.',409);
    await db.batch([paymentStatement(db,expense.id,payment),audit(db,'expense',expense.id,'update',data.southbearUser,['payment_added','amount_cents','paid_date','method'])]);
    return apiResponse({ok:true,item:await expenseDetail(db,expense.id)},201);
  }catch(e){return expenseError(e);}
}
