import { 
  Farm, 
  Sector,
  Parcel,
  PlasticMaterial, 
  StockItem, 
  StockMovement, 
  PlasticInstallation, 
  PlasticRemoval, 
  UserProfile, 
  AuditLog,
  OfficialImportStagingRow,
  PlasticultureActivity,
  ActivityTypeItem
} from '../types';

export const INITIAL_USERS: UserProfile[] = [
  {
    id: 'user-larissa',
    name: 'Larissa Pereira',
    email: 'larissa.pereira@elciruelo.com.br',
    login: 'larissa.pereira',
    role: 'Administrador',
    jobTitle: 'Administradora Geral de Plasticultura',
    farmScope: 'ALL',
    status: 'Ativo',
    permissions: {
      view_info: true,
      create_records: true,
      edit_records: true,
      delete_records: true,
      access_reports: true,
      access_plasticulture_activities: true,
      access_covered_areas: true,
      access_catalogs: true,
      access_user_management: true
    },
    avatarUrl: ''
  },
  {
    id: 'user-carlos',
    name: 'Carlos Eduardo Mendes',
    email: 'carlos.mendes@labrunier.com.br',
    login: 'carlos.mendes',
    role: 'Gestor',
    jobTitle: 'Gestor Agrícola',
    farmScope: 'farm-lab1',
    farmAssigned: 'Labrunier I',
    status: 'Ativo',
    permissions: {
      view_info: true,
      create_records: true,
      edit_records: true,
      delete_records: false,
      access_reports: true,
      access_plasticulture_activities: true,
      access_covered_areas: true,
      access_catalogs: true,
      access_user_management: false
    },
    avatarUrl: ''
  },
  {
    id: 'user-joao',
    name: 'João Marcos da Silva',
    email: 'joao.silva@fazendas.com.br',
    login: 'joao.silva',
    role: 'Operador',
    jobTitle: 'Operador de Campo',
    farmScope: 'farm-br-uvas',
    farmAssigned: 'Brasil Uvas',
    status: 'Ativo',
    permissions: {
      view_info: true,
      create_records: true,
      edit_records: false,
      delete_records: false,
      access_reports: false,
      access_plasticulture_activities: true,
      access_covered_areas: true,
      access_catalogs: false,
      access_user_management: false
    },
    avatarUrl: ''
  }
];

export const INITIAL_FARMS: Farm[] = [
  {
    id: 'farm-lab1',
    name: 'Labrunier I',
    code: 'LAB',
    location: 'Petrolina - PE (Vale do São Francisco, Km 18)',
    totalHectares: 185.0,
    serroplastHectares: 43.41,
    manager: 'Carlos Eduardo Mendes',
    contactPhone: '(87) 3862-9100',
    createdAt: '2024-01-15T08:00:00Z'
  },
  {
    id: 'farm-lab2',
    name: 'Labrunier II',
    code: 'LBR',
    location: 'Juazeiro - BA (Distrito de Mandacaru)',
    totalHectares: 140.0,
    serroplastHectares: 87.79,
    manager: 'Mariana Fontes',
    contactPhone: '(74) 3611-4520',
    createdAt: '2024-01-15T08:00:00Z'
  },
  {
    id: 'farm-br-uvas',
    name: 'Brasil Uvas',
    code: 'BRU',
    location: 'Petrolina - PE (Projeto Senador Nilo Coelho - N8)',
    totalHectares: 210.0,
    serroplastHectares: 50.57,
    manager: 'Fernando Alencar',
    contactPhone: '(87) 3864-1188',
    createdAt: '2024-02-01T08:00:00Z'
  },
  {
    id: 'farm-vale-uvas',
    name: 'Vale das Uvas',
    code: 'VDU',
    location: 'Casa Nova - BA (Margens do Lago de Sobradinho)',
    totalHectares: 165.0,
    serroplastHectares: 91.50,
    manager: 'Rodrigo Siqueira',
    contactPhone: '(74) 3527-3040',
    createdAt: '2024-02-10T08:00:00Z'
  }
];

export const INITIAL_SECTORS: Sector[] = [
  // Labrunier I
  { id: 'sec-lab1-01', farmId: 'farm-lab1', name: 'Setor 01 - Norte', code: 'SET-01', totalHectares: 90.0, supervisorDefault: 'Marcos Vinícius', createdAt: '2024-01-15T08:30:00Z' },
  { id: 'sec-lab1-02', farmId: 'farm-lab1', name: 'Setor 02 - Sul', code: 'SET-02', totalHectares: 95.0, supervisorDefault: 'Gilberto Ramos', createdAt: '2024-01-15T08:30:00Z' },
  // Labrunier II
  { id: 'sec-lab2-01', farmId: 'farm-lab2', name: 'Setor Mandacaru A', code: 'SET-A', totalHectares: 70.0, supervisorDefault: 'Cláudio Albuquerque', createdAt: '2024-01-15T08:30:00Z' },
  { id: 'sec-lab2-02', farmId: 'farm-lab2', name: 'Setor Mandacaru B', code: 'SET-B', totalHectares: 70.0, supervisorDefault: 'Elton Bezerra', createdAt: '2024-01-15T08:30:00Z' },
  // Brasil Uvas
  { id: 'sec-bru-01', farmId: 'farm-br-uvas', name: 'Setor Exportação', code: 'SET-EXP', totalHectares: 110.0, supervisorDefault: 'Renato Cavalcanti', createdAt: '2024-02-01T08:30:00Z' },
  { id: 'sec-bru-02', farmId: 'farm-br-uvas', name: 'Setor Doméstico', code: 'SET-DOM', totalHectares: 100.0, supervisorDefault: 'Valmir Santana', createdAt: '2024-02-01T08:30:00Z' },
  // Vale das Uvas
  { id: 'sec-vdu-01', farmId: 'farm-vale-uvas', name: 'Setor Represa', code: 'SET-REP', totalHectares: 85.0, supervisorDefault: 'Antônio Ferreira', createdAt: '2024-02-10T08:30:00Z' },
  { id: 'sec-vdu-02', farmId: 'farm-vale-uvas', name: 'Setor Encosta', code: 'SET-ENC', totalHectares: 80.0, supervisorDefault: 'Daniel Nogueira', createdAt: '2024-02-10T08:30:00Z' }
];

