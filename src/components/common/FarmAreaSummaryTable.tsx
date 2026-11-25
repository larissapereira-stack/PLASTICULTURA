import React, { useState, useMemo, useEffect } from 'react';
import { useApp } from '../../context/AppContext';
import { AreaConfirmationStatus, ParcelSituation, StructureStatus } from '../../types';
import {
  AreaBreakdownItem,
  CategorySummary,
  DEFAULT_COVERED_HECTARE_VALUE,
  formatBrl,
  parseBrlInput
} from '../../utils/farmAreaSummary';
import {
  Building2,
  Layers,
  Warehouse,
  Search,
  Eye,
  X,
  CheckCircle2,
  Clock,
  Ban,
  ShieldCheck,
  Info,
  CircleDollarSign,
  Pencil,
  Check,
  RotateCcw
} from 'lucide-react';

interface ModalSelection {
  title: string;
  sigla: string; // 'VDU' | 'LAB' | 'BRU' | 'LBR' | 'ALL'
  category: 'plasticultura' | 'estrutura';
}

interface FarmAreaSummaryTableProps {
  compact?: boolean;
}

export const FarmAreaSummaryTable: React.FC<FarmAreaSummaryTableProps> = ({ compact = false }) => {
  const {
    farmAreaSummary,
    coveredHectareValue,
    updateCoveredHectareValue,
    parcels,
    serroplastRecords,
    confirmParcelSituation,
    saveSerroplastRecord,
    canPerform
  } = useApp();

  const [modalSelection, setModalSelection] = useState<ModalSelection | null>(null);
  const [modalTab, setModalTab] = useState<'confirmed' | 'pending' | 'without'>('confirmed');
  const [modalSearch, setModalSearch] = useState('');

  const [isEditingRate, setIsEditingRate] = useState(false);
  const [rateInput, setRateInput] = useState('');
  const [rateError, setRateError] = useState('');

  useEffect(() => {
    if (!isEditingRate) {
      setRateInput(
        coveredHectareValue.toLocaleString('pt-BR', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        })
      );
      setRateError('');
    }
  }, [coveredHectareValue, isEditingRate]);

  const canEdit = canPerform('EDIT_MASTER') || canPerform('INSTALLATION');
  const canEditRate = canPerform('EDIT_MASTER');

  const handleSaveRate = () => {
    const parsed = parseBrlInput(rateInput);
    if (parsed === null) {
      setRateError('Informe um valor válido em reais (ex: 132.228,61).');
      return;
    }
    const res = updateCoveredHectareValue(parsed);
    if (res.success) {
      setIsEditingRate(false);
      setRateError('');
    } else {
      setRateError(res.message);
    }
  };

  const handleRestoreDefaultRate = () => {
    updateCoveredHectareValue(DEFAULT_COVERED_HECTARE_VALUE);
    setIsEditingRate(false);
    setRateError('');
  };

  const openBreakdown = (
    title: string,
    sigla: string,
    category: 'plasticultura' | 'estrutura',
    summary: CategorySummary
  ) => {
    setModalSelection({ title, sigla, category });
    setModalTab(summary.hasConfirmedData ? 'confirmed' : summary.pendingCount > 0 ? 'pending' : 'without');
    setModalSearch('');
  };

  // Re-resolve active modal summary dynamically so updates appear immediately inside the modal
  const activeSummary: CategorySummary | null = useMemo(() => {
    if (!modalSelection) return null;
    if (modalSelection.sigla === 'ALL') {
      return modalSelection.category === 'plasticultura'
        ? farmAreaSummary.totalGeral.plasticultura
        : farmAreaSummary.totalGeral.estrutura;
    }
    const row = farmAreaSummary.rows.find(r => r.sigla === modalSelection.sigla);
    if (!row) return null;
    return modalSelection.category === 'plasticultura' ? row.plasticultura : row.estrutura;
  }, [modalSelection, farmAreaSummary]);

  const activeItems = useMemo(() => {
    if (!activeSummary) return [];
    const list =
      modalTab === 'confirmed'
        ? activeSummary.confirmedItems
        : modalTab === 'pending'
          ? activeSummary.pendingItems
          : activeSummary.withoutItems;

    if (!modalSearch.trim()) return list;
    const q = modalSearch.toLowerCase();
    return list.filter(
      item =>
        item.parcela.toLowerCase().includes(q) ||
        item.setor.toLowerCase().includes(q) ||
        item.variedade.toLowerCase().includes(q) ||
        item.supervisor.toLowerCase().includes(q) ||
        item.fazendaNome.toLowerCase().includes(q) ||
        item.sigla.toLowerCase().includes(q)
    );
  }, [activeSummary, modalTab, modalSearch]);

  const handleQuickStatusUpdate = (item: AreaBreakdownItem, newStatus: AreaConfirmationStatus) => {
    if (!modalSelection) return;
    const isPlastic = modalSelection.category === 'plasticultura';

    if (item.source === 'serroplast') {
      const record = serroplastRecords.find(r => r.id === item.sourceId);
      if (!record) return;
      saveSerroplastRecord({
        ...record,
        ...(isPlastic
          ? { plasticulturaConfirmada: newStatus }
          : { estruturaConfirmada: newStatus }),
        atualizadoEm: new Date().toISOString()
      });
    } else {
      const parcel = parcels.find(p => p.id === item.sourceId);
      if (!parcel) return;
      if (isPlastic) {
        const mappedSituation: ParcelSituation =
          newStatus === 'Confirmado'
            ? 'Coberta'
            : newStatus === 'Não Possui'
              ? 'Descoberta'
              : 'A Confirmar';
        confirmParcelSituation({
          parcelId: parcel.id,
          situation: mappedSituation
        });
      } else {
        const mappedStructure: StructureStatus =
          newStatus === 'Confirmado'
            ? 'Com Estrutura'
            : newStatus === 'Não Possui'
              ? 'Sem Estrutura'
              : 'Pendente de confirmação';
        confirmParcelSituation({
          parcelId: parcel.id,
          situation: parcel.situation,
          structureStatus: mappedStructure
        });
      }
    }
  };

  const renderCategoryCell = (
    summary: CategorySummary,
    farmLabel: string,
    sigla: string,
    category: 'plasticultura' | 'estrutura',
    isTotalRow = false
  ) => {
    const isPlastic = category === 'plasticultura';

    if (!summary.hasConfirmedData) {
      return (
        <div className="flex flex-col items-end gap-1">
          <button
            type="button"
            onClick={() => openBreakdown(farmLabel, sigla, category, summary)}
            className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold border transition cursor-pointer ${
              isTotalRow
                ? 'bg-amber-500/20 text-amber-200 border-amber-400/40 hover:bg-amber-500/30'
                : 'bg-amber-50 text-amber-800 border-amber-200 hover:bg-amber-100'
            }`}
            title="Clique para consultar parcelas pendentes ou confirmar estrutura/plasticultura"
          >
            <Clock className="w-3.5 h-3.5 shrink-0" />
            <span>Pendente de confirmação</span>
            <Eye className="w-3 h-3 opacity-75" />
          </button>
          {summary.pendingCount > 0 && (
            <span className={`text-[10px] ${isTotalRow ? 'text-pink-100/80' : 'text-[#1E120D]/55'}`}>
              {summary.pendingCount} {summary.pendingCount === 1 ? 'parcela pendente' : 'parcelas pendentes'}
            </span>
          )}
        </div>
      );
    }

    return (
      <div className="flex flex-col items-end gap-0.5">
        <button
          type="button"
          onClick={() => openBreakdown(farmLabel, sigla, category, summary)}
          className={`group inline-flex items-center gap-2 px-2.5 py-1 rounded-lg transition cursor-pointer ${
            isTotalRow
              ? 'bg-white/15 hover:bg-white/25 text-white border border-white/20'
              : 'hover:bg-[#FAF6F8] border border-transparent hover:border-[#D65F95]/40'
          }`}
          title="Clique para consultar quais parcelas compõem este total"
        >
          <span
            className={`font-black text-sm sm:text-base tabular-nums ${
              isTotalRow ? 'text-white' : isPlastic ? 'text-[#8E1057]' : 'text-[#1E120D]'
            }`}
          >
            {summary.confirmedHa.toLocaleString('pt-BR', {
              minimumFractionDigits: 2,
              maximumFractionDigits: 2
            })}{' '}
            <span className="text-xs font-semibold opacity-75">ha</span>
          </span>
          <Eye
            className={`w-3.5 h-3.5 transition-opacity ${
              isTotalRow
                ? 'text-pink-200 opacity-85 group-hover:opacity-100'
                : 'text-[#8E1057] opacity-60 group-hover:opacity-100'
            }`}
          />
        </button>

        <div className={`flex items-center gap-1.5 text-[10px] ${isTotalRow ? 'text-pink-100/85' : 'text-[#1E120D]/60'}`}>
          <span className="font-semibold">
            {summary.confirmedCount} {summary.confirmedCount === 1 ? 'parcela' : 'parcelas'}
          </span>
          {summary.pendingCount > 0 && (
            <button
              type="button"
              onClick={() => {
                setModalSelection({ title: farmLabel, sigla, category });
                setModalTab('pending');
                setModalSearch('');
              }}
              className={`underline font-semibold ${
                isTotalRow ? 'text-amber-200 hover:text-white' : 'text-amber-700 hover:text-amber-900'
              }`}
            >
              + {summary.pendingCount} pend.
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-white border border-[#F0E4EB] rounded-2xl shadow-xs overflow-hidden">
      {/* Cabeçalho do Bloco */}
      <div className="p-4 sm:p-5 border-b border-[#F0E4EB] bg-gradient-to-r from-[#FAF6F8] to-white flex flex-col md:flex-row md:items-center justify-between gap-3">
        <div>
          <div className="flex items-center gap-2 text-[11px] font-bold uppercase tracking-wider text-[#8E1057] mb-1">
            <ShieldCheck className="w-4 h-4 text-[#8E1057]" />
            Consolidação Independente por Fazenda • Sem Duplicidade
          </div>
          <h3 className="font-extrabold text-[#1E120D] text-base sm:text-lg">
            Totais Separados: Área com Plasticultura vs. Área com Estrutura
          </h3>
          {!compact && (
            <p className="text-xs text-[#1E120D]/65 mt-0.5 max-w-3xl">
              Os hectares com <strong>plástico instalado</strong> e os hectares que possuem <strong>estrutura física</strong> são apurados em campos independentes, sem presunção automática e sem contagem duplicada. Clique em qualquer valor para consultar as parcelas que compõem o total.
            </p>
          )}
        </div>

        <div className="flex flex-wrap items-center gap-2 shrink-0 text-[11px]">
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FAF6F8] border border-[#D65F95]/30 text-[#8E1057] font-bold">
            <Layers className="w-3.5 h-3.5" />
            Plasticultura: {farmAreaSummary.totalGeral.plasticultura.displayValue}
          </span>
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-[#FAF6F8] border border-[#F0E4EB] text-[#1E120D] font-bold">
            <Warehouse className="w-3.5 h-3.5 text-[#8E1057]" />
            Estrutura: {farmAreaSummary.totalGeral.estrutura.displayValue}
          </span>
        </div>
      </div>

      {/* Barra de Valor por Hectare Coberto (Plasticultura) */}
      <div className="px-4 sm:px-5 py-3 bg-[#FAF6F8]/80 border-b border-[#F0E4EB] flex flex-col lg:flex-row lg:items-center justify-between gap-3">
        <div className="flex items-start sm:items-center gap-2.5">
          <div className="p-2 rounded-xl bg-white border border-[#D65F95]/40 text-[#8E1057] shrink-0">
            <CircleDollarSign className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[11px] font-bold uppercase tracking-wider text-[#8E1057]">
              Valor de Referência por Hectare Coberto (Plasticultura)
            </div>
            <p className="text-[11px] text-[#1E120D]/65">
              Cálculo automático: <strong>hectares cobertos × valor/ha</strong> (aplicado somente às áreas com plasticultura instalada, nunca à estrutura isolada).
            </p>
          </div>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {isEditingRate ? (
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <span className="absolute left-2.5 top-1/2 -translate-y-1/2 text-xs font-bold text-[#8E1057]">
                  R$
                </span>
                <input
                  type="text"
                  value={rateInput}
                  onChange={e => {
                    setRateInput(e.target.value);
                    setRateError('');
                  }}
                  onKeyDown={e => {
                    if (e.key === 'Enter') handleSaveRate();
                    if (e.key === 'Escape') setIsEditingRate(false);
                  }}
                  aria-label="Valor por hectare coberto em reais"
                  className="w-40 pl-8 pr-3 py-1.5 rounded-lg bg-white border border-[#8E1057] text-xs font-black text-[#1E120D] tabular-nums focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  placeholder="132.228,61"
                />
              </div>
              <button
                type="button"
                onClick={handleSaveRate}
                className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg bg-[#8E1057] hover:bg-[#750D48] text-white text-xs font-bold transition cursor-pointer"
              >
                <Check className="w-3.5 h-3.5" />
                <span>Salvar</span>
              </button>
              <button
                type="button"
                onClick={() => {
                  setIsEditingRate(false);
                  setRateError('');
                }}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-stone-100 text-[#1E120D]/75 border border-[#F0E4EB] text-xs font-semibold transition cursor-pointer"
              >
                <X className="w-3.5 h-3.5" />
                <span>Cancelar</span>
              </button>
              {rateError && (
                <span className="text-[11px] font-semibold text-red-700 w-full">{rateError}</span>
              )}
            </div>
          ) : (
            <div className="flex flex-wrap items-center gap-2">
              <div className="px-3 py-1.5 rounded-xl bg-white border border-[#D65F95]/40 text-xs flex items-center gap-2">
                <span className="text-[#1E120D]/60 font-semibold">Referência/ha:</span>
                <span className="font-black text-[#8E1057] tabular-nums text-sm">
                  {formatBrl(coveredHectareValue)}
                </span>
              </div>
              <div className="px-3 py-1.5 rounded-xl bg-[#4A072E] text-white text-xs flex items-center gap-2">
                <span className="text-pink-200 font-semibold">Total Plasticultura:</span>
                <span className="font-black tabular-nums text-sm">
                  {formatBrl(farmAreaSummary.totalGeral.plasticulturaValueBrl)}
                </span>
              </div>
              {canEditRate && (
                <button
                  type="button"
                  onClick={() => setIsEditingRate(true)}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#FAF6F8] text-[#8E1057] border border-[#F0E4EB] text-xs font-bold transition cursor-pointer"
                  title="Alterar valor financeiro por hectare coberto"
                >
                  <Pencil className="w-3.5 h-3.5" />
                  <span>Alterar R$/ha</span>
                </button>
              )}
              {canEditRate && Math.abs(coveredHectareValue - DEFAULT_COVERED_HECTARE_VALUE) > 0.001 && (
                <button
                  type="button"
                  onClick={handleRestoreDefaultRate}
                  className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg bg-white hover:bg-[#FAF6F8] text-[#1E120D]/75 border border-[#F0E4EB] text-xs font-semibold transition cursor-pointer"
                  title="Restaurar referência oficial de R$ 132.228,61"
                >
                  <RotateCcw className="w-3.5 h-3.5" />
                  <span>Padrão</span>
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Tabela Principal */}
      <div className="overflow-x-auto">
        <table className="w-full text-left border-collapse">
          <thead>
            <tr className="bg-[#FAF6F8] border-b border-[#F0E4EB] text-[11px] font-extrabold uppercase tracking-wider text-[#1E120D]/80">
              <th className="py-3.5 px-4 sm:px-5">
                <div className="flex items-center gap-2">
                  <Building2 className="w-4 h-4 text-[#8E1057]" />
                  <span>Fazenda</span>
                </div>
              </th>
              <th className="py-3.5 px-4 sm:px-5 text-right">
                <div className="inline-flex items-center justify-end gap-1.5 text-[#8E1057]">
                  <Layers className="w-4 h-4" />
                  <span>Área com Plasticultura (ha)</span>
                </div>
              </th>
              <th className="py-3.5 px-4 sm:px-5 text-right">
                <div className="inline-flex items-center justify-end gap-1.5 text-[#8E1057]">
                  <CircleDollarSign className="w-4 h-4" />
                  <span>Valor Plasticultura (R$)</span>
                </div>
              </th>
              <th className="py-3.5 px-4 sm:px-5 text-right">
                <div className="inline-flex items-center justify-end gap-1.5 text-[#1E120D]">
                  <Warehouse className="w-4 h-4 text-[#8E1057]" />
                  <span>Área com Estrutura (ha)</span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody className="divide-y divide-[#F0E4EB] text-xs sm:text-sm">
            {farmAreaSummary.rows.map(row => {
              const label = `${row.fazendaNome} (${row.sigla})`;
              return (
                <tr key={row.sigla} className="hover:bg-[#FAF6F8]/80 transition-colors">
                  <td className="py-3.5 px-4 sm:px-5">
                    <div className="flex items-center gap-2.5">
                      <span className="px-2 py-0.5 rounded-md text-[11px] font-black bg-[#8E1057] text-white tracking-wide">
                        {row.sigla}
                      </span>
                      <span className="font-bold text-[#1E120D]">
                        {row.fazendaNome} <span className="text-[#1E120D]/55 font-semibold">({row.sigla})</span>
                      </span>
                    </div>
                  </td>

                  <td className="py-3.5 px-4 sm:px-5 text-right">
                    {renderCategoryCell(row.plasticultura, label, row.sigla, 'plasticultura')}
                  </td>

                  <td className="py-3.5 px-4 sm:px-5 text-right">
                    {row.plasticultura.hasConfirmedData ? (
                      <div className="flex flex-col items-end gap-0.5">
                        <span className="font-black text-sm sm:text-base text-[#8E1057] tabular-nums">
                          {formatBrl(row.plasticulturaValueBrl)}
                        </span>
                        <span className="text-[10px] text-[#1E120D]/55 tabular-nums">
                          {row.plasticultura.confirmedHa.toLocaleString('pt-BR', {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2
                          })}{' '}
                          ha × {formatBrl(coveredHectareValue)}
                        </span>
                      </div>
                    ) : (
                      <span className="text-xs font-semibold text-amber-700">
                        Pendente de confirmação
                      </span>
                    )}
                  </td>

                  <td className="py-3.5 px-4 sm:px-5 text-right">
                    {renderCategoryCell(row.estrutura, label, row.sigla, 'estrutura')}
                  </td>
                </tr>
              );
            })}
          </tbody>

          <tfoot>
            <tr className="bg-gradient-to-r from-[#4A072E] via-[#5A0A37] to-[#8E1057] text-white">
              <td className="py-4 px-4 sm:px-5">
                <div className="font-black text-sm tracking-wide uppercase">TOTAL GERAL</div>
                <div className="text-[11px] text-pink-100/80">
                  Soma automática independente por categoria
                </div>
              </td>
              <td className="py-4 px-4 sm:px-5 text-right">
                {renderCategoryCell(
                  farmAreaSummary.totalGeral.plasticultura,
                  'TOTAL GERAL (Todas as Fazendas)',
                  'ALL',
                  'plasticultura',
                  true
                )}
              </td>
              <td className="py-4 px-4 sm:px-5 text-right">
                {farmAreaSummary.totalGeral.plasticultura.hasConfirmedData ? (
                  <div className="flex flex-col items-end gap-0.5">
                    <span className="font-black text-sm sm:text-base text-white tabular-nums">
                      {formatBrl(farmAreaSummary.totalGeral.plasticulturaValueBrl)}
                    </span>
                    <span className="text-[10px] text-pink-100/85 tabular-nums">
                      {farmAreaSummary.totalGeral.plasticultura.confirmedHa.toLocaleString('pt-BR', {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2
                      })}{' '}
                      ha × {formatBrl(coveredHectareValue)}
                    </span>
                  </div>
                ) : (
                  <span className="text-xs font-semibold text-amber-200">
                    Pendente de confirmação
                  </span>
                )}
              </td>
              <td className="py-4 px-4 sm:px-5 text-right">
                {renderCategoryCell(
                  farmAreaSummary.totalGeral.estrutura,
                  'TOTAL GERAL (Todas as Fazendas)',
                  'ALL',
                  'estrutura',
                  true
                )}
              </td>
            </tr>
          </tfoot>
        </table>
      </div>

      {/* Nota de transparência metodológica */}
      <div className="px-4 sm:px-5 py-2.5 bg-[#FAF6F8] border-t border-[#F0E4EB] flex flex-wrap items-center justify-between gap-2 text-[11px] text-[#1E120D]/70">
        <span className="flex items-center gap-1.5">
          <Info className="w-3.5 h-3.5 text-[#8E1057] shrink-0" />
          <span>
            O valor de <strong>{formatBrl(coveredHectareValue)}/ha</strong> aplica-se exclusivamente às áreas com plasticultura instalada. Áreas que possuem apenas estrutura física não recebem este valor.
          </span>
        </span>
        <span className="text-[#8E1057] font-semibold">
          Atualização automática em tempo real
        </span>
      </div>

      {/* MODAL DE CONSULTA DAS PARCELAS QUE COMPÕEM O TOTAL */}
      {modalSelection && activeSummary && (
        <div className="fixed inset-0 bg-[#1E120D]/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-4xl w-full shadow-2xl border border-[#F0E4EB] flex flex-col max-h-[90vh] overflow-hidden animate-scale-up">
            {/* Header Modal */}
            <div className="p-5 border-b border-[#F0E4EB] bg-gradient-to-r from-[#4A072E] to-[#8E1057] text-white flex items-start justify-between gap-4">
              <div>
                <span className="text-[10px] font-bold uppercase tracking-wider text-pink-200 block mb-1">
                  Detalhamento de Composição da Área
                </span>
                <h3 className="text-lg font-extrabold tracking-tight">
                  {modalSelection.title} —{' '}
                  {modalSelection.category === 'plasticultura'
                    ? 'Área com Plasticultura (ha)'
                    : 'Área com Estrutura (ha)'}
                </h3>
                <p className="text-xs text-pink-100/90 mt-1">
                  Total confirmado nesta categoria:{' '}
                  <strong>{activeSummary.displayValue}</strong> ({activeSummary.confirmedCount}{' '}
                  {activeSummary.confirmedCount === 1 ? 'parcela' : 'parcelas'})
                  {activeSummary.duplicateSkippedCount > 0 &&
                    ` • ${activeSummary.duplicateSkippedCount} duplicidade(s) filtrada(s) para evitar dupla contagem`}
                </p>
              </div>
              <button
                type="button"
                onClick={() => setModalSelection(null)}
                className="p-1.5 rounded-lg bg-white/10 hover:bg-white/20 text-white transition"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Tabs e Busca */}
            <div className="p-4 border-b border-[#F0E4EB] bg-[#FAF6F8] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <div className="flex flex-wrap items-center gap-1.5">
                <button
                  type="button"
                  onClick={() => setModalTab('confirmed')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    modalTab === 'confirmed'
                      ? 'bg-[#8E1057] text-white shadow-xs'
                      : 'bg-white text-[#1E120D] border border-[#F0E4EB] hover:bg-pink-50'
                  }`}
                >
                  <CheckCircle2 className="w-3.5 h-3.5" />
                  <span>
                    Confirmadas ({activeSummary.confirmedCount} •{' '}
                    {activeSummary.confirmedHa.toLocaleString('pt-BR', {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2
                    })}{' '}
                    ha)
                  </span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalTab('pending')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    modalTab === 'pending'
                      ? 'bg-amber-600 text-white shadow-xs'
                      : 'bg-white text-amber-800 border border-amber-200 hover:bg-amber-50'
                  }`}
                >
                  <Clock className="w-3.5 h-3.5" />
                  <span>Pendente de confirmação ({activeSummary.pendingCount})</span>
                </button>

                <button
                  type="button"
                  onClick={() => setModalTab('without')}
                  className={`px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition ${
                    modalTab === 'without'
                      ? 'bg-[#1E120D] text-white shadow-xs'
                      : 'bg-white text-[#1E120D]/70 border border-[#F0E4EB] hover:bg-stone-100'
                  }`}
                >
                  <Ban className="w-3.5 h-3.5" />
                  <span>Não Possui ({activeSummary.withoutCount})</span>
                </button>
              </div>

              <div className="relative w-full sm:w-64">
                <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-[#1E120D]/40" />
                <input
                  type="text"
                  value={modalSearch}
                  onChange={e => setModalSearch(e.target.value)}
                  placeholder="Filtrar parcela, setor, variedade..."
                  className="w-full pl-8 pr-3 py-1.5 rounded-lg bg-white border border-[#F0E4EB] text-xs text-[#1E120D] focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                />
              </div>
            </div>

            {/* Lista de Parcelas */}
            <div className="flex-1 overflow-y-auto p-4">
              {activeItems.length === 0 ? (
                <div className="py-12 text-center bg-[#FAF6F8] rounded-xl border border-dashed border-[#F0E4EB] text-xs text-[#1E120D]/60">
                  {modalTab === 'confirmed'
                    ? 'Nenhuma parcela confirmada nesta categoria para os critérios atuais (Pendente de confirmação).'
                    : modalTab === 'pending'
                      ? 'Nenhuma parcela pendente de confirmação nesta categoria.'
                      : 'Nenhuma parcela marcada como "Não Possui" nesta categoria.'}
                </div>
              ) : (
                <div className="overflow-x-auto border border-[#F0E4EB] rounded-xl">
                  <table className="w-full text-left text-xs border-collapse">
                    <thead>
                      <tr className="bg-[#FAF6F8] border-b border-[#F0E4EB] text-[10px] font-bold uppercase tracking-wider text-[#1E120D]/70">
                        <th className="py-2.5 px-3">Fazenda</th>
                        <th className="py-2.5 px-3">Setor / Parcela</th>
                        <th className="py-2.5 px-3">Variedade</th>
                        <th className="py-2.5 px-3">Supervisor</th>
                        <th className="py-2.5 px-3">Origem</th>
                        <th className="py-2.5 px-3 text-right">Área (ha)</th>
                        {canEdit && <th className="py-2.5 px-3 text-right">Confirmação Independente</th>}
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#F0E4EB]">
                      {activeItems.map(item => {
                        const currentCatStatus =
                          modalSelection.category === 'plasticultura'
                            ? item.plasticulturaStatus
                            : item.estruturaStatus;

                        return (
                          <tr key={item.id} className="hover:bg-[#FAF6F8]/70">
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span className="px-1.5 py-0.5 rounded bg-[#8E1057]/10 text-[#8E1057] font-black text-[10px]">
                                {item.sigla}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <div className="font-bold text-[#1E120D]">{item.parcela}</div>
                              <div className="text-[10px] text-[#1E120D]/60">Setor {item.setor}</div>
                            </td>
                            <td className="py-2.5 px-3 font-medium text-[#1E120D]">
                              <div>{item.variedade}</div>
                              {item.notes && (
                                <div className="text-[10px] text-[#1E120D]/55 truncate max-w-[180px]" title={item.notes}>
                                  {item.notes}
                                </div>
                              )}
                            </td>
                            <td className="py-2.5 px-3 text-[#1E120D]/75 whitespace-nowrap">
                              {item.supervisor}
                            </td>
                            <td className="py-2.5 px-3 whitespace-nowrap">
                              <span
                                className={`px-2 py-0.5 rounded text-[10px] font-semibold ${
                                  item.source === 'serroplast'
                                    ? 'bg-pink-50 text-[#8E1057] border border-[#D65F95]/30'
                                    : 'bg-stone-100 text-stone-700 border border-stone-200'
                                }`}
                              >
                                {item.source === 'serroplast' ? 'Histórico Serroplast' : 'Cadastro Parcelas'}
                              </span>
                            </td>
                            <td className="py-2.5 px-3 text-right font-black text-[#8E1057] whitespace-nowrap tabular-nums">
                              {item.areaHa.toLocaleString('pt-BR', {
                                minimumFractionDigits: 2,
                                maximumFractionDigits: 2
                              })}{' '}
                              ha
                            </td>
                            {canEdit && (
                              <td className="py-2.5 px-3 text-right whitespace-nowrap">
                                <select
                                  value={currentCatStatus}
                                  onChange={e =>
                                    handleQuickStatusUpdate(item, e.target.value as AreaConfirmationStatus)
                                  }
                                  className="px-2 py-1 rounded-lg bg-[#FAF6F8] border border-[#F0E4EB] text-[11px] font-semibold text-[#1E120D] focus:outline-none focus:ring-1 focus:ring-[#8E1057]"
                                >
                                  <option value="Confirmado">
                                    {modalSelection.category === 'plasticultura'
                                      ? 'Confirmado (Com Plástico)'
                                      : 'Confirmado (Com Estrutura)'}
                                  </option>
                                  <option value="Não Possui">
                                    {modalSelection.category === 'plasticultura'
                                      ? 'Não Possui Plástico'
                                      : 'Não Possui Estrutura'}
                                  </option>
                                  <option value="Pendente de confirmação">Pendente de confirmação</option>
                                </select>
                              </td>
                            )}
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>

            {/* Footer Modal */}
            <div className="p-4 border-t border-[#F0E4EB] bg-[#FAF6F8] flex flex-wrap items-center justify-between gap-2 text-xs">
              <div className="text-[#1E120D]/70">
                Exibindo <strong>{activeItems.length}</strong> registro(s) • Soma exibida:{' '}
                <strong className="text-[#8E1057]">
                  {activeItems
                    .reduce((s, i) => s + i.areaHa, 0)
                    .toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}{' '}
                  ha
                </strong>
              </div>
              <button
                type="button"
                onClick={() => setModalSelection(null)}
                className="px-4 py-2 bg-[#8E1057] hover:bg-[#750D48] text-white font-bold rounded-xl transition"
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
