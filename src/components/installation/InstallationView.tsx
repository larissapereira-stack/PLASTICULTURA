import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ArrowDownToDot, 
  CheckCircle2, 
  Calendar, 
  User, 
  Building2, 
  Layers, 
  AlertCircle,
  Clock,
  Sparkles,
  Info,
  RefreshCw
} from 'lucide-react';

interface InstallationViewProps {
  onNavigateToRemoval?: () => void;
}

export const InstallationView: React.FC<InstallationViewProps> = ({ onNavigateToRemoval }) => {
  const { 
    farms, 
    sectors, 
    parcels, 
    plastics, 
    stock, 
    installations, 
    registerInstallation, 
    canPerform, 
    currentUser,
    filters 
  } = useApp();

  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms[0]?.id || '');
  const [selectedSector, setSelectedSector] = useState<string>('all');
  const [selectedParcelId, setSelectedParcelId] = useState<string>('');
  const [selectedStockItemId, setSelectedStockItemId] = useState<string>('');
  
  const [metersToInstall, setMetersToInstall] = useState<number>(1000);
  const [installationDate, setInstallationDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [responsibleName, setResponsibleName] = useState<string>(currentUser.name);
  const [isSubstitution, setIsSubstitution] = useState<boolean>(false);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Available sectors for selected farm
  const farmSectors = sectors.filter(s => s.farmId === selectedFarmId);

  // Available parcels for selected farm and sector
  const availableParcels = parcels.filter(p => {
    if (p.farmId !== selectedFarmId) return false;
    if (selectedSector !== 'all' && p.sector !== selectedSector) return false;
    return true;
  });

  const currentParcelId = selectedParcelId || availableParcels[0]?.id || '';
  const currentParcel = parcels.find(p => p.id === currentParcelId);

  // Available stock items in this specific farm with balance > 0
  const farmStockItems = stock.filter(s => s.farmId === selectedFarmId && s.metersAvailable > 0);
  const currentStockItem = farmStockItems.find(s => s.id === selectedStockItemId) || farmStockItems[0];
  const currentPlastic = plastics.find(p => p.id === currentStockItem?.plasticId);

  const canInstall = canPerform('INSTALLATION');

  const availableStockMeters = currentStockItem?.metersAvailable || 0;
  const isInsufficientStock = metersToInstall > availableStockMeters;

  // Filtered installations list
  const filteredInstallations = installations.filter(inst => {
    if (filters.farmId !== 'all' && inst.farmId !== filters.farmId) return false;
    if (filters.plasticId !== 'all' && inst.plasticId !== filters.plasticId) return false;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!currentStockItem || !currentParcel) return;

    if (isInsufficientStock) {
      alert(`Saldo insuficiente no lote! Disponível: ${availableStockMeters}m`);
      return;
    }

    setIsSubmitting(true);
    const res = registerInstallation({
      farmId: selectedFarmId,
      sector: currentParcel.sector,
      parcelId: currentParcel.id,
      stockItemId: currentStockItem.id,
      metersInstalled: metersToInstall,
      installationDate,
      responsibleName,
      isSubstitution,
      notes
    });

    setIsSubmitting(false);
    if (res.success) {
      setNotes('');
      setMetersToInstall(1000);
      setIsSubstitution(false);
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#F0E4EB] shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-[#8E1057] uppercase tracking-wider mb-1">
          <ArrowDownToDot className="w-4 h-4 text-[#D65F95]" />
          Operações de Campo & Instalações
        </div>
        <h2 className="text-xl font-extrabold text-[#1E120D] tracking-tight">
          Instalação e Substituição de Plásticos em Parcela
        </h2>
        <p className="text-xs text-[#1E120D]/60 mt-0.5">
          Formulário operacional com baixa automática do estoque, vínculo com a Parcela e registro de substituições.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Instalação (2 colunas) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#F0E4EB] p-5 shadow-xs">
          <div className="flex items-center justify-between pb-2 mb-4 border-b border-[#F0E4EB]">
            <h3 className="font-bold text-[#1E120D] text-sm">
              Registrar Instalação / Substituição de Plástico
            </h3>
            <label className="flex items-center gap-2 text-xs font-bold text-amber-800 bg-amber-50 px-2.5 py-1 rounded-lg border border-amber-200 cursor-pointer">
              <input
                type="checkbox"
                checked={isSubstitution}
                onChange={(e) => setIsSubstitution(e.target.checked)}
                className="rounded text-amber-600 focus:ring-amber-500"
              />
              <span>É uma substituição de plástico?</span>
            </label>
          </div>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Fazenda e Setor */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  1. Selecionar Fazenda *
                </label>
                <select
                  value={selectedFarmId}
                  onChange={(e) => {
                    setSelectedFarmId(e.target.value);
                    setSelectedSector('all');
                    setSelectedParcelId('');
                    setSelectedStockItemId('');
                  }}
                  required
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-bold text-stone-900 focus:ring-1 focus:ring-[#8E1057] focus:outline-none"
                >
                  {farms.map(farm => (
                    <option key={farm.id} value={farm.id}>{farm.name} ({farm.code})</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  2. Setor da Fazenda
                </label>
                <select
                  value={selectedSector}
                  onChange={(e) => {
                    setSelectedSector(e.target.value);
                    setSelectedParcelId('');
                  }}
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:ring-1 focus:ring-[#8E1057] focus:outline-none"
                >
                  <option value="all">Todos os Setores ({farmSectors.length})</option>
                  {farmSectors.map(s => (
                    <option key={s.id} value={s.name}>{s.name}</option>
                  ))}
                </select>
              </div>
            </div>

            {/* Parcela Alvo */}
            <div>
              <label className="block font-semibold text-stone-700 mb-1">
                3. Selecionar Parcela Alvo *
              </label>
              {availableParcels.length === 0 ? (
                <div className="p-3 bg-stone-100 rounded-lg text-stone-500 italic">
                  Nenhuma parcela cadastrada para os filtros selecionados.
                </div>
              ) : (
                <select
                  value={currentParcelId}
                  onChange={(e) => setSelectedParcelId(e.target.value)}
                  required
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 font-bold text-stone-900 focus:ring-1 focus:ring-[#8E1057] focus:outline-none"
                >
                  {availableParcels.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.parcelCode} | {p.variety} ({p.hectares} ha) - Supervisor: {p.supervisor} - Situação: {p.situation}
                    </option>
                  ))}
                </select>
              )}
            </div>

            {/* Seleção do Lote em Estoque */}
            <div className="pt-2 border-t border-stone-100">
              <label className="block font-semibold text-stone-700 mb-1">
                4. Selecionar Plástico & Lote Disponível no Almoxarifado *
              </label>

              {farmStockItems.length === 0 ? (
                <div className="p-4 bg-red-50 border border-red-200 rounded-xl text-red-800 text-xs">
                  Atenção: Não há saldo de plástico disponível no estoque desta fazenda ({farms.find(f => f.id === selectedFarmId)?.name}). Faça uma entrada ou transferência antes de instalar.
                </div>
              ) : (
                <select
                  value={currentStockItem?.id}
                  onChange={(e) => setSelectedStockItemId(e.target.value)}
                  required
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:ring-1 focus:ring-[#8E1057] focus:outline-none font-medium"
                >
                  {farmStockItems.map(item => {
                    const pl = plastics.find(p => p.id === item.plasticId);
                    return (
                      <option key={item.id} value={item.id}>
                        {pl?.name} | Lote: {item.batchNumber} ({item.condition}) - Saldo: {item.metersAvailable.toLocaleString('pt-BR')}m - R$ {item.costPerMeter}/m
                      </option>
                    );
                  })}
                </select>
              )}
            </div>

            {/* Metragem e Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  5. Quantidade a Instalar (Metros Lineares) *
                </label>
                <input
                  type="number"
                  step="10"
                  min="1"
                  value={metersToInstall}
                  onChange={(e) => setMetersToInstall(parseFloat(e.target.value) || 0)}
                  required
                  className={`w-full bg-stone-50 border rounded-lg p-2.5 font-bold text-sm focus:outline-none ${
                    isInsufficientStock ? 'border-red-400 text-red-700 bg-red-50' : 'border-stone-300 text-stone-900'
                  }`}
                />
                {isInsufficientStock && (
                  <p className="text-[11px] text-red-600 mt-1 font-semibold flex items-center gap-1">
                    <AlertCircle className="w-3.5 h-3.5" />
                    Quantidade excede o saldo em estoque ({availableStockMeters}m disponíveis)!
                  </p>
                )}
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  6. Data da Instalação / Troca *
                </label>
                <input
                  type="date"
                  value={installationDate}
                  onChange={(e) => setInstallationDate(e.target.value)}
                  required
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 font-medium"
                />
              </div>
            </div>

            {/* Responsável e Observações */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  7. Responsável Técnico / Encarregado *
                </label>
                <input
                  type="text"
                  value={responsibleName}
                  onChange={(e) => setResponsibleName(e.target.value)}
                  required
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  8. Observações Operacionais
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Parral de Uva Vitória, tensão alta contra ventos"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900"
                />
              </div>
            </div>

            {/* Botão de Registro */}
            <div className="pt-3 border-t border-stone-100 flex items-center justify-between">
              <div className="text-xs text-stone-600">
                Operador: <strong className="text-stone-800">{currentUser.name}</strong> ({currentUser.role})
              </div>

              <button
                type="submit"
                disabled={isSubmitting || isInsufficientStock || farmStockItems.length === 0}
                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition shadow-xs
                  ${isInsufficientStock || farmStockItems.length === 0
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                    : 'bg-[#8E1057] hover:bg-[#750D48] text-white'}
                `}
              >
                {isSubstitution ? <RefreshCw className="w-4 h-4" /> : <CheckCircle2 className="w-4 h-4" />}
                <span>{isSubstitution ? 'Registrar Substituição & Baixar Estoque' : 'Confirmar e Baixar do Estoque'}</span>
              </button>
            </div>
          </form>
        </div>

        {/* Resumo da Operação em Tempo Real */}
        <div className="bg-[#FAF6F8] rounded-2xl border border-[#F0E4EB] p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="font-bold text-[#1E120D] text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-[#F0E4EB]">
              <Sparkles className="w-4 h-4 text-[#D65F95]" />
              Resumo do Débito em Estoque
            </h4>

            {currentStockItem ? (
              <div className="space-y-3 text-xs">
                <div className="p-3 bg-white rounded-xl border border-[#F0E4EB] space-y-1">
                  <span className="text-[10px] text-[#1E120D]/60 block font-medium uppercase">Plástico a Utilizar</span>
                  <p className="font-bold text-[#1E120D]">{currentPlastic?.name}</p>
                  <p className="text-[11px] text-[#1E120D]/60">Lote: <strong className="font-mono text-[#1E120D]">{currentStockItem.batchNumber}</strong> ({currentStockItem.condition})</p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="p-2.5 bg-white rounded-xl border border-[#F0E4EB]">
                    <span className="text-[10px] text-[#1E120D]/60 block uppercase">Saldo Antes</span>
                    <strong className="text-[#1E120D] text-sm font-black">{availableStockMeters.toLocaleString('pt-BR')} m</strong>
                  </div>
                  <div className="p-2.5 bg-white rounded-xl border border-[#F0E4EB]">
                    <span className="text-[10px] text-[#1E120D]/60 block uppercase">Saldo Depois</span>
                    <strong className={`text-sm font-black ${isInsufficientStock ? 'text-red-600' : 'text-[#8E1057]'}`}>
                      {Math.max(0, availableStockMeters - metersToInstall).toLocaleString('pt-BR')} m
                    </strong>
                  </div>
                </div>

                {currentParcel && (
                  <div className="p-2.5 bg-white rounded-xl border border-[#F0E4EB] text-[11px] text-[#1E120D]/70 space-y-0.5">
                    <p>Parcela Destino: <strong>{currentParcel.parcelCode}</strong> ({currentParcel.sector})</p>
                    <p>Variedade: <strong>{currentParcel.variety}</strong> ({currentParcel.hectares} ha)</p>
                    <p>Supervisor: <strong>{currentParcel.supervisor}</strong></p>
                    {isSubstitution && (
                      <p className="text-amber-800 font-bold mt-1">
                        Substituindo plástico anterior: {currentParcel.currentPlasticType || 'Plástico anterior'}
                      </p>
                    )}
                  </div>
                )}
              </div>
            ) : null}
          </div>

          <div className="mt-4 p-3 bg-stone-100 rounded-xl text-[11px] text-[#1E120D]/60">
            <Info className="w-4 h-4 text-[#8E1057] inline mr-1 -mt-0.5" />
            O registro atualiza automaticamente o histórico de coberturas da parcela e deduz o saldo no estoque da fazenda.
          </div>
        </div>
      </div>

      {/* Histórico de Instalações e Substituições Registradas */}
      <div className="bg-white border border-[#F0E4EB] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#F0E4EB] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[#1E120D] text-sm">
              Instalações e Substituições Registradas ({filteredInstallations.length})
            </h3>
            <p className="text-xs text-[#1E120D]/60">
              Acompanhamento de coberturas ativas e substituídas por parcela
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF6F8] text-[#1E120D]/80 font-semibold border-b border-[#F0E4EB] uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Fazenda</th>
                <th className="py-3 px-4">Setor & Parcela</th>
                <th className="py-3 px-4">Material Plástico</th>
                <th className="py-3 px-4">Lote / Condição</th>
                <th className="py-3 px-4 text-right">Metros</th>
                <th className="py-3 px-4 text-center">Tipo</th>
                <th className="py-3 px-4 text-center">Status</th>
                <th className="py-3 px-4">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredInstallations.map(inst => {
                const farm = farms.find(f => f.id === inst.farmId);
                const parcel = parcels.find(p => p.id === inst.parcelId);

                return (
                  <tr key={inst.id} className="hover:bg-stone-50/80 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-stone-600 whitespace-nowrap">
                      {new Date(inst.installationDate + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 font-bold text-stone-800">
                      {farm?.name || inst.farmId}
                    </td>
                    <td className="py-3 px-4">
                      <p className="font-bold text-stone-900">{inst.parcelCode}</p>
                      <p className="text-[11px] text-stone-500">{inst.sector} • {parcel?.variety}</p>
                    </td>
                    <td className="py-3 px-4 font-medium text-stone-900">
                      {inst.plasticName}
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-semibold">{inst.batchNumber}</span>
                      <span className="ml-1 text-[10px] text-stone-400">({inst.conditionUsed})</span>
                    </td>
                    <td className="py-3 px-4 text-right font-black text-stone-900">
                      {inst.metersInstalled.toLocaleString('pt-BR')} m
                    </td>
                    <td className="py-3 px-4 text-center">
                      {inst.isSubstitution ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800 border border-amber-200">
                          SUBSTITUIÇÃO
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800 border border-blue-200">
                          NOVA INSTALAÇÃO
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-center">
                      {inst.status === 'ATIVO' ? (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF6F8] text-[#8E1057] border border-[#D65F95]/40">
                          ATIVO
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-600 border border-stone-200">
                          {inst.status}
                        </span>
                      )}
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      <p className="font-medium text-stone-800">{inst.responsibleName}</p>
                      <p className="text-[10px] text-stone-400">Reg: {inst.registeredBy}</p>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