export const INITIAL_PLASTICS: PlasticMaterial[] = [
  {
    id: 'pla-ginegar-150',
    name: 'Ginegar Suncover Difusor AV 150µm',
    category: 'Cobertura de Parral',
    thicknessMicrons: 150,
    widthMeters: 2.4,
    color: 'Translúcido Difuso 65%',
    manufacturer: 'Ginegar Plastic Products',
    rollLengthMeters: 500,
    pricePerMeter: 5.20,
    supplier: 'Distribuidora Agrícola do São Francisco',
    acquisitionDate: '2024-01-10',
    lifespanExpectedMonths: 36,
    minStockAlertMeters: 3000,
    notes: 'Filme 5 camadas anti-UV e antigotejo.',
    createdAt: '2024-01-10T08:00:00Z',
    updatedAt: '2024-01-10T08:00:00Z'
  },
  {
    id: 'pla-nortene-120',
    name: 'Nortène Solartérmico Max 120µm',
    category: 'Cobertura de Parral',
    thicknessMicrons: 120,
    widthMeters: 2.6,
    color: 'Branco Leitoso Térmico',
    manufacturer: 'Nortène Plásticos',
    rollLengthMeters: 600,
    pricePerMeter: 4.60,
    supplier: 'AgroPlásticos Petrolina Ltda',
    acquisitionDate: '2024-01-20',
    lifespanExpectedMonths: 24,
    minStockAlertMeters: 2500,
    notes: 'Bloqueador infravermelho para atenuação térmica sob parral.',
    createdAt: '2024-01-20T08:00:00Z',
    updatedAt: '2024-01-20T08:00:00Z'
  },
  {
    id: 'pla-mulch-30',
    name: 'Mulching Bicolor Prata/Preto 30µm',
    category: 'Mulching (Solo)',
    thicknessMicrons: 30,
    widthMeters: 1.4,
    color: 'Prata / Preto',
    manufacturer: 'Electroplastic',
    rollLengthMeters: 1000,
    pricePerMeter: 1.85,
    supplier: 'Comercial Agrícola Juazeiro',
    acquisitionDate: '2024-02-05',
    lifespanExpectedMonths: 18,
    minStockAlertMeters: 4000,
    notes: 'Lado prata reflete luz; lado preto suprime plantas daninhas.',
    createdAt: '2024-02-05T08:00:00Z',
    updatedAt: '2024-02-05T08:00:00Z'
  },
  {
    id: 'pla-serroplast',
    name: 'Serroplast Filme Difusor Especial Uva 150µm',
    category: 'Cobertura de Parral',
    thicknessMicrons: 150,
    widthMeters: 2.6,
    color: 'Translúcido Difuso Alta Transmitância',
    manufacturer: 'Serroplast',
    rollLengthMeters: 500,
    pricePerMeter: 5.40,
    supplier: 'Serroplast Indústria e Comércio de Plásticos',
    acquisitionDate: '2024-01-15',
    lifespanExpectedMonths: 36,
    minStockAlertMeters: 5000,
    notes: 'Filme oficial para parrais das 4 fazendas El Ciruelo Brasil (273,27 ha totais em cobertura).',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z'
  },
  {
    id: 'pla-tunel-60',
    name: 'Plasticultura Mini-Túnel Transparente 60µm',
    category: 'Mini-Túnel',
    thicknessMicrons: 60,
    widthMeters: 2.0,
    color: 'Cristal Transparente',
    manufacturer: 'Plasticultura Brasil',
    rollLengthMeters: 800,
    pricePerMeter: 2.75,
    supplier: 'TecnoAgro Suprimentos',
    acquisitionDate: '2024-02-15',
    lifespanExpectedMonths: 12,
    minStockAlertMeters: 1500,
    notes: 'Proteção de brotação inicial de mudas.',
    createdAt: '2024-02-15T08:00:00Z',
    updatedAt: '2024-02-15T08:00:00Z'
  }
];

