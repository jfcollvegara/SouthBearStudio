// Mapa único del futuro ERP interno de SouthBear Studio.
// No contiene datos personales, financieros ni credenciales.
export const privateNavigation = [
  {label:'PANEL',items:[
    {slug:'',title:'Inicio',icon:'layout-dashboard'}
  ]},
  {label:'GESTIÓN DEL ESTUDIO',items:[
    {slug:'clientes',title:'Clientes',icon:'users'},
    {slug:'formularios',title:'Formularios',icon:'file-text'},
    {slug:'briefings',title:'Briefings',icon:'folder'},
    {slug:'correos-promociones',title:'Correos promociones',icon:'file-text'},
    {slug:'campanas',title:'Campañas promocionales',icon:'file-text'},
    {slug:'plantillas-correo',title:'Plantillas de correo',icon:'file-text'},
    {slug:'facturas',title:'Facturación',icon:'receipt'},
    {slug:'contabilidad',title:'Contabilidad',icon:'book-open'}
  ]}
];

// Las rutas de herramientas anteriores permanecen conservadas y protegidas,
// pero no aparecen en el menú simplificado. No se borra ningún dato.
// Iconos lineales del sistema de gestión (mismo lenguaje audiovisual).
export const privateIcons = {
  'layout-dashboard':['M3 3h7v7H3z','M14 3h7v7h-7z','M3 14h7v7H3z','M14 14h7v7h-7z'],
  'users':['M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2','M9 11a4 4 0 1 0 0-8 4 4 0 0 0 0 8z','M22 21v-2a4 4 0 0 0-3-3.87','M16 3.13a4 4 0 0 1 0 7.75'],
  'target':['M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z','M12 17a5 5 0 1 0 0-10 5 5 0 0 0 0 10z','M12 12h.01'],
  'file-text':['M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z','M14 2v6h6','M8 13h8','M8 17h8'],
  'layers':['M12 2 2 7l10 5 10-5-10-5z','M2 12l10 5 10-5','M2 17l10 5 10-5'],
  'calendar':['M8 2v4','M16 2v4','M3 10h18','M5 4h14a2 2 0 0 1 2 2v13a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2z'],
  'receipt':['M4 2v20l4-2 4 2 4-2 4 2V2l-4 2-4-2-4 2-4-2z','M8 9h8','M8 13h8','M8 17h4'],
  'wallet':['M20 7V5a2 2 0 0 0-2-2H5a3 3 0 0 0 0 6h15v12H5a3 3 0 0 1-3-3V6','M22 12h-5a2 2 0 0 0 0 4h5z'],
  'credit-card':['M2 5h20v14H2z','M2 10h20','M6 15h4'],
  'truck':['M1 5h14v12H1z','M15 9h4l4 4v4h-8z','M4 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0z','M16 17a2 2 0 1 0 4 0 2 2 0 0 0-4 0z'],
  'book-open':['M12 7a7 7 0 0 0-10-2v14a7 7 0 0 1 10 2','M12 7a7 7 0 0 1 10-2v14a7 7 0 0 0-10 2','M12 7v14'],
  'landmark':['M3 10h18','M2 6l10-4 10 4v3H2z','M5 10v8','M10 10v8','M14 10v8','M19 10v8','M2 22h20'],
  'briefcase':['M3 7h18v14H3z','M8 7V5a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2','M3 12h18','M11 12v2h2v-2'],
  'folder':['M3 6h7l2 2h9v12H3z'],
  'chart':['M3 3v18h18','M7 16l4-5 3 2 5-7'],
  'settings':['M12 15.5a3.5 3.5 0 1 0 0-7 3.5 3.5 0 0 0 0 7z','M19.4 15a1.7 1.7 0 0 0 .34 1.88l.06.06-2 2-.06-.06A1.7 1.7 0 0 0 15.85 18l-.11.04L15.3 21h-2.8l-.45-2.96A1.7 1.7 0 0 0 10.1 18l-2.11.95-2-2 .95-2.11A1.7 1.7 0 0 0 6.04 13L3 12.5v-2.8l3.04-.45A1.7 1.7 0 0 0 7 7.3L6 5.3l2-2 2.1.94A1.7 1.7 0 0 0 12 3.5L12.5 1h2.8l.45 2.96A1.7 1.7 0 0 0 17.7 5l2.1-.95 2 2-.95 2.11A1.7 1.7 0 0 0 21 10l3 .5v2.8l-3 .45'],
};

