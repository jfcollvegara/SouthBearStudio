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
  {id:'identidad',title:'Identidad visual y logotipo',subtitle:'Formas, tipografías y personalidad de marca.'},
  {id:'grafico',title:'Diseño gráfico y publicidad',subtitle:'Composición, letras y carácter visual.'},
  {id:'web',title:'Diseño y desarrollo web',subtitle:'Estética, sensaciones y referencias visuales.'},
  {id:'qr',title:'Cartas digitales y QR/NFC',subtitle:'Estilo de la experiencia digital en el móvil.'},
  {id:'video',title:'Producción audiovisual',subtitle:'Estética audiovisual, ritmo y emociones.'}
];
export const BRIEFING_QUESTIONS=[
  {id:'actividad',section:'general',label:'¿A qué se dedica tu negocio?',type:'textarea',required:true,hint:'Explícanos brevemente qué ofreces y qué quieres que conozca el público.'},
  {id:'diferencia',section:'general',label:'¿Qué hace especial a tu negocio frente a otros?',type:'textarea',defaultOff:true},
  {id:'publico',section:'general',label:'¿A qué tipo de personas o empresas quieres llegar?',type:'textarea',required:true},
  {id:'objetivo',section:'general',label:'¿Qué te gustaría conseguir con este proyecto?',type:'textarea',required:true},
  {id:'personalidad',section:'general',label:'Si tu marca fuera una persona, ¿cómo sería?',type:'multi',max:3,options:['Moderna','Elegante','Cercana','Profesional','Atrevida','Exclusiva','Divertida','Natural','Innovadora','Tradicional']},
  {id:'emociones',section:'general',label:'¿Qué quieres que sientan tus clientes?',type:'multi',max:3,options:['Confianza','Curiosidad','Tranquilidad','Entusiasmo','Seguridad','Cercanía','Admiración','Deseo de comprar'],defaultOff:true},
  {id:'mensaje',section:'general',label:'¿Qué idea principal deberían recordar de tu negocio?',type:'textarea',hint:'No hace falta escribir un eslogan perfecto.',defaultOff:true},
  {id:'estilo',section:'general',label:'¿Con qué estilos visuales te identificas?',type:'multi',max:2,options:['Minimalista','Elegante','Atrevido','Natural','Tecnológico','Clásico','No lo tengo claro']},
  {id:'colores_gustan',section:'general',label:'¿Qué colores te gustan o representan tu marca?',type:'text',defaultOff:true},
  {id:'colores_evitar',section:'general',label:'¿Qué colores o elementos visuales evitarías?',type:'text',defaultOff:true},
  {id:'referencias',section:'general',label:'Comparte marcas, imágenes o diseños que te gusten',type:'textarea',hint:'Puedes pegar enlaces de Pinterest, Behance, Instagram o páginas web e indicar qué te gusta de ellos.'},
  {id:'referencias_no',section:'general',label:'¿Qué ejemplos o estilos NO te gustan?',type:'textarea',defaultOff:true},
  {id:'marca_actual',section:'general',label:'¿Partimos de una identidad visual existente?',type:'single',options:['Sí, queremos mantenerla','Sí, pero queremos renovarla','No, partimos de cero','No lo sé todavía']},
  {id:'materiales',section:'general',label:'¿Qué materiales tienes disponibles?',type:'textarea',hint:'Logotipo, fotografías, fuentes, textos, manual de marca… Indica si puedes compartirlos más adelante.',legacy:true},
  {id:'libertad',section:'general',label:'¿Cuánta libertad creativa prefieres darnos?',type:'single',options:['Tengo una idea bastante definida','Tengo preferencias pero acepto propuestas','Prefiero dejarme asesorar']},
  {id:'otros',section:'general',label:'¿Algo más que deberíamos saber?',type:'textarea',defaultOff:true},
  {id:'logo_usos',section:'identidad',label:'¿Dónde se utilizará principalmente la identidad?',type:'multi',options:['Redes sociales','Web','Tarjetas y papelería','Ropa o merchandising','Rótulos y vehículos','Embalajes'],legacy:true},
  {id:'logo_simbolo',section:'identidad',label:'¿Prefieres un símbolo, un logotipo tipográfico o ambos?',type:'single',options:['Solo letras','Símbolo y letras','Solo símbolo','Necesito asesoramiento']},
  {id:'logo_elementos',section:'identidad',label:'¿Hay símbolos, iniciales o conceptos que te gustaría explorar?',type:'textarea',defaultOff:true},
  {id:'logo_competidores',section:'identidad',label:'¿Qué marcas competidoras deberíamos tener en cuenta?',type:'textarea',legacy:true},
  {id:'logo_aplicaciones',section:'identidad',label:'¿Qué aplicaciones corporativas son prioritarias?',type:'textarea',legacy:true},
  {id:'logo_restricciones',section:'identidad',label:'¿Hay elementos que deben mantenerse obligatoriamente?',type:'textarea',legacy:true},
  {id:'grafico_pieza',section:'grafico',label:'¿Qué pieza o piezas necesitas diseñar?',type:'textarea',required:true,legacy:true},
  {id:'grafico_uso',section:'grafico',label:'¿Dónde se utilizarán? ¿Online, impresión o ambos?',type:'single',options:['Digital','Impresión','Ambos','Por definir'],legacy:true},
  {id:'grafico_textos',section:'grafico',label:'¿Qué textos, fechas, precios o mensajes deben aparecer?',type:'textarea',legacy:true},
  {id:'grafico_prioridad',section:'grafico',label:'¿Qué elemento debe destacar a primera vista?',type:'text',legacy:true},
  {id:'grafico_medidas',section:'grafico',label:'¿Conoces las medidas o formatos necesarios?',type:'textarea',legacy:true},
  {id:'grafico_impresion',section:'grafico',label:'¿Necesitas que gestionemos la impresión?',type:'single',options:['Sí','No','Quiero valorar opciones'],legacy:true},
  {id:'web_objetivo',section:'web',label:'¿Qué acción principal debe realizar quien visite tu web?',type:'multi',max:3,options:['Contactar','Comprar','Reservar','Ver servicios','Conocer la marca','Consultar información'],legacy:true},
  {id:'web_referencias',section:'web',label:'¿Qué webs te gustan y por qué?',type:'textarea'},
  {id:'web_secciones',section:'web',label:'¿Qué apartados consideras imprescindibles?',type:'textarea',legacy:true},
  {id:'web_funciones',section:'web',label:'¿Necesitas funcionalidades o integraciones concretas?',type:'textarea',legacy:true},
  {id:'web_contenidos',section:'web',label:'¿Ya tienes textos, fotos y contenidos preparados?',type:'single',options:['Sí, todo','Solo una parte','No, necesito ayuda'],legacy:true},
  {id:'web_actual',section:'web',label:'¿Tienes una web actual que quieras renovar?',type:'text',legacy:true},
  {id:'qr_tipo',section:'qr',label:'¿Qué información quieres mostrar al escanear el QR?',type:'textarea',required:true,legacy:true},
  {id:'qr_categorias',section:'qr',label:'¿Cómo organizarías tus categorías, productos o servicios?',type:'textarea',legacy:true},
  {id:'qr_fotos',section:'qr',label:'¿Dispones de imágenes, descripciones y precios?',type:'single',options:['Sí, tengo todo','Tengo una parte','Necesito prepararlos'],legacy:true},
  {id:'qr_idiomas',section:'qr',label:'¿En qué idiomas quieres mostrar la información?',type:'text',legacy:true},
  {id:'qr_soportes',section:'qr',label:'¿Dónde colocarás los códigos QR o soportes NFC?',type:'textarea',legacy:true},
  {id:'qr_cambios',section:'qr',label:'¿Con qué frecuencia crees que cambiará el contenido?',type:'single',options:['Casi nunca','Varias veces al año','Mensualmente','Semanalmente'],legacy:true},
  {id:'video_objetivo',section:'video',label:'¿Qué quieres conseguir con el vídeo?',type:'textarea',required:true,legacy:true},
  {id:'video_referencias',section:'video',label:'Comparte vídeos o anuncios de referencia',type:'textarea'},
  {id:'video_tono',section:'video',label:'¿Qué tono encaja mejor con el proyecto?',type:'multi',max:2,options:['Cinematográfico','Emocional','Corporativo','Dinámico','Divertido','Minimalista','Documental']},
  {id:'video_ritmo',section:'video',label:'¿Qué ritmo de montaje prefieres?',type:'single',options:['Lento y cuidado','Equilibrado','Rápido y enérgico','Necesito asesoramiento']},
  {id:'video_destino',section:'video',label:'¿Dónde se publicará el vídeo?',type:'multi',options:['Instagram/TikTok','YouTube','Web corporativa','Publicidad','Pantallas en local','Presentaciones'],legacy:true},
  {id:'video_rodaje',section:'video',label:'¿Hay localizaciones, personas o productos imprescindibles?',type:'textarea',legacy:true},
  {id:'video_duracion',section:'video',label:'¿Tienes una duración aproximada en mente?',type:'text',legacy:true},
  // Nuevas preguntas exclusivas de dirección creativa. Sin medidas ni requisitos de producción.
  {"id":"identidad_formas","section":"identidad","label":"¿Qué formas o trazos encajan con tu marca?","type":"multi","max":2,"options":["Geométricos y precisos","Orgánicos y naturales","Líneas finas y delicadas","Formas contundentes","Sin preferencia"]},
  {"id":"identidad_tipografia","section":"identidad","label":"¿Qué estilo de letras imaginas para tu identidad?","type":"multi","max":2,"options":["Modernas y sencillas","Elegantes y refinadas","Con mucha personalidad","Clásicas y atemporales","No lo tengo claro"]},
  {"id":"identidad_caracter","section":"identidad","label":"¿Quieres una identidad más discreta o expresiva?","type":"single","options":["Discreta y sofisticada","Equilibrada","Llamativa y memorable","Prefiero asesoramiento"]},
  {"id":"identidad_inspiracion","section":"identidad","label":"¿Qué logotipos te gustan y por qué?","type":"textarea"},
  {"id":"grafico_composicion","section":"grafico","label":"¿Qué composiciones visuales te atraen?","type":"single","options":["Limpias, con mucho espacio","Editoriales y tipográficas","Coloridas y gráficas","Fotográficas y visuales","No lo tengo claro"]},
  {"id":"grafico_caracter","section":"grafico","label":"¿Prefieres un diseño sobrio o con mucha energía?","type":"single","options":["Sobrio y elegante","Equilibrado","Atrevido y dinámico","Quiero valorar propuestas"]},
  {"id":"grafico_tipografia","section":"grafico","label":"¿Qué estilo de letras prefieres?","type":"multi","max":2,"options":["Simple y moderno","Clásico y elegante","Grande y protagonista","Informal y expresivo","Necesito asesoramiento"]},
  {"id":"grafico_referencias","section":"grafico","label":"¿Qué carteles, campañas o piezas gráficas te gustan y por qué?","type":"textarea"},
  {"id":"web_estilo","section":"web","label":"¿Qué aspecto visual te gustaría para tu web?","type":"multi","max":2,"options":["Minimalista y limpio","Elegante y premium","Creativo y diferente","Cercano y cálido","Tecnológico y moderno","Corporativo y sobrio"]},
  {"id":"web_espacio","section":"web","label":"¿Cómo prefieres que se vea la información?","type":"single","options":["Mucho espacio, pocos elementos","Equilibrio entre imágenes y texto","Muy visual, con imágenes protagonistas","No lo tengo claro"]},
  {"id":"web_movimiento","section":"web","label":"¿Qué animaciones te gustan en una web?","type":"single","options":["Sin apenas animaciones","Movimiento suave y discreto","Animaciones originales y llamativas","Prefiero asesoramiento"]},
  {"id":"web_primera_impresion","section":"web","label":"¿Qué sensación debería transmitir el diseño al entrar?","type":"multi","max":2,"options":["Confianza y profesionalidad","Creatividad y personalidad","Exclusividad y calidad","Cercanía y naturalidad","Innovación y modernidad"]},
  {"id":"web_descartes","section":"web","label":"¿Qué estilos de páginas web NO te gustan?","type":"textarea"},
  {"id":"qr_estetica","section":"qr","label":"¿Qué estilo visual te gustaría para tu carta o catálogo digital?","type":"multi","max":2,"options":["Minimalista y limpio","Elegante y sofisticado","Cercano y artesanal","Moderno y colorido","Clásico y discreto","No lo tengo claro"]},
  {"id":"qr_visual","section":"qr","label":"¿Cómo te gusta que se vea una carta en el móvil?","type":"single","options":["Muy visual, fotografías grandes","Equilibrio entre imágenes y texto","Sencillo y tipográfico","Prefiero asesoramiento"]},
  {"id":"qr_atmosfera","section":"qr","label":"¿Qué sensación quieres transmitir con su aspecto?","type":"multi","max":2,"options":["Calidad y exclusividad","Calidez y cercanía","Frescura y modernidad","Tradición y autenticidad","Diversión y originalidad"]},
  {"id":"qr_referencias","section":"qr","label":"¿Has visto alguna carta o catálogo digital cuyo diseño te guste?","type":"textarea"},
  {"id":"video_estetica","section":"video","label":"¿Qué estética visual imaginas para el vídeo?","type":"multi","max":2,"options":["Natural y realista","Cinematográfica","Luminosa y cálida","Oscura y dramática","Colorida y atrevida","Minimalista y limpia"]},
  {"id":"video_emocion","section":"video","label":"¿Qué debería sentir el espectador al verlo?","type":"multi","max":2,"options":["Emoción","Confianza","Curiosidad","Alegría","Inspiración","Admiración","Cercanía"]},
  {"id":"video_musica","section":"video","label":"¿Qué ambiente musical encaja con el estilo?","type":"single","options":["Suave y emotivo","Elegante y ambiental","Enérgico y dinámico","Sin preferencia"]},
];
export const getBriefingQuestion=id=>BRIEFING_QUESTIONS.find(q=>q.id===id);
// Mantener las preguntas antiguas para enlaces ya emitidos y respuestas recibidas.
// No ofrecerlas en los nuevos formularios (son asuntos para la entrevista).
export const activeBriefingQuestions=()=>BRIEFING_QUESTIONS.filter(q=>!q.legacy);
export const defaultBriefingQuestions=(slug,mode='desde-cero')=>{
 const service=BRIEFING_SERVICES.find(s=>s.id===slug);
 if(!service)return [];
 const styleOnly=new Set(['estilo','referencias','referencias_no','libertad']);
 return BRIEFING_QUESTIONS.filter(q=>!q.legacy&&!q.defaultOff &&
  (q.section==='general'?(mode==='identidad-existente'?styleOnly.has(q.id):true):service.sections.includes(q.section))
 ).map(q=>q.id);
};
