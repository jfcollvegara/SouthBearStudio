import {PDFDocument,StandardFonts,rgb} from 'pdf-lib';

const PAGE_WIDTH=595.28;
const PAGE_HEIGHT=841.89;
const LEFT=44;
const RIGHT=PAGE_WIDTH-44;
const ACCENT=rgb(0.81,0.95,0.58);
const BLACK=rgb(0.058,0.064,0.058);
const INK=rgb(0.10,0.12,0.10);
const MUTED=rgb(0.39,0.44,0.39);
const PALE=rgb(0.95,0.97,0.93);
const BORDER=rgb(0.84,0.87,0.82);
const RED=rgb(0.96,0.18,0.22);
const EURO=new Intl.NumberFormat('es-ES',{style:'currency',currency:'EUR',minimumFractionDigits:2,maximumFractionDigits:2});
const formatMoney=c=>EURO.format(Number(c||0)/100).replace(/[\u00a0\u202f]/g,' ');
const formatDate=value=>value&&/^\d{4}-\d{2}-\d{2}/.test(value)?value.slice(8,10)+'/'+value.slice(5,7)+'/'+value.slice(0,4):'—';

export async function createQuotePDF({quote,client,issuer,ready}){
  const doc=await PDFDocument.create();
  doc.setTitle('Presupuesto '+quote.code+' · SouthBear Studio');
  doc.setAuthor(issuer.trade_name||'SouthBear Studio');
  doc.setSubject('Propuesta comercial. No es factura.');
  const normal=await doc.embedFont(StandardFonts.Helvetica);
  const bold=await doc.embedFont(StandardFonts.HelveticaBold);
  const pages=[];
  let page,y;
  function printable(input){
    const str=String(input??'').replace(/[\r\n\t]+/g,' ').replace(/\s+/g,' ').trim();
    let result='';
    for(const char of Array.from(str)){
      try{normal.encodeText(char);result+=char;}
      catch{
        const ascii=char.normalize('NFKD').replace(/[\u0300-\u036f]/g,'');
        let safe='';
        for(const ch of ascii){try{normal.encodeText(ch);safe+=ch;}catch{safe+='?';}}
        result+=safe||'?';
      }
    }
    return result;
  }
  function text(str,x,top,{size=10,font=normal,color=INK,maxWidth=RIGHT-x}={}){
    const s=printable(str);
    if(!s)return;
    page.drawText(s,{x,y:top,size,font,color,maxWidth});
  }
  function line(x1,top,x2,{color=BORDER,width=.7}={}){page.drawLine({start:{x:x1,y:top},end:{x:x2,y:top},color,thickness:width});}
  function rect(x,top,width,height,{color=PALE,borderColor=null}={}){
    page.drawRectangle({x,y:top-height,width,height,color,...(borderColor?{borderColor,borderWidth:.7}:{})});
  }
  function wrap(str,font,size,maxWidth){
    const source=printable(str);
    if(!source)return[];
    const words=source.split(' ');
    const result=[];
    let row='';
    const chunkMax=(word)=>{
      const pieces=[];
      let section='';
      for(const ch of word){
        if(font.widthOfTextAtSize(section+ch,size)>maxWidth&&section){pieces.push(section);section=ch;}
        else section+=ch;
      }
      if(section)pieces.push(section);
      return pieces;
    };
    for(const word of words){
      const candidate=row?row+' '+word:word;
      if(font.widthOfTextAtSize(candidate,size)<=maxWidth){row=candidate;continue;}
      if(row){result.push(row);row='';}
      if(font.widthOfTextAtSize(word,size)>maxWidth){
        const pieces=chunkMax(word);
        result.push(...pieces.slice(0,-1));
        row=pieces.at(-1)||'';
      }else row=word;
    }
    if(row)result.push(row);
    return result;
  }
  function newPage(continuation=false){
    page=doc.addPage([PAGE_WIDTH,PAGE_HEIGHT]);
    pages.push(page);
    if(continuation){
      rect(0,PAGE_HEIGHT,PAGE_WIDTH,74,{color:BLACK});
      text('SOUTHBEAR / STUDIO',LEFT,PAGE_HEIGHT-43,{font:bold,size:15,color:rgb(1,1,1)});
      text(quote.code,RIGHT-140,PAGE_HEIGHT-42,{font:bold,size:10,color:ACCENT});
      y=PAGE_HEIGHT-102;
    }else{
      rect(0,PAGE_HEIGHT,PAGE_WIDTH,166,{color:BLACK});
      rect(LEFT,PAGE_HEIGHT-38,30,3,{color:ACCENT});
      page.drawCircle({x:LEFT+6,y:PAGE_HEIGHT-63,size:3.5,color:RED});
      text('SOUTHBEAR',LEFT+19,PAGE_HEIGHT-69,{font:bold,size:25,color:rgb(1,1,1)});
      text('STUDIO  /  CREATIVE BUSINESS',LEFT+20,PAGE_HEIGHT-88,{font:bold,size:8,color:ACCENT});
      text('PRESUPUESTO',LEFT,PAGE_HEIGHT-136,{font:bold,size:18,color:rgb(1,1,1)});
      text('PROPUESTA COMERCIAL  /  NO ES FACTURA',PAGE_WIDTH-275,PAGE_HEIGHT-134,{font:bold,size:8,color:ACCENT});
      y=PAGE_HEIGHT-189;
    }
  }
  function ensure(required){
    if(y-required<91)newPage(true);
  }
  function paragraph(content,{color=MUTED,font=normal,size=10,maxWidth=RIGHT-LEFT,lineHeight=14,spaceAfter=7}={}){
    for(const rawLine of String(content||'').split(/\n/)){
      const rows=rawLine.trim()?wrap(rawLine,font,size,maxWidth):[''];
      for(const entry of rows){ensure(lineHeight);if(entry)text(entry,LEFT,y,{font,color,size});y-=lineHeight;}
    }
    y-=spaceAfter;
  }
  function labelValue(title,value,x,w,top){
    text(title,x,top,{font:bold,size:8,color:MUTED});
    const vals=String(value||'').split(/\n/);
    let lineTop=top-19;
    for(const raw of vals){
      for(const str of wrap(raw,normal,9.4,w)){
        text(str,x,lineTop,{size:9.4,color:INK});
        lineTop-=13;
      }
    }
    return lineTop;
  }
  newPage();
  if(!ready){
    rect(LEFT,y,RIGHT-LEFT,36,{color:rgb(1,.94,.82)});
    text('DOCUMENTO PROVISIONAL · DATOS FISCALES DEL EMISOR INCOMPLETOS',LEFT+12,y-23,{font:bold,size:9,color:INK});
    y-=53;
  }
  const issuerText=[
    issuer.legal_name||issuer.trade_name||'SOUTHBEAR STUDIO',
    issuer.tax_id?'NIF: '+issuer.tax_id:'',
    issuer.address||'',
    [issuer.postal_code,issuer.city,issuer.province].filter(Boolean).join(' · '),
    issuer.country||'',
    issuer.email||'',
    issuer.phone||''
  ].filter(Boolean).join('\n');
  const clientText=[
    client.legal_name||client.display_name,
    client.tax_id?'NIF: '+client.tax_id:'',
    client.address||'',
    [client.postal_code,client.city,client.province].filter(Boolean).join(' · '),
    client.country||'',
    client.email||''
  ].filter(Boolean).join('\n');
  const startY=y;
  const a=labelValue('EMISOR',issuerText,LEFT,230,y);
  const b=labelValue('PREPARADO PARA',clientText,316,RIGHT-316,y);
  y=Math.min(a,b)-19;
  ensure(88);
  rect(LEFT,y,RIGHT-LEFT,68,{color:PALE});
  text('REFERENCIA',LEFT+15,y-16,{font:bold,size:8,color:MUTED});
  text(quote.code,LEFT+15,y-34,{font:bold,size:12});
  text('FECHA',271,y-16,{font:bold,size:8,color:MUTED});
  text(formatDate(quote.issue_date),271,y-34,{font:bold,size:10});
  text('VÁLIDO HASTA',409,y-16,{font:bold,size:8,color:MUTED});
  text(formatDate(quote.valid_until),409,y-34,{font:bold,size:10});
  y-=98;
  ensure(70);
  text('PROPUESTA / '+quote.status.toUpperCase(),LEFT,y,{font:bold,size:8,color:MUTED});
  y-=24;
  const hlines=wrap(quote.title,bold,19,RIGHT-LEFT);
  for(const entry of hlines){ensure(26);text(entry,LEFT,y,{font:bold,size:19,color:INK});y-=24;}
  y-=18;
  function drawTableHeader(){
    ensure(36);
    rect(LEFT,y,RIGHT-LEFT,32,{color:BLACK});
    text('CONCEPTO',LEFT+10,y-21,{font:bold,size:8,color:rgb(1,1,1)});
    text('CANT.',286,y-21,{font:bold,size:8,color:rgb(1,1,1)});
    text('PRECIO / IVA INC.',330,y-21,{font:bold,size:7.5,color:rgb(1,1,1)});
    text('IVA',429,y-21,{font:bold,size:8,color:rgb(1,1,1)});
    text('IMPORTE',488,y-21,{font:bold,size:8,color:rgb(1,1,1)});
    y-=39;
  }
  drawTableHeader();
  for(const item of quote.lines){
    let conceptLines=wrap(item.concept,bold,9.5,212);
    let detailLines=wrap(item.details||'',normal,8.5,212);
    const rowHeight=Math.max(34,conceptLines.length*12+detailLines.length*11+11);
    if(y-rowHeight<105){newPage(true);drawTableHeader();}
    const unitGross=item.unit_gross_cents!=null?item.unit_gross_cents:Math.round(item.unit_cents*(10000+item.vat_bps)/10000);
    const quantity=(item.quantity_milli/1000).toLocaleString('es-ES',{maximumFractionDigits:3});
    const lineY=y;
    for(const entry of conceptLines){text(entry,LEFT+10,y-11,{font:bold,size:9.5});y-=12;}
    for(const entry of detailLines){text(entry,LEFT+10,y-7,{size:8.5,color:MUTED});y-=11;}
    text(quantity,286,lineY-12,{size:9});
    text(formatMoney(unitGross),330,lineY-12,{size:8.5});
    text((item.vat_bps/100)+' %',429,lineY-12,{size:8.5});
    text(formatMoney(item.total_cents),488,lineY-12,{font:bold,size:8.6});
    y=Math.min(y-10,lineY-rowHeight);
    line(LEFT,y,RIGHT,{color:BORDER,width:.6});y-=10;
  }
  const rates=new Map();
  for(const item of quote.lines){
    const prev=rates.get(item.vat_bps)||{base:0,tax:0};
    prev.base+=item.base_cents;prev.tax+=item.vat_cents;
    rates.set(item.vat_bps,prev);
  }
  const extraRows=rates.size>1?rates.size:0;
  ensure(127+extraRows*14);
  y-=17;
  const totalsX=346;
  rect(totalsX,y,RIGHT-totalsX,90+extraRows*14,{color:PALE});
  text('BASE IMPONIBLE',totalsX+13,y-21,{font:bold,size:8,color:MUTED});
  text(formatMoney(quote.subtotal_cents),456,y-21,{font:bold,size:10});
  text('IVA',totalsX+13,y-39,{font:bold,size:8,color:MUTED});
  text(formatMoney(quote.tax_cents),456,y-39,{font:bold,size:10});
  let vatY=y-56;
  if(rates.size>1){
    for(const [rate,values] of Array.from(rates.entries()).sort((a,b)=>a[0]-b[0])){
      text('TIPO '+(rate/100)+' %',totalsX+13,vatY,{size:8,color:MUTED});
      text(formatMoney(values.tax),456,vatY,{size:8,color:MUTED});
      vatY-=14;
    }
  }
  line(totalsX+13,vatY-1,RIGHT-13,{color:BORDER});
  text('TOTAL CON IVA',totalsX+13,vatY-19,{font:bold,size:9,color:INK});
  text(formatMoney(quote.total_cents),456,vatY-20,{font:bold,size:12,color:INK});
  y-=(105+extraRows*14);
  if(quote.notes?.trim()){
    ensure(48);
    y-=15;
    text('CONDICIONES DE LA PROPUESTA',LEFT,y,{font:bold,size:9});
    y-=20;
    paragraph(quote.notes,{size:9,maxWidth:RIGHT-LEFT,lineHeight:14,spaceAfter:10});
  }
  if(issuer.quote_footer?.trim()){
    ensure(48);
    y-=10;
    text('CONDICIONES GENERALES',LEFT,y,{font:bold,size:9});
    y-=20;
    paragraph(issuer.quote_footer,{size:9,maxWidth:RIGHT-LEFT,lineHeight:14,spaceAfter:10});
  }
  for(const [index,p] of pages.entries()){
    p.drawLine({start:{x:LEFT,y:67},end:{x:RIGHT,y:67},color:BORDER,thickness:.8});
    p.drawText('SOUTHBEAR STUDIO  /  PRESUPUESTO COMERCIAL  /  NO ES FACTURA',{
      x:LEFT,y:48,size:7.8,font:bold,color:MUTED
    });
    p.drawText(String(index+1)+' / '+String(pages.length),{x:RIGHT-26,y:48,size:8,font:bold,color:MUTED});
  }
  return doc.save();
}
