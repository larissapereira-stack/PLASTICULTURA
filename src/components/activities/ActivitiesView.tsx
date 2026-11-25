import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ActivityStatus, ActivityTypeItem, PlasticultureActivity } from '../../types';
import {
  ClipboardList,
  Plus,
  Search,
  Filter,
  RotateCcw,
  Clock,
  CheckCircle2,
  Loader2,
  Edit3,
  Eye,
  Trash2,
  X,
  Calendar,
  Users,
  UserCheck,
  History,
  Download,
  FileText,
  Tags,
  AlertTriangle,
  Check,
  Power
} from 'lucide-react';

interface ParcelOption {
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

export const ActivitiesView: React.FC = () => {
  const {
    farms,
    sectors,
    parcels,
    serroplastRecords,
    availableUsers,
    activities,
    activityTypes,
    saveActivity,
    updateActivityStatus,
    deleteActivity,
    saveActivityType,
    deleteActivityType,
    currentUser,
    hasPermission,
    showToast
  } = useApp();

  const canCreate = hasPermission('create_records');
  const canEdit = hasPermission('edit_records');
  const canDelete = hasPermission('delete_records');

  // --- Modo de Visualização (Lista vs. Histórico Geral) ---
  const [viewMode, setViewMode] = useState<'list' | 'history'>('list');

  // --- Filtros da Listagem ---
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFarmId, setFilterFarmId] = useState<string>('all');
  const [filterSector, setFilterSector] = useState<string>('all');
  const [filterParcel, setFilterParcel] = useState<string>('all');
  const [filterSupervisor, setFilterSupervisor] = useState<string>('all');
  const [filterType, setFilterType] = useState<string>('all');
  const [filterStatus, setFilterStatus] = useState<'ALL' | ActivityStatus>('ALL');
  const [filterDateFrom, setFilterDateFrom] = useState<string>('');
  const [filterDateTo, setFilterDateTo] = useState<string>('');

  // --- Modais ---
  const [isFormModalOpen, setIsFormModalOpen] = useState(false);
  const [editingActivity, setEditingActivity] = useState<PlasticultureActivity | null>(null);
  const [consultingActivityId, setConsultingActivityId] = useState<string | null>(null);
  const [quickStatusNote, setQuickStatusNote] = useState('');
  const [deletingActivity, setDeletingActivity] = useState<PlasticultureActivity | null>(null);

