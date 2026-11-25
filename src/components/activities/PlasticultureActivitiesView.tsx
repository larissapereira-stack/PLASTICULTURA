import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PARREIRAL_PLAN_2027_ROWS } from '../../data/parreiralPlan2027Data';
import {
  ParreiralPlan2027Row,
  PlasticulturePlanActivity,
  PlasticulturePlanActivityStatus,
  PlasticulturePlanActivityType
} from '../../types';
import {
  AlertTriangle,
  Calendar,
  CheckCircle2,
  ClipboardCheck,
  Clock,
  Download,
  Edit3,
  Eye,
  FileSpreadsheet,
  Filter,
  Lock,
  Plus,
  RotateCcw,
  Search,
  Trash2,
  X
} from 'lucide-react';

const ACTIVITY_TYPE_OPTIONS: PlasticulturePlanActivityType[] = [
  'Estaqueamento',
  'Perímetro',
  'Estrutura Inicial',
  'Manutenção de Plasticultura',
  'Outras'
];

const STATUS_OPTIONS: PlasticulturePlanActivityStatus[] = [
  'Programada',
  'Em andamento',
  'Finalizada'
];

interface LinkedParcelOption {
  id?: string;
  parcelCode: string;
  sector: string;
  variety: string;
  areaHa: number;
  supervisor: string;
  sourceLabel: string;
}

function normalizeText(value?: string): string {
  return (value || '').trim().toLowerCase();
}

function formatDateBr(isoDate?: string): string {
  if (!isoDate) return '—';
  const parts = isoDate.split('-');
  if (parts.length === 3) {
    return `${parts[2]}/${parts[1]}/${parts[0]}`;
  }
  return isoDate;
}

function brDateToIso(brDate?: string): string {
  if (!brDate) return '';
  const parts = brDate.trim().split('/');
  if (parts.length !== 3) return '';
  return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
}

function formatAreaHa(value: number): string {
  return `${value.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha`;
}

function getDisplayActivityLabel(activity: PlasticulturePlanActivity): string {
  if (activity.activityType === 'Outras' && activity.customActivityDescription?.trim()) {
    return `Outras — ${activity.customActivityDescription.trim()}`;
  }
  return activity.activityType;
}

function mapSpreadsheetRowToDefaults(row: ParreiralPlan2027Row): {
  activityType: PlasticulturePlanActivityType;
  customDescription: string;
  status: PlasticulturePlanActivityStatus;
  startDate: string;
  observations: string;
} {
  const necUpper = row.necessidade.toUpperCase();
  let activityType: PlasticulturePlanActivityType = 'Manutenção de Plasticultura';
  let customDescription = '';

  if (necUpper.includes('ESTAQUEAMENTO')) {
    activityType = 'Estaqueamento';
  } else if (necUpper.includes('PERIMETRO')) {
    activityType = 'Perímetro';
  } else if (necUpper === 'COMPLETA') {
    activityType = 'Estrutura Inicial';
  } else if (necUpper && necUpper !== 'OK' && necUpper !== 'FINALIZADA' && necUpper !== 'ERRADICADA') {
    activityType = 'Manutenção de Plasticultura';
  }

  let status: PlasticulturePlanActivityStatus = 'Programada';
  const stUpper = row.statusPlanilha.toUpperCase();
  if (stUpper === 'ANDAMENTO') status = 'Em andamento';
  else if (stUpper === 'FINALIZADA') status = 'Finalizada';

  // IMPORTANTE: Nunca utilizar podaData como data de início da plasticultura.
  // Apenas row.inicioData (coluna INICIO de manutenção) pode preencher startDate.
  const startDate = brDateToIso(row.inicioData);

  const notes: string[] = [
    `Referência planilha original (Linha ${row.rowNumber})`,
    `Situação na planilha: ${row.situacao || 'Não informada'}`
  ];
  if (row.necessidade && row.necessidade !== 'OK') {
    notes.push(`Necessidade original: ${row.necessidade}`);
  }
  if (row.statusPlanilha && row.statusPlanilha !== 'OK') {
    notes.push(`Status original: ${row.statusPlanilha}`);
  }

  return {
    activityType,
    customDescription,
    status,
    startDate,
    observations: notes.join(' · ')
  };
}

interface PlasticultureActivitiesViewProps {
  onOpenCatalog?: () => void;
}

