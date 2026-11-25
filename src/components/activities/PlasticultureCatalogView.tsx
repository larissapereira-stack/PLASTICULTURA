import React, { useMemo, useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PlasticultureCatalogCategory, PlasticultureCatalogItem } from '../../types';
import {
  AlertTriangle,
  Building2,
  Check,
  Edit3,
  Layers,
  MapPin,
  Plus,
  Power,
  RotateCcw,
  Search,
  Sprout,
  Tags,
  Trash2,
  UserCheck,
  Users,
  X
} from 'lucide-react';

interface CategoryMeta {
  id: PlasticultureCatalogCategory;
  label: string;
  singular: string;
  description: string;
  icon: React.ReactNode;
}

const CATEGORIES: CategoryMeta[] = [
  {
    id: 'SUPERVISOR',
    label: 'Supervisores',
    singular: 'Supervisor',
    description: 'Defina em quais fazendas cada supervisor ficará disponível na aba Atividades de Plasticultura.',
    icon: <UserCheck className="w-4 h-4" />
  },
  {
    id: 'RESPONSAVEL',
    label: 'Responsáveis',
    singular: 'Responsável',
    description: 'Cadastre responsáveis pela execução e vincule às fazendas autorizadas.',
    icon: <Users className="w-4 h-4" />
  },
  {
    id: 'SETOR',
    label: 'Setores',
    singular: 'Setor',
    description: 'Gerencie os setores utilizados nos formulários e filtros por fazenda.',
    icon: <Layers className="w-4 h-4" />
  },
  {
    id: 'PARCELA',
    label: 'Parcelas',
    singular: 'Parcela',
    description: 'Cadastre parcelas com setor, variedade, área (ha) e vínculo específico por fazenda.',
    icon: <MapPin className="w-4 h-4" />
  },
  {
    id: 'VARIEDADE',
    label: 'Variedades',
    singular: 'Variedade',
    description: 'Configure em quais fazendas cada variedade de uva aparece para seleção.',
    icon: <Sprout className="w-4 h-4" />
  },
  {
    id: 'ATIVIDADE',
    label: 'Atividades',
    singular: 'Tipo de Atividade',
    description: 'Gerencie as opções do campo Atividade e em quais fazendas cada uma fica visível.',
    icon: <Tags className="w-4 h-4" />
  }
];

function normalizeText(value?: string): string {
  return (value || '')
    .trim()
    .toLowerCase()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '');
}

interface PlasticultureCatalogViewProps {
  onNavigateToActivities?: () => void;
}

