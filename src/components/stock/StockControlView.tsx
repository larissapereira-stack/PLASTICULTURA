import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { StockCondition, StockItem, StockMovement } from '../../types';
import { 
  Boxes, 
  PlusCircle, 
  MinusCircle, 
  ArrowLeftRight, 
  AlertTriangle, 
  History, 
  Search, 
  Building2, 
  CheckCircle2, 
  X,
  Filter,
  Sparkles,
  Layers,
  ArrowUpRight,
  ArrowDownLeft
} from 'lucide-react';

export const StockControlView: React.FC = () => {
  const { 
    farms, 
    plastics, 
    stock, 
    movements, 
    kpis, 
    addStockEntry, 
    addStockExit, 
    transferStock, 
    canPerform,
    currentUser,
    filters 
  } = useApp();

  const [activeSubTab, setActiveSubTab] = useState<'inventory' | 'movements' | 'alerts'>('inventory');
  const [selectedCondition, setSelectedCondition] = useState<'ALL' | 'NOVO' | 'REUTILIZADO'>('ALL');
  const [searchFilter, setSearchFilter] = useState('');

  // Modals
  const [isEntryModalOpen, setIsEntryModalOpen] = useState(false);
  const [isExitModalOpen, setIsExitModalOpen] = useState(false);
  const [isTransferModalOpen, setIsTransferModalOpen] = useState(false);

  const [selectedStockItem, setSelectedStockItem] = useState<StockItem | null>(null);

  const canOperateStock = canPerform('STOCK_OPERATION');

  // Filtered stock list
  const filteredStock = stock.filter(item => {
    if (filters.farmId !== 'all' && item.farmId !== filters.farmId) return false;
    if (filters.plasticId !== 'all' && item.plasticId !== filters.plasticId) return false;
    if (selectedCondition !== 'ALL' && item.condition !== selectedCondition) return false;

    if (searchFilter) {
      const plastic = plastics.find(p => p.id === item.plasticId);
      const farm = farms.find(f => f.id === item.farmId);
      const q = searchFilter.toLowerCase();
      const matches = 
        item.batchNumber.toLowerCase().includes(q) ||
        (plastic?.name.toLowerCase().includes(q) ?? false) ||
        (farm?.name.toLowerCase().includes(q) ?? false);
      if (!matches) return false;
    }
    return true;
  });

  // Filtered movements list
  const filteredMovements = movements.filter(mov => {
    if (filters.farmId !== 'all' && mov.farmId !== filters.farmId) return false;
    if (filters.plasticId !== 'all' && mov.plasticId !== filters.plasticId) return false;
    return true;
  });

  // Entry Submit
  const handleEntrySubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const plasticId = formData.get('plasticId') as string;
    const targetPlastic = plastics.find(p => p.id === plasticId);

    const res = addStockEntry({
      farmId: formData.get('farmId') as string,
      plasticId,
      batchNumber: formData.get('batchNumber') as string,
      condition: formData.get('condition') as StockCondition,
      meters: parseFloat(formData.get('meters') as string) || 0,
      costPerMeter: parseFloat(formData.get('costPerMeter') as string) || targetPlastic?.pricePerMeter || 0,
      reason: formData.get('reason') as string,
      notes: formData.get('notes') as string,
      originDetails: formData.get('originDetails') as string
    });

    if (res.success) {
      setIsEntryModalOpen(false);
    }
  };

  // Exit Submit
  const handleExitSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedStockItem) return;
    const formData = new FormData(e.currentTarget);

    const res = addStockExit({
      stockItemId: selectedStockItem.id,
      meters: parseFloat(formData.get('meters') as string) || 0,
      reason: formData.get('reason') as string,
      notes: formData.get('notes') as string
    });

    if (res.success) {
      setIsExitModalOpen(false);
      setSelectedStockItem(null);
    }
  };

  // Transfer Submit
  const handleTransferSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!selectedStockItem) return;
    const formData = new FormData(e.currentTarget);

    const res = transferStock({
      sourceStockItemId: selectedStockItem.id,
      destinationFarmId: formData.get('destinationFarmId') as string,
      meters: parseFloat(formData.get('meters') as string) || 0,
      reason: formData.get('reason') as string,
      notes: formData.get('notes') as string
    });

    if (res.success) {
      setIsTransferModalOpen(false);
      setSelectedStockItem(null);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header section with Action Buttons */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#F0E4EB] shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#8E1057] uppercase tracking-wider mb-1">
            <Boxes className="w-4 h-4 text-[#D65F95]" />
            Almoxarifado & Logística
          </div>
          <h2 className="text-xl font-extrabold text-[#1E120D] tracking-tight">
            Controle de Estoque e Movimentações
          </h2>
          <p className="text-xs text-[#1E120D]/60 mt-0.5">
            Gerenciamento rigoroso de saldo em metros, rastreabilidade de lotes, material novo e reutilizado, com trava de saldo negativo.
          </p>
        </div>

        {canOperateStock && (
          <div className="flex flex-wrap items-center gap-2">
            <button
              onClick={() => setIsEntryModalOpen(true)}
              className="flex items-center gap-1.5 text-xs font-bold bg-[#8E1057] hover:bg-[#750D48] text-white px-3.5 py-2.5 rounded-xl transition shadow-xs"
            >
              <PlusCircle className="w-4 h-4" />
              <span>Entrada de Material</span>
            </button>
            <button
              onClick={() => {
                if (filteredStock.length > 0) {
                  setSelectedStockItem(filteredStock[0]);
                  setIsTransferModalOpen(true);
                }
              }}
              className="flex items-center gap-1.5 text-xs font-bold bg-amber-600 hover:bg-amber-700 text-white px-3.5 py-2.5 rounded-xl transition shadow-xs"
            >
              <ArrowLeftRight className="w-4 h-4" />
              <span>Transferir entre Fazendas</span>
            </button>
          </div>
        )}
      </div>

      {/* Sub Tabs: Inventory vs Movements vs Alerts */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0E4EB] pb-3">
        <div className="flex items-center gap-2">
          <button
            onClick={() => setActiveSubTab('inventory')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'inventory' 
                ? 'bg-[#4A072E] text-white shadow-xs border border-[#8E1057]/40' 
                : 'bg-white text-[#1E120D]/70 border border-[#F0E4EB] hover:bg-[#FAF6F8]'
            }`}
          >
            <Boxes className="w-4 h-4" />
            <span>Saldos de Estoque ({filteredStock.length} Lotes)</span>
          </button>

          <button
            onClick={() => setActiveSubTab('movements')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'movements' 
                ? 'bg-[#4A072E] text-white shadow-xs border border-[#8E1057]/40' 
                : 'bg-white text-[#1E120D]/70 border border-[#F0E4EB] hover:bg-[#FAF6F8]'
            }`}
          >
            <History className="w-4 h-4" />
            <span>Histórico de Movimentações ({filteredMovements.length})</span>
          </button>

          <button
            onClick={() => setActiveSubTab('alerts')}
            className={`px-4 py-2 rounded-xl text-xs font-bold transition flex items-center gap-2 ${
              activeSubTab === 'alerts' 
                ? 'bg-amber-600 text-white shadow-xs' 
                : 'bg-white text-[#1E120D]/70 border border-[#F0E4EB] hover:bg-[#FAF6F8]'
            }`}
          >
            <AlertTriangle className="w-4 h-4" />
            <span>Alertas de Estoque Baixo ({kpis.lowStockAlertsCount})</span>
          </button>
        </div>

        {activeSubTab === 'inventory' && (
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#1E120D]/60 font-medium">Condição:</span>
            <div className="flex items-center bg-[#FAF6F8] p-1 rounded-lg border border-[#F0E4EB] text-xs font-semibold">
              <button
                onClick={() => setSelectedCondition('ALL')}
                className={`px-2.5 py-1 rounded transition ${selectedCondition === 'ALL' ? 'bg-white text-[#1E120D] shadow-xs' : 'text-[#1E120D]/70'}`}
              >
                Todos
              </button>
              <button
                onClick={() => setSelectedCondition('NOVO')}
                className={`px-2.5 py-1 rounded transition ${selectedCondition === 'NOVO' ? 'bg-white text-[#8E1057] shadow-xs' : 'text-[#1E120D]/70'}`}
              >
                Novos
              </button>
              <button
                onClick={() => setSelectedCondition('REUTILIZADO')}
                className={`px-2.5 py-1 rounded transition ${selectedCondition === 'REUTILIZADO' ? 'bg-white text-cyan-800 shadow-xs' : 'text-[#1E120D]/70'}`}
              >
                Reutilizados
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- TAB 1: INVENTÁRIO / SALDOS --- */}
      {activeSubTab === 'inventory' && (
        <div className="bg-white border border-[#F0E4EB] rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#F0E4EB] flex items-center justify-between gap-3">
            <div className="relative w-full max-w-sm">
              <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
              <input
                type="text"
                placeholder="Filtrar por lote, plástico ou fazenda..."
                value={searchFilter}
                onChange={(e) => setSearchFilter(e.target.value)}
                className="w-full bg-[#FAF6F8] border border-[#F0E4EB] rounded-lg pl-9 pr-3 py-1.5 text-xs text-[#1E120D] focus:outline-none focus:ring-1 focus:ring-[#8E1057]"
              />
            </div>

            <div className="text-xs text-stone-500">
              Total disponível filtrado:{' '}
              <strong className="text-stone-900 text-sm">
                {filteredStock.reduce((s, i) => s + i.metersAvailable, 0).toLocaleString('pt-BR')} metros
              </strong>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6F8] text-[#1E120D]/80 font-semibold border-b border-[#F0E4EB] uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Fazenda</th>
                  <th className="py-3 px-4">Material Plástico</th>
                  <th className="py-3 px-4">Lote / Identificação</th>
                  <th className="py-3 px-4">Condição</th>
                  <th className="py-3 px-4 text-right">Saldo em Metros</th>
                  <th className="py-3 px-4 text-right">Rolos Aprox.</th>
                  <th className="py-3 px-4 text-right">Valor Unitário</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                  {canOperateStock && <th className="py-3 px-4 text-center">Ações</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredStock.length === 0 ? (
                  <tr>
                    <td colSpan={9} className="py-8 text-center text-stone-400">
                      Nenhum item de estoque encontrado para os filtros selecionados.
                    </td>
                  </tr>
                ) : (
                  filteredStock.map(item => {
                    const farm = farms.find(f => f.id === item.farmId);
                    const plastic = plastics.find(p => p.id === item.plasticId);
                    const rollsApprox = plastic && plastic.rollLengthMeters > 0 
                      ? (item.metersAvailable / plastic.rollLengthMeters).toFixed(1)
                      : '-';
                    const totalItemValue = item.metersAvailable * item.costPerMeter;
                    const isLow = plastic && item.metersAvailable <= plastic.minStockAlertMeters;

                    return (
                      <tr key={item.id} className="hover:bg-stone-50/80 transition">
                        <td className="py-3 px-4 font-bold text-stone-800">
                          {farm?.name || item.farmId}
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-bold text-stone-900">{plastic?.name || item.plasticId}</p>
                          <p className="text-[11px] text-stone-500">{plastic?.category} • {plastic?.thicknessMicrons}µm</p>
                        </td>
                        <td className="py-3 px-4">
                          <span className="font-mono font-bold text-stone-800 bg-stone-100 px-2 py-0.5 rounded text-[11px]">
                            {item.batchNumber}
                          </span>
                          {item.originDetails && (
                            <p className="text-[10px] text-stone-400 truncate max-w-xs mt-0.5" title={item.originDetails}>
                              {item.originDetails}
                            </p>
                          )}
                        </td>
                        <td className="py-3 px-4">
                          {item.condition === 'NOVO' ? (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF6F8] text-[#8E1057] border border-[#D65F95]/40">
                              NOVO
                            </span>
                          ) : (
                            <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-pink-100/60 text-[#8E1057] border border-[#D65F95]/40">
                              REUTILIZADO
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={`font-black text-sm ${isLow ? 'text-amber-700' : 'text-[#1E120D]'}`}>
                            {item.metersAvailable.toLocaleString('pt-BR')} m
                          </span>
                          {isLow && (
                            <span className="block text-[10px] text-amber-600 font-semibold">
                              Estoque baixo!
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-right font-medium text-[#1E120D]/70">
                          {rollsApprox} rolos
                        </td>
                        <td className="py-3 px-4 text-right font-semibold text-[#1E120D]/80">
                          R$ {item.costPerMeter.toFixed(2)}
                        </td>
                        <td className="py-3 px-4 text-right font-black text-[#8E1057]">
                          R$ {totalItemValue.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                        </td>

                        {canOperateStock && (
                          <td className="py-3 px-4 text-center">
                            <div className="flex items-center justify-center gap-1.5">
                              <button
                                onClick={() => {
                                  setSelectedStockItem(item);
                                  setIsTransferModalOpen(true);
                                }}
                                className="p-1 rounded bg-amber-50 text-amber-700 hover:bg-amber-100 border border-amber-200 transition"
                                title="Transferir para outra fazenda"
                              >
                                <ArrowLeftRight className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={() => {
                                  setSelectedStockItem(item);
                                  setIsExitModalOpen(true);
                                }}
                                className="p-1 rounded bg-red-50 text-red-700 hover:bg-red-100 border border-red-200 transition"
                                title="Dar baixa avulsa"
                              >
                                <MinusCircle className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        )}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 2: HISTÓRICO DE MOVIMENTAÇÕES --- */}
      {activeSubTab === 'movements' && (
        <div className="bg-white border border-[#F0E4EB] rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#F0E4EB] flex items-center justify-between">
            <h3 className="font-bold text-[#1E120D] text-sm">
              Trilha de Auditoria de Movimentações
            </h3>
            <span className="text-xs text-[#1E120D]/60">
              Registros imutáveis com carimbo de operador e data/hora
            </span>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead className="bg-[#FAF6F8] text-[#1E120D]/80 font-semibold border-b border-[#F0E4EB] uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-3 px-4">Data / Hora</th>
                  <th className="py-3 px-4">Tipo Movimento</th>
                  <th className="py-3 px-4">Fazenda</th>
                  <th className="py-3 px-4">Material Plástico</th>
                  <th className="py-3 px-4">Lote / Condição</th>
                  <th className="py-3 px-4 text-right">Metros</th>
                  <th className="py-3 px-4 text-right">Valor Total</th>
                  <th className="py-3 px-4">Motivo / Destino</th>
                  <th className="py-3 px-4">Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {filteredMovements.map(mov => {
                  const farm = farms.find(f => f.id === mov.farmId);
                  const plastic = plastics.find(p => p.id === mov.plasticId);

                  let badge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">ENTRADA</span>;
                  if (mov.type === 'INSTALACAO') {
                    badge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF6F8] text-[#8E1057] border border-[#D65F95]/30">INSTALAÇÃO</span>;
                  } else if (mov.type === 'RETIRADA_REAPROVEITADO') {
                    badge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF6F8] text-[#8E1057] border border-[#D65F95]/40">REUSO CAMPO</span>;
                  } else if (mov.type === 'RETIRADA_DESCARTE') {
                    badge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">DESCARTE</span>;
                  } else if (mov.type === 'TRANSFERENCIA_SAIDA') {
                    badge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">TRANSF. SAÍDA</span>;
                  } else if (mov.type === 'TRANSFERENCIA_ENTRADA') {
                    badge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">TRANSF. ENTRADA</span>;
                  } else if (mov.type === 'SAIDA_AVULSA') {
                    badge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-800">BAIXA AVULSA</span>;
                  }

                  return (
                    <tr key={mov.id} className="hover:bg-stone-50/80 transition">
                      <td className="py-3 px-4 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                        {new Date(mov.timestamp).toLocaleDateString('pt-BR')} {new Date(mov.timestamp).toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
                      </td>
                      <td className="py-3 px-4">{badge}</td>
                      <td className="py-3 px-4 font-bold text-stone-800">{farm?.name || mov.farmId}</td>
                      <td className="py-3 px-4 font-medium text-stone-900">{plastic?.name || mov.plasticId}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs text-stone-700">{mov.batchNumber}</span>
                        <span className="ml-1 text-[10px] text-stone-400">({mov.condition})</span>
                      </td>
                      <td className="py-3 px-4 text-right font-black text-stone-900">
                        {mov.meters.toLocaleString('pt-BR')} m
                      </td>
                      <td className="py-3 px-4 text-right font-semibold text-stone-700">
                        R$ {mov.totalCost?.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 }) || '0,00'}
                      </td>
                      <td className="py-3 px-4 text-stone-600 max-w-xs truncate" title={mov.reason}>
                        {mov.reason}
                      </td>
                      <td className="py-3 px-4">
                        <span className="font-medium text-stone-800 block">{mov.operatorName}</span>
                        <span className="text-[10px] text-stone-400">{mov.operatorRole}</span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* --- TAB 3: ALERTAS DE ESTOQUE BAIXO --- */}
      {activeSubTab === 'alerts' && (
        <div className="space-y-4">
          {kpis.lowStockItems.length === 0 ? (
            <div className="bg-[#FAF6F8] border border-[#D65F95]/40 rounded-2xl p-8 text-center text-[#1E120D]">
              <CheckCircle2 className="w-10 h-10 text-[#8E1057] mx-auto mb-2" />
              <h3 className="font-bold text-base">Estoque Regular em Todas as Fazendas</h3>
              <p className="text-xs text-[#8E1057] mt-1">
                Nenhum plástico está abaixo do limite de segurança configurado no momento.
              </p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {kpis.lowStockItems.map(({ stock: item, plastic, farm }) => (
                <div key={item.id} className="bg-amber-50/60 border border-amber-300 rounded-2xl p-5 shadow-xs space-y-3">
                  <div className="flex items-start justify-between">
                    <div>
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded bg-amber-200 text-amber-900">
                        Ponto de Reposição Crítico
                      </span>
                      <h4 className="font-extrabold text-stone-900 text-sm mt-1">
                        {plastic.name}
                      </h4>
                      <p className="text-xs text-stone-600">
                        Fazenda: <strong>{farm.name}</strong> • Lote: <span className="font-mono">{item.batchNumber}</span>
                      </p>
                    </div>
                    <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                  </div>

                  <div className="p-3 bg-white rounded-xl border border-amber-200 text-xs space-y-1">
                    <div className="flex items-center justify-between text-stone-600">
                      <span>Saldo Atual:</span>
                      <strong className="text-amber-800 font-black text-sm">{item.metersAvailable.toLocaleString('pt-BR')} m</strong>
                    </div>
                    <div className="flex items-center justify-between text-stone-500 text-[11px]">
                      <span>Estoque Mínimo Exigido:</span>
                      <span>{plastic.minStockAlertMeters.toLocaleString('pt-BR')} m</span>
                    </div>
                  </div>

                  <button
                    onClick={() => {
                      setSelectedStockItem(item);
                      setIsEntryModalOpen(true);
                    }}
                    className="w-full py-2 rounded-lg bg-amber-600 hover:bg-amber-700 text-white font-bold text-xs transition"
                  >
                    Registrar Compra / Reposição
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* --- MODAL DE ENTRADA DE MATERIAL --- */}
      {isEntryModalOpen && (
        <div className="fixed inset-0 bg-[#1E120D]/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#F0E4EB] animate-scale-up max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E4EB]">
              <h3 className="text-base font-bold text-[#1E120D] flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-[#8E1057]" />
                Nova Entrada em Estoque
              </h3>
              <button onClick={() => setIsEntryModalOpen(false)} className="text-stone-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEntrySubmit} className="space-y-4 mt-4 text-xs">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1E120D]/80 mb-1">Fazenda de Destino *</label>
                  <select name="farmId" defaultValue={selectedStockItem?.farmId || farms[0]?.id} required className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5">
                    {farms.map(f => (
                      <option key={f.id} value={f.id}>{f.name}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-[#1E120D]/80 mb-1">Condição do Material *</label>
                  <select name="condition" defaultValue="NOVO" required className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5">
                    <option value="NOVO">NOVO (Adquirido de Fornecedor)</option>
                    <option value="REUTILIZADO">REUTILIZADO (Reaproveitado)</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1E120D]/80 mb-1">Material Plástico *</label>
                <select name="plasticId" defaultValue={selectedStockItem?.plasticId || plastics[0]?.id} required className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5">
                  {plastics.map(p => (
                    <option key={p.id} value={p.id}>{p.name} ({p.thicknessMicrons}µm - R$ {p.pricePerMeter}/m)</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1E120D]/80 mb-1">Identificação do Lote *</label>
                  <input name="batchNumber" defaultValue={`LOTE-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`} required placeholder="Ex: LOTE-2024-GIN" className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-mono uppercase" />
                </div>
                <div>
                  <label className="block font-semibold text-[#1E120D]/80 mb-1">Quantidade em Metros *</label>
                  <input name="meters" type="number" step="10" min="1" required placeholder="Ex: 5000" className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-bold" />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-[#1E120D]/80 mb-1">Custo por Metro (R$) *</label>
                  <input name="costPerMeter" type="number" step="0.01" defaultValue={plastics[0]?.pricePerMeter || 4.80} required className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-bold text-[#8E1057]" />
                </div>
                <div>
                  <label className="block font-semibold text-[#1E120D]/80 mb-1">Motivo / Nota Fiscal *</label>
                  <input name="reason" required placeholder="Ex: Compra Safra - NF 5420" className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5" />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-[#1E120D]/80 mb-1">Observações / Detalhes de Origem</label>
                <textarea name="originDetails" rows={2} placeholder="Ex: Armazenado no Galpão 02, Paletes 4 e 5." className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsEntryModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-[#8E1057] hover:bg-[#750D48] text-white font-bold rounded-lg transition shadow-xs">Confirmar Entrada</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE TRANSFERÊNCIA ENTRE FAZENDAS --- */}
      {isTransferModalOpen && selectedStockItem && (
        <div className="fixed inset-0 bg-[#1E120D]/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#F0E4EB] animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E4EB]">
              <h3 className="text-base font-bold text-[#1E120D] flex items-center gap-2">
                <ArrowLeftRight className="w-5 h-5 text-amber-600" />
                Transferência de Plástico entre Fazendas
              </h3>
              <button onClick={() => setIsTransferModalOpen(false)} className="text-stone-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleTransferSubmit} className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-[#FAF6F8] rounded-xl border border-[#F0E4EB] space-y-1">
                <p className="text-stone-500">Fazenda Origem: <strong className="text-[#1E120D]">{farms.find(f => f.id === selectedStockItem.farmId)?.name}</strong></p>
                <p className="text-stone-500">Material: <strong className="text-[#1E120D]">{plastics.find(p => p.id === selectedStockItem.plasticId)?.name}</strong></p>
                <p className="text-stone-500">Lote: <span className="font-mono font-bold text-[#1E120D]">{selectedStockItem.batchNumber}</span> ({selectedStockItem.condition})</p>
                <p className="text-[#8E1057] font-bold">Saldo Disponível: {selectedStockItem.metersAvailable.toLocaleString('pt-BR')} metros</p>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Fazenda Destino *</label>
                <select name="destinationFarmId" required className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5">
                  {farms.filter(f => f.id !== selectedStockItem.farmId).map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Quantidade a Transferir (Metros) *</label>
                <input
                  name="meters"
                  type="number"
                  step="1"
                  min="1"
                  max={selectedStockItem.metersAvailable}
                  required
                  placeholder={`Máximo: ${selectedStockItem.metersAvailable}m`}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-bold text-sm"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Motivo da Transferência *</label>
                <input name="reason" required placeholder="Ex: Suprimento emergencial para parral da quadra Q-02" className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsTransferModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-amber-600 text-white font-bold rounded-lg">Confirmar Transferência</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* --- MODAL DE SAÍDA AVULSA --- */}
      {isExitModalOpen && selectedStockItem && (
        <div className="fixed inset-0 bg-[#1E120D]/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#F0E4EB] animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E4EB]">
              <h3 className="text-base font-bold text-[#1E120D] flex items-center gap-2">
                <MinusCircle className="w-5 h-5 text-red-600" />
                Baixa Avulsa de Estoque
              </h3>
              <button onClick={() => setIsExitModalOpen(false)} className="text-stone-500">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleExitSubmit} className="space-y-4 mt-4 text-xs">
              <div className="p-3 bg-red-50 rounded-xl border border-red-200 text-red-900">
                <p>Lote: <strong>{selectedStockItem.batchNumber}</strong></p>
                <p>Disponível: <strong>{selectedStockItem.metersAvailable.toLocaleString('pt-BR')}m</strong></p>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Quantidade a Baixar (Metros) *</label>
                <input
                  name="meters"
                  type="number"
                  min="1"
                  max={selectedStockItem.metersAvailable}
                  required
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-bold"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Motivo da Baixa *</label>
                <input name="reason" required placeholder="Ex: Material danificado por umidade no galpão" className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5" />
              </div>

              <div className="flex justify-end gap-2 pt-3 border-t">
                <button type="button" onClick={() => setIsExitModalOpen(false)} className="px-4 py-2 border rounded-lg">Cancelar</button>
                <button type="submit" className="px-5 py-2 bg-red-600 text-white font-bold rounded-lg">Confirmar Baixa</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