export const privateModules = [
  {slug:'clientes',title:'Clientes',tag:'CRM / CONTACTOS',intro:'Centraliza la ficha de cada cliente y su historial comercial, económico y documental.',features:['Datos fiscales y de contacto','Historial de presupuestos y proyectos','Facturas y cobros asociados','Notas, documentos y seguimiento']},
  {slug:'oportunidades',title:'Oportunidades',tag:'CRM / VENTAS',intro:'Organiza solicitudes, contactos potenciales y negociaciones hasta convertirlos en proyectos.',features:['Embudo comercial por etapas','Importe previsto y probabilidad','Próximo contacto y recordatorios','Conversión a presupuesto o proyecto']},
  {slug:'presupuestos',title:'Presupuestos',tag:'VENTAS / DOCUMENTOS',intro:'Prepara, envía y sigue presupuestos vinculados a clientes y servicios del estudio.',features:['Líneas y servicios personalizables','Impuestos, descuentos y condiciones','Generación PDF y envío','Estados y aceptación del cliente']},
  {slug:'proyectos',title:'Proyectos',tag:'OPERACIONES / PRODUCCIÓN',intro:'Controla entregables, revisiones, costes, plazos y rentabilidad de cada trabajo.',features:['Fases, tareas y fechas límite','Archivos y revisiones','Costes y tiempo invertido','Presupuesto, factura y cobro relacionados']},
  {slug:'agenda',title:'Agenda y tareas',tag:'OPERACIONES / CALENDARIO',intro:'Integra la organización y seguimiento de trabajos con Google Calendar, como última fase del sistema.',features:['Calendario de trabajos y reuniones','Tareas con prioridades','Alertas de vencimiento','Vista diaria y semanal']},
  {slug:'facturas',title:'Facturación',tag:'FINANZAS / EMISIÓN',intro:'Gestiona todo el ciclo de facturación, desde la emisión hasta las rectificaciones y el archivo.',features:['Series y numeración controladas','Facturas completas y simplificadas cuando proceda','PDF, estados y rectificativas','Registro y trazabilidad conforme a la normativa aplicable']},
  {slug:'cobros',title:'Cobros',tag:'FINANZAS / TESORERÍA',intro:'Controla lo pendiente, lo cobrado y los vencimientos de clientes.',features:['Cobros parciales y totales','Fechas de vencimiento','Métodos de pago y conciliación','Recordatorios de facturas pendientes']},
  {slug:'gastos',title:'Gastos',tag:'FINANZAS / COMPRAS',intro:'Clasifica compras, gastos recurrentes e inversiones, con sus justificantes.',features:['Categorías e impuestos soportados','Tickets y facturas de compra','Gastos recurrentes','Vinculación con proyectos y proveedores']},
  {slug:'proveedores',title:'Proveedores',tag:'RELACIONES / COMPRAS',intro:'Conserva datos, condiciones, facturas y trabajos subcontratados.',features:['Fichas fiscales y de contacto','Historial de compras','Pagos y documentos','Servicios subcontratados']},
  {slug:'contabilidad',title:'Contabilidad',tag:'FINANZAS / LIBROS',intro:'Obtén una visión organizada de ingresos, gastos, movimientos y libros necesarios.',features:['Libros y registros contables','Conciliación de movimientos','Resultado y flujo de caja','Exportación para asesoría']},
  {slug:'impuestos',title:'Impuestos',tag:'FINANZAS / FISCALIDAD',intro:'Prepara la información fiscal con trazabilidad sin sustituir la revisión de tu asesoría.',features:['Resumen de impuestos repercutidos y soportados','Periodos y vencimientos','Informes para declaraciones','Archivo de justificantes y modelos']},
  {slug:'catalogo',title:'Servicios y tarifas',tag:'ESTUDIO / OFERTA',intro:'Define servicios, paquetes, extras, precios y sus condiciones comerciales.',features:['Catálogo de servicios','Tarifas, extras y descuentos','Plantillas para presupuestos','Historial de cambios de precios']},
  {slug:'documentos',title:'Documentos',tag:'ESTUDIO / ARCHIVO',intro:'Organiza contratos, entregables, justificantes y ficheros del negocio.',features:['Archivos por cliente y proyecto','Contratos y autorizaciones','Búsqueda y filtros','Control de acceso y copias de seguridad']},
  {slug:'informes',title:'Informes',tag:'ESTUDIO / ANALÍTICA',intro:'Consulta indicadores reales para tomar decisiones sobre ventas y rentabilidad.',features:['Facturación y cobros por periodo','Clientes y servicios más rentables','Costes por proyecto','Exportación de informes']},
  {slug:'configuracion',title:'Configuración',tag:'ESTUDIO / SISTEMA',intro:'Configura los datos fiscales de SouthBear Studio y el funcionamiento del sistema.',features:['Datos del emisor y numeración','Impuestos y métodos de pago','Permisos y sesiones','Copias de seguridad e integraciones']}
];
export const privateSections = privateNavigation.map(group=>({
 ...group,items:group.items.map(item=>({...item,href:item.slug?'/acceso/panel/'+item.slug+'/':'/acceso/panel/'}))
}));