export const PlasticultureActivitiesView: React.FC<PlasticultureActivitiesViewProps> = ({
  onOpenCatalog
}) => {
  const {
    farms,
    plasticulturePlanActivities,
    plasticultureCatalogItems,
    savePlasticulturePlanActivity,
    updatePlasticulturePlanActivityStatus,
    deletePlasticulturePlanActivity,
    currentUser,
    hasPermission,
    showToast
  } = useApp();

  const canCreate = hasPermission('create_records');
  const canEdit = hasPermission('edit_records');
  const canDelete = hasPermission('delete_records');
  const canAccessCatalogs = hasPermission('access_catalogs');

  // Sub-visão: Atividades de Plasticultura vs Planilha Original (Somente Leitura)
  const [subView, setSubView] = useState<'activities' | 'spreadsheet'>('activities');

  // Filtros principais (Atividades de Plasticultura)
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFarmId, setFilterFarmId] = useState<string>('all');
  const [filterSector, setFilterSector] = useState<string>('all');
  const [filterParcel, setFilterParcel] = useState<string>('all');
  const [filterActivityType, setFilterActivityType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'ALL' | PlasticulturePlanActivityStatus>('ALL');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');

  // Filtros da Planilha Original (Somente Leitura)
  const [sheetFarmFilter, setSheetFarmFilter] = useState<string>('all');
  const [sheetSectorFilter, setSheetSectorFilter] = useState<string>('all');
  const [sheetSituacaoFilter, setSheetSituacaoFilter] = useState<string>('all');
  const [sheetStatusFilter, setSheetStatusFilter] = useState<string>('all');
  const [sheetSearch, setSheetSearch] = useState<string>('');

  // Modais
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<PlasticulturePlanActivity | null>(null);
  const [consultingActivityId, setConsultingActivityId] = useState<string | null>(null);
  const [deletingActivity, setDeletingActivity] = useState<PlasticulturePlanActivity | null>(null);

  // Estado do Formulário
  const [formFarmId, setFormFarmId] = useState<string>(farms[0]?.id || 'farm-lab1');
  const [formSector, setFormSector] = useState<string>('');
  const [formCustomSector, setFormCustomSector] = useState<string>('');
  const [formParcelCode, setFormParcelCode] = useState<string>('');
  const [formParcelId, setFormParcelId] = useState<string | undefined>(undefined);
  const [formCustomParcel, setFormCustomParcel] = useState<string>('');
  const [formSupervisor, setFormSupervisor] = useState<string>('');
  const [formCustomSupervisor, setFormCustomSupervisor] = useState<string>('');
  const [formVariety, setFormVariety] = useState<string>('');
  const [formCustomVariety, setFormCustomVariety] = useState<string>('');
  const [formAreaHa, setFormAreaHa] = useState<string>('');
  const [formActivityType, setFormActivityType] = useState<string>('Estaqueamento');
  const [formCustomActivityDesc, setFormCustomActivityDesc] = useState<string>('');
  const [formStartDate, setFormStartDate] = useState<string>('');
  const [formEndDate, setFormEndDate] = useState<string>('');
  const [formStatus, setFormStatus] = useState<PlasticulturePlanActivityStatus>('Programada');
  const [formResponsible, setFormResponsible] = useState<string>('');
  const [formCustomResponsible, setFormCustomResponsible] = useState<string>('');
  const [formObservations, setFormObservations] = useState<string>('');
  const [formSpreadsheetOrigin, setFormSpreadsheetOrigin] = useState<PlasticulturePlanActivity['spreadsheetOrigin']>(undefined);

  // --- Helpers baseados exclusivamente no Cadastro de Itens vinculado por Fazenda ---
  const getCatalogNamesForFarm = (
    category: 'SUPERVISOR' | 'RESPONSAVEL' | 'SETOR' | 'VARIEDADE' | 'ATIVIDADE',
    farmId: string
  ): string[] => {
    const set = new Set<string>();
    plasticultureCatalogItems
      .filter(
        item =>
          item.category === category &&
          item.active &&
          (farmId === 'all' ? item.farmIds.length > 0 : item.farmIds.includes(farmId))
      )
      .forEach(item => {
        if (item.name?.trim()) set.add(item.name.trim());
      });

    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  };

  const getSectorsForFarm = (farmId: string): string[] => {
    return getCatalogNamesForFarm('SETOR', farmId);
  };

  const getParcelsForFarmAndSector = (farmId: string, sectorName: string): LinkedParcelOption[] => {
    const options: LinkedParcelOption[] = [];
    const seen = new Set<string>();

    const matchesSector = (candidateSector?: string) => {
      if (!sectorName || sectorName === 'all' || sectorName === '__CUSTOM__') return true;
      if (!candidateSector) return true;
      const b = normalizeText(sectorName);
      const a = normalizeText(candidateSector);
      return a === b || a.includes(b) || b.includes(a);
    };

    plasticultureCatalogItems
      .filter(
        item =>
          item.category === 'PARCELA' &&
          item.active &&
          (farmId === 'all' ? item.farmIds.length > 0 : item.farmIds.includes(farmId)) &&
          matchesSector(item.sectorName)
      )
      .forEach(item => {
        const key = `${normalizeText(item.name)}|${normalizeText(item.sectorName)}|${normalizeText(item.varietyName)}`;
        if (!seen.has(key)) {
          seen.add(key);
          options.push({
            id: item.id,
            parcelCode: item.name,
            sector: item.sectorName || '',
            variety: item.varietyName || '',
            areaHa: item.areaHa ?? 0,
            supervisor: item.supervisorName || '',
            sourceLabel: 'Cadastro'
          });
        }
      });

    return options.sort((a, b) => a.parcelCode.localeCompare(b.parcelCode, 'pt-BR', { numeric: true }));
  };

  // Opções estritamente vinculadas à fazenda selecionada no formulário
  const formSupervisors = useMemo(
    () => getCatalogNamesForFarm('SUPERVISOR', formFarmId),
    [plasticultureCatalogItems, formFarmId]
  );

  const formVarieties = useMemo(
    () => getCatalogNamesForFarm('VARIEDADE', formFarmId),
    [plasticultureCatalogItems, formFarmId]
  );

  const formResponsibles = useMemo(
    () => getCatalogNamesForFarm('RESPONSAVEL', formFarmId),
    [plasticultureCatalogItems, formFarmId]
  );

  const formActivityOptions = useMemo(() => {
    const list = getCatalogNamesForFarm('ATIVIDADE', formFarmId);
    return list.length > 0 ? list : ACTIVITY_TYPE_OPTIONS;
  }, [plasticultureCatalogItems, formFarmId]);

  // Opções para os filtros da lista
  const filterSectorOptions = useMemo(
    () => getSectorsForFarm(filterFarmId),
    [filterFarmId, plasticultureCatalogItems]
  );

  const filterParcelOptions = useMemo(() => {
    const set = new Set<string>();
    getParcelsForFarmAndSector(filterFarmId, filterSector).forEach(p => set.add(p.parcelCode));
    plasticulturePlanActivities
      .filter(a => (filterFarmId === 'all' || a.farmId === filterFarmId) && (filterSector === 'all' || a.sector === filterSector))
      .forEach(a => a.parcelCode?.trim() && set.add(a.parcelCode.trim()));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR', { numeric: true }));
  }, [filterFarmId, filterSector, plasticultureCatalogItems, plasticulturePlanActivities]);

  const filterActivityOptions = useMemo(() => {
    const set = new Set<string>(getCatalogNamesForFarm('ATIVIDADE', filterFarmId));
    plasticulturePlanActivities
      .filter(a => filterFarmId === 'all' || a.farmId === filterFarmId)
      .forEach(a => a.activityType?.trim() && set.add(a.activityType.trim()));
    return Array.from(set);
  }, [filterFarmId, plasticultureCatalogItems, plasticulturePlanActivities]);

  // Opções para o formulário
  const formSectorOptions = useMemo(
    () => getSectorsForFarm(formFarmId),
    [formFarmId, plasticultureCatalogItems]
  );

  const formParcelOptions = useMemo(
    () => getParcelsForFarmAndSector(formFarmId, formSector),
    [formFarmId, formSector, plasticultureCatalogItems]
  );

  // Filtragem da lista principal
  const filteredActivities = useMemo(() => {
    const term = normalizeText(searchTerm);
    return plasticulturePlanActivities
      .filter(act => {
        if (filterFarmId !== 'all' && act.farmId !== filterFarmId) return false;
        if (filterSector !== 'all' && act.sector !== filterSector) return false;
        if (filterParcel !== 'all' && act.parcelCode !== filterParcel) return false;
        if (filterActivityType !== 'all' && act.activityType !== filterActivityType) return false;
        if (filterStatus !== 'ALL' && act.status !== filterStatus) return false;

        if (filterDateFrom) {
          const effectiveEnd = act.endDate || act.startDate;
          if (!effectiveEnd || effectiveEnd < filterDateFrom) return false;
        }
        if (filterDateTo) {
          const effectiveStart = act.startDate || act.endDate;
          if (!effectiveStart || effectiveStart > filterDateTo) return false;
        }

        if (term) {
          const hay = [
            act.farmName,
            act.farmCode,
            act.sector,
            act.parcelCode,
            act.supervisor,
            act.variety,
            act.activityType,
            act.customActivityDescription || '',
            act.responsible,
            act.observations || ''
          ]
            .join(' ')
            .toLowerCase();
          if (!hay.includes(term)) return false;
        }
        return true;
      })
      .sort((a, b) => {
        const statusOrder: Record<PlasticulturePlanActivityStatus, number> = {
          'Em andamento': 0,
          'Programada': 1,
          'Finalizada': 2
        };
        const orderDiff = statusOrder[a.status] - statusOrder[b.status];
        if (orderDiff !== 0) return orderDiff;
        const dateA = a.startDate || '9999-99-99';
        const dateB = b.startDate || '9999-99-99';
        if (dateA !== dateB) return dateA.localeCompare(dateB);
        return b.updatedAt.localeCompare(a.updatedAt);
      });
  }, [
    plasticulturePlanActivities,
    filterFarmId,
    filterSector,
    filterParcel,
    filterActivityType,
    filterStatus,
    filterDateFrom,
    filterDateTo,
    searchTerm
  ]);

  // Indicadores de Resumo
  const summary = useMemo(() => {
    const total = filteredActivities.length;
    const programadas = filteredActivities.filter(a => a.status === 'Programada').length;
    const emAndamento = filteredActivities.filter(a => a.status === 'Em andamento').length;
    const finalizadas = filteredActivities.filter(a => a.status === 'Finalizada').length;
    const totalAreaHa = filteredActivities.reduce((sum, a) => sum + (Number(a.areaHa) || 0), 0);
    return { total, programadas, emAndamento, finalizadas, totalAreaHa };
  }, [filteredActivities]);

  const hasActiveFilters =
    searchTerm.trim() !== '' ||
    filterFarmId !== 'all' ||
    filterSector !== 'all' ||
    filterParcel !== 'all' ||
    filterActivityType !== 'all' ||
    filterStatus !== 'ALL' ||
    filterDateFrom !== '' ||
    filterDateTo !== '';

  const resetFilters = () => {
    setSearchTerm('');
    setFilterFarmId('all');
    setFilterSector('all');
    setFilterParcel('all');
    setFilterActivityType('all');
    setFilterStatus('ALL');
    setFilterDateFrom('');
    setFilterDateTo('');
  };

  // --- Filtragem da Planilha Original (Somente Leitura) ---
  const sheetSectorOptions = useMemo(() => {
    const set = new Set<string>();
    PARREIRAL_PLAN_2027_ROWS
      .filter(r => sheetFarmFilter === 'all' || r.farmId === sheetFarmFilter)
      .forEach(r => set.add(r.setorFazenda));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [sheetFarmFilter]);

  const filteredSpreadsheetRows = useMemo(() => {
    const term = normalizeText(sheetSearch);
    return PARREIRAL_PLAN_2027_ROWS.filter(r => {
      if (sheetFarmFilter !== 'all' && r.farmId !== sheetFarmFilter) return false;
      if (sheetSectorFilter !== 'all' && r.setorFazenda !== sheetSectorFilter) return false;
      if (sheetSituacaoFilter !== 'all' && (r.situacao || 'Sem classificação') !== sheetSituacaoFilter) return false;
      if (sheetStatusFilter !== 'all' && r.statusPlanilha !== sheetStatusFilter) return false;
      if (term) {
        const hay = `${r.faz} ${r.setorFazenda} ${r.supervisor} ${r.setorInterno} ${r.parcela} ${r.variedade} ${r.necessidade} ${r.statusPlanilha} ${r.situacao}`.toLowerCase();
        if (!hay.includes(term)) return false;
      }
      return true;
    });
  }, [sheetFarmFilter, sheetSectorFilter, sheetSituacaoFilter, sheetStatusFilter, sheetSearch]);

  // --- Abertura dos modais ---
  const openCreateModal = () => {
    const defaultFarm = farms[0];
    const defaultFarmId = filterFarmId !== 'all' ? filterFarmId : defaultFarm?.id || 'farm-lab1';
    const availableSectors = getSectorsForFarm(defaultFarmId);
    const initialSector =
      filterSector !== 'all' && availableSectors.includes(filterSector)
        ? filterSector
        : availableSectors[0] || '';
    const availableParcels = getParcelsForFarmAndSector(defaultFarmId, initialSector);
    const firstParcel = availableParcels[0];
    const farmSups = getCatalogNamesForFarm('SUPERVISOR', defaultFarmId);
    const farmVars = getCatalogNamesForFarm('VARIEDADE', defaultFarmId);
    const farmResps = getCatalogNamesForFarm('RESPONSAVEL', defaultFarmId);
    const farmActs = getCatalogNamesForFarm('ATIVIDADE', defaultFarmId);

    const matchedSup =
      firstParcel?.supervisor && farmSups.includes(firstParcel.supervisor)
        ? firstParcel.supervisor
        : farmSups[0] || '__CUSTOM__';
    const matchedVar =
      firstParcel?.variety && farmVars.includes(firstParcel.variety)
        ? firstParcel.variety
        : farmVars[0] || '__CUSTOM__';
    const matchedResp =
      matchedSup !== '__CUSTOM__' && farmResps.includes(matchedSup)
        ? matchedSup
        : farmResps.includes(currentUser.name)
          ? currentUser.name
          : farmResps[0] || '__CUSTOM__';

    setEditingActivity(null);
    setFormSpreadsheetOrigin(undefined);
    setFormFarmId(defaultFarmId);
    setFormSector(initialSector || '__CUSTOM__');
    setFormCustomSector('');
    setFormParcelCode(firstParcel?.parcelCode || '__CUSTOM__');
    setFormParcelId(firstParcel?.id);
    setFormCustomParcel('');
    setFormSupervisor(matchedSup);
    setFormCustomSupervisor('');
    setFormVariety(matchedVar);
    setFormCustomVariety('');
    setFormAreaHa(firstParcel ? String(firstParcel.areaHa) : '');
    setFormActivityType(farmActs[0] || 'Estaqueamento');
    setFormCustomActivityDesc('');
    setFormStartDate(new Date().toISOString().slice(0, 10));
    setFormEndDate('');
    setFormStatus('Programada');
    setFormResponsible(matchedResp);
    setFormCustomResponsible('');
    setFormObservations('');
    setIsFormModalOpen(true);
  };

  const openCreateFromSpreadsheetRow = (row: ParreiralPlan2027Row) => {
    const mapped = mapSpreadsheetRowToDefaults(row);
    const parcelLabel = `${row.setorInterno} (${row.parcela})`;
    const farmSectors = getSectorsForFarm(row.farmId);
    const farmSups = getCatalogNamesForFarm('SUPERVISOR', row.farmId);
    const farmVars = getCatalogNamesForFarm('VARIEDADE', row.farmId);
    const farmResps = getCatalogNamesForFarm('RESPONSAVEL', row.farmId);
    const farmParcels = getParcelsForFarmAndSector(row.farmId, row.setorFazenda);
    const farmActs = getCatalogNamesForFarm('ATIVIDADE', row.farmId);

    const supAllowed = farmSups.includes(row.supervisor);
    const varAllowed = farmVars.includes(row.variedade);
    const secAllowed = farmSectors.includes(row.setorFazenda);
    const parcelAllowed = farmParcels.some(p => p.parcelCode === parcelLabel);
    const respAllowed = farmResps.includes(row.supervisor);

    setEditingActivity(null);
    setFormSpreadsheetOrigin({
      rowId: row.id,
      necessidadeOriginal: row.necessidade,
      statusOriginal: row.statusPlanilha,
      situacaoOriginal: row.situacao,
      inicioOriginal: row.inicioData || undefined
    });
    setFormFarmId(row.farmId);
    setFormSector(secAllowed ? row.setorFazenda : farmSectors[0] || '__CUSTOM__');
    setFormCustomSector(secAllowed ? '' : row.setorFazenda);
    setFormParcelCode(parcelAllowed ? parcelLabel : '__CUSTOM__');
    setFormParcelId(row.id);
    setFormCustomParcel(parcelAllowed ? '' : parcelLabel);
    setFormSupervisor(supAllowed ? row.supervisor : farmSups[0] || '__CUSTOM__');
    setFormCustomSupervisor('');
    setFormVariety(varAllowed ? row.variedade : farmVars[0] || '__CUSTOM__');
    setFormCustomVariety('');
    setFormAreaHa(String(row.areaHa));
    setFormActivityType(
      farmActs.includes(mapped.activityType) ? mapped.activityType : farmActs[0] || mapped.activityType
    );
    setFormCustomActivityDesc(mapped.customDescription);
    setFormStartDate(mapped.startDate);
    setFormEndDate('');
    setFormStatus(mapped.status);
    setFormResponsible(
      respAllowed ? row.supervisor : farmResps[0] || '__CUSTOM__'
    );
    setFormCustomResponsible('');
    setFormObservations(mapped.observations);
    setIsFormModalOpen(true);
  };

  const openEditModal = (activity: PlasticulturePlanActivity) => {
    const sectorOpts = getSectorsForFarm(activity.farmId);
    const sectorInList = sectorOpts.includes(activity.sector);
    const parcelOpts = getParcelsForFarmAndSector(activity.farmId, activity.sector);
    const parcelInList = parcelOpts.some(p => p.parcelCode === activity.parcelCode);
    const farmSups = getCatalogNamesForFarm('SUPERVISOR', activity.farmId);
    const supInList = farmSups.includes(activity.supervisor);
    const farmVars = getCatalogNamesForFarm('VARIEDADE', activity.farmId);
    const varInList = farmVars.includes(activity.variety);
    const farmResps = getCatalogNamesForFarm('RESPONSAVEL', activity.farmId);
    const respInList = farmResps.includes(activity.responsible);

    setEditingActivity(activity);
    setFormSpreadsheetOrigin(activity.spreadsheetOrigin);
    setFormFarmId(activity.farmId);
    setFormSector(sectorInList ? activity.sector : '__CUSTOM__');
    setFormCustomSector(sectorInList ? '' : activity.sector);
    setFormParcelCode(parcelInList ? activity.parcelCode : '__CUSTOM__');
    setFormParcelId(activity.parcelId);
    setFormCustomParcel(parcelInList ? '' : activity.parcelCode);
    setFormSupervisor(supInList ? activity.supervisor : '__CUSTOM__');
    setFormCustomSupervisor(supInList ? '' : activity.supervisor);
    setFormVariety(varInList ? activity.variety : '__CUSTOM__');
    setFormCustomVariety(varInList ? '' : activity.variety);
    setFormAreaHa(String(activity.areaHa));
    setFormActivityType(activity.activityType);
    setFormCustomActivityDesc(activity.customActivityDescription || '');
    setFormStartDate(activity.startDate || '');
    setFormEndDate(activity.endDate || '');
    setFormStatus(activity.status);
    setFormResponsible(respInList ? activity.responsible : '__CUSTOM__');
    setFormCustomResponsible(respInList ? '' : activity.responsible);
    setFormObservations(activity.observations || '');
    setIsFormModalOpen(true);
  };

  // Cascading handlers no formulário (respeitando estritamente os vínculos da Fazenda escolhida)
  const handleFormFarmChange = (newFarmId: string) => {
    setFormFarmId(newFarmId);
    const newSectors = getSectorsForFarm(newFarmId);
    const nextSector = newSectors[0] || '__CUSTOM__';
    setFormSector(nextSector);
    setFormCustomSector('');

    const farmSups = getCatalogNamesForFarm('SUPERVISOR', newFarmId);
    const farmVars = getCatalogNamesForFarm('VARIEDADE', newFarmId);
    const farmResps = getCatalogNamesForFarm('RESPONSAVEL', newFarmId);
    const farmActs = getCatalogNamesForFarm('ATIVIDADE', newFarmId);

    const newParcels = getParcelsForFarmAndSector(newFarmId, nextSector === '__CUSTOM__' ? '' : nextSector);
    const firstParcel = newParcels[0];
    setFormParcelCode(firstParcel?.parcelCode || '__CUSTOM__');
    setFormParcelId(firstParcel?.id);
    setFormCustomParcel('');

    const nextSup =
      firstParcel?.supervisor && farmSups.includes(firstParcel.supervisor)
        ? firstParcel.supervisor
        : farmSups[0] || '__CUSTOM__';
    setFormSupervisor(nextSup);
    setFormCustomSupervisor('');

    const nextVar =
      firstParcel?.variety && farmVars.includes(firstParcel.variety)
        ? firstParcel.variety
        : farmVars[0] || '__CUSTOM__';
    setFormVariety(nextVar);
    setFormCustomVariety('');

    const nextResp =
      nextSup !== '__CUSTOM__' && farmResps.includes(nextSup)
        ? nextSup
        : farmResps[0] || '__CUSTOM__';
    setFormResponsible(nextResp);
    setFormCustomResponsible('');

    if (farmActs.length > 0 && !farmActs.includes(formActivityType)) {
      setFormActivityType(farmActs[0]);
    }

    setFormAreaHa(firstParcel ? String(firstParcel.areaHa) : '');
  };

  const handleFormSectorChange = (newSector: string) => {
    setFormSector(newSector);
    if (newSector === '__CUSTOM__') {
      setFormParcelCode('__CUSTOM__');
      setFormParcelId(undefined);
      return;
    }
    const newParcels = getParcelsForFarmAndSector(formFarmId, newSector);
    const firstParcel = newParcels[0];
    setFormParcelCode(firstParcel?.parcelCode || '__CUSTOM__');
    setFormParcelId(firstParcel?.id);
    setFormCustomParcel('');
    if (firstParcel) {
      if (firstParcel.supervisor && formSupervisors.includes(firstParcel.supervisor)) {
        setFormSupervisor(firstParcel.supervisor);
        setFormCustomSupervisor('');
        if (formResponsibles.includes(firstParcel.supervisor)) {
          setFormResponsible(firstParcel.supervisor);
          setFormCustomResponsible('');
        }
      }
      if (firstParcel.variety && formVarieties.includes(firstParcel.variety)) {
        setFormVariety(firstParcel.variety);
        setFormCustomVariety('');
      }
      setFormAreaHa(String(firstParcel.areaHa));
    }
  };

  const handleFormParcelChange = (selectedCode: string) => {
    setFormParcelCode(selectedCode);
    if (selectedCode === '__CUSTOM__') {
      setFormParcelId(undefined);
      return;
    }
    const match = formParcelOptions.find(p => p.parcelCode === selectedCode);
    if (match) {
      setFormParcelId(match.id);
      if (match.supervisor && formSupervisors.includes(match.supervisor)) {
        setFormSupervisor(match.supervisor);
        setFormCustomSupervisor('');
        if (formResponsibles.includes(match.supervisor)) {
          setFormResponsible(match.supervisor);
          setFormCustomResponsible('');
        }
      }
      if (match.variety && formVarieties.includes(match.variety)) {
        setFormVariety(match.variety);
        setFormCustomVariety('');
      }
      setFormAreaHa(String(match.areaHa));
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedFarm = farms.find(f => f.id === formFarmId);
    const finalSector = formSector === '__CUSTOM__' ? formCustomSector.trim() : formSector.trim();
    const finalParcel = formParcelCode === '__CUSTOM__' ? formCustomParcel.trim() : formParcelCode.trim();
    const finalSupervisor = formSupervisor === '__CUSTOM__' ? formCustomSupervisor.trim() : formSupervisor.trim();
    const finalVariety = formVariety === '__CUSTOM__' ? formCustomVariety.trim() : formVariety.trim();
    const finalResponsible = formResponsible === '__CUSTOM__' ? formCustomResponsible.trim() : formResponsible.trim();
    const parsedArea = parseFloat(String(formAreaHa).replace(',', '.'));

    if (!selectedFarm || !finalSector || !finalParcel || !finalSupervisor || !finalVariety || !finalResponsible) {
      showToast(
        'error',
        'Campos Obrigatórios',
        'Preencha Fazenda, Setor, Supervisor, Parcela, Variedade e Responsável.'
      );
      return;
    }

    if (Number.isNaN(parsedArea) || parsedArea < 0) {
      showToast('error', 'Área Inválida', 'Informe uma área válida em hectares (ha).');
      return;
    }

    if (formActivityType === 'Outras' && !formCustomActivityDesc.trim()) {
      showToast(
        'error',
        'Descrição Obrigatória',
        'Ao selecionar "Outras", descreva a atividade manualmente.'
      );
      return;
    }

    if (formStartDate && formEndDate && formEndDate < formStartDate) {
      showToast(
        'error',
        'Período Inválido',
        'A data de finalização não pode ser anterior à data de início.'
      );
      return;
    }

    const payload: PlasticulturePlanActivity = {
      id: editingActivity
        ? editingActivity.id
        : `plast-act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      farmId: selectedFarm.id,
      farmCode: selectedFarm.code,
      farmName: selectedFarm.name,
      sector: finalSector,
      supervisor: finalSupervisor,
      parcelId: formParcelId,
      parcelCode: finalParcel,
      variety: finalVariety,
      areaHa: Number(parsedArea.toFixed(2)),
      activityType: formActivityType,
      customActivityDescription:
        formActivityType === 'Outras' ? formCustomActivityDesc.trim() : undefined,
      startDate: formStartDate,
      endDate: formEndDate,
      status: formStatus,
      responsible: finalResponsible,
      observations: formObservations.trim() || undefined,
      spreadsheetOrigin: formSpreadsheetOrigin,
      createdBy: editingActivity?.createdBy || currentUser.name,
      createdAt: editingActivity?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = savePlasticulturePlanActivity(payload);
    if (res.success) {
      setIsFormModalOpen(false);
      setEditingActivity(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingActivity) return;
    const deletedId = deletingActivity.id;
    const res = deletePlasticulturePlanActivity(deletedId);
    if (res.success) {
      setDeletingActivity(null);
      if (consultingActivityId === deletedId) {
        setConsultingActivityId(null);
      }
    }
  };

  const handleExportCsv = () => {
    if (filteredActivities.length === 0) {
      showToast('warning', 'Nada para exportar', 'Nenhuma atividade encontrada com os filtros atuais.');
      return;
    }

    const headers = [
      'Fazenda',
      'Sigla',
      'Setor',
      'Supervisor',
      'Parcela',
      'Variedade',
      'Area (ha)',
      'Atividade',
      'Descricao Outras',
      'Data Inicio',
      'Data Finalizacao',
      'Status',
      'Responsavel',
      'Observacoes'
    ];

    const escapeCsv = (val: string | number) => {
      const str = String(val ?? '');
      return `"${str.replace(/"/g, '""')}"`;
    };

    const lines = [
      headers.join(';'),
      ...filteredActivities.map(a =>
        [
          escapeCsv(a.farmName),
          escapeCsv(a.farmCode),
          escapeCsv(a.sector),
          escapeCsv(a.supervisor),
          escapeCsv(a.parcelCode),
          escapeCsv(a.variety),
          escapeCsv(a.areaHa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })),
          escapeCsv(a.activityType),
          escapeCsv(a.customActivityDescription || ''),
          escapeCsv(formatDateBr(a.startDate)),
          escapeCsv(formatDateBr(a.endDate)),
          escapeCsv(a.status),
          escapeCsv(a.responsible),
          escapeCsv(a.observations || '')
        ].join(';')
      )
    ];

    const blob = new Blob(['\uFEFF' + lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `atividades_plasticultura_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('success', 'CSV Exportado', `${filteredActivities.length} atividade(s) exportada(s).`);
  };

  const consultingActivity = useMemo(
    () => plasticulturePlanActivities.find(a => a.id === consultingActivityId) || null,
    [plasticulturePlanActivities, consultingActivityId]
  );

  return (
    <div className="space-y-5">
      {/* Cabeçalho da Seção */}
      <div className="bg-white border border-[#F0E4EB] rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8E1057] mb-1">
            <ClipboardCheck className="w-4 h-4" />
            <span>Planejamento de Campo · Integrado ao Plano de Manutenção de Parreiral 2027</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E120D] tracking-tight">
            Atividades de Plasticultura
          </h2>
          <p className="text-xs text-[#1E120D]/65 mt-0.5 max-w-3xl">
            Acompanhamento de estaqueamento, perímetro, estrutura inicial e manutenção de plasticultura vinculados às fazendas, setores, supervisores, parcelas e variedades. Registros de poda são mantidos estritamente separados e a planilha original permanece inalterada.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {/* Alternador de Visão: Atividades vs Planilha Original Somente Leitura */}
          <div className="inline-flex bg-[#FAF6F8] p-1 rounded-xl border border-[#F0E4EB]">
            <button
              type="button"
              onClick={() => setSubView('activities')}
              className={`px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                subView === 'activities'
                  ? 'bg-[#8E1057] text-white shadow-xs'
                  : 'text-[#1E120D]/70 hover:text-[#1E120D]'
              }`}
            >
              Atividades ({plasticulturePlanActivities.length})
            </button>
            <button
              type="button"
              onClick={() => setSubView('spreadsheet')}
              className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                subView === 'spreadsheet'
                  ? 'bg-[#8E1057] text-white shadow-xs'
                  : 'text-[#1E120D]/70 hover:text-[#1E120D]'
              }`}
            >
              <FileSpreadsheet className="w-3.5 h-3.5" />
              <span>Planilha Original ({PARREIRAL_PLAN_2027_ROWS.length})</span>
            </button>
          </div>

          {onOpenCatalog && canAccessCatalogs && (
            <button
              type="button"
              onClick={onOpenCatalog}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-[#FAF6F8] text-[#8E1057] border border-[#D65F95]/40 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Cadastros &amp; Vínculos</span>
            </button>
          )}

          <button
            type="button"
            onClick={handleExportCsv}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#FAF6F8] hover:bg-[#F0E4EB] text-[#1E120D] border border-[#F0E4EB] rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Download className="w-4 h-4 text-[#8E1057]" />
            <span>Exportar CSV</span>
          </button>

          {canCreate && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#8E1057] hover:bg-[#750D48] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Atividade</span>
            </button>
          )}
        </div>
      </div>

      {subView === 'activities' ? (
        <>
          {/* Indicadores de Resumo */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
            <div className="bg-white border border-[#F0E4EB] rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-[#1E120D]/65 block mb-1">
                Total de atividades
              </span>
              <div className="text-2xl font-black text-[#1E120D] tabular-nums">
                {summary.total}
              </div>
              <p className="text-[11px] text-[#1E120D]/55 mt-1">
                {hasActiveFilters ? `de ${plasticulturePlanActivities.length} cadastradas` : 'Registros em acompanhamento'}
              </p>
            </div>

            <div className="bg-white border border-[#F0E4EB] rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-amber-700 block mb-1">
                Programadas
              </span>
              <div className="text-2xl font-black text-amber-700 tabular-nums">
                {summary.programadas}
              </div>
              <p className="text-[11px] text-[#1E120D]/55 mt-1">
                Aguardando execução
              </p>
            </div>

            <div className="bg-white border border-[#F0E4EB] rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-[#8E1057] block mb-1">
                Em andamento
              </span>
              <div className="text-2xl font-black text-[#8E1057] tabular-nums">
                {summary.emAndamento}
              </div>
              <p className="text-[11px] text-[#1E120D]/55 mt-1">
                Em execução no parreiral
              </p>
            </div>

            <div className="bg-white border border-[#F0E4EB] rounded-xl p-4 shadow-xs">
              <span className="text-[11px] font-bold text-emerald-700 block mb-1">
                Finalizadas
              </span>
              <div className="text-2xl font-black text-emerald-700 tabular-nums">
                {summary.finalizadas}
              </div>
              <p className="text-[11px] text-[#1E120D]/55 mt-1">
                Concluídas e conferidas
              </p>
            </div>

            <div className="bg-white border border-[#F0E4EB] rounded-xl p-4 shadow-xs col-span-2 sm:col-span-1">
              <span className="text-[11px] font-bold text-[#1E120D]/65 block mb-1">
                Área total filtrada
              </span>
              <div className="text-2xl font-black text-[#1E120D] tabular-nums">
                {summary.totalAreaHa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                <span className="text-sm font-bold text-[#8E1057] ml-1">ha</span>
              </div>
              <p className="text-[11px] text-[#1E120D]/55 mt-1">
                Soma das parcelas listadas
              </p>
            </div>
          </div>

          {/* Painel de Filtros */}
          <div className="bg-white border border-[#F0E4EB] rounded-2xl p-4 shadow-xs space-y-3">
            <div className="flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2 text-xs font-bold text-[#1E120D]">
                <Filter className="w-4 h-4 text-[#8E1057]" />
                <span>Filtros de Consulta</span>
              </div>
              {hasActiveFilters && (
                <button
                  type="button"
                  onClick={resetFilters}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8E1057] hover:text-[#4A072E] cursor-pointer whitespace-nowrap shrink-0"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Limpar filtros</span>
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Busca livre */}
              <div className="relative">
                <Search className="w-4 h-4 text-[#1E120D]/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
                <input
                  type="text"
                  value={searchTerm}
                  onChange={e => setSearchTerm(e.target.value)}
                  placeholder="Buscar variedade, supervisor, responsável..."
                  className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D65F95]/40 focus:border-[#8E1057]"
                />
              </div>

              {/* Fazenda */}
              <select
                value={filterFarmId}
                onChange={e => {
                  setFilterFarmId(e.target.value);
                  setFilterSector('all');
                  setFilterParcel('all');
                }}
                aria-label="Filtrar por Fazenda"
                className="px-3 py-2 text-xs bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D65F95]/40 focus:border-[#8E1057]"
              >
                <option value="all">Todas as Fazendas</option>
                {farms.map(f => (
                  <option key={f.id} value={f.id}>
                    {f.name} ({f.code})
                  </option>
                ))}
              </select>

              {/* Setor */}
              <select
                value={filterSector}
                onChange={e => {
                  setFilterSector(e.target.value);
                  setFilterParcel('all');
                }}
                aria-label="Filtrar por Setor"
                className="px-3 py-2 text-xs bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D65F95]/40 focus:border-[#8E1057]"
              >
                <option value="all">Todos os Setores</option>
                {filterSectorOptions.map(s => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>

              {/* Parcela */}
              <select
                value={filterParcel}
                onChange={e => setFilterParcel(e.target.value)}
                aria-label="Filtrar por Parcela"
                className="px-3 py-2 text-xs bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D65F95]/40 focus:border-[#8E1057]"
              >
                <option value="all">Todas as Parcelas</option>
                {filterParcelOptions.map(p => (
                  <option key={p} value={p}>
                    {p}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
              {/* Atividade */}
              <select
                value={filterActivityType}
                onChange={e => setFilterActivityType(e.target.value)}
                aria-label="Filtrar por Atividade"
                className="px-3 py-2 text-xs bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D65F95]/40 focus:border-[#8E1057]"
              >
                <option value="all">Todas as Atividades</option>
                {filterActivityOptions.map(opt => (
                  <option key={opt} value={opt}>
                    {opt}
                  </option>
                ))}
              </select>

              {/* Status */}
              <select
                value={filterStatus}
                onChange={e => setFilterStatus(e.target.value as 'ALL' | PlasticulturePlanActivityStatus)}
                aria-label="Filtrar por Status"
                className="px-3 py-2 text-xs bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D65F95]/40 focus:border-[#8E1057]"
              >
                <option value="ALL">Todos os Status</option>
                {STATUS_OPTIONS.map(st => (
                  <option key={st} value={st}>
                    {st}
                  </option>
                ))}
              </select>

              {/* Período: Início */}
              <div className="flex items-center gap-2 bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl px-3 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#8E1057] shrink-0" />
                <span className="text-[11px] font-semibold text-[#1E120D]/60 shrink-0">De:</span>
                <input
                  type="date"
                  value={filterDateFrom}
                  onChange={e => setFilterDateFrom(e.target.value)}
                  aria-label="Período data inicial"
                  className="w-full text-xs bg-transparent focus:outline-none tabular-nums"
                />
              </div>

              {/* Período: Fim */}
              <div className="flex items-center gap-2 bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl px-3 py-1.5">
                <Calendar className="w-3.5 h-3.5 text-[#8E1057] shrink-0" />
                <span className="text-[11px] font-semibold text-[#1E120D]/60 shrink-0">Até:</span>
                <input
                  type="date"
                  value={filterDateTo}
                  onChange={e => setFilterDateTo(e.target.value)}
                  aria-label="Período data final"
                  className="w-full text-xs bg-transparent focus:outline-none tabular-nums"
                />
              </div>
            </div>
          </div>

          {/* Tabela Principal de Atividades de Plasticultura */}
          <div className="bg-white border border-[#F0E4EB] rounded-2xl shadow-xs overflow-hidden">
            {filteredActivities.length === 0 ? (
              <div className="p-10 text-center space-y-3">
                <p className="text-sm font-bold text-[#1E120D]">
                  Nenhuma atividade de plasticultura encontrada
                </p>
                <p className="text-xs text-[#1E120D]/60 max-w-md mx-auto">
                  Ajuste os filtros de busca ou cadastre uma nova atividade vinculada às fazendas, setores e parcelas do sistema.
                </p>
                <div className="pt-1 flex items-center justify-center gap-2">
                  {hasActiveFilters && (
                    <button
                      type="button"
                      onClick={resetFilters}
                      className="px-3.5 py-2 text-xs font-bold rounded-xl border border-[#F0E4EB] bg-[#FAF6F8] text-[#1E120D] hover:bg-[#F0E4EB] transition cursor-pointer"
                    >
                      Limpar filtros
                    </button>
                  )}
                  {canCreate && (
                    <button
                      type="button"
                      onClick={openCreateModal}
                      className="inline-flex items-center gap-1.5 px-4 py-2 text-xs font-bold rounded-xl bg-[#8E1057] text-white hover:bg-[#750D48] transition cursor-pointer"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Cadastrar Atividade</span>
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-left border-collapse">
                  <thead>
                    <tr className="bg-[#FAF6F8] border-b border-[#F0E4EB] text-[11px] font-bold uppercase tracking-wider text-[#1E120D]/65">
                      <th className="py-3 px-4">Fazenda · Setor · Parcela</th>
                      <th className="py-3 px-3">Variedade</th>
                      <th className="py-3 px-3 text-right">Área (ha)</th>
                      <th className="py-3 px-3">Atividade</th>
                      <th className="py-3 px-3">Início / Finalização</th>
                      <th className="py-3 px-3">Supervisor · Responsável</th>
                      <th className="py-3 px-3">Status</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E4EB] text-xs">
                    {filteredActivities.map(act => (
                      <tr key={act.id} className="hover:bg-[#FAF6F8]/70 transition-colors">
                        <td className="py-3 px-4 align-top">
                          <div className="font-bold text-[#1E120D]">
                            {act.farmCode} · {act.sector} · {act.parcelCode}
                          </div>
                          <div className="text-[11px] text-[#1E120D]/60 mt-0.5">
                            {act.farmName}
                            {act.spreadsheetOrigin ? ` · Origem: Planilha 2027 (${act.spreadsheetOrigin.necessidadeOriginal})` : ''}
                          </div>
                        </td>

                        <td className="py-3 px-3 align-top font-semibold text-[#1E120D]">
                          {act.variety}
                        </td>

                        <td className="py-3 px-3 align-top text-right font-bold text-[#1E120D] tabular-nums whitespace-nowrap">
                          {formatAreaHa(act.areaHa)}
                        </td>

                        <td className="py-3 px-3 align-top">
                          <div className="font-bold text-[#8E1057]">
                            {act.activityType}
                          </div>
                          {act.activityType === 'Outras' && act.customActivityDescription && (
                            <div className="text-[11px] text-[#1E120D]/75 mt-0.5 max-w-[220px]">
                              {act.customActivityDescription}
                            </div>
                          )}
                          {act.observations && (
                            <div className="text-[11px] text-[#1E120D]/55 mt-0.5 max-w-[240px] truncate" title={act.observations}>
                              {act.observations}
                            </div>
                          )}
                        </td>

                        <td className="py-3 px-3 align-top tabular-nums whitespace-nowrap">
                          <div className="text-[#1E120D] font-medium">
                            Início: {formatDateBr(act.startDate)}
                          </div>
                          <div className="text-[11px] text-[#1E120D]/60 mt-0.5">
                            Fim: {formatDateBr(act.endDate)}
                          </div>
                        </td>

                        <td className="py-3 px-3 align-top">
                          <div className="font-semibold text-[#1E120D]">
                            {act.responsible}
                          </div>
                          <div className="text-[11px] text-[#1E120D]/60 mt-0.5">
                            Sup.: {act.supervisor}
                          </div>
                        </td>

                        <td className="py-3 px-3 align-top">
                          <select
                            value={act.status}
                            disabled={!canEdit}
                            onChange={e =>
                              updatePlasticulturePlanActivityStatus(
                                act.id,
                                e.target.value as PlasticulturePlanActivityStatus
                              )
                            }
                            aria-label={`Alterar status da atividade ${act.parcelCode}`}
                            className={`text-[11px] font-bold px-2.5 py-1 rounded-lg border focus:outline-none disabled:opacity-75 disabled:cursor-not-allowed ${canEdit ? 'cursor-pointer' : ''} ${
                              act.status === 'Finalizada'
                                ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                                : act.status === 'Em andamento'
                                  ? 'bg-pink-50 text-[#8E1057] border-[#D65F95]/50'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {STATUS_OPTIONS.map(st => (
                              <option key={st} value={st}>
                                {st}
                              </option>
                            ))}
                          </select>
                        </td>

                        <td className="py-3 px-4 align-top text-right">
                          <div className="inline-flex items-center gap-1">
                            <button
                              type="button"
                              onClick={() => setConsultingActivityId(act.id)}
                              title="Consultar detalhes"
                              className="p-1.5 rounded-lg text-[#1E120D]/65 hover:text-[#8E1057] hover:bg-[#FAF6F8] transition cursor-pointer"
                            >
                              <Eye className="w-4 h-4" />
                            </button>
                            {canEdit && (
                              <button
                                type="button"
                                onClick={() => openEditModal(act)}
                                title="Editar atividade"
                                className="p-1.5 rounded-lg text-[#1E120D]/65 hover:text-[#8E1057] hover:bg-[#FAF6F8] transition cursor-pointer"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                            )}
                            {canDelete && (
                              <button
                                type="button"
                                onClick={() => setDeletingActivity(act)}
                                title="Excluir atividade"
                                className="p-1.5 rounded-lg text-[#1E120D]/65 hover:text-rose-700 hover:bg-rose-50 transition cursor-pointer"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      ) : (
        /* Planilha Original (Plano de Manutenção de Parreiral 2027 — Somente Leitura) */
        <div className="space-y-4">
          <div className="bg-[#FAF6F8] border border-[#F0E4EB] rounded-2xl p-4 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
            <div className="flex items-start gap-3">
              <div className="p-2 rounded-xl bg-white border border-[#F0E4EB] text-[#8E1057] shrink-0">
                <Lock className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-sm font-bold text-[#1E120D]">
                  Planilha Original Preservada (Somente Leitura) — Plano de Manutenção de Parreiral 2027
                </h3>
                <p className="text-xs text-[#1E120D]/65 mt-0.5">
                  Os 239 registros originais da planilha enviada permanecem intactos. As datas da coluna <strong>Poda</strong> são exibidas separadamente para consulta e nunca são misturadas às atividades de plasticultura. Use <strong>Gerar Atividade</strong> para criar um registro operacional vinculado.
                </p>
              </div>
            </div>
          </div>

          <div className="bg-white border border-[#F0E4EB] rounded-2xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div className="relative">
              <Search className="w-4 h-4 text-[#1E120D]/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
              <input
                type="text"
                value={sheetSearch}
                onChange={e => setSheetSearch(e.target.value)}
                placeholder="Buscar parcela, variedade, necessidade..."
                className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D65F95]/40"
              />
            </div>

            <select
              value={sheetFarmFilter}
              onChange={e => {
                setSheetFarmFilter(e.target.value);
                setSheetSectorFilter('all');
              }}
              className="px-3 py-2 text-xs bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl"
            >
              <option value="all">Todas as Fazendas</option>
              {farms.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.code})
                </option>
              ))}
            </select>

            <select
              value={sheetSectorFilter}
              onChange={e => setSheetSectorFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl"
            >
              <option value="all">Todos os Setores</option>
              {sheetSectorOptions.map(s => (
                <option key={s} value={s}>
                  {s}
                </option>
              ))}
            </select>

            <select
              value={sheetSituacaoFilter}
              onChange={e => setSheetSituacaoFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl"
            >
              <option value="all">Todas as Situações (Plasticultura / Latada)</option>
              <option value="Estrutura Plasticultura">Estrutura Plasticultura</option>
              <option value="Latada">Latada</option>
              <option value="Programada">Programada</option>
              <option value="Sem classificação">Sem classificação</option>
            </select>

            <select
              value={sheetStatusFilter}
              onChange={e => setSheetStatusFilter(e.target.value)}
              className="px-3 py-2 text-xs bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl"
            >
              <option value="all">Todos os Status da Planilha</option>
              <option value="URGENTE">URGENTE</option>
              <option value="ANDAMENTO">ANDAMENTO</option>
              <option value="PROGRAMAR">PROGRAMAR</option>
              <option value="FINALIZADA">FINALIZADA</option>
              <option value="OK">OK</option>
              <option value="ERRADICADA">ERRADICADA</option>
            </select>
          </div>

          <div className="bg-white border border-[#F0E4EB] rounded-2xl shadow-xs overflow-hidden">
            <div className="px-4 py-3 border-b border-[#F0E4EB] bg-[#FAF6F8] flex items-center justify-between text-xs font-bold text-[#1E120D]/70">
              <span>Exibindo {filteredSpreadsheetRows.length} de {PARREIRAL_PLAN_2027_ROWS.length} linhas originais</span>
              <span>Somente leitura · Dados preservados</span>
            </div>
            <div className="overflow-x-auto max-h-[620px]">
              <table className="w-full text-left border-collapse">
                <thead className="sticky top-0 bg-[#FAF6F8] z-10 border-b border-[#F0E4EB] text-[11px] font-bold uppercase tracking-wider text-[#1E120D]/65">
                  <tr>
                    <th className="py-2.5 px-3">#</th>
                    <th className="py-2.5 px-3">Faz · Setor · Sup.</th>
                    <th className="py-2.5 px-3">Parcela</th>
                    <th className="py-2.5 px-3">Variedade</th>
                    <th className="py-2.5 px-3 text-right">Área (ha)</th>
                    <th className="py-2.5 px-3">Necessidade (Planilha)</th>
                    <th className="py-2.5 px-3">Status Planilha</th>
                    <th className="py-2.5 px-3">Início Manut.</th>
                    <th className="py-2.5 px-3">Poda (Separado)</th>
                    <th className="py-2.5 px-3">Situação</th>
                    <th className="py-2.5 px-3 text-right">Integração</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#F0E4EB] text-xs">
                  {filteredSpreadsheetRows.map(row => (
                    <tr key={row.id} className="hover:bg-[#FAF6F8]/70">
                      <td className="py-2.5 px-3 text-[#1E120D]/50 tabular-nums">{row.rowNumber}</td>
                      <td className="py-2.5 px-3 font-medium text-[#1E120D]">
                        {row.faz} · {row.setorFazenda} · {row.supervisor}
                      </td>
                      <td className="py-2.5 px-3 font-bold text-[#1E120D]">
                        {row.setorInterno} ({row.parcela})
                      </td>
                      <td className="py-2.5 px-3">{row.variedade}</td>
                      <td className="py-2.5 px-3 text-right tabular-nums font-semibold">
                        {row.areaHa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#8E1057]">
                        {row.necessidade}
                      </td>
                      <td className="py-2.5 px-3 font-semibold text-[#1E120D]/80">
                        {row.statusPlanilha}
                      </td>
                      <td className="py-2.5 px-3 tabular-nums">
                        {row.inicioData || '—'}
                      </td>
                      <td className="py-2.5 px-3 tabular-nums text-[#1E120D]/55">
                        {row.podaData || '—'}
                      </td>
                      <td className="py-2.5 px-3">
                        <span className={row.situacao === 'Estrutura Plasticultura' ? 'font-bold text-[#8E1057]' : 'text-[#1E120D]/70'}>
                          {row.situacao || '—'}
                        </span>
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        {canCreate ? (
                          <button
                            type="button"
                            onClick={() => openCreateFromSpreadsheetRow(row)}
                            className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-[#8E1057] hover:bg-[#750D48] text-white text-[11px] font-bold transition whitespace-nowrap shrink-0 cursor-pointer"
                          >
                            <Plus className="w-3 h-3" />
                            <span>Gerar Atividade</span>
                          </button>
                        ) : (
                          <span className="text-[11px] text-[#1E120D]/40">Somente leitura</span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Cadastro / Edição */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-[#1E120D]/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-3xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#F0E4EB]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0E4EB]">
              <div>
                <h3 className="text-base font-extrabold text-[#1E120D]">
                  {editingActivity ? 'Editar Atividade de Plasticultura' : 'Nova Atividade de Plasticultura'}
                </h3>
                <p className="text-xs text-[#1E120D]/60 mt-0.5">
                  Vinculação direta aos cadastros de Fazenda, Setor, Supervisor, Parcela e Variedade.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-lg text-[#1E120D]/40 hover:text-[#1E120D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 overflow-y-auto space-y-4 text-xs">
              {formSpreadsheetOrigin && (
                <div className="p-3 rounded-xl bg-[#FAF6F8] border border-[#D65F95]/40 text-[#4A072E] flex items-center justify-between gap-2">
                  <span>
                    Vinculado à linha da Planilha Parreiral 2027: <strong>{formSpreadsheetOrigin.necessidadeOriginal}</strong> ({formSpreadsheetOrigin.situacaoOriginal || 'Sem situação'}) — dados originais da planilha não serão alterados.
                  </span>
                </div>
              )}

              {/* Linha 1: Fazenda, Setor, Parcela */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Fazenda *</label>
                  <select
                    value={formFarmId}
                    onChange={e => handleFormFarmChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl focus:outline-none focus:border-[#8E1057]"
                  >
                    {farms.map(f => (
                      <option key={f.id} value={f.id}>
                        {f.name} ({f.code})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Setor *</label>
                  <select
                    value={formSector}
                    onChange={e => handleFormSectorChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl focus:outline-none focus:border-[#8E1057]"
                  >
                    {formSectorOptions.map(sec => (
                      <option key={sec} value={sec}>
                        {sec}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Informar outro setor...</option>
                  </select>
                  {formSector === '__CUSTOM__' && (
                    <input
                      type="text"
                      value={formCustomSector}
                      onChange={e => setFormCustomSector(e.target.value)}
                      placeholder="Nome do setor"
                      required
                      className="mt-1.5 w-full px-3 py-2 bg-white border border-[#D65F95] rounded-xl focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Parcela *</label>
                  <select
                    value={formParcelCode}
                    onChange={e => handleFormParcelChange(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl focus:outline-none focus:border-[#8E1057]"
                  >
                    {formParcelOptions.map(p => (
                      <option key={`${p.parcelCode}-${p.variety}-${p.sourceLabel}`} value={p.parcelCode}>
                        {p.parcelCode} — {p.variety} ({p.areaHa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ha)
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Informar outra parcela...</option>
                  </select>
                  {formParcelCode === '__CUSTOM__' && (
                    <input
                      type="text"
                      value={formCustomParcel}
                      onChange={e => setFormCustomParcel(e.target.value)}
                      placeholder="Ex: II-04 (3/3)"
                      required
                      className="mt-1.5 w-full px-3 py-2 bg-white border border-[#D65F95] rounded-xl focus:outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Linha 2: Supervisor, Variedade, Área (ha) */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Supervisor *</label>
                  <select
                    value={formSupervisor}
                    onChange={e => setFormSupervisor(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl focus:outline-none focus:border-[#8E1057]"
                  >
                    {formSupervisors.map(sup => (
                      <option key={sup} value={sup}>
                        {sup}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Outro supervisor...</option>
                  </select>
                  {formSupervisor === '__CUSTOM__' && (
                    <input
                      type="text"
                      value={formCustomSupervisor}
                      onChange={e => setFormCustomSupervisor(e.target.value)}
                      placeholder="Nome do supervisor"
                      required
                      className="mt-1.5 w-full px-3 py-2 bg-white border border-[#D65F95] rounded-xl focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Variedade *</label>
                  <select
                    value={formVariety}
                    onChange={e => setFormVariety(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl focus:outline-none focus:border-[#8E1057]"
                  >
                    {formVarieties.map(v => (
                      <option key={v} value={v}>
                        {v}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Outra variedade...</option>
                  </select>
                  {formVariety === '__CUSTOM__' && (
                    <input
                      type="text"
                      value={formCustomVariety}
                      onChange={e => setFormCustomVariety(e.target.value)}
                      placeholder="Nome da variedade"
                      required
                      className="mt-1.5 w-full px-3 py-2 bg-white border border-[#D65F95] rounded-xl focus:outline-none"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Área (ha) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0"
                    value={formAreaHa}
                    onChange={e => setFormAreaHa(e.target.value)}
                    placeholder="Ex: 3.51"
                    required
                    className="w-full px-3 py-2 bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl focus:outline-none focus:border-[#8E1057] tabular-nums"
                  />
                </div>
              </div>

              {/* Linha 3: Atividade + Descrição Manual quando Outras */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Atividade *</label>
                  <select
                    value={formActivityType}
                    onChange={e => setFormActivityType(e.target.value)}
                    required
                    className="w-full px-3 py-2 bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl focus:outline-none focus:border-[#8E1057]"
                  >
                    {formActivityOptions.map(opt => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                    {!formActivityOptions.includes(formActivityType) && formActivityType && (
                      <option value={formActivityType}>{formActivityType}</option>
                    )}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Status *</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as PlasticulturePlanActivityStatus)}
                    required
                    className="w-full px-3 py-2 bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl focus:outline-none focus:border-[#8E1057]"
                  >
                    {STATUS_OPTIONS.map(st => (
                      <option key={st} value={st}>
                        {st}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              {formActivityType === 'Outras' && (
                <div>
                  <label className="block font-bold text-[#8E1057] mb-1">
                    Descrever Atividade Manualmente (Outras) *
                  </label>
                  <input
                    type="text"
                    value={formCustomActivityDesc}
                    onChange={e => setFormCustomActivityDesc(e.target.value)}
                    placeholder="Descreva a atividade de plasticultura a ser realizada..."
                    required
                    className="w-full px-3 py-2 bg-white border border-[#D65F95] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D65F95]/40"
                  />
                </div>
              )}

              {/* Linha 4: Data de Início, Data de Finalização, Responsável */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Data de início</label>
                  <input
                    type="date"
                    value={formStartDate}
                    onChange={e => setFormStartDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl focus:outline-none focus:border-[#8E1057] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Data de finalização</label>
                  <input
                    type="date"
                    value={formEndDate}
                    onChange={e => setFormEndDate(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl focus:outline-none focus:border-[#8E1057] tabular-nums"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Responsável *</label>
                  <select
                    value={formResponsible}
                    onChange={e => setFormResponsible(e.target.value)}
                    className="w-full px-3 py-2 bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl focus:outline-none focus:border-[#8E1057]"
                  >
                    {formResponsibles.map(r => (
                      <option key={r} value={r}>
                        {r}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Outro responsável...</option>
                  </select>
                  {formResponsible === '__CUSTOM__' && (
                    <input
                      type="text"
                      value={formCustomResponsible}
                      onChange={e => setFormCustomResponsible(e.target.value)}
                      placeholder="Nome do responsável"
                      required
                      className="mt-1.5 w-full px-3 py-2 bg-white border border-[#D65F95] rounded-xl focus:outline-none"
                    />
                  )}
                </div>
              </div>

              {/* Observações */}
              <div>
                <label className="block font-bold text-[#1E120D] mb-1">Observações</label>
                <textarea
                  rows={3}
                  value={formObservations}
                  onChange={e => setFormObservations(e.target.value)}
                  placeholder="Detalhes técnicos da estrutura, estacas, perímetro ou recomendações..."
                  className="w-full px-3 py-2 bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl focus:outline-none focus:border-[#8E1057]"
                />
              </div>

              <div className="pt-3 border-t border-[#F0E4EB] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#F0E4EB] text-[#1E120D] font-bold hover:bg-[#FAF6F8] transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#8E1057] hover:bg-[#750D48] text-white font-bold shadow-xs transition cursor-pointer"
                >
                  {editingActivity ? 'Salvar Alterações' : 'Cadastrar Atividade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal de Consulta Detalhada */}
      {consultingActivity && (
        <div className="fixed inset-0 bg-[#1E120D]/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-[#F0E4EB] space-y-4">
            <div className="flex items-start justify-between border-b border-[#F0E4EB] pb-3">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E1057]">
                  Consulta de Atividade de Plasticultura
                </span>
                <h3 className="text-lg font-extrabold text-[#1E120D] mt-0.5">
                  {getDisplayActivityLabel(consultingActivity)}
                </h3>
                <p className="text-xs text-[#1E120D]/60 mt-0.5">
                  {consultingActivity.farmName} ({consultingActivity.farmCode}) · {consultingActivity.sector} · {consultingActivity.parcelCode}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setConsultingActivityId(null)}
                className="p-1.5 rounded-lg text-[#1E120D]/40 hover:text-[#1E120D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="grid grid-cols-2 gap-3 text-xs">
              <div className="p-3 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB]">
                <span className="text-[#1E120D]/55 block">Variedade</span>
                <strong className="text-[#1E120D]">{consultingActivity.variety}</strong>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB]">
                <span className="text-[#1E120D]/55 block">Área</span>
                <strong className="text-[#1E120D] tabular-nums">{formatAreaHa(consultingActivity.areaHa)}</strong>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB]">
                <span className="text-[#1E120D]/55 block">Supervisor</span>
                <strong className="text-[#1E120D]">{consultingActivity.supervisor}</strong>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB]">
                <span className="text-[#1E120D]/55 block">Responsável</span>
                <strong className="text-[#1E120D]">{consultingActivity.responsible}</strong>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB]">
                <span className="text-[#1E120D]/55 block">Data de início</span>
                <strong className="text-[#1E120D] tabular-nums">{formatDateBr(consultingActivity.startDate)}</strong>
              </div>
              <div className="p-3 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB]">
                <span className="text-[#1E120D]/55 block">Data de finalização</span>
                <strong className="text-[#1E120D] tabular-nums">{formatDateBr(consultingActivity.endDate)}</strong>
              </div>
            </div>

            <div className="p-3 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs">
              <span className="text-[#1E120D]/55 block mb-1">Status atual</span>
              <div className="flex items-center gap-2 font-bold text-[#1E120D]">
                {consultingActivity.status === 'Finalizada' ? (
                  <CheckCircle2 className="w-4 h-4 text-emerald-700" />
                ) : consultingActivity.status === 'Em andamento' ? (
                  <Clock className="w-4 h-4 text-[#8E1057]" />
                ) : (
                  <Calendar className="w-4 h-4 text-amber-700" />
                )}
                <span>{consultingActivity.status}</span>
              </div>
            </div>

            {consultingActivity.observations && (
              <div className="p-3 rounded-xl bg-white border border-[#F0E4EB] text-xs">
                <span className="font-bold text-[#1E120D]/70 block mb-1">Observações</span>
                <p className="text-[#1E120D]/80 whitespace-pre-line">{consultingActivity.observations}</p>
              </div>
            )}

            {consultingActivity.spreadsheetOrigin && (
              <div className="p-3 rounded-xl bg-[#FAF6F8] border border-[#D65F95]/30 text-xs space-y-1">
                <span className="font-bold text-[#8E1057] block">
                  Referência Imutável da Planilha Original (Parreiral 2027)
                </span>
                <p className="text-[#1E120D]/75">
                  Necessidade: <strong>{consultingActivity.spreadsheetOrigin.necessidadeOriginal}</strong> ·
                  Status original: <strong>{consultingActivity.spreadsheetOrigin.statusOriginal}</strong> ·
                  Situação: <strong>{consultingActivity.spreadsheetOrigin.situacaoOriginal}</strong>
                  {consultingActivity.spreadsheetOrigin.inicioOriginal
                    ? ` · Início na planilha: ${consultingActivity.spreadsheetOrigin.inicioOriginal}`
                    : ''}
                </p>
              </div>
            )}

            <div className="pt-3 border-t border-[#F0E4EB] flex items-center justify-end gap-2">
              {canEdit && (
                <button
                  type="button"
                  onClick={() => {
                    const target = consultingActivity;
                    setConsultingActivityId(null);
                    openEditModal(target);
                  }}
                  className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl border border-[#F0E4EB] bg-[#FAF6F8] text-[#1E120D] text-xs font-bold hover:bg-[#F0E4EB] transition cursor-pointer"
                >
                  <Edit3 className="w-3.5 h-3.5 text-[#8E1057]" />
                  <span>Editar</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setConsultingActivityId(null)}
                className="px-4 py-2 rounded-xl bg-[#8E1057] hover:bg-[#750D48] text-white text-xs font-bold transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Confirmação de Exclusão */}
      {deletingActivity && (
        <div className="fixed inset-0 bg-[#1E120D]/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#F0E4EB] space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-50 text-rose-700 border border-rose-200 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1E120D]">
                  Confirmar Exclusão
                </h3>
                <p className="text-xs text-[#1E120D]/70 mt-1">
                  Deseja excluir a atividade <strong>{getDisplayActivityLabel(deletingActivity)}</strong> na parcela{' '}
                  <strong>{deletingActivity.parcelCode}</strong> ({deletingActivity.farmName})? A planilha original de 2027 permanecerá intacta.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingActivity(null)}
                className="px-4 py-2 rounded-xl border border-[#F0E4EB] text-xs font-bold text-[#1E120D] hover:bg-[#FAF6F8] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer"
              >
                Excluir Atividade
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
