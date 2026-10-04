import { test } from "node:test";
import assert from "node:assert/strict";
import {
  parseContainers,
  parseDate,
  parseIncoterm,
  parsePackages,
  parseServiceMode,
  parseVolumeCbm,
  parseWeightKg,
} from "./parse";

test("peso en kg o toneladas", () => {
  assert.equal(parseWeightKg("960 KG"), 960);
  assert.equal(parseWeightKg("0.96 Ton"), 960);
  assert.equal(parseWeightKg("1,250.5 kg"), 1250.5);
  assert.equal(parseWeightKg("0,96 TM"), 960);
  assert.equal(parseWeightKg("18500 KG"), 18500);
  assert.equal(parseWeightKg("pendiente"), null);
  assert.equal(parseWeightKg(null), null);
});

test("volumen", () => {
  assert.equal(parseVolumeCbm("2.5 CBM"), 2.5);
  assert.equal(parseVolumeCbm("0.4 m3"), 0.4);
  assert.equal(parseVolumeCbm(""), null);
});

test("bultos", () => {
  assert.deepEqual(parsePackages("3 PALETAS"), { packages: 3, packageType: "PALETAS" });
  assert.deepEqual(parsePackages("12"), { packages: 12, packageType: null });
  assert.deepEqual(parsePackages("varios"), { packages: null, packageType: "varios" });
});

test("contenedores", () => {
  assert.deepEqual(parseContainers("1x40HC"), [{ equipment: "HIGH_CUBE_40", quantity: 1 }]);
  assert.deepEqual(parseContainers("2 X 20'"), [{ equipment: "DRY_20", quantity: 2 }]);
  assert.deepEqual(parseContainers("1 x 40 HC + 1 x 20"), [
    { equipment: "HIGH_CUBE_40", quantity: 1 },
    { equipment: "DRY_20", quantity: 1 },
  ]);
  assert.deepEqual(parseContainers("40RF"), [{ equipment: "REEFER_40", quantity: 1 }]);
  assert.equal(parseContainers("a coordinar"), null);
});

test("fechas en formatos comunes", () => {
  assert.equal(parseDate("15/09/2026")?.toISOString(), "2026-09-15T12:00:00.000Z");
  assert.equal(parseDate("2026-10-20")?.toISOString(), "2026-10-20T12:00:00.000Z");
  assert.equal(parseDate("31/02/2026"), null);
  assert.equal(parseDate("próxima semana"), null);
});

test("modo y dirección", () => {
  assert.deepEqual(parseServiceMode({ modality: "IMPORTACIÓN MARÍTIMA", loadType: "LCL / LCL" }), { direction: "IMPORT", mode: "SEA_LCL" });
  assert.deepEqual(parseServiceMode({ modality: "IMPORTACIÓN MARÍTIMA", loadType: "FCL" }), { direction: "IMPORT", mode: "SEA_FCL" });
  assert.deepEqual(parseServiceMode({ modality: "IMPORTACIÓN MARÍTIMA", containersCount: "1x40HC" }), { direction: "IMPORT", mode: "SEA_FCL" });
  assert.deepEqual(parseServiceMode({ modality: "IMPORTACIÓN AÉREA" }), { direction: "IMPORT", mode: "AIR" });
  assert.deepEqual(parseServiceMode({ modality: "EXPORTACIÓN MARÍTIMA", loadType: "FCL" }), { direction: "EXPORT", mode: "SEA_FCL" });
});

test("incoterm", () => {
  assert.equal(parseIncoterm("fob"), "FOB");
  assert.equal(parseIncoterm("EXW - Ex Works"), "EXW");
  assert.equal(parseIncoterm("puerta a puerta"), null);
});

test("documentos 'OTRO' se reconocen por el nombre", async () => {
  const { mapDocumentTypeCode } = await import("./parse");
  assert.equal(mapDocumentTypeCode("OTRO", "Volante del depósito"), "VOLANTE");
  assert.equal(mapDocumentTypeCode("OTRO", "Guía de remisión 001-234"), "DELIVERY_GUIDE");
  assert.equal(mapDocumentTypeCode("OTRO", "Certificado de Origen China"), "CERT_ORIGIN");
  assert.equal(mapDocumentTypeCode("OTRO", "documento varios"), "OTHER");
  assert.equal(mapDocumentTypeCode("BL", "Volante"), "HBL");
});

test("'0 X LCL' es carga suelta, no un dato perdido", async () => {
  const { isNoContainers } = await import("./parse");
  assert.equal(isNoContainers("0 X LCL"), true);
  assert.equal(isNoContainers("LCL"), true);
  assert.equal(isNoContainers("1x40HC"), false);
  assert.equal(isNoContainers("a coordinar"), false);
});
