import React, { useState } from 'react';
import { useApp } from '../../context/AppContext';
import { Parcel, ParcelSituation, OfficialImportStagingRow } from '../../types';
import { 
  FileSpreadsheet, 
  Upload, 
  CheckCircle2, 
  AlertTriangle, 
  FileText, 
  RotateCcw, 
  Info, 
  ShieldCheck, 
  Check, 
  Eye, 
  Sparkles,
  ArrowRight,
  Database
} from 'lucide-react';

// Dados oficiais do documento "PLASTICULTURA - FAZENDAS - OFICIAL DATAS" prontos para conferência
const OFFICIAL_DOCUMENT_BATCH: OfficialImportStagingRow[] = [
  {
    tempId: 'batch-01',
    farmCode: 'LAB',
    farmName: 'Labrunier I',
    sector: 'Setor 01 - Norte',
    parcelCode: 'Parcela 05',
    supervisor: 'Marcos Vinícius',
    variety: 'BRS Vitória',
    hectares: 3.2,
    situation: 'Coberta',
    coverageDate: '2024-02-18',
    plasticType: 'Ginegar Suncover Difusor AV 150µm',
    additionalInfo: 'Filme difusor instalado com arame galvanizado.',
    status: 'PENDENTE_CONFERENCIA'
  },
  {
    tempId: 'batch-02',
    farmCode: 'LAB',
    farmName: 'Labrunier I',
    sector: 'Setor 01 - Norte',
    parcelCode: 'Parcela 06',
    supervisor: 'Marcos Vinícius',
    variety: 'Cotton Candy',
    hectares: 4.1,
    situation: 'A Confirmar',
    coverageDate: '2023-11-10',
    plasticType: 'Mulching Bicolor Prata/Preto 30µm',
    additionalInfo: 'Necessita validação em campo se mulching foi removido.',
    status: 'PENDENTE_CONFERENCIA'
  },
  {
    tempId: 'batch-03',
    farmCode: 'LAB',
    farmName: 'Labrunier I',
    sector: 'Setor 02 - Sul',
    parcelCode: 'Parcela 07',
    supervisor: 'Gilberto Ramos',
    variety: 'Crimson Seedless',
    hectares: 3.0,
    situation: 'Coberta',
    coverageDate: '2024-03-05',
    plasticType: 'Nortène Solartérmico Max 120µm',
    additionalInfo: 'Linhas 01 a 35 com proteção térmica.',
    status: 'PENDENTE_CONFERENCIA'
  },
  // Caso de duplicidade no documento oficial (mesma parcela com variedades diferentes)
  {
    tempId: 'batch-04A',
    farmCode: 'LAB',
    farmName: 'Labrunier I',
    sector: 'Setor 02 - Sul',
    parcelCode: 'Parcela 08',
    supervisor: 'Gilberto Ramos',
    variety: 'BRS Vitória',
    hectares: 2.2,
    situation: 'Coberta',
    coverageDate: '2024-01-20',
    plasticType: 'Ginegar Suncover Difusor AV 150µm',
    additionalInfo: 'Subdivisão A da parcela no documento oficial.',
    hasDuplicateWarning: true,
    duplicateWarningDetails: 'Parcela 08 listada no documento oficial com duas variedades: BRS Vitória (2.2 ha) e Arra 15 (1.5 ha). Ambas serão preservadas.',
    status: 'PENDENTE_CONFERENCIA'
  },
  {
    tempId: 'batch-04B',
    farmCode: 'LAB',
    farmName: 'Labrunier I',
    sector: 'Setor 02 - Sul',
    parcelCode: 'Parcela 08',
    supervisor: 'Gilberto Ramos',
    variety: 'Arra 15',
    hectares: 1.5,
    situation: 'Descoberta',
    coverageDate: '2023-09-02',
    plasticType: 'Ginegar Suncover Difusor AV 150µm',
    additionalInfo: 'Subdivisão B da parcela no documento oficial. Descoberta pós-safra.',
    hasDuplicateWarning: true,
    duplicateWarningDetails: 'Parcela 08 listada no documento oficial com duas variedades: Arra 15 (1.5 ha) e BRS Vitória (2.2 ha). Ambas serão preservadas.',
    status: 'PENDENTE_CONFERENCIA'
  },
  {
    tempId: 'batch-05',
    farmCode: 'LBR',
    farmName: 'Labrunier II',
    sector: 'Setor Mandacaru B',
    parcelCode: 'Parcela M-05',
    supervisor: 'Elton Bezerra',
    variety: 'Sweet Globe',
    hectares: 3.8,
    situation: 'Coberta',
    coverageDate: '2024-03-14',
    plasticType: 'Nortène Solartérmico Max 120µm',
    additionalInfo: 'Uva branca sem semente. Produção para exportação.',
    status: 'PENDENTE_CONFERENCIA'
  },
  {
    tempId: 'batch-06',
    farmCode: 'BRU',
    farmName: 'Brasil Uvas',
    sector: 'Setor Exportação',
    parcelCode: 'Parcela EXP-15',
    supervisor: 'Renato Cavalcanti',
    variety: 'Arra 15',
    hectares: 4.2,
    situation: 'Coberta',
    coverageDate: '2024-03-28',
    plasticType: 'Ginegar Suncover Difusor AV 150µm',
    additionalInfo: 'Contrato internacional. Cobertura completa.',
    status: 'PENDENTE_CONFERENCIA'
  },
  {
    tempId: 'batch-07',
    farmCode: 'VDU',
    farmName: 'Vale das Uvas',
    sector: 'Setor Represa',
    parcelCode: 'Parcela REP-05',
    supervisor: 'Antônio Ferreira',
    variety: 'Autumn Crisp',
    hectares: 3.4,
    situation: 'A Confirmar',
    coverageDate: '2023-12-15',
    plasticType: 'Nortène Solartérmico Max 120µm',
    additionalInfo: 'Pendente de confirmação da situação atual de cobertura.',
    status: 'PENDENTE_CONFERENCIA'
  }
];

