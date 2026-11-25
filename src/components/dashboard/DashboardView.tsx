import React, { useMemo } from 'react';
import { useApp } from '../../context/AppContext';
import { ActiveTab } from '../layout/Sidebar';
import { FarmAreaSummaryTable } from '../common/FarmAreaSummaryTable';
import { resolveSerroplastPlasticulturaStatus } from '../../utils/farmAreaSummary';
import { 
  Leaf, 
  FileSpreadsheet, 
  CheckCircle2, 
  ArrowDownToDot, 
  AlertTriangle,
  ArrowRight,
  Layers
} from 'lucide-react';

interface DashboardViewProps {
  onNavigate: (tab: ActiveTab) => void;
  onOpenStockModal: () => void;
}

export const DashboardView: React.FC<DashboardViewProps> = ({ onNavigate }) => {
  const { kpis, farms, serroplastRecords, hasPermission } = useApp();
  const canViewCoveredAreas = hasPermission('access_covered_areas');
  const canAccessCatalogs = hasPermission('access_catalogs');
  const canCreate = hasPermission('create_records');

  const serroplastBreakdown = useMemo(() => {
    const defs = [
      { sigla: 'VDU', nome: 'Vale das Uvas', totalArea: 165.0, badgeColor: 'bg-[#4A072E]', barColor: 'bg-[#4A072E]' },
      { sigla: 'LBR', nome: 'Labrunier II', totalArea: 140.0, badgeColor: 'bg-[#5A0A37]', barColor: 'bg-[#5A0A37]' },
      { sigla: 'BRU', nome: 'Brasil Uvas', totalArea: 210.0, badgeColor: 'bg-[#8E1057]', barColor: 'bg-[#8E1057]' },
      { sigla: 'LAB', nome: 'Labrunier I', totalArea: 185.0, badgeColor: 'bg-[#D65F95]', barColor: 'bg-[#D65F95]' }
    ].filter(d => farms.some(f => f.code === d.sigla));

    const confirmedActive = serroplastRecords.filter(
      r => r.ativo && resolveSerroplastPlasticulturaStatus(r) === 'Confirmado'
    );

    const totalHa = Number(confirmedActive.reduce((s, r) => s + (Number(r.areaHa) || 0), 0).toFixed(2));

    const items = defs.map(d => {
      const farmObj = farms.find(f => f.code === d.sigla);
      const farmTotalArea = farmObj?.totalHectares || d.totalArea;
      const areaHa = Number(
        confirmedActive
          .filter(r => r.sigla === d.sigla)
          .reduce((s, r) => s + (Number(r.areaHa) || 0), 0)
          .toFixed(2)
      );
      const sharePct = totalHa > 0 ? (areaHa / totalHa) * 100 : 0;
      const farmPct = farmTotalArea > 0 ? (areaHa / farmTotalArea) * 100 : 0;
      return { ...d, areaHa, sharePct, farmPct };
    });

    return { totalHa, items };
  }, [serroplastRecords, farms]);

  return (
    <div className="space-y-6 text-[#1E120D]">
      {/* Banner Principal com Identidade Corporativa El Ciruelo */}
      <div className="bg-gradient-to-r from-[#4A072E] via-[#5A0A37] to-[#8E1057] rounded-2xl p-6 text-white shadow-md border border-[#D65F95]/30">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="flex items-center gap-2 text-pink-200 text-xs font-semibold tracking-wider uppercase mb-1">
              <Leaf className="w-4 h-4 text-[#D65F95]" />
              El Ciruelo Brasil • Gestão de Plasticultura
            </div>
            <h2 className="text-xl sm:text-2xl font-extrabold tracking-tight text-white">
              Painel Geral de Cobertura Agrícola
            </h2>
            <p className="text-pink-100/90 text-xs sm:text-sm mt-1 max-w-2xl">
              Estrutura Oficial: <strong>Fazenda &gt; Setor &gt; Parcela</strong>. Acompanhe hectares cobertos, descobertos, histórico de substituições e dados do PDF oficial de datas.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {canAccessCatalogs && canCreate && (
              <button
                onClick={() => onNavigate('import')}
                className="flex items-center gap-2 bg-[#D65F95] hover:bg-[#c44f84] text-white font-bold px-4 py-2.5 rounded-xl text-xs sm:text-sm shadow-md transition"
              >
                <FileSpreadsheet className="w-4 h-4" />
                <span>Importar PDF Oficial</span>
              </button>
            )}
            {canAccessCatalogs && (
              <button
                onClick={() => onNavigate('farms')}
                className="flex items-center gap-2 bg-white/10 hover:bg-white/20 text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm border border-white/20 transition"
              >
                <CheckCircle2 className="w-4 h-4 text-pink-200" />
                <span>Confirmar Situações</span>
              </button>
            )}
            {canCreate && (
              <button
                onClick={() => onNavigate('installation')}
                className="flex items-center gap-2 bg-[#8E1057] hover:bg-[#750D48] text-white font-semibold px-4 py-2.5 rounded-xl text-xs sm:text-sm border border-[#D65F95]/40 shadow-xs transition"
              >
                <ArrowDownToDot className="w-4 h-4" />
                <span>Nova Instalação</span>
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Alerta de Duplicidades Preservadas do Documento Oficial */}
      {kpis.duplicateParcelsCount > 0 && (
        <div className="bg-amber-50 border border-amber-300 rounded-xl p-4 flex items-start justify-between gap-3 text-amber-900 shadow-xs">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
            <div>
              <p className="text-sm font-bold">
                Conferência Pendente: {kpis.duplicateParcelsCount} {kpis.duplicateParcelsCount === 1 ? 'parcela possui' : 'parcelas possuem'} registros com variedades diferentes no documento oficial!
              </p>
              <p className="text-xs text-amber-800 mt-0.5">
                Conforme as regras, todos os registros originais foram preservados sem exclusão automática para auditoria e conferência técnica.
              </p>
            </div>
          </div>
          <button
            onClick={() => onNavigate('farms')}
            className="shrink-0 text-xs font-semibold bg-amber-600 text-white px-3 py-1.5 rounded-lg hover:bg-amber-700 transition"
          >
            Conferir Parcelas
          </button>
        </div>
      )}

      {/* KPIs de Hectares e Cobertura Operacional */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {/* 1. Hectares Efetivamente Cobertos */}
        <div className="bg-white border border-[#F0E4EB] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E1057]">
              Hectares Cobertos
            </span>
            <div className="p-2 rounded-lg bg-[#FAF6F8] text-[#8E1057] border border-[#D65F95]/30">
              <CheckCircle2 className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#8E1057]">
            {kpis.coveredHectares.toFixed(1)} <span className="text-xs font-semibold text-[#1E120D]/60">ha</span>
          </div>
          <div className="flex items-center gap-1.5 mt-1 text-[11px] text-[#8E1057] font-semibold">
            <span className="px-1.5 py-0.5 rounded bg-[#FAF6F8] border border-[#D65F95]/30">{kpis.coverageRatePercentage}% da área produtiva</span>
          </div>
        </div>

        {/* 2. Hectares Descobertos */}
        <div className="bg-white border border-[#F0E4EB] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E120D]/70">
              Hectares Descobertos
            </span>
            <div className="p-2 rounded-lg bg-[#FAF6F8] text-[#1E120D]/80">
              <Leaf className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#1E120D]">
            {kpis.uncoveredHectares.toFixed(1)} <span className="text-xs font-semibold text-[#1E120D]/60">ha</span>
          </div>
          <p className="text-[11px] text-[#1E120D]/60 mt-1">
            {kpis.uncoveredParcelsCount} parcelas em repouso/poda
          </p>
        </div>

        {/* 3. Hectares A Confirmar */}
        <div className="bg-white border border-[#F0E4EB] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-amber-700">
              Área A Confirmar
            </span>
            <div className="p-2 rounded-lg bg-amber-100 text-amber-800">
              <AlertTriangle className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-amber-800">
            {kpis.toConfirmHectares.toFixed(1)} <span className="text-xs font-semibold text-[#1E120D]/60">ha</span>
          </div>
          <p className="text-[11px] text-amber-700 font-semibold mt-1">
            {kpis.toConfirmParcelsCount} parcelas pendentes de vistoria
          </p>
        </div>

        {/* 4. Total de Parcelas */}
        <div className="bg-white border border-[#F0E4EB] rounded-xl p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E120D]/70">
              Total de Parcelas
            </span>
            <div className="p-2 rounded-lg bg-[#FAF6F8] text-[#8E1057]">
              <Layers className="w-4 h-4" />
            </div>
          </div>
          <div className="text-xl sm:text-2xl font-black text-[#1E120D]">
            {kpis.totalParcelsCount} <span className="text-xs font-semibold text-[#1E120D]/60">parcelas</span>
          </div>
          <p className="text-[11px] text-[#1E120D]/60 mt-1">
            {kpis.totalHectares.toFixed(1)} ha cadastrados no sistema
          </p>
        </div>
      </div>

      {/* 4 KPIs de Metragens e Reuso */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3.5 sm:gap-4">
        {/* Metros em Campo Ativo */}
        <div className="bg-white border border-[#F0E4EB] rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E1057] block mb-1">
            Metros Instalados (Campo)
          </span>
          <div className="text-lg sm:text-xl font-black text-[#5A0A37]">
            {kpis.totalMetersInstalledActive.toLocaleString('pt-BR')} <span className="text-xs font-normal">m</span>
          </div>
          <span className="text-[10px] text-[#1E120D]/60 mt-0.5 block">Filmes ativos em campo</span>
        </div>

        {/* Metros em Estoque */}
        <div className="bg-white border border-[#F0E4EB] rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E1057] block mb-1">
            Saldo em Almoxarifado
          </span>
          <div className="text-lg sm:text-xl font-black text-[#8E1057]">
            {kpis.totalMetersInStock.toLocaleString('pt-BR')} <span className="text-xs font-normal">m</span>
          </div>
          <div className="text-[10px] text-[#1E120D]/70 mt-0.5 flex items-center gap-1.5">
            <span className="text-[#8E1057] font-semibold">{kpis.totalMetersInStockNew.toLocaleString('pt-BR')}m Novo</span>
            <span>•</span>
            <span className="text-[#D65F95] font-semibold">{kpis.totalMetersInStockReused.toLocaleString('pt-BR')}m Reuso</span>
          </div>
        </div>

        {/* Taxa de Reutilização */}
        <div className="bg-white border border-[#F0E4EB] rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-[#8E1057] block mb-1">
            Taxa de Reuso
          </span>
          <div className="text-lg sm:text-xl font-black text-[#8E1057]">
            {kpis.reuseRatePercentage}% <span className="text-xs font-normal text-[#1E120D]/60">({kpis.totalMetersReused.toLocaleString('pt-BR')} m)</span>
          </div>
          <span className="text-[10px] text-[#8E1057] font-semibold mt-0.5 block">Economia de R$ {kpis.totalSavedFromReuse.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>

        {/* Perdas / Descarte */}
        <div className="bg-white border border-[#F0E4EB] rounded-xl p-4 shadow-xs">
          <span className="text-[10px] font-bold uppercase tracking-wider text-rose-700 block mb-1">
            Perdas & Descarte
          </span>
          <div className="text-lg sm:text-xl font-black text-rose-700">
            {kpis.lossRatePercentage}% <span className="text-xs font-normal text-[#1E120D]/60">({kpis.totalMetersDiscarded.toLocaleString('pt-BR')} m)</span>
          </div>
          <span className="text-[10px] text-rose-600 font-semibold mt-0.5 block">Prejuízo de R$ {kpis.totalLossFromDiscard.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
        </div>
      </div>

      {/* Tabela Independente: Área com Plasticultura vs. Área com Estrutura por Fazenda */}
      {canViewCoveredAreas && <FarmAreaSummaryTable />}

      {/* Painel Especial Oficial: Cobertura com Plástico Serroplast (ha) */}
      {canViewCoveredAreas && (
      <div className="bg-white border border-[#F0E4EB] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-[#F0E4EB]">
          <div>
            <div className="flex items-center gap-2 text-xs font-bold text-[#8E1057] uppercase tracking-wider mb-1">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8E1057] animate-pulse" />
              Filme Oficial de Parral • Serroplast Especial Uva
            </div>
            <h3 className="font-extrabold text-[#1E120D] text-base sm:text-lg">
              Área Coberta com Plástico Serroplast por Fazenda
            </h3>
            <p className="text-xs text-[#1E120D]/60 mt-0.5">
              Consolidação dinâmica de{' '}
              <strong>
                {serroplastBreakdown.totalHa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} hectares
              </strong>{' '}
              confirmados com filmes Serroplast nas 4 fazendas do grupo.
            </p>
          </div>

          <div className="flex items-center gap-4 bg-[#FAF6F8] p-3 rounded-xl border border-[#F0E4EB]">
            <div className="text-right">
              <span className="text-[10px] font-bold text-[#1E120D]/60 uppercase tracking-wider block">
                Total Geral Serroplast
              </span>
              <span className="text-2xl font-black text-[#8E1057]">
                {serroplastBreakdown.totalHa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                <span className="text-xs font-semibold text-[#1E120D]/70">ha</span>
              </span>
            </div>
            <button
              onClick={() => onNavigate('serroplast')}
              className="text-xs font-bold bg-[#8E1057] hover:bg-[#750D48] text-white px-3 py-2 rounded-xl transition flex items-center gap-1.5 shadow-xs"
            >
              <span>Histórico Completo</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* 4 Cards das Fazendas com as áreas dinâmicas */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5">
          {serroplastBreakdown.items.map(item => (
            <div key={item.sigla} className="p-3.5 rounded-xl border border-[#F0E4EB] bg-[#FAF6F8]/70 hover:bg-[#FAF6F8] transition">
              <div className="flex items-center justify-between mb-2">
                <span className={`text-[10px] font-black px-2 py-0.5 rounded text-white ${item.badgeColor}`}>
                  {item.sigla}
                </span>
                <span className="text-xs font-bold text-[#8E1057]">
                  {item.sharePct.toFixed(1).replace('.', ',')}% do Serroplast
                </span>
              </div>
              <h4 className="font-bold text-sm text-[#1E120D]">{item.nome}</h4>
              <div className="mt-2 flex items-baseline justify-between">
                <span className="text-xl font-black text-[#8E1057]">
                  {item.areaHa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha
                </span>
                <span className="text-[11px] text-[#1E120D]/60">
                  {item.farmPct.toFixed(1).replace('.', ',')}% da fazenda
                </span>
              </div>
              <div className="h-1.5 w-full bg-[#F0E4EB] rounded-full overflow-hidden mt-2">
                <div className={`h-full rounded-full ${item.barColor}`} style={{ width: `${item.sharePct.toFixed(2)}%` }} />
              </div>
            </div>
          ))}
        </div>

        {/* Barra de Distribuição Comparativa */}
        <div className="pt-2">
          <div className="h-3 w-full bg-[#FAF6F8] border border-[#F0E4EB] rounded-full overflow-hidden flex">
            {serroplastBreakdown.items.map(item => (
              <div
                key={item.sigla}
                style={{ width: `${item.sharePct.toFixed(2)}%` }}
                className={`${item.barColor} h-full`}
                title={`${item.nome} (${item.sigla}): ${item.areaHa.toLocaleString('pt-BR', { minimumFractionDigits: 2 })} ha (${item.sharePct.toFixed(2).replace('.', ',')}%)`}
              />
            ))}
          </div>

          <div className="flex flex-wrap items-center justify-between gap-2 mt-2 text-[11px] text-[#1E120D]/80">
            {serroplastBreakdown.items.map(item => (
              <span key={item.sigla} className="flex items-center gap-1.5">
                <span className={`w-2.5 h-2.5 rounded inline-block ${item.barColor}`} />
                <strong>{item.sigla}:</strong>{' '}
                {item.areaHa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha (
                {item.sharePct.toFixed(1).replace('.', ',')}%)
              </span>
            ))}
            <span className="font-extrabold text-[#8E1057] ml-auto">
              TOTAL:{' '}
              {serroplastBreakdown.totalHa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha
            </span>
          </div>
        </div>
      </div>
      )}
    </div>
  );
};