// Dados Oficiais importados de "PLASTICULTURA - FAZENDAS - OFICIAL DATAS"
// Preservando: Fazenda, Setor, Parcela, Supervisor, Variedade, Hectares, Situação, Histórico de coberturas, Informações Adicionais.
// Com sinalização explícita de duplicidades e casos a confirmar.
export const INITIAL_PARCELS: Parcel[] = [
  // --- FAZENDA LABRUNIER I (LAB) ---
  {
    id: 'parc-lab1-01',
    farmId: 'farm-lab1',
    farmCode: 'LAB',
    farmName: 'Labrunier I',
    sector: 'Setor 01 - Norte',
    sectorId: 'sec-lab1-01',
    parcelCode: 'Parcela 01',
    supervisor: 'Marcos Vinícius',
    variety: 'BRS Vitória',
    hectares: 3.5,
    situation: 'Coberta',
    currentPlasticType: 'Ginegar Suncover Difusor AV 150µm',
    currentPlasticId: 'pla-ginegar-150',
    currentMetersCovered: 3500,
    coverageHistory: [
      {
        id: 'cov-001',
        coverageDate: '2023-08-10',
        plasticType: 'Nortène Solartérmico 120µm',
        metersInstalled: 3500,
        status: 'Substituído',
        isCurrentConfirmed: false,
        responsible: 'Marcos Vinícius',
        notes: 'Cobertura safra anterior 2023. Substituído por desgaste.',
        registeredAt: '2023-08-10T09:00:00Z',
        registeredBy: 'Importação PDF Oficial'
      },
      {
        id: 'cov-002',
        coverageDate: '2024-02-15',
        plasticType: 'Ginegar Suncover Difusor AV 150µm',
        plasticId: 'pla-ginegar-150',
        metersInstalled: 3500,
        status: 'Instalado Atualmente',
        isCurrentConfirmed: true,
        responsible: 'João Marcos da Silva',
        notes: 'Instalação nova com tensionamento em arames 12. Situação confirmada em campo.',
        registeredAt: '2024-02-15T10:00:00Z',
        registeredBy: 'Carlos Eduardo Mendes'
      }
    ],
    additionalInfo: 'Parral coberto para proteção contra chuvas no período de maturação. Sistema de gotejamento duplo.',
    source: 'PLASTICULTURA - FAZENDAS - OFICIAL DATAS',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-02-15T10:00:00Z'
  },
  {
    id: 'parc-lab1-02',
    farmId: 'farm-lab1',
    farmCode: 'LAB',
    farmName: 'Labrunier I',
    sector: 'Setor 01 - Norte',
    sectorId: 'sec-lab1-01',
    parcelCode: 'Parcela 02',
    supervisor: 'Marcos Vinícius',
    variety: 'Cotton Candy',
    hectares: 4.0,
    situation: 'Coberta',
    currentPlasticType: 'Mulching Bicolor Prata/Preto 30µm',
    currentPlasticId: 'pla-mulch-30',
    currentMetersCovered: 4000,
    coverageHistory: [
      {
        id: 'cov-003',
        coverageDate: '2024-03-01',
        plasticType: 'Mulching Bicolor Prata/Preto 30µm',
        plasticId: 'pla-mulch-30',
        metersInstalled: 4000,
        status: 'Instalado Atualmente',
        isCurrentConfirmed: true,
        responsible: 'Marcos Vinícius',
        notes: 'Mulching de solo instalado mecanicamente. Situação ativa.',
        registeredAt: '2024-03-01T11:00:00Z',
        registeredBy: 'Importação PDF Oficial'
      }
    ],
    additionalInfo: 'Variedade aromática de alto valor comercial. Requer alta transmissão de luz.',
    source: 'PLASTICULTURA - FAZENDAS - OFICIAL DATAS',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-03-01T11:00:00Z'
  },
  {
    id: 'parc-lab1-03',
    farmId: 'farm-lab1',
    farmCode: 'LAB',
    farmName: 'Labrunier I',
    sector: 'Setor 01 - Norte',
    sectorId: 'sec-lab1-01',
    parcelCode: 'Parcela 03',
    supervisor: 'Marcos Vinícius',
    variety: 'Crimson Seedless',
    hectares: 3.8,
    situation: 'A Confirmar',
    currentPlasticType: 'Ginegar Suncover Difusor AV 150µm',
    currentPlasticId: 'pla-ginegar-150',
    currentMetersCovered: 3800,
    coverageHistory: [
      {
        id: 'cov-004',
        coverageDate: '2023-11-20',
        plasticType: 'Ginegar Suncover Difusor AV 150µm',
        plasticId: 'pla-ginegar-150',
        metersInstalled: 3800,
        status: 'A Confirmar',
        isCurrentConfirmed: false,
        responsible: 'Marcos Vinícius',
        notes: 'Cobertura registrada no PDF oficial. Situação pendente de vistoria in loco.',
        registeredAt: '2023-11-20T08:00:00Z',
        registeredBy: 'Importação PDF Oficial'
      }
    ],
    additionalInfo: 'Requer confirmação de campo se plástico foi retirado na poda de inverno.',
    source: 'PLASTICULTURA - FAZENDAS - OFICIAL DATAS',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z'
  },

  // EXERCÍCIO DE REGISTRO DUPLICADO / VARIEDADES DIFERENTES NA MESMA PARCELA (PRESERVADOS E SINALIZADOS CONFORME DIRETRIZ):
  {
    id: 'parc-lab1-04-v1',
    farmId: 'farm-lab1',
    farmCode: 'LAB',
    farmName: 'Labrunier I',
    sector: 'Setor 02 - Sul',
    sectorId: 'sec-lab1-02',
    parcelCode: 'Parcela 04',
    supervisor: 'Gilberto Ramos',
    variety: 'BRS Vitória',
    hectares: 2.5,
    situation: 'Coberta',
    currentPlasticType: 'Ginegar Suncover Difusor AV 150µm',
    currentMetersCovered: 2500,
    coverageHistory: [
      {
        id: 'cov-005',
        coverageDate: '2024-01-18',
        plasticType: 'Ginegar Suncover Difusor AV 150µm',
        metersInstalled: 2500,
        status: 'Instalado Atualmente',
        isCurrentConfirmed: true,
        responsible: 'Gilberto Ramos',
        notes: 'Cobertura parcial da Parcela 04 linha 1 a 28.',
        registeredAt: '2024-01-18T14:00:00Z',
        registeredBy: 'Importação PDF Oficial'
      }
    ],
    hasDuplicateFlag: true,
    duplicateNotes: 'ATENÇÃO PARA CONFERÊNCIA: Parcela 04 aparece no PDF oficial com duas variedades diferentes (Registro 1: BRS Vitória 2.5ha; Registro 2: Sweet Celebration 1.8ha). Ambos preservados.',
    additionalInfo: 'Linhas 01 a 28 cultivadas com BRS Vitória.',
    source: 'PLASTICULTURA - FAZENDAS - OFICIAL DATAS',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-18T14:00:00Z'
  },
  {
    id: 'parc-lab1-04-v2',
    farmId: 'farm-lab1',
    farmCode: 'LAB',
    farmName: 'Labrunier I',
    sector: 'Setor 02 - Sul',
    sectorId: 'sec-lab1-02',
    parcelCode: 'Parcela 04',
    supervisor: 'Gilberto Ramos',
    variety: 'Sweet Celebration',
    hectares: 1.8,
    situation: 'Descoberta',
    currentPlasticType: undefined,
    currentMetersCovered: 0,
    coverageHistory: [
      {
        id: 'cov-006',
        coverageDate: '2023-09-15',
        plasticType: 'Nortène Solartérmico 120µm',
        metersInstalled: 1800,
        status: 'Removido',
        isCurrentConfirmed: false,
        responsible: 'Gilberto Ramos',
        notes: 'Plástico retirado após colheita de dezembro.',
        registeredAt: '2023-09-15T10:00:00Z',
        registeredBy: 'Importação PDF Oficial'
      }
    ],
    hasDuplicateFlag: true,
    duplicateNotes: 'ATENÇÃO PARA CONFERÊNCIA: Parcela 04 aparece no PDF oficial com duas variedades diferentes (Registro 2: Sweet Celebration 1.8ha; Registro 1: BRS Vitória 2.5ha). Ambos preservados.',
    additionalInfo: 'Linhas 29 a 48 cultivadas com Sweet Celebration.',
    source: 'PLASTICULTURA - FAZENDAS - OFICIAL DATAS',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-18T14:00:00Z'
  },

  // --- FAZENDA LABRUNIER II (LBR) ---
  {
    id: 'parc-lab2-01',
    farmId: 'farm-lab2',
    farmCode: 'LBR',
    farmName: 'Labrunier II',
    sector: 'Setor Mandacaru A',
    sectorId: 'sec-lab2-01',
    parcelCode: 'Parcela M-01',
    supervisor: 'Cláudio Albuquerque',
    variety: 'Midnight Beauty',
    hectares: 3.2,
    situation: 'Coberta',
    currentPlasticType: 'Nortène Solartérmico Max 120µm',
    currentPlasticId: 'pla-nortene-120',
    currentMetersCovered: 3200,
    coverageHistory: [
      {
        id: 'cov-007',
        coverageDate: '2024-03-12',
        plasticType: 'Nortène Solartérmico Max 120µm',
        plasticId: 'pla-nortene-120',
        metersInstalled: 3200,
        status: 'Instalado Atualmente',
        isCurrentConfirmed: true,
        responsible: 'Cláudio Albuquerque',
        notes: 'Instalação confirmada em campo antes da brotação floral.',
        registeredAt: '2024-03-12T15:00:00Z',
        registeredBy: 'Carlos Eduardo Mendes'
      }
    ],
    additionalInfo: 'Uva preta sem semente exportação.',
    source: 'PLASTICULTURA - FAZENDAS - OFICIAL DATAS',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-03-12T15:00:00Z'
  },
  {
    id: 'parc-lab2-02',
    farmId: 'farm-lab2',
    farmCode: 'LBR',
    farmName: 'Labrunier II',
    sector: 'Setor Mandacaru A',
    sectorId: 'sec-lab2-01',
    parcelCode: 'Parcela M-02',
    supervisor: 'Cláudio Albuquerque',
    variety: 'Sweet Globe',
    hectares: 2.8,
    situation: 'Descoberta',
    currentMetersCovered: 0,
    coverageHistory: [
      {
        id: 'cov-008',
        coverageDate: '2023-10-05',
        plasticType: 'Ginegar Suncover Difusor AV 150µm',
        metersInstalled: 2800,
        status: 'Removido',
        isCurrentConfirmed: false,
        responsible: 'Cláudio Albuquerque',
        notes: 'Plástico retirado para poda de renovação.',
        registeredAt: '2023-10-05T09:00:00Z',
        registeredBy: 'Importação PDF Oficial'
      }
    ],
    additionalInfo: 'Parcela aguardando início do ciclo de brotação para nova cobertura.',
    source: 'PLASTICULTURA - FAZENDAS - OFICIAL DATAS',
    createdAt: '2024-01-15T08:00:00Z',
    updatedAt: '2024-01-15T08:00:00Z'
  },

  // --- FAZENDA BRASIL UVAS (BRU) ---
  {
    id: 'parc-bru-01',
    farmId: 'farm-br-uvas',
    farmCode: 'BRU',
    farmName: 'Brasil Uvas',
    sector: 'Setor Exportação',
    sectorId: 'sec-bru-01',
    parcelCode: 'Parcela EXP-10',
    supervisor: 'Renato Cavalcanti',
    variety: 'Arra 15',
    hectares: 4.5,
    situation: 'Coberta',
    currentPlasticType: 'Ginegar Suncover Difusor AV 150µm',
    currentPlasticId: 'pla-ginegar-150',
    currentMetersCovered: 4500,
    coverageHistory: [
      {
        id: 'cov-009',
        coverageDate: '2024-03-25',
        plasticType: 'Ginegar Suncover Difusor AV 150µm',
        plasticId: 'pla-ginegar-150',
        metersInstalled: 4500,
        status: 'Instalado Atualmente',
        isCurrentConfirmed: true,
        responsible: 'Renato Cavalcanti',
        notes: 'Cobertura de parral em área de Arra 15 para mercado europeu.',
        registeredAt: '2024-03-25T14:00:00Z',
        registeredBy: 'Larissa Pereira'
      }
    ],
    additionalInfo: 'Contrato com importadores do Reino Unido. Índice Brix mínimo exigido: 18°.',
    source: 'PLASTICULTURA - FAZENDAS - OFICIAL DATAS',
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2024-03-25T14:00:00Z'
  },
  {
    id: 'parc-bru-02',
    farmId: 'farm-br-uvas',
    farmCode: 'BRU',
    farmName: 'Brasil Uvas',
    sector: 'Setor Doméstico',
    sectorId: 'sec-bru-02',
    parcelCode: 'Parcela DOM-04',
    supervisor: 'Valmir Santana',
    variety: 'Sweet Celebration',
    hectares: 3.6,
    situation: 'A Confirmar',
    currentMetersCovered: 3600,
    coverageHistory: [
      {
        id: 'cov-010',
        coverageDate: '2023-12-01',
        plasticType: 'Nortène Solartérmico Max 120µm',
        metersInstalled: 3600,
        status: 'A Confirmar',
        isCurrentConfirmed: false,
        responsible: 'Valmir Santana',
        notes: 'Data original registrada no documento oficial. Pendente de confirmação se permanece ativo.',
        registeredAt: '2023-12-01T08:00:00Z',
        registeredBy: 'Importação PDF Oficial'
      }
    ],
    additionalInfo: 'Requer inspeção visual para validar estado mecânico do filme plástico.',
    source: 'PLASTICULTURA - FAZENDAS - OFICIAL DATAS',
    createdAt: '2024-02-01T08:00:00Z',
    updatedAt: '2024-02-01T08:00:00Z'
  },

  // --- FAZENDA VALE DAS UVAS (VDU) ---
  {
    id: 'parc-vdu-01',
    farmId: 'farm-vale-uvas',
    farmCode: 'VDU',
    farmName: 'Vale das Uvas',
    sector: 'Setor Represa',
    sectorId: 'sec-vdu-01',
    parcelCode: 'Parcela REP-01',
    supervisor: 'Antônio Ferreira',
    variety: 'Autumn Crisp',
    hectares: 3.6,
    situation: 'Coberta',
    currentPlasticType: 'Nortène Solartérmico Max 120µm',
    currentPlasticId: 'pla-nortene-120',
    currentMetersCovered: 3500,
    coverageHistory: [
      {
        id: 'cov-011',
        coverageDate: '2024-03-20',
        plasticType: 'Nortène Solartérmico Max 120µm',
        plasticId: 'pla-nortene-120',
        metersInstalled: 3500,
        status: 'Instalado Atualmente',
        isCurrentConfirmed: true,
        responsible: 'Antônio Ferreira',
        notes: 'Cobertura instalada para proteger frutos contra rajadas de vento do lago.',
        registeredAt: '2024-03-20T14:00:00Z',
        registeredBy: 'Rodrigo Siqueira'
      }
    ],
    additionalInfo: 'Área próxima à borda do Lago de Sobradinho.',
    source: 'PLASTICULTURA - FAZENDAS - OFICIAL DATAS',
    createdAt: '2024-02-10T08:00:00Z',
    updatedAt: '2024-03-20T14:00:00Z'
  },
  {
    id: 'parc-vdu-02',
    farmId: 'farm-vale-uvas',
    farmCode: 'VDU',
    farmName: 'Vale das Uvas',
    sector: 'Setor Encosta',
    sectorId: 'sec-vdu-02',
    parcelCode: 'Parcela ENC-03',
    supervisor: 'Daniel Nogueira',
    variety: 'Thompson Seedless',
    hectares: 2.9,
    situation: 'Descoberta',
    currentMetersCovered: 0,
    coverageHistory: [
      {
        id: 'cov-012',
        coverageDate: '2023-07-22',
        plasticType: 'Ginegar Suncover Difusor AV 150µm',
        metersInstalled: 2900,
        status: 'Removido',
        isCurrentConfirmed: false,
        responsible: 'Daniel Nogueira',
        notes: 'Retirado por fim de ciclo e podado.',
        registeredAt: '2023-07-22T08:00:00Z',
        registeredBy: 'Importação PDF Oficial'
      }
    ],
    additionalInfo: 'Variedade tradicional branca sem semente.',
    source: 'PLASTICULTURA - FAZENDAS - OFICIAL DATAS',
    createdAt: '2024-02-10T08:00:00Z',
    updatedAt: '2024-02-10T08:00:00Z'
  }
];