  // --- Modal de Gerenciamento de Tipos de Atividades ---
  const [isTypesModalOpen, setIsTypesModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [editingTypeId, setEditingTypeId] = useState<string | null>(null);
  const [editingTypeName, setEditingTypeName] = useState('');
  const [deletingType, setDeletingType] = useState<ActivityTypeItem | null>(null);

  // --- Estado do Formulário de Atividade ---
  const [formFarmId, setFormFarmId] = useState<string>(farms[0]?.id || '');
  const [formSector, setFormSector] = useState<string>('');
  const [formCustomSector, setFormCustomSector] = useState<string>('');
  const [formParcelCode, setFormParcelCode] = useState<string>('');
  const [formParcelId, setFormParcelId] = useState<string | undefined>(undefined);
  const [formCustomParcel, setFormCustomParcel] = useState<string>('');
  const [formExecutionDate, setFormExecutionDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [formActivityType, setFormActivityType] = useState<string>(
    activityTypes.find(t => t.active)?.name || 'Instalação de plástico'
  );
  const [formCustomActivityType, setFormCustomActivityType] = useState<string>('');
  const [formServiceDescription, setFormServiceDescription] = useState<string>('');
  const [formSupervisor, setFormSupervisor] = useState<string>('');
  const [formCustomSupervisor, setFormCustomSupervisor] = useState<string>('');
  const [formTeamName, setFormTeamName] = useState<string>('');
  const [formPeopleCount, setFormPeopleCount] = useState<number>(4);
  const [formHoursWorked, setFormHoursWorked] = useState<number>(8);
  const [formStatus, setFormStatus] = useState<ActivityStatus>('Pendente');
  const [formObservations, setFormObservations] = useState<string>('');

  // Helper: obter Setores dinâmicos para uma fazenda (cadastros de Setores + Parcelas + Serroplast + Atividades)
  const getSectorsForFarm = (farmId: string): string[] => {
    const farm = farms.find(f => f.id === farmId);
    const set = new Set<string>();

    sectors
      .filter(s => farmId === 'all' || s.farmId === farmId)
      .forEach(s => {
        if (s.name?.trim()) set.add(s.name.trim());
      });

    parcels
      .filter(p => farmId === 'all' || p.farmId === farmId)
      .forEach(p => {
        if (p.sector?.trim()) set.add(p.sector.trim());
      });

    serroplastRecords
      .filter(r => r.ativo && (farmId === 'all' || (farm && r.sigla === farm.code)))
      .forEach(r => {
        const label = r.setorInterno
          ? `Setor ${r.setorFazenda} (${r.setorInterno})`
          : r.setorFazenda
            ? `Setor ${r.setorFazenda}`
            : '';
        if (label.trim()) set.add(label.trim());
      });

    activities
      .filter(a => farmId === 'all' || a.farmId === farmId)
      .forEach(a => {
        if (a.sector?.trim()) set.add(a.sector.trim());
      });

    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  };

  // Helper: obter Parcelas dinâmicas para uma fazenda e setor
  const getParcelsForFarmAndSector = (farmId: string, sectorName: string): ParcelOption[] => {
    const farm = farms.find(f => f.id === farmId);
    const options: ParcelOption[] = [];
    const seen = new Set<string>();

    const matchesSector = (candidateSector: string) => {
      if (!sectorName || sectorName === 'all' || sectorName === '__CUSTOM__') return true;
      const a = normalizeText(candidateSector);
      const b = normalizeText(sectorName);
      return a === b || a.includes(b) || b.includes(a);
    };

    parcels
      .filter(p => (farmId === 'all' || p.farmId === farmId) && matchesSector(p.sector))
      .forEach(p => {
        const key = `${p.farmCode}|${normalizeText(p.parcelCode)}|${normalizeText(p.variety)}`;
        if (!seen.has(key)) {
          seen.add(key);
          options.push({
            id: p.id,
            parcelCode: p.parcelCode,
            sector: p.sector,
            variety: p.variety,
            areaHa: p.hectares,
            supervisor: p.supervisor || '',
            sourceLabel: 'Cadastro'
          });
        }
      });

    serroplastRecords
      .filter(r => {
        if (!r.ativo) return false;
        if (farmId !== 'all' && (!farm || r.sigla !== farm.code)) return false;
        const serroSectorLabel = r.setorInterno
          ? `Setor ${r.setorFazenda} (${r.setorInterno})`
          : `Setor ${r.setorFazenda}`;
        return (
          matchesSector(serroSectorLabel) ||
          matchesSector(r.setorInterno) ||
          matchesSector(r.setorFazenda)
        );
      })
      .forEach(r => {
        const key = `${r.sigla}|${normalizeText(r.parcela)}|${normalizeText(r.variedade)}`;
        if (!seen.has(key)) {
          seen.add(key);
          const serroSectorLabel = r.setorInterno
            ? `Setor ${r.setorFazenda} (${r.setorInterno})`
            : `Setor ${r.setorFazenda}`;
          options.push({
            id: r.id,
            parcelCode: r.parcela,
            sector: serroSectorLabel,
            variety: r.variedade,
            areaHa: r.areaHa,
            supervisor: r.supervisor || '',
            sourceLabel: 'Serroplast'
          });
        }
      });

    return options.sort((a, b) => a.parcelCode.localeCompare(b.parcelCode, 'pt-BR', { numeric: true }));
  };

  // Supervisores / Responsáveis dinâmicos (Farms, Sectors, Parcels, Serroplast, Users e Atividades)
  const dynamicSupervisors = useMemo(() => {
    const set = new Set<string>();
    farms.forEach(f => f.manager?.trim() && set.add(f.manager.trim()));
    sectors.forEach(s => s.supervisorDefault?.trim() && set.add(s.supervisorDefault.trim()));
    parcels.forEach(p => p.supervisor?.trim() && set.add(p.supervisor.trim()));
    serroplastRecords.forEach(r => r.supervisor?.trim() && set.add(r.supervisor.trim()));
    availableUsers.forEach(u => u.name?.trim() && set.add(u.name.trim()));
    activities.forEach(a => a.supervisor?.trim() && set.add(a.supervisor.trim()));
    return Array.from(set).sort((a, b) => a.localeCompare(b, 'pt-BR'));
  }, [farms, sectors, parcels, serroplastRecords, availableUsers, activities]);

  // Tipos de atividade ativos para novos cadastros
  const activeActivityTypes = useMemo(() => {
    return activityTypes.filter(t => t.active).map(t => t.name);
  }, [activityTypes]);

  // Todos os tipos de atividade para filtros (ativos + tipos já usados em registros existentes)
  const filterActivityTypeOptions = useMemo(() => {
    const set = new Set<string>(activityTypes.map(t => t.name));
    activities.forEach(a => a.activityType?.trim() && set.add(a.activityType.trim()));
    return Array.from(set);
  }, [activityTypes, activities]);

  // Opções dinâmicas para os filtros da listagem
  const filterSectorOptions = useMemo(
    () => getSectorsForFarm(filterFarmId),
    [filterFarmId, farms, sectors, parcels, serroplastRecords, activities]
  );

  const filterParcelOptions = useMemo(() => {
    const fromRegistry = getParcelsForFarmAndSector(filterFarmId, filterSector).map(p => p.parcelCode);
    const fromActivities = activities
      .filter(a => {
        if (filterFarmId !== 'all' && a.farmId !== filterFarmId) return false;
        if (filterSector !== 'all' && a.sector !== filterSector) return false;
        return true;
      })
      .map(a => a.parcelCode);
    return Array.from(new Set([...fromRegistry, ...fromActivities].filter(Boolean))).sort((a, b) =>
      a.localeCompare(b, 'pt-BR', { numeric: true })
    );
  }, [filterFarmId, filterSector, farms, parcels, serroplastRecords, activities]);

  // Opções dinâmicas para o formulário de cadastro/edição
  const formSectorOptions = useMemo(
    () => getSectorsForFarm(formFarmId),
    [formFarmId, farms, sectors, parcels, serroplastRecords, activities]
  );

  const formParcelOptions = useMemo(() => {
    const effectiveSector = formSector === '__CUSTOM__' ? formCustomSector : formSector;
    return getParcelsForFarmAndSector(formFarmId, effectiveSector || 'all');
  }, [formFarmId, formSector, formCustomSector, farms, parcels, serroplastRecords]);

  // Lista filtrada
  const filteredActivities = useMemo(() => {
    return activities
      .filter(act => {
        if (filterFarmId !== 'all' && act.farmId !== filterFarmId) return false;
        if (filterSector !== 'all' && act.sector !== filterSector) return false;
        if (filterParcel !== 'all' && act.parcelCode !== filterParcel) return false;
        if (filterSupervisor !== 'all' && act.supervisor !== filterSupervisor) return false;
        if (filterType !== 'all' && act.activityType !== filterType) return false;
        if (filterStatus !== 'ALL' && act.status !== filterStatus) return false;
        if (filterDateFrom && act.executionDate < filterDateFrom) return false;
        if (filterDateTo && act.executionDate > filterDateTo) return false;

        if (searchTerm.trim()) {
          const q = searchTerm.toLowerCase();
          const match =
            act.serviceDescription.toLowerCase().includes(q) ||
            act.activityType.toLowerCase().includes(q) ||
            act.farmName.toLowerCase().includes(q) ||
            act.farmCode.toLowerCase().includes(q) ||
            act.sector.toLowerCase().includes(q) ||
            act.parcelCode.toLowerCase().includes(q) ||
            act.supervisor.toLowerCase().includes(q) ||
            act.teamName.toLowerCase().includes(q) ||
            (act.observations && act.observations.toLowerCase().includes(q));
          if (!match) return false;
        }
        return true;
      })
      .sort((a, b) => b.executionDate.localeCompare(a.executionDate) || b.updatedAt.localeCompare(a.updatedAt));
  }, [
    activities,
    filterFarmId,
    filterSector,
    filterParcel,
    filterSupervisor,
    filterType,
    filterStatus,
    filterDateFrom,
    filterDateTo,
    searchTerm
  ]);

  // Timeline global consolidada para a aba "Histórico de Atividades"
  const consolidatedHistory = useMemo(() => {
    const entries: {
      id: string;
      timestamp: string;
      action: string;
      summary: string;
      userName: string;
      userRole: string;
      previousStatus?: ActivityStatus;
      newStatus?: ActivityStatus;
      activity: PlasticultureActivity;
    }[] = [];

    filteredActivities.forEach(act => {
      (act.history || []).forEach(h => {
        entries.push({
          id: `${act.id}-${h.id}`,
          timestamp: h.timestamp,
          action: h.action,
          summary: h.summary,
          userName: h.userName,
          userRole: h.userRole,
          previousStatus: h.previousStatus,
          newStatus: h.newStatus,
          activity: act
        });
      });
    });

    return entries.sort((a, b) => b.timestamp.localeCompare(a.timestamp));
  }, [filteredActivities]);

  // Resumo calculado (5 indicadores obrigatórios)
  const summary = useMemo(() => {
    const total = filteredActivities.length;
    const pending = filteredActivities.filter(a => a.status === 'Pendente').length;
    const inProgress = filteredActivities.filter(a => a.status === 'Em andamento').length;
    const completed = filteredActivities.filter(a => a.status === 'Concluída').length;
    const totalHours = Number(
      filteredActivities.reduce((sum, a) => sum + (Number(a.hoursWorked) || 0), 0).toFixed(2)
    );
    const totalPersonHours = Number(
      filteredActivities
        .reduce((sum, a) => sum + (Number(a.hoursWorked) || 0) * (Number(a.peopleCount) || 0), 0)
        .toFixed(1)
    );

    return {
      total,
      pending,
      inProgress,
      completed,
      totalHours,
      totalPersonHours
    };
  }, [filteredActivities]);

  const hasActiveFilters =
    filterFarmId !== 'all' ||
    filterSector !== 'all' ||
    filterParcel !== 'all' ||
    filterSupervisor !== 'all' ||
    filterType !== 'all' ||
    filterStatus !== 'ALL' ||
    Boolean(filterDateFrom) ||
    Boolean(filterDateTo) ||
    Boolean(searchTerm.trim());

  const clearFilters = () => {
    setFilterFarmId('all');
    setFilterSector('all');
    setFilterParcel('all');
    setFilterSupervisor('all');
    setFilterType('all');
    setFilterStatus('ALL');
    setFilterDateFrom('');
    setFilterDateTo('');
    setSearchTerm('');
  };

  // --- Handlers do Formulário de Atividade ---
  const handleOpenCreateModal = () => {
    const defaultFarm = farms[0];
    const defaultFarmId = defaultFarm?.id || '';
    const defaultSectors = getSectorsForFarm(defaultFarmId);
    const firstSector = defaultSectors[0] || '';
    const defaultParcels = getParcelsForFarmAndSector(defaultFarmId, firstSector);
    const firstParcel = defaultParcels[0];

    setEditingActivity(null);
    setFormFarmId(defaultFarmId);
    setFormSector(firstSector || '__CUSTOM__');
    setFormCustomSector('');
    setFormParcelCode(firstParcel ? firstParcel.parcelCode : '__CUSTOM__');
    setFormParcelId(firstParcel?.id);
    setFormCustomParcel('');
    setFormExecutionDate(new Date().toISOString().slice(0, 10));
    setFormActivityType(activeActivityTypes[0] || 'Instalação de plástico');
    setFormCustomActivityType('');
    setFormServiceDescription('');
    setFormSupervisor(firstParcel?.supervisor || defaultFarm?.manager || dynamicSupervisors[0] || currentUser.name);
    setFormCustomSupervisor('');
    setFormTeamName('');
    setFormPeopleCount(4);
    setFormHoursWorked(8);
    setFormStatus('Pendente');
    setFormObservations('');
    setIsFormModalOpen(true);
  };

  const handleOpenEditModal = (activity: PlasticultureActivity) => {
    const farmSectors = getSectorsForFarm(activity.farmId);
    const sectorInList = farmSectors.includes(activity.sector);
    const farmParcels = getParcelsForFarmAndSector(activity.farmId, activity.sector);
    const parcelMatch = farmParcels.find(p => p.parcelCode === activity.parcelCode);
    const typeInList = activeActivityTypes.includes(activity.activityType);
    const supInList = dynamicSupervisors.includes(activity.supervisor);

    setEditingActivity(activity);
    setFormFarmId(activity.farmId);
    setFormSector(sectorInList ? activity.sector : '__CUSTOM__');
    setFormCustomSector(sectorInList ? '' : activity.sector);
    setFormParcelCode(parcelMatch ? parcelMatch.parcelCode : '__CUSTOM__');
    setFormParcelId(activity.parcelId || parcelMatch?.id);
    setFormCustomParcel(parcelMatch ? '' : activity.parcelCode);
    setFormExecutionDate(activity.executionDate);
    setFormActivityType(typeInList ? activity.activityType : '__CUSTOM__');
    setFormCustomActivityType(typeInList ? '' : activity.activityType);
    setFormServiceDescription(activity.serviceDescription);
    setFormSupervisor(supInList ? activity.supervisor : '__CUSTOM__');
    setFormCustomSupervisor(supInList ? '' : activity.supervisor);
    setFormTeamName(activity.teamName);
    setFormPeopleCount(activity.peopleCount);
    setFormHoursWorked(activity.hoursWorked);
    setFormStatus(activity.status);
    setFormObservations(activity.observations || '');
    setIsFormModalOpen(true);
  };

  const handleFormFarmChange = (newFarmId: string) => {
    setFormFarmId(newFarmId);
    const newSectors = getSectorsForFarm(newFarmId);
    const nextSector = newSectors[0] || '__CUSTOM__';
    setFormSector(nextSector);
    setFormCustomSector('');

    const newParcels = getParcelsForFarmAndSector(newFarmId, nextSector);
    const nextParcel = newParcels[0];
    setFormParcelCode(nextParcel ? nextParcel.parcelCode : '__CUSTOM__');
    setFormParcelId(nextParcel?.id);
    setFormCustomParcel('');

    const farmObj = farms.find(f => f.id === newFarmId);
    if (nextParcel?.supervisor) {
      setFormSupervisor(nextParcel.supervisor);
      setFormCustomSupervisor('');
    } else if (farmObj?.manager) {
      setFormSupervisor(farmObj.manager);
      setFormCustomSupervisor('');
    }
  };

  const handleFormSectorChange = (newSector: string) => {
    setFormSector(newSector);
    if (newSector !== '__CUSTOM__') {
      setFormCustomSector('');
      const sectorParcels = getParcelsForFarmAndSector(formFarmId, newSector);
      const nextParcel = sectorParcels[0];
      setFormParcelCode(nextParcel ? nextParcel.parcelCode : '__CUSTOM__');
      setFormParcelId(nextParcel?.id);
      setFormCustomParcel('');
      if (nextParcel?.supervisor) {
        setFormSupervisor(nextParcel.supervisor);
      }
    }
  };

  const handleFormParcelChange = (selectedCode: string) => {
    setFormParcelCode(selectedCode);
    if (selectedCode !== '__CUSTOM__') {
      setFormCustomParcel('');
      const match = formParcelOptions.find(p => p.parcelCode === selectedCode);
      setFormParcelId(match?.id);
      if (match?.supervisor) {
        setFormSupervisor(match.supervisor);
        setFormCustomSupervisor('');
      }
    } else {
      setFormParcelId(undefined);
    }
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    const selectedFarm = farms.find(f => f.id === formFarmId);
    const finalSector = formSector === '__CUSTOM__' ? formCustomSector.trim() : formSector.trim();
    const finalParcel = formParcelCode === '__CUSTOM__' ? formCustomParcel.trim() : formParcelCode.trim();
    const finalType = formActivityType === '__CUSTOM__' ? formCustomActivityType.trim() : formActivityType.trim();
    const finalSupervisor = formSupervisor === '__CUSTOM__' ? formCustomSupervisor.trim() : formSupervisor.trim();

    if (!selectedFarm || !finalSector || !finalParcel || !formExecutionDate || !finalType || !formServiceDescription.trim() || !finalSupervisor || !formTeamName.trim()) {
      showToast('error', 'Campos Obrigatórios', 'Preencha fazenda, setor, parcela, data, tipo, descrição do serviço, responsável e equipe.');
      return;
    }

    // Se informou um novo tipo de atividade diretamente no formulário, salva permanentemente no cadastro de tipos
    if (formActivityType === '__CUSTOM__') {
      const existsInCatalog = activityTypes.some(
        t => t.name.trim().toLowerCase() === finalType.toLowerCase()
      );
      if (!existsInCatalog) {
        saveActivityType({ name: finalType, active: true });
      }
    }

    const payload: PlasticultureActivity = {
      id: editingActivity ? editingActivity.id : `act-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      farmId: selectedFarm.id,
      farmCode: selectedFarm.code,
      farmName: selectedFarm.name,
      sector: finalSector,
      parcelId: formParcelId,
      parcelCode: finalParcel,
      executionDate: formExecutionDate,
      activityType: finalType,
      serviceDescription: formServiceDescription.trim(),
      supervisor: finalSupervisor,
      teamName: formTeamName.trim(),
      peopleCount: Math.max(1, Number(formPeopleCount) || 1),
      hoursWorked: Math.max(0, Number(formHoursWorked) || 0),
      status: formStatus,
      observations: formObservations.trim() || undefined,
      history: editingActivity?.history || [],
      createdBy: editingActivity?.createdBy || currentUser.name,
      createdAt: editingActivity?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    saveActivity(payload);
    setIsFormModalOpen(false);
    setEditingActivity(null);
  };

  const handleConfirmDeleteActivity = () => {
    if (!deletingActivity) return;
    const deletedId = deletingActivity.id;
    const res = deleteActivity(deletedId);
    if (res.success) {
      setDeletingActivity(null);
      if (consultingActivityId === deletedId) {
        setConsultingActivityId(null);
      }
    }
  };

  // --- Handlers do Cadastro de Tipos de Atividades ---
  const handleAddActivityType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;
    const res = saveActivityType({ name: newTypeName.trim(), active: true });
    if (res.success) {
      setNewTypeName('');
    }
  };

  const handleSaveEditedType = (typeItem: ActivityTypeItem) => {
    if (!editingTypeName.trim()) return;
    const res = saveActivityType({
      id: typeItem.id,
      name: editingTypeName.trim(),
      active: typeItem.active
    });
    if (res.success) {
      setEditingTypeId(null);
      setEditingTypeName('');
    }
  };

  const handleToggleTypeActive = (typeItem: ActivityTypeItem) => {
    saveActivityType({
      id: typeItem.id,
      name: typeItem.name,
      active: !typeItem.active
    });
  };

  const handleConfirmDeleteType = () => {
    if (!deletingType) return;
    const res = deleteActivityType(deletingType.id);
    if (res.success) {
      setDeletingType(null);
    }
  };

  const consultingActivity = useMemo(
    () => activities.find(a => a.id === consultingActivityId) || null,
    [activities, consultingActivityId]
  );

  // Exportar CSV
  const handleExportCsv = () => {
    const headers = [
      'DATA_ATIVIDADE',
      'SIGLA',
      'FAZENDA',
      'SETOR',
      'PARCELA',
      'TIPO_ATIVIDADE',
      'DESCRICAO_SERVICO',
      'RESPONSAVEL_SUPERVISOR',
      'EQUIPE_ENVOLVIDA',
      'QTD_PESSOAS',
      'HORAS_TRABALHADAS',
      'STATUS',
      'OBSERVACOES'
    ];

    const rows = filteredActivities.map(a => [
      `"${formatDateBr(a.executionDate)}"`,
      `"${a.farmCode}"`,
      `"${a.farmName}"`,
      `"${a.sector}"`,
      `"${a.parcelCode}"`,
      `"${a.activityType}"`,
      `"${a.serviceDescription.replace(/"/g, '""')}"`,
      `"${a.supervisor}"`,
      `"${a.teamName}"`,
      `"${a.peopleCount}"`,
      `"${a.hoursWorked.toFixed(2).replace('.', ',')}"`,
      `"${a.status}"`,
      `"${(a.observations || '').replace(/"/g, '""')}"`
    ]);