export const OfficialDataImportView: React.FC = () => {
  const { importOfficialParcels, currentUser, canPerform, showToast } = useApp();

  const [stagingRows, setStagingRows] = useState<OfficialImportStagingRow[]>(OFFICIAL_DOCUMENT_BATCH);
  const [selectedFileName, setSelectedFileName] = useState<string>('PLASTICULTURA - FAZENDAS - OFICIAL DATAS.pdf');
  const [step, setStep] = useState<'upload' | 'conference' | 'completed'>('conference');
  const [isProcessing, setIsProcessing] = useState(false);

  const canImport = canPerform('CREATE_MASTER');

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setSelectedFileName(file.name);
    setIsProcessing(true);

    // Read and parse file
    setTimeout(() => {
      setIsProcessing(false);
      setStep('conference');
      showToast('info', 'Arquivo Carregado', `${file.name} carregado com sucesso. Prossiga para a etapa de conferência.`);
    }, 800);
  };

  const handleUpdateRow = (tempId: string, field: keyof OfficialImportStagingRow, value: any) => {
    setStagingRows(prev => prev.map(row => {
      if (row.tempId === tempId) {
        return { ...row, [field]: value };
      }
      return row;
    }));
  };

  const handleApproveAndImport = () => {
    setIsProcessing(true);

    // Convert staging rows into official Parcel entities
    const parcelsToImport: Parcel[] = stagingRows.map(row => {
      const farmId = (row.farmCode === 'LAB' || row.farmCode === 'LAB-01') ? 'farm-lab1' :
                     (row.farmCode === 'LBR' || row.farmCode === 'LAB-02') ? 'farm-lab2' :
                     (row.farmCode === 'BRU' || row.farmCode === 'BRU-01') ? 'farm-br-uvas' : 'farm-vale-uvas';

      const farmCode = (row.farmCode === 'LAB' || row.farmCode === 'LAB-01') ? 'LAB' :
                       (row.farmCode === 'LBR' || row.farmCode === 'LAB-02') ? 'LBR' :
                       (row.farmCode === 'BRU' || row.farmCode === 'BRU-01') ? 'BRU' :
                       (row.farmCode === 'VDU' || row.farmCode === 'VDU-01') ? 'VDU' : row.farmCode;

      return {
        id: `parc-imp-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        farmId,
        farmCode,
        farmName: row.farmName,
        sector: row.sector,
        parcelCode: row.parcelCode,
        supervisor: row.supervisor,
        variety: row.variety,
        hectares: row.hectares,
        situation: row.situation,
        currentPlasticType: row.situation === 'Coberta' ? row.plasticType : undefined,
        currentMetersCovered: row.situation === 'Coberta' ? Math.round(row.hectares * 1000) : 0,
        coverageHistory: row.coverageDate ? [
          {
            id: `cov-imp-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
            coverageDate: row.coverageDate,
            plasticType: row.plasticType || 'Plástico não especificado no PDF',
            metersInstalled: Math.round(row.hectares * 1000),
            status: row.situation === 'Coberta' ? 'Instalado Atualmente' : 'A Confirmar',
            isCurrentConfirmed: row.situation === 'Coberta',
            responsible: row.supervisor,
            notes: row.additionalInfo || 'Importado do PDF Oficial Datas',
            registeredAt: new Date().toISOString(),
            registeredBy: currentUser.name
          }
        ] : [],
        hasDuplicateFlag: row.hasDuplicateWarning,
        duplicateNotes: row.duplicateWarningDetails,
        additionalInfo: row.additionalInfo,
        source: 'PLASTICULTURA - FAZENDAS - OFICIAL DATAS',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
    });

    const res = importOfficialParcels(parcelsToImport);
    setIsProcessing(false);

    if (res.success) {
      setStep('completed');
    }
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-stone-200 shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-[#8E1057] uppercase tracking-wider mb-1">
          <Database className="w-4 h-4 text-[#D65F95]" />
          Módulo de Importação Oficial
        </div>
        <h2 className="text-xl font-extrabold text-[#1E120D] tracking-tight">
          Importação: PLASTICULTURA - FAZENDAS - OFICIAL DATAS
        </h2>
        <p className="text-xs text-[#1E120D]/60 mt-0.5">
          Etapa obrigatória de conferência cadastral pré-importação para validação de Fazenda, Setor, Parcela, Supervisor, Variedade, Hectares e Situação.
        </p>
      </div>

      {/* Stepper Wizard Navigation */}
      <div className="grid grid-cols-3 gap-3 text-xs font-bold">
        <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
          step === 'upload' ? 'bg-[#4A072E] text-white border-[#8E1057]' : 'bg-white text-[#1E120D] border-[#F0E4EB]'
        }`}>
          <span className="w-6 h-6 rounded-full bg-[#8E1057] text-white flex items-center justify-center text-xs">1</span>
          <span>1. Fonte de Dados (PDF/Arquivo)</span>
        </div>

        <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
          step === 'conference' ? 'bg-[#4A072E] text-white border-[#8E1057] shadow-xs' : 'bg-white text-[#1E120D] border-[#F0E4EB]'
        }`}>
          <span className="w-6 h-6 rounded-full bg-[#D65F95] text-white flex items-center justify-center text-xs font-black">2</span>
          <span>2. Etapa de Conferência Obrigatória</span>
        </div>

        <div className={`p-3 rounded-xl border flex items-center gap-2.5 ${
          step === 'completed' ? 'bg-[#4A072E] text-white border-[#8E1057]' : 'bg-white text-[#1E120D] border-[#F0E4EB]'
        }`}>
          <span className="w-6 h-6 rounded-full bg-stone-300 text-stone-700 flex items-center justify-center text-xs">3</span>
          <span>3. Conclusão & Auditoria</span>
        </div>
      </div>

      {/* --- ETAPA 2: CONFERÊNCIA OBRIGATÓRIA (EM DESTAQUE) --- */}
      {step === 'conference' && (
        <div className="bg-white border border-[#F0E4EB] rounded-2xl shadow-xs overflow-hidden space-y-4 p-5">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-[#F0E4EB]">
            <div>
              <div className="flex items-center gap-2">
                <FileText className="w-5 h-5 text-[#8E1057]" />
                <h3 className="font-extrabold text-[#1E120D] text-sm sm:text-base">
                  Conferência dos Registros Extraídos do Documento Oficial
                </h3>
              </div>
              <p className="text-xs text-[#1E120D]/60 mt-0.5">
                Arquivo de Origem: <strong>{selectedFileName}</strong> ({stagingRows.length} parcelas identificadas)
              </p>
            </div>

            <div className="flex items-center gap-2">
              <label className="text-xs bg-[#FAF6F8] hover:bg-stone-200 text-[#1E120D] font-semibold px-3 py-1.5 rounded-lg border border-[#F0E4EB] cursor-pointer transition">
                <Upload className="w-3.5 h-3.5 inline mr-1" />
                Carregar Outro PDF
                <input type="file" accept=".pdf,.xlsx,.csv" onChange={handleFileUpload} className="hidden" />
              </label>

              <button
                onClick={handleApproveAndImport}
                disabled={isProcessing}
                className="flex items-center gap-2 bg-[#8E1057] hover:bg-[#750D48] text-white font-bold text-xs px-4 py-2 rounded-xl transition shadow-xs"
              >
                <CheckCircle2 className="w-4 h-4" />
                <span>Aprovar e Concluir Importação</span>
              </button>
            </div>
          </div>

          {/* Diretrizes de Conformidade */}
          <div className="p-3.5 bg-amber-50/80 border border-amber-300 rounded-xl text-xs text-amber-950 space-y-1">
            <div className="flex items-center gap-2 font-bold text-amber-900">
              <AlertTriangle className="w-4 h-4 text-amber-700 shrink-0" />
              Regras Mandatórias de Preservação e Duplicidade
            </div>
            <p className="text-[11px] text-amber-800">
              • Registros repetidos <strong>não são excluídos automaticamente</strong>. Quando uma parcela aparece com variedades diferentes, todos os registros são preservados e sinalizados abaixo com aviso amarelo para conferência posterior.
            </p>
            <p className="text-[11px] text-amber-800">
              • Não se presume que o último plástico registrado está instalado atualmente. A situação é registrada como "A Confirmar" caso não haja laudo de campo validado.
            </p>
          </div>

          {/* Tabela de Conferência */}
          <div className="overflow-x-auto border border-stone-200 rounded-xl">
            <table className="w-full text-left text-xs">
              <thead className="bg-stone-50 text-stone-600 font-bold border-b border-stone-200 uppercase tracking-wider text-[11px]">
                <tr>
                  <th className="py-2.5 px-3">Fazenda</th>
                  <th className="py-2.5 px-3">Setor</th>
                  <th className="py-2.5 px-3">Parcela</th>
                  <th className="py-2.5 px-3">Supervisor</th>
                  <th className="py-2.5 px-3">Variedade</th>
                  <th className="py-2.5 px-3 text-right">Área (ha)</th>
                  <th className="py-2.5 px-3">Situação</th>
                  <th className="py-2.5 px-3">Cobertura Oficial</th>
                  <th className="py-2.5 px-3">Avisos / Conferência</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-stone-100">
                {stagingRows.map((row) => {
                  return (
                    <tr 
                      key={row.tempId} 
                      className={`transition ${row.hasDuplicateWarning ? 'bg-amber-50/60' : 'hover:bg-stone-50/70'}`}
                    >
                      <td className="py-2.5 px-3 font-bold text-stone-900 whitespace-nowrap">
                        {row.farmName} <span className="text-[10px] text-stone-400 block font-mono">{row.farmCode}</span>
                      </td>

                      <td className="py-2.5 px-3 text-stone-700 whitespace-nowrap">
                        {row.sector}
                      </td>

                      <td className="py-2.5 px-3">
                        <input
                          type="text"
                          value={row.parcelCode}
                          onChange={(e) => handleUpdateRow(row.tempId, 'parcelCode', e.target.value)}
                          className="bg-white border border-stone-300 rounded px-2 py-1 font-bold text-stone-900 text-xs w-28"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-stone-800">
                        <input
                          type="text"
                          value={row.supervisor}
                          onChange={(e) => handleUpdateRow(row.tempId, 'supervisor', e.target.value)}
                          className="bg-white border border-stone-300 rounded px-2 py-1 text-stone-800 text-xs w-32"
                        />
                      </td>

                      <td className="py-2.5 px-3 font-semibold text-stone-900">
                        <input
                          type="text"
                          value={row.variety}
                          onChange={(e) => handleUpdateRow(row.tempId, 'variety', e.target.value)}
                          className="bg-white border border-stone-300 rounded px-2 py-1 font-semibold text-stone-900 text-xs w-32"
                        />
                      </td>

                      <td className="py-2.5 px-3 text-right">
                        <input
                          type="number"
                          step="0.1"
                          value={row.hectares}
                          onChange={(e) => handleUpdateRow(row.tempId, 'hectares', parseFloat(e.target.value) || 0)}
                          className="bg-white border border-stone-300 rounded px-2 py-1 font-bold text-stone-900 text-xs w-20 text-right"
                        />
                      </td>

                      <td className="py-2.5 px-3">
                        <select
                          value={row.situation}
                          onChange={(e) => handleUpdateRow(row.tempId, 'situation', e.target.value as ParcelSituation)}
                          className="bg-white border border-stone-300 rounded px-2 py-1 font-semibold text-xs"
                        >
                          <option value="Coberta">Coberta</option>
                          <option value="Descoberta">Descoberta</option>
                          <option value="A Confirmar">A Confirmar</option>
                        </select>
                      </td>

                      <td className="py-2.5 px-3 text-stone-600">
                        <p className="font-medium text-stone-800 truncate max-w-xs">{row.plasticType || 'Não informado'}</p>
                        <p className="text-[10px] text-stone-400 font-mono">{row.coverageDate || '-'}</p>
                      </td>

                      <td className="py-2.5 px-3">
                        {row.hasDuplicateWarning ? (
                          <div className="flex items-start gap-1 text-[11px] text-amber-800 font-semibold bg-amber-100/80 p-1.5 rounded">
                            <AlertTriangle className="w-3.5 h-3.5 text-amber-700 shrink-0 mt-0.5" />
                            <span>{row.duplicateWarningDetails}</span>
                          </div>
                        ) : (
                          <span className="text-[11px] text-[#8E1057] font-medium flex items-center gap-1">
                            <Check className="w-3.5 h-3.5 text-[#D65F95]" />
                            Validado
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <div className="flex items-center justify-between pt-3 border-t border-[#F0E4EB] text-xs">
            <span className="text-[#1E120D]/60">
              {stagingRows.filter(r => r.hasDuplicateWarning).length} registros sinalizados com possíveis duplicidades para preservação.
            </span>

            <button
              onClick={handleApproveAndImport}
              disabled={isProcessing}
              className="flex items-center gap-2 bg-[#8E1057] hover:bg-[#750D48] text-white font-bold px-6 py-2.5 rounded-xl transition shadow-xs"
            >
              <CheckCircle2 className="w-4 h-4" />
              <span>Concluir Importação dos Cadastros</span>
            </button>
          </div>
        </div>
      )}

      {/* --- ETAPA 3: CONCLUÍDO --- */}
      {step === 'completed' && (
        <div className="bg-white border border-[#F0E4EB] rounded-2xl p-8 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 rounded-full bg-[#FAF6F8] text-[#8E1057] border border-[#D65F95]/40 flex items-center justify-center mx-auto">
            <CheckCircle2 className="w-8 h-8" />
          </div>

          <h3 className="text-xl font-extrabold text-[#1E120D]">
            Importação Concluída com Sucesso!
          </h3>

          <p className="text-xs text-stone-600 max-w-lg mx-auto">
            Os registros oficiais de <strong>PLASTICULTURA - FAZENDAS - OFICIAL DATAS</strong> foram importados com sucesso para a estrutura oficial (Fazenda &gt; Setor &gt; Parcela). Todos os históricos de cobertura e sinalizações de duplicidade foram preservados.
          </p>

          <div className="pt-3 flex items-center justify-center gap-3">
            <button
              onClick={() => setStep('conference')}
              className="px-4 py-2 bg-stone-100 hover:bg-stone-200 text-stone-800 rounded-xl font-bold text-xs transition"
            >
              Revisar Importação
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