export const PlasticultureCatalogView: React.FC<PlasticultureCatalogViewProps> = ({
  onNavigateToActivities
}) => {
  const {
    farms,
    plasticultureCatalogItems,
    savePlasticultureCatalogItem,
    deletePlasticultureCatalogItem,
    hasPermission,
    showToast
  } = useApp();

  const canCreate = hasPermission('create_records') && hasPermission('access_catalogs');
  const canEdit = hasPermission('edit_records') && hasPermission('access_catalogs');
  const canDelete = hasPermission('delete_records') && hasPermission('access_catalogs');

  const [activeCategory, setActiveCategory] = useState<PlasticultureCatalogCategory>('SUPERVISOR');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFarmId, setFilterFarmId] = useState<string>('all');
  const [filterActive, setFilterActive] = useState<'ALL' | 'ACTIVE' | 'INACTIVE'>('ALL');

  // Modais
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<PlasticultureCatalogItem | null>(null);
  const [deletingItem, setDeletingItem] = useState<PlasticultureCatalogItem | null>(null);

  // Form state
  const [formCategory, setFormCategory] = useState<PlasticultureCatalogCategory>('SUPERVISOR');
  const [formName, setFormName] = useState('');
  const [formFarmIds, setFormFarmIds] = useState<string[]>(farms[0] ? [farms[0].id] : []);
  const [formActive, setFormActive] = useState(true);
  const [formSectorName, setFormSectorName] = useState('');
  const [formVarietyName, setFormVarietyName] = useState('');
  const [formSupervisorName, setFormSupervisorName] = useState('');
  const [formAreaHa, setFormAreaHa] = useState('');
  const [formNotes, setFormNotes] = useState('');

  const categoryCounts = useMemo(() => {
    const counts: Record<PlasticultureCatalogCategory, number> = {
      SUPERVISOR: 0,
      RESPONSAVEL: 0,
      SETOR: 0,
      PARCELA: 0,
      VARIEDADE: 0,
      ATIVIDADE: 0
    };
    plasticultureCatalogItems.forEach(item => {
      counts[item.category] = (counts[item.category] || 0) + 1;
    });
    return counts;
  }, [plasticultureCatalogItems]);

  const activeCategoryMeta = useMemo(
    () => CATEGORIES.find(c => c.id === activeCategory) || CATEGORIES[0],
    [activeCategory]
  );

  const filteredItems = useMemo(() => {
    const term = normalizeText(searchTerm);
    return plasticultureCatalogItems
      .filter(item => {
        if (item.category !== activeCategory) return false;
        if (filterFarmId !== 'all' && !item.farmIds.includes(filterFarmId)) return false;
        if (filterActive === 'ACTIVE' && !item.active) return false;
        if (filterActive === 'INACTIVE' && item.active) return false;
        if (term) {
          const hay = normalizeText(
            `${item.name} ${item.sectorName || ''} ${item.varietyName || ''} ${item.supervisorName || ''} ${item.notes || ''}`
          );
          if (!hay.includes(term)) return false;
        }
        return true;
      })
      .sort((a, b) => a.name.localeCompare(b.name, 'pt-BR', { numeric: true }));
  }, [plasticultureCatalogItems, activeCategory, filterFarmId, filterActive, searchTerm]);

  const openCreateModal = () => {
    setEditingItem(null);
    setFormCategory(activeCategory);
    setFormName('');
    setFormFarmIds(filterFarmId !== 'all' ? [filterFarmId] : farms[0] ? [farms[0].id] : []);
    setFormActive(true);
    setFormSectorName('');
    setFormVarietyName('');
    setFormSupervisorName('');
    setFormAreaHa('');
    setFormNotes('');
    setIsModalOpen(true);
  };

  const openEditModal = (item: PlasticultureCatalogItem) => {
    setEditingItem(item);
    setFormCategory(item.category);
    setFormName(item.name);
    setFormFarmIds([...item.farmIds]);
    setFormActive(item.active);
    setFormSectorName(item.sectorName || '');
    setFormVarietyName(item.varietyName || '');
    setFormSupervisorName(item.supervisorName || '');
    setFormAreaHa(item.areaHa !== undefined ? String(item.areaHa) : '');
    setFormNotes(item.notes || '');
    setIsModalOpen(true);
  };

  const toggleFormFarm = (farmId: string) => {
    setFormFarmIds(prev =>
      prev.includes(farmId) ? prev.filter(id => id !== farmId) : [...prev, farmId]
    );
  };

  const handleQuickToggleFarm = (item: PlasticultureCatalogItem, farmId: string) => {
    const isLinked = item.farmIds.includes(farmId);
    if (isLinked && item.farmIds.length === 1) {
      showToast(
        'warning',
        'Vínculo Obrigatório',
        `Mantenha "${item.name}" vinculado a pelo menos uma fazenda (ou clique em Inativar).`
      );
      return;
    }

    const updatedFarmIds = isLinked
      ? item.farmIds.filter(id => id !== farmId)
      : [...item.farmIds, farmId];

    savePlasticultureCatalogItem({
      ...item,
      farmIds: updatedFarmIds
    });
  };

  const handleQuickToggleActive = (item: PlasticultureCatalogItem) => {
    savePlasticultureCatalogItem({
      ...item,
      active: !item.active
    });
  };

  const handleSubmitForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formName.trim()) {
      showToast('error', 'Nome Obrigatório', 'Informe o nome do item para salvar.');
      return;
    }

    if (formFarmIds.length === 0) {
      showToast('error', 'Fazenda Obrigatória', 'Selecione pelo menos uma fazenda vinculada.');
      return;
    }

    // Evitar duplicidade na mesma categoria (exceto PARCELA com setores/variedades diferentes)
    const cleanNorm = normalizeText(formName);
    const duplicate = plasticultureCatalogItems.find(existing => {
      if (existing.id === editingItem?.id) return false;
      if (existing.category !== formCategory) return false;
      if (formCategory === 'PARCELA') {
        return (
          normalizeText(existing.name) === cleanNorm &&
          normalizeText(existing.sectorName) === normalizeText(formSectorName) &&
          normalizeText(existing.varietyName) === normalizeText(formVarietyName)
        );
      }
      if (formCategory === 'SETOR') {
        return (
          normalizeText(existing.name) === cleanNorm &&
          existing.farmIds.some(fid => formFarmIds.includes(fid))
        );
      }
      return normalizeText(existing.name) === cleanNorm;
    });

    if (duplicate) {
      showToast(
        'error',
        'Item já cadastrado',
        `Já existe "${duplicate.name}" nessa categoria. Edite o registro existente para alterar as fazendas vinculadas.`
      );
      return;
    }

    const parsedArea = formAreaHa.trim() ? parseFloat(formAreaHa.replace(',', '.')) : undefined;
    if (parsedArea !== undefined && (Number.isNaN(parsedArea) || parsedArea < 0)) {
      showToast('error', 'Área Inválida', 'Informe um valor válido em hectares (ha).');
      return;
    }

    const payload: PlasticultureCatalogItem = {
      id: editingItem
        ? editingItem.id
        : `pcat-${formCategory.toLowerCase()}-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      category: formCategory,
      name: formName.trim(),
      farmIds: formFarmIds,
      active: formActive,
      sectorName: formSectorName.trim() || undefined,
      varietyName: formVarietyName.trim() || undefined,
      supervisorName: formSupervisorName.trim() || undefined,
      areaHa: parsedArea !== undefined ? Number(parsedArea.toFixed(2)) : undefined,
      notes: formNotes.trim() || undefined,
      isSystemDefault: editingItem?.isSystemDefault,
      createdAt: editingItem?.createdAt || new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    const res = savePlasticultureCatalogItem(payload);
    if (res.success) {
      setActiveCategory(formCategory);
      setIsModalOpen(false);
      setEditingItem(null);
    }
  };

  const handleConfirmDelete = () => {
    if (!deletingItem) return;
    const res = deletePlasticultureCatalogItem(deletingItem.id);
    if (res.success) {
      setDeletingItem(null);
    }
  };

  const hasFilters = searchTerm.trim() !== '' || filterFarmId !== 'all' || filterActive !== 'ALL';

  return (
    <div className="space-y-5">
      {/* Cabeçalho */}
      <div className="bg-white border border-[#F0E4EB] rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center lg:justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-semibold text-[#8E1057] mb-1">
            <Building2 className="w-4 h-4" />
            <span>Cadastro de Itens · Vínculo Direto por Fazenda</span>
          </div>
          <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E120D] tracking-tight">
            Cadastros de Plasticultura
          </h2>
          <p className="text-xs text-[#1E120D]/65 mt-0.5 max-w-3xl">
            Cadastre supervisores, responsáveis, setores, parcelas, variedades e atividades, sinalizando exatamente em qual(is) fazenda(s) cada item deve aparecer na aba <strong>Atividades de Plasticultura</strong>.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0">
          {onNavigateToActivities && (
            <button
              type="button"
              onClick={onNavigateToActivities}
              className="inline-flex items-center gap-2 px-3.5 py-2 bg-[#FAF6F8] hover:bg-[#F0E4EB] text-[#1E120D] border border-[#F0E4EB] rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <span>Ir para Atividades de Plasticultura</span>
            </button>
          )}
          {canCreate && (
            <button
              type="button"
              onClick={openCreateModal}
              className="inline-flex items-center gap-2 px-4 py-2 bg-[#8E1057] hover:bg-[#750D48] text-white rounded-xl text-xs sm:text-sm font-bold shadow-xs transition whitespace-nowrap shrink-0 cursor-pointer"
            >
              <Plus className="w-4 h-4" />
              <span>Novo {activeCategoryMeta.singular}</span>
            </button>
          )}
        </div>
      </div>

      {/* Abas de Categorias */}
      <div className="bg-white border border-[#F0E4EB] rounded-2xl p-3 shadow-xs">
        <div className="flex flex-wrap gap-1.5">
          {CATEGORIES.map(cat => {
            const isActive = activeCategory === cat.id;
            return (
              <button
                key={cat.id}
                type="button"
                onClick={() => {
                  setActiveCategory(cat.id);
                  setSearchTerm('');
                }}
                className={`inline-flex items-center gap-2 px-3.5 py-2 rounded-xl text-xs font-bold transition whitespace-nowrap shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-[#8E1057] text-white shadow-xs'
                    : 'bg-[#FAF6F8] text-[#1E120D]/75 hover:bg-[#F0E4EB] hover:text-[#1E120D]'
                }`}
              >
                {cat.icon}
                <span>{cat.label}</span>
                <span
                  className={`text-[10px] px-1.5 py-0.5 rounded font-bold tabular-nums ${
                    isActive ? 'bg-white/20 text-white' : 'bg-white text-[#8E1057] border border-[#F0E4EB]'
                  }`}
                >
                  {categoryCounts[cat.id]}
                </span>
              </button>
            );
          })}
        </div>
        <p className="text-xs text-[#1E120D]/60 mt-2.5 px-1">
          {activeCategoryMeta.description}
        </p>
      </div>

      {/* Filtros */}
      <div className="bg-white border border-[#F0E4EB] rounded-2xl p-4 shadow-xs grid grid-cols-1 sm:grid-cols-4 gap-3">
        <div className="relative sm:col-span-2">
          <Search className="w-4 h-4 text-[#1E120D]/40 absolute left-3 top-1/2 -translate-y-1/2 pointer-events-none" />
          <input
            type="text"
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            placeholder={`Buscar em ${activeCategoryMeta.label.toLowerCase()}...`}
            className="w-full pl-9 pr-3 py-2 text-xs bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl focus:outline-none focus:ring-2 focus:ring-[#D65F95]/40 focus:border-[#8E1057]"
          />
        </div>

        <select
          value={filterFarmId}
          onChange={e => setFilterFarmId(e.target.value)}
          aria-label="Filtrar por fazenda vinculada"
          className="px-3 py-2 text-xs bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl focus:outline-none focus:border-[#8E1057]"
        >
          <option value="all">Todas as Fazendas</option>
          {farms.map(f => (
            <option key={f.id} value={f.id}>
              Vinculados a {f.name} ({f.code})
            </option>
          ))}
        </select>

        <div className="flex items-center gap-2">
          <select
            value={filterActive}
            onChange={e => setFilterActive(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE')}
            aria-label="Filtrar por situação"
            className="w-full px-3 py-2 text-xs bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl focus:outline-none focus:border-[#8E1057]"
          >
            <option value="ALL">Ativos e Inativos</option>
            <option value="ACTIVE">Somente Ativos</option>
            <option value="INACTIVE">Somente Inativos</option>
          </select>

          {hasFilters && (
            <button
              type="button"
              onClick={() => {
                setSearchTerm('');
                setFilterFarmId('all');
                setFilterActive('ALL');
              }}
              title="Limpar filtros"
              className="p-2 rounded-xl border border-[#F0E4EB] bg-[#FAF6F8] text-[#8E1057] hover:bg-[#F0E4EB] cursor-pointer shrink-0"
            >
              <RotateCcw className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Tabela de Itens e Vínculo Rápido por Fazenda */}
      <div className="bg-white border border-[#F0E4EB] rounded-2xl shadow-xs overflow-hidden">
        <div className="px-4 py-3 border-b border-[#F0E4EB] bg-[#FAF6F8] flex flex-wrap items-center justify-between gap-2 text-xs">
          <span className="font-bold text-[#1E120D]">
            {filteredItems.length} {activeCategoryMeta.label.toLowerCase()} exibido(s)
          </span>
          <span className="text-[11px] text-[#1E120D]/60">
            Clique nas fazendas de cada linha para ativar ou remover o vínculo instantaneamente.
          </span>
        </div>

        {filteredItems.length === 0 ? (
          <div className="p-10 text-center space-y-3">
            <p className="text-sm font-bold text-[#1E120D]">
              Nenhum item encontrado em {activeCategoryMeta.label}
            </p>
            <p className="text-xs text-[#1E120D]/60">
              Ajuste os filtros ou cadastre um novo item vinculado às fazendas desejadas.
            </p>
            {canCreate && (
              <button
                type="button"
                onClick={openCreateModal}
                className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl bg-[#8E1057] hover:bg-[#750D48] text-white text-xs font-bold cursor-pointer"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Cadastrar {activeCategoryMeta.singular}</span>
              </button>
            )}
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="bg-[#FAF6F8] border-b border-[#F0E4EB] text-[11px] font-bold uppercase tracking-wider text-[#1E120D]/65">
                  <th className="py-3 px-4">{activeCategoryMeta.singular}</th>
                  {(activeCategory === 'PARCELA' || activeCategory === 'SETOR') && (
                    <th className="py-3 px-3">Detalhes Vinculados</th>
                  )}
                  <th className="py-3 px-3">Fazendas Vinculadas (Clique para alterar)</th>
                  <th className="py-3 px-3">Status</th>
                  <th className="py-3 px-4 text-right">Ações</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#F0E4EB] text-xs">
                {filteredItems.map(item => (
                  <tr key={item.id} className={`hover:bg-[#FAF6F8]/70 transition-colors ${!item.active ? 'opacity-60' : ''}`}>
                    <td className="py-3 px-4 align-middle">
                      <div className="font-bold text-[#1E120D]">
                        {item.name}
                      </div>
                      {item.notes && (
                        <div className="text-[11px] text-[#1E120D]/55 mt-0.5 max-w-xs truncate">
                          {item.notes}
                        </div>
                      )}
                    </td>

                    {(activeCategory === 'PARCELA' || activeCategory === 'SETOR') && (
                      <td className="py-3 px-3 align-middle text-[11px] text-[#1E120D]/75">
                        {[
                          item.sectorName ? `Setor: ${item.sectorName}` : null,
                          item.varietyName ? `Var.: ${item.varietyName}` : null,
                          item.areaHa !== undefined ? `${item.areaHa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ha` : null,
                          item.supervisorName ? `Sup.: ${item.supervisorName}` : null
                        ]
                          .filter(Boolean)
                          .join(' · ') || '—'}
                      </td>
                    )}

                    <td className="py-3 px-3 align-middle">
                      <div className="flex flex-wrap gap-1.5">
                        {farms.map(farm => {
                          const linked = item.farmIds.includes(farm.id);
                          return (
                            <button
                              key={farm.id}
                              type="button"
                              disabled={!canEdit}
                              onClick={() => handleQuickToggleFarm(item, farm.id)}
                              title={
                                !canEdit
                                  ? 'Somente leitura'
                                  : linked
                                    ? `Desvincular de ${farm.name}`
                                    : `Vincular a ${farm.name}`
                              }
                              className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border transition whitespace-nowrap shrink-0 disabled:opacity-75 disabled:cursor-not-allowed ${canEdit ? 'cursor-pointer' : ''} ${
                                linked
                                  ? 'bg-[#8E1057] text-white border-[#8E1057] shadow-xs'
                                  : 'bg-white text-[#1E120D]/45 border-[#F0E4EB] hover:border-[#D65F95] hover:text-[#8E1057]'
                              }`}
                            >
                              {linked && <Check className="w-3 h-3" />}
                              <span>{farm.name} ({farm.code})</span>
                            </button>
                          );
                        })}
                      </div>
                    </td>

                    <td className="py-3 px-3 align-middle">
                      <button
                        type="button"
                        disabled={!canEdit}
                        onClick={() => handleQuickToggleActive(item)}
                        className={`inline-flex items-center gap-1 px-2.5 py-1 rounded-lg text-[11px] font-bold border whitespace-nowrap shrink-0 disabled:opacity-75 disabled:cursor-not-allowed ${canEdit ? 'cursor-pointer' : ''} ${
                          item.active
                            ? 'bg-emerald-50 text-emerald-800 border-emerald-200'
                            : 'bg-stone-100 text-stone-600 border-stone-200'
                        }`}
                      >
                        <Power className="w-3 h-3" />
                        <span>{item.active ? 'Ativo' : 'Inativo'}</span>
                      </button>
                    </td>

                    <td className="py-3 px-4 align-middle text-right">
                      <div className="inline-flex items-center gap-1">
                        {canEdit && (
                          <button
                            type="button"
                            onClick={() => openEditModal(item)}
                            title="Editar item e vínculos"
                            className="p-1.5 rounded-lg text-[#1E120D]/65 hover:text-[#8E1057] hover:bg-[#FAF6F8] cursor-pointer"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>
                        )}
                        {canDelete && !item.isSystemDefault && (
                          <button
                            type="button"
                            onClick={() => setDeletingItem(item)}
                            title="Excluir item"
                            className="p-1.5 rounded-lg text-[#1E120D]/65 hover:text-rose-700 hover:bg-rose-50 cursor-pointer"
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

      {/* Modal Cadastro / Edição */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-[#1E120D]/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full max-h-[90vh] flex flex-col shadow-2xl border border-[#F0E4EB]">
            <div className="flex items-center justify-between px-6 py-4 border-b border-[#F0E4EB]">
              <div>
                <h3 className="text-base font-extrabold text-[#1E120D]">
                  {editingItem ? 'Editar Item Cadastrado' : `Cadastrar ${activeCategoryMeta.singular}`}
                </h3>
                <p className="text-xs text-[#1E120D]/60 mt-0.5">
                  Sinalize exatamente em quais fazendas este item deve aparecer.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsModalOpen(false)}
                className="p-1.5 rounded-lg text-[#1E120D]/40 hover:text-[#1E120D] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="p-6 overflow-y-auto space-y-4 text-xs">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Categoria *</label>
                  <select
                    value={formCategory}
                    onChange={e => setFormCategory(e.target.value as PlasticultureCatalogCategory)}
                    disabled={Boolean(editingItem)}
                    className="w-full px-3 py-2 bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl disabled:opacity-60"
                  >
                    {CATEGORIES.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.label}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Nome *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={e => setFormName(e.target.value)}
                    disabled={Boolean(editingItem?.isSystemDefault)}
                    placeholder={`Nome do(a) ${CATEGORIES.find(c => c.id === formCategory)?.singular.toLowerCase()}`}
                    required
                    className="w-full px-3 py-2 bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl focus:outline-none focus:border-[#8E1057] disabled:opacity-60"
                  />
                </div>
              </div>

              {/* Fazendas Vinculadas */}
              <div className="p-4 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] space-y-2.5">
                <div className="flex items-center justify-between gap-2">
                  <label className="font-bold text-[#1E120D]">
                    Fazendas Vinculadas * <span className="font-normal text-[#1E120D]/60">(onde este item aparece)</span>
                  </label>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => setFormFarmIds(farms.map(f => f.id))}
                      className="text-[11px] font-bold text-[#8E1057] hover:underline cursor-pointer"
                    >
                      Todas
                    </button>
                    <span className="text-[#1E120D]/30">·</span>
                    <button
                      type="button"
                      onClick={() => setFormFarmIds([])}
                      className="text-[11px] font-semibold text-[#1E120D]/60 hover:underline cursor-pointer"
                    >
                      Limpar
                    </button>
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {farms.map(farm => {
                    const checked = formFarmIds.includes(farm.id);
                    return (
                      <label
                        key={farm.id}
                        className={`flex items-center gap-2.5 p-2.5 rounded-xl border cursor-pointer transition ${
                          checked
                            ? 'bg-white border-[#8E1057] text-[#1E120D] font-bold shadow-xs'
                            : 'bg-white/60 border-[#F0E4EB] text-[#1E120D]/70'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => toggleFormFarm(farm.id)}
                          className="accent-[#8E1057] w-4 h-4 rounded"
                        />
                        <span>
                          {farm.name} ({farm.code})
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Metadados extras quando Parcela ou Setor */}
              {(formCategory === 'PARCELA' || formCategory === 'SETOR') && (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {formCategory === 'PARCELA' && (
                    <>
                      <div>
                        <label className="block font-bold text-[#1E120D] mb-1">Setor padrão (opcional)</label>
                        <input
                          type="text"
                          value={formSectorName}
                          onChange={e => setFormSectorName(e.target.value)}
                          placeholder="Ex: BRU 01"
                          className="w-full px-3 py-2 bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl"
                        />
                      </div>
                      <div>
                        <label className="block font-bold text-[#1E120D] mb-1">Variedade padrão (opcional)</label>
                        <input
                          type="text"
                          value={formVarietyName}
                          onChange={e => setFormVarietyName(e.target.value)}
                          placeholder="Ex: AUTUMN CRISP"
                          className="w-full px-3 py-2 bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl"
                        />
                      </div>
                    </>
                  )}
                  <div>
                    <label className="block font-bold text-[#1E120D] mb-1">Supervisor padrão (opcional)</label>
                    <input
                      type="text"
                      value={formSupervisorName}
                      onChange={e => setFormSupervisorName(e.target.value)}
                      placeholder="Ex: EDICARLOS"
                      className="w-full px-3 py-2 bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl"
                    />
                  </div>
                  <div>
                    <label className="block font-bold text-[#1E120D] mb-1">Área em ha (opcional)</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      value={formAreaHa}
                      onChange={e => setFormAreaHa(e.target.value)}
                      placeholder="Ex: 3.50"
                      className="w-full px-3 py-2 bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl tabular-nums"
                    />
                  </div>
                </div>
              )}

              <div>
                <label className="block font-bold text-[#1E120D] mb-1">Observações</label>
                <input
                  type="text"
                  value={formNotes}
                  onChange={e => setFormNotes(e.target.value)}
                  placeholder="Observação opcional sobre este cadastro..."
                  className="w-full px-3 py-2 bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl"
                />
              </div>

              <label className="inline-flex items-center gap-2 font-bold text-[#1E120D] cursor-pointer">
                <input
                  type="checkbox"
                  checked={formActive}
                  onChange={e => setFormActive(e.target.checked)}
                  className="accent-[#8E1057] w-4 h-4"
                />
                <span>Item ativo para seleção em Atividades de Plasticultura</span>
              </label>

              <div className="pt-3 border-t border-[#F0E4EB] flex items-center justify-end gap-2">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-[#F0E4EB] font-bold text-[#1E120D] hover:bg-[#FAF6F8] cursor-pointer"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-[#8E1057] hover:bg-[#750D48] text-white font-bold shadow-xs cursor-pointer"
                >
                  {editingItem ? 'Salvar Alterações' : 'Cadastrar Item'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal Exclusão */}
      {deletingItem && (
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
                  Deseja remover <strong>{deletingItem.name}</strong> do cadastro? Registros já salvos nas atividades existentes serão preservados.
                </p>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-end gap-2">
              <button
                type="button"
                onClick={() => setDeletingItem(null)}
                className="px-4 py-2 rounded-xl border border-[#F0E4EB] text-xs font-bold text-[#1E120D] hover:bg-[#FAF6F8] cursor-pointer"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={handleConfirmDelete}
                className="px-4 py-2 rounded-xl bg-rose-700 hover:bg-rose-800 text-white text-xs font-bold cursor-pointer"
              >
                Excluir Item
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
