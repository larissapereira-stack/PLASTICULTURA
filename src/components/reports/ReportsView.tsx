import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { FarmAreaSummaryTable } from '../common/FarmAreaSummaryTable';
import { resolveSerroplastPlasticulturaStatus } from '../../utils/farmAreaSummary';
import * as XLSX from 'xlsx';
import { jsPDF } from 'jspdf';
import { 
  FileSpreadsheet, 
  FileText, 
  Download, 
  Printer, 
  Filter, 
  CheckCircle2, 
  Building2, 
  Boxes, 
  ArrowDownToDot, 
  Recycle,
  Sparkles
} from 'lucide-react';

type ReportType = 
  | 'FARM_AREA_SEPARATION'
  | 'PARCELS_COVERAGE'
  | 'SERROPLAST_COVERAGE'
  | 'STOCK_INVENTORY'
  | 'INSTALLATIONS'
  | 'REMOVALS_REUSE'
  | 'MOVEMENTS_TRAIL';

export const ReportsView: React.FC = () => {
  const { 
    farms, 
    sectors, 
    parcels, 
    plastics, 
    stock, 
    installations, 
    removals, 
    movements,
    serroplastRecords,
    farmAreaSummary,
    showToast 
  } = useApp();

  const [selectedReport, setSelectedReport] = useState<ReportType>('FARM_AREA_SEPARATION');
  const [filterFarmId, setFilterFarmId] = useState<string>('all');
  const [filterSector, setFilterSector] = useState<string>('all');
  const [filterSituation, setFilterSituation] = useState<string>('ALL');

  const dynamicSerroplastTotalHa = React.useMemo(() => {
    return serroplastRecords
      .filter(r => r.ativo && resolveSerroplastPlasticulturaStatus(r) === 'Confirmado')
      .reduce((s, r) => s + (Number(r.areaHa) || 0), 0);
  }, [serroplastRecords]);

  // Build report dataset based on selected report type
  const reportData = React.useMemo(() => {
    switch (selectedReport) {
      case 'FARM_AREA_SEPARATION': {
        const filteredRows =
          filterFarmId === 'all'
            ? farmAreaSummary.rows
            : farmAreaSummary.rows.filter(r => r.farmId === filterFarmId);

        const mapped = filteredRows.map(r => ({
          fazenda: `${r.fazendaNome} (${r.sigla})`,
          areaComPlasticulturaHa: r.plasticultura.displayValue,
          valorPorHectarePlasticulturaBrl: farmAreaSummary.coveredHectareValue,
          valorTotalPlasticulturaBrl: r.plasticulturaValueBrl,
          parcelasPlasticultura: r.plasticultura.confirmedCount,
          pendentesPlasticultura: r.plasticultura.pendingCount,
          areaComEstruturaHa: r.estrutura.displayValue,
          parcelasEstrutura: r.estrutura.confirmedCount,
          pendentesEstrutura: r.estrutura.pendingCount
        }));

        if (filterFarmId === 'all') {
          mapped.push({
            fazenda: 'TOTAL GERAL',
            areaComPlasticulturaHa: farmAreaSummary.totalGeral.plasticultura.displayValue,
            valorPorHectarePlasticulturaBrl: farmAreaSummary.coveredHectareValue,
            valorTotalPlasticulturaBrl: farmAreaSummary.totalGeral.plasticulturaValueBrl,
            parcelasPlasticultura: farmAreaSummary.totalGeral.plasticultura.confirmedCount,
            pendentesPlasticultura: farmAreaSummary.totalGeral.plasticultura.pendingCount,
            areaComEstruturaHa: farmAreaSummary.totalGeral.estrutura.displayValue,
            parcelasEstrutura: farmAreaSummary.totalGeral.estrutura.confirmedCount,
            pendentesEstrutura: farmAreaSummary.totalGeral.estrutura.pendingCount
          });
        }
        return mapped;
      }

      case 'PARCELS_COVERAGE': {
        return parcels
          .filter(p => {
            if (filterFarmId !== 'all' && p.farmId !== filterFarmId) return false;
            if (filterSector !== 'all' && p.sector !== filterSector) return false;
            if (filterSituation !== 'ALL' && p.situation !== filterSituation) return false;
            return true;
          })
          .map(p => ({
            fazenda: p.farmName,
            codigoFazenda: p.farmCode,
            setor: p.sector,
            parcela: p.parcelCode,
            supervisor: p.supervisor,
            variedade: p.variety,
            hectares: p.hectares,
            situacaoPlasticultura: p.situation,
            situacaoEstrutura: p.structureStatus || 'Pendente de confirmação',
            plasticoAtual: p.currentPlasticType || 'Sem cobertura ativa',
            metrosCobertos: p.currentMetersCovered || 0,
            possuiDuplicidade: p.hasDuplicateFlag ? 'Sim (Preservado)' : 'Não',
            observacoes: p.duplicateNotes || p.additionalInfo || '-'
          }));
      }

      case 'SERROPLAST_COVERAGE': {
        const order = [
          { sigla: 'VDU', nome: 'Vale das Uvas', defaultTotal: 165.0 },
          { sigla: 'LBR', nome: 'Labrunier II', defaultTotal: 140.0 },
          { sigla: 'BRU', nome: 'Brasil Uvas', defaultTotal: 210.0 },
          { sigla: 'LAB', nome: 'Labrunier I', defaultTotal: 185.0 }
        ];
        const confirmedActive = serroplastRecords.filter(
          r => r.ativo && resolveSerroplastPlasticulturaStatus(r) === 'Confirmado'
        );
        const totalAll = confirmedActive.reduce((s, r) => s + (Number(r.areaHa) || 0), 0);

        const serroplastRows = order.map(o => {
          const farmObj = farms.find(f => f.code === o.sigla);
          const farmArea = farmObj?.totalHectares || o.defaultTotal;
          const areaComSerroplastHa = Number(
            confirmedActive
              .filter(r => r.sigla === o.sigla)
              .reduce((s, r) => s + (Number(r.areaHa) || 0), 0)
              .toFixed(2)
          );
          const sharePct = totalAll > 0 ? ((areaComSerroplastHa / totalAll) * 100).toFixed(2).replace('.', ',') : '0,00';
          const farmPct = farmArea > 0 ? ((areaComSerroplastHa / farmArea) * 100).toFixed(2).replace('.', ',') : '0,00';

          return {
            sigla: o.sigla,
            fazenda: farmObj?.name || o.nome,
            areaComSerroplastHa,
            participacaoDoTotalSerroplast: `${sharePct}%`,
            areaTotalFazendaHa: farmArea,
            percentualDaFazendaComSerroplast: `${farmPct}%`,
            material: 'Serroplast Filme Difusor Especial Uva 150µm'
          };
        });

        if (filterFarmId !== 'all') {
          const farm = farms.find(f => f.id === filterFarmId);
          return serroplastRows.filter(r => r.sigla === farm?.code);
        }
        return serroplastRows;
      }

      case 'STOCK_INVENTORY': {
        return stock
          .filter(item => {
            if (filterFarmId !== 'all' && item.farmId !== filterFarmId) return false;
            return true;
          })
          .map(item => {
            const farm = farms.find(f => f.id === item.farmId);
            const plastic = plastics.find(p => p.id === item.plasticId);
            return {
              fazenda: farm?.name || item.farmId,
              material: plastic?.name || item.plasticId,
              categoria: plastic?.category || '-',
              lote: item.batchNumber,
              condicao: item.condition,
              metrosDisponiveis: item.metersAvailable,
              valorUnitario: item.costPerMeter,
              valorTotal: item.metersAvailable * item.costPerMeter,
              origem: item.originDetails || '-'
            };
          });
      }

      case 'INSTALLATIONS': {
        return installations
          .filter(inst => {
            if (filterFarmId !== 'all' && inst.farmId !== filterFarmId) return false;
            return true;
          })
          .map(inst => {
            const farm = farms.find(f => f.id === inst.farmId);
            return {
              data: inst.installationDate,
              fazenda: farm?.name || inst.farmId,
              setor: inst.sector,
              parcela: inst.parcelCode,
              material: inst.plasticName,
              lote: inst.batchNumber,
              condicao: inst.conditionUsed,
              tipo: inst.isSubstitution ? 'Substituição' : 'Nova Instalação',
              metrosInstalados: inst.metersInstalled,
              custoTotal: inst.totalCost,
              responsavel: inst.responsibleName,
              status: inst.status
            };
          });
      }

      case 'REMOVALS_REUSE': {
        return removals
          .filter(rem => {
            if (filterFarmId !== 'all' && rem.farmId !== filterFarmId) return false;
            return true;
          })
          .map(rem => {
            const farm = farms.find(f => f.id === rem.farmId);
            const parcel = parcels.find(p => p.id === rem.parcelId);
            return {
              data: rem.removalDate,
              fazenda: farm?.name || rem.farmId,
              parcela: parcel?.parcelCode || rem.parcelId,
              material: rem.plasticName,
              totalRetirado: rem.totalMetersRemoved,
              reaproveitavelMetros: rem.reusableMeters,
              descartadoMetros: rem.discardedMeters,
              taxaReuso: rem.totalMetersRemoved > 0 ? `${Math.round((rem.reusableMeters / rem.totalMetersRemoved) * 100)}%` : '0%',
              valorEconomizado: rem.reusableValue,
              prejuizoDescarte: rem.discardedValue,
              loteGerado: rem.generatedBatchNumber,
              motivo: rem.reason,
              responsavel: rem.responsibleName
            };
          });
      }

      case 'MOVEMENTS_TRAIL': {
        return movements
          .filter(mov => {
            if (filterFarmId !== 'all' && mov.farmId !== filterFarmId) return false;
            return true;
          })
          .map(mov => {
            const farm = farms.find(f => f.id === mov.farmId);
            const plastic = plastics.find(p => p.id === mov.plasticId);
            return {
              dataHora: new Date(mov.timestamp).toLocaleString('pt-BR'),
              tipo: mov.type,
              fazenda: farm?.name || mov.farmId,
              material: plastic?.name || mov.plasticId,
              lote: mov.batchNumber,
              condicao: mov.condition,
              metros: mov.meters,
              custoTotal: mov.totalCost,
              motivo: mov.reason,
              operador: `${mov.operatorName} (${mov.operatorRole})`
            };
          });
      }

      default:
        return [];
    }
  }, [selectedReport, filterFarmId, filterSector, filterSituation, parcels, stock, installations, removals, movements, farms, plastics, serroplastRecords, farmAreaSummary]);

  const handleExportExcel = () => {
    try {
      const ws = XLSX.utils.json_to_sheet(reportData);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, 'Relatorio');
      const filename = `relatorio_${selectedReport.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(wb, filename);
      showToast('success', 'Relatório Excel Gerado', `Arquivo ${filename} baixado com sucesso.`);
    } catch (err) {
      showToast('error', 'Falha ao exportar Excel', String(err));
    }
  };

  const handleExportPdf = () => {
    try {
      const doc = new jsPDF({ orientation: 'landscape' });
      doc.setFont('helvetica');

      doc.setFontSize(16);
      doc.setTextColor(142, 16, 87); // Rosa vinho principal (#8E1057)
      doc.text('PLASTICULTURA FAZENDAS - RELATÓRIO OFICIAL', 14, 18);

      doc.setFontSize(10);
      doc.setTextColor(80, 80, 80);
      doc.text(`Estrutura: Fazenda > Setor > Parcela | Emissão: ${new Date().toLocaleString('pt-BR')}`, 14, 25);
      doc.text(`Tipo: ${getReportTitle(selectedReport)} | Registros: ${reportData.length}`, 14, 31);

      doc.setDrawColor(200, 200, 200);
      doc.line(14, 34, 280, 34);

      let y = 42;
      doc.setFontSize(8);
      doc.setTextColor(0, 0, 0);

      const keys = reportData.length > 0 ? Object.keys(reportData[0]) : [];
      let headerX = 14;
      const colWidth = Math.min(32, Math.floor(260 / (keys.length || 1)));

      doc.setFont('helvetica', 'bold');
      keys.forEach((key) => {
        doc.text(key.toUpperCase().slice(0, 12), headerX, y);
        headerX += colWidth;
      });

      doc.line(14, y + 2, 280, y + 2);
      y += 7;
      doc.setFont('helvetica', 'normal');

      reportData.slice(0, 26).forEach((row: any) => {
        if (y > 185) {
          doc.addPage();
          y = 20;
        }
        let cellX = 14;
        keys.forEach((key) => {
          const val = row[key] !== undefined && row[key] !== null ? String(row[key]) : '-';
          doc.text(val.slice(0, 16), cellX, y);
          cellX += colWidth;
        });
        y += 6;
      });

      const filename = `relatorio_${selectedReport.toLowerCase()}_${new Date().toISOString().slice(0, 10)}.pdf`;
      doc.save(filename);
      showToast('success', 'Relatório PDF Gerado', `Arquivo ${filename} baixado com sucesso.`);
    } catch (err) {
      showToast('error', 'Falha ao exportar PDF', String(err));
    }
  };

  function getReportTitle(type: ReportType): string {
    switch (type) {
      case 'FARM_AREA_SEPARATION': return 'Resumo Separado por Fazenda: Plasticultura (ha) vs. Estrutura (ha)';
      case 'PARCELS_COVERAGE': return 'Status Oficial de Cobertura das Parcelas (Áreas Cobertas e Descobertas)';
      case 'SERROPLAST_COVERAGE': return `Demonstrativo Oficial de Área com Serroplast (ha) — Total: ${dynamicSerroplastTotalHa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha`;
      case 'STOCK_INVENTORY': return 'Inventário e Saldos de Almoxarifado (Novo vs Reutilizado)';
      case 'INSTALLATIONS': return 'Relatório de Instalações e Substituições de Plástico';
      case 'REMOVALS_REUSE': return 'Relatório de Retiradas, Perdas e Reuso Sustentável';
      case 'MOVEMENTS_TRAIL': return 'Trilha Completa de Movimentações Operacionais de Estoque';
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#F0E4EB] shadow-xs no-print">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#8E1057] uppercase tracking-wider mb-1">
            <FileSpreadsheet className="w-4 h-4 text-[#D65F95]" />
            Central de Relatórios & Exportação
          </div>
          <h2 className="text-xl font-extrabold text-[#1E120D] tracking-tight">
            Relatórios Customizados (Excel & PDF)
          </h2>
          <p className="text-xs text-[#1E120D]/60 mt-0.5">
            Exportação completa de parcelas, coberturas, substituições, saldos de estoque e auditoria.
          </p>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={handleExportExcel}
            className="flex items-center gap-1.5 text-xs font-bold bg-[#8E1057] hover:bg-[#750D48] text-white px-3.5 py-2.5 rounded-xl transition shadow-xs"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Excel (.xlsx)</span>
          </button>
          <button
            onClick={handleExportPdf}
            className="flex items-center gap-1.5 text-xs font-bold bg-[#4A072E] hover:bg-[#5A0A37] text-white px-3.5 py-2.5 rounded-xl transition shadow-xs"
          >
            <FileText className="w-4 h-4 text-[#D65F95]" />
            <span>Baixar PDF</span>
          </button>
          <button
            onClick={() => window.print()}
            className="flex items-center gap-1.5 text-xs font-semibold bg-stone-100 hover:bg-stone-200 text-stone-800 px-3 py-2.5 rounded-xl border border-stone-300 transition"
            title="Imprimir relatório"
          >
            <Printer className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Modelos de Relatórios */}
      <div className="bg-white border border-[#F0E4EB] rounded-2xl p-5 shadow-xs space-y-4 no-print">
        <div>
          <label className="block text-xs font-bold uppercase tracking-wider text-[#1E120D]/70 mb-2">
            1. Selecione o Relatório
          </label>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-2.5">
            <button
              onClick={() => setSelectedReport('FARM_AREA_SEPARATION')}
              className={`p-3 rounded-xl border text-left transition ${
                selectedReport === 'FARM_AREA_SEPARATION' 
                  ? 'bg-[#4A072E] text-white border-[#8E1057] ring-2 ring-[#D65F95]/50 shadow-md' 
                  : 'bg-[#FAF6F8] border-[#F0E4EB] hover:bg-stone-100 text-[#1E120D]'
              }`}
            >
              <strong className="text-xs block font-bold">1. Plasticultura vs. Estrutura</strong>
              <span className="text-[10px] opacity-80 mt-0.5 block">Totais separados por fazenda</span>
            </button>

            <button
              onClick={() => setSelectedReport('PARCELS_COVERAGE')}
              className={`p-3 rounded-xl border text-left transition ${
                selectedReport === 'PARCELS_COVERAGE' 
                  ? 'bg-[#4A072E] text-white border-[#8E1057] ring-2 ring-[#D65F95]/50 shadow-md' 
                  : 'bg-[#FAF6F8] border-[#F0E4EB] hover:bg-stone-100 text-[#1E120D]'
              }`}
            >
              <strong className="text-xs block font-bold">2. Cobertura das Parcelas</strong>
              <span className="text-[10px] opacity-80 mt-0.5 block">Áreas cobertas, descobertas e estrutura</span>
            </button>

            <button
              onClick={() => setSelectedReport('SERROPLAST_COVERAGE')}
              className={`p-3 rounded-xl border text-left transition ${
                selectedReport === 'SERROPLAST_COVERAGE' 
                  ? 'bg-[#4A072E] text-white border-[#8E1057] ring-2 ring-[#D65F95]/50 shadow-md' 
                  : 'bg-[#FAF6F8] border-[#F0E4EB] hover:bg-stone-100 text-[#1E120D]'
              }`}
            >
              <div className="flex items-center justify-between">
                <strong className="text-xs block font-bold">3. Área com Serroplast (ha)</strong>
                <span className="text-[10px] font-black px-1.5 py-0.5 rounded bg-[#8E1057] text-white">
                  {dynamicSerroplastTotalHa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha
                </span>
              </div>
              <span className="text-[10px] opacity-80 mt-0.5 block">Demonstrativo oficial das 4 fazendas</span>
            </button>

            <button
              onClick={() => setSelectedReport('INSTALLATIONS')}
              className={`p-3 rounded-xl border text-left transition ${
                selectedReport === 'INSTALLATIONS' 
                  ? 'bg-[#4A072E] text-white border-[#8E1057] ring-2 ring-[#D65F95]/50 shadow-md' 
                  : 'bg-[#FAF6F8] border-[#F0E4EB] hover:bg-stone-100 text-[#1E120D]'
              }`}
            >
              <strong className="text-xs block font-bold">4. Instalações & Substituições</strong>
              <span className="text-[10px] opacity-80 mt-0.5 block">Histórico de trocas por parcela</span>
            </button>

            <button
              onClick={() => setSelectedReport('STOCK_INVENTORY')}
              className={`p-3 rounded-xl border text-left transition ${
                selectedReport === 'STOCK_INVENTORY' 
                  ? 'bg-[#4A072E] text-white border-[#8E1057] ring-2 ring-[#D65F95]/50 shadow-md' 
                  : 'bg-[#FAF6F8] border-[#F0E4EB] hover:bg-stone-100 text-[#1E120D]'
              }`}
            >
              <strong className="text-xs block font-bold">5. Inventário de Estoque</strong>
              <span className="text-[10px] opacity-80 mt-0.5 block">Saldos Novo & Reutilizado</span>
            </button>

            <button
              onClick={() => setSelectedReport('REMOVALS_REUSE')}
              className={`p-3 rounded-xl border text-left transition ${
                selectedReport === 'REMOVALS_REUSE' 
                  ? 'bg-[#4A072E] text-white border-[#8E1057] ring-2 ring-[#D65F95]/50 shadow-md' 
                  : 'bg-[#FAF6F8] border-[#F0E4EB] hover:bg-stone-100 text-[#1E120D]'
              }`}
            >
              <strong className="text-xs block font-bold">6. Retiradas, Perdas & Reuso</strong>
              <span className="text-[10px] opacity-80 mt-0.5 block">Metros reaproveitados vs descarte</span>
            </button>

            <button
              onClick={() => setSelectedReport('MOVEMENTS_TRAIL')}
              className={`p-3 rounded-xl border text-left transition ${
                selectedReport === 'MOVEMENTS_TRAIL' 
                  ? 'bg-[#4A072E] text-white border-[#8E1057] ring-2 ring-[#D65F95]/50 shadow-md' 
                  : 'bg-[#FAF6F8] border-[#F0E4EB] hover:bg-stone-100 text-[#1E120D]'
              }`}
            >
              <strong className="text-xs block font-bold">7. Trilha de Movimentações</strong>
              <span className="text-[10px] opacity-80 mt-0.5 block">Auditoria operacional</span>
            </button>
          </div>
        </div>

        {/* Filtros */}
        <div className="pt-3 border-t border-[#F0E4EB] grid grid-cols-1 sm:grid-cols-3 gap-3 text-xs">
          <div>
            <label className="block font-semibold text-[#1E120D]/80 mb-1">Filtrar Fazenda</label>
            <select
              value={filterFarmId}
              onChange={(e) => setFilterFarmId(e.target.value)}
              className="w-full bg-[#FAF6F8] border border-[#F0E4EB] rounded-lg p-2 text-[#1E120D] font-medium focus:ring-1 focus:ring-[#8E1057]"
            >
              <option value="all">Todas as Fazendas</option>
              {farms.map(f => (
                <option key={f.id} value={f.id}>{f.name} ({f.code})</option>
              ))}
            </select>
          </div>

          <div>
            <label className="block font-semibold text-[#1E120D]/80 mb-1">Situação da Parcela</label>
            <select
              value={filterSituation}
              onChange={(e) => setFilterSituation(e.target.value)}
              className="w-full bg-[#FAF6F8] border border-[#F0E4EB] rounded-lg p-2 text-[#1E120D] font-medium focus:ring-1 focus:ring-[#8E1057]"
            >
              <option value="ALL">Todas as Situações</option>
              <option value="Coberta">Coberta</option>
              <option value="Descoberta">Descoberta</option>
              <option value="A Confirmar">A Confirmar</option>
            </select>
          </div>

          <div className="flex items-end">
            <div className="text-xs text-[#1E120D]/60">
              Registros no relatório: <strong className="text-[#1E120D] text-sm">{reportData.length}</strong>
            </div>
          </div>
        </div>
      </div>

      {selectedReport === 'FARM_AREA_SEPARATION' && (
        <FarmAreaSummaryTable />
      )}

      {/* Tabela do Relatório */}
      <div className="bg-white border border-[#F0E4EB] rounded-2xl shadow-xs overflow-hidden printable-content">
        <div className="p-5 border-b border-[#F0E4EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <div className="flex items-center gap-2">
              <span className="w-2.5 h-2.5 rounded-full bg-[#8E1057] inline-block" />
              <h3 className="font-extrabold text-[#1E120D] text-base">
                {getReportTitle(selectedReport)}
              </h3>
            </div>
            <p className="text-xs text-[#1E120D]/60 mt-0.5">
              Estrutura Oficial: Fazenda &gt; Setor &gt; Parcela • Total de registros: {reportData.length}
            </p>
          </div>

          <div className="text-xs text-[#1E120D]/40 font-mono">
            {new Date().toLocaleDateString('pt-BR')} às {new Date().toLocaleTimeString('pt-BR')}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-stone-100 text-stone-700 font-bold border-b border-stone-200 uppercase tracking-wider text-[11px]">
              <tr>
                {reportData.length > 0 && Object.keys(reportData[0]).map((key) => (
                  <th key={key} className="py-3 px-4 whitespace-nowrap">
                    {key.replace(/([A-Z])/g, ' $1').toUpperCase()}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {reportData.length === 0 ? (
                <tr>
                  <td colSpan={10} className="py-12 text-center text-stone-400">
                    Nenhum registro encontrado.
                  </td>
                </tr>
              ) : (
                reportData.map((row: any, idx) => (
                  <tr key={idx} className="hover:bg-stone-50/80 transition">
                    {Object.keys(row).map((key) => {
                      const val = row[key];
                      const isNumber = typeof val === 'number';
                      const isCurrency = key.toLowerCase().includes('valor') || key.toLowerCase().includes('custo') || key.toLowerCase().includes('prejuizo');

                      return (
                        <td key={key} className={`py-2.5 px-4 whitespace-nowrap ${isNumber ? 'text-right font-medium' : ''}`}>
                          {isCurrency && isNumber
                            ? `R$ ${val.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`
                            : isNumber
                              ? val.toLocaleString('pt-BR')
                              : String(val)}
                        </td>
                      );
                    })}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
