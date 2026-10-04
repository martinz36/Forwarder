import type {
  ChargeBasis,
  LocationType,
  ChargeGroup,
  Currency,
  Direction,
  DocumentVisibility,
  Responsible,
  ServiceMode,
  ShipmentStatus,
  TaxTreatment,
} from "@/generated/prisma/enums";

// Valores con los que arranca toda agencia nueva. Son un punto de partida: cada empresa
// los edita desde configuración. Los precios no van aquí; van en los tarifarios.

export interface DefaultConcept {
  code: string;
  name: string;
  /** Nombres usados en el sistema anterior u otras variantes, para no duplicar al importar. */
  aliases?: string[];
  group: ChargeGroup;
  taxTreatment: TaxTreatment;
  basis: ChargeBasis;
  currency?: Currency;
}

export const DEFAULT_CONCEPTS: DefaultConcept[] = [
  { code: "ORIG_EXW", name: "Gastos EXW", aliases: ["EXW", "EXW CHARGES (Gastos de Origen)", "Gastos en origen (EXW)", "Gastos de origen"], group: "ORIGIN", taxTreatment: "REIMBURSABLE", basis: "PER_SHIPMENT" },
  { code: "ORIG_DOCS", name: "Documentación en origen", aliases: ["Documentación", "Doc fee"], group: "ORIGIN", taxTreatment: "REIMBURSABLE", basis: "PER_DOCUMENT" },
  { code: "ORIG_PICKUP", name: "Recojo en origen", group: "ORIGIN", taxTreatment: "REIMBURSABLE", basis: "PER_SHIPMENT" },
  { code: "FRT_SEA_LCL", name: "Flete internacional LCL", aliases: ["OCEAN FREIGHT TON/M3 (Flete Marítimo)", "Flete marítimo LCL", "Flete internacional", "Flete marítimo"], group: "FREIGHT", taxTreatment: "REIMBURSABLE", basis: "PER_WM" },
  { code: "FRT_SEA_FCL", name: "Flete internacional FCL", aliases: ["Flete marítimo FCL", "OCEAN FREIGHT FCL"], group: "FREIGHT", taxTreatment: "REIMBURSABLE", basis: "PER_CONTAINER" },
  { code: "FRT_AIR", name: "Flete internacional aéreo", aliases: ["Flete aéreo", "AIR FREIGHT (Flete Aéreo)"], group: "FREIGHT", taxTreatment: "REIMBURSABLE", basis: "PER_CHARGEABLE_KG" },
  { code: "INS_CARGO", name: "Seguro de carga", aliases: ["SEGURO DE CARGA (Opcional)", "Seguro"], group: "INSURANCE", taxTreatment: "REIMBURSABLE", basis: "PERCENT_CIF" },
  { code: "DST_VB", name: "Visto bueno", aliases: ["Visto Bueno (V.B.)", "V.B."], group: "DESTINATION", taxTreatment: "TAXED", basis: "PER_DOCUMENT" },
  { code: "DST_UNLOADING", name: "Descarga", aliases: ["Desconsolidación", "Descarga / desconsolidación"], group: "DESTINATION", taxTreatment: "TAXED", basis: "PER_DOCUMENT" },
  { code: "DST_HANDLING", name: "Handling y gastos administrativos", aliases: ["Handling / Gastos Administrativos", "Handling"], group: "DESTINATION", taxTreatment: "TAXED", basis: "PER_SHIPMENT" },
  { code: "DST_BL_FEE", name: "Emisión de BL / HBL", aliases: ["Emisión de BL / HBL"], group: "DESTINATION", taxTreatment: "TAXED", basis: "PER_DOCUMENT" },
  { code: "DST_SEAL", name: "Precinto de seguridad", aliases: ["Precinto de Seguridad"], group: "DESTINATION", taxTreatment: "TAXED", basis: "PER_CONTAINER" },
  { code: "CUS_COMMISSION", name: "Comisión de agencia de aduanas", aliases: ["Despacho Aduanero (Comisión Agente)", "Comisión de aduana", "Agenciamiento de aduanas"], group: "CUSTOMS", taxTreatment: "TAXED", basis: "PER_SHIPMENT" },
  { code: "CUS_OPERATIVE", name: "Gastos operativos", aliases: ["Gastos operativos de despacho"], group: "CUSTOMS", taxTreatment: "TAXED", basis: "PER_SHIPMENT" },
  { code: "CUS_PHYSICAL_EXAM", name: "Aforo físico", aliases: ["Aforo", "Reconocimiento físico", "Previo / reconocimiento físico"], group: "CUSTOMS", taxTreatment: "REIMBURSABLE", basis: "PER_SHIPMENT" },
  { code: "CUS_PRE_INSPECTION", name: "Inspección previa", aliases: ["Previo", "Reconocimiento previo", "Inspección previo"], group: "CUSTOMS", taxTreatment: "REIMBURSABLE", basis: "PER_SHIPMENT" },
  { code: "STO_WAREHOUSE", name: "Almacén", aliases: ["Almacenaje", "Almacenaje en depósito temporal", "Almacenaje Temporal / Depósito"], group: "STORAGE", taxTreatment: "REIMBURSABLE", basis: "PER_SHIPMENT" },
  { code: "INL_TRUCK", name: "Transporte local", aliases: ["Transporte Local / Carga Interna"], group: "INLAND_TRANSPORT", taxTreatment: "TAXED", basis: "PER_SHIPMENT", currency: "PEN" },
  { code: "INL_ESCORT", name: "Resguardo / custodia", group: "INLAND_TRANSPORT", taxTreatment: "TAXED", basis: "PER_SHIPMENT", currency: "PEN" },
  { code: "TAX_DUTIES", name: "Derechos e impuestos de importación", group: "DUTIES_TAXES", taxTreatment: "REIMBURSABLE", basis: "MANUAL" },
  { code: "TAX_PERCEPTION", name: "Percepción del IGV", group: "DUTIES_TAXES", taxTreatment: "REIMBURSABLE", basis: "MANUAL" },
];