export const INITIAL_STOCK: StockItem[] = [
  // Labrunier I - Novos
  {
    id: 'stk-lab1-gin-novo',
    farmId: 'farm-lab1',
    plasticId: 'pla-ginegar-150',
    batchNumber: 'LOTE-GIN-24A',
    condition: 'NOVO',
    metersAvailable: 6500,
    costPerMeter: 5.20,
    originDetails: 'Compra NF-4821 - Estoque Central Labrunier I',
    lastUpdated: '2024-03-01T10:00:00Z'
  },
  {
    id: 'stk-lab1-mul-novo',
    farmId: 'farm-lab1',
    plasticId: 'pla-mulch-30',
    batchNumber: 'LOTE-MUL-24B',
    condition: 'NOVO',
    metersAvailable: 8000,
    costPerMeter: 1.85,
    originDetails: 'Compra NF-4890',
    lastUpdated: '2024-03-05T10:00:00Z'
  },
  // Labrunier I - Reutilizado
  {
    id: 'stk-lab1-gin-reut',
    farmId: 'farm-lab1',
    plasticId: 'pla-ginegar-150',
    batchNumber: 'REUT-2024-01-LAB1',
    condition: 'REUTILIZADO',
    metersAvailable: 1200,
    costPerMeter: 2.60,
    originDetails: 'Reaproveitado da Parcela 01 após poda - higienizado em bobinas',
    lastUpdated: '2024-04-12T14:00:00Z'
  },
  // Labrunier II - Novos
  {
    id: 'stk-lab2-nor-novo',
    farmId: 'farm-lab2',
    plasticId: 'pla-nortene-120',
    batchNumber: 'LOTE-NOR-24C',
    condition: 'NOVO',
    metersAvailable: 4200,
    costPerMeter: 4.60,
    originDetails: 'Compra NF-5012',
    lastUpdated: '2024-03-10T11:00:00Z'
  },
  // Brasil Uvas - Novos
  {
    id: 'stk-bru-gin-novo',
    farmId: 'farm-br-uvas',
    plasticId: 'pla-ginegar-150',
    batchNumber: 'LOTE-GIN-24D',
    condition: 'NOVO',
    metersAvailable: 7800,
    costPerMeter: 5.20,
    originDetails: 'Compra NF-5120',
    lastUpdated: '2024-03-15T09:00:00Z'
  },
  // Vale das Uvas - Novos
  {
    id: 'stk-vdu-nor-novo',
    farmId: 'farm-vale-uvas',
    plasticId: 'pla-nortene-120',
    batchNumber: 'LOTE-NOR-24E',
    condition: 'NOVO',
    metersAvailable: 3500,
    costPerMeter: 4.60,
    originDetails: 'Compra NF-5230',
    lastUpdated: '2024-03-20T14:00:00Z'
  },
  // Lotes Oficiais Serroplast
  {
    id: 'stk-lab1-serroplast',
    farmId: 'farm-lab1',
    plasticId: 'pla-serroplast',
    batchNumber: 'LOTE-SERRO-LAB-24',
    condition: 'NOVO',
    metersAvailable: 15000,
    costPerMeter: 5.40,
    originDetails: 'Compra Centralizada Serroplast - NF 6041 (Atendimento a 43,41 ha)',
    lastUpdated: '2024-03-01T08:00:00Z'
  },
  {
    id: 'stk-lab2-serroplast',
    farmId: 'farm-lab2',
    plasticId: 'pla-serroplast',
    batchNumber: 'LOTE-SERRO-LBR-24',
    condition: 'NOVO',
    metersAvailable: 22000,
    costPerMeter: 5.40,
    originDetails: 'Compra Centralizada Serroplast - NF 6042 (Atendimento a 87,79 ha)',
    lastUpdated: '2024-03-01T08:00:00Z'
  },
  {
    id: 'stk-bru-serroplast',
    farmId: 'farm-br-uvas',
    plasticId: 'pla-serroplast',
    batchNumber: 'LOTE-SERRO-BRU-24',
    condition: 'NOVO',
    metersAvailable: 18000,
    costPerMeter: 5.40,
    originDetails: 'Compra Centralizada Serroplast - NF 6043 (Atendimento a 50,57 ha)',
    lastUpdated: '2024-03-01T08:00:00Z'
  },
  {
    id: 'stk-vdu-serroplast',
    farmId: 'farm-vale-uvas',
    plasticId: 'pla-serroplast',
    batchNumber: 'LOTE-SERRO-VDU-24',
    condition: 'NOVO',
    metersAvailable: 25000,
    costPerMeter: 5.40,
    originDetails: 'Compra Centralizada Serroplast - NF 6044 (Atendimento a 91,50 ha)',
    lastUpdated: '2024-03-01T08:00:00Z'
  }
];

