export type UserRole = 'Administrador' | 'Gestor' | 'Operador';

export type UserStatus = 'Ativo' | 'Inativo';

export type UserPermissionKey =
  | 'view_info'
  | 'create_records'
  | 'edit_records'
  | 'delete_records'
  | 'access_reports'
  | 'access_plasticulture_activities'
  | 'access_covered_areas'
  | 'access_catalogs'
  | 'access_user_management';

export type UserPermissions = Record<UserPermissionKey, boolean>;

export interface UserProfile {
  id: string;
  name: string;
  email: string;
  login?: string;
  role: UserRole;
  jobTitle?: string;
  farmAssigned?: string;
  farmScope: 'ALL' | string; // 'ALL' ou ID da fazenda específica
  status: UserStatus;
  permissions: UserPermissions;
  hasPasswordSet?: boolean;
  lastLoginAt?: string;
  createdAt?: string;
  updatedAt?: string;
  avatarUrl?: string;
}

export interface UserInviteLink {
  id: string;
  userId: string;
  userName?: string;
  userEmail?: string;
  userRole?: UserRole;
  farmScope?: string;
  token: string;
  url: string;
  expiresAt: string;
  createdAt: string;
  createdBy: string;
  revoked: boolean;
  revokedAt?: string;
  usedAt?: string;
  status: 'Ativo' | 'Expirado' | 'Revogado' | 'Utilizado';
}

// 1. Estrutura das áreas: Fazenda > Setor > Parcela
// Observação mandatória: Não criar campos de talhão ou quadra.
export interface Farm {
  id: string;
  name: string; // Labrunier I, Labrunier II, Brasil Uvas, Vale das Uvas
  code: string;
  location: string;
  totalHectares: number;
  serroplastHectares?: number; // Área Oficial com Serroplast (ha)
  manager: string;
  contactPhone: string;
  createdAt: string;
}

export interface Sector {
  id: string;
  farmId: string;
  name: string; // ex: Setor 01, Setor Norte, Setor A
  code: string;
  totalHectares?: number;
  supervisorDefault?: string;
  createdAt: string;
}

export type ParcelSituation = 'Coberta' | 'Descoberta' | 'A Confirmar' | 'Em Substituição';

export type StructureStatus = 'Com Estrutura' | 'Sem Estrutura' | 'Pendente de confirmação';

export type CoverageStatus = 'Instalado Atualmente' | 'Substituído' | 'Removido' | 'A Confirmar';

export interface CoverageRecord {
  id: string;
  coverageDate: string; // YYYY-MM-DD
  plasticType: string; // Nome ou tipo de plástico
  plasticId?: string;
  metersInstalled: number;
  status: CoverageStatus;
  isCurrentConfirmed: boolean; // Confirmação se está instalado atualmente
  responsible: string;
  notes?: string;
  registeredAt: string;
  registeredBy: string;
}

export interface Parcel {
  id: string;
  farmId: string;
  farmCode: string;
  farmName: string;
  sector: string; // Nome do setor
  sectorId?: string;
  parcelCode: string; // Identificação da parcela (ex: Parcela 01, P-02, P-12A)
  supervisor: string; // Supervisor responsável
  variety: string; // Variedade (ex: BRS Vitória, Cotton Candy, Crimson, Arra 15, Sweet Celebration, etc.)
  hectares: number; // Área em hectares
  situation: ParcelSituation; // Situação atual do plástico instalado (Coberta, Descoberta, A Confirmar)
  structureStatus?: StructureStatus; // Situação independente da estrutura física (Com Estrutura, Sem Estrutura, Pendente de confirmação)
  structureNotes?: string; // Observações sobre a estrutura física
  currentPlasticType?: string; // Plástico atualmente instalado (confirmado)
  currentPlasticId?: string;
  currentMetersCovered?: number;
  coverageHistory: CoverageRecord[]; // Histórico completo de coberturas
  hasDuplicateFlag?: boolean; // Sinalizador de parcela repetida / variedades diferentes
  duplicateNotes?: string; // Detalhe da duplicidade para conferência
  additionalInfo?: string; // Informações adicionais do documento oficial
  source: string; // ex: "PLASTICULTURA - FAZENDAS - OFICIAL DATAS"
  lastAuditedAt?: string;
  lastAuditedBy?: string;
  createdAt: string;
  updatedAt: string;
}

// 2. Cadastro de Plásticos
export type PlasticCategory = 
  | 'Cobertura de Parral'
  | 'Mulching (Solo)'
  | 'Mini-Túnel'
  | 'Macrotúnel'
  | 'Cortina Corta-Vento'
  | 'Silagem / Fardamento';

