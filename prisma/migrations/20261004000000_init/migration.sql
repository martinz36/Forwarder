
-- CreateEnum
CREATE TYPE "MemberRole" AS ENUM ('OWNER', 'ADMIN', 'OPERATIONS', 'SALES', 'ACCOUNTING', 'VIEWER');

-- CreateEnum
CREATE TYPE "TaxIdType" AS ENUM ('RUC', 'DNI', 'CE', 'PASSPORT', 'FOREIGN_TAX_ID', 'OTHER');

-- CreateEnum
CREATE TYPE "ClientStatus" AS ENUM ('PROSPECT', 'ACTIVE', 'INACTIVE');

-- CreateEnum
CREATE TYPE "PartnerType" AS ENUM ('CARRIER', 'AIRLINE', 'AGENT', 'COLOADER', 'WAREHOUSE', 'TRUCKER', 'CUSTOMS_BROKER', 'INSURER', 'SHIPPER', 'CONSIGNEE', 'OTHER');

-- CreateEnum
CREATE TYPE "LocationType" AS ENUM ('SEAPORT', 'AIRPORT', 'INLAND', 'BORDER_CROSSING');

-- CreateEnum
CREATE TYPE "Currency" AS ENUM ('USD', 'PEN');

-- CreateEnum
CREATE TYPE "Direction" AS ENUM ('IMPORT', 'EXPORT');

-- CreateEnum
CREATE TYPE "ServiceMode" AS ENUM ('SEA_FCL', 'SEA_LCL', 'AIR', 'ROAD');

-- CreateEnum
CREATE TYPE "EquipmentType" AS ENUM ('DRY_20', 'DRY_40', 'HIGH_CUBE_40', 'HIGH_CUBE_45', 'REEFER_20', 'REEFER_40', 'OPEN_TOP_20', 'OPEN_TOP_40', 'FLAT_RACK_20', 'FLAT_RACK_40');

-- CreateEnum
CREATE TYPE "ChargeGroup" AS ENUM ('ORIGIN', 'FREIGHT', 'INSURANCE', 'DESTINATION', 'CUSTOMS', 'INLAND_TRANSPORT', 'STORAGE', 'DUTIES_TAXES', 'OTHER');

-- CreateEnum
CREATE TYPE "TaxTreatment" AS ENUM ('TAXED', 'EXEMPT', 'UNAFFECTED', 'REIMBURSABLE');

-- CreateEnum
CREATE TYPE "ChargeBasis" AS ENUM ('PER_SHIPMENT', 'PER_DOCUMENT', 'PER_CONTAINER', 'PER_WM', 'PER_CBM', 'PER_TON', 'PER_KG', 'PER_CHARGEABLE_KG', 'PER_PACKAGE', 'PER_DAY', 'PERCENT_FOB', 'PERCENT_CIF', 'MANUAL');

-- CreateEnum
CREATE TYPE "RateCardStatus" AS ENUM ('DRAFT', 'ACTIVE', 'ARCHIVED');

-- CreateEnum
CREATE TYPE "QuoteStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'EXPIRED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "QuoteVersionStatus" AS ENUM ('DRAFT', 'SENT', 'ACCEPTED', 'REJECTED', 'SUPERSEDED', 'EXPIRED');