export const INITIAL_INSTALLATIONS: PlasticInstallation[] = [
  {
    id: 'inst-001',
    farmId: 'farm-lab1',
    sector: 'Setor 01 - Norte',
    parcelId: 'parc-lab1-01',
    parcelCode: 'Parcela 01',
    plasticId: 'pla-ginegar-150',
    plasticName: 'Ginegar Suncover Difusor AV 150µm',
    batchNumber: 'LOTE-GIN-24A',
    conditionUsed: 'NOVO',
    metersInstalled: 3500,
    costPerMeter: 5.20,
    totalCost: 18200.00,
    installationDate: '2024-02-15',
    responsibleName: 'João Marcos da Silva',
    status: 'ATIVO',
    metersActiveRemaining: 3500,
    notes: 'Instalação oficial na Parcela 01.',
    registeredBy: 'Carlos Eduardo Mendes',
    registeredRole: 'Gestor',
    createdAt: '2024-02-15T16:30:00Z'
  },
  {
    id: 'inst-002',
    farmId: 'farm-lab1',
    sector: 'Setor 01 - Norte',
    parcelId: 'parc-lab1-02',
    parcelCode: 'Parcela 02',
    plasticId: 'pla-mulch-30',
    plasticName: 'Mulching Bicolor Prata/Preto 30µm',
    batchNumber: 'LOTE-MUL-24B',
    conditionUsed: 'NOVO',
    metersInstalled: 4000,
    costPerMeter: 1.85,
    totalCost: 7400.00,
    installationDate: '2024-03-01',
    responsibleName: 'Marcos Vinícius',
    status: 'ATIVO',
    metersActiveRemaining: 4000,
    notes: 'Mulching nas linhas de Cotton Candy.',
    registeredBy: 'Larissa Pereira',
    registeredRole: 'Administrador',
    createdAt: '2024-03-01T11:00:00Z'
  },
  {
    id: 'inst-003',
    farmId: 'farm-lab2',
    sector: 'Setor Mandacaru A',
    parcelId: 'parc-lab2-01',
    parcelCode: 'Parcela M-01',
    plasticId: 'pla-nortene-120',
    plasticName: 'Nortène Solartérmico Max 120µm',
    batchNumber: 'LOTE-NOR-24C',
    conditionUsed: 'NOVO',
    metersInstalled: 3200,
    costPerMeter: 4.60,
    totalCost: 14720.00,
    installationDate: '2024-03-12',
    responsibleName: 'Cláudio Albuquerque',
    status: 'ATIVO',
    metersActiveRemaining: 3200,
    notes: 'Cobertura térmica para Midnight Beauty.',
    registeredBy: 'Carlos Eduardo Mendes',
    registeredRole: 'Gestor',
    createdAt: '2024-03-12T15:20:00Z'
  },
  {
    id: 'inst-004',
    farmId: 'farm-br-uvas',
    sector: 'Setor Exportação',
    parcelId: 'parc-bru-01',
    parcelCode: 'Parcela EXP-10',
    plasticId: 'pla-ginegar-150',
    plasticName: 'Ginegar Suncover Difusor AV 150µm',
    batchNumber: 'LOTE-GIN-24D',
    conditionUsed: 'NOVO',
    metersInstalled: 4500,
    costPerMeter: 5.20,
    totalCost: 23400.00,
    installationDate: '2024-03-25',
    responsibleName: 'Renato Cavalcanti',
    status: 'ATIVO',
    metersActiveRemaining: 4500,
    notes: 'Arra 15 coberto para exportação.',
    registeredBy: 'Larissa Pereira',
    registeredRole: 'Administrador',
    createdAt: '2024-03-25T14:00:00Z'
  }
];

