import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Farm, Sector, Parcel, ParcelSituation, StructureStatus } from '../../types';
import { 
  Building2, 
  MapPin, 
  Layers, 
  Plus, 
  Edit3, 
  ChevronRight, 
  Info,
  CheckCircle2, 
  AlertTriangle, 
  X,
  Calendar,
  UserCheck,
  Sparkles,
  TreePine,
  Check,
  ShieldAlert,
  ArrowRight,
  Warehouse
} from 'lucide-react';

export const FarmsHierarchyView: React.FC = () => {
  const { 
    farms, 
    sectors, 
    parcels, 
    plastics,
    saveFarm, 
    saveSector, 
    saveParcel, 
    confirmParcelSituation,
    addCoverageToParcel,
    canPerform, 
    currentUser,
    filters 
  } = useApp();

  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms[0]?.id || '');
  const [selectedSectorName, setSelectedSectorName] = useState<string>('all');
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('all');
  const [selectedSituation, setSelectedSituation] = useState<string>('ALL');

  // Modals
  const [isFarmModalOpen, setIsFarmModalOpen] = useState(false);
  const [editingFarm, setEditingFarm] = useState<Farm | null>(null);

  const [isSectorModalOpen, setIsSectorModalOpen] = useState(false);
  const [editingSector, setEditingSector] = useState<Sector | null>(null);

  const [isParcelModalOpen, setIsParcelModalOpen] = useState(false);
  const [editingParcel, setEditingParcel] = useState<Parcel | null>(null);

  const [isConfirmModalOpen, setIsConfirmModalOpen] = useState(false);
  const [confirmingParcel, setConfirmingParcel] = useState<Parcel | null>(null);

  const [isAddCoverageModalOpen, setIsAddCoverageModalOpen] = useState(false);
  const [coverageTargetParcel, setCoverageTargetParcel] = useState<Parcel | null>(null);

  const currentFarm = farms.find(f => f.id === selectedFarmId) || farms[0];
  const farmSectors = sectors.filter(s => s.farmId === currentFarm?.id);

  // Filtered parcels for current farm
  const currentFarmParcels = parcels.filter(p => {
    if (p.farmId !== currentFarm?.id) return false;
    if (selectedSectorName !== 'all' && p.sector !== selectedSectorName) return false;
    if (selectedSupervisor !== 'all' && p.supervisor !== selectedSupervisor) return false;
    if (selectedSituation !== 'ALL' && p.situation !== selectedSituation) return false;
    if (filters.hasDuplicatesOnly && !p.hasDuplicateFlag) return false;
    return true;
  });

  const uniqueSupervisors = Array.from(
    new Set(parcels.filter(p => p.farmId === currentFarm?.id).map(p => p.supervisor).filter(Boolean))
  );

  const canEdit = canPerform('EDIT_MASTER');

  // Farm Submit
  const handleSaveFarmSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newFarm: Farm = {
      id: editingFarm ? editingFarm.id : `farm-${Date.now()}`,
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      location: formData.get('location') as string,
      totalHectares: parseFloat(formData.get('totalHectares') as string) || 0,
      serroplastHectares: parseFloat(formData.get('serroplastHectares') as string) || 0,
      manager: formData.get('manager') as string,
      contactPhone: formData.get('contactPhone') as string,
      createdAt: editingFarm ? editingFarm.createdAt : new Date().toISOString()
    };
    saveFarm(newFarm);
    setIsFarmModalOpen(false);
    setEditingFarm(null);
  };

  // Sector Submit
  const handleSaveSectorSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const newSector: Sector = {
      id: editingSector ? editingSector.id : `sec-${Date.now()}`,
      farmId: currentFarm.id,
      name: formData.get('name') as string,
      code: formData.get('code') as string,
      supervisorDefault: formData.get('supervisorDefault') as string,
      createdAt: editingSector ? editingSector.createdAt : new Date().toISOString()
    };
    saveSector(newSector);
    setIsSectorModalOpen(false);
    setEditingSector(null);
  };

  // Parcel Submit
  const handleSaveParcelSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newParcel: Parcel = {
      id: editingParcel ? editingParcel.id : `parc-${Date.now()}`,
      farmId: currentFarm.id,
      farmCode: currentFarm.code,
      farmName: currentFarm.name,
      sector: formData.get('sector') as string,
      parcelCode: formData.get('parcelCode') as string,
      supervisor: formData.get('supervisor') as string,
      variety: formData.get('variety') as string,
      hectares: parseFloat(formData.get('hectares') as string) || 0,
      situation: formData.get('situation') as ParcelSituation,
      structureStatus: (formData.get('structureStatus') as StructureStatus) || 'Pendente de confirmação',
      structureNotes: (formData.get('structureNotes') as string) || undefined,
      additionalInfo: formData.get('additionalInfo') as string,
      coverageHistory: editingParcel?.coverageHistory || [],
      currentPlasticType: editingParcel?.currentPlasticType,
      currentMetersCovered: editingParcel?.currentMetersCovered,
      source: editingParcel?.source || 'Cadastro Direto',
      createdAt: editingParcel ? editingParcel.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };
    saveParcel(newParcel);
    setIsParcelModalOpen(false);
    setEditingParcel(null);
  };

  // Confirm Situation Submit
  const handleConfirmSituationSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!confirmingParcel) return;
    const formData = new FormData(e.currentTarget);

    confirmParcelSituation({
      parcelId: confirmingParcel.id,
      situation: formData.get('situation') as ParcelSituation,
      structureStatus: (formData.get('structureStatus') as StructureStatus) || 'Pendente de confirmação',
      structureNotes: (formData.get('structureNotes') as string) || undefined,
      currentPlasticType: formData.get('currentPlasticType') as string,
      currentMetersCovered: parseFloat(formData.get('currentMetersCovered') as string) || undefined,
      notes: formData.get('notes') as string
    });

    setIsConfirmModalOpen(false);
    setConfirmingParcel(null);
  };

  // Add Coverage Submit
  const handleAddCoverageSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!coverageTargetParcel) return;
    const formData = new FormData(e.currentTarget);

    addCoverageToParcel({
      parcelId: coverageTargetParcel.id,
      coverageDate: formData.get('coverageDate') as string,
      plasticType: formData.get('plasticType') as string,
      metersInstalled: parseFloat(formData.get('metersInstalled') as string) || 0,
      isCurrentConfirmed: formData.get('isCurrentConfirmed') === 'true',
      responsible: formData.get('responsible') as string,
      notes: formData.get('notes') as string
    });

    setIsAddCoverageModalOpen(false);
    setCoverageTargetParcel(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#F0E4EB] shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#8E1057] uppercase tracking-wider mb-1">
            <TreePine className="w-4 h-4 text-[#D65F95]" />
            Estrutura Oficial de Áreas
          </div>
          <h2 className="text-xl font-extrabold text-[#1E120D] tracking-tight">
            Fazendas, Setores & Parcelas
          </h2>
          <p className="text-xs text-[#1E120D]/60 mt-0.5">
            Estrutura oficial: <strong>Fazenda &gt; Setor &gt; Parcela</strong> (com Supervisor, Variedade e Hectares).
          </p>
        </div>

        {canEdit && (
          <div className="flex items-center gap-2">
            <button
              onClick={() => {
                setEditingSector(null);
                setIsSectorModalOpen(true);
              }}
              className="flex items-center gap-1.5 text-xs font-bold bg-[#FAF6F8] hover:bg-pink-100/50 text-[#1E120D] px-3.5 py-2 rounded-xl border border-[#F0E4EB] transition"
            >
              <Plus className="w-4 h-4" />
              <span>Novo Setor</span>
            </button>
            <button
              onClick={() => {
                setEditingParcel(null);
                setIsParcelModalOpen(true);
              }}
              className="flex items-center gap-1.5 text-xs font-bold bg-[#8E1057] hover:bg-[#750D48] text-white px-3.5 py-2 rounded-xl transition shadow-xs"
            >
              <Plus className="w-4 h-4" />
              <span>Cadastrar Parcela</span>
            </button>
          </div>
        )}
      </div>

      {/* Farm Selector Cards */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
        {farms.map(farm => {
          const isSelected = farm.id === currentFarm?.id;
          const farmParcelsCount = parcels.filter(p => p.farmId === farm.id).length;
          const farmCoveredHa = parcels
            .filter(p => p.farmId === farm.id && p.situation === 'Coberta')
            .reduce((s, p) => s + p.hectares, 0);

          return (
            <div
              key={farm.id}
              onClick={() => {
                setSelectedFarmId(farm.id);
                setSelectedSectorName('all');
                setSelectedSupervisor('all');
              }}
              className={`
                cursor-pointer p-4 rounded-xl border transition-all text-left relative
                ${isSelected 
                  ? 'bg-gradient-to-br from-[#4A072E] to-[#5A0A37] text-white border-[#8E1057] shadow-md ring-2 ring-[#D65F95]/50' 
                  : 'bg-white text-[#1E120D] border-[#F0E4EB] hover:border-[#D65F95]/40 hover:bg-[#FAF6F8]'}
              `}
            >
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider ${
                  isSelected ? 'bg-[#3A0423] text-pink-200 border border-[#D65F95]/40' : 'bg-[#FAF6F8] text-[#8E1057]'
                }`}>
                  {farm.code}
                </span>

                {canEdit && isSelected && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setEditingFarm(farm);
                      setIsFarmModalOpen(true);
                    }}
                    className="p-1 rounded hover:bg-[#3A0423] text-pink-200 hover:text-white transition"
                    title="Editar Fazenda"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                )}
              </div>

              <h3 className="font-bold text-sm tracking-tight truncate">
                {farm.name}
              </h3>
              <p className={`text-xs mt-0.5 truncate ${isSelected ? 'text-[#FAF6F8]/80' : 'text-stone-500'}`}>
                {farm.location}
              </p>

              <div className={`mt-3 pt-2.5 border-t text-[11px] space-y-1 ${
                isSelected ? 'border-[#D65F95]/40 text-[#FAF6F8]/80' : 'border-[#F0E4EB] text-stone-600'
              }`}>
                <div className="flex items-center justify-between">
                  <span>{farmParcelsCount} parcelas</span>
                  <span className="font-bold">{farmCoveredHa.toFixed(1)} ha cob.</span>
                </div>
                {farm.serroplastHectares !== undefined && farm.serroplastHectares > 0 && (
                  <div className="flex items-center justify-between pt-1 border-t border-dashed border-current/20">
                    <span className={isSelected ? 'text-pink-200 font-semibold' : 'text-[#8E1057] font-semibold'}>
                      Serroplast:
                    </span>
                    <span className="font-black text-xs">
                      {farm.serroplastHectares.toFixed(2).replace('.', ',')} ha
                    </span>
                  </div>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Selected Farm Parcel Listing */}
      <div className="bg-white border border-stone-200 rounded-2xl p-5 shadow-xs space-y-4">
        {/* Sub-Filters */}
        <div className="flex flex-wrap items-center justify-between gap-3 pb-3 border-b border-stone-100">
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="font-semibold text-[#1E120D]/70 mr-1">Filtrar Setor:</span>
            <button
              onClick={() => setSelectedSectorName('all')}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                selectedSectorName === 'all' 
                  ? 'bg-[#8E1057] text-white font-semibold shadow-xs' 
                  : 'bg-[#FAF6F8] text-[#1E120D] hover:bg-pink-100/50'
              }`}
            >
              Todos ({farmSectors.length} Setores)
            </button>
            {farmSectors.map(sec => (
              <button
                key={sec.id}
                onClick={() => setSelectedSectorName(sec.name)}
                className={`px-3 py-1.5 rounded-lg font-medium transition ${
                  selectedSectorName === sec.name 
                    ? 'bg-[#8E1057] text-white font-semibold shadow-xs' 
                    : 'bg-[#FAF6F8] text-[#1E120D] hover:bg-pink-100/50'
                }`}
              >
                {sec.name}
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2 text-xs">
            <span className="text-[#1E120D]/60 font-medium">Situação:</span>
            <select
              value={selectedSituation}
              onChange={(e) => setSelectedSituation(e.target.value)}
              className="bg-[#FAF6F8] border border-[#F0E4EB] rounded-lg px-2.5 py-1 text-[#1E120D] font-semibold"
            >
              <option value="ALL">Todas</option>
              <option value="Coberta">Cobertas</option>
              <option value="Descoberta">Descobertas</option>
              <option value="A Confirmar">A Confirmar</option>
            </select>
          </div>
        </div>

        {/* Parcels Grid */}
        <div className="space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold uppercase tracking-wider text-[#1E120D]/70">
              Parcelas Registradas ({currentFarmParcels.length})
            </h4>
            <span className="text-xs text-[#1E120D]/60">
              Área Total: <strong className="text-[#1E120D]">{currentFarmParcels.reduce((s, p) => s + p.hectares, 0).toFixed(1)} ha</strong>
            </span>
          </div>

          {currentFarmParcels.length === 0 ? (
            <div className="p-8 text-center bg-[#FAF6F8] rounded-xl border border-dashed border-[#F0E4EB] text-[#1E120D]/60 text-xs">
              Nenhuma parcela cadastrada para os filtros selecionados nesta fazenda.
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentFarmParcels.map(parcel => {
                let situationBadge = (
                  <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF6F8] text-[#8E1057] border border-[#D65F95]/40">
                    COBERTA
                  </span>
                );
                if (parcel.situation === 'Descoberta') {
                  situationBadge = (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-[#1E120D]/80 border border-stone-200">
                      DESCOBERTA
                    </span>
                  );
                } else if (parcel.situation === 'A Confirmar') {
                  situationBadge = (
                    <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-900 border border-amber-300 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3 text-amber-700" />
                      A CONFIRMAR
                    </span>
                  );
                }

                return (
                  <div 
                    key={parcel.id}
                    className={`bg-white border rounded-2xl p-4 shadow-xs hover:border-[#D65F95]/50 transition-all flex flex-col justify-between space-y-3 relative group ${
                      parcel.hasDuplicateFlag ? 'border-amber-300 bg-amber-50/30' : 'border-[#F0E4EB]'
                    }`}
                  >
                    <div>
                      {/* Top Header of Parcel Card */}
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <div className="flex items-center gap-1.5">
                            <span className="px-2 py-0.5 rounded text-[10px] font-black bg-stone-900 text-white font-mono">
                              {parcel.parcelCode}
                            </span>
                            <span className="text-xs font-bold text-stone-800 truncate">
                              {parcel.sector}
                            </span>
                          </div>
                          <p className="text-[11px] text-stone-500 mt-0.5">
                            Supervisor: <strong className="text-stone-700">{parcel.supervisor}</strong>
                          </p>
                        </div>

                        <div className="flex items-center gap-1">
                          {situationBadge}
                          {canEdit && (
                            <button
                              onClick={() => {
                                setEditingParcel(parcel);
                                setIsParcelModalOpen(true);
                              }}
                              className="p-1 rounded text-stone-400 hover:text-[#8E1057] hover:bg-stone-100 transition"
                              title="Editar Parcela"
                            >
                              <Edit3 className="w-3.5 h-3.5" />
                            </button>
                          )}
                        </div>
                      </div>

                      {/* Alerta de Duplicidade Preservada Conforme Diretriz */}
                      {parcel.hasDuplicateFlag && (
                        <div className="mt-2.5 p-2 bg-amber-100/90 border border-amber-300 rounded-lg text-[10px] text-amber-900 font-semibold flex items-start gap-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                          <span>{parcel.duplicateNotes || 'Possível duplicidade preservada para conferência com o PDF oficial.'}</span>
                        </div>
                      )}

                      {/* Especificações Agronômicas */}
                      <div className="grid grid-cols-2 gap-2 mt-3 p-2.5 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs">
                        <div>
                          <span className="text-[10px] text-[#1E120D]/60 block uppercase font-medium">Variedade</span>
                          <strong className="text-[#1E120D] truncate block" title={parcel.variety}>
                            {parcel.variety}
                          </strong>
                        </div>
                        <div>
                          <span className="text-[10px] text-[#1E120D]/60 block uppercase font-medium">Área em Hectares</span>
                          <strong className="text-[#1E120D] font-black text-sm">
                            {parcel.hectares.toFixed(1)} ha
                          </strong>
                        </div>
                      </div>

                      {/* Plástico Atual, Estrutura Física (Independente) e Histórico */}
                      <div className="mt-2.5 text-xs space-y-1.5">
                        <div className="flex items-center justify-between text-[#1E120D]/70">
                          <span>Plasticultura:</span>
                          <strong className="text-[#1E120D] truncate max-w-[180px]" title={parcel.currentPlasticType}>
                            {parcel.currentPlasticType || 'Nenhum plástico ativo'}
                          </strong>
                        </div>

                        <div className="flex items-center justify-between text-[#1E120D]/70">
                          <span className="flex items-center gap-1">
                            <Warehouse className="w-3 h-3 text-[#8E1057]" />
                            Estrutura:
                          </span>
                          <span
                            className={`px-1.5 py-0.5 rounded text-[10px] font-bold border ${
                              parcel.structureStatus === 'Com Estrutura'
                                ? 'bg-[#FAF6F8] text-[#8E1057] border-[#D65F95]/40'
                                : parcel.structureStatus === 'Sem Estrutura'
                                  ? 'bg-stone-100 text-stone-700 border-stone-200'
                                  : 'bg-amber-50 text-amber-800 border-amber-200'
                            }`}
                          >
                            {parcel.structureStatus || 'Pendente de confirmação'}
                          </span>
                        </div>

                        {parcel.currentMetersCovered ? (
                          <div className="flex items-center justify-between text-[11px] text-[#1E120D]/60">
                            <span>Metragem Coberta:</span>
                            <span>{parcel.currentMetersCovered.toLocaleString('pt-BR')} metros</span>
                          </div>
                        ) : null}

                        {/* Contagem de Coberturas Registradas */}
                        <div className="flex items-center justify-between text-[11px] text-[#1E120D]/60 pt-1 border-t border-[#F0E4EB]">
                          <span>Histórico de Coberturas:</span>
                          <span className="font-semibold text-[#1E120D]/80">{parcel.coverageHistory?.length || 0} registro(s)</span>
                        </div>
                      </div>
                    </div>

                    {/* Footer Actions: Confirm Situation and Add Coverage */}
                    <div className="pt-2 border-t border-[#F0E4EB] flex items-center justify-between gap-2">
                      <button
                        onClick={() => {
                          setConfirmingParcel(parcel);
                          setIsConfirmModalOpen(true);
                        }}
                        className="flex-1 py-1.5 px-2 bg-[#FAF6F8] hover:bg-stone-200 text-[#1E120D] text-[11px] font-bold rounded-lg transition text-center"
                        title="Confirmar se o plástico está instalado atualmente"
                      >
                        Confirmar Situação
                      </button>

                      <button
                        onClick={() => {
                          setCoverageTargetParcel(parcel);
                          setIsAddCoverageModalOpen(true);
                        }}
                        className="py-1.5 px-2 bg-[#FAF6F8] hover:bg-pink-100/60 text-[#8E1057] border border-[#D65F95]/40 text-[11px] font-bold rounded-lg transition"
                        title="Adicionar evento de cobertura"
                      >
                        + Cobertura
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* --- MODAL CONFIRMAR SITUAÇÃO ATUAL DA COBERTURA --- */}
      {isConfirmModalOpen && confirmingParcel && (
        <div className="fixed inset-0 bg-stone-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-base font-bold text-stone-900">
                Confirmar Situação da Parcela {confirmingParcel.parcelCode}
              </h3>
              <button onClick={() => setIsConfirmModalOpen(false)} className="text-stone-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleConfirmSituationSubmit} className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-stone-50 rounded-xl border text-stone-700 space-y-1">
                <p>Fazenda: <strong>{confirmingParcel.farmName}</strong> ({confirmingParcel.sector})</p>
                <p>Variedade: <strong>{confirmingParcel.variety}</strong> ({confirmingParcel.hectares} ha)</p>
                <p>Supervisor: <strong>{confirmingParcel.supervisor}</strong></p>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Situação da Plasticultura (Plástico Instalado) *</label>
                <select
                  name="situation"
                  defaultValue={confirmingParcel.situation}
                  required
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-bold"
                >
                  <option value="Coberta">Coberta (Plástico Instalado em Campo)</option>
                  <option value="Descoberta">Descoberta (Sem Plástico Instalado)</option>
                  <option value="A Confirmar">A Confirmar (Pendente de confirmação)</option>
                </select>
              </div>

              <div className="p-3 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] space-y-2">
                <label className="block font-bold text-[#8E1057]">
                  Situação da Estrutura Física (Campo Independente)
                </label>
                <select
                  name="structureStatus"
                  defaultValue={confirmingParcel.structureStatus || 'Pendente de confirmação'}
                  className="w-full bg-white border border-[#F0E4EB] rounded-lg p-2.5 font-bold text-[#1E120D]"
                >
                  <option value="Pendente de confirmação">Pendente de confirmação</option>
                  <option value="Com Estrutura">Com Estrutura (Possui estrutura montada)</option>
                  <option value="Sem Estrutura">Sem Estrutura</option>
                </select>
                <input
                  name="structureNotes"
                  defaultValue={confirmingParcel.structureNotes || ''}
                  placeholder="Observação sobre a estrutura (opcional)"
                  className="w-full bg-white border border-[#F0E4EB] rounded-lg p-2 text-[11px]"
                />
                <p className="text-[10px] text-[#1E120D]/65">
                  Ter estrutura física confirmada não presume plástico instalado. Os dois totais são apurados separadamente.
                </p>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Plástico Efetivamente Instalado</label>
                <select
                  name="currentPlasticType"
                  defaultValue={confirmingParcel.currentPlasticType || plastics[0]?.name}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                >
                  <option value="">Nenhum / Descoberta</option>
                  {plastics.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Metragem Coberta Aproximada (m)</label>
                <input
                  name="currentMetersCovered"
                  type="number"
                  defaultValue={confirmingParcel.currentMetersCovered || Math.round(confirmingParcel.hectares * 1000)}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Observações da Vistoria</label>
                <textarea
                  name="notes"
                  rows={2}
                  placeholder="Ex: Situação confirmada visualmente pelo supervisor em 31/10/2026."
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5"
                />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsConfirmModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-[#8E1057] hover:bg-[#750D48] text-white font-bold rounded-lg transition shadow-xs">Salvar Confirmação</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL ADICIONAR COBERTURA AO HISTÓRICO --- */}
      {isAddCoverageModalOpen && coverageTargetParcel && (
        <div className="fixed inset-0 bg-stone-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-base font-bold text-stone-900">
                Registrar Cobertura na Parcela {coverageTargetParcel.parcelCode}
              </h3>
              <button onClick={() => setIsAddCoverageModalOpen(false)} className="text-stone-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleAddCoverageSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Data da Cobertura *</label>
                <input name="coverageDate" type="date" defaultValue={new Date().toISOString().slice(0, 10)} required className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-medium" />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Tipo de Plástico Utilizado *</label>
                <select name="plasticType" required className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-bold">
                  {plastics.map(p => (
                    <option key={p.id} value={p.name}>{p.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Metros Instalados *</label>
                <input name="metersInstalled" type="number" defaultValue={Math.round(coverageTargetParcel.hectares * 1000)} required className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-bold" />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Responsável / Supervisor *</label>
                <input name="responsible" defaultValue={coverageTargetParcel.supervisor || currentUser.name} required className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5" />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Está Instalado Atualmente? *</label>
                <select name="isCurrentConfirmed" defaultValue="true" className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-semibold">
                  <option value="true">Sim (Atualiza a parcela como Coberta com este plástico)</option>
                  <option value="false">Não (Registrar apenas no histórico como cobertura anterior)</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Observações</label>
                <input name="notes" placeholder="Ex: Substituição por desgaste de safra" className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsAddCoverageModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-[#8E1057] hover:bg-[#750D48] text-white font-bold rounded-lg transition shadow-xs">Registrar Cobertura</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CADASTRO / EDIÇÃO DE PARCELA --- */}
      {isParcelModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-scale-up max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-base font-bold text-stone-900">
                {editingParcel ? 'Editar Parcela' : `Nova Parcela em ${currentFarm?.name}`}
              </h3>
              <button onClick={() => setIsParcelModalOpen(false)} className="text-stone-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveParcelSubmit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Setor *</label>
                  <select name="sector" defaultValue={editingParcel?.sector || farmSectors[0]?.name} required className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-semibold">
                    {farmSectors.map(s => (
                      <option key={s.id} value={s.name}>{s.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Identificação da Parcela *</label>
                  <input name="parcelCode" defaultValue={editingParcel?.parcelCode || 'Parcela '} required placeholder="Ex: Parcela 09" className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Supervisor Responsável *</label>
                  <input name="supervisor" defaultValue={editingParcel?.supervisor || currentFarm?.manager} required placeholder="Ex: Marcos Vinícius" className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-medium" />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Variedade *</label>
                  <input name="variety" defaultValue={editingParcel?.variety || ''} required placeholder="Ex: BRS Vitória, Cotton Candy" className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-semibold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Área em Hectares *</label>
                  <input name="hectares" type="number" step="0.01" defaultValue={editingParcel?.hectares || 3.0} required className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-bold" />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Situação Plasticultura (Plástico) *</label>
                  <select name="situation" defaultValue={editingParcel?.situation || 'A Confirmar'} required className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-semibold">
                    <option value="A Confirmar">Pendente de confirmação (A Confirmar)</option>
                    <option value="Coberta">Coberta (Com Plástico)</option>
                    <option value="Descoberta">Descoberta (Sem Plástico)</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 p-3 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB]">
                <div>
                  <label className="block font-bold text-[#8E1057] mb-1">Situação da Estrutura *</label>
                  <select
                    name="structureStatus"
                    defaultValue={editingParcel?.structureStatus || 'Pendente de confirmação'}
                    className="w-full bg-white border border-[#F0E4EB] rounded-lg p-2 font-semibold text-[#1E120D]"
                  >
                    <option value="Pendente de confirmação">Pendente de confirmação</option>
                    <option value="Com Estrutura">Com Estrutura</option>
                    <option value="Sem Estrutura">Sem Estrutura</option>
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#1E120D] mb-1">Notas da Estrutura</label>
                  <input
                    name="structureNotes"
                    defaultValue={editingParcel?.structureNotes || ''}
                    placeholder="Ex: Estrutura de parral instalada"
                    className="w-full bg-white border border-[#F0E4EB] rounded-lg p-2"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Informações Adicionais</label>
                <textarea name="additionalInfo" rows={2} defaultValue={editingParcel?.additionalInfo || ''} placeholder="Ex: Cultivo sob parral alto com tela lateral de proteção." className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsParcelModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-[#8E1057] hover:bg-[#750D48] text-white font-bold rounded-lg transition shadow-xs">Salvar Parcela</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CADASTRO DE SETOR --- */}
      {isSectorModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-stone-200 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-base font-bold text-stone-900">
                Novo Setor em {currentFarm?.name}
              </h3>
              <button onClick={() => setIsSectorModalOpen(false)} className="text-stone-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveSectorSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nome do Setor *</label>
                <input name="name" required placeholder="Ex: Setor 03 - Centro" className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-semibold" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Código *</label>
                  <input name="code" required placeholder="Ex: SET-03" className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-bold" />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Supervisor Padrão</label>
                  <input name="supervisorDefault" placeholder="Ex: Marcos Vinícius" className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsSectorModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-[#8E1057] hover:bg-[#750D48] text-white font-bold rounded-lg transition shadow-xs">Salvar Setor</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL CADASTRO DE FAZENDA --- */}
      {isFarmModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-stone-200 animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-base font-bold text-stone-900">
                {editingFarm ? 'Editar Fazenda' : 'Cadastrar Nova Fazenda'}
              </h3>
              <button onClick={() => setIsFarmModalOpen(false)} className="text-stone-500">
                <X className="w-5 h-5" />
              </button>
            </div>
            <form onSubmit={handleSaveFarmSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nome da Fazenda *</label>
                <input name="name" defaultValue={editingFarm?.name || ''} required placeholder="Ex: Labrunier III" className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5" />
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Código / Sigla *</label>
                  <input name="code" defaultValue={editingFarm?.code || ''} required placeholder="Ex: VDU, LAB, BRU, LBR" className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 uppercase" />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Área Total (ha) *</label>
                  <input name="totalHectares" type="number" step="0.01" defaultValue={editingFarm?.totalHectares || 100} required className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5" />
                </div>
                <div>
                  <label className="block font-semibold text-[#8E1057] mb-1">Área Serroplast (ha)</label>
                  <input name="serroplastHectares" type="number" step="0.01" defaultValue={editingFarm?.serroplastHectares ?? ''} placeholder="Ex: 43.41" className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5" />
                </div>
              </div>
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Localização *</label>
                <input name="location" defaultValue={editingFarm?.location || ''} required placeholder="Ex: Petrolina - PE" className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5" />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Gerente</label>
                  <input name="manager" defaultValue={editingFarm?.manager || ''} placeholder="Ex: Carlos Silva" className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5" />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Contato</label>
                  <input name="contactPhone" defaultValue={editingFarm?.contactPhone || ''} placeholder="(87) 99999-0000" className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5" />
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsFarmModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-[#8E1057] hover:bg-[#750D48] text-white font-bold rounded-lg transition shadow-xs">Salvar Fazenda</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
