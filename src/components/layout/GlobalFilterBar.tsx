import React from 'react';
import { useApp } from '../../context/AppContext';
import { Filter, RotateCcw, AlertTriangle } from 'lucide-react';

export const GlobalFilterBar: React.FC = () => {
  const { 
    farms, 
    sectors, 
    parcels, 
    plastics, 
    filters, 
    setFilters, 
    resetFilters,
    kpis,
    isFarmRestricted
  } = useApp();

  // Dynamic sectors for the selected farm
  const availableSectors = filters.farmId === 'all' 
    ? sectors 
    : sectors.filter(s => s.farmId === filters.farmId);

  // Unique supervisors and varieties
  const relevantParcels = parcels.filter(p => filters.farmId === 'all' || p.farmId === filters.farmId);
  const uniqueSupervisors = Array.from(new Set(relevantParcels.map(p => p.supervisor).filter(Boolean))).sort();
  const uniqueVarieties = Array.from(new Set(relevantParcels.map(p => p.variety).filter(Boolean))).sort();

  const hasActiveFilters = 
    (!isFarmRestricted && filters.farmId !== 'all') || 
    filters.sector !== 'all' || 
    filters.supervisor !== 'all' || 
    filters.variety !== 'all' || 
    filters.situation !== 'ALL' ||
    filters.plasticId !== 'all' ||
    filters.hasDuplicatesOnly;

  return (
    <div className="bg-white border border-[#F0E4EB] rounded-xl p-3.5 mb-6 shadow-xs">
      <div className="flex flex-wrap items-center justify-between gap-3 mb-3">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-[#FAF6F8] text-[#8E1057] border border-[#D65F95]/30">
            <Filter className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold uppercase tracking-wider text-[#1E120D]">
              Filtros Operacionais por Área
            </h3>
            <p className="text-[11px] text-[#1E120D]/60">
              Estrutura Oficial: Fazenda &gt; Setor &gt; Parcela (com Supervisor e Variedade)
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {kpis.duplicateParcelsCount > 0 && (
            <button
              onClick={() => setFilters(prev => ({ ...prev, hasDuplicatesOnly: !prev.hasDuplicatesOnly }))}
              className={`flex items-center gap-1.5 text-xs px-2.5 py-1 rounded-lg border font-semibold transition ${
                filters.hasDuplicatesOnly 
                  ? 'bg-amber-600 text-white border-amber-700 shadow-xs' 
                  : 'bg-amber-50 text-amber-900 border-amber-200 hover:bg-amber-100'
              }`}
            >
              <AlertTriangle className="w-3.5 h-3.5 text-amber-700" />
              <span>{kpis.duplicateParcelsCount} com Duplicidade para Conferir</span>
            </button>
          )}

          {hasActiveFilters && (
            <button
              onClick={resetFilters}
              className="flex items-center gap-1.5 text-xs text-[#8E1057] hover:text-[#750D48] bg-[#FAF6F8] hover:bg-pink-100/60 px-2.5 py-1 rounded-lg border border-[#D65F95]/40 font-medium transition"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Limpar Filtros</span>
            </button>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-2.5 text-xs">
        {/* 1. Fazenda */}
        <div>
          <label className="block text-[11px] font-semibold text-[#1E120D]/80 mb-1">
            Fazenda {isFarmRestricted && <span className="text-[#8E1057]">(Vinculada)</span>}
          </label>
          <select
            value={filters.farmId}
            disabled={isFarmRestricted}
            onChange={(e) => {
              const farmId = e.target.value;
              setFilters(prev => ({
                ...prev,
                farmId,
                sector: 'all',
                supervisor: 'all',
                variety: 'all'
              }));
            }}
            className="w-full bg-[#FAF6F8] border border-[#F0E4EB] rounded-lg px-2.5 py-1.5 text-[#1E120D] focus:outline-none focus:ring-1 focus:ring-[#8E1057] font-medium disabled:opacity-80 disabled:cursor-not-allowed"
          >
            {!isFarmRestricted && <option value="all">Todas as 4 Fazendas</option>}
            {farms.map(farm => (
              <option key={farm.id} value={farm.id}>
                {farm.name} ({farm.code})
              </option>
            ))}
          </select>
        </div>

        {/* 2. Setor */}
        <div>
          <label className="block text-[11px] font-semibold text-[#1E120D]/80 mb-1">
            Setor
          </label>
          <select
            value={filters.sector}
            onChange={(e) => setFilters(prev => ({ ...prev, sector: e.target.value }))}
            className="w-full bg-[#FAF6F8] border border-[#F0E4EB] rounded-lg px-2.5 py-1.5 text-[#1E120D] focus:outline-none focus:ring-1 focus:ring-[#8E1057] font-medium"
          >
            <option value="all">Todos os Setores</option>
            {availableSectors.map(sec => (
              <option key={sec.id} value={sec.name}>
                {sec.name}
              </option>
            ))}
          </select>
        </div>

        {/* 3. Supervisor */}
        <div>
          <label className="block text-[11px] font-semibold text-[#1E120D]/80 mb-1">
            Supervisor
          </label>
          <select
            value={filters.supervisor}
            onChange={(e) => setFilters(prev => ({ ...prev, supervisor: e.target.value }))}
            className="w-full bg-[#FAF6F8] border border-[#F0E4EB] rounded-lg px-2.5 py-1.5 text-[#1E120D] focus:outline-none focus:ring-1 focus:ring-[#8E1057] font-medium"
          >
            <option value="all">Todos os Supervisores</option>
            {uniqueSupervisors.map(sup => (
              <option key={sup} value={sup}>
                {sup}
              </option>
            ))}
          </select>
        </div>

        {/* 4. Variedade */}
        <div>
          <label className="block text-[11px] font-semibold text-[#1E120D]/80 mb-1">
            Variedade
          </label>
          <select
            value={filters.variety}
            onChange={(e) => setFilters(prev => ({ ...prev, variety: e.target.value }))}
            className="w-full bg-[#FAF6F8] border border-[#F0E4EB] rounded-lg px-2.5 py-1.5 text-[#1E120D] focus:outline-none focus:ring-1 focus:ring-[#8E1057] font-medium"
          >
            <option value="all">Todas as Variedades</option>
            {uniqueVarieties.map(v => (
              <option key={v} value={v}>
                {v}
              </option>
            ))}
          </select>
        </div>

        {/* 5. Situação da Cobertura */}
        <div>
          <label className="block text-[11px] font-semibold text-[#1E120D]/80 mb-1">
            Situação da Parcela
          </label>
          <select
            value={filters.situation}
            onChange={(e) => setFilters(prev => ({ ...prev, situation: e.target.value }))}
            className="w-full bg-[#FAF6F8] border border-[#F0E4EB] rounded-lg px-2.5 py-1.5 text-[#1E120D] focus:outline-none focus:ring-1 focus:ring-[#8E1057] font-medium"
          >
            <option value="ALL">Todas as Situações</option>
            <option value="Coberta">Coberta</option>
            <option value="Descoberta">Descoberta</option>
            <option value="A Confirmar">A Confirmar</option>
          </select>
        </div>

        {/* 6. Material Plástico */}
        <div>
          <label className="block text-[11px] font-semibold text-[#1E120D]/80 mb-1">
            Plástico Instalado
          </label>
          <select
            value={filters.plasticId}
            onChange={(e) => setFilters(prev => ({ ...prev, plasticId: e.target.value }))}
            className="w-full bg-[#FAF6F8] border border-[#F0E4EB] rounded-lg px-2.5 py-1.5 text-[#1E120D] focus:outline-none focus:ring-1 focus:ring-[#8E1057] font-medium"
          >
            <option value="all">Todos os Plásticos</option>
            {plastics.map(plastic => (
              <option key={plastic.id} value={plastic.id}>
                {plastic.name}
              </option>
            ))}
          </select>
        </div>
      </div>
    </div>
  );
};