    const csv = '\uFEFF' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
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

  const renderStatusIndicator = (status: ActivityStatus) => {
    if (status === 'Concluída') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-emerald-700 whitespace-nowrap">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
          <span>Concluída</span>
        </span>
      );
    }
    if (status === 'Em andamento') {
      return (
        <span className="inline-flex items-center gap-1.5 text-xs font-bold text-[#8E1057] whitespace-nowrap">
          <Loader2 className="w-3.5 h-3.5 text-[#8E1057] shrink-0" />
          <span>Em andamento</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center gap-1.5 text-xs font-bold text-amber-700 whitespace-nowrap">
        <Clock className="w-3.5 h-3.5 text-amber-600 shrink-0" />
        <span>Pendente</span>
      </span>
    );
  };

  return (
    <div className="space-y-6 text-[#1E120D]">
      {/* Cabeçalho Operacional do Módulo */}
      <div className="bg-white border border-[#F0E4EB] rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8E1057] mb-1">
            <ClipboardList className="w-4 h-4 text-[#8E1057]" />
            <span>Diário de Operações · Setor de Plasticultura</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E120D] tracking-tight">
            Atividades de Plasticultura
          </h2>
          <p className="text-xs text-[#1E120D]/65 mt-0.5 max-w-2xl">
            Cadastro, acompanhamento e histórico completo de atividades integrado aos cadastros existentes de fazendas, setores, parcelas e supervisores.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            type="button"
            onClick={() => setIsTypesModalOpen(true)}
            className="inline-flex items-center gap-2 px-3.5 py-2 bg-white hover:bg-[#FAF6F8] text-[#8E1057] border border-[#D65F95]/40 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer"
          >
            <Tags className="w-4 h-4" />
            <span>Tipos de Atividades ({activityTypes.filter(t => t.active).length})</span>
          </button>

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
              onClick={handleOpenCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2.5 bg-[#8E1057] hover:bg-[#750D48] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Nova Atividade</span>
            </button>
          )}
        </div>
      </div>

      {/* Resumo de Atividades (5 Indicadores Obrigatórios) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        {/* 1. Total de atividades cadastradas */}
        <div className="bg-white border border-[#F0E4EB] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-[#1E120D]/65 block mb-1">
            Total de atividades cadastradas
          </span>
          <div className="text-2xl font-black text-[#1E120D] tabular-nums">
            {summary.total}
          </div>
          <p className="text-[11px] text-[#1E120D]/55 mt-1">
            {hasActiveFilters ? `de ${activities.length} registradas no banco` : 'Atividades registradas no setor'}
          </p>
        </div>

        {/* 2. Atividades pendentes */}
        <div className="bg-white border border-[#F0E4EB] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-amber-700 block mb-1">
            Atividades pendentes
          </span>
          <div className="text-2xl font-black text-amber-700 tabular-nums">
            {summary.pending}
          </div>
          <p className="text-[11px] text-[#1E120D]/55 mt-1">
            Aguardando início de execução
          </p>
        </div>

        {/* 3. Atividades em andamento */}
        <div className="bg-white border border-[#F0E4EB] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-[#8E1057] block mb-1">
            Atividades em andamento
          </span>
          <div className="text-2xl font-black text-[#8E1057] tabular-nums">
            {summary.inProgress}
          </div>
          <p className="text-[11px] text-[#1E120D]/55 mt-1">
            Equipes em execução no campo
          </p>
        </div>

        {/* 4. Atividades concluídas */}
        <div className="bg-white border border-[#F0E4EB] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-emerald-700 block mb-1">
            Atividades concluídas
          </span>
          <div className="text-2xl font-black text-emerald-700 tabular-nums">
            {summary.completed}
          </div>
          <p className="text-[11px] text-[#1E120D]/55 mt-1">
            Serviços finalizados e conferidos
          </p>
        </div>

        {/* 5. Total de horas trabalhadas */}
        <div className="col-span-2 sm:col-span-1 bg-gradient-to-br from-[#4A072E] to-[#8E1057] text-white border border-[#8E1057] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold text-pink-100 block mb-1">
            Total de horas trabalhadas
          </span>
          <div className="text-2xl font-black text-white tabular-nums">
            {summary.totalHours.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })}{' '}
            <span className="text-xs font-semibold text-pink-200">h</span>
          </div>
          <p className="text-[11px] text-pink-100/80 mt-1 tabular-nums">
            {summary.totalPersonHours.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 1 })} homens-hora acumulados
          </p>
        </div>
      </div>

      {/* Filtros Completos da Lista */}
      <div className="bg-white border border-[#F0E4EB] rounded-2xl p-4 shadow-xs space-y-3.5">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-2.5 border-b border-[#F0E4EB]">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1E120D]">
            <Filter className="w-4 h-4 text-[#8E1057]" />
            <span>Filtros de Consulta ({filteredActivities.length} de {activities.length})</span>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Abas Segmentadas Rápidas de Status */}
            <div className="flex items-center gap-1 p-1 bg-[#FAF6F8] border border-[#F0E4EB] rounded-lg">
              {(['ALL', 'Pendente', 'Em andamento', 'Concluída'] as const).map(st => (
                <button
                  key={st}
                  type="button"
                  onClick={() => setFilterStatus(st)}
                  className={`px-2.5 py-1 text-[11px] font-semibold rounded-md transition whitespace-nowrap shrink-0 cursor-pointer ${
                    filterStatus === st
                      ? 'bg-[#8E1057] text-white shadow-xs'
                      : 'text-[#1E120D]/70 hover:text-[#1E120D]'
                  }`}
                >
                  {st === 'ALL' ? 'Todos Status' : st}
                </button>
              ))}
            </div>

            {hasActiveFilters && (
              <button
                type="button"
                onClick={clearFilters}
                className="inline-flex items-center gap-1.5 text-xs font-semibold text-[#8E1057] hover:text-[#750D48] bg-[#FAF6F8] hover:bg-pink-100/60 px-2.5 py-1.5 rounded-lg border border-[#D65F95]/40 transition whitespace-nowrap shrink-0 cursor-pointer"
              >
                <RotateCcw className="w-3.5 h-3.5" />
                <span>Limpar Filtros</span>
              </button>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5 text-xs">
          {/* Busca Rápida */}
          <div className="relative">
            <label className="block text-[11px] font-semibold text-[#1E120D]/75 mb-1">Pesquisar</label>
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#1E120D]/40" />
              <input
                type="text"
                value={searchTerm}
                onChange={e => setSearchTerm(e.target.value)}
                placeholder="Serviço, equipe, parcela, obs..."
                className="w-full pl-8 pr-3 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs text-[#1E120D] focus:outline-none focus:ring-2 focus:ring-[#8E1057] focus:bg-white"
              />
            </div>
          </div>

          {/* Fazenda */}
          <div>
            <label className="block text-[11px] font-semibold text-[#1E120D]/75 mb-1">Fazenda</label>
            <select
              value={filterFarmId}
              onChange={e => {
                setFilterFarmId(e.target.value);
                setFilterSector('all');
                setFilterParcel('all');
              }}
              className="w-full px-2.5 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs text-[#1E120D] font-medium focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
            >
              <option value="all">Todas as Fazendas</option>
              {farms.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.code})
                </option>
              ))}
            </select>
          </div>

          {/* Setor */}
          <div>
            <label className="block text-[11px] font-semibold text-[#1E120D]/75 mb-1">Setor</label>
            <select
              value={filterSector}
              onChange={e => {
                setFilterSector(e.target.value);
                setFilterParcel('all');
              }}
              className="w-full px-2.5 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs text-[#1E120D] font-medium focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
            >
              <option value="all">Todos os Setores</option>
              {filterSectorOptions.map(sec => (
                <option key={sec} value={sec}>
                  {sec}
                </option>
              ))}
            </select>
          </div>

          {/* Parcela */}
          <div>
            <label className="block text-[11px] font-semibold text-[#1E120D]/75 mb-1">Parcela</label>
            <select
              value={filterParcel}
              onChange={e => setFilterParcel(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs text-[#1E120D] font-medium focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
            >
              <option value="all">Todas as Parcelas</option>
              {filterParcelOptions.map(p => (
                <option key={p} value={p}>
                  {p}
                </option>
              ))}
            </select>
          </div>

          {/* Responsável / Supervisor */}
          <div>
            <label className="block text-[11px] font-semibold text-[#1E120D]/75 mb-1">Responsável / Supervisor</label>
            <select
              value={filterSupervisor}
              onChange={e => setFilterSupervisor(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs text-[#1E120D] font-medium focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
            >
              <option value="all">Todos os Responsáveis</option>
              {dynamicSupervisors.map(sup => (
                <option key={sup} value={sup}>
                  {sup}
                </option>
              ))}
            </select>
          </div>

          {/* Tipo de Atividade */}
          <div>
            <label className="block text-[11px] font-semibold text-[#1E120D]/75 mb-1">Tipo de Atividade</label>
            <select
              value={filterType}
              onChange={e => setFilterType(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs text-[#1E120D] font-medium focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
            >
              <option value="all">Todos os Tipos</option>
              {filterActivityTypeOptions.map(type => (
                <option key={type} value={type}>
                  {type}
                </option>
              ))}
            </select>
          </div>

          {/* Período Inicial */}
          <div>
            <label className="block text-[11px] font-semibold text-[#1E120D]/75 mb-1">Período — Data Início</label>
            <input
              type="date"
              value={filterDateFrom}
              onChange={e => setFilterDateFrom(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs text-[#1E120D] font-medium focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
            />
          </div>

          {/* Período Final */}
          <div>
            <label className="block text-[11px] font-semibold text-[#1E120D]/75 mb-1">Período — Data Fim</label>
            <input
              type="date"
              value={filterDateTo}
              onChange={e => setFilterDateTo(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs text-[#1E120D] font-medium focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
            />
          </div>
        </div>
      </div>

      {/* Alternador Lista vs Histórico Geral */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="inline-flex items-center gap-1 p-1 bg-white border border-[#F0E4EB] rounded-xl shadow-xs">
          <button
            type="button"
            onClick={() => setViewMode('list')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'list'
                ? 'bg-[#4A072E] text-white shadow-xs'
                : 'text-[#1E120D]/70 hover:text-[#8E1057] hover:bg-[#FAF6F8]'
            }`}
          >
            <ClipboardList className="w-3.5 h-3.5" />
            <span>Lista de Atividades ({filteredActivities.length})</span>
          </button>
          <button
            type="button"
            onClick={() => setViewMode('history')}
            className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-xs font-bold transition cursor-pointer ${
              viewMode === 'history'
                ? 'bg-[#4A072E] text-white shadow-xs'
                : 'text-[#1E120D]/70 hover:text-[#8E1057] hover:bg-[#FAF6F8]'
            }`}
          >
            <History className="w-3.5 h-3.5" />
            <span>Histórico de Atividades ({consolidatedHistory.length})</span>
          </button>
        </div>
      </div>

      {/* VISÃO 1: TABELA DE ATIVIDADES */}
      {viewMode === 'list' && (
        <div className="bg-white border border-[#F0E4EB] rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F0E4EB] bg-[#FAF6F8] flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-[#1E120D]">
                Registro de Atividades do Setor
              </h3>
              <p className="text-[11px] text-[#1E120D]/60">
                Consulte detalhes e histórico, edite registros ou exclua com confirmação.
              </p>
            </div>
            <span className="text-xs font-bold text-[#8E1057] tabular-nums">
              {filteredActivities.length} {filteredActivities.length === 1 ? 'atividade exibida' : 'atividades exibidas'}
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-[#FAF6F8] text-[#1E120D]/75 border-b border-[#F0E4EB] font-bold text-[11px]">
                  <th className="py-3 px-4 whitespace-nowrap">Data</th>
                  <th className="py-3 px-4 whitespace-nowrap">Fazenda / Setor / Parcela</th>
                  <th className="py-3 px-4">Tipo & Descrição do Serviço</th>
                  <th className="py-3 px-4 whitespace-nowrap">Responsável & Equipe</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Horas</th>
                  <th className="py-3 px-4 whitespace-nowrap">Status</th>
                  <th className="py-3 px-4 text-right whitespace-nowrap">Ações</th>
                </tr>
              </thead>

              <tbody className="divide-y divide-[#F0E4EB]">
                {filteredActivities.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="py-14 px-6 text-center">
                      <ClipboardList className="w-8 h-8 text-[#8E1057]/40 mx-auto mb-2" />
                      <p className="text-sm font-bold text-[#1E120D]">
                        Nenhuma atividade encontrada para os filtros selecionados.
                      </p>
                      <p className="text-xs text-[#1E120D]/60 mt-1 mb-4">
                        Ajuste os critérios de consulta ou cadastre um novo registro operacional.
                      </p>
                      {canCreate && (
                        <button
                          type="button"
                          onClick={handleOpenCreateModal}
                          className="inline-flex items-center gap-1.5 px-4 py-2 bg-[#8E1057] hover:bg-[#750D48] text-white text-xs font-bold rounded-xl transition cursor-pointer"
                        >
                          <Plus className="w-4 h-4" />
                          <span>Cadastrar Nova Atividade</span>
                        </button>
                      )}
                    </td>
                  </tr>
                ) : (
                  filteredActivities.map(act => (
                    <tr key={act.id} className="hover:bg-[#FAF6F8]/80 transition-colors align-top">
                      {/* Data */}
                      <td className="py-3.5 px-4 whitespace-nowrap font-mono tabular-nums text-[11px] font-semibold text-[#1E120D]">
                        {formatDateBr(act.executionDate)}
                      </td>

                      {/* Fazenda / Setor / Parcela */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-bold text-[#8E1057] text-xs">
                          {act.farmCode} · {act.farmName}
                        </div>
                        <div className="text-[11px] text-[#1E120D]/75 mt-0.5">
                          {act.sector} · <strong className="text-[#1E120D]">{act.parcelCode}</strong>
                        </div>
                      </td>

                      {/* Tipo e Descrição */}
                      <td className="py-3.5 px-4 max-w-md">
                        <div className="font-bold text-[#1E120D] text-xs">{act.activityType}</div>
                        <p className="text-[11px] text-[#1E120D]/75 mt-0.5 line-clamp-2 leading-relaxed">
                          {act.serviceDescription}
                        </p>
                        {act.observations && (
                          <p className="text-[10px] text-[#1E120D]/55 mt-1 truncate max-w-sm" title={act.observations}>
                            Obs.: {act.observations}
                          </p>
                        )}
                      </td>

                      {/* Responsável & Equipe */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="font-semibold text-[#1E120D]">{act.supervisor}</div>
                        <div className="text-[11px] text-[#1E120D]/65 mt-0.5 tabular-nums">
                          {act.teamName} · {act.peopleCount} {act.peopleCount === 1 ? 'pessoa' : 'pessoas'}
                        </div>
                      </td>

                      {/* Horas Trabalhadas */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <span className="font-black text-[#1E120D] tabular-nums text-xs">
                          {act.hoursWorked.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} h
                        </span>
                      </td>

                      {/* Status */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          {renderStatusIndicator(act.status)}
                          <select
                            aria-label={`Alterar status da atividade ${act.activityType}`}
                            disabled={!canEdit}
                            value={act.status}
                            onChange={e => updateActivityStatus(act.id, e.target.value as ActivityStatus)}
                            className="text-[10px] bg-[#FAF6F8] border border-[#F0E4EB] rounded-md px-1.5 py-0.5 text-[#1E120D]/80 font-medium focus:outline-none focus:ring-1 focus:ring-[#8E1057] disabled:opacity-65 disabled:cursor-not-allowed"
                          >
                            <option value="Pendente">Pendente</option>
                            <option value="Em andamento">Em andamento</option>
                            <option value="Concluída">Concluída</option>
                          </select>
                        </div>
                      </td>

                      {/* Ações */}
                      <td className="py-3.5 px-4 text-right whitespace-nowrap">
                        <div className="inline-flex items-center gap-1">
                          <button
                            type="button"
                            onClick={() => {
                              setConsultingActivityId(act.id);
                              setQuickStatusNote('');
                            }}
                            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-[#FAF6F8] hover:bg-[#F0E4EB] text-[#8E1057] text-[11px] font-bold transition cursor-pointer"
                            title="Consultar detalhes e histórico"
                          >
                            <Eye className="w-3.5 h-3.5" />
                            <span>Consultar</span>
                          </button>
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleOpenEditModal(act)}
                              className="p-1.5 rounded-lg text-[#1E120D]/60 hover:text-[#8E1057] hover:bg-[#FAF6F8] transition cursor-pointer"
                              title="Editar atividade"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                          )}
                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeletingActivity(act)}
                              className="p-1.5 rounded-lg text-[#1E120D]/55 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                              title="Excluir atividade"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* VISÃO 2: HISTÓRICO CONSOLIDADO DE ATIVIDADES */}
      {viewMode === 'history' && (
        <div className="bg-white border border-[#F0E4EB] rounded-2xl shadow-xs overflow-hidden">
          <div className="px-5 py-4 border-b border-[#F0E4EB] bg-[#FAF6F8] flex flex-wrap items-center justify-between gap-2">
            <div>
              <h3 className="font-bold text-sm text-[#1E120D] flex items-center gap-2">
                <History className="w-4 h-4 text-[#8E1057]" />
                <span>Histórico Cronológico de Atividades</span>
              </h3>
              <p className="text-[11px] text-[#1E120D]/60">
                Linha do tempo completa de criações, edições e alterações de status para as atividades filtradas.
              </p>
            </div>
            <span className="text-xs font-bold text-[#8E1057] tabular-nums">
              {consolidatedHistory.length} evento(s) registrado(s)
            </span>
          </div>

          <div className="p-4 sm:p-5">
            {consolidatedHistory.length === 0 ? (
              <div className="py-12 text-center bg-[#FAF6F8] rounded-xl border border-dashed border-[#F0E4EB] text-xs text-[#1E120D]/60">
                Nenhum evento de histórico encontrado para os filtros aplicados.
              </div>
            ) : (
              <div className="space-y-3">
                {consolidatedHistory.map(ev => (
                  <div
                    key={ev.id}
                    className="p-4 rounded-xl border border-[#F0E4EB] bg-[#FAF6F8]/60 hover:bg-[#FAF6F8] transition flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs">
                        <span className="px-2 py-0.5 rounded bg-[#8E1057] text-white font-bold text-[10px]">
                          {ev.action}
                        </span>
                        <span className="font-bold text-[#1E120D]">
                          {ev.activity.activityType}
                        </span>
                        <span className="text-[#1E120D]/60">
                          · {ev.activity.farmCode} ({ev.activity.sector} · {ev.activity.parcelCode})
                        </span>
                      </div>
                      <p className="text-xs text-[#1E120D]/85">{ev.summary}</p>
                      <div className="flex flex-wrap items-center gap-3 text-[11px] text-[#1E120D]/60">
                        <span>
                          Registrado por: <strong className="text-[#1E120D]">{ev.userName}</strong> ({ev.userRole})
                        </span>
                        <span>·</span>
                        <span className="font-mono tabular-nums">
                          {new Date(ev.timestamp).toLocaleString('pt-BR')}
                        </span>
                        <span>·</span>
                        <span>Data da atividade: {formatDateBr(ev.activity.executionDate)}</span>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => {
                        setConsultingActivityId(ev.activity.id);
                        setQuickStatusNote('');
                      }}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white hover:bg-[#F0E4EB] border border-[#F0E4EB] text-[#8E1057] text-xs font-bold transition shrink-0 cursor-pointer"
                    >
                      <Eye className="w-3.5 h-3.5" />
                      <span>Ver Atividade</span>
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      )}

      {/* MODAL 1: CADASTRAR / EDITAR ATIVIDADE */}
      {isFormModalOpen && (
        <div className="fixed inset-0 bg-[#1E120D]/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-[#F0E4EB] flex flex-col max-h-[92vh] overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-[#F0E4EB] bg-gradient-to-r from-[#4A072E] to-[#8E1057] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold tracking-tight">
                  {editingActivity ? 'Editar Atividade de Plasticultura' : 'Cadastrar Nova Atividade'}
                </h3>
                <p className="text-[11px] text-pink-100/90 mt-0.5">
                  Integrado aos cadastros existentes de fazendas, setores, parcelas, supervisores e tipos de atividades.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsFormModalOpen(false)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 overflow-y-auto space-y-4 text-xs">
              {/* Linha 1: Fazenda, Setor, Parcela */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Fazenda *</label>
                  <select
                    value={formFarmId}
                    onChange={e => handleFormFarmChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] font-semibold text-[#1E120D] focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
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
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] font-semibold text-[#1E120D] focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
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
                      required
                      value={formCustomSector}
                      onChange={e => setFormCustomSector(e.target.value)}
                      placeholder="Nome do setor"
                      className="mt-1.5 w-full px-3 py-1.5 rounded-lg bg-white border border-[#D65F95] text-xs"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Parcela *</label>
                  <select
                    value={formParcelCode}
                    onChange={e => handleFormParcelChange(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] font-semibold text-[#1E120D] focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  >
                    {formParcelOptions.map(p => (
                      <option key={`${p.parcelCode}-${p.variety}-${p.sourceLabel}`} value={p.parcelCode}>
                        {p.parcelCode} — {p.variety} ({p.areaHa} ha)
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Informar outra parcela...</option>
                  </select>
                  {formParcelCode === '__CUSTOM__' && (
                    <input
                      type="text"
                      required
                      value={formCustomParcel}
                      onChange={e => setFormCustomParcel(e.target.value)}
                      placeholder="Ex: Parcela 12/4"
                      className="mt-1.5 w-full px-3 py-1.5 rounded-lg bg-white border border-[#D65F95] text-xs"
                    />
                  )}
                </div>
              </div>

              {/* Linha 2: Data da atividade, Tipo de atividade, Status da atividade */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Data da atividade *</label>
                  <input
                    type="date"
                    value={formExecutionDate}
                    onChange={e => setFormExecutionDate(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] font-semibold text-[#1E120D] focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Tipo de atividade *</label>
                  <select
                    value={formActivityType}
                    onChange={e => setFormActivityType(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] font-semibold text-[#1E120D] focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  >
                    {activeActivityTypes.map(type => (
                      <option key={type} value={type}>
                        {type}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Cadastrar novo tipo de atividade...</option>
                  </select>
                  {formActivityType === '__CUSTOM__' && (
                    <input
                      type="text"
                      required
                      value={formCustomActivityType}
                      onChange={e => setFormCustomActivityType(e.target.value)}
                      placeholder="Nome do novo tipo (salvo no cadastro)"
                      className="mt-1.5 w-full px-3 py-1.5 rounded-lg bg-white border border-[#D65F95] text-xs"
                    />
                  )}
                </div>

                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Status da atividade *</label>
                  <select
                    value={formStatus}
                    onChange={e => setFormStatus(e.target.value as ActivityStatus)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] font-bold text-[#8E1057] focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  >
                    <option value="Pendente">Pendente</option>
                    <option value="Em andamento">Em andamento</option>
                    <option value="Concluída">Concluída</option>
                  </select>
                </div>
              </div>

              {/* Linha 3: Descrição do serviço */}
              <div>
                <label className="block font-bold text-[#1E120D] mb-1">Descrição do serviço *</label>
                <textarea
                  rows={3}
                  required
                  value={formServiceDescription}
                  onChange={e => setFormServiceDescription(e.target.value)}
                  placeholder="Detalhe o serviço executado ou programado na parcela (ex: instalação de filme, reparos no plástico, manutenção de estrutura...)"
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-[#1E120D] focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                />
              </div>

              {/* Linha 4: Responsável ou supervisor, Equipe envolvida, Quantidade de pessoas, Horas trabalhadas */}
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block font-bold text-[#1E120D] mb-1">Responsável / supervisor *</label>
                  <select
                    value={formSupervisor}
                    onChange={e => setFormSupervisor(e.target.value)}
                    required
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] font-semibold text-[#1E120D] focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  >
                    {dynamicSupervisors.map(sup => (
                      <option key={sup} value={sup}>
                        {sup}
                      </option>
                    ))}
                    <option value="__CUSTOM__">+ Outro responsável...</option>
                  </select>
                  {formSupervisor === '__CUSTOM__' && (
                    <input
                      type="text"
                      required
                      value={formCustomSupervisor}
                      onChange={e => setFormCustomSupervisor(e.target.value)}
                      placeholder="Nome do responsável"
                      className="mt-1.5 w-full px-3 py-1.5 rounded-lg bg-white border border-[#D65F95] text-xs"
                    />
                  )}
                </div>

                <div className="sm:col-span-2 lg:col-span-1">
                  <label className="block font-bold text-[#1E120D] mb-1">Equipe envolvida *</label>
                  <input
                    type="text"
                    required
                    value={formTeamName}
                    onChange={e => setFormTeamName(e.target.value)}
                    placeholder="Ex: Equipe Parral 02"
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-[#1E120D] focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Quantidade de pessoas *</label>
                  <input
                    type="number"
                    min={1}
                    step={1}
                    required
                    value={formPeopleCount}
                    onChange={e => setFormPeopleCount(parseInt(e.target.value, 10) || 1)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] font-bold text-[#1E120D] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Horas trabalhadas *</label>
                  <input
                    type="number"
                    min={0}
                    step={0.5}
                    required
                    value={formHoursWorked}
                    onChange={e => setFormHoursWorked(parseFloat(e.target.value) || 0)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] font-bold text-[#8E1057] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  />
                </div>
              </div>

              {/* Linha 5: Observações */}
              <div>
                <label className="block font-bold text-[#1E120D] mb-1">Observações</label>
                <textarea
                  rows={2}
                  value={formObservations}
                  onChange={e => setFormObservations(e.target.value)}
                  placeholder="Ocorrências climáticas, materiais utilizados, pendências de follow-up..."
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-[#1E120D] focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                />
              </div>

              <div className="pt-3 border-t border-[#F0E4EB] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsFormModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#F0E4EB] bg-white hover:bg-[#FAF6F8] text-[#1E120D] font-bold transition cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#8E1057] hover:bg-[#750D48] text-white font-bold shadow-xs transition cursor-pointer"
                >
                  {editingActivity ? 'Salvar Alterações' : 'Registrar Atividade'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: CONSULTAR ATIVIDADE & ACOMPANHAR HISTÓRICO */}
      {consultingActivity && (
        <div className="fixed inset-0 bg-[#1E120D]/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full shadow-2xl border border-[#F0E4EB] flex flex-col max-h-[90vh] overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-[#F0E4EB] bg-[#FAF6F8] flex items-start justify-between gap-4">
              <div>
                <div className="text-[11px] font-bold text-[#8E1057] mb-0.5">
                  {consultingActivity.farmName} ({consultingActivity.farmCode}) · {consultingActivity.sector} · {consultingActivity.parcelCode}
                </div>
                <h3 className="text-lg font-extrabold text-[#1E120D]">
                  {consultingActivity.activityType}
                </h3>
                <div className="mt-1 flex flex-wrap items-center gap-3 text-xs text-[#1E120D]/70">
                  <span className="inline-flex items-center gap-1 font-mono tabular-nums">
                    <Calendar className="w-3.5 h-3.5 text-[#8E1057]" />
                    {formatDateBr(consultingActivity.executionDate)}
                  </span>
                  <span aria-hidden="true">·</span>
                  {renderStatusIndicator(consultingActivity.status)}
                </div>
              </div>

              <button
                type="button"
                onClick={() => setConsultingActivityId(null)}
                className="p-1.5 rounded-lg text-[#1E120D]/50 hover:text-[#1E120D] hover:bg-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto space-y-5 text-xs">
              {/* Detalhes Principais */}
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 bg-[#FAF6F8] p-4 rounded-xl border border-[#F0E4EB]">
                <div>
                  <span className="text-[10px] font-semibold text-[#1E120D]/60 block">Responsável</span>
                  <span className="font-bold text-[#1E120D] flex items-center gap-1 mt-0.5">
                    <UserCheck className="w-3.5 h-3.5 text-[#8E1057] shrink-0" />
                    {consultingActivity.supervisor}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-[#1E120D]/60 block">Equipe envolvida</span>
                  <span className="font-bold text-[#1E120D] mt-0.5 block">{consultingActivity.teamName}</span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-[#1E120D]/60 block">Qtd. de pessoas</span>
                  <span className="font-bold text-[#1E120D] tabular-nums flex items-center gap-1 mt-0.5">
                    <Users className="w-3.5 h-3.5 text-[#8E1057] shrink-0" />
                    {consultingActivity.peopleCount}
                  </span>
                </div>
                <div>
                  <span className="text-[10px] font-semibold text-[#1E120D]/60 block">Horas trabalhadas</span>
                  <span className="font-black text-[#8E1057] tabular-nums mt-0.5 block">
                    {consultingActivity.hoursWorked.toLocaleString('pt-BR', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} h
                  </span>
                </div>
              </div>

              {/* Descrição & Observações */}
              <div className="space-y-3">
                <div>
                  <h4 className="font-bold text-[#1E120D] flex items-center gap-1.5 mb-1">
                    <FileText className="w-3.5 h-3.5 text-[#8E1057]" />
                    <span>Descrição do Serviço</span>
                  </h4>
                  <p className="text-[#1E120D]/85 leading-relaxed bg-[#FAF6F8] p-3 rounded-xl border border-[#F0E4EB]">
                    {consultingActivity.serviceDescription}
                  </p>
                </div>

                {consultingActivity.observations && (
                  <div>
                    <h4 className="font-bold text-[#1E120D] mb-1">Observações</h4>
                    <p className="text-[#1E120D]/80 whitespace-pre-line leading-relaxed bg-[#FAF6F8] p-3 rounded-xl border border-[#F0E4EB]">
                      {consultingActivity.observations}
                    </p>
                  </div>
                )}
              </div>

              {/* Acompanhamento Rápido de Status */}
              {canEdit && (
                <div className="p-3.5 rounded-xl border border-[#F0E4EB] bg-white space-y-2.5">
                  <div className="font-bold text-[#1E120D]">Atualizar Status da Atividade</div>
                  <div className="flex flex-col sm:flex-row gap-2">
                    <input
                      type="text"
                      value={quickStatusNote}
                      onChange={e => setQuickStatusNote(e.target.value)}
                      placeholder="Nota de acompanhamento (opcional)..."
                      className="flex-1 px-3 py-1.5 rounded-lg bg-[#FAF6F8] border border-[#F0E4EB] text-xs"
                    />
                    <div className="flex items-center gap-1.5">
                      {(['Pendente', 'Em andamento', 'Concluída'] as ActivityStatus[]).map(st => (
                        <button
                          key={st}
                          type="button"
                          onClick={() => {
                            updateActivityStatus(consultingActivity.id, st, quickStatusNote.trim() || undefined);
                            setQuickStatusNote('');
                          }}
                          className={`px-2.5 py-1.5 rounded-lg text-[11px] font-bold border transition whitespace-nowrap shrink-0 cursor-pointer ${
                            consultingActivity.status === st
                              ? 'bg-[#8E1057] text-white border-[#8E1057]'
                              : 'bg-[#FAF6F8] text-[#1E120D] border-[#F0E4EB] hover:bg-[#F0E4EB]'
                          }`}
                        >
                          {st}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Histórico Completo da Atividade */}
              <div className="space-y-2.5 pt-2 border-t border-[#F0E4EB]">
                <h4 className="font-bold text-[#1E120D] flex items-center gap-1.5">
                  <History className="w-4 h-4 text-[#8E1057]" />
                  <span>Histórico da Atividade ({consultingActivity.history?.length || 0} registro(s))</span>
                </h4>

                <div className="space-y-2">
                  {(consultingActivity.history || [])
                    .slice()
                    .reverse()
                    .map(entry => (
                      <div
                        key={entry.id}
                        className="p-3 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] flex flex-col gap-1"
                      >
                        <div className="flex flex-wrap items-center justify-between gap-2 text-[11px]">
                          <span className="font-bold text-[#8E1057]">{entry.action}</span>
                          <span className="font-mono tabular-nums text-[#1E120D]/55">
                            {new Date(entry.timestamp).toLocaleString('pt-BR')}
                          </span>
                        </div>
                        <p className="text-[#1E120D]/85">{entry.summary}</p>
                        <span className="text-[10px] text-[#1E120D]/55">
                          Registrado por: <strong>{entry.userName}</strong> ({entry.userRole})
                        </span>
                      </div>
                    ))}
                </div>
              </div>
            </div>

            <div className="px-6 py-3.5 border-t border-[#F0E4EB] bg-[#FAF6F8] flex flex-wrap items-center justify-between gap-2">
              <div className="flex items-center gap-2">
                {canEdit && (
                  <button
                    type="button"
                    onClick={() => {
                      const target = consultingActivity;
                      setConsultingActivityId(null);
                      handleOpenEditModal(target);
                    }}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-[#F0E4EB] border border-[#F0E4EB] text-[#8E1057] font-bold text-xs transition cursor-pointer"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                    <span>Editar Atividade</span>
                  </button>
                )}

                {canDelete && (
                  <button
                    type="button"
                    onClick={() => setDeletingActivity(consultingActivity)}
                    className="inline-flex items-center gap-1.5 px-3.5 py-2 rounded-xl bg-white hover:bg-red-50 border border-red-200 text-red-700 font-bold text-xs transition cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Excluir</span>
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setConsultingActivityId(null)}
                className="px-4 py-2 rounded-xl bg-[#8E1057] hover:bg-[#750D48] text-white font-bold text-xs transition cursor-pointer"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: CONFIRMAÇÃO DE EXCLUSÃO DE ATIVIDADE */}
      {deletingActivity && (
        <div className="fixed inset-0 bg-[#1E120D]/65 z-[60] flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-[#F0E4EB] overflow-hidden animate-scale-up">
            <div className="px-5 py-4 border-b border-red-100 bg-red-50 flex items-center gap-3 text-red-900">
              <div className="p-2 rounded-xl bg-red-100 text-red-700 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-extrabold text-sm">Confirmar Exclusão de Atividade</h3>
                <p className="text-[11px] text-red-700">Esta ação removerá permanentemente o registro do banco de dados.</p>
              </div>
            </div>

            <div className="p-5 space-y-3 text-xs text-[#1E120D]">
              <p>Deseja realmente excluir a atividade abaixo?</p>
              <div className="p-3.5 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] space-y-1">
                <div className="font-bold text-[#8E1057]">
                  {deletingActivity.activityType}
                </div>
                <div className="font-semibold">
                  {deletingActivity.farmName} ({deletingActivity.farmCode}) · {deletingActivity.sector} · {deletingActivity.parcelCode}
                </div>
                <div className="text-[11px] text-[#1E120D]/70">
                  Data: {formatDateBr(deletingActivity.executionDate)} · Responsável: {deletingActivity.supervisor} · {deletingActivity.hoursWorked}h
                </div>
              </div>
            </div>

            <div className="px-5 py-3.5 border-t border-[#F0E4EB] bg-[#FAF6F8] flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingActivity(null)}
                className="px-4 py-2 rounded-xl border border-[#F0E4EB] bg-white hover:bg-stone-100 text-[#1E120D] font-bold text-xs transition cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDeleteActivity}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white font-bold text-xs transition shadow-xs cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>Confirmar Exclusão</span>
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: CADASTRO EDITÁVEL DE TIPOS DE ATIVIDADES */}
      {isTypesModalOpen && (
        <div className="fixed inset-0 bg-[#1E120D]/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full shadow-2xl border border-[#F0E4EB] flex flex-col max-h-[88vh] overflow-hidden animate-scale-up">
            <div className="px-6 py-4 border-b border-[#F0E4EB] bg-gradient-to-r from-[#4A072E] to-[#8E1057] text-white flex items-center justify-between">
              <div>
                <h3 className="text-base font-extrabold tracking-tight flex items-center gap-2">
                  <Tags className="w-4 h-4 text-pink-200" />
                  <span>Cadastro de Tipos de Atividades</span>
                </h3>
                <p className="text-[11px] text-pink-100/90 mt-0.5">
                  Adicione, edite ou ative/inative os tipos disponíveis para o setor de plasticultura.
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setIsTypesModalOpen(false);
                  setEditingTypeId(null);
                  setDeletingType(null);
                }}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {canCreate && (
              <div className="p-5 border-b border-[#F0E4EB] bg-[#FAF6F8]">
                <form onSubmit={handleAddActivityType} className="flex flex-col sm:flex-row gap-2">
                  <input
                    type="text"
                    value={newTypeName}
                    onChange={e => setNewTypeName(e.target.value)}
                    placeholder="Adicionar novo tipo de atividade..."
                    className="flex-1 px-3 py-2 rounded-xl bg-white border border-[#F0E4EB] text-xs text-[#1E120D] font-medium focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  />
                  <button
                    type="submit"
                    className="inline-flex items-center justify-center gap-1.5 px-4 py-2 rounded-xl bg-[#8E1057] hover:bg-[#750D48] text-white text-xs font-bold shadow-xs transition shrink-0 cursor-pointer"
                  >
                    <Plus className="w-4 h-4" />
                    <span>Adicionar Tipo</span>
                  </button>
                </form>
              </div>
            )}

            <div className="flex-1 overflow-y-auto p-5 space-y-2 text-xs">
              {activityTypes.map(typeItem => {
                const usageCount = activities.filter(
                  a => a.activityType.trim().toLowerCase() === typeItem.name.trim().toLowerCase()
                ).length;
                const isEditingThis = editingTypeId === typeItem.id;

                return (
                  <div
                    key={typeItem.id}
                    className={`p-3 rounded-xl border flex flex-wrap items-center justify-between gap-2 transition ${
                      typeItem.active
                        ? 'bg-white border-[#F0E4EB]'
                        : 'bg-stone-50 border-stone-200 opacity-75'
                    }`}
                  >
                    {isEditingThis ? (
                      <div className="flex-1 flex items-center gap-2">
                        <input
                          type="text"
                          value={editingTypeName}
                          onChange={e => setEditingTypeName(e.target.value)}
                          onKeyDown={e => {
                            if (e.key === 'Enter') handleSaveEditedType(typeItem);
                            if (e.key === 'Escape') setEditingTypeId(null);
                          }}
                          className="flex-1 px-2.5 py-1.5 rounded-lg border border-[#8E1057] text-xs font-semibold focus:outline-none"
                          autoFocus
                        />
                        <button
                          type="button"
                          onClick={() => handleSaveEditedType(typeItem)}
                          className="p-1.5 rounded-lg bg-[#8E1057] text-white hover:bg-[#750D48] transition cursor-pointer"
                          title="Salvar nome"
                        >
                          <Check className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingTypeId(null)}
                          className="p-1.5 rounded-lg bg-stone-100 text-stone-700 hover:bg-stone-200 transition cursor-pointer"
                          title="Cancelar edição"
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-2 min-w-0">
                          <span className={`font-bold ${typeItem.active ? 'text-[#1E120D]' : 'text-stone-500 line-through'}`}>
                            {typeItem.name}
                          </span>
                          <span className="text-[10px] text-[#1E120D]/55 tabular-nums">
                            ({usageCount} {usageCount === 1 ? 'registro' : 'registros'})
                          </span>
                          {!typeItem.active && (
                            <span className="text-[10px] font-bold text-amber-700">Inativo</span>
                          )}
                        </div>

                        <div className="flex items-center gap-1">
                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => {
                                setEditingTypeId(typeItem.id);
                                setEditingTypeName(typeItem.name);
                              }}
                              className="p-1.5 rounded-lg text-[#1E120D]/60 hover:text-[#8E1057] hover:bg-[#FAF6F8] transition cursor-pointer"
                              title="Editar nome do tipo"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canEdit && (
                            <button
                              type="button"
                              onClick={() => handleToggleTypeActive(typeItem)}
                              className={`p-1.5 rounded-lg transition cursor-pointer ${
                                typeItem.active
                                  ? 'text-emerald-700 hover:bg-emerald-50'
                                  : 'text-amber-700 hover:bg-amber-50'
                              }`}
                              title={typeItem.active ? 'Inativar tipo' : 'Reativar tipo'}
                            >
                              <Power className="w-3.5 h-3.5" />
                            </button>
                          )}

                          {canDelete && (
                            <button
                              type="button"
                              onClick={() => setDeletingType(typeItem)}
                              className="p-1.5 rounded-lg text-[#1E120D]/55 hover:text-red-700 hover:bg-red-50 transition cursor-pointer"
                              title="Excluir tipo de atividade"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </>
                    )}
                  </div>
                );
              })}
            </div>

            {deletingType && (
              <div className="mx-5 mb-4 p-3.5 rounded-xl bg-red-50 border border-red-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-red-900">
                <span>
                  Confirmar exclusão do tipo <strong>{deletingType.name}</strong>?
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setDeletingType(null)}
                    className="px-3 py-1 rounded-lg bg-white border border-red-200 text-red-900 font-semibold cursor-pointer"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={handleConfirmDeleteType}
                    className="px-3 py-1 rounded-lg bg-red-600 text-white font-bold cursor-pointer"
                  >
                    Excluir
                  </button>
                </div>
              </div>
            )}

            <div className="px-6 py-3.5 border-t border-[#F0E4EB] bg-[#FAF6F8] flex justify-end">
              <button
                type="button"
                onClick={() => {
                  setIsTypesModalOpen(false);
                  setEditingTypeId(null);
                  setDeletingType(null);
                }}
                className="px-4 py-2 rounded-xl bg-[#8E1057] hover:bg-[#750D48] text-white font-bold text-xs transition cursor-pointer"
              >
                Concluir
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