export const INITIAL_REMOVALS: PlasticRemoval[] = [
  {
    id: 'rem-001',
    installationId: 'inst-001',
    farmId: 'farm-lab1',
    parcelId: 'parc-lab1-01',
    plasticId: 'pla-ginegar-150',
    plasticName: 'Ginegar Suncover Difusor AV 150µm',
    removalDate: '2024-04-10',
    totalMetersRemoved: 1500,
    reusableMeters: 1200,
    discardedMeters: 300,
    reusableValue: 3120.00,
    discardedValue: 1560.00,
    generatedBatchNumber: 'REUT-2024-01-LAB1',
    reason: 'Fim de Ciclo / Poda',
    responsibleName: 'João Marcos da Silva',
    notes: '1.200m limpos e guardados para reutilização; 300m rasgados enviados para reciclagem.',
    registeredBy: 'Carlos Eduardo Mendes',
    registeredRole: 'Gestor',
    createdAt: '2024-04-10T16:00:00Z'
  }
];

export const INITIAL_MOVEMENTS: StockMovement[] = [
  {
    id: 'mov-001',
    type: 'ENTRADA',
    farmId: 'farm-lab1',
    plasticId: 'pla-ginegar-150',
    batchNumber: 'LOTE-GIN-24A',
    condition: 'NOVO',
    meters: 10000,
    costPerMeter: 5.20,
    totalCost: 52000.00,
    reason: 'Compra inicial safra - NF 4821',
    operatorId: 'user-larissa',
    operatorName: 'Larissa Pereira',
    operatorRole: 'Administrador',
    timestamp: '2024-01-12T10:00:00Z'
  },
  {
    id: 'mov-002',
    type: 'INSTALACAO',
    farmId: 'farm-lab1',
    plasticId: 'pla-ginegar-150',
    batchNumber: 'LOTE-GIN-24A',
    condition: 'NOVO',
    meters: 3500,
    costPerMeter: 5.20,
    totalCost: 18200.00,
    parcelId: 'parc-lab1-01',
    reason: 'Instalação na Parcela 01 - BRS Vitória',
    operatorId: 'user-carlos',
    operatorName: 'Carlos Eduardo Mendes',
    operatorRole: 'Gestor',
    timestamp: '2024-02-15T16:30:00Z'
  },
  {
    id: 'mov-003',
    type: 'ENTRADA',
    farmId: 'farm-lab1',
    plasticId: 'pla-mulch-30',
    batchNumber: 'LOTE-MUL-24B',
    condition: 'NOVO',
    meters: 12000,
    costPerMeter: 1.85,
    totalCost: 22200.00,
    reason: 'Compra inicial NF 4890',
    operatorId: 'user-larissa',
    operatorName: 'Larissa Pereira',
    operatorRole: 'Administrador',
    timestamp: '2024-02-05T09:00:00Z'
  },
  {
    id: 'mov-004',
    type: 'INSTALACAO',
    farmId: 'farm-lab1',
    plasticId: 'pla-mulch-30',
    batchNumber: 'LOTE-MUL-24B',
    condition: 'NOVO',
    meters: 4000,
    costPerMeter: 1.85,
    totalCost: 7400.00,
    parcelId: 'parc-lab1-02',
    reason: 'Instalação de Mulching na Parcela 02 - Cotton Candy',
    operatorId: 'user-larissa',
    operatorName: 'Larissa Pereira',
    operatorRole: 'Administrador',
    timestamp: '2024-03-01T11:00:00Z'
  },
  {
    id: 'mov-005',
    type: 'RETIRADA_REAPROVEITADO',
    farmId: 'farm-lab1',
    plasticId: 'pla-ginegar-150',
    batchNumber: 'REUT-2024-01-LAB1',
    condition: 'REUTILIZADO',
    meters: 1200,
    costPerMeter: 2.60,
    totalCost: 3120.00,
    parcelId: 'parc-lab1-01',
    reason: 'Entrada de material recuperado da Parcela 01 para reuso',
    operatorId: 'user-carlos',
    operatorName: 'Carlos Eduardo Mendes',
    operatorRole: 'Gestor',
    timestamp: '2024-04-10T16:00:00Z'
  },
  {
    id: 'mov-006',
    type: 'RETIRADA_DESCARTE',
    farmId: 'farm-lab1',
    plasticId: 'pla-ginegar-150',
    batchNumber: 'LOTE-GIN-24A',
    condition: 'NOVO',
    meters: 300,
    costPerMeter: 5.20,
    totalCost: 1560.00,
    parcelId: 'parc-lab1-01',
    reason: 'Descarte por dano de vento e desgaste',
    operatorId: 'user-carlos',
    operatorName: 'Carlos Eduardo Mendes',
    operatorRole: 'Gestor',
    timestamp: '2024-04-10T16:00:00Z'
  }
];

