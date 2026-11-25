import { Farm, PlasticultureCatalogCategory, PlasticultureCatalogItem } from '../types';
import { INITIAL_FARMS, INITIAL_PARCELS, INITIAL_SECTORS, INITIAL_USERS } from './seedData';
import { INITIAL_SERROPLAST_RECORDS } from './serroplastData';
import { PARREIRAL_PLAN_2027_ROWS } from './parreiralPlan2027Data';

function norm(value?: string): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

function resolveFarmIdByCode(farms: Farm[], code?: string): string | undefined {
  if (!code) return undefined;
  const upper = code.trim().toUpperCase();
  return farms.find(f => f.code.toUpperCase() === upper)?.id;
}

export function buildInitialPlasticultureCatalogItems(
  farms: Farm[] = INITIAL_FARMS
): PlasticultureCatalogItem[] {
  const now = '2026-11-12T08:00:00Z';
  const allFarmIds = farms.map(f => f.id);
  const items: PlasticultureCatalogItem[] = [];

  const upsertUnique = (
    map: Map<string, PlasticultureCatalogItem>,
    key: string,
    category: PlasticultureCatalogCategory,
    name: string,
    farmIdsToAdd: string[],
    extra?: Partial<PlasticultureCatalogItem>
  ) => {
    const cleanName = name.trim();
    if (!cleanName) return;
    const existing = map.get(key);
    if (existing) {
      const mergedFarms = Array.from(new Set([...existing.farmIds, ...farmIdsToAdd.filter(Boolean)]));
      existing.farmIds = mergedFarms;
      return;
    }
    map.set(key, {
      id: `pcat-${category.toLowerCase()}-${map.size + 1}-${Math.random().toString(36).substring(2, 6)}`,
      category,
      name: cleanName,
      farmIds: Array.from(new Set(farmIdsToAdd.filter(Boolean))),
      active: true,
      createdAt: now,
      updatedAt: now,
      ...extra
    });
  };

  // 1. ATIVIDADE (5 opções oficiais do módulo, vinculadas inicialmente a todas as fazendas)
  const actMap = new Map<string, PlasticultureCatalogItem>();
  const coreActivities = [
    'Estaqueamento',
    'Perímetro',
    'Estrutura Inicial',
    'Manutenção de Plasticultura',
    'Outras'
  ];
  coreActivities.forEach((actName, idx) => {
    actMap.set(norm(actName), {
      id: `pcat-atividade-core-${idx + 1}`,
      category: 'ATIVIDADE',
      name: actName,
      farmIds: [...allFarmIds],
      active: true,
      isSystemDefault: true,
      notes: actName === 'Outras' ? 'Habilita descrição manual da atividade no formulário.' : undefined,
      createdAt: now,
      updatedAt: now
    });
  });

  // 2. SUPERVISOR
  const supMap = new Map<string, PlasticultureCatalogItem>();
  PARREIRAL_PLAN_2027_ROWS.forEach(r => {
    if (r.supervisor) {
      upsertUnique(supMap, norm(r.supervisor), 'SUPERVISOR', r.supervisor, [r.farmId]);
    }
  });
  INITIAL_SECTORS.forEach(s => {
    if (s.supervisorDefault) {
      upsertUnique(supMap, norm(s.supervisorDefault), 'SUPERVISOR', s.supervisorDefault, [s.farmId]);
    }
  });
  INITIAL_PARCELS.forEach(p => {
    if (p.supervisor) {
      upsertUnique(supMap, norm(p.supervisor), 'SUPERVISOR', p.supervisor, [p.farmId]);
    }
  });
  INITIAL_SERROPLAST_RECORDS.forEach(r => {
    const fId = resolveFarmIdByCode(farms, r.sigla);
    if (r.supervisor && fId) {
      upsertUnique(supMap, norm(r.supervisor), 'SUPERVISOR', r.supervisor, [fId]);
    }
  });

  // 3. RESPONSAVEL
  const respMap = new Map<string, PlasticultureCatalogItem>();
  supMap.forEach((supItem, key) => {
    upsertUnique(respMap, key, 'RESPONSAVEL', supItem.name, [...supItem.farmIds]);
  });
  farms.forEach(f => {
    if (f.manager) {
      upsertUnique(respMap, norm(f.manager), 'RESPONSAVEL', f.manager, [f.id]);
    }
  });
  INITIAL_USERS.forEach(u => {
    upsertUnique(respMap, norm(u.name), 'RESPONSAVEL', u.name, allFarmIds);
  });

  // 4. SETOR
  const sectorMap = new Map<string, PlasticultureCatalogItem>();
  PARREIRAL_PLAN_2027_ROWS.forEach(r => {
    if (r.setorFazenda) {
      upsertUnique(sectorMap, `${r.farmId}|${norm(r.setorFazenda)}`, 'SETOR', r.setorFazenda, [r.farmId]);
    }
  });
  INITIAL_SECTORS.forEach(s => {
    upsertUnique(sectorMap, `${s.farmId}|${norm(s.name)}`, 'SETOR', s.name, [s.farmId], {
      supervisorName: s.supervisorDefault,
      areaHa: s.totalHectares
    });
  });
  INITIAL_PARCELS.forEach(p => {
    if (p.sector) {
      upsertUnique(sectorMap, `${p.farmId}|${norm(p.sector)}`, 'SETOR', p.sector, [p.farmId]);
    }
  });
  INITIAL_SERROPLAST_RECORDS.forEach(r => {
    const fId = resolveFarmIdByCode(farms, r.sigla);
    if (r.setorFazenda && fId) {
      upsertUnique(sectorMap, `${fId}|${norm(r.setorFazenda)}`, 'SETOR', r.setorFazenda, [fId]);
    }
  });

  // 5. VARIEDADE
  const varietyMap = new Map<string, PlasticultureCatalogItem>();
  PARREIRAL_PLAN_2027_ROWS.forEach(r => {
    const v = r.variedade?.trim();
    if (v && v !== 'COMPLETA' && v !== 'ERRADICADA') {
      upsertUnique(varietyMap, norm(v), 'VARIEDADE', v, [r.farmId]);
    }
  });
  INITIAL_PARCELS.forEach(p => {
    if (p.variety?.trim()) {
      upsertUnique(varietyMap, norm(p.variety), 'VARIEDADE', p.variety.trim(), [p.farmId]);
    }
  });
  INITIAL_SERROPLAST_RECORDS.forEach(r => {
    const fId = resolveFarmIdByCode(farms, r.sigla);
    if (r.variedade?.trim() && fId) {
      upsertUnique(varietyMap, norm(r.variedade), 'VARIEDADE', r.variedade.trim(), [fId]);
    }
  });

  // 6. PARCELA
  const parcelMap = new Map<string, PlasticultureCatalogItem>();
  PARREIRAL_PLAN_2027_ROWS.forEach(r => {
    const label = `${r.setorInterno} (${r.parcela})`;
    const key = `${r.farmId}|${norm(r.setorFazenda)}|${norm(label)}|${norm(r.variedade)}`;
    upsertUnique(parcelMap, key, 'PARCELA', label, [r.farmId], {
      sectorName: r.setorFazenda,
      varietyName: r.variedade,
      supervisorName: r.supervisor,
      areaHa: r.areaHa
    });
  });
  INITIAL_PARCELS.forEach(p => {
    const key = `${p.farmId}|${norm(p.sector)}|${norm(p.parcelCode)}|${norm(p.variety)}`;
    upsertUnique(parcelMap, key, 'PARCELA', p.parcelCode, [p.farmId], {
      sectorName: p.sector,
      varietyName: p.variety,
      supervisorName: p.supervisor,
      areaHa: p.hectares
    });
  });
  INITIAL_SERROPLAST_RECORDS.forEach(r => {
    const fId = resolveFarmIdByCode(farms, r.sigla);
    if (!fId) return;
    const label = r.setorInterno ? `${r.setorInterno} (${r.parcela})` : r.parcela;
    const key = `${fId}|${norm(r.setorFazenda)}|${norm(label)}|${norm(r.variedade)}`;
    upsertUnique(parcelMap, key, 'PARCELA', label, [fId], {
      sectorName: r.setorFazenda,
      varietyName: r.variedade,
      supervisorName: r.supervisor,
      areaHa: r.areaHa
    });
  });

  items.push(
    ...Array.from(actMap.values()),
    ...Array.from(supMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    ...Array.from(respMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    ...Array.from(sectorMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    ...Array.from(varietyMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR')),
    ...Array.from(parcelMap.values()).sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { numeric: true }))
  );

  return items;
}

export const INITIAL_PLASTICULTURE_CATALOG_ITEMS: PlasticultureCatalogItem[] =
  buildInitialPlasticultureCatalogItems(INITIAL_FARMS);