export interface DefaultTemplate {
  name: string;
  description: string;
  direction: Direction;
  mode: ServiceMode | null;
  includesFreight: boolean;
  includesCustoms: boolean;
  includesInsurance?: boolean;
  includesInland?: boolean;
  incoterm?: string;
  /**
   * code del concepto, con unidad de cobro distinta u opcional si aplica.
   * `incoterms`: la línea solo aparece con esos incoterms (sin indicar = siempre).
   */
  lines: { code: string; basis?: ChargeBasis; optional?: boolean; incoterms?: string[] }[];
}

/** El flete lo paga el importador (y por eso se cotiza) solo con estos incoterms. */
const BUYER_PAYS_FREIGHT = ["EXW", "FCA", "FAS", "FOB"];
const OPTIONAL_CUSTOMS_EXTRAS = [
  { code: "INS_CARGO", optional: true },
  { code: "CUS_PHYSICAL_EXAM", optional: true },
  { code: "CUS_PRE_INSPECTION", optional: true },
];

export const DEFAULT_TEMPLATES: DefaultTemplate[] = [
  {
    name: "Importación marítima LCL",
    description: "Carga consolidada con despacho y entrega en almacén.",
    direction: "IMPORT", mode: "SEA_LCL", includesFreight: true, includesCustoms: true, includesInland: true, incoterm: "EXW",
    lines: [
      { code: "ORIG_EXW", incoterms: ["EXW"] },
      { code: "ORIG_DOCS", optional: true, incoterms: ["EXW", "FCA"] },
      { code: "FRT_SEA_LCL", incoterms: BUYER_PAYS_FREIGHT },
      { code: "DST_VB" },
      { code: "DST_UNLOADING" },
      { code: "CUS_COMMISSION" },
      { code: "STO_WAREHOUSE" },
      { code: "INL_TRUCK" },
      { code: "CUS_OPERATIVE" },
      ...OPTIONAL_CUSTOMS_EXTRAS,
    ],
  },
  {
    name: "Importación marítima FCL",
    description: "Contenedor completo con despacho y transporte al almacén.",
    direction: "IMPORT", mode: "SEA_FCL", includesFreight: true, includesCustoms: true, includesInland: true, incoterm: "FOB",
    lines: [
      { code: "ORIG_EXW", incoterms: ["EXW"] },
      { code: "ORIG_DOCS", optional: true, incoterms: ["EXW", "FCA"] },
      { code: "FRT_SEA_FCL", incoterms: BUYER_PAYS_FREIGHT },
      { code: "DST_VB" },
      { code: "CUS_COMMISSION" },
      { code: "STO_WAREHOUSE" },
      { code: "INL_TRUCK", basis: "PER_CONTAINER" },
      { code: "CUS_OPERATIVE" },
      ...OPTIONAL_CUSTOMS_EXTRAS,
    ],
  },
  {
    name: "Importación aérea",
    description: "Carga aérea con despacho; el flete se calcula por peso cobrable.",
    direction: "IMPORT", mode: "AIR", includesFreight: true, includesCustoms: true, includesInland: true, incoterm: "FCA",
    lines: [
      { code: "ORIG_EXW", incoterms: ["EXW"] },
      { code: "ORIG_DOCS", optional: true, incoterms: ["EXW", "FCA"] },
      { code: "FRT_AIR", incoterms: BUYER_PAYS_FREIGHT },
      { code: "CUS_COMMISSION" },
      { code: "STO_WAREHOUSE" },
      { code: "INL_TRUCK" },
      { code: "CUS_OPERATIVE" },
      ...OPTIONAL_CUSTOMS_EXTRAS,
    ],
  },
  {
    name: "Solo despacho de importación",
    description: "Agenciamiento de aduanas sin flete (la carga la trae otro).",
    direction: "IMPORT", mode: null, includesFreight: false, includesCustoms: true,
    lines: [
      { code: "CUS_COMMISSION" },
      { code: "STO_WAREHOUSE", optional: true },
      { code: "INL_TRUCK", optional: true },
      { code: "CUS_OPERATIVE" },
      { code: "CUS_PHYSICAL_EXAM", optional: true },
      { code: "CUS_PRE_INSPECTION", optional: true },
    ],
  },
  {
    name: "Exportación marítima FCL",
    description: "Contenedor de exportación con despacho y flete.",
    direction: "EXPORT", mode: "SEA_FCL", includesFreight: true, includesCustoms: true, includesInland: true, incoterm: "FOB",
    lines: [
      { code: "INL_TRUCK", basis: "PER_CONTAINER" },
      { code: "CUS_COMMISSION" },
      { code: "CUS_OPERATIVE" },
      { code: "DST_BL_FEE" },
      { code: "FRT_SEA_FCL" },
      { code: "INS_CARGO", optional: true },
    ],
  },
];