export const INITIAL_AUDIT_LOGS: AuditLog[] = [
  {
    id: 'audit-001',
    action: 'Carga de Dados Oficiais',
    category: 'IMPORTACAO',
    details: 'Importação cadastral a partir de "PLASTICULTURA - FAZENDAS - OFICIAL DATAS". Estrutura: Fazenda > Setor > Parcela.',
    userId: 'user-larissa',
    userName: 'Larissa Pereira',
    userRole: 'Administrador',
    timestamp: '2024-01-15T08:00:00Z'
  },
  {
    id: 'audit-002',
    action: 'Preservação de Registros Duplicados',
    category: 'CADASTRO',
    details: 'Parcela 04 preservada com variedades BRS Vitória (2.5 ha) e Sweet Celebration (1.8 ha) para conferência.',
    userId: 'user-larissa',
    userName: 'Larissa Pereira',
    userRole: 'Administrador',
    timestamp: '2024-01-15T08:05:00Z'
  }
];

export const INITIAL_ACTIVITY_TYPES: ActivityTypeItem[] = [
  { id: 'act-type-01', name: 'Instalação de plástico', active: true, isDefault: true, createdAt: '2026-01-01T08:00:00Z', updatedAt: '2026-01-01T08:00:00Z' },
  { id: 'act-type-02', name: 'Retirada de plástico', active: true, isDefault: true, createdAt: '2026-01-01T08:00:00Z', updatedAt: '2026-01-01T08:00:00Z' },
  { id: 'act-type-03', name: 'Reutilização de plástico', active: true, isDefault: true, createdAt: '2026-01-01T08:00:00Z', updatedAt: '2026-01-01T08:00:00Z' },
  { id: 'act-type-04', name: 'Reparos no plástico', active: true, isDefault: true, createdAt: '2026-01-01T08:00:00Z', updatedAt: '2026-01-01T08:00:00Z' },
  { id: 'act-type-05', name: 'Manutenção de estrutura', active: true, isDefault: true, createdAt: '2026-01-01T08:00:00Z', updatedAt: '2026-01-01T08:00:00Z' },
  { id: 'act-type-06', name: 'Limpeza', active: true, isDefault: true, createdAt: '2026-01-01T08:00:00Z', updatedAt: '2026-01-01T08:00:00Z' },
  { id: 'act-type-07', name: 'Inspeção', active: true, isDefault: true, createdAt: '2026-01-01T08:00:00Z', updatedAt: '2026-01-01T08:00:00Z' },
  { id: 'act-type-08', name: 'Organização de materiais', active: true, isDefault: true, createdAt: '2026-01-01T08:00:00Z', updatedAt: '2026-01-01T08:00:00Z' },
  { id: 'act-type-09', name: 'Outras atividades', active: true, isDefault: true, createdAt: '2026-01-01T08:00:00Z', updatedAt: '2026-01-01T08:00:00Z' }
];

