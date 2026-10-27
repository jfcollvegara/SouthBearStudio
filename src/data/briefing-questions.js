// Fuente única de preguntas: panel de SouthBear y formulario público.
export const BRIEFING_SERVICES=[
  {id:'branding',label:'Logotipos e identidad visual',sections:['general','identidad']},
  {id:'diseno-grafico',label:'Diseño gráfico y publicidad',sections:['general','grafico']},
  {id:'diseno-web',label:'Diseño y desarrollo web',sections:['general','web']},
  {id:'soluciones-qr',label:'Cartas digitales y QR/NFC',sections:['general','qr']},
  {id:'audiovisual',label:'Producción audiovisual',sections:['general','video']}
];
export const BRIEFING_SECTIONS=[
  {id:'general',title:'Conozcamos tu negocio',subtitle:'Personalidad, objetivos y referencias creativas.'},
  {id:'identidad',title:'Identidad visual y logotipo',subtitle:'Símbolos, aplicaciones y esencia de marca.'},
  {id:'grafico',title:'Diseño gráfico y publicidad',subtitle:'Piezas, textos, formatos e impresión.'},
  {id:'web',title:'Diseño y desarrollo web',subtitle:'Estructura, funciones y referencias digitales.'},
  {id:'qr',title:'Cartas digitales y QR/NFC',subtitle:'Organización, productos y soportes.'},
  {id:'video',title:'Producción audiovisual',subtitle:'Historia, tono, montaje y entregables.'}
];
export const BRIEFING_QUESTIONS=[
  {id:'actividad',section:'general',label:'¿A qué se dedica tu negocio?',type:'textarea',required:true,hint:'Explícanos brevemente qué ofreces y qué quieres que conozca el público.'},
  {id:'diferencia',section:'general',label:'¿Qué hace especial a tu negocio frente a otros?',type:'textarea'},
  {id:'publico',section:'general',label:'¿A qué tipo de personas o empresas quieres llegar?',type:'textarea',required:true},
  {id:'objetivo',section:'general',label:'¿Qué te gustaría conseguir con este proyecto?',type:'textarea',required:true},
  {id:'personalidad',section:'general',label:'Si tu marca fuera una persona, ¿cómo sería?',type:'multi',max:3,options:['Moderna','Elegante','Cercana','Profesional','Atrevida','Exclusiva','Divertida','Natural','Innovadora','Tradicional']},
  {id:'emociones',section:'general',label:'¿Qué quieres que sientan tus clientes?',type:'multi',max:3,options:['Confianza','Curiosidad','Tranquilidad','Entusiasmo','Seguridad','Cercanía','Admiración','Deseo de comprar']},
  {id:'mensaje',section:'general',label:'¿Qué idea principal deberían recordar de tu negocio?',type:'textarea',hint:'No hace falta escribir un eslogan perfecto.'},
  {id:'estilo',section:'general',label:'¿Con qué estilos visuales te identificas?',type:'multi',max:2,options:['Minimalista','Elegante','Atrevido','Natural','Tecnológico','Clásico','No lo tengo claro']},
  {id:'colores_gustan',section:'general',label:'¿Qué colores te gustan o representan tu marca?',type:'text'},
  {id:'colores_evitar',section:'general',label:'¿Qué colores o elementos visuales evitarías?',type:'text'},
  {id:'referencias',section:'general',label:'Comparte marcas, imágenes o diseños que te gusten',type:'textarea',hint:'Puedes pegar enlaces de Pinterest, Behance, Instagram o páginas web e indicar qué te gusta de ellos.'},
  {id:'referencias_no',section:'general',label:'¿Qué ejemplos o estilos NO te gustan?',type:'textarea'},
  {id:'marca_actual',section:'general',label:'¿Partimos de una identidad visual existente?',type:'single',options:['Sí, queremos mantenerla','Sí, pero queremos renovarla','No, partimos de cero','No lo sé todavía']},
  {id:'materiales',section:'general',label:'¿Qué materiales tienes disponibles?',type:'textarea',hint:'Logotipo, fotografías, fuentes, textos, manual de marca… Indica si puedes compartirlos más adelante.'},
  {id:'libertad',section:'general',label:'¿Cuánta libertad creativa prefieres darnos?',type:'single',options:['Tengo una idea bastante definida','Tengo preferencias pero acepto propuestas','Prefiero dejarme asesorar']},
  {id:'otros',section:'general',label:'¿Algo más que deberíamos saber?',type:'textarea'},
  {id:'logo_usos',section:'identidad',label:'¿Dónde se utilizará principalmente la identidad?',type:'multi',options:['Redes sociales','Web','Tarjetas y papelería','Ropa o merchandising','Rótulos y vehículos','Embalajes']},
  {id:'logo_simbolo',section:'identidad',label:'¿Prefieres un símbolo, un logotipo tipográfico o ambos?',type:'single',options:['Solo letras','Símbolo y letras','Solo símbolo','Necesito asesoramiento']},
  {id:'logo_elementos',section:'identidad',label:'¿Hay símbolos, iniciales o conceptos que te gustaría explorar?',type:'textarea'},
  {id:'logo_competidores',section:'identidad',label:'¿Qué marcas competidoras deberíamos tener en cuenta?',type:'textarea'},
  {id:'logo_aplicaciones',section:'identidad',label:'¿Qué aplicaciones corporativas son prioritarias?',type:'textarea'},
  {id:'logo_restricciones',section:'identidad',label:'¿Hay elementos que deben mantenerse obligatoriamente?',type:'textarea'},
  {id:'grafico_pieza',section:'grafico',label:'¿Qué pieza o piezas necesitas diseñar?',type:'textarea',required:true},
  {id:'grafico_uso',section:'grafico',label:'¿Dónde se utilizarán? ¿Online, impresión o ambos?',type:'single',options:['Digital','Impresión','Ambos','Por definir']},
  {id:'grafico_textos',section:'grafico',label:'¿Qué textos, fechas, precios o mensajes deben aparecer?',type:'textarea'},
  {id:'grafico_prioridad',section:'grafico',label:'¿Qué elemento debe destacar a primera vista?',type:'text'},
  {id:'grafico_medidas',section:'grafico',label:'¿Conoces las medidas o formatos necesarios?',type:'textarea'},
  {id:'grafico_impresion',section:'grafico',label:'¿Necesitas que gestionemos la impresión?',type:'single',options:['Sí','No','Quiero valorar opciones']},
  {id:'web_objetivo',section:'web',label:'¿Qué acción principal debe realizar quien visite tu web?',type:'multi',max:3,options:['Contactar','Comprar','Reservar','Ver servicios','Conocer la marca','Consultar información']},
  {id:'web_referencias',section:'web',label:'¿Qué webs te gustan y por qué?',type:'textarea'},
  {id:'web_secciones',section:'web',label:'¿Qué apartados consideras imprescindibles?',type:'textarea'},
  {id:'web_funciones',section:'web',label:'¿Necesitas funcionalidades o integraciones concretas?',type:'textarea'},
  {id:'web_contenidos',section:'web',label:'¿Ya tienes textos, fotos y contenidos preparados?',type:'single',options:['Sí, todo','Solo una parte','No, necesito ayuda']},
  {id:'web_actual',section:'web',label:'¿Tienes una web actual que quieras renovar?',type:'text'},
  {id:'qr_tipo',section:'qr',label:'¿Qué información quieres mostrar al escanear el QR?',type:'textarea',required:true},
  {id:'qr_categorias',section:'qr',label:'¿Cómo organizarías tus categorías, productos o servicios?',type:'textarea'},
  {id:'qr_fotos',section:'qr',label:'¿Dispones de imágenes, descripciones y precios?',type:'single',options:['Sí, tengo todo','Tengo una parte','Necesito prepararlos']},
  {id:'qr_idiomas',section:'qr',label:'¿En qué idiomas quieres mostrar la información?',type:'text'},
  {id:'qr_soportes',section:'qr',label:'¿Dónde colocarás los códigos QR o soportes NFC?',type:'textarea'},
  {id:'qr_cambios',section:'qr',label:'¿Con qué frecuencia crees que cambiará el contenido?',type:'single',options:['Casi nunca','Varias veces al año','Mensualmente','Semanalmente']},
  {id:'video_objetivo',section:'video',label:'¿Qué quieres conseguir con el vídeo?',type:'textarea',required:true},
  {id:'video_referencias',section:'video',label:'Comparte vídeos o anuncios de referencia',type:'textarea'},
  {id:'video_tono',section:'video',label:'¿Qué tono encaja mejor con el proyecto?',type:'multi',max:2,options:['Cinematográfico','Emocional','Corporativo','Dinámico','Divertido','Minimalista','Documental']},
  {id:'video_ritmo',section:'video',label:'¿Qué ritmo de montaje prefieres?',type:'single',options:['Lento y cuidado','Equilibrado','Rápido y enérgico','Necesito asesoramiento']},
  {id:'video_destino',section:'video',label:'¿Dónde se publicará el vídeo?',type:'multi',options:['Instagram/TikTok','YouTube','Web corporativa','Publicidad','Pantallas en local','Presentaciones']},
  {id:'video_rodaje',section:'video',label:'¿Hay localizaciones, personas o productos imprescindibles?',type:'textarea'},
  {id:'video_duracion',section:'video',label:'¿Tienes una duración aproximada en mente?',type:'text'}
];
export const getBriefingQuestion=id=>BRIEFING_QUESTIONS.find(q=>q.id===id);
export const defaultBriefingQuestions=slug=>{
 const service=BRIEFING_SERVICES.find(s=>s.id===slug);
 return BRIEFING_QUESTIONS.filter(q=>service?.sections.includes(q.section)).map(q=>q.id);
};
