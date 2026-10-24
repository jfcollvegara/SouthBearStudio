import {apiResponse} from '../../../../src/server/southbear-documents.js';
import {bucketMissing,DOCUMENT_MAX_BYTES} from '../../../../src/server/southbear-documents.js';
export async function onRequestGet({env}){
  return apiResponse({ok:true,storage_ready:!bucketMissing(env),max_file_bytes:DOCUMENT_MAX_BYTES,
    allowed_extensions:['pdf','png','jpg','jpeg','webp','docx','xlsx','pptx','txt']});
}