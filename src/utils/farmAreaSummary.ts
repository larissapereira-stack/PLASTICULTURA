import { Farm, Parcel, SerroplastRecord, AreaConfirmationStatus } from '../types';

export type FarmSigla = 'VDU' | 'LAB' | 'BRU' | 'LBR' | string;

export interface AreaBreakdownItem {
  id: string;
  source: 'serroplast' | 'parcel';
  sourceId: string;
  sigla: string;
  fazendaNome: string;
  setor: string;
  parcela: string;
  variedade: string;
  supervisor: string;
  areaHa: number;
  plasticulturaStatus: AreaConfirmationStatus;
  estruturaStatus: AreaConfirmationStatus;
  plasticType?: string;
  lastDate?: string;
  notes?: string;
  dedupKey: string;
}

export interface CategorySummary {
  confirmedHa: number;
  confirmedCount: number;
  pendingCount: number;
  pendingHa: number;
  withoutCount: number;
  hasConfirmedData: boolean;
  displayValue: string; // Ex: "91,50 ha" ou "Pendente de confirmação"
  confirmedItems: AreaBreakdownItem[];
  pendingItems: AreaBreakdownItem[];
  withoutItems: AreaBreakdownItem[];
  duplicateSkippedCount: number;
}

export const DEFAULT_COVERED_HECTARE_VALUE = 132228.61;

export function formatBrl(value: number): string {
  return `R$ ${(Number(value) || 0).toLocaleString('pt-BR', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2
  })}`;
}

export function parseBrlInput(raw: string): number | null {
  const cleaned = raw.replace(/[R$\s]/g, '').trim();
  if (!cleaned) return null;
  let normalized = cleaned;
  const hasComma = cleaned.includes(',');
  const hasDot = cleaned.includes('.');

  if (hasComma && hasDot) {
    if (cleaned.lastIndexOf(',') > cleaned.lastIndexOf('.')) {
      normalized = cleaned.replace(/\./g, '').replace(',', '.');
    } else {
      normalized = cleaned.replace(/,/g, '');
    }
  } else if (hasComma) {
    normalized = cleaned.replace(',', '.');
  } else if (hasDot) {
    const dotCount = (cleaned.match(/\./g) || []).length;
    if (dotCount > 1) {
      normalized = cleaned.replace(/\./g, '');
    }
  }

  const parsed = Number(normalized);
  if (!Number.isFinite(parsed) || parsed < 0) return null;
  return Number(parsed.toFixed(2));
}

export interface FarmAreaSummaryRow {
  sigla: string;
  fazendaNome: string;
  farmId?: string;
  plasticultura: CategorySummary;
  plasticulturaValueBrl: number; // Calculado exclusivamente para áreas com plasticultura instalada
  estrutura: CategorySummary; // Mantido separado e sem valoração financeira por ha coberto
}

export interface FarmAreaSummaryReport {
  rows: FarmAreaSummaryRow[];
  coveredHectareValue: number;
  totalGeral: {
    plasticultura: CategorySummary;
    plasticulturaValueBrl: number;
    estrutura: CategorySummary;
    pendingFarmsPlasticultura: number;
    pendingFarmsEstrutura: number;
  };
}

const OFFICIAL_FARM_ORDER: { sigla: string; nome: string; farmId: string }[] = [
  { sigla: 'VDU', nome: 'Vale das Uvas', farmId: 'farm-vale-uvas' },
  { sigla: 'LAB', nome: 'Labrunier I', farmId: 'farm-lab1' },
  { sigla: 'BRU', nome: 'Brasil Uvas', farmId: 'farm-br-uvas' },
  { sigla: 'LBR', nome: 'Labrunier II', farmId: 'farm-lab2' },
];

function normalizeToken(val?: string): string {
  return (val || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .trim()
    .toUpperCase()
    .replace(/\s+/g, ' ');
}

function buildDedupKey(sigla: string, setor: string, parcela: string, variedade: string): string {
  const cleanParcel = normalizeToken(parcela).replace(/^PARCELA\s+/i, '');
  const cleanSetor = normalizeToken(setor);
  const cleanVar = normalizeToken(variedade);
  return `${normalizeToken(sigla)}|${cleanSetor}|${cleanParcel}|${cleanVar}`;
}

export function resolveSerroplastPlasticulturaStatus(r: SerroplastRecord): AreaConfirmationStatus {
  if (r.plasticulturaConfirmada) return r.plasticulturaConfirmada;

  if (r.situacao) {
    const s = normalizeToken(r.situacao);
    if (s === 'DESCOBERTA' || s === 'NAO POSSUI' || s === 'SEM PLASTICO') return 'Não Possui';
    if (s === 'A CONFIRMAR' || s === 'PENDENTE' || s === 'PENDENTE DE CONFIRMACAO') return 'Pendente de confirmação';
    if (s === 'COBERTA' || s === 'CONFIRMADO') return 'Confirmado';
  }

  // Se possui cobertura plástica registrada nas colunas oficiais, está confirmado
  const hasCoverage = Boolean(
    (r.cobertura1 && r.cobertura1.trim()) ||
    (r.cobertura2 && r.cobertura2.trim()) ||
    (r.cobertura3 && r.cobertura3.trim())
  );
  if (hasCoverage) return 'Confirmado';

  // Regra: não presumir plástico instalado caso não exista cobertura confirmada
  return 'Pendente de confirmação';
}

export function resolveSerroplastEstruturaStatus(r: SerroplastRecord): AreaConfirmationStatus {
  if (r.estruturaConfirmada) return r.estruturaConfirmada;

  // Apenas se houver menção explícita confirmada em "informacao"
  const info = normalizeToken(r.informacao);
  if (info.includes('ESTRUTURA')) {
    return 'Confirmado';
  }

  // Regra: nunca presumir estrutura apenas porque tem plástico
  return 'Pendente de confirmação';
}

export function resolveParcelPlasticulturaStatus(p: Parcel): AreaConfirmationStatus {
  if (p.situation === 'Coberta') return 'Confirmado';
  if (p.situation === 'Descoberta') return 'Não Possui';
  return 'Pendente de confirmação';
}

export function resolveParcelEstruturaStatus(p: Parcel): AreaConfirmationStatus {
  if (p.structureStatus === 'Com Estrutura') return 'Confirmado';
  if (p.structureStatus === 'Sem Estrutura') return 'Não Possui';
  return 'Pendente de confirmação';
}

function getLatestSerroplastCoverage(r: SerroplastRecord): { plasticType?: string; lastDate?: string } {
  if (r.cobertura3 || r.data3) return { plasticType: r.cobertura3, lastDate: r.data3 };
  if (r.cobertura2 || r.data2) return { plasticType: r.cobertura2, lastDate: r.data2 };
  return { plasticType: r.cobertura1, lastDate: r.data1 };
}

function buildCategorySummary(
  items: AreaBreakdownItem[],
  type: 'plasticultura' | 'estrutura'
): CategorySummary {
  const seenKeys = new Set<string>();
  const confirmedItems: AreaBreakdownItem[] = [];
  const pendingItems: AreaBreakdownItem[] = [];
  const withoutItems: AreaBreakdownItem[] = [];
  let duplicateSkippedCount = 0;

  items.forEach(item => {
    const status = type === 'plasticultura' ? item.plasticulturaStatus : item.estruturaStatus;

    if (status === 'Confirmado') {
      // Regra: Não contar a mesma área duas vezes dentro de cada categoria
      if (seenKeys.has(item.dedupKey)) {
        duplicateSkippedCount++;
        return;
      }
      seenKeys.add(item.dedupKey);
      confirmedItems.push(item);
    } else if (status === 'Não Possui') {
      if (!seenKeys.has(item.dedupKey)) {
        withoutItems.push(item);
      }
    } else {
      if (!seenKeys.has(item.dedupKey)) {
        pendingItems.push(item);
      }
    }
  });

  const confirmedHa = Number(
    confirmedItems.reduce((sum, i) => sum + (Number(i.areaHa) || 0), 0).toFixed(2)
  );
  const pendingHa = Number(
    pendingItems.reduce((sum, i) => sum + (Number(i.areaHa) || 0), 0).toFixed(2)
  );
  const hasConfirmedData = confirmedItems.length > 0;

  return {
    confirmedHa,
    confirmedCount: confirmedItems.length,
    pendingCount: pendingItems.length,
    pendingHa,
    withoutCount: withoutItems.length,
    hasConfirmedData,
    displayValue: hasConfirmedData
      ? `${confirmedHa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha`
      : 'Pendente de confirmação',
    confirmedItems,
    pendingItems,
    withoutItems,
    duplicateSkippedCount
  };
}

export function computeFarmAreaSummary(
  farms: Farm[],
  parcels: Parcel[],
  serroplastRecords: SerroplastRecord[],
  coveredHectareValue: number = DEFAULT_COVERED_HECTARE_VALUE
): FarmAreaSummaryReport {
  const safeHectareValue =
    typeof coveredHectareValue === 'number' && Number.isFinite(coveredHectareValue) && coveredHectareValue >= 0
      ? Number(coveredHectareValue.toFixed(2))
      : DEFAULT_COVERED_HECTARE_VALUE;
  // Build farm catalog preserving VDU, LAB, BRU, LBR order first
  const farmList: { sigla: string; nome: string; farmId?: string }[] = [...OFFICIAL_FARM_ORDER];

  farms.forEach(f => {
    const code = normalizeToken(f.code);
    if (!farmList.some(item => item.sigla === code)) {
      farmList.push({ sigla: code, nome: f.name, farmId: f.id });
    }
  });

  const allItems: AreaBreakdownItem[] = [];

  // 1. Add active Serroplast records
  serroplastRecords
    .filter(r => r.ativo)
    .forEach(r => {
      const latest = getLatestSerroplastCoverage(r);
      const setorDisplay = r.setorInterno
        ? `${r.setorFazenda} (${r.setorInterno})`
        : r.setorFazenda;

      allItems.push({
        id: `item-serro-${r.id}`,
        source: 'serroplast',
        sourceId: r.id,
        sigla: normalizeToken(r.sigla),
        fazendaNome: r.fazendaNome,
        setor: setorDisplay,
        parcela: r.parcela,
        variedade: r.variedade,
        supervisor: r.supervisor || '—',
        areaHa: Number(r.areaHa) || 0,
        plasticulturaStatus: resolveSerroplastPlasticulturaStatus(r),
        estruturaStatus: resolveSerroplastEstruturaStatus(r),
        plasticType: latest.plasticType,
        lastDate: latest.lastDate,
        notes: r.informacao,
        dedupKey: buildDedupKey(r.sigla, r.setorInterno || r.setorFazenda, r.parcela, r.variedade)
      });
    });

  // 2. Add Parcels from Fazendas & Parcelas
  parcels.forEach(p => {
    const farmMatch = farms.find(f => f.id === p.farmId);
    const sigla = normalizeToken(p.farmCode || farmMatch?.code || '');
    const fazendaNome = p.farmName || farmMatch?.name || sigla;
    const lastCov = p.coverageHistory?.[p.coverageHistory.length - 1];

    allItems.push({
      id: `item-parc-${p.id}`,
      source: 'parcel',
      sourceId: p.id,
      sigla,
      fazendaNome,
      setor: p.sector,
      parcela: p.parcelCode,
      variedade: p.variety,
      supervisor: p.supervisor || '—',
      areaHa: Number(p.hectares) || 0,
      plasticulturaStatus: resolveParcelPlasticulturaStatus(p),
      estruturaStatus: resolveParcelEstruturaStatus(p),
      plasticType: p.currentPlasticType || lastCov?.plasticType,
      lastDate: lastCov?.coverageDate,
      notes: p.structureNotes || p.additionalInfo,
      dedupKey: buildDedupKey(sigla, p.sector, p.parcelCode, p.variety)
    });
  });

  const rows: FarmAreaSummaryRow[] = farmList.map(farm => {
    const farmItems = allItems.filter(item => item.sigla === farm.sigla);
    const plasticultura = buildCategorySummary(farmItems, 'plasticultura');
    const estrutura = buildCategorySummary(farmItems, 'estrutura');
    // Regra: aplicar o valor/ha exclusivamente às áreas com plasticultura instalada (nunca às áreas com apenas estrutura)
    const plasticulturaValueBrl = plasticultura.hasConfirmedData
      ? Number((plasticultura.confirmedHa * safeHectareValue).toFixed(2))
      : 0;

    return {
      sigla: farm.sigla,
      fazendaNome: farm.nome,
      farmId: farm.farmId,
      plasticultura,
      plasticulturaValueBrl,
      estrutura,
    };
  });

  const totalPlasticultura = buildCategorySummary(allItems, 'plasticultura');
  const totalEstrutura = buildCategorySummary(allItems, 'estrutura');
  const totalPlasticulturaValueBrl = totalPlasticultura.hasConfirmedData
    ? Number((totalPlasticultura.confirmedHa * safeHectareValue).toFixed(2))
    : 0;

  const pendingFarmsPlasticultura = rows.filter(r => !r.plasticultura.hasConfirmedData).length;
  const pendingFarmsEstrutura = rows.filter(r => !r.estrutura.hasConfirmedData).length;

  return {
    rows,
    coveredHectareValue: safeHectareValue,
    totalGeral: {
      plasticultura: totalPlasticultura,
      plasticulturaValueBrl: totalPlasticulturaValueBrl,
      estrutura: totalEstrutura,
      pendingFarmsPlasticultura,
      pendingFarmsEstrutura
    }
  };
}