export interface DefaultMilestone {
  code: string;
  name: string;
  clientLabel: string;
  directions: Direction[];
  modes?: ServiceMode[];
  requiresFreight?: boolean;
  requiresCustoms?: boolean;
  requiresInland?: boolean;
  setsStatus?: ShipmentStatus;
  clientVisible?: boolean;
  notifyClient?: boolean;
}

const BOTH: Direction[] = ["IMPORT", "EXPORT"];

export const DEFAULT_MILESTONES: DefaultMilestone[] = [
  { code: "ORDER_CONFIRMED", name: "Orden confirmada", clientLabel: "Orden confirmada", directions: BOTH, setsStatus: "CONFIRMED", notifyClient: true },
  // Importación
  { code: "IMP_PICKUP", name: "Carga recogida en proveedor", clientLabel: "Carga recogida en origen", directions: ["IMPORT"], requiresFreight: true, setsStatus: "AT_ORIGIN", notifyClient: true },
  { code: "IMP_PREALERT", name: "Pre-alerta y documentos de embarque recibidos", clientLabel: "Documentos de embarque recibidos", directions: ["IMPORT"], requiresFreight: true },
  { code: "IMP_DEPARTED", name: "Zarpe / despegue confirmado", clientLabel: "Tu carga salió de origen", directions: ["IMPORT"], requiresFreight: true, setsStatus: "IN_TRANSIT", notifyClient: true },
  { code: "IMP_ARRIVED", name: "Arribo a destino", clientLabel: "Tu carga llegó a destino", directions: ["IMPORT"], setsStatus: "AT_DESTINATION", notifyClient: true },
  { code: "IMP_DAM_NUMBERED", name: "DAM numerada", clientLabel: "Declaración aduanera presentada", directions: ["IMPORT"], requiresCustoms: true, setsStatus: "CUSTOMS_CLEARANCE", notifyClient: true },
  { code: "IMP_CHANNEL", name: "Canal de control asignado", clientLabel: "Canal de control asignado", directions: ["IMPORT"], requiresCustoms: true, notifyClient: true },
  { code: "IMP_TAXES_PAID", name: "Tributos cancelados", clientLabel: "Impuestos pagados", directions: ["IMPORT"], requiresCustoms: true },
  { code: "IMP_RELEASED", name: "Levante autorizado", clientLabel: "Levante autorizado", directions: ["IMPORT"], requiresCustoms: true, setsStatus: "RELEASED", notifyClient: true },
  { code: "IMP_OUT_FOR_DELIVERY", name: "Salida a almacén del cliente", clientLabel: "En camino a tu almacén", directions: ["IMPORT"], requiresInland: true, setsStatus: "OUT_FOR_DELIVERY", notifyClient: true },
  { code: "IMP_DELIVERED", name: "Carga entregada", clientLabel: "Carga entregada", directions: ["IMPORT"], setsStatus: "DELIVERED", notifyClient: true },
  { code: "IMP_EMPTY_RETURNED", name: "Contenedor vacío devuelto", clientLabel: "Contenedor devuelto", directions: ["IMPORT"], modes: ["SEA_FCL"], requiresInland: true },
  // Exportación
  { code: "EXP_BOOKING", name: "Booking confirmado", clientLabel: "Espacio reservado", directions: ["EXPORT"], requiresFreight: true, notifyClient: true },
  { code: "EXP_CARGO_RECEIVED", name: "Carga en terminal / almacén", clientLabel: "Carga recibida para embarque", directions: ["EXPORT"], setsStatus: "AT_ORIGIN", notifyClient: true },
  { code: "EXP_DAM_NUMBERED", name: "DAM de exportación numerada", clientLabel: "Declaración de exportación presentada", directions: ["EXPORT"], requiresCustoms: true, setsStatus: "CUSTOMS_CLEARANCE" },
  { code: "EXP_CHANNEL", name: "Canal de control asignado", clientLabel: "Canal de control asignado", directions: ["EXPORT"], requiresCustoms: true },
  { code: "EXP_SHIPPED", name: "Embarcado / zarpe", clientLabel: "Tu carga fue embarcada", directions: ["EXPORT"], requiresFreight: true, setsStatus: "IN_TRANSIT", notifyClient: true },
  { code: "EXP_BL_ISSUED", name: "BL / AWB emitido", clientLabel: "Documento de embarque emitido", directions: ["EXPORT"], requiresFreight: true, notifyClient: true },
  { code: "EXP_ARRIVED", name: "Arribo a destino", clientLabel: "Tu carga llegó a destino", directions: ["EXPORT"], requiresFreight: true, setsStatus: "AT_DESTINATION", notifyClient: true },
  { code: "EXP_DAM_REGULARIZED", name: "DAM regularizada", clientLabel: "Exportación regularizada", directions: ["EXPORT"], requiresCustoms: true },
  // Cierre
  { code: "SETTLED", name: "Liquidación final enviada", clientLabel: "Liquidación final emitida", directions: BOTH, setsStatus: "CLOSED", notifyClient: true },
];

