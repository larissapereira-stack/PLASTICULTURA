import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { PlasticMaterial, PlasticCategory } from '../../types';
import { 
  Layers, 
  Plus, 
  Edit3, 
  Search, 
  ShieldCheck, 
  Tag, 
  Truck, 
  Factory, 
  Calendar, 
  CircleDollarSign,
  Boxes,
  X,
  Sparkles,
  Info
} from 'lucide-react';

const CATEGORIES: PlasticCategory[] = [
  'Cobertura de Parral',
  'Mulching (Solo)',
  'Mini-Túnel',
  'Macrotúnel',
  'Cortina Corta-Vento',
  'Silagem / Fardamento'
];

export const PlasticsCatalogView: React.FC = () => {
  const { plastics, stock, installations, savePlastic, canPerform } = useApp();

  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingPlastic, setEditingPlastic] = useState<PlasticMaterial | null>(null);

  const canEdit = canPerform('EDIT_MASTER');

  const filteredPlastics = plastics.filter(p => {
    const matchesSearch = 
      p.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.manufacturer.toLowerCase().includes(searchQuery.toLowerCase()) ||
      p.supplier.toLowerCase().includes(searchQuery.toLowerCase());

    const matchesCategory = selectedCategory === 'all' || p.category === selectedCategory;

    return matchesSearch && matchesCategory;
  });

  const handleFormSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);

    const newPlastic: PlasticMaterial = {
      id: editingPlastic ? editingPlastic.id : `pla-${Date.now()}`,
      name: formData.get('name') as string,
      category: formData.get('category') as PlasticCategory,
      thicknessMicrons: parseFloat(formData.get('thicknessMicrons') as string) || 150,
      widthMeters: parseFloat(formData.get('widthMeters') as string) || 2.4,
      color: formData.get('color') as string,
      manufacturer: formData.get('manufacturer') as string,
      rollLengthMeters: parseFloat(formData.get('rollLengthMeters') as string) || 500,
      pricePerMeter: parseFloat(formData.get('pricePerMeter') as string) || 0,
      supplier: formData.get('supplier') as string,
      acquisitionDate: formData.get('acquisitionDate') as string || new Date().toISOString().slice(0, 10),
      lifespanExpectedMonths: parseInt(formData.get('lifespanExpectedMonths') as string) || 24,
      minStockAlertMeters: parseFloat(formData.get('minStockAlertMeters') as string) || 2000,
      notes: formData.get('notes') as string,
      createdAt: editingPlastic ? editingPlastic.createdAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    savePlastic(newPlastic);
    setIsModalOpen(false);
    setEditingPlastic(null);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-5 rounded-2xl border border-[#F0E4EB] shadow-xs">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#8E1057] uppercase tracking-wider mb-1">
            <Layers className="w-4 h-4 text-[#D65F95]" />
            Especificações Técnicas
          </div>
          <h2 className="text-xl font-extrabold text-[#1E120D] tracking-tight">
            Catálogo de Plásticos Agrícolas
          </h2>
          <p className="text-xs text-[#1E120D]/60 mt-0.5">
            Cadastre os filmes difusores, mulching, térmicos e coberturas com espessura, metragem de rolo e valores contratuais.
          </p>
        </div>

        {canEdit && (
          <button
            onClick={() => {
              setEditingPlastic(null);
              setIsModalOpen(true);
            }}
            className="flex items-center gap-2 text-xs font-bold bg-[#8E1057] hover:bg-[#750D48] text-white px-4 py-2.5 rounded-xl transition shadow-xs self-start sm:self-auto"
          >
            <Plus className="w-4 h-4" />
            <span>Novo Plástico</span>
          </button>
        )}
      </div>

      {/* Filter and Search Bar */}
      <div className="bg-white border border-[#F0E4EB] rounded-xl p-4 shadow-xs flex flex-col md:flex-row items-center justify-between gap-3 text-xs">
        <div className="relative w-full md:w-80">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-stone-400" />
          <input
            type="text"
            placeholder="Buscar por nome, fabricante ou fornecedor..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#FAF6F8] border border-[#F0E4EB] rounded-lg pl-9 pr-3 py-2 text-[#1E120D] focus:outline-none focus:ring-1 focus:ring-[#8E1057] font-medium"
          />
        </div>

        <div className="flex flex-wrap items-center gap-1.5 w-full md:w-auto">
          <button
            onClick={() => setSelectedCategory('all')}
            className={`px-3 py-1.5 rounded-lg font-medium transition ${
              selectedCategory === 'all' 
                ? 'bg-[#8E1057] text-white font-semibold shadow-xs' 
                : 'bg-[#FAF6F8] text-[#1E120D] hover:bg-pink-100/50'
            }`}
          >
            Todos ({plastics.length})
          </button>
          {CATEGORIES.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-3 py-1.5 rounded-lg font-medium transition ${
                selectedCategory === cat 
                  ? 'bg-[#8E1057] text-white font-semibold shadow-xs' 
                  : 'bg-[#FAF6F8] text-[#1E120D] hover:bg-pink-100/50'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Grid of Plastic Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filteredPlastics.map(plastic => {
          // Stock and installations calculation
          const totalInStock = stock
            .filter(s => s.plasticId === plastic.id)
            .reduce((sum, s) => sum + s.metersAvailable, 0);

          const totalInstalled = installations
            .filter(i => i.plasticId === plastic.id && i.status !== 'CONCLUIDO_RETIRADO')
            .reduce((sum, i) => sum + i.metersActiveRemaining, 0);

          const rollPrice = plastic.pricePerMeter * plastic.rollLengthMeters;

          return (
            <div 
              key={plastic.id}
              className="bg-white border border-[#F0E4EB] rounded-2xl p-5 shadow-xs hover:border-[#D65F95]/50 hover:shadow-md transition-all flex flex-col justify-between"
            >
              <div>
                <div className="flex items-start justify-between gap-2 mb-2">
                  <span className="px-2.5 py-0.5 rounded-full text-[10px] font-bold bg-[#FAF6F8] text-[#8E1057] border border-[#D65F95]/40">
                    {plastic.category}
                  </span>

                  {canEdit && (
                    <button
                      onClick={() => {
                        setEditingPlastic(plastic);
                        setIsModalOpen(true);
                      }}
                      className="p-1 rounded text-stone-400 hover:text-[#8E1057] hover:bg-stone-100 transition"
                      title="Editar Plástico"
                    >
                      <Edit3 className="w-4 h-4" />
                    </button>
                  )}
                </div>

                <h3 className="font-extrabold text-[#1E120D] text-base leading-snug">
                  {plastic.name}
                </h3>
                <p className="text-xs text-[#1E120D]/60 mt-0.5 flex items-center gap-1.5">
                  <Factory className="w-3.5 h-3.5 text-stone-400" />
                  {plastic.manufacturer} • Fornecedor: {plastic.supplier}
                </p>

                {plastic.manufacturer.toLowerCase().includes('serroplast') && (
                  <div className="mt-2.5 p-2 rounded-lg bg-[#FAF6F8] border border-[#D65F95]/30 flex items-center justify-between text-xs">
                    <span className="text-[#8E1057] font-bold flex items-center gap-1.5">
                      <span className="w-1.5 h-1.5 rounded-full bg-[#8E1057]" />
                      Área Oficial em Parrais:
                    </span>
                    <strong className="text-[#8E1057] font-black">273,27 ha (4 Fazendas)</strong>
                  </div>
                )}

                {/* Specs Grid */}
                <div className="grid grid-cols-3 gap-2 mt-4 p-3 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] text-center text-xs">
                  <div>
                    <span className="text-[10px] text-[#1E120D]/60 block font-medium uppercase">Espessura</span>
                    <span className="font-extrabold text-[#1E120D] text-sm">{plastic.thicknessMicrons} µm</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#1E120D]/60 block font-medium uppercase">Largura</span>
                    <span className="font-extrabold text-[#1E120D] text-sm">{plastic.widthMeters} m</span>
                  </div>
                  <div>
                    <span className="text-[10px] text-[#1E120D]/60 block font-medium uppercase">Rolo</span>
                    <span className="font-extrabold text-[#1E120D] text-sm">{plastic.rollLengthMeters} m</span>
                  </div>
                </div>

                {/* Pricing & Colors */}
                <div className="mt-3 space-y-1.5 text-xs">
                  <div className="flex items-center justify-between text-[#1E120D]/70">
                    <span>Cor / Acabamento:</span>
                    <strong className="text-[#1E120D]">{plastic.color}</strong>
                  </div>
                  <div className="flex items-center justify-between text-[#1E120D]/70">
                    <span>Valor por Metro:</span>
                    <strong className="text-[#8E1057] font-extrabold text-sm">
                      R$ {plastic.pricePerMeter.toFixed(2)} /m
                    </strong>
                  </div>
                  <div className="flex items-center justify-between text-[#1E120D]/60 text-[11px]">
                    <span>Custo estimado por rolo:</span>
                    <span>R$ {rollPrice.toLocaleString('pt-BR', { minimumFractionDigits: 2 })}</span>
                  </div>
                </div>
              </div>

              {/* Stock status footer */}
              <div className="mt-4 pt-3 border-t border-stone-100 flex items-center justify-between text-xs">
                <div>
                  <span className="text-[10px] text-stone-400 block font-medium uppercase">Saldo Atual</span>
                  <span className="font-black text-stone-900 text-sm">
                    {totalInStock.toLocaleString('pt-BR')} m
                  </span>
                </div>
                <div className="text-right">
                  <span className="text-[10px] text-stone-400 block font-medium uppercase">Em Campo Ativo</span>
                  <span className="font-black text-[#8E1057] text-sm">
                    {totalInstalled.toLocaleString('pt-BR')} m
                  </span>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* --- MODAL DE CADASTRO / EDIÇÃO DE PLÁSTICO --- */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-stone-900/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-stone-200 animate-scale-up max-h-[92vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-stone-200">
              <h3 className="text-base font-bold text-stone-900">
                {editingPlastic ? 'Editar Material Plástico' : 'Cadastrar Novo Tipo de Plástico'}
              </h3>
              <button 
                onClick={() => setIsModalOpen(false)}
                className="p-1 rounded-lg hover:bg-stone-100 text-stone-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleFormSubmit} className="space-y-4 mt-4 text-xs">
              <div>
                <label className="block font-semibold text-stone-700 mb-1">Nome Comercial do Material *</label>
                <input
                  name="name"
                  defaultValue={editingPlastic?.name || ''}
                  required
                  placeholder="Ex: Ginegar Cover UV 150µm Difusor Antigotejo"
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:ring-1 focus:ring-[#8E1057] focus:outline-none font-medium"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Tipo / Finalidade *</label>
                  <select
                    name="category"
                    defaultValue={editingPlastic?.category || 'Cobertura de Parral'}
                    required
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:ring-1 focus:ring-[#8E1057] focus:outline-none"
                  >
                    {CATEGORIES.map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Cor / Acabamento *</label>
                  <input
                    name="color"
                    defaultValue={editingPlastic?.color || 'Translúcido Difuso'}
                    required
                    placeholder="Ex: Prata/Preto, Translúcido, Leitoso"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:ring-1 focus:ring-[#8E1057] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Espessura (µm) *</label>
                  <input
                    name="thicknessMicrons"
                    type="number"
                    step="1"
                    defaultValue={editingPlastic?.thicknessMicrons || 150}
                    required
                    placeholder="150"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:ring-1 focus:ring-[#8E1057] focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Largura (Metros) *</label>
                  <input
                    name="widthMeters"
                    type="number"
                    step="0.05"
                    defaultValue={editingPlastic?.widthMeters || 2.4}
                    required
                    placeholder="2.4"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:ring-1 focus:ring-[#8E1057] focus:outline-none font-bold"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Rolo (Metros) *</label>
                  <input
                    name="rollLengthMeters"
                    type="number"
                    step="1"
                    defaultValue={editingPlastic?.rollLengthMeters || 500}
                    required
                    placeholder="500"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:ring-1 focus:ring-[#8E1057] focus:outline-none font-bold"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Fabricante *</label>
                  <input
                    name="manufacturer"
                    defaultValue={editingPlastic?.manufacturer || ''}
                    required
                    placeholder="Ex: Ginegar, Nortène, Electroplastic"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:ring-1 focus:ring-[#8E1057] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Fornecedor *</label>
                  <input
                    name="supplier"
                    defaultValue={editingPlastic?.supplier || ''}
                    required
                    placeholder="Ex: Distribuidora Agrícola do Vale"
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:ring-1 focus:ring-[#8E1057] focus:outline-none"
                  />
                </div>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Valor por Metro (R$) *</label>
                  <input
                    name="pricePerMeter"
                    type="number"
                    step="0.01"
                    defaultValue={editingPlastic?.pricePerMeter || 4.80}
                    required
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-[#8E1057] font-extrabold focus:ring-1 focus:ring-[#8E1057] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Data Aquisição *</label>
                  <input
                    name="acquisitionDate"
                    type="date"
                    defaultValue={editingPlastic?.acquisitionDate || new Date().toISOString().slice(0, 10)}
                    required
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:ring-1 focus:ring-[#8E1057] focus:outline-none"
                  />
                </div>
                <div>
                  <label className="block font-semibold text-stone-700 mb-1">Alerta Mínimo (m)</label>
                  <input
                    name="minStockAlertMeters"
                    type="number"
                    defaultValue={editingPlastic?.minStockAlertMeters || 2000}
                    className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:ring-1 focus:ring-[#8E1057] focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-stone-700 mb-1">Observações Técnicas e Garantia</label>
                <textarea
                  name="notes"
                  rows={2}
                  defaultValue={editingPlastic?.notes || ''}
                  placeholder="Ex: Garantia do fabricante contra degradação solar por 3 anos com laudo."
                  className="w-full bg-stone-50 border border-stone-300 rounded-lg p-2.5 text-stone-900 focus:ring-1 focus:ring-[#8E1057] focus:outline-none"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-lg border border-stone-300 text-stone-700 hover:bg-stone-100 font-semibold"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-lg bg-[#8E1057] hover:bg-[#750D48] text-white font-bold transition shadow-xs"
                >
                  Salvar Material Plástico
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