export const INITIAL_ACTIVITIES: PlasticultureActivity[] = [
  {
    id: 'act-001',
    farmId: 'farm-vale-uvas',
    farmCode: 'VDU',
    farmName: 'Vale das Uvas',
    sector: 'Setor Represa',
    parcelId: 'parc-vdu-01',
    parcelCode: 'Parcela REP-01',
    executionDate: '2026-11-18',
    activityType: 'Manutenção de estrutura',
    serviceDescription: 'Reaperto dos arames de cumeeira e verificação de presilhas laterais contra rajadas de vento.',
    supervisor: 'Antônio Ferreira',
    teamName: 'Equipe Parral VDU-A',
    peopleCount: 6,
    hoursWorked: 7.5,
    status: 'Concluída',
    observations: 'Cobertura estabilizada em toda a borda da represa sem danos ao filme plástico.',
    history: [
      {
        id: 'acth-001-1',
        timestamp: '2026-11-18T07:30:00Z',
        action: 'Criação',
        userName: 'Rodrigo Siqueira',
        userRole: 'Gestor',
        newStatus: 'Em andamento',
        summary: 'Atividade aberta para manutenção preventiva pós-vento.'
      },
      {
        id: 'acth-001-2',
        timestamp: '2026-11-18T16:15:00Z',
        action: 'Alteração de Status',
        userName: 'Antônio Ferreira',
        userRole: 'Operador',
        previousStatus: 'Em andamento',
        newStatus: 'Concluída',
        summary: 'Serviço finalizado com 6 colaboradores e 7,5 horas trabalhadas.'
      }
    ],
    createdBy: 'Rodrigo Siqueira',
    createdAt: '2026-11-18T07:30:00Z',
    updatedAt: '2026-11-18T16:15:00Z'
  },
  {
    id: 'act-002',
    farmId: 'farm-lab1',
    farmCode: 'LAB',
    farmName: 'Labrunier I',
    sector: 'Setor 01 - Norte',
    parcelId: 'parc-lab1-03',
    parcelCode: 'Parcela 03',
    executionDate: '2026-11-19',
    activityType: 'Inspeção',
    serviceDescription: 'Inspeção de campo na parcela Crimson Seedless para confirmação da cobertura ativa e integridade do plástico.',
    supervisor: 'Marcos Vinícius',
    teamName: 'Equipe Técnica LAB',
    peopleCount: 2,
    hoursWorked: 3.0,
    status: 'Em andamento',
    observations: 'Avaliar necessidade de substituição parcial nas linhas de bordadura.',
    history: [
      {
        id: 'acth-002-1',
        timestamp: '2026-11-19T08:00:00Z',
        action: 'Criação',
        userName: 'Carlos Eduardo Mendes',
        userRole: 'Gestor',
        newStatus: 'Pendente',
        summary: 'Vistoria agendada para conferência de cobertura.'
      },
      {
        id: 'acth-002-2',
        timestamp: '2026-11-19T13:20:00Z',
        action: 'Alteração de Status',
        userName: 'Marcos Vinícius',
        userRole: 'Operador',
        previousStatus: 'Pendente',
        newStatus: 'Em andamento',
        summary: 'Equipe em campo realizando levantamento das linhas.'
      }
    ],
    createdBy: 'Carlos Eduardo Mendes',
    createdAt: '2026-11-19T08:00:00Z',
    updatedAt: '2026-11-19T13:20:00Z'
  },
  {
    id: 'act-003',
    farmId: 'farm-lab2',
    farmCode: 'LBR',
    farmName: 'Labrunier II',
    sector: 'Setor Mandacaru A',
    parcelId: 'parc-lab2-02',
    parcelCode: 'Parcela M-02',
    executionDate: '2026-11-20',
    activityType: 'Instalação de plástico',
    serviceDescription: 'Preparação de estrutura e estiramento de novo filme Serroplast antes do início da brotação.',
    supervisor: 'Cláudio Albuquerque',
    teamName: 'Equipe Cobertura LBR-01',
    peopleCount: 8,
    hoursWorked: 8.0,
    status: 'Pendente',
    observations: 'Aguardando liberação das bobinas no almoxarifado central.',
    history: [
      {
        id: 'acth-003-1',
        timestamp: '2026-11-20T06:45:00Z',
        action: 'Criação',
        userName: 'Larissa Pereira',
        userRole: 'Administrador',
        newStatus: 'Pendente',
        summary: 'Atividade programada para equipe de cobertura.'
      }
    ],
    createdBy: 'Larissa Pereira',
    createdAt: '2026-11-20T06:45:00Z',
    updatedAt: '2026-11-20T06:45:00Z'
  },
  {
    id: 'act-004',
    farmId: 'farm-br-uvas',
    farmCode: 'BRU',
    farmName: 'Brasil Uvas',
    sector: 'Setor Exportação',
    parcelId: 'parc-bru-01',
    parcelCode: 'Parcela EXP-10',
    executionDate: '2026-11-17',
    activityType: 'Reparos no plástico',
    serviceDescription: 'Emenda térmica de rasgos pontuais e reforço de elásticos de fixação no parral Arra 15.',
    supervisor: 'Renato Cavalcanti',
    teamName: 'Equipe Manutenção BRU',
    peopleCount: 4,
    hoursWorked: 5.5,
    status: 'Concluída',
    observations: 'Serviço concluído dentro do prazo para proteção dos cachos em maturação.',
    history: [
      {
        id: 'acth-004-1',
        timestamp: '2026-11-17T07:00:00Z',
        action: 'Criação',
        userName: 'Fernando Alencar',
        userRole: 'Gestor',
        newStatus: 'Concluída',
        summary: 'Registro de manutenção executada e validada pelo supervisor.'
      }
    ],
    createdBy: 'Fernando Alencar',
    createdAt: '2026-11-17T07:00:00Z',
    updatedAt: '2026-11-17T15:30:00Z'
  }
];
