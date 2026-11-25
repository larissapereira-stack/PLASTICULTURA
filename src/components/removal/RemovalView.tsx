import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { RemovalReason } from '../../types';
import { 
  Recycle, 
  Trash2, 
  CheckCircle2, 
  AlertCircle, 
  TrendingUp, 
  Calendar, 
  Building2, 
  Layers, 
  History,
  Sparkles,
  Info
} from 'lucide-react';

const REMOVAL_REASONS: RemovalReason[] = [
  'Fim de Ciclo / Poda',
  'Dano Climático (Vento / Granizo)',
  'Desgaste / Ressecamento',
  'Substituição de Variedade',
  'Substituição por Novo Plástico',
  'Outro'
];

export const RemovalView: React.FC = () => {
  const { 
    farms, 
    parcels, 
    plastics, 
    installations, 
    removals, 
    registerRemoval, 
    canPerform, 
    currentUser,
    filters 
  } = useApp();

  const [selectedFarmId, setSelectedFarmId] = useState<string>(farms[0]?.id || '');
  const [selectedParcelId, setSelectedParcelId] = useState<string>('');
  const [selectedPlasticId, setSelectedPlasticId] = useState<string>(plastics[0]?.id || '');
  const [selectedInstallationId, setSelectedInstallationId] = useState<string>('');

  const [totalMetersRemoved, setTotalMetersRemoved] = useState<number>(1000);
  const [reusableMeters, setReusableMeters] = useState<number>(800);
  const [discardedMeters, setDiscardedMeters] = useState<number>(200);
  const [removalDate, setRemovalDate] = useState<string>(new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState<RemovalReason>('Fim de Ciclo / Poda');
  const [responsibleName, setResponsibleName] = useState<string>(currentUser.name);
  const [notes, setNotes] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Parcels belonging to selected farm
  const farmParcels = parcels.filter(p => p.farmId === selectedFarmId);
  const currentParcelId = selectedParcelId || farmParcels[0]?.id || '';
  const currentParcel = parcels.find(p => p.id === currentParcelId);

  // Active installations on that parcel
  const parcelInstallations = installations.filter(
    i => i.parcelId === currentParcelId && i.status === 'ATIVO'
  );

  const selectedPlastic = plastics.find(p => p.id === selectedPlasticId);
  const costPerMeter = selectedPlastic?.pricePerMeter || 4.80;

  const isSumConsistent = (reusableMeters + discardedMeters) === totalMetersRemoved;
  const reusePercentage = totalMetersRemoved > 0 ? Math.round((reusableMeters / totalMetersRemoved) * 100) : 0;
  const discardPercentage = totalMetersRemoved > 0 ? Math.round((discardedMeters / totalMetersRemoved) * 100) : 0;
  
  const reusableValueEst = reusableMeters * (costPerMeter * 0.55);
  const discardedLossEst = discardedMeters * costPerMeter;

  // Filtered removals
  const filteredRemovals = removals.filter(rem => {
    if (filters.farmId !== 'all' && rem.farmId !== filters.farmId) return false;
    if (filters.plasticId !== 'all' && rem.plasticId !== filters.plasticId) return false;
    return true;
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isSumConsistent) {
      alert('A soma de metros reaproveitáveis e descartados deve ser exatamente igual ao total retirado!');
      return;
    }

    setIsSubmitting(true);
    const res = registerRemoval({
      installationId: selectedInstallationId || undefined,
      farmId: selectedFarmId,
      parcelId: currentParcelId,
      plasticId: selectedPlasticId,
      totalMetersRemoved,
      reusableMeters,
      discardedMeters,
      removalDate,
      reason,
      responsibleName,
      notes
    });

    setIsSubmitting(false);
    if (res.success) {
      setNotes('');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#F0E4EB] shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-[#8E1057] uppercase tracking-wider mb-1">
          <Recycle className="w-4 h-4 text-[#D65F95]" />
          Sustentabilidade & Logística Reversa
        </div>
        <h2 className="text-xl font-extrabold text-[#1E120D] tracking-tight">
          Retirada e Reutilização de Plásticos por Parcela
        </h2>
        <p className="text-xs text-[#1E120D]/60 mt-0.5">
          O material reaproveitado retorna automaticamente ao estoque como "Material Reutilizado" com lote próprio e rastreabilidade da parcela de origem.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Formulário de Retirada (2 colunas) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-[#F0E4EB] p-5 shadow-xs">
          <h3 className="font-bold text-[#1E120D] text-sm mb-4 pb-2 border-b border-[#F0E4EB]">
            Registrar Desmontagem / Retirada de Parcela
          </h3>

          <form onSubmit={handleSubmit} className="space-y-4 text-xs">
            {/* Fazenda e Parcela */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#1E120D]/80 mb-1">
                  1. Fazenda de Origem *
                </label>
                <select
                  value={selectedFarmId}
                  onChange={(e) => {
                    setSelectedFarmId(e.target.value);
                    setSelectedParcelId('');
                  }}
                  required
                  className="w-full bg-[#FAF6F8] border border-[#F0E4EB] rounded-lg p-2.5 font-bold text-[#1E120D] focus:ring-1 focus:ring-[#8E1057] focus:outline-none"
                >
                  {farms.map(f => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1E120D]/80 mb-1">
                  2. Parcela de Retirada *
                </label>
                <select
                  value={currentParcelId}
                  onChange={(e) => setSelectedParcelId(e.target.value)}
                  required
                  className="w-full bg-[#FAF6F8] border border-[#F0E4EB] rounded-lg p-2.5 font-bold text-[#1E120D] focus:ring-1 focus:ring-[#8E1057] focus:outline-none"
                >
                  {farmParcels.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.parcelCode} - {p.variety} ({p.sector}) - {p.hectares} ha
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Instalação Ativa e Material */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  3. Vincular à Instalação Ativa (Opcional)
                </label>
                <select
                  value={selectedInstallationId}
                  onChange={(e) => {
                    const instId = e.target.value;
                    setSelectedInstallationId(instId);
                    const inst = installations.find(i => i.id === instId);
                    if (inst) {
                      setSelectedPlasticId(inst.plasticId);
                      setTotalMetersRemoved(inst.metersActiveRemaining);
                      setReusableMeters(Math.round(inst.metersActiveRemaining * 0.8));
                      setDiscardedMeters(Math.round(inst.metersActiveRemaining * 0.2));
                    }
                  }}
                  className="w-full bg-[#FAF6F8] border border-[#F0E4EB] rounded-lg p-2.5 text-[#1E120D] focus:ring-1 focus:ring-[#8E1057] focus:outline-none"
                >
                  <option value="">Lançamento Geral na Parcela</option>
                  {parcelInstallations.map(inst => (
                    <option key={inst.id} value={inst.id}>
                      {inst.plasticName} | {inst.metersActiveRemaining}m restantes (Lote: {inst.batchNumber})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  4. Tipo de Plástico Retirado *
                </label>
                <select
                  value={selectedPlasticId}
                  onChange={(e) => setSelectedPlasticId(e.target.value)}
                  required
                  className="w-full bg-[#FAF6F8] border border-[#F0E4EB] rounded-lg p-2.5 text-[#1E120D] font-medium focus:ring-1 focus:ring-[#8E1057] focus:outline-none"
                >
                  {plastics.map(p => (
                    <option key={p.id} value={p.id}>
                      {p.name} ({p.thicknessMicrons}µm)
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Metragens: Total, Reuso, Descarte */}
            <div className="p-4 bg-[#FAF6F8] rounded-xl border border-[#F0E4EB] space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div>
                  <label className="block font-bold text-stone-800 mb-1">
                    5. Total Retirado (m) *
                  </label>
                  <input
                    type="number"
                    step="10"
                    min="1"
                    value={totalMetersRemoved}
                    onChange={(e) => {
                      const total = parseFloat(e.target.value) || 0;
                      setTotalMetersRemoved(total);
                      const re = Math.round(total * 0.8);
                      setReusableMeters(re);
                      setDiscardedMeters(total - re);
                    }}
                    required
                    className="w-full bg-white border border-[#F0E4EB] rounded-lg p-2.5 font-black text-sm text-[#1E120D] focus:ring-1 focus:ring-[#8E1057] focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block font-bold text-[#8E1057] mb-1">
                    6. Reaproveitável (m) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max={totalMetersRemoved}
                    value={reusableMeters}
                    onChange={(e) => {
                      const re = parseFloat(e.target.value) || 0;
                      setReusableMeters(re);
                      setDiscardedMeters(Math.max(0, totalMetersRemoved - re));
                    }}
                    required
                    className="w-full bg-white border border-[#D65F95]/50 rounded-lg p-2.5 font-black text-sm text-[#8E1057] focus:ring-1 focus:ring-[#8E1057] focus:outline-none shadow-xs"
                  />
                  <span className="text-[10px] text-[#8E1057] font-semibold block mt-0.5">
                    Retorna ao estoque como Reutilizado
                  </span>
                </div>

                <div>
                  <label className="block font-bold text-red-800 mb-1">
                    7. Descartado / Perda (m) *
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="0"
                    max={totalMetersRemoved}
                    value={discardedMeters}
                    onChange={(e) => {
                      const disc = parseFloat(e.target.value) || 0;
                      setDiscardedMeters(disc);
                      setReusableMeters(Math.max(0, totalMetersRemoved - disc));
                    }}
                    required
                    className="w-full bg-red-50/50 border border-red-300 rounded-lg p-2.5 font-black text-sm text-red-900 focus:ring-1 focus:ring-red-600 focus:outline-none"
                  />
                  <span className="text-[10px] text-red-600 font-semibold block mt-0.5">
                    Material danificado / sucata
                  </span>
                </div>
              </div>

              {!isSumConsistent && (
                <div className="p-2.5 bg-red-100 text-red-900 rounded-lg text-xs font-semibold flex items-center gap-1.5">
                  <AlertCircle className="w-4 h-4 text-red-700 shrink-0" />
                  Inconsistência: {reusableMeters}m + {discardedMeters}m ≠ {totalMetersRemoved}m. A soma deve fechar exatamente.
                </div>
              )}
            </div>

            {/* Motivo e Data */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">
                  8. Motivo da Retirada *
                </label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value as RemovalReason)}
                  required
                  className="w-full bg-[#FAF6F8] border border-[#F0E4EB] rounded-lg p-2.5 text-[#1E120D] focus:ring-1 focus:ring-[#8E1057] focus:outline-none font-medium"
                >
                  {REMOVAL_REASONS.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block font-semibold text-[#1E120D]/80 mb-1">
                  9. Data da Retirada *
                </label>
                <input
                  type="date"
                  value={removalDate}
                  onChange={(e) => setRemovalDate(e.target.value)}
                  required
                  className="w-full bg-[#FAF6F8] border border-[#F0E4EB] rounded-lg p-2.5 text-[#1E120D] font-medium"
                />
              </div>
            </div>

            {/* Responsável e Observações */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block font-semibold text-[#1E120D]/80 mb-1">
                  10. Responsável Técnico *
                </label>
                <input
                  type="text"
                  value={responsibleName}
                  onChange={(e) => setResponsibleName(e.target.value)}
                  required
                  className="w-full bg-[#FAF6F8] border border-[#F0E4EB] rounded-lg p-2.5 text-[#1E120D] font-medium"
                />
              </div>

              <div>
                <label className="block font-semibold text-[#1E120D]/80 mb-1">
                  11. Observações sobre o Estado do Plástico
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Ex: Bobinas enroladas e limpas para reuso"
                  className="w-full bg-[#FAF6F8] border border-[#F0E4EB] rounded-lg p-2.5 text-[#1E120D]"
                />
              </div>
            </div>

            <div className="pt-3 border-t border-[#F0E4EB] flex items-center justify-between">
              <span className="text-xs text-[#1E120D]/60">
                Operador: <strong>{currentUser.name}</strong> ({currentUser.role})
              </span>

              <button
                type="submit"
                disabled={isSubmitting || !isSumConsistent || totalMetersRemoved <= 0}
                className={`
                  flex items-center gap-2 px-6 py-2.5 rounded-xl font-bold text-xs transition shadow-xs
                  ${!isSumConsistent || totalMetersRemoved <= 0
                    ? 'bg-stone-300 text-stone-500 cursor-not-allowed'
                    : 'bg-[#8E1057] hover:bg-[#750D48] text-white'}
                `}
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Salvar Retirada e Reincorporar ao Estoque</span>
              </button>
            </div>
          </form>
        </div>

        {/* Indicador de Economia e Reuso em Tempo Real */}
        <div className="bg-[#FAF6F8] rounded-2xl border border-[#F0E4EB] p-5 shadow-xs flex flex-col justify-between">
          <div className="space-y-4">
            <h4 className="font-bold text-[#1E120D] text-xs uppercase tracking-wider flex items-center gap-1.5 pb-2 border-b border-[#F0E4EB]">
              <TrendingUp className="w-4 h-4 text-[#D65F95]" />
              Impacto Econômico e Sustentável
            </h4>

            {/* Barra Visual de Proporção Reuso vs Descarte */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between text-xs font-semibold">
                <span className="text-[#8E1057]">Reuso: {reusePercentage}%</span>
                <span className="text-red-700">Perda: {discardPercentage}%</span>
              </div>
              <div className="h-3 w-full bg-stone-200 rounded-full overflow-hidden flex">
                <div style={{ width: `${reusePercentage}%` }} className="bg-[#8E1057] h-full transition-all" />
                <div style={{ width: `${discardPercentage}%` }} className="bg-red-500 h-full transition-all" />
              </div>
            </div>

            <div className="space-y-2.5 text-xs">
              <div className="p-3 bg-[#FAF6F8] rounded-xl border border-[#D65F95]/40 space-y-1">
                <span className="text-[10px] text-[#8E1057] block uppercase font-bold">Valor Economizado com Reuso</span>
                <strong className="text-[#8E1057] text-lg font-black block">
                  R$ {reusableValueEst.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
                <p className="text-[11px] text-[#1E120D]/80">
                  {reusableMeters.toLocaleString('pt-BR')}m serão reinseridos no estoque como material reutilizado.
                </p>
              </div>

              <div className="p-3 bg-red-50 rounded-xl border border-red-200 space-y-1">
                <span className="text-[10px] text-red-700 block uppercase font-bold">Prejuízo com Descarte / Perda</span>
                <strong className="text-red-900 text-lg font-black block">
                  R$ {discardedLossEst.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
                </strong>
                <p className="text-[11px] text-red-800">
                  {discardedMeters.toLocaleString('pt-BR')}m descartados por dano ou fim de vida útil.
                </p>
              </div>
            </div>
          </div>

          <div className="mt-4 p-3 bg-stone-100 rounded-xl text-[11px] text-[#1E120D]/60">
            <Info className="w-4 h-4 text-[#8E1057] inline mr-1 -mt-0.5" />
            Um novo lote de material reaproveitado será criado com a indicação da parcela de origem.
          </div>
        </div>
      </div>

      {/* Histórico de Retiradas Registradas */}
      <div className="bg-white border border-[#F0E4EB] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#F0E4EB] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[#1E120D] text-sm">
              Histórico de Retiradas e Reutilizações ({filteredRemovals.length})
            </h3>
            <p className="text-xs text-[#1E120D]/60">
              Rastreamento de destinação e lotes gerados para reuso
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF6F8] text-[#1E120D]/80 font-semibold border-b border-[#F0E4EB] uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Data</th>
                <th className="py-3 px-4">Fazenda</th>
                <th className="py-3 px-4">Parcela Origem</th>
                <th className="py-3 px-4">Material</th>
                <th className="py-3 px-4 text-right">Total Retirado</th>
                <th className="py-3 px-4 text-right text-[#8E1057]">Reaproveitável</th>
                <th className="py-3 px-4 text-right text-red-700">Descartado</th>
                <th className="py-3 px-4">Lote Gerado Reuso</th>
                <th className="py-3 px-4">Motivo</th>
                <th className="py-3 px-4">Responsável</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {filteredRemovals.map(rem => {
                const farm = farms.find(f => f.id === rem.farmId);
                const parcel = parcels.find(p => p.id === rem.parcelId);

                return (
                  <tr key={rem.id} className="hover:bg-stone-50/80 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-stone-600 whitespace-nowrap">
                      {new Date(rem.removalDate + 'T12:00:00Z').toLocaleDateString('pt-BR')}
                    </td>
                    <td className="py-3 px-4 font-bold text-[#1E120D]">
                      {farm?.name || rem.farmId}
                    </td>
                    <td className="py-3 px-4 font-medium text-[#1E120D]">
                      {parcel?.parcelCode || rem.parcelId} <span className="text-[11px] text-[#1E120D]/60">({parcel?.sector})</span>
                    </td>
                    <td className="py-3 px-4 text-[#1E120D]">
                      {rem.plasticName}
                    </td>
                    <td className="py-3 px-4 text-right font-black text-[#1E120D]">
                      {rem.totalMetersRemoved.toLocaleString('pt-BR')} m
                    </td>
                    <td className="py-3 px-4 text-right font-black text-[#8E1057] bg-[#FAF6F8]">
                      {rem.reusableMeters.toLocaleString('pt-BR')} m
                    </td>
                    <td className="py-3 px-4 text-right font-bold text-red-600 bg-red-50/50">
                      {rem.discardedMeters.toLocaleString('pt-BR')} m
                    </td>
                    <td className="py-3 px-4">
                      <span className="font-mono text-xs font-bold text-cyan-900 bg-cyan-100 px-2 py-0.5 rounded">
                        {rem.generatedBatchNumber}
                      </span>
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      {rem.reason}
                    </td>
                    <td className="py-3 px-4 text-stone-600">
                      {rem.responsibleName}
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