-- CreateEnum
CREATE TYPE "ShipmentStatus" AS ENUM ('CONFIRMED', 'AT_ORIGIN', 'IN_TRANSIT', 'AT_DESTINATION', 'CUSTOMS_CLEARANCE', 'RELEASED', 'OUT_FOR_DELIVERY', 'DELIVERED', 'CLOSED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "MilestoneStatus" AS ENUM ('PENDING', 'DONE', 'SKIPPED');

-- CreateEnum
CREATE TYPE "CustomsRegime" AS ENUM ('IMPORT_FOR_CONSUMPTION', 'TEMPORARY_ADMISSION', 'EXPORT_DEFINITIVE', 'TEMPORARY_EXPORT', 'CUSTOMS_WAREHOUSE', 'TRANSIT', 'OTHER');

-- CreateEnum
CREATE TYPE "CustomsChannel" AS ENUM ('GREEN', 'ORANGE', 'RED');

-- CreateEnum
CREATE TYPE "ChargeSource" AS ENUM ('QUOTE', 'EXTRA', 'ADJUSTMENT');

-- CreateEnum
CREATE TYPE "ApprovalStatus" AS ENUM ('NOT_REQUIRED', 'PENDING', 'APPROVED', 'REJECTED');

-- CreateEnum
CREATE TYPE "DocumentVisibility" AS ENUM ('INTERNAL', 'CLIENT');

-- CreateEnum
CREATE TYPE "DocumentStatus" AS ENUM ('DRAFT', 'PENDING_CLIENT_APPROVAL', 'CHANGES_REQUESTED', 'FINAL', 'VOID');

-- CreateEnum
CREATE TYPE "PartySide" AS ENUM ('STAFF', 'CLIENT', 'SYSTEM');

-- CreateEnum
CREATE TYPE "Responsible" AS ENUM ('CLIENT', 'STAFF', 'THIRD_PARTY');

-- CreateEnum
CREATE TYPE "RequirementStatus" AS ENUM ('PENDING', 'RECEIVED', 'APPROVED', 'WAIVED');

-- CreateEnum
CREATE TYPE "InvoiceType" AS ENUM ('INVOICE', 'RECEIPT', 'CREDIT_NOTE', 'DEBIT_NOTE', 'REIMBURSEMENT_NOTE');

-- CreateEnum
CREATE TYPE "InvoiceStatus" AS ENUM ('DRAFT', 'ISSUED', 'ACCEPTED', 'REJECTED', 'VOIDED');

-- CreateEnum
CREATE TYPE "PaymentMethod" AS ENUM ('BANK_TRANSFER', 'DEPOSIT', 'CASH', 'CHECK', 'CARD', 'OTHER');

-- CreateEnum
CREATE TYPE "PaymentKind" AS ENUM ('ADVANCE', 'SETTLEMENT', 'REFUND');

-- CreateEnum
CREATE TYPE "EventVisibility" AS ENUM ('INTERNAL', 'CLIENT');

-- CreateEnum
CREATE TYPE "NotificationChannel" AS ENUM ('EMAIL', 'WHATSAPP');

-- CreateEnum
CREATE TYPE "NotificationStatus" AS ENUM ('PENDING', 'SENT', 'FAILED', 'CANCELLED');

-- CreateEnum
CREATE TYPE "ShareLinkScope" AS ENUM ('TRACKING', 'QUOTE');

-- CreateTable
CREATE TABLE "Organization" (
    "id" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "legalName" TEXT NOT NULL,
    "taxIdType" "TaxIdType" NOT NULL DEFAULT 'RUC',
    "taxId" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'PE',
    "phone" TEXT,
    "email" TEXT,
    "website" TEXT,
    "logoUrl" TEXT,
    "brandColor" TEXT,
    "timezone" TEXT NOT NULL DEFAULT 'America/Lima',
    "baseCurrency" "Currency" NOT NULL DEFAULT 'USD',
    "taxRate" DECIMAL(5,2) NOT NULL DEFAULT 18,
    "defaultMarkupPct" DECIMAL(6,2) NOT NULL DEFAULT 15,
    "quoteValidityDays" INTEGER NOT NULL DEFAULT 15,
    "quoteTerms" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Organization_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "User" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "emailVerified" BOOLEAN NOT NULL DEFAULT false,
    "image" TEXT,
    "phone" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "User_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Session" (
    "id" TEXT NOT NULL,
    "token" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "ipAddress" TEXT,
    "userAgent" TEXT,
    "userId" TEXT NOT NULL,
    "activeOrganizationId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Session_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Account" (
    "id" TEXT NOT NULL,
    "accountId" TEXT NOT NULL,
    "providerId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "accessToken" TEXT,
    "refreshToken" TEXT,
    "idToken" TEXT,
    "accessTokenExpiresAt" TIMESTAMP(3),
    "refreshTokenExpiresAt" TIMESTAMP(3),
    "scope" TEXT,
    "password" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Account_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Verification" (
    "id" TEXT NOT NULL,
    "identifier" TEXT NOT NULL,
    "value" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Verification_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Membership" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "userId" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'OPERATIONS',
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Membership_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invitation" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "role" "MemberRole" NOT NULL DEFAULT 'OPERATIONS',
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "acceptedAt" TIMESTAMP(3),
    "invitedById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Invitation_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Client" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "taxIdType" "TaxIdType" NOT NULL DEFAULT 'RUC',
    "taxId" TEXT,
    "legalName" TEXT NOT NULL,
    "tradeName" TEXT,
    "status" "ClientStatus" NOT NULL DEFAULT 'ACTIVE',
    "email" TEXT,
    "phone" TEXT,
    "address" TEXT,
    "city" TEXT,
    "country" TEXT NOT NULL DEFAULT 'PE',
    "creditDays" INTEGER NOT NULL DEFAULT 0,
    "creditLimit" DECIMAL(14,2),
    "internalNotes" TEXT,
    "salesRepId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Client_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Contact" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "jobTitle" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "isPrimary" BOOLEAN NOT NULL DEFAULT false,
    "notifyEmail" BOOLEAN NOT NULL DEFAULT true,
    "notifyWhatsapp" BOOLEAN NOT NULL DEFAULT false,
    "portalAccess" BOOLEAN NOT NULL DEFAULT false,
    "userId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Contact_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Partner" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" "PartnerType" NOT NULL,
    "name" TEXT NOT NULL,
    "taxId" TEXT,
    "country" TEXT,
    "email" TEXT,
    "phone" TEXT,
    "contactName" TEXT,
    "notes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "clientId" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Partner_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Location" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "country" TEXT NOT NULL,
    "type" "LocationType" NOT NULL DEFAULT 'SEAPORT',
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Location_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ChargeConcept" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT,
    "name" TEXT NOT NULL,
    "nameEn" TEXT,
    "description" TEXT,
    "group" "ChargeGroup" NOT NULL,
    "taxTreatment" "TaxTreatment" NOT NULL,
    "defaultBasis" "ChargeBasis" NOT NULL DEFAULT 'PER_SHIPMENT',
    "defaultCurrency" "Currency" NOT NULL DEFAULT 'USD',
    "defaultCost" DECIMAL(14,4),
    "defaultPrice" DECIMAL(14,4),
    "defaultMinPrice" DECIMAL(14,2),
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ChargeConcept_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateCard" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "clientId" TEXT,
    "partnerId" TEXT,
    "direction" "Direction",
    "mode" "ServiceMode",
    "validFrom" TIMESTAMP(3),
    "validTo" TIMESTAMP(3),
    "status" "RateCardStatus" NOT NULL DEFAULT 'ACTIVE',
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateCard_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "RateCardLine" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "rateCardId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "originId" TEXT,
    "destinationId" TEXT,
    "carrierId" TEXT,
    "equipment" "EquipmentType",
    "fromQuantity" DECIMAL(12,3),
    "toQuantity" DECIMAL(12,3),
    "basis" "ChargeBasis" NOT NULL,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "cost" DECIMAL(14,4),
    "price" DECIMAL(14,4),
    "minQuantity" DECIMAL(12,3),
    "minCost" DECIMAL(14,2),
    "minPrice" DECIMAL(14,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "RateCardLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteTemplate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "direction" "Direction" NOT NULL,
    "mode" "ServiceMode",
    "includesFreight" BOOLEAN NOT NULL DEFAULT true,
    "includesCustoms" BOOLEAN NOT NULL DEFAULT true,
    "includesInsurance" BOOLEAN NOT NULL DEFAULT false,
    "includesInland" BOOLEAN NOT NULL DEFAULT false,
    "incoterm" TEXT,
    "validityDays" INTEGER,
    "terms" TEXT,
    "defaultNotes" TEXT,
    "isActive" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteTemplate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteTemplateLine" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "templateId" TEXT NOT NULL,
    "conceptId" TEXT NOT NULL,
    "basis" "ChargeBasis",
    "quantity" DECIMAL(12,3),
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "incoterms" TEXT[],
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuoteTemplateLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Quote" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "contactId" TEXT,
    "templateId" TEXT,
    "shipmentId" TEXT,
    "reference" TEXT,
    "status" "QuoteStatus" NOT NULL DEFAULT 'DRAFT',
    "currentVersionNo" INTEGER NOT NULL DEFAULT 1,
    "acceptedVersionId" TEXT,
    "ownerId" TEXT,
    "lostReason" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Quote_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteVersion" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "quoteId" TEXT NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "status" "QuoteVersionStatus" NOT NULL DEFAULT 'DRAFT',
    "direction" "Direction" NOT NULL DEFAULT 'IMPORT',
    "mode" "ServiceMode" NOT NULL DEFAULT 'SEA_LCL',
    "incoterm" TEXT,
    "includesFreight" BOOLEAN NOT NULL DEFAULT true,
    "includesCustoms" BOOLEAN NOT NULL DEFAULT true,
    "includesInsurance" BOOLEAN NOT NULL DEFAULT false,
    "includesInland" BOOLEAN NOT NULL DEFAULT false,
    "originId" TEXT,
    "destinationId" TEXT,
    "originText" TEXT,
    "destinationText" TEXT,
    "pickupAddress" TEXT,
    "deliveryAddress" TEXT,
    "carrierId" TEXT,
    "agentId" TEXT,
    "shipperId" TEXT,
    "routing" TEXT,
    "frequency" TEXT,
    "transitTime" TEXT,
    "etd" TIMESTAMP(3),
    "eta" TIMESTAMP(3),
    "commodity" TEXT,
    "hsCode" TEXT,
    "packages" INTEGER,
    "packageType" TEXT,
    "grossWeightKg" DECIMAL(12,3),
    "volumeCbm" DECIMAL(12,3),
    "chargeableWeightKg" DECIMAL(12,3),
    "cargoValue" DECIMAL(14,2),
    "cargoValueCurrency" TEXT DEFAULT 'USD',
    "isDangerous" BOOLEAN NOT NULL DEFAULT false,
    "isRefrigerated" BOOLEAN NOT NULL DEFAULT false,
    "validUntil" TIMESTAMP(3),
    "paymentTerms" TEXT,
    "exchangeRate" DECIMAL(10,4),
    "notes" TEXT,
    "internalNotes" TEXT,
    "terms" TEXT,
    "totals" JSONB,
    "sentAt" TIMESTAMP(3),
    "sentById" TEXT,
    "viewedAt" TIMESTAMP(3),
    "respondedAt" TIMESTAMP(3),
    "respondedByContactId" TEXT,
    "responseNote" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "QuoteVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteEquipment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "equipment" "EquipmentType" NOT NULL,
    "quantity" INTEGER NOT NULL DEFAULT 1,

    CONSTRAINT "QuoteEquipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "QuoteLine" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "versionId" TEXT NOT NULL,
    "conceptId" TEXT,
    "rateCardLineId" TEXT,
    "providerId" TEXT,
    "description" TEXT NOT NULL,
    "group" "ChargeGroup" NOT NULL,
    "taxTreatment" "TaxTreatment" NOT NULL,
    "basis" "ChargeBasis" NOT NULL DEFAULT 'PER_SHIPMENT',
    "quantity" DECIMAL(12,3) NOT NULL DEFAULT 1,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "unitCost" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "minPrice" DECIMAL(14,2),
    "totalCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "isOptional" BOOLEAN NOT NULL DEFAULT false,
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "QuoteLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Shipment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "number" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "contactId" TEXT,
    "clientReference" TEXT,
    "status" "ShipmentStatus" NOT NULL DEFAULT 'CONFIRMED',
    "statusChangedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "ownerId" TEXT,
    "direction" "Direction" NOT NULL,
    "mode" "ServiceMode" NOT NULL,
    "incoterm" TEXT,
    "includesFreight" BOOLEAN NOT NULL DEFAULT true,
    "includesCustoms" BOOLEAN NOT NULL DEFAULT true,
    "includesInsurance" BOOLEAN NOT NULL DEFAULT false,
    "includesInland" BOOLEAN NOT NULL DEFAULT false,
    "originId" TEXT,
    "destinationId" TEXT,
    "pickupAddress" TEXT,
    "deliveryAddress" TEXT,
    "shipperId" TEXT,
    "carrierId" TEXT,
    "agentId" TEXT,
    "coloaderId" TEXT,
    "warehouseId" TEXT,
    "bookingNumber" TEXT,
    "mblNumber" TEXT,
    "hblNumber" TEXT,
    "vessel" TEXT,
    "voyage" TEXT,
    "flightNumber" TEXT,
    "etd" TIMESTAMP(3),
    "eta" TIMESTAMP(3),
    "atd" TIMESTAMP(3),
    "ata" TIMESTAMP(3),
    "freeDays" INTEGER,
    "commodity" TEXT,
    "hsCode" TEXT,
    "packages" INTEGER,
    "packageType" TEXT,
    "grossWeightKg" DECIMAL(12,3),
    "volumeCbm" DECIMAL(12,3),
    "chargeableWeightKg" DECIMAL(12,3),
    "cargoValue" DECIMAL(14,2),
    "cargoValueCurrency" TEXT DEFAULT 'USD',
    "isDangerous" BOOLEAN NOT NULL DEFAULT false,
    "isRefrigerated" BOOLEAN NOT NULL DEFAULT false,
    "internalNotes" TEXT,
    "closedAt" TIMESTAMP(3),
    "cancelledAt" TIMESTAMP(3),
    "cancelReason" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Shipment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentContainer" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "equipment" "EquipmentType" NOT NULL,
    "number" TEXT,
    "sealNumber" TEXT,
    "grossWeightKg" DECIMAL(12,3),
    "packages" INTEGER,
    "emptyReturnedAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShipmentContainer_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "MilestoneDefinition" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "clientLabel" TEXT NOT NULL,
    "directions" "Direction"[],
    "modes" "ServiceMode"[],
    "requiresFreight" BOOLEAN NOT NULL DEFAULT false,
    "requiresCustoms" BOOLEAN NOT NULL DEFAULT false,
    "requiresInland" BOOLEAN NOT NULL DEFAULT false,
    "setsStatus" "ShipmentStatus",
    "clientVisible" BOOLEAN NOT NULL DEFAULT true,
    "notifyClient" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "MilestoneDefinition_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentMilestone" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "definitionId" TEXT,
    "name" TEXT NOT NULL,
    "clientLabel" TEXT NOT NULL,
    "status" "MilestoneStatus" NOT NULL DEFAULT 'PENDING',
    "plannedAt" TIMESTAMP(3),
    "completedAt" TIMESTAMP(3),
    "completedById" TEXT,
    "setsStatus" "ShipmentStatus",
    "clientVisible" BOOLEAN NOT NULL DEFAULT true,
    "notifyClient" BOOLEAN NOT NULL DEFAULT false,
    "note" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "ShipmentMilestone_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CustomsEntry" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "regime" "CustomsRegime" NOT NULL DEFAULT 'IMPORT_FOR_CONSUMPTION',
    "regimeCode" TEXT,
    "customsOffice" TEXT,
    "declarationNumber" TEXT,
    "numberedAt" TIMESTAMP(3),
    "channel" "CustomsChannel",
    "channelAt" TIMESTAMP(3),
    "inspectionAt" TIMESTAMP(3),
    "releasedAt" TIMESTAMP(3),
    "customsValue" DECIMAL(14,2),
    "dutiesAdValorem" DECIMAL(14,2),
    "igv" DECIMAL(14,2),
    "ipm" DECIMAL(14,2),
    "isc" DECIMAL(14,2),
    "perception" DECIMAL(14,2),
    "otherTaxes" DECIMAL(14,2),
    "totalTaxes" DECIMAL(14,2),
    "taxesCurrency" "Currency" NOT NULL DEFAULT 'USD',
    "taxesPaidAt" TIMESTAMP(3),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CustomsEntry_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShipmentCharge" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "conceptId" TEXT,
    "quoteLineId" TEXT,
    "providerId" TEXT,
    "source" "ChargeSource" NOT NULL DEFAULT 'QUOTE',
    "description" TEXT NOT NULL,
    "group" "ChargeGroup" NOT NULL,
    "taxTreatment" "TaxTreatment" NOT NULL,
    "basis" "ChargeBasis" NOT NULL DEFAULT 'PER_SHIPMENT',
    "quantity" DECIMAL(12,3) NOT NULL DEFAULT 1,
    "currency" "Currency" NOT NULL DEFAULT 'USD',
    "unitCost" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "unitPrice" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalCost" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "totalPrice" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "approvalStatus" "ApprovalStatus" NOT NULL DEFAULT 'NOT_REQUIRED',
    "approvedAt" TIMESTAMP(3),
    "approvedByContactId" TEXT,
    "requiresAdvance" BOOLEAN NOT NULL DEFAULT false,
    "supplierInvoiceRef" TEXT,
    "costPaidAt" TIMESTAMP(3),
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "ShipmentCharge_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialInvoice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "supplierId" TEXT,
    "number" TEXT,
    "date" TIMESTAMP(3),
    "currency" TEXT NOT NULL DEFAULT 'USD',
    "incoterm" TEXT,
    "totalValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "freightAmount" DECIMAL(14,2),
    "insuranceAmount" DECIMAL(14,2),
    "notes" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "CommercialInvoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "CommercialInvoiceItem" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "commercialInvoiceId" TEXT NOT NULL,
    "sku" TEXT,
    "description" TEXT NOT NULL,
    "hsCode" TEXT,
    "quantity" DECIMAL(12,3) NOT NULL DEFAULT 1,
    "unit" TEXT,
    "unitValue" DECIMAL(14,4) NOT NULL DEFAULT 0,
    "totalValue" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "adValoremRate" DECIMAL(5,2),
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "CommercialInvoiceItem_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentType" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT,
    "defaultVisibility" "DocumentVisibility" NOT NULL DEFAULT 'INTERNAL',
    "clientCanUpload" BOOLEAN NOT NULL DEFAULT false,
    "defaultResponsible" "Responsible" NOT NULL DEFAULT 'STAFF',
    "requiredForDirections" "Direction"[],
    "requiredForModes" "ServiceMode"[],
    "requiredWhenCustoms" BOOLEAN NOT NULL DEFAULT false,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "isActive" BOOLEAN NOT NULL DEFAULT true,

    CONSTRAINT "DocumentType_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Document" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT,
    "shipmentId" TEXT,
    "quoteId" TEXT,
    "typeId" TEXT,
    "title" TEXT NOT NULL,
    "visibility" "DocumentVisibility" NOT NULL DEFAULT 'INTERNAL',
    "status" "DocumentStatus" NOT NULL DEFAULT 'DRAFT',
    "uploadedSide" "PartySide" NOT NULL DEFAULT 'STAFF',
    "currentVersionNo" INTEGER NOT NULL DEFAULT 1,
    "clientRespondedAt" TIMESTAMP(3),
    "clientResponseNote" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Document_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentVersion" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "documentId" TEXT NOT NULL,
    "versionNo" INTEGER NOT NULL,
    "storageKey" TEXT,
    "externalUrl" TEXT,
    "fileName" TEXT NOT NULL,
    "mimeType" TEXT,
    "sizeBytes" INTEGER,
    "checksum" TEXT,
    "uploadedById" TEXT,
    "uploadedSide" "PartySide" NOT NULL DEFAULT 'STAFF',
    "note" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "DocumentVersion_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "DocumentRequirement" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "shipmentId" TEXT NOT NULL,
    "typeId" TEXT,
    "documentId" TEXT,
    "title" TEXT NOT NULL,
    "responsible" "Responsible" NOT NULL DEFAULT 'STAFF',
    "isRequired" BOOLEAN NOT NULL DEFAULT true,
    "status" "RequirementStatus" NOT NULL DEFAULT 'PENDING',
    "dueAt" TIMESTAMP(3),
    "notes" TEXT,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "DocumentRequirement_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Invoice" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "shipmentId" TEXT,
    "type" "InvoiceType" NOT NULL,
    "series" TEXT NOT NULL,
    "number" INTEGER,
    "status" "InvoiceStatus" NOT NULL DEFAULT 'DRAFT',
    "issueDate" TIMESTAMP(3),
    "dueDate" TIMESTAMP(3),
    "currency" "Currency" NOT NULL,
    "exchangeRate" DECIMAL(10,4),
    "taxRate" DECIMAL(5,2) NOT NULL,
    "subtotalTaxed" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "subtotalExempt" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "subtotalUnaffected" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "subtotalReimbursable" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "provider" TEXT,
    "providerRef" TEXT,
    "sunatStatus" TEXT,
    "sunatDescription" TEXT,
    "hash" TEXT,
    "xmlUrl" TEXT,
    "cdrUrl" TEXT,
    "pdfUrl" TEXT,
    "relatedInvoiceId" TEXT,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "Invoice_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "InvoiceLine" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "invoiceId" TEXT NOT NULL,
    "chargeId" TEXT,
    "description" TEXT NOT NULL,
    "taxTreatment" "TaxTreatment" NOT NULL,
    "quantity" DECIMAL(12,3) NOT NULL,
    "unitValue" DECIMAL(14,4) NOT NULL,
    "subtotal" DECIMAL(14,2) NOT NULL,
    "taxAmount" DECIMAL(14,2) NOT NULL DEFAULT 0,
    "total" DECIMAL(14,2) NOT NULL,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,

    CONSTRAINT "InvoiceLine_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "Payment" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "clientId" TEXT NOT NULL,
    "shipmentId" TEXT,
    "invoiceId" TEXT,
    "kind" "PaymentKind" NOT NULL DEFAULT 'SETTLEMENT',
    "method" "PaymentMethod" NOT NULL DEFAULT 'BANK_TRANSFER',
    "amount" DECIMAL(14,2) NOT NULL,
    "currency" "Currency" NOT NULL,
    "exchangeRate" DECIMAL(10,4),
    "bank" TEXT,
    "reference" TEXT,
    "paidAt" TIMESTAMP(3) NOT NULL,
    "notes" TEXT,
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "Payment_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ExchangeRate" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "date" DATE NOT NULL,
    "buy" DECIMAL(10,4) NOT NULL,
    "sell" DECIMAL(10,4) NOT NULL,
    "source" TEXT NOT NULL DEFAULT 'SUNAT',

    CONSTRAINT "ExchangeRate_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ActivityEvent" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "type" TEXT NOT NULL,
    "clientId" TEXT,
    "shipmentId" TEXT,
    "quoteId" TEXT,
    "documentId" TEXT,
    "actorUserId" TEXT,
    "actorSide" "PartySide" NOT NULL DEFAULT 'STAFF',
    "visibility" "EventVisibility" NOT NULL DEFAULT 'INTERNAL',
    "title" TEXT NOT NULL,
    "body" TEXT,
    "data" JSONB,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ActivityEvent_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NotificationOutbox" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "eventId" TEXT,
    "channel" "NotificationChannel" NOT NULL,
    "recipient" TEXT NOT NULL,
    "contactId" TEXT,
    "subject" TEXT,
    "template" TEXT NOT NULL,
    "payload" JSONB NOT NULL,
    "status" "NotificationStatus" NOT NULL DEFAULT 'PENDING',
    "attempts" INTEGER NOT NULL DEFAULT 0,
    "lastError" TEXT,
    "scheduledAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "sentAt" TIMESTAMP(3),
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "NotificationOutbox_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "ShareLink" (
    "id" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "scope" "ShareLinkScope" NOT NULL,
    "shipmentId" TEXT,
    "quoteId" TEXT,
    "tokenHash" TEXT NOT NULL,
    "expiresAt" TIMESTAMP(3) NOT NULL,
    "revokedAt" TIMESTAMP(3),
    "lastUsedAt" TIMESTAMP(3),
    "createdById" TEXT,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "ShareLink_pkey" PRIMARY KEY ("id")
);

-- CreateTable
CREATE TABLE "NumberSequence" (
    "organizationId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "lastValue" INTEGER NOT NULL DEFAULT 0,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "NumberSequence_pkey" PRIMARY KEY ("organizationId","key")
);

-- CreateTable
CREATE TABLE "LegacyIdMap" (
    "entity" TEXT NOT NULL,
    "legacyId" TEXT NOT NULL,
    "newId" TEXT NOT NULL,
    "organizationId" TEXT NOT NULL,
    "importedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,

    CONSTRAINT "LegacyIdMap_pkey" PRIMARY KEY ("entity","legacyId")
);

-- CreateIndex
CREATE UNIQUE INDEX "Organization_slug_key" ON "Organization"("slug");

-- CreateIndex
CREATE UNIQUE INDEX "User_email_key" ON "User"("email");

-- CreateIndex
CREATE UNIQUE INDEX "Session_token_key" ON "Session"("token");

-- CreateIndex
CREATE INDEX "Session_userId_idx" ON "Session"("userId");

-- CreateIndex
CREATE INDEX "Account_userId_idx" ON "Account"("userId");

-- CreateIndex
CREATE INDEX "Verification_identifier_idx" ON "Verification"("identifier");

-- CreateIndex
CREATE INDEX "Membership_userId_idx" ON "Membership"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Membership_organizationId_userId_key" ON "Membership"("organizationId", "userId");

-- CreateIndex
CREATE UNIQUE INDEX "Invitation_tokenHash_key" ON "Invitation"("tokenHash");

-- CreateIndex
CREATE INDEX "Invitation_organizationId_email_idx" ON "Invitation"("organizationId", "email");

-- CreateIndex
CREATE INDEX "Client_organizationId_legalName_idx" ON "Client"("organizationId", "legalName");

-- CreateIndex
CREATE UNIQUE INDEX "Client_organizationId_taxIdType_taxId_key" ON "Client"("organizationId", "taxIdType", "taxId");

-- CreateIndex
CREATE INDEX "Contact_organizationId_clientId_idx" ON "Contact"("organizationId", "clientId");

-- CreateIndex
CREATE INDEX "Contact_userId_idx" ON "Contact"("userId");

-- CreateIndex
CREATE UNIQUE INDEX "Contact_clientId_userId_key" ON "Contact"("clientId", "userId");

-- CreateIndex
CREATE INDEX "Partner_organizationId_clientId_idx" ON "Partner"("organizationId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Partner_organizationId_type_name_key" ON "Partner"("organizationId", "type", "name");

-- CreateIndex
CREATE UNIQUE INDEX "Location_organizationId_code_key" ON "Location"("organizationId", "code");

-- CreateIndex
CREATE UNIQUE INDEX "ChargeConcept_organizationId_name_key" ON "ChargeConcept"("organizationId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "ChargeConcept_organizationId_code_key" ON "ChargeConcept"("organizationId", "code");

-- CreateIndex
CREATE INDEX "RateCard_organizationId_status_idx" ON "RateCard"("organizationId", "status");

-- CreateIndex
CREATE INDEX "RateCard_organizationId_clientId_idx" ON "RateCard"("organizationId", "clientId");

-- CreateIndex
CREATE INDEX "RateCardLine_rateCardId_idx" ON "RateCardLine"("rateCardId");

-- CreateIndex
CREATE INDEX "RateCardLine_organizationId_conceptId_idx" ON "RateCardLine"("organizationId", "conceptId");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteTemplate_organizationId_name_key" ON "QuoteTemplate"("organizationId", "name");

-- CreateIndex
CREATE INDEX "QuoteTemplateLine_templateId_idx" ON "QuoteTemplateLine"("templateId");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_acceptedVersionId_key" ON "Quote"("acceptedVersionId");

-- CreateIndex
CREATE INDEX "Quote_organizationId_clientId_idx" ON "Quote"("organizationId", "clientId");

-- CreateIndex
CREATE INDEX "Quote_organizationId_status_idx" ON "Quote"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "Quote_organizationId_number_key" ON "Quote"("organizationId", "number");

-- CreateIndex
CREATE INDEX "QuoteVersion_organizationId_status_idx" ON "QuoteVersion"("organizationId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "QuoteVersion_quoteId_versionNo_key" ON "QuoteVersion"("quoteId", "versionNo");

-- CreateIndex
CREATE INDEX "QuoteEquipment_versionId_idx" ON "QuoteEquipment"("versionId");

-- CreateIndex
CREATE INDEX "QuoteLine_versionId_idx" ON "QuoteLine"("versionId");

-- CreateIndex
CREATE INDEX "Shipment_organizationId_status_idx" ON "Shipment"("organizationId", "status");

-- CreateIndex
CREATE INDEX "Shipment_organizationId_clientId_idx" ON "Shipment"("organizationId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Shipment_organizationId_number_key" ON "Shipment"("organizationId", "number");

-- CreateIndex
CREATE INDEX "ShipmentContainer_shipmentId_idx" ON "ShipmentContainer"("shipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "MilestoneDefinition_organizationId_code_key" ON "MilestoneDefinition"("organizationId", "code");

-- CreateIndex
CREATE INDEX "ShipmentMilestone_shipmentId_sortOrder_idx" ON "ShipmentMilestone"("shipmentId", "sortOrder");

-- CreateIndex
CREATE INDEX "CustomsEntry_shipmentId_idx" ON "CustomsEntry"("shipmentId");

-- CreateIndex
CREATE INDEX "ShipmentCharge_shipmentId_idx" ON "ShipmentCharge"("shipmentId");

-- CreateIndex
CREATE INDEX "CommercialInvoice_shipmentId_idx" ON "CommercialInvoice"("shipmentId");

-- CreateIndex
CREATE INDEX "CommercialInvoiceItem_commercialInvoiceId_idx" ON "CommercialInvoiceItem"("commercialInvoiceId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentType_organizationId_code_key" ON "DocumentType"("organizationId", "code");

-- CreateIndex
CREATE INDEX "Document_organizationId_shipmentId_idx" ON "Document"("organizationId", "shipmentId");

-- CreateIndex
CREATE INDEX "Document_organizationId_clientId_idx" ON "Document"("organizationId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "DocumentVersion_documentId_versionNo_key" ON "DocumentVersion"("documentId", "versionNo");

-- CreateIndex
CREATE INDEX "DocumentRequirement_shipmentId_idx" ON "DocumentRequirement"("shipmentId");

-- CreateIndex
CREATE INDEX "Invoice_organizationId_clientId_idx" ON "Invoice"("organizationId", "clientId");

-- CreateIndex
CREATE UNIQUE INDEX "Invoice_organizationId_series_number_key" ON "Invoice"("organizationId", "series", "number");

-- CreateIndex
CREATE INDEX "InvoiceLine_invoiceId_idx" ON "InvoiceLine"("invoiceId");

-- CreateIndex
CREATE INDEX "Payment_organizationId_clientId_idx" ON "Payment"("organizationId", "clientId");

-- CreateIndex
CREATE INDEX "Payment_shipmentId_idx" ON "Payment"("shipmentId");

-- CreateIndex
CREATE UNIQUE INDEX "ExchangeRate_organizationId_date_key" ON "ExchangeRate"("organizationId", "date");

-- CreateIndex
CREATE INDEX "ActivityEvent_organizationId_shipmentId_createdAt_idx" ON "ActivityEvent"("organizationId", "shipmentId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_organizationId_clientId_createdAt_idx" ON "ActivityEvent"("organizationId", "clientId", "createdAt");

-- CreateIndex
CREATE INDEX "ActivityEvent_organizationId_quoteId_createdAt_idx" ON "ActivityEvent"("organizationId", "quoteId", "createdAt");

-- CreateIndex
CREATE INDEX "NotificationOutbox_status_scheduledAt_idx" ON "NotificationOutbox"("status", "scheduledAt");

-- CreateIndex
CREATE UNIQUE INDEX "ShareLink_tokenHash_key" ON "ShareLink"("tokenHash");

-- AddForeignKey
ALTER TABLE "Session" ADD CONSTRAINT "Session_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Account" ADD CONSTRAINT "Account_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Membership" ADD CONSTRAINT "Membership_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invitation" ADD CONSTRAINT "Invitation_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Client" ADD CONSTRAINT "Client_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Contact" ADD CONSTRAINT "Contact_userId_fkey" FOREIGN KEY ("userId") REFERENCES "User"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Partner" ADD CONSTRAINT "Partner_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Location" ADD CONSTRAINT "Location_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ChargeConcept" ADD CONSTRAINT "ChargeConcept_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateCard" ADD CONSTRAINT "RateCard_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateCard" ADD CONSTRAINT "RateCard_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateCard" ADD CONSTRAINT "RateCard_partnerId_fkey" FOREIGN KEY ("partnerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateCardLine" ADD CONSTRAINT "RateCardLine_rateCardId_fkey" FOREIGN KEY ("rateCardId") REFERENCES "RateCard"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateCardLine" ADD CONSTRAINT "RateCardLine_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "ChargeConcept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateCardLine" ADD CONSTRAINT "RateCardLine_originId_fkey" FOREIGN KEY ("originId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateCardLine" ADD CONSTRAINT "RateCardLine_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "RateCardLine" ADD CONSTRAINT "RateCardLine_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteTemplate" ADD CONSTRAINT "QuoteTemplate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteTemplateLine" ADD CONSTRAINT "QuoteTemplateLine_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "QuoteTemplate"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteTemplateLine" ADD CONSTRAINT "QuoteTemplateLine_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "ChargeConcept"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_templateId_fkey" FOREIGN KEY ("templateId") REFERENCES "QuoteTemplate"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Quote" ADD CONSTRAINT "Quote_acceptedVersionId_fkey" FOREIGN KEY ("acceptedVersionId") REFERENCES "QuoteVersion"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteVersion" ADD CONSTRAINT "QuoteVersion_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteVersion" ADD CONSTRAINT "QuoteVersion_originId_fkey" FOREIGN KEY ("originId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteVersion" ADD CONSTRAINT "QuoteVersion_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteVersion" ADD CONSTRAINT "QuoteVersion_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteVersion" ADD CONSTRAINT "QuoteVersion_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteVersion" ADD CONSTRAINT "QuoteVersion_shipperId_fkey" FOREIGN KEY ("shipperId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteEquipment" ADD CONSTRAINT "QuoteEquipment_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "QuoteVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_versionId_fkey" FOREIGN KEY ("versionId") REFERENCES "QuoteVersion"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "ChargeConcept"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_rateCardLineId_fkey" FOREIGN KEY ("rateCardLineId") REFERENCES "RateCardLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "QuoteLine" ADD CONSTRAINT "QuoteLine_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_contactId_fkey" FOREIGN KEY ("contactId") REFERENCES "Contact"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_originId_fkey" FOREIGN KEY ("originId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_destinationId_fkey" FOREIGN KEY ("destinationId") REFERENCES "Location"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_shipperId_fkey" FOREIGN KEY ("shipperId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_carrierId_fkey" FOREIGN KEY ("carrierId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_agentId_fkey" FOREIGN KEY ("agentId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_coloaderId_fkey" FOREIGN KEY ("coloaderId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Shipment" ADD CONSTRAINT "Shipment_warehouseId_fkey" FOREIGN KEY ("warehouseId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentContainer" ADD CONSTRAINT "ShipmentContainer_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "MilestoneDefinition" ADD CONSTRAINT "MilestoneDefinition_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentMilestone" ADD CONSTRAINT "ShipmentMilestone_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentMilestone" ADD CONSTRAINT "ShipmentMilestone_definitionId_fkey" FOREIGN KEY ("definitionId") REFERENCES "MilestoneDefinition"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CustomsEntry" ADD CONSTRAINT "CustomsEntry_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentCharge" ADD CONSTRAINT "ShipmentCharge_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentCharge" ADD CONSTRAINT "ShipmentCharge_conceptId_fkey" FOREIGN KEY ("conceptId") REFERENCES "ChargeConcept"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentCharge" ADD CONSTRAINT "ShipmentCharge_quoteLineId_fkey" FOREIGN KEY ("quoteLineId") REFERENCES "QuoteLine"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShipmentCharge" ADD CONSTRAINT "ShipmentCharge_providerId_fkey" FOREIGN KEY ("providerId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialInvoice" ADD CONSTRAINT "CommercialInvoice_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialInvoice" ADD CONSTRAINT "CommercialInvoice_supplierId_fkey" FOREIGN KEY ("supplierId") REFERENCES "Partner"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "CommercialInvoiceItem" ADD CONSTRAINT "CommercialInvoiceItem_commercialInvoiceId_fkey" FOREIGN KEY ("commercialInvoiceId") REFERENCES "CommercialInvoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentType" ADD CONSTRAINT "DocumentType_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Document" ADD CONSTRAINT "Document_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "DocumentType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentVersion" ADD CONSTRAINT "DocumentVersion_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRequirement" ADD CONSTRAINT "DocumentRequirement_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRequirement" ADD CONSTRAINT "DocumentRequirement_typeId_fkey" FOREIGN KEY ("typeId") REFERENCES "DocumentType"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "DocumentRequirement" ADD CONSTRAINT "DocumentRequirement_documentId_fkey" FOREIGN KEY ("documentId") REFERENCES "Document"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Invoice" ADD CONSTRAINT "Invoice_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "InvoiceLine" ADD CONSTRAINT "InvoiceLine_chargeId_fkey" FOREIGN KEY ("chargeId") REFERENCES "ShipmentCharge"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "Payment" ADD CONSTRAINT "Payment_invoiceId_fkey" FOREIGN KEY ("invoiceId") REFERENCES "Invoice"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ExchangeRate" ADD CONSTRAINT "ExchangeRate_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_clientId_fkey" FOREIGN KEY ("clientId") REFERENCES "Client"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ActivityEvent" ADD CONSTRAINT "ActivityEvent_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationOutbox" ADD CONSTRAINT "NotificationOutbox_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NotificationOutbox" ADD CONSTRAINT "NotificationOutbox_eventId_fkey" FOREIGN KEY ("eventId") REFERENCES "ActivityEvent"("id") ON DELETE SET NULL ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_shipmentId_fkey" FOREIGN KEY ("shipmentId") REFERENCES "Shipment"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "ShareLink" ADD CONSTRAINT "ShareLink_quoteId_fkey" FOREIGN KEY ("quoteId") REFERENCES "Quote"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE "NumberSequence" ADD CONSTRAINT "NumberSequence_organizationId_fkey" FOREIGN KEY ("organizationId") REFERENCES "Organization"("id") ON DELETE CASCADE ON UPDATE CASCADE;