export interface PlasticMaterial {
  id: string;
  name: string;
  category: PlasticCategory;
  thicknessMicrons: number;
  widthMeters: number;
  color: string;
  manufacturer: string;
  rollLengthMeters: number;
  pricePerMeter: number;
  supplier: string;
  acquisitionDate: string;
  lifespanExpectedMonths?: number;
  minStockAlertMeters: number;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

// 3. Controle de Estoque
export type StockCondition = 'NOVO' | 'REUTILIZADO';

export interface StockItem {
  id: string;
  farmId: string;
  plasticId: string;
  batchNumber: string;
  condition: StockCondition;
  metersAvailable: number;
  costPerMeter: number;
  originDetails?: string;
  lastUpdated: string;
}

export type MovementType = 
  | 'ENTRADA' 
  | 'SAIDA_AVULSA' 
  | 'TRANSFERENCIA_SAIDA' 
  | 'TRANSFERENCIA_ENTRADA' 
  | 'INSTALACAO' 
  | 'SUBSTITUICAO'
  | 'RETIRADA_REAPROVEITADO' 
  | 'RETIRADA_DESCARTE'
  | 'AJUSTE_INVENTARIO';

export interface StockMovement {
  id: string;
  type: MovementType;
  farmId: string;
  plasticId: string;
  batchNumber: string;
  condition: StockCondition;
  meters: number;
  costPerMeter: number;
  totalCost: number;
  destinationFarmId?: string;
  originFarmId?: string;
  parcelId?: string; // Vinculado à Parcela
  coverageId?: string;
  removalId?: string;
  reason: string;
  notes?: string;
  operatorId: string;
  operatorName: string;
  operatorRole: UserRole;
  timestamp: string;
}

// 4. Instalações e Substituições
export interface PlasticInstallation {
  id: string;
  farmId: string;
  sector: string;
  parcelId: string;
  parcelCode: string;
  plasticId: string;
  plasticName: string;
  batchNumber: string;
  conditionUsed: StockCondition;
  metersInstalled: number;
  costPerMeter: number;
  totalCost: number;
  installationDate: string;
  responsibleName: string;
  isSubstitution?: boolean;
  substitutedPlasticName?: string;
  status: 'ATIVO' | 'CONCLUIDO_RETIRADO' | 'SUBSTITUIDO';
  metersActiveRemaining: number;
  notes?: string;
  registeredBy: string;
  registeredRole: UserRole;
  createdAt: string;
}

// 5. Retirada e Reutilização
export type RemovalReason = 
  | 'Fim de Ciclo / Poda' 
  | 'Dano Climático (Vento / Granizo)' 
  | 'Desgaste / Ressecamento' 
  | 'Substituição de Variedade' 
  | 'Substituição por Novo Plástico'
  | 'Outro';

export interface PlasticRemoval {
  id: string;
  installationId?: string;
  farmId: string;
  parcelId: string;
  plasticId: string;
  plasticName: string;
  removalDate: string;
  totalMetersRemoved: number;
  reusableMeters: number;
  discardedMeters: number;
  reusableValue: number;
  discardedValue: number;
  generatedBatchNumber: string;
  reason: RemovalReason;
  responsibleName: string;
  notes?: string;
  registeredBy: string;
  registeredRole: UserRole;
  createdAt: string;
}

// 6. Auditoria
export interface AuditLog {
  id: string;
  action: string;
  category: 'CADASTRO' | 'ESTOQUE' | 'INSTALACAO' | 'SUBSTITUICAO' | 'RETIRADA' | 'TRANSFERENCIA' | 'IMPORTACAO' | 'SEGURANCA' | 'ATIVIDADES';
  details: string;
  userId: string;
  userName: string;
  userRole: UserRole;
  timestamp: string;
}

// 7. Filtros
export interface DashboardFilters {
  farmId: string;
  plasticId: string;
  sector: string;
  supervisor: string;
  variety: string;
  situation: string; // 'ALL' | 'Coberta' | 'Descoberta' | 'A Confirmar'
  condition?: 'ALL' | 'NOVO' | 'REUTILIZADO';
  hasDuplicatesOnly?: boolean;
}

// 8. Importação Oficial Staging
export interface OfficialImportStagingRow {
  tempId: string;
  farmCode: string;
  farmName: string;
  sector: string;
  parcelCode: string;
  supervisor: string;
  variety: string;
  hectares: number;
  situation: ParcelSituation;
  coverageDate?: string;
  plasticType?: string;
  additionalInfo?: string;
  hasDuplicateWarning?: boolean;
  duplicateWarningDetails?: string;
  status: 'PENDENTE_CONFERENCIA' | 'CONFIRMADO' | 'DESCARTADO';
}

// 9. Registro Oficial de Serroplast por Parcela
export type AreaConfirmationStatus = 'Confirmado' | 'Não Possui' | 'Pendente de confirmação';

export interface SerroplastRecord {
  id: string;
  sigla: 'LAB' | 'BRU' | 'LBR' | 'VDU';
  fazendaNome: string;
  setorFazenda: string;
  supervisor: string;
  setorInterno: string; // Setor
  parcela: string; // Parcela
  variedade: string;
  areaHa: number;
  situacao?: string;
  plasticulturaConfirmada?: AreaConfirmationStatus; // Campo independente: plástico instalado confirmado
  estruturaConfirmada?: AreaConfirmationStatus; // Campo independente: estrutura física confirmada
  data1?: string;
  cobertura1?: string;
  data2?: string;
  cobertura2?: string;
  data3?: string;
  cobertura3?: string;
  informacao?: string;
  ativo: boolean; // Permitir inativar registros sem perder histórico
  motivoInativacao?: string;
  inativadoEm?: string;
  dataImportacao?: string;
  criadoEm?: string;
  atualizadoEm?: string;
  notasAuditoria?: string;
}

// 10. Atividades do Setor de Plasticultura
export type ActivityStatus = 'Pendente' | 'Em andamento' | 'Concluída';

export interface ActivityTypeItem {
  id: string;
  name: string;
  active: boolean;
  isDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActivityHistoryEntry {
  id: string;
  timestamp: string;
  action: 'Criação' | 'Edição' | 'Alteração de Status';
  userName: string;
  userRole: UserRole;
  previousStatus?: ActivityStatus;
  newStatus?: ActivityStatus;
  summary: string;
}

export interface PlasticultureActivity {
  id: string;
  farmId: string;
  farmCode: string;
  farmName: string;
  sector: string;
  parcelId?: string;
  parcelCode: string;
  executionDate: string; // YYYY-MM-DD
  activityType: string;
  serviceDescription: string;
  supervisor: string;
  teamName: string;
  peopleCount: number;
  hoursWorked: number;
  status: ActivityStatus;
  observations?: string;
  history: ActivityHistoryEntry[];
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 11. Atividades de Plasticultura (Integradas ao Plano de Manutenção de Parreiral 2027)
export type PlasticulturePlanActivityType =
  | 'Estaqueamento'
  | 'Perímetro'
  | 'Estrutura Inicial'
  | 'Manutenção de Plasticultura'
  | 'Outras';

export type PlasticulturePlanActivityStatus = 'Programada' | 'Em andamento' | 'Finalizada';

export interface ParreiralPlan2027Row {
  readonly id: string;
  readonly rowNumber: number;
  readonly faz: 'LAB' | 'BRU' | 'LBR' | 'VDU';
  readonly fazendaNome: string;
  readonly farmId: string;
  readonly setorFazenda: string;
  readonly supervisor: string;
  readonly setorInterno: string;
  readonly parcela: string;
  readonly variedade: string;
  readonly areaHa: number;
  readonly necessidade: string;
  readonly statusPlanilha: string;
  readonly ciclo: string;
  readonly podaData: string; // DD/MM/YYYY (separado estritamente de plasticultura)
  readonly inicioData: string; // DD/MM/YYYY (coluna INICIO da manutenção)
  readonly finalData: string; // DD/MM/YYYY (coluna FINAL da manutenção)
  readonly dias: string;
  readonly situacao: string; // 'Estrutura Plasticultura' | 'Latada' | 'Programada' | ''
}

export interface PlasticulturePlanActivity {
  id: string;
  farmId: string;
  farmCode: string;
  farmName: string;
  sector: string;
  supervisor: string;
  parcelId?: string;
  parcelCode: string;
  variety: string;
  areaHa: number;
  activityType: PlasticulturePlanActivityType | (string & {});
  customActivityDescription?: string; // Obrigatório quando activityType === 'Outras'
  startDate: string; // YYYY-MM-DD (Data de início)
  endDate: string; // YYYY-MM-DD (Data de finalização)
  status: PlasticulturePlanActivityStatus;
  responsible: string;
  observations?: string;
  spreadsheetOrigin?: {
    readonly rowId: string;
    readonly necessidadeOriginal: string;
    readonly statusOriginal: string;
    readonly situacaoOriginal: string;
    readonly inicioOriginal?: string;
  };
  createdBy: string;
  createdAt: string;
  updatedAt: string;
}

// 12. Cadastro de Itens para Atividades de Plasticultura (com vínculo por Fazenda)
export type PlasticultureCatalogCategory =
  | 'SUPERVISOR'
  | 'RESPONSAVEL'
  | 'SETOR'
  | 'PARCELA'
  | 'VARIEDADE'
  | 'ATIVIDADE';

export interface PlasticultureCatalogItem {
  id: string;
  category: PlasticultureCatalogCategory;
  name: string;
  farmIds: string[]; // Fazendas vinculadas (apenas nestas o item será exibido)
  active: boolean;
  sectorName?: string;
  varietyName?: string;
  supervisorName?: string;
  areaHa?: number;
  notes?: string;
  isSystemDefault?: boolean;
  createdAt: string;
  updatedAt: string;
}


