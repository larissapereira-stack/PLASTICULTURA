import React, { useState, useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { SerroplastRecord, AreaConfirmationStatus } from '../../types';
import { INITIAL_SERROPLAST_RECORDS } from '../../data/serroplastData';
import { FarmAreaSummaryTable } from '../common/FarmAreaSummaryTable';
import {
  resolveSerroplastPlasticulturaStatus,
  resolveSerroplastEstruturaStatus
} from '../../utils/farmAreaSummary';
import { 
  ShieldCheck, 
  Search, 
  Filter, 
  Plus, 
  RefreshCw, 
  Download, 
  Printer, 
  Edit3, 
  PowerOff, 
  CheckCircle2, 
  AlertCircle, 
  X, 
  FileSpreadsheet,
  Info,
  Layers,
  Sparkles,
  Calendar,
  Check,
  Warehouse
} from 'lucide-react';

export const SerroplastHistoryView: React.FC = () => {
  const { 
    serroplastRecords, 
    saveSerroplastRecord, 
    toggleSerroplastStatus, 
    importSerroplastBatch,
    showToast,
    currentUser
  } = useApp();

  // Estados dos filtros
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedFarm, setSelectedFarm] = useState<string>('all');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedInternalSector, setSelectedInternalSector] = useState<string>('all');
  const [selectedSupervisor, setSelectedSupervisor] = useState<string>('all');
  const [selectedVariety, setSelectedVariety] = useState<string>('all');
  const [selectedStatus, setSelectedStatus] = useState<'all' | 'ativo' | 'inativo'>('all');

  // Estados dos modais
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingRecord, setEditingRecord] = useState<SerroplastRecord | null>(null);
  const [isInactivateModalOpen, setIsInactivateModalOpen] = useState(false);
  const [inactivatingRecord, setInactivatingRecord] = useState<SerroplastRecord | null>(null);
  const [inactivationReason, setInactivationReason] = useState('');
  const [isReimportModalOpen, setIsReimportModalOpen] = useState(false);
  const [viewDetailRecord, setViewDetailRecord] = useState<SerroplastRecord | null>(null);

  // Form de edição/criação
  const [formData, setFormData] = useState<Partial<SerroplastRecord>>({
    sigla: 'LAB',
    fazendaNome: 'Labrunier I',
    setorFazenda: '01',
    supervisor: '',
    setorInterno: '',
    parcela: '',
    variedade: '',
    areaHa: 0,
    situacao: 'Coberta',
    plasticulturaConfirmada: 'Pendente de confirmação',
    estruturaConfirmada: 'Pendente de confirmação',
    data1: '',
    cobertura1: 'Serroplast',
    data2: '',
    cobertura2: '',
    data3: '',
    cobertura3: '',
    informacao: '',
    ativo: true
  });

  // Mapa de siglas para nome
  const farmNames: Record<string, string> = {
    LAB: 'Labrunier I',
    BRU: 'Brasil Uvas',
    LBR: 'Labrunier II',
    VDU: 'Vale das Uvas'
  };

  // Identificar parcelas multivariedade (mesma fazenda + setorInterno + parcela com mais de um registro)
  const multiVarietyKeys = useMemo(() => {
    const counts: Record<string, number> = {};
    serroplastRecords.forEach(r => {
      const key = `${r.sigla}_${r.setorInterno}_${r.parcela}`.toUpperCase();
      counts[key] = (counts[key] || 0) + 1;
    });
    return new Set(Object.keys(counts).filter(k => counts[k] > 1));
  }, [serroplastRecords]);

  // Opções para filtros
  const filterOptions = useMemo(() => {
    const sectors = Array.from(new Set(serroplastRecords.map(r => r.setorFazenda).filter(Boolean))).sort();
    const internalSectors = Array.from(new Set(serroplastRecords.map(r => r.setorInterno).filter(Boolean))).sort();
    const supervisors = Array.from(new Set(serroplastRecords.map(r => r.supervisor).filter(Boolean))).sort();
    const varieties = Array.from(new Set(serroplastRecords.map(r => r.variedade).filter(Boolean))).sort();
    return { sectors, internalSectors, supervisors, varieties };
  }, [serroplastRecords]);

  // Filtragem dos registros
  const filteredRecords = useMemo(() => {
    return serroplastRecords.filter(r => {
      if (selectedFarm !== 'all' && r.sigla !== selectedFarm) return false;
      if (selectedSector !== 'all' && r.setorFazenda !== selectedSector) return false;
      if (selectedInternalSector !== 'all' && r.setorInterno !== selectedInternalSector) return false;
      if (selectedSupervisor !== 'all' && r.supervisor !== selectedSupervisor) return false;
      if (selectedVariety !== 'all' && r.variedade !== selectedVariety) return false;
      if (selectedStatus === 'ativo' && !r.ativo) return false;
      if (selectedStatus === 'inativo' && r.ativo) return false;

      if (searchTerm.trim()) {
        const query = searchTerm.toLowerCase();
        const match = 
          r.parcela.toLowerCase().includes(query) ||
          r.setorInterno.toLowerCase().includes(query) ||
          r.variedade.toLowerCase().includes(query) ||
          r.supervisor.toLowerCase().includes(query) ||
          r.fazendaNome.toLowerCase().includes(query) ||
          r.sigla.toLowerCase().includes(query) ||
          (r.cobertura1 && r.cobertura1.toLowerCase().includes(query)) ||
          (r.informacao && r.informacao.toLowerCase().includes(query));
        if (!match) return false;
      }
      return true;
    });
  }, [
    serroplastRecords, 
    selectedFarm, 
    selectedSector, 
    selectedInternalSector, 
    selectedSupervisor, 
    selectedVariety, 
    selectedStatus, 
    searchTerm
  ]);

  // Resumo por fazenda (Total e Ativo)
  const farmSummaries = useMemo(() => {
    const list = [
      { sigla: 'LAB', nome: 'Labrunier I', targetHa: 43.41, targetRecords: 18 },
      { sigla: 'BRU', nome: 'Brasil Uvas', targetHa: 50.57, targetRecords: 16 },
      { sigla: 'LBR', nome: 'Labrunier II', targetHa: 87.79, targetRecords: 17 },
      { sigla: 'VDU', nome: 'Vale das Uvas', targetHa: 91.50, targetRecords: 26 },
    ];

    return list.map(item => {
      const records = serroplastRecords.filter(r => r.sigla === item.sigla);
      const activeRecords = records.filter(r => r.ativo);
      const totalHa = records.reduce((acc, r) => acc + (Number(r.areaHa) || 0), 0);
      const activeHa = activeRecords.reduce((acc, r) => acc + (Number(r.areaHa) || 0), 0);
      return {
        ...item,
        currentRecords: records.length,
        activeRecords: activeRecords.length,
        totalHa: Number(totalHa.toFixed(2)),
        activeHa: Number(activeHa.toFixed(2)),
        isExactMatch: Math.abs(totalHa - item.targetHa) < 0.01 && records.length === item.targetRecords
      };
    });
  }, [serroplastRecords]);

  // Totais gerais
  const grandTotal = useMemo(() => {
    const totalRecords = serroplastRecords.length;
    const activeRecords = serroplastRecords.filter(r => r.ativo).length;
    const totalHa = serroplastRecords.reduce((acc, r) => acc + (Number(r.areaHa) || 0), 0);
    const activeHa = serroplastRecords.filter(r => r.ativo).reduce((acc, r) => acc + (Number(r.areaHa) || 0), 0);
    const officialTargetHa = 273.27;
    const officialTargetRecords = 77;
    const isExact = Math.abs(totalHa - officialTargetHa) < 0.01 && totalRecords === officialTargetRecords;
    return {
      totalRecords,
      activeRecords,
      totalHa: Number(totalHa.toFixed(2)),
      activeHa: Number(activeHa.toFixed(2)),
      officialTargetHa,
      officialTargetRecords,
      isExact
    };
  }, [serroplastRecords]);

  // Abrir modal de criação
  const handleOpenCreateModal = () => {
    setEditingRecord(null);
    setFormData({
      sigla: 'LAB',
      fazendaNome: 'Labrunier I',
      setorFazenda: '01',
      supervisor: '',
      setorInterno: '',
      parcela: '',
      variedade: '',
      areaHa: 1.0,
      situacao: 'A Confirmar',
      plasticulturaConfirmada: 'Pendente de confirmação',
      estruturaConfirmada: 'Pendente de confirmação',
      data1: new Date().toLocaleDateString('pt-BR'),
      cobertura1: '',
      data2: '',
      cobertura2: '',
      data3: '',
      cobertura3: '',
      informacao: '',
      ativo: true
    });
    setIsEditModalOpen(true);
  };

  // Abrir modal de edição
  const handleOpenEditModal = (record: SerroplastRecord) => {
    setEditingRecord(record);
    setFormData({
      ...record,
      plasticulturaConfirmada: resolveSerroplastPlasticulturaStatus(record),
      estruturaConfirmada: resolveSerroplastEstruturaStatus(record)
    });
    setIsEditModalOpen(true);
  };

  // Salvar formulário (criar ou editar)
  const handleSaveForm = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.sigla || !formData.parcela || !formData.variedade || !formData.areaHa) {
      showToast('error', 'Campos Obrigatórios', 'Por favor preencha fazenda, parcela, variedade e área.');
      return;
    }

    const plastStatus: AreaConfirmationStatus =
      formData.plasticulturaConfirmada || 'Pendente de confirmação';
    const estStatus: AreaConfirmationStatus =
      formData.estruturaConfirmada || 'Pendente de confirmação';

    const syncedSituacao =
      plastStatus === 'Confirmado'
        ? 'Coberta'
        : plastStatus === 'Não Possui'
          ? 'Descoberta'
          : 'A Confirmar';

    const recordToSave: SerroplastRecord = {
      id: editingRecord ? editingRecord.id : `serro-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
      sigla: (formData.sigla as any) || 'LAB',
      fazendaNome: farmNames[formData.sigla || 'LAB'] || formData.sigla || '',
      setorFazenda: formData.setorFazenda || '01',
      supervisor: formData.supervisor || '',
      setorInterno: formData.setorInterno || '',
      parcela: formData.parcela || '',
      variedade: formData.variedade || '',
      areaHa: Number(Number(formData.areaHa).toFixed(2)),
      situacao: syncedSituacao,
      plasticulturaConfirmada: plastStatus,
      estruturaConfirmada: estStatus,
      data1: formData.data1 || '',
      cobertura1: formData.cobertura1 || '',
      data2: formData.data2 || '',
      cobertura2: formData.cobertura2 || '',
      data3: formData.data3 || '',
      cobertura3: formData.cobertura3 || '',
      informacao: formData.informacao || '',
      ativo: formData.ativo !== undefined ? formData.ativo : true,
      dataImportacao: editingRecord?.dataImportacao || new Date().toISOString(),
      atualizadoEm: new Date().toISOString()
    };

    saveSerroplastRecord(recordToSave);
    setIsEditModalOpen(false);
  };

  // Abrir modal para inativar
  const handleOpenInactivate = (record: SerroplastRecord) => {
    setInactivatingRecord(record);
    setInactivationReason(record.motivoInativacao || '');
    setIsInactivateModalOpen(true);
  };

  // Confirmar inativação / reativação
  const handleConfirmStatusChange = () => {
    if (!inactivatingRecord) return;
    const newStatus = !inactivatingRecord.ativo;
    toggleSerroplastStatus(inactivatingRecord.id, newStatus, inactivationReason);
    setIsInactivateModalOpen(false);
    setInactivatingRecord(null);
  };

  // Executar reimportação segura dos 77 registros oficiais com proteção contra duplicação
  const handleExecuteReimport = () => {
    const res = importSerroplastBatch(INITIAL_SERROPLAST_RECORDS);
    setIsReimportModalOpen(false);
  };

  // Exportar para CSV
  const handleExportCSV = () => {
    const headers = [
      'SIGLA',
      'FAZENDA',
      'SETOR_FAZENDA',
      'SUPERVISOR',
      'SETOR_INTERNO',
      'PARCELA',
      'VARIEDADE',
      'AREA_HA',
      'SITUACAO',
      '1A_DATA',
      '1A_COBERTURA',
      '2A_DATA',
      '2A_COBERTURA',
      '3A_DATA',
      '3A_COBERTURA',
      'PLASTICULTURA_CONFIRMADA',
      'ESTRUTURA_CONFIRMADA',
      'INFORMACAO',
      'STATUS'
    ];

    const rows = filteredRecords.map(r => [
      `"${r.sigla}"`,
      `"${r.fazendaNome}"`,
      `"${r.setorFazenda}"`,
      `"${r.supervisor}"`,
      `"${r.setorInterno}"`,
      `"${r.parcela}"`,
      `"${r.variedade}"`,
      `"${r.areaHa.toFixed(2).replace('.', ',')}"`,
      `"${r.situacao || ''}"`,
      `"${r.data1 || ''}"`,
      `"${r.cobertura1 || ''}"`,
      `"${r.data2 || ''}"`,
      `"${r.cobertura2 || ''}"`,
      `"${r.data3 || ''}"`,
      `"${r.cobertura3 || ''}"`,
      `"${resolveSerroplastPlasticulturaStatus(r)}"`,
      `"${resolveSerroplastEstruturaStatus(r)}"`,
      `"${(r.informacao || '').replace(/"/g, '""')}"`,
      `"${r.ativo ? 'Ativo' : 'Inativo'}"`
    ]);

    const csvContent = '\uFEFF' + [headers.join(';'), ...rows.map(e => e.join(';'))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `historico_serroplast_el_ciruelo_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('success', 'Exportação Concluída', `${filteredRecords.length} registros exportados para planilha.`);
  };

  return (
    <div className="space-y-6">
      {/* Banner Principal com Identidade El Ciruelo */}
      <div className="bg-gradient-to-r from-[#8E1057] via-[#A81768] to-[#6A0C42] rounded-2xl p-6 text-white shadow-lg relative overflow-hidden">
        <div className="absolute right-0 top-0 bottom-0 opacity-10 pointer-events-none flex items-center pr-8">
          <Layers className="w-80 h-80 text-white" />
        </div>

        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/15 backdrop-blur-xs text-xs font-semibold text-pink-100 border border-white/20 mb-3">
              <Sparkles className="w-3.5 h-3.5 text-pink-300" />
              Controle Oficial de Plasticultura • El Ciruelo Brasil
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
              HISTÓRICO SERROPLAST
            </h1>
            <p className="text-pink-100 text-sm mt-1 max-w-2xl leading-relaxed">
              Base oficial auditada com todos os 77 registros de cobertura Serroplast por parcela, 
              preservando datas, substituições, multivariedades e histórico operacional permanente.
            </p>
          </div>

          {/* Badge de Conferência Oficial */}
          <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 border border-white/25 flex items-center gap-4 shrink-0 shadow-inner">
            <div className="w-12 h-12 rounded-xl bg-white text-[#8E1057] flex items-center justify-center font-black shadow-md shrink-0">
              <ShieldCheck className="w-7 h-7 text-[#8E1057]" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs uppercase font-bold tracking-wider text-pink-200">
                  Conferência Oficial
                </span>
                <span className="text-[10px] bg-emerald-500 text-white font-black px-1.5 py-0.5 rounded-full flex items-center gap-0.5">
                  <Check className="w-3 h-3" /> Auditado
                </span>
              </div>
              <div className="text-xl font-black text-white mt-0.5">
                {grandTotal.totalRecords} / 77 Registros
              </div>
              <div className="text-xs text-pink-100">
                Total Registrado: <strong>{grandTotal.totalHa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ha</strong> (Alvo: 273,27 ha)
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Cards de Resumo por Fazenda */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {farmSummaries.map((f) => (
          <div 
            key={f.sigla}
            onClick={() => setSelectedFarm(selectedFarm === f.sigla ? 'all' : f.sigla)}
            className={`
              p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group
              ${selectedFarm === f.sigla 
                ? 'bg-[#8E1057] text-white border-[#8E1057] shadow-md ring-2 ring-[#D65F95]' 
                : 'bg-white hover:bg-[#FAF6F8] text-[#1E120D] border-[#F0E4EB] shadow-xs'}
            `}
          >
            <div className="flex items-center justify-between">
              <span className={`
                text-xs font-black px-2 py-0.5 rounded-md
                ${selectedFarm === f.sigla ? 'bg-white/20 text-white' : 'bg-[#FAF6F8] text-[#8E1057] border border-[#F0E4EB]'}
              `}>
                {f.sigla}
              </span>
              <span className={`text-[11px] font-semibold flex items-center gap-1 ${
                selectedFarm === f.sigla ? 'text-pink-200' : 'text-emerald-700'
              }`}>
                <CheckCircle2 className="w-3 h-3 text-emerald-500" />
                Oficial
              </span>
            </div>

            <h3 className={`font-bold text-sm mt-2 truncate ${selectedFarm === f.sigla ? 'text-white' : 'text-[#1E120D]'}`}>
              {f.nome}
            </h3>

            <div className="mt-3 flex items-baseline justify-between">
              <div>
                <div className={`text-xl font-black ${selectedFarm === f.sigla ? 'text-white' : 'text-[#8E1057]'}`}>
                  {f.totalHa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-xs font-normal">ha</span>
                </div>
                <div className={`text-[11px] ${selectedFarm === f.sigla ? 'text-pink-200' : 'text-[#1E120D]/60'}`}>
                  {f.currentRecords} parcelas {f.currentRecords !== f.targetRecords && `(${f.targetRecords} oficial)`}
                </div>
              </div>

              <div className="text-right">
                <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                  selectedFarm === f.sigla ? 'bg-white/10 text-pink-100' : 'bg-stone-100 text-stone-600'
                }`}>
                  {f.activeRecords} ativas
                </span>
              </div>
            </div>
          </div>
        ))}

        {/* Card do Total Geral */}
        <div 
          onClick={() => setSelectedFarm('all')}
          className={`
            p-4 rounded-xl border transition-all cursor-pointer relative overflow-hidden group
            ${selectedFarm === 'all' 
              ? 'bg-[#1E120D] text-white border-[#1E120D] shadow-md ring-2 ring-[#8E1057]' 
              : 'bg-white hover:bg-[#FAF6F8] text-[#1E120D] border-[#F0E4EB] shadow-xs'}
          `}
        >
          <div className="flex items-center justify-between">
            <span className={`
              text-xs font-black px-2 py-0.5 rounded-md
              ${selectedFarm === 'all' ? 'bg-white/20 text-white' : 'bg-stone-100 text-[#1E120D]'}
            `}>
              TOTAL GERAL
            </span>
            <span className="text-[11px] font-semibold text-emerald-400 flex items-center gap-1">
              <CheckCircle2 className="w-3 h-3 text-emerald-400" />
              100%
            </span>
          </div>

          <h3 className={`font-bold text-sm mt-2 ${selectedFarm === 'all' ? 'text-white' : 'text-[#1E120D]'}`}>
            Todas as 4 Fazendas
          </h3>

          <div className="mt-3 flex items-baseline justify-between">
            <div>
              <div className={`text-xl font-black ${selectedFarm === 'all' ? 'text-pink-300' : 'text-[#8E1057]'}`}>
                {grandTotal.totalHa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} <span className="text-xs font-normal">ha</span>
              </div>
              <div className={`text-[11px] ${selectedFarm === 'all' ? 'text-stone-300' : 'text-[#1E120D]/60'}`}>
                {grandTotal.totalRecords} parcelas cadastradas
              </div>
            </div>
            <div className="text-right">
              <span className={`text-[10px] font-medium px-1.5 py-0.5 rounded ${
                selectedFarm === 'all' ? 'bg-white/10 text-stone-300' : 'bg-stone-100 text-stone-600'
              }`}>
                {grandTotal.activeRecords} ativas
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabela Independente: Área com Plasticultura vs. Área com Estrutura por Fazenda */}
      <FarmAreaSummaryTable compact />

      {/* Barra de Ações & Botões de Controle */}
      <div className="bg-white rounded-2xl p-4 border border-[#F0E4EB] shadow-xs flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-2 flex-wrap">
          <button
            onClick={handleOpenCreateModal}
            className="flex items-center gap-2 px-4 py-2.5 bg-[#8E1057] hover:bg-[#750D48] text-white text-xs font-bold rounded-xl transition shadow-xs"
          >
            <Plus className="w-4 h-4" />
            Novo Registro Serroplast
          </button>

          <button
            onClick={() => setIsReimportModalOpen(true)}
            className="flex items-center gap-2 px-3.5 py-2.5 bg-[#FAF6F8] hover:bg-[#F0E4EB] text-[#8E1057] border border-[#D65F95]/40 text-xs font-bold rounded-xl transition shadow-xs"
            title="Sincronizar base original sem duplicar registros"
          >
            <RefreshCw className="w-4 h-4 text-[#8E1057]" />
            Sincronizar / Reimportar 77 Registros
          </button>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportCSV}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#FAF6F8] text-[#1E120D] border border-[#F0E4EB] text-xs font-semibold rounded-xl transition shadow-xs"
          >
            <Download className="w-4 h-4 text-[#8E1057]" />
            Exportar CSV
          </button>

          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 px-3 py-2 bg-white hover:bg-[#FAF6F8] text-[#1E120D] border border-[#F0E4EB] text-xs font-semibold rounded-xl transition shadow-xs no-print"
          >
            <Printer className="w-4 h-4 text-[#8E1057]" />
            Imprimir
          </button>
        </div>
      </div>

      {/* Filtros Completos (Fazenda, Setor, Parcela, Supervisor, Variedade, Status, Busca) */}
      <div className="bg-white rounded-2xl p-4 border border-[#F0E4EB] shadow-xs space-y-3">
        <div className="flex items-center justify-between border-b border-[#F0E4EB] pb-2.5">
          <div className="flex items-center gap-2 text-xs font-bold text-[#1E120D]">
            <Filter className="w-4 h-4 text-[#8E1057]" />
            Filtros Operacionais ({filteredRecords.length} de {serroplastRecords.length} registros)
          </div>

          {(selectedFarm !== 'all' || selectedSector !== 'all' || selectedInternalSector !== 'all' || selectedSupervisor !== 'all' || selectedVariety !== 'all' || selectedStatus !== 'all' || searchTerm) && (
            <button
              onClick={() => {
                setSelectedFarm('all');
                setSelectedSector('all');
                setSelectedInternalSector('all');
                setSelectedSupervisor('all');
                setSelectedVariety('all');
                setSelectedStatus('all');
                setSearchTerm('');
              }}
              className="text-xs text-[#8E1057] hover:underline font-semibold flex items-center gap-1"
            >
              <X className="w-3.5 h-3.5" /> Limpar Filtros
            </button>
          )}
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-7 gap-2.5">
          {/* Busca Textual */}
          <div className="lg:col-span-2 relative">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-stone-400" />
            <input
              type="text"
              placeholder="Buscar parcela, variedade, supervisor..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs text-[#1E120D] focus:outline-none focus:ring-2 focus:ring-[#8E1057] focus:bg-white"
            />
          </div>

          {/* Filtro Fazenda */}
          <div>
            <select
              value={selectedFarm}
              onChange={(e) => setSelectedFarm(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs text-[#1E120D] focus:outline-none focus:ring-2 focus:ring-[#8E1057] focus:bg-white font-medium"
            >
              <option value="all">Todas as Fazendas</option>
              <option value="LAB">LAB - Labrunier I</option>
              <option value="BRU">BRU - Brasil Uvas</option>
              <option value="LBR">LBR - Labrunier II</option>
              <option value="VDU">VDU - Vale das Uvas</option>
            </select>
          </div>

          {/* Filtro Setor da Fazenda */}
          <div>
            <select
              value={selectedSector}
              onChange={(e) => setSelectedSector(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs text-[#1E120D] focus:outline-none focus:ring-2 focus:ring-[#8E1057] focus:bg-white font-medium"
            >
              <option value="all">Setor Fazenda (Todos)</option>
              {filterOptions.sectors.map(s => (
                <option key={s} value={s}>Setor {s}</option>
              ))}
            </select>
          </div>

          {/* Filtro Supervisor */}
          <div>
            <select
              value={selectedSupervisor}
              onChange={(e) => setSelectedSupervisor(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs text-[#1E120D] focus:outline-none focus:ring-2 focus:ring-[#8E1057] focus:bg-white font-medium"
            >
              <option value="all">Supervisor (Todos)</option>
              {filterOptions.supervisors.map(sup => (
                <option key={sup} value={sup}>{sup}</option>
              ))}
            </select>
          </div>

          {/* Filtro Variedade */}
          <div>
            <select
              value={selectedVariety}
              onChange={(e) => setSelectedVariety(e.target.value)}
              className="w-full px-2.5 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs text-[#1E120D] focus:outline-none focus:ring-2 focus:ring-[#8E1057] focus:bg-white font-medium"
            >
              <option value="all">Variedade (Todas)</option>
              {filterOptions.varieties.map(v => (
                <option key={v} value={v}>{v}</option>
              ))}
            </select>
          </div>

          {/* Filtro Status */}
          <div>
            <select
              value={selectedStatus}
              onChange={(e) => setSelectedStatus(e.target.value as any)}
              className="w-full px-2.5 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs text-[#1E120D] focus:outline-none focus:ring-2 focus:ring-[#8E1057] focus:bg-white font-medium"
            >
              <option value="all">Status (Todos)</option>
              <option value="ativo">Somente Ativos</option>
              <option value="inativo">Somente Inativos</option>
            </select>
          </div>
        </div>
      </div>

      {/* Tabela Oficial de Registros Serroplast */}
      <div className="bg-white rounded-2xl border border-[#F0E4EB] shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#F0E4EB] flex items-center justify-between bg-[#FAF6F8]">
          <div className="flex items-center gap-2">
            <FileSpreadsheet className="w-5 h-5 text-[#8E1057]" />
            <div>
              <h2 className="font-bold text-sm text-[#1E120D]">
                Registros Oficiais Serroplast por Parcela
              </h2>
              <p className="text-[11px] text-[#1E120D]/60">
                Preservação integral dos dados do documento oficial, histórico de substituições e multivariedades
              </p>
            </div>
          </div>

          <div className="text-xs font-semibold text-[#8E1057]">
            Exibindo {filteredRecords.length} de {serroplastRecords.length} parcelas
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="bg-[#FAF6F8] text-[#1E120D]/80 border-b border-[#F0E4EB] font-bold uppercase text-[10px] tracking-wider">
                <th className="py-3 px-3">Fazenda</th>
                <th className="py-3 px-3">Setor / Sup.</th>
                <th className="py-3 px-3">Setor / Parcela</th>
                <th className="py-3 px-3">Variedade</th>
                <th className="py-3 px-3 text-right">Área (ha)</th>
                <th className="py-3 px-3">1ª Cobertura</th>
                <th className="py-3 px-3">2ª Cobertura</th>
                <th className="py-3 px-3">3ª Cobertura</th>
                <th className="py-3 px-3">Informação</th>
                <th className="py-3 px-3">Plasticultura / Estrutura</th>
                <th className="py-3 px-3 text-center">Status</th>
                <th className="py-3 px-3 text-right">Ações</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-[#F0E4EB]">
              {filteredRecords.length === 0 ? (
                <tr>
                  <td colSpan={12} className="py-12 text-center text-stone-500">
                    <AlertCircle className="w-8 h-8 text-stone-400 mx-auto mb-2" />
                    <p className="font-semibold text-sm">Nenhum registro encontrado com os filtros selecionados.</p>
                    <p className="text-xs text-stone-400 mt-1">Tente remover ou ajustar os critérios de busca.</p>
                  </td>
                </tr>
              ) : (
                filteredRecords.map((record) => {
                  const multiKey = `${record.sigla}_${record.setorInterno}_${record.parcela}`.toUpperCase();
                  const isMulti = multiVarietyKeys.has(multiKey);
                  const plastStatus = resolveSerroplastPlasticulturaStatus(record);
                  const estStatus = resolveSerroplastEstruturaStatus(record);

                  return (
                    <tr 
                      key={record.id}
                      className={`
                        transition-colors hover:bg-[#FAF6F8]
                        ${!record.ativo ? 'bg-stone-50/70 text-stone-400 opacity-75' : ''}
                      `}
                    >
                      {/* Fazenda */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <span className={`
                          font-black text-[11px] px-2 py-0.5 rounded
                          ${record.sigla === 'LAB' ? 'bg-pink-100 text-[#8E1057]' :
                            record.sigla === 'BRU' ? 'bg-amber-100 text-amber-900' :
                            record.sigla === 'LBR' ? 'bg-purple-100 text-purple-900' :
                            'bg-emerald-100 text-emerald-900'}
                        `}>
                          {record.sigla}
                        </span>
                        <div className="text-[10px] text-[#1E120D]/60 mt-0.5 font-medium truncate max-w-[100px]">
                          {record.fazendaNome}
                        </div>
                      </td>

                      {/* Setor Fazenda & Supervisor */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-bold text-[#1E120D]">Setor {record.setorFazenda}</div>
                        <div className="text-[11px] text-[#1E120D]/70">{record.supervisor || '—'}</div>
                      </td>

                      {/* Setor Interno / Parcela */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex items-center gap-1.5">
                          <span className="font-black text-[#1E120D] text-xs">
                            {record.parcela}
                          </span>
                          {record.setorInterno && (
                            <span className="text-[10px] text-stone-500 font-mono bg-stone-100 px-1 rounded">
                              {record.setorInterno}
                            </span>
                          )}
                        </div>
                        {isMulti && (
                          <span className="inline-block text-[9px] bg-amber-100 text-amber-900 border border-amber-300 px-1 py-0.2 rounded font-bold mt-0.5" title="Esta parcela possui mais de uma variedade cadastrada na mesma área">
                            Multivariedade
                          </span>
                        )}
                      </td>

                      {/* Variedade */}
                      <td className="py-3 px-3 font-semibold text-[#1E120D] whitespace-nowrap">
                        {record.variedade}
                      </td>

                      {/* Área ha */}
                      <td className="py-3 px-3 text-right whitespace-nowrap font-black text-[#8E1057]">
                        {record.areaHa.toFixed(2).replace('.', ',')} ha
                      </td>

                      {/* 1ª Cobertura */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-medium text-[#1E120D]">{record.cobertura1 || '—'}</div>
                        {record.data1 && (
                          <div className="text-[10px] text-stone-500 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" /> {record.data1}
                          </div>
                        )}
                      </td>

                      {/* 2ª Cobertura */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-medium text-[#1E120D]">{record.cobertura2 || '—'}</div>
                        {record.data2 && (
                          <div className="text-[10px] text-stone-500 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" /> {record.data2}
                          </div>
                        )}
                      </td>

                      {/* 3ª Cobertura */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="font-medium text-[#1E120D]">{record.cobertura3 || '—'}</div>
                        {record.data3 && (
                          <div className="text-[10px] text-stone-500 flex items-center gap-1">
                            <Calendar className="w-2.5 h-2.5" /> {record.data3}
                          </div>
                        )}
                      </td>

                      {/* Informação / Observações */}
                      <td className="py-3 px-3 max-w-[150px] truncate" title={record.informacao}>
                        {record.informacao ? (
                          <span className="text-[11px] text-[#1E120D]/80 bg-stone-100 px-1.5 py-0.5 rounded">
                            {record.informacao}
                          </span>
                        ) : (
                          <span className="text-stone-300">—</span>
                        )}
                      </td>

                      {/* Classificação Independente: Plasticultura vs Estrutura */}
                      <td className="py-3 px-3 whitespace-nowrap">
                        <div className="flex flex-col gap-1">
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-bold w-fit ${
                              plastStatus === 'Confirmado'
                                ? 'bg-pink-50 text-[#8E1057] border border-[#D65F95]/40'
                                : plastStatus === 'Não Possui'
                                  ? 'bg-stone-100 text-stone-600'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            Plástico: {plastStatus}
                          </span>
                          <span
                            className={`inline-flex items-center gap-1 text-[10px] px-1.5 py-0.5 rounded font-bold w-fit ${
                              estStatus === 'Confirmado'
                                ? 'bg-[#1E120D]/10 text-[#1E120D] border border-[#1E120D]/20'
                                : estStatus === 'Não Possui'
                                  ? 'bg-stone-100 text-stone-600'
                                  : 'bg-amber-50 text-amber-800 border border-amber-200'
                            }`}
                          >
                            Estrutura: {estStatus}
                          </span>
                        </div>
                      </td>

                      {/* Status */}
                      <td className="py-3 px-3 text-center whitespace-nowrap">
                        {record.ativo ? (
                          <span className="inline-flex items-center gap-1 text-[10px] bg-emerald-100 text-emerald-800 px-2 py-0.5 rounded-full font-bold">
                            <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                            Ativo
                          </span>
                        ) : (
                          <span 
                            className="inline-flex items-center gap-1 text-[10px] bg-stone-200 text-stone-700 px-2 py-0.5 rounded-full font-bold cursor-help"
                            title={record.motivoInativacao || 'Inativado sem detalhes'}
                          >
                            <span className="w-1.5 h-1.5 rounded-full bg-stone-500" />
                            Inativo
                          </span>
                        )}
                      </td>

                      {/* Ações */}
                      <td className="py-3 px-3 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => handleOpenEditModal(record)}
                            className="p-1.5 text-stone-600 hover:text-[#8E1057] hover:bg-[#FAF6F8] rounded-lg transition"
                            title="Editar registro"
                          >
                            <Edit3 className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => handleOpenInactivate(record)}
                            className={`p-1.5 rounded-lg transition ${
                              record.ativo 
                                ? 'text-amber-600 hover:text-amber-800 hover:bg-amber-50' 
                                : 'text-emerald-600 hover:text-emerald-800 hover:bg-emerald-50'
                            }`}
                            title={record.ativo ? 'Inativar registro sem perder histórico' : 'Reativar registro'}
                          >
                            <PowerOff className="w-4 h-4" />
                          </button>

                          <button
                            onClick={() => setViewDetailRecord(record)}
                            className="p-1.5 text-stone-600 hover:text-[#8E1057] hover:bg-[#FAF6F8] rounded-lg transition"
                            title="Ver detalhes completos"
                          >
                            <Info className="w-4 h-4" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Rodapé da tabela com totais da listagem */}
        <div className="p-3 bg-[#FAF6F8] border-t border-[#F0E4EB] flex flex-wrap items-center justify-between text-xs text-[#1E120D]/70">
          <div>
            Total filtrado: <strong>{filteredRecords.length} parcelas</strong> • 
            Área: <strong>{filteredRecords.reduce((acc, r) => acc + (Number(r.areaHa) || 0), 0).toFixed(2).replace('.', ',')} ha</strong>
          </div>
          <div>
            Base Serroplast: <strong>{serroplastRecords.length} registros permanentes</strong> (Alvo oficial: 77 reg / 273,27 ha)
          </div>
        </div>
      </div>

      {/* MODAL 1: NOVO / EDITAR REGISTRO */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-[#1E120D]/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-2xl w-full p-6 shadow-2xl border border-[#F0E4EB] max-h-[90vh] overflow-y-auto animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E4EB]">
              <div className="flex items-center gap-2">
                <Edit3 className="w-5 h-5 text-[#8E1057]" />
                <h3 className="font-bold text-[#1E120D] text-base">
                  {editingRecord ? `Editar Parcela ${editingRecord.parcela}` : 'Novo Registro Serroplast'}
                </h3>
              </div>
              <button 
                onClick={() => setIsEditModalOpen(false)}
                className="text-[#1E120D]/40 hover:text-[#1E120D] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveForm} className="py-4 space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                {/* Fazenda */}
                <div>
                  <label className="block text-[11px] font-bold text-[#1E120D] mb-1">Fazenda *</label>
                  <select
                    value={formData.sigla}
                    onChange={(e) => {
                      const sigla = e.target.value as any;
                      setFormData({ 
                        ...formData, 
                        sigla, 
                        fazendaNome: farmNames[sigla] || sigla 
                      });
                    }}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  >
                    <option value="LAB">LAB - Labrunier I</option>
                    <option value="BRU">BRU - Brasil Uvas</option>
                    <option value="LBR">LBR - Labrunier II</option>
                    <option value="VDU">VDU - Vale das Uvas</option>
                  </select>
                </div>

                {/* Setor Fazenda */}
                <div>
                  <label className="block text-[11px] font-bold text-[#1E120D] mb-1">Setor Fazenda *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: 01, 02"
                    value={formData.setorFazenda || ''}
                    onChange={(e) => setFormData({ ...formData, setorFazenda: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  />
                </div>

                {/* Supervisor */}
                <div>
                  <label className="block text-[11px] font-bold text-[#1E120D] mb-1">Supervisor</label>
                  <input
                    type="text"
                    placeholder="Nome do supervisor"
                    value={formData.supervisor || ''}
                    onChange={(e) => setFormData({ ...formData, supervisor: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  />
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
                {/* Setor Interno */}
                <div>
                  <label className="block text-[11px] font-bold text-[#1E120D] mb-1">Setor Interno</label>
                  <input
                    type="text"
                    placeholder="ex: II-04, 02"
                    value={formData.setorInterno || ''}
                    onChange={(e) => setFormData({ ...formData, setorInterno: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  />
                </div>

                {/* Parcela */}
                <div>
                  <label className="block text-[11px] font-bold text-[#1E120D] mb-1">Parcela *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: 3/3, 7/4"
                    value={formData.parcela || ''}
                    onChange={(e) => setFormData({ ...formData, parcela: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs font-bold focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  />
                </div>

                {/* Variedade */}
                <div>
                  <label className="block text-[11px] font-bold text-[#1E120D] mb-1">Variedade *</label>
                  <input
                    type="text"
                    required
                    placeholder="ex: ARRA 15, BRS VITORIA"
                    value={formData.variedade || ''}
                    onChange={(e) => setFormData({ ...formData, variedade: e.target.value })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  />
                </div>

                {/* Área ha */}
                <div>
                  <label className="block text-[11px] font-bold text-[#1E120D] mb-1">Área (ha) *</label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.01"
                    required
                    value={formData.areaHa || ''}
                    onChange={(e) => setFormData({ ...formData, areaHa: parseFloat(e.target.value) || 0 })}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs font-black text-[#8E1057] focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  />
                </div>
              </div>

              {/* Confirmação Independente: Plasticultura vs. Estrutura */}
              <div className="p-3 bg-[#FAF6F8] rounded-xl border border-[#F0E4EB] space-y-2">
                <div className="text-xs font-bold text-[#8E1057] flex items-center gap-1.5">
                  <Warehouse className="w-4 h-4" />
                  Separação Independente de Área (Plasticultura vs. Estrutura)
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[10px] font-bold text-[#1E120D] mb-1">
                      Plasticultura (Plástico Instalado)
                    </label>
                    <select
                      value={formData.plasticulturaConfirmada || 'Pendente de confirmação'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          plasticulturaConfirmada: e.target.value as AreaConfirmationStatus
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white border border-[#F0E4EB] text-xs font-semibold text-[#1E120D] focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                    >
                      <option value="Confirmado">Confirmado (Possui Plástico)</option>
                      <option value="Não Possui">Não Possui Plástico</option>
                      <option value="Pendente de confirmação">Pendente de confirmação</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold text-[#1E120D] mb-1">
                      Estrutura Física (Parral / Cobertura)
                    </label>
                    <select
                      value={formData.estruturaConfirmada || 'Pendente de confirmação'}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          estruturaConfirmada: e.target.value as AreaConfirmationStatus
                        })
                      }
                      className="w-full px-3 py-2 rounded-lg bg-white border border-[#F0E4EB] text-xs font-semibold text-[#1E120D] focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                    >
                      <option value="Pendente de confirmação">Pendente de confirmação</option>
                      <option value="Confirmado">Confirmado (Possui Estrutura)</option>
                      <option value="Não Possui">Não Possui Estrutura</option>
                    </select>
                  </div>
                </div>
                <p className="text-[10px] text-[#1E120D]/65">
                  Campos independentes: confirmar estrutura não presume plástico instalado e vice-versa.
                </p>
              </div>

              {/* Seção das Três Coberturas Históricas */}
              <div className="p-3 bg-[#FAF6F8] rounded-xl border border-[#F0E4EB] space-y-3">
                <div className="text-xs font-bold text-[#8E1057] flex items-center gap-1.5">
                  <Calendar className="w-4 h-4" />
                  Histórico Oficial das Três Coberturas
                </div>

                {/* 1ª Cobertura */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#1E120D]/70 mb-0.5">1ª Data</label>
                    <input
                      type="text"
                      placeholder="dd/mm/aaaa ou aaaa"
                      value={formData.data1 || ''}
                      onChange={(e) => setFormData({ ...formData, data1: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#F0E4EB] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#1E120D]/70 mb-0.5">1ª Cobertura</label>
                    <input
                      type="text"
                      placeholder="ex: Serroplast"
                      value={formData.cobertura1 || ''}
                      onChange={(e) => setFormData({ ...formData, cobertura1: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#F0E4EB] text-xs font-medium"
                    />
                  </div>
                </div>

                {/* 2ª Cobertura */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#1E120D]/70 mb-0.5">2ª Data</label>
                    <input
                      type="text"
                      placeholder="dd/mm/aaaa ou aaaa"
                      value={formData.data2 || ''}
                      onChange={(e) => setFormData({ ...formData, data2: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#F0E4EB] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#1E120D]/70 mb-0.5">2ª Cobertura</label>
                    <input
                      type="text"
                      placeholder="ex: Serroplast / Outro"
                      value={formData.cobertura2 || ''}
                      onChange={(e) => setFormData({ ...formData, cobertura2: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#F0E4EB] text-xs font-medium"
                    />
                  </div>
                </div>

                {/* 3ª Cobertura */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  <div>
                    <label className="block text-[10px] font-semibold text-[#1E120D]/70 mb-0.5">3ª Data</label>
                    <input
                      type="text"
                      placeholder="dd/mm/aaaa ou aaaa"
                      value={formData.data3 || ''}
                      onChange={(e) => setFormData({ ...formData, data3: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#F0E4EB] text-xs"
                    />
                  </div>
                  <div>
                    <label className="block text-[10px] font-semibold text-[#1E120D]/70 mb-0.5">3ª Cobertura</label>
                    <input
                      type="text"
                      placeholder="ex: Serroplast"
                      value={formData.cobertura3 || ''}
                      onChange={(e) => setFormData({ ...formData, cobertura3: e.target.value })}
                      className="w-full px-3 py-1.5 rounded-lg bg-white border border-[#F0E4EB] text-xs font-medium"
                    />
                  </div>
                </div>
              </div>

              {/* Informação / Observações */}
              <div>
                <label className="block text-[11px] font-bold text-[#1E120D] mb-1">Informações Adicionais / Observações</label>
                <textarea
                  rows={2}
                  placeholder="Observações do documento oficial ou anotações técnicas..."
                  value={formData.informacao || ''}
                  onChange={(e) => setFormData({ ...formData, informacao: e.target.value })}
                  className="w-full px-3 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                />
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-[#F0E4EB]">
                <div className="flex items-center gap-2">
                  <input
                    type="checkbox"
                    id="checkbox-ativo"
                    checked={formData.ativo}
                    onChange={(e) => setFormData({ ...formData, ativo: e.target.checked })}
                    className="rounded text-[#8E1057] focus:ring-[#8E1057]"
                  />
                  <label htmlFor="checkbox-ativo" className="text-xs font-semibold text-[#1E120D]">
                    Registro Ativo no Histórico
                  </label>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition"
                  >
                    Cancelar
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-[#8E1057] hover:bg-[#750D48] text-white text-xs font-bold rounded-xl transition shadow-xs"
                  >
                    {editingRecord ? 'Atualizar Registro' : 'Salvar no Banco'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL 2: INATIVAÇÃO SEM PERDER HISTÓRICO */}
      {isInactivateModalOpen && inactivatingRecord && (
        <div className="fixed inset-0 bg-[#1E120D]/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#F0E4EB] animate-scale-up">
            <div className="flex items-center gap-3 pb-3 border-b border-[#F0E4EB]">
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${
                inactivatingRecord.ativo ? 'bg-amber-100 text-amber-800' : 'bg-emerald-100 text-emerald-800'
              }`}>
                <PowerOff className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-[#1E120D] text-base">
                  {inactivatingRecord.ativo ? 'Inativar Registro' : 'Reativar Registro'}
                </h3>
                <p className="text-xs text-stone-500">
                  [{inactivatingRecord.sigla}] Parcela {inactivatingRecord.parcela} • {inactivatingRecord.variedade}
                </p>
              </div>
            </div>

            <div className="py-4 space-y-3">
              <p className="text-xs text-[#1E120D]/80 leading-relaxed">
                {inactivatingRecord.ativo ? (
                  <>
                    O registro <strong>não será excluído</strong> do banco de dados, preservando todo o histórico original e cálculos de auditoria.
                  </>
                ) : (
                  <>
                    Deseja reativar este registro para voltar a contabilizar ativamente nas estatísticas de campo?
                  </>
                )}
              </p>

              {inactivatingRecord.ativo && (
                <div>
                  <label className="block text-[11px] font-bold text-[#1E120D] mb-1">
                    Motivo da Inativação:
                  </label>
                  <textarea
                    rows={3}
                    placeholder="ex: Parcela replantada, cobertura removida definitivamente, etc."
                    value={inactivationReason}
                    onChange={(e) => setInactivationReason(e.target.value)}
                    className="w-full px-3 py-2 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  />
                </div>
              )}
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0E4EB]">
              <button
                onClick={() => setIsInactivateModalOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleConfirmStatusChange}
                className={`px-4 py-2 text-white text-xs font-bold rounded-xl transition shadow-xs ${
                  inactivatingRecord.ativo 
                    ? 'bg-amber-600 hover:bg-amber-700' 
                    : 'bg-emerald-600 hover:bg-emerald-700'
                }`}
              >
                {inactivatingRecord.ativo ? 'Confirmar Inativação' : 'Confirmar Reativação'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 3: REIMPORTAR BASE OFICIAL COM PROTEÇÃO CONTRA DUPLICATAS */}
      {isReimportModalOpen && (
        <div className="fixed inset-0 bg-[#1E120D]/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#F0E4EB] animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E4EB]">
              <div className="flex items-center gap-2">
                <RefreshCw className="w-5 h-5 text-[#8E1057]" />
                <h3 className="font-bold text-[#1E120D] text-base">
                  Sincronizar Base Oficial Serroplast
                </h3>
              </div>
              <button 
                onClick={() => setIsReimportModalOpen(false)}
                className="text-[#1E120D]/40 hover:text-[#1E120D] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3">
              <div className="p-3 bg-pink-50 rounded-xl border border-pink-200 text-xs text-[#8E1057] space-y-1">
                <div className="font-bold flex items-center gap-1.5">
                  <ShieldCheck className="w-4 h-4 text-[#8E1057]" />
                  Proteção Ativa Contra Duplicidade
                </div>
                <p className="text-[11px] leading-relaxed text-[#1E120D]/80">
                  O sistema confere cada registro pela chave <strong>Fazenda + Setor + Parcela + Variedade</strong>.
                  Nenhum registro existente será duplicado. Parcelas com variedades diferentes na mesma área serão preservadas individualmente.
                </p>
              </div>

              <div className="text-xs text-[#1E120D]/80 space-y-1">
                <p>Fonte Oficial: <strong>PLASTICULTURA - FAZENDAS - OFICIAL DATAS</strong></p>
                <p>Registros a sincronizar: <strong>77 parcelas</strong></p>
                <p>Área total oficial: <strong>273,27 hectares</strong></p>
              </div>
            </div>

            <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#F0E4EB]">
              <button
                onClick={() => setIsReimportModalOpen(false)}
                className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-700 text-xs font-bold rounded-xl transition"
              >
                Cancelar
              </button>
              <button
                onClick={handleExecuteReimport}
                className="px-4 py-2 bg-[#8E1057] hover:bg-[#750D48] text-white text-xs font-bold rounded-xl transition shadow-xs flex items-center gap-1.5"
              >
                <Check className="w-4 h-4" />
                Confirmar Sincronização
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL 4: DETALHES COMPLETOS DA PARCELA */}
      {viewDetailRecord && (
        <div className="fixed inset-0 bg-[#1E120D]/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#F0E4EB] animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E4EB]">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E1057]">
                  Ficha Técnica da Parcela
                </span>
                <h3 className="font-extrabold text-[#1E120D] text-lg">
                  {viewDetailRecord.fazendaNome} ({viewDetailRecord.sigla}) • Parcela {viewDetailRecord.parcela}
                </h3>
              </div>
              <button 
                onClick={() => setViewDetailRecord(null)}
                className="text-[#1E120D]/40 hover:text-[#1E120D] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs">
              <div className="grid grid-cols-2 gap-2 bg-[#FAF6F8] p-3 rounded-xl border border-[#F0E4EB]">
                <div>
                  <span className="text-stone-500 text-[10px] block">Setor da Fazenda</span>
                  <span className="font-bold text-[#1E120D]">Setor {viewDetailRecord.setorFazenda}</span>
                </div>
                <div>
                  <span className="text-stone-500 text-[10px] block">Setor Interno</span>
                  <span className="font-bold text-[#1E120D]">{viewDetailRecord.setorInterno || '—'}</span>
                </div>
                <div>
                  <span className="text-stone-500 text-[10px] block">Supervisor</span>
                  <span className="font-bold text-[#1E120D]">{viewDetailRecord.supervisor || '—'}</span>
                </div>
                <div>
                  <span className="text-stone-500 text-[10px] block">Variedade</span>
                  <span className="font-bold text-[#8E1057]">{viewDetailRecord.variedade}</span>
                </div>
                <div>
                  <span className="text-stone-500 text-[10px] block">Área Registrada</span>
                  <span className="font-black text-[#8E1057] text-sm">{viewDetailRecord.areaHa.toFixed(2).replace('.', ',')} ha</span>
                </div>
                <div>
                  <span className="text-stone-500 text-[10px] block">Status Atual</span>
                  <span className="font-bold">{viewDetailRecord.ativo ? '✅ Ativo' : '⚠️ Inativo'}</span>
                </div>
                <div>
                  <span className="text-stone-500 text-[10px] block">Plasticultura (Plástico)</span>
                  <span className="font-bold text-[#8E1057]">
                    {resolveSerroplastPlasticulturaStatus(viewDetailRecord)}
                  </span>
                </div>
                <div>
                  <span className="text-stone-500 text-[10px] block">Estrutura Física</span>
                  <span className="font-bold text-[#1E120D]">
                    {resolveSerroplastEstruturaStatus(viewDetailRecord)}
                  </span>
                </div>
              </div>

              <div className="space-y-2 border-t border-[#F0E4EB] pt-3">
                <h4 className="font-bold text-[#8E1057] text-xs">Coberturas e Substituições</h4>
                <div className="space-y-1.5 text-[11px]">
                  <div className="flex justify-between p-2 rounded-lg bg-stone-50">
                    <span className="font-semibold">1ª Cobertura:</span>
                    <span>{viewDetailRecord.cobertura1 || '—'} ({viewDetailRecord.data1 || 'sem data'})</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-stone-50">
                    <span className="font-semibold">2ª Cobertura:</span>
                    <span>{viewDetailRecord.cobertura2 || '—'} ({viewDetailRecord.data2 || 'sem data'})</span>
                  </div>
                  <div className="flex justify-between p-2 rounded-lg bg-stone-50">
                    <span className="font-semibold">3ª Cobertura:</span>
                    <span>{viewDetailRecord.cobertura3 || '—'} ({viewDetailRecord.data3 || 'sem data'})</span>
                  </div>
                </div>
              </div>

              {viewDetailRecord.informacao && (
                <div className="border-t border-[#F0E4EB] pt-3">
                  <h4 className="font-bold text-[#8E1057] text-xs mb-1">Informações / Notas</h4>
                  <p className="p-2.5 rounded-xl bg-amber-50/70 border border-amber-200 text-amber-900 text-[11px] leading-relaxed">
                    {viewDetailRecord.informacao}
                  </p>
                </div>
              )}

              {viewDetailRecord.motivoInativacao && (
                <div className="border-t border-[#F0E4EB] pt-3">
                  <h4 className="font-bold text-stone-600 text-xs mb-1">Motivo da Inativação</h4>
                  <p className="p-2 rounded-lg bg-stone-100 text-stone-700 text-[11px]">
                    {viewDetailRecord.motivoInativacao}
                  </p>
                </div>
              )}
            </div>

            <div className="pt-3 border-t border-[#F0E4EB] flex justify-end">
              <button
                onClick={() => setViewDetailRecord(null)}
                className="px-4 py-2 bg-[#8E1057] text-white text-xs font-bold rounded-xl"
              >
                Fechar
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
