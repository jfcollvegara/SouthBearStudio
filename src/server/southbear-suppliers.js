import {apiResponse,apiError,dbError,requestBody,validId} from './southbear-clients.js';
import {InputError,textValue,audit} from './southbear-commerce.js';
export {apiResponse,apiError,requestBody,validId,audit};

export const supplierFields=[
 'display_name','legal_name','tax_id','contact_name','email','phone','website',
 'address','postal_code','city','province','country','service_category','payment_terms','notes'
];
const limits={display_name:180,legal_name:180,tax_id:45,contact_name:160,email:190,phone:60,website:250,
 address:250,postal_code:25,city:100,province:100,country:80,service_category:35,payment_terms:400,notes:3000};
export const supplierCategories=['impresion','software','audiovisual','web','diseno','logistica','materiales','otros'];
export function normalizeSupplier(raw){
 if(!raw||typeof raw!=='object'||Array.isArray(raw))throw new InputError('Datos de proveedor no válidos.');
 const supplier={};
 for(const key of supplierFields){
   supplier[key]=textValue(raw[key]??(key==='country'?'España':key==='service_category'?'otros':''),
     key,limits[key],{required:key==='display_name'});
 }
 if(!supplierCategories.includes(supplier.service_category))throw new InputError('Categoría de proveedor no válida.');
 if(supplier.email&&!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(supplier.email))throw new InputError('Introduce un email de proveedor válido.');
 if(supplier.website&&!/^https?:\/\/[^\s/]+\.[^\s/]+/i.test(supplier.website))throw new InputError('La web del proveedor debe incluir https:// y un dominio.');
 return supplier;
}
export function supplierError(err){
 if(err instanceof InputError)return apiError(err.message,err.status);
 if(/^(El formato|La solicitud|Los datos|El JSON)/.test(err?.message||''))return apiError(err.message,400);
 return dbError(err);
}
export const supplierCols='s.id,s.display_name,s.legal_name,s.tax_id,s.contact_name,s.email,s.phone,s.website,s.address,s.postal_code,s.city,s.province,s.country,s.service_category,s.payment_terms,s.notes,s.created_at,s.updated_at,s.archived_at';
export const statColumns=[
 '(SELECT COUNT(*) FROM expenses e WHERE e.supplier_id=s.id AND e.archived_at IS NULL) AS expenses_count',
 '(SELECT COALESCE(SUM(e.gross_cents),0) FROM expenses e WHERE e.supplier_id=s.id AND e.archived_at IS NULL) AS total_expenses_cents',
 '(SELECT COALESCE(SUM(p.amount_cents),0) FROM expense_payments p JOIN expenses e ON e.id=p.expense_id WHERE e.supplier_id=s.id AND e.archived_at IS NULL AND p.canceled_at IS NULL) AS paid_cents'
].join(',');
export async function supplierDetail(db,id){
 return db.prepare('SELECT '+supplierCols+','+statColumns+' FROM suppliers s WHERE s.id=?').bind(id).first();
}
export async function ensureSupplier(db,id,allowArchivedId=null){
 if(!id)return null;
 if(!validId(id))throw new InputError('Proveedor vinculado no válido.');
 const s=await db.prepare('SELECT id,display_name,archived_at FROM suppliers WHERE id=?').bind(id).first();
 if(!s||s.archived_at&&id!==allowArchivedId)throw new InputError('El proveedor no existe o está archivado.');
 return s;
}