export interface DefaultDocumentType {
  code: string;
  name: string;
  visibility: DocumentVisibility;
  clientCanUpload?: boolean;
  responsible?: Responsible;
  requiredForDirections?: Direction[];
  requiredForModes?: ServiceMode[];
  requiredWhenCustoms?: boolean;
}

const SEA: ServiceMode[] = ["SEA_FCL", "SEA_LCL"];
const ALL_MODES: ServiceMode[] = ["SEA_FCL", "SEA_LCL", "AIR", "ROAD"];

export const DEFAULT_DOCUMENT_TYPES: DefaultDocumentType[] = [
  { code: "COMMERCIAL_INVOICE", name: "Factura comercial", visibility: "CLIENT", clientCanUpload: true, responsible: "CLIENT", requiredForDirections: BOTH, requiredForModes: ALL_MODES, requiredWhenCustoms: true },
  { code: "PACKING_LIST", name: "Packing list", visibility: "CLIENT", clientCanUpload: true, responsible: "CLIENT", requiredForDirections: BOTH, requiredForModes: ALL_MODES, requiredWhenCustoms: true },
  { code: "HBL", name: "BL / HBL", visibility: "CLIENT", responsible: "STAFF", requiredForDirections: BOTH, requiredForModes: SEA },
  { code: "MBL", name: "Master BL", visibility: "INTERNAL" },
  { code: "AWB", name: "Guía aérea (AWB / HAWB)", visibility: "CLIENT", responsible: "STAFF", requiredForDirections: BOTH, requiredForModes: ["AIR"] },
  { code: "CERT_ORIGIN", name: "Certificado de origen", visibility: "CLIENT", clientCanUpload: true, responsible: "CLIENT" },
  { code: "INSURANCE_POLICY", name: "Póliza o certificado de seguro", visibility: "CLIENT", clientCanUpload: true },
  { code: "PERMITS", name: "Permisos y autorizaciones (VUCE)", visibility: "CLIENT", clientCanUpload: true, responsible: "CLIENT" },
  { code: "TECH_SHEET", name: "Ficha técnica / catálogo", visibility: "CLIENT", clientCanUpload: true, responsible: "CLIENT" },
  { code: "PREALERT", name: "Pre-alerta del agente", visibility: "INTERNAL", responsible: "THIRD_PARTY" },
  { code: "ARRIVAL_NOTICE", name: "Aviso de llegada", visibility: "CLIENT" },
  { code: "DAM", name: "DAM / declaración aduanera", visibility: "CLIENT", requiredForDirections: BOTH, requiredForModes: ALL_MODES, requiredWhenCustoms: true },
  { code: "TAX_PAYMENT", name: "Liquidación y pago de tributos", visibility: "CLIENT" },
  { code: "VOLANTE", name: "Volante del depósito", visibility: "INTERNAL" },
  { code: "DELIVERY_GUIDE", name: "Guía de remisión / cargo de entrega", visibility: "CLIENT" },
  { code: "SUPPLIER_INVOICE", name: "Factura de proveedor (naviera, agente, depósito)", visibility: "INTERNAL", responsible: "THIRD_PARTY" },
  { code: "ISSUED_INVOICE", name: "Comprobante emitido", visibility: "CLIENT" },
  { code: "PAYMENT_PROOF", name: "Constancia de pago del cliente", visibility: "CLIENT", clientCanUpload: true, responsible: "CLIENT" },
  { code: "RUC_RECORD", name: "Ficha RUC", visibility: "CLIENT", clientCanUpload: true, responsible: "CLIENT" },
  { code: "POWER_OF_ATTORNEY", name: "Vigencia de poder / mandato", visibility: "CLIENT", clientCanUpload: true, responsible: "CLIENT" },
  { code: "OTHER", name: "Otro documento", visibility: "INTERNAL", clientCanUpload: true },
];

/** Condiciones generales por defecto. `{empresa}` se reemplaza por la razón social. */
export const DEFAULT_QUOTE_TERMS = `1. VALIDEZ DE OFERTA Y VARIACIÓN DE TARIFAS
• La presente propuesta tiene la validez indicada en la cabecera del documento.
• Las tarifas operativas y fletes internacionales están sujetos a variación según peso y volumen final verificado por el depósito temporal o almacén de origen.

2. FACTURACIÓN Y MODALIDAD DE PAGO
• Los servicios afectos al IGV se facturan conforme a las normas de SUNAT.
• Los conceptos de reembolso (derechos aduaneros, flete internacional, almacenajes, aforos) se liquidan contra comprobantes de terceros.
• El cliente deberá cancelar los derechos e impuestos antes del retiro y levante autorizado de la mercancía.

3. RESPONSABILIDAD DOCUMENTARIA
• El cliente es responsable de entregar la documentación de embarque (factura comercial, packing list, BL / guía aérea, fichas técnicas y permisos VUCE) completa y correcta dentro de los plazos requeridos.
• {empresa} no asume responsabilidad por sobrestadías, almacenajes adicionales o sobrecostos derivados de inspecciones (canal rojo / naranja) no imputables a su gestión.`;

/** Puertos y aeropuertos frecuentes para empezar; cada empresa agrega los suyos. */
export const DEFAULT_LOCATIONS: { code: string; name: string; country: string; type: LocationType }[] = [
  { code: "PECLL", name: "Callao", country: "PE", type: "SEAPORT" },
  { code: "PEPAI", name: "Paita", country: "PE", type: "SEAPORT" },
  { code: "PEMRI", name: "Matarani", country: "PE", type: "SEAPORT" },
  { code: "LIM", name: "Lima – Aeropuerto Jorge Chávez", country: "PE", type: "AIRPORT" },
  { code: "CNSHA", name: "Shanghái", country: "CN", type: "SEAPORT" },
  { code: "CNNGB", name: "Ningbo", country: "CN", type: "SEAPORT" },
  { code: "CNSZX", name: "Shenzhen", country: "CN", type: "SEAPORT" },
  { code: "CNTAO", name: "Qingdao", country: "CN", type: "SEAPORT" },
  { code: "CNXMN", name: "Xiamen", country: "CN", type: "SEAPORT" },
  { code: "HKHKG", name: "Hong Kong", country: "HK", type: "SEAPORT" },
  { code: "KRPUS", name: "Busan", country: "KR", type: "SEAPORT" },
  { code: "INNSA", name: "Nhava Sheva", country: "IN", type: "SEAPORT" },
  { code: "USMIA", name: "Miami", country: "US", type: "SEAPORT" },
  { code: "USLAX", name: "Los Ángeles", country: "US", type: "SEAPORT" },
  { code: "USHOU", name: "Houston", country: "US", type: "SEAPORT" },
  { code: "MXZLO", name: "Manzanillo", country: "MX", type: "SEAPORT" },
  { code: "BRSSZ", name: "Santos", country: "BR", type: "SEAPORT" },
  { code: "CLSAI", name: "San Antonio", country: "CL", type: "SEAPORT" },
  { code: "ESVLC", name: "Valencia", country: "ES", type: "SEAPORT" },
  { code: "DEHAM", name: "Hamburgo", country: "DE", type: "SEAPORT" },
  { code: "PVG", name: "Shanghái – Aeropuerto Pudong", country: "CN", type: "AIRPORT" },
  { code: "MIA", name: "Miami – Aeropuerto Internacional", country: "US", type: "AIRPORT" },
];
