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
  StockCondition,
  CoverageRecord,
  ParcelSituation,
  StructureStatus,
  SerroplastRecord,
  ActivityStatus,
  ActivityHistoryEntry,
  PlasticultureActivity,
  ActivityTypeItem,
  PlasticulturePlanActivity,
  PlasticulturePlanActivityStatus,
  PlasticultureCatalogItem
} from '../types';

import {
  INITIAL_FARMS,
  INITIAL_SECTORS,
  INITIAL_PARCELS,
  INITIAL_PLASTICS,
  INITIAL_STOCK,
  INITIAL_INSTALLATIONS,
  INITIAL_REMOVALS,
  INITIAL_MOVEMENTS,
  INITIAL_USERS,
  INITIAL_AUDIT_LOGS,
  INITIAL_ACTIVITIES,
  INITIAL_ACTIVITY_TYPES
} from '../data/seedData';
import { INITIAL_SERROPLAST_RECORDS } from '../data/serroplastData';
import { INITIAL_PLASTICULTURE_PLAN_ACTIVITIES } from '../data/parreiralPlan2027Data';
import { INITIAL_PLASTICULTURE_CATALOG_ITEMS } from '../data/plasticultureCatalogSeed';
import { DEFAULT_COVERED_HECTARE_VALUE } from '../utils/farmAreaSummary';

const STORAGE_KEYS = {
  FARMS: 'gpa_farms_v2',
  SECTORS: 'gpa_sectors_v2',
  PARCELS: 'gpa_parcels_v2',
  PLASTICS: 'gpa_plastics_v2',
  STOCK: 'gpa_stock_v2',
  MOVEMENTS: 'gpa_movements_v2',
  INSTALLATIONS: 'gpa_installations_v2',
  REMOVALS: 'gpa_removals_v2',
  USERS: 'gpa_users_v2',
  AUDIT: 'gpa_audit_v2',
  CURRENT_USER: 'gpa_current_user_v2',
  SERROPLAST: 'gpa_serroplast_v2',
  ACTIVITIES: 'gpa_activities_v2',
  ACTIVITY_TYPES: 'gpa_activity_types_v2',
  PLASTICULTURE_PLAN_ACTIVITIES: 'gpa_plasticulture_plan_activities_v2',
  PLASTICULTURE_CATALOG: 'gpa_plasticulture_catalog_v2',
  COVERED_HECTARE_VALUE: 'gpa_covered_hectare_value_v2'
};

function getFromStorage<T>(key: string, defaultValue: T): T {
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultValue;
    return JSON.parse(raw) as T;
  } catch (err) {
    console.error(`Erro ao carregar dados da chave ${key}:`, err);
    return defaultValue;
  }
}

function saveToStorage<T>(key: string, data: T): void {
  try {
    localStorage.setItem(key, JSON.stringify(data));
  } catch (err) {
    console.error(`Erro ao salvar dados na chave ${key}:`, err);
  }
}

export class AppStorageService {
  static initStorage(): void {
    if (!localStorage.getItem(STORAGE_KEYS.PARCELS)) {
      this.resetToDefaults();
    } else {
      this.migrateOfficialFarmCodes();
      if (!localStorage.getItem(STORAGE_KEYS.SERROPLAST)) {
        saveToStorage(STORAGE_KEYS.SERROPLAST, INITIAL_SERROPLAST_RECORDS);
      }
      if (!localStorage.getItem(STORAGE_KEYS.ACTIVITIES)) {
        saveToStorage(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
      }
      if (!localStorage.getItem(STORAGE_KEYS.ACTIVITY_TYPES)) {
        saveToStorage(STORAGE_KEYS.ACTIVITY_TYPES, INITIAL_ACTIVITY_TYPES);
      }
      if (!localStorage.getItem(STORAGE_KEYS.PLASTICULTURE_PLAN_ACTIVITIES)) {
        saveToStorage(STORAGE_KEYS.PLASTICULTURE_PLAN_ACTIVITIES, INITIAL_PLASTICULTURE_PLAN_ACTIVITIES);
      }
      if (!localStorage.getItem(STORAGE_KEYS.PLASTICULTURE_CATALOG)) {
        saveToStorage(STORAGE_KEYS.PLASTICULTURE_CATALOG, INITIAL_PLASTICULTURE_CATALOG_ITEMS);
      }
      if (!localStorage.getItem(STORAGE_KEYS.COVERED_HECTARE_VALUE)) {
        saveToStorage(STORAGE_KEYS.COVERED_HECTARE_VALUE, DEFAULT_COVERED_HECTARE_VALUE);
      }
    }
  }

  static migrateOfficialFarmCodes(): void {
    try {
      const farms = this.getFarms();
      let farmsUpdated = false;
      const updatedFarms = farms.map(f => {
        let code = f.code;
        let serroplastHectares = f.serroplastHectares;
        if (f.id === 'farm-vale-uvas' || f.name.toLowerCase().includes('vale das uvas') || f.code === 'VDU' || f.code === 'VDU-01') {
          code = 'VDU';
          serroplastHectares = 91.50;
        } else if (f.id === 'farm-lab1' || f.name.toLowerCase().includes('labrunier i') || f.code === 'LAB' || f.code === 'LAB-01') {
          code = 'LAB';
          serroplastHectares = 43.41;
        } else if (f.id === 'farm-br-uvas' || f.name.toLowerCase().includes('brasil uvas') || f.code === 'BRU' || f.code === 'BRU-01') {
          code = 'BRU';
          serroplastHectares = 50.57;
        } else if (f.id === 'farm-lab2' || f.name.toLowerCase().includes('labrunier ii') || f.code === 'LBR' || f.code === 'LAB-02') {
          code = 'LBR';
          serroplastHectares = 87.79;
        }
        if (code !== f.code || serroplastHectares !== f.serroplastHectares) {
          farmsUpdated = true;
          return { ...f, code, serroplastHectares };
        }
        return f;
      });

      if (farmsUpdated) {
        saveToStorage(STORAGE_KEYS.FARMS, updatedFarms);
      }

      // Ensure Serroplast material exists in plastics
      const storedPlastics = this.getPlastics();
      if (!storedPlastics.some(p => p.id === 'pla-serroplast' || p.manufacturer.toLowerCase().includes('serroplast'))) {
        const serroplastPlastic = INITIAL_PLASTICS.find(p => p.id === 'pla-serroplast');
        if (serroplastPlastic) {
          storedPlastics.push(serroplastPlastic);
          saveToStorage(STORAGE_KEYS.PLASTICS, storedPlastics);
        }
      }

      // Ensure Serroplast stock items exist
      const storedStock = this.getStock();
      if (!storedStock.some(s => s.plasticId === 'pla-serroplast')) {
        const serroplastStock = INITIAL_STOCK.filter(s => s.plasticId === 'pla-serroplast');
        if (serroplastStock.length > 0) {
          storedStock.push(...serroplastStock);
          saveToStorage(STORAGE_KEYS.STOCK, storedStock);
        }
      }

      const parcels = this.getParcels();
      let parcelsUpdated = false;
      const updatedParcels = parcels.map(p => {
        let farmCode = p.farmCode;
        if (p.farmId === 'farm-vale-uvas' || p.farmName?.toLowerCase().includes('vale das uvas') || p.farmCode === 'VDU-01') {
          farmCode = 'VDU';
        } else if (p.farmId === 'farm-lab1' || p.farmName?.toLowerCase().includes('labrunier i') || p.farmCode === 'LAB-01') {
          farmCode = 'LAB';
        } else if (p.farmId === 'farm-br-uvas' || p.farmName?.toLowerCase().includes('brasil uvas') || p.farmCode === 'BRU-01') {
          farmCode = 'BRU';
        } else if (p.farmId === 'farm-lab2' || p.farmName?.toLowerCase().includes('labrunier ii') || p.farmCode === 'LAB-02') {
          farmCode = 'LBR';
        }
        if (farmCode !== p.farmCode) {
          parcelsUpdated = true;
          return { ...p, farmCode };
        }
        return p;
      });

      if (parcelsUpdated) {
        saveToStorage(STORAGE_KEYS.PARCELS, updatedParcels);
      }
    } catch (e) {
      console.warn('Erro ao migrar dados e siglas oficiais das fazendas:', e);
    }
  }

  static resetToDefaults(): void {
    saveToStorage(STORAGE_KEYS.FARMS, INITIAL_FARMS);
    saveToStorage(STORAGE_KEYS.SECTORS, INITIAL_SECTORS);
    saveToStorage(STORAGE_KEYS.PARCELS, INITIAL_PARCELS);
    saveToStorage(STORAGE_KEYS.PLASTICS, INITIAL_PLASTICS);
    saveToStorage(STORAGE_KEYS.STOCK, INITIAL_STOCK);
    saveToStorage(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
    saveToStorage(STORAGE_KEYS.INSTALLATIONS, INITIAL_INSTALLATIONS);
    saveToStorage(STORAGE_KEYS.REMOVALS, INITIAL_REMOVALS);
    saveToStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
    saveToStorage(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS);
    saveToStorage(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
    saveToStorage(STORAGE_KEYS.SERROPLAST, INITIAL_SERROPLAST_RECORDS);
    saveToStorage(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
    saveToStorage(STORAGE_KEYS.ACTIVITY_TYPES, INITIAL_ACTIVITY_TYPES);
    saveToStorage(STORAGE_KEYS.PLASTICULTURE_PLAN_ACTIVITIES, INITIAL_PLASTICULTURE_PLAN_ACTIVITIES);
    saveToStorage(STORAGE_KEYS.PLASTICULTURE_CATALOG, INITIAL_PLASTICULTURE_CATALOG_ITEMS);
    saveToStorage(STORAGE_KEYS.COVERED_HECTARE_VALUE, DEFAULT_COVERED_HECTARE_VALUE);
  }

  // --- USERS & AUTH ---
  static getUsers(): UserProfile[] {
    return getFromStorage(STORAGE_KEYS.USERS, INITIAL_USERS);
  }

  static getCurrentUser(): UserProfile {
    return getFromStorage(STORAGE_KEYS.CURRENT_USER, INITIAL_USERS[0]);
  }

  static setCurrentUser(user: UserProfile): void {
    saveToStorage(STORAGE_KEYS.CURRENT_USER, user);
  }

  // --- FARMS ---
  static getFarms(): Farm[] {
    return getFromStorage(STORAGE_KEYS.FARMS, INITIAL_FARMS);
  }

  static saveFarm(farm: Farm, currentUser: UserProfile): void {
    const farms = this.getFarms();
    const index = farms.findIndex(f => f.id === farm.id);
    const isNew = index < 0;
    if (isNew) farms.push(farm);
    else farms[index] = farm;
    saveToStorage(STORAGE_KEYS.FARMS, farms);

    this.addAuditLog({
      action: isNew ? 'Cadastro de Fazenda' : 'Edição de Fazenda',
      category: 'CADASTRO',
      details: `Fazenda "${farm.name}" (${farm.code}) ${isNew ? 'cadastrada' : 'atualizada'}.`,
      user: currentUser
    });
  }

  // --- SETORES ---
  static getSectors(): Sector[] {
    return getFromStorage(STORAGE_KEYS.SECTORS, INITIAL_SECTORS);
  }

  static saveSector(sector: Sector, currentUser: UserProfile): void {
    const sectors = this.getSectors();
    const index = sectors.findIndex(s => s.id === sector.id);
    const isNew = index < 0;
    if (isNew) sectors.push(sector);
    else sectors[index] = sector;
    saveToStorage(STORAGE_KEYS.SECTORS, sectors);

    this.addAuditLog({
      action: isNew ? 'Cadastro de Setor' : 'Edição de Setor',
      category: 'CADASTRO',
      details: `Setor "${sector.name}" (${sector.code}) ${isNew ? 'cadastrado' : 'atualizado'}.`,
      user: currentUser
    });
  }

  // --- PARCELAS (Estrutura Oficial) ---
  static getParcels(): Parcel[] {
    return getFromStorage(STORAGE_KEYS.PARCELS, INITIAL_PARCELS);
  }

  static saveParcel(parcel: Parcel, currentUser: UserProfile): void {
    const parcels = this.getParcels();
    const index = parcels.findIndex(p => p.id === parcel.id);
    const isNew = index < 0;
    
    // Check for potential duplicate parcels in the same farm/sector
    const duplicateMatch = parcels.find(
      p => p.id !== parcel.id &&
           p.farmId === parcel.farmId &&
           p.sector.trim().toLowerCase() === parcel.sector.trim().toLowerCase() &&
           p.parcelCode.trim().toLowerCase() === parcel.parcelCode.trim().toLowerCase()
    );

    if (duplicateMatch) {
      parcel.hasDuplicateFlag = true;
      parcel.duplicateNotes = `Sinalização para conferência: Parcela ${parcel.parcelCode} cadastrada também com variedade "${duplicateMatch.variety}" (${duplicateMatch.hectares} ha). Registros preservados.`;
    }

    if (isNew) parcels.push(parcel);
    else parcels[index] = parcel;

    saveToStorage(STORAGE_KEYS.PARCELS, parcels);

    this.addAuditLog({
      action: isNew ? 'Cadastro de Parcela' : 'Atualização de Parcela',
      category: 'CADASTRO',
      details: `Parcela "${parcel.parcelCode}" (${parcel.variety}, ${parcel.hectares} ha) salva na fazenda ${parcel.farmName}. Supervisor: ${parcel.supervisor}. Situação: ${parcel.situation}.`,
      user: currentUser
    });
  }

  // Confirmação explícita de situação da cobertura e/ou estrutura (campos independentes)
  static confirmParcelSituation(params: {
    parcelId: string;
    situation: ParcelSituation;
    structureStatus?: StructureStatus;
    structureNotes?: string;
    currentPlasticType?: string;
    currentMetersCovered?: number;
    notes?: string;
    currentUser: UserProfile;
  }): { success: boolean; message: string } {
    const parcels = this.getParcels();
    const parcel = parcels.find(p => p.id === params.parcelId);
    if (!parcel) return { success: false, message: 'Parcela não encontrada.' };

    const previousSituation = parcel.situation;
    const previousStructure = parcel.structureStatus || 'Pendente de confirmação';
    parcel.situation = params.situation;
    if (params.structureStatus !== undefined) {
      parcel.structureStatus = params.structureStatus;
    }
    if (params.structureNotes !== undefined) {
      parcel.structureNotes = params.structureNotes;
    }
    if (params.currentPlasticType !== undefined) {
      parcel.currentPlasticType = params.currentPlasticType || undefined;
    }
    if (params.currentMetersCovered !== undefined) {
      parcel.currentMetersCovered = params.currentMetersCovered;
    }
    parcel.lastAuditedAt = new Date().toISOString();
    parcel.lastAuditedBy = params.currentUser.name;
    parcel.updatedAt = new Date().toISOString();

    // Update current confirmed status in coverage history
    if (parcel.coverageHistory.length > 0) {
      const lastCoverage = parcel.coverageHistory[parcel.coverageHistory.length - 1];
      if (params.situation === 'Coberta') {
        lastCoverage.isCurrentConfirmed = true;
        lastCoverage.status = 'Instalado Atualmente';
      } else if (params.situation === 'Descoberta') {
        lastCoverage.isCurrentConfirmed = false;
        lastCoverage.status = 'Removido';
      }
    }

    saveToStorage(STORAGE_KEYS.PARCELS, parcels);

    this.addAuditLog({
      action: 'Confirmação de Situação de Parcela',
      category: 'CADASTRO',
      details: `Parcela ${parcel.parcelCode}: Plástico "${previousSituation}" -> "${params.situation}" | Estrutura "${previousStructure}" -> "${parcel.structureStatus || 'Pendente de confirmação'}" por ${params.currentUser.name}. ${params.notes || ''}`,
      user: params.currentUser
    });

    return { success: true, message: `Situação da Parcela ${parcel.parcelCode} atualizada com sucesso.` };
  }

  // Adicionar novo evento de cobertura à parcela
  static addCoverageToParcel(params: {
    parcelId: string;
    coverageDate: string;
    plasticType: string;
    plasticId?: string;
    metersInstalled: number;
    isCurrentConfirmed: boolean;
    responsible: string;
    notes?: string;
    currentUser: UserProfile;
  }): { success: boolean; message: string } {
    const parcels = this.getParcels();
    const parcel = parcels.find(p => p.id === params.parcelId);
    if (!parcel) return { success: false, message: 'Parcela não encontrada.' };

    const newCoverage: CoverageRecord = {
      id: `cov-${Date.now()}`,
      coverageDate: params.coverageDate,
      plasticType: params.plasticType,
      plasticId: params.plasticId,
      metersInstalled: params.metersInstalled,
      status: params.isCurrentConfirmed ? 'Instalado Atualmente' : 'A Confirmar',
      isCurrentConfirmed: params.isCurrentConfirmed,
      responsible: params.responsible,
      notes: params.notes,
      registeredAt: new Date().toISOString(),
      registeredBy: params.currentUser.name
    };

    if (!parcel.coverageHistory) parcel.coverageHistory = [];

    // If marked as currently installed, update previous active ones to Substituted
    if (params.isCurrentConfirmed) {
      parcel.coverageHistory.forEach(c => {
        if (c.status === 'Instalado Atualmente') {
          c.status = 'Substituído';
          c.isCurrentConfirmed = false;
        }
      });
      parcel.situation = 'Coberta';
      parcel.currentPlasticType = params.plasticType;
      parcel.currentPlasticId = params.plasticId;
      parcel.currentMetersCovered = params.metersInstalled;
    }

    parcel.coverageHistory.push(newCoverage);
    parcel.updatedAt = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.PARCELS, parcels);

    this.addAuditLog({
      action: 'Registro de Cobertura em Parcela',
      category: 'INSTALACAO',
      details: `Nova cobertura registrada na Parcela ${parcel.parcelCode}: ${params.metersInstalled}m de "${params.plasticType}". Responsável: ${params.responsible}.`,
      user: params.currentUser
    });

    return { success: true, message: 'Cobertura adicionada com sucesso ao histórico da parcela!' };
  }

  // --- IMPORTAÇÃO EM LOTE COM ETAPA DE CONFERÊNCIA ---
  static importOfficialParcels(newParcels: Parcel[], currentUser: UserProfile): { success: boolean; message: string; count: number } {
    const existingParcels = this.getParcels();
    
    // We append and preserve all records without automatically deleting any duplicates
    newParcels.forEach(np => {
      // Check if parcel code exists with same/different variety
      const matches = existingParcels.filter(
        ep => ep.farmCode === np.farmCode && ep.parcelCode.trim().toLowerCase() === np.parcelCode.trim().toLowerCase()
      );

      if (matches.length > 0) {
        np.hasDuplicateFlag = true;
        np.duplicateNotes = `Sinalização de duplicidade: Já existem ${matches.length} registro(s) para a Parcela ${np.parcelCode} nesta fazenda (variedades: ${matches.map(m => m.variety).join(', ')}). Ambos foram preservados para conferência.`;
      }
      existingParcels.push(np);
    });

    saveToStorage(STORAGE_KEYS.PARCELS, existingParcels);

    this.addAuditLog({
      action: 'Importação Oficial de Plásticos',
      category: 'IMPORTACAO',
      details: `Importados ${newParcels.length} registros oficiais a partir de "PLASTICULTURA - FAZENDAS - OFICIAL DATAS". Registros duplicados preservados e sinalizados para conferência.`,
      user: currentUser
    });

    return { 
      success: true, 
      message: `${newParcels.length} parcelas importadas com sucesso! Registros com divergência de variedade foram preservados e sinalizados.`,
      count: newParcels.length
    };
  }

  // --- PLASTICS ---
  static getPlastics(): PlasticMaterial[] {
    return getFromStorage(STORAGE_KEYS.PLASTICS, INITIAL_PLASTICS);
  }

  static savePlastic(plastic: PlasticMaterial, currentUser: UserProfile): void {
    const list = this.getPlastics();
    const index = list.findIndex(p => p.id === plastic.id);
    const isNew = index < 0;
    if (isNew) list.push(plastic);
    else list[index] = plastic;
    saveToStorage(STORAGE_KEYS.PLASTICS, list);

    this.addAuditLog({
      action: isNew ? 'Cadastro de Plástico' : 'Edição de Plástico',
      category: 'CADASTRO',
      details: `Material plástico "${plastic.name}" (${plastic.thicknessMicrons}µm) ${isNew ? 'cadastrado' : 'atualizado'}.`,
      user: currentUser
    });
  }

  // --- STOCK & MOVEMENTS ---
  static getStock(): StockItem[] {
    return getFromStorage(STORAGE_KEYS.STOCK, INITIAL_STOCK);
  }

  static getMovements(): StockMovement[] {
    return getFromStorage(STORAGE_KEYS.MOVEMENTS, INITIAL_MOVEMENTS);
  }

  static addStockEntry(params: {
    farmId: string;
    plasticId: string;
    batchNumber: string;
    condition: StockCondition;
    meters: number;
    costPerMeter: number;
    reason: string;
    notes?: string;
    originDetails?: string;
    currentUser: UserProfile;
  }): { success: boolean; message: string } {
    if (params.meters <= 0) {
      return { success: false, message: 'Quantidade em metros deve ser maior que zero.' };
    }

    const stock = this.getStock();
    const cleanBatch = params.batchNumber.trim().toUpperCase();

    let existingItem = stock.find(
      s => s.farmId === params.farmId && 
           s.plasticId === params.plasticId && 
           s.batchNumber.toUpperCase() === cleanBatch && 
           s.condition === params.condition
    );

    const now = new Date().toISOString();

    if (existingItem) {
      existingItem.metersAvailable += params.meters;
      existingItem.lastUpdated = now;
      existingItem.costPerMeter = params.costPerMeter;
    } else {
      existingItem = {
        id: `stk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        farmId: params.farmId,
        plasticId: params.plasticId,
        batchNumber: cleanBatch,
        condition: params.condition,
        metersAvailable: params.meters,
        costPerMeter: params.costPerMeter,
        originDetails: params.originDetails || (params.condition === 'NOVO' ? 'Entrada / Compra' : 'Reaproveitamento de campo'),
        lastUpdated: now
      };
      stock.push(existingItem);
    }

    saveToStorage(STORAGE_KEYS.STOCK, stock);

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      type: 'ENTRADA',
      farmId: params.farmId,
      plasticId: params.plasticId,
      batchNumber: cleanBatch,
      condition: params.condition,
      meters: params.meters,
      costPerMeter: params.costPerMeter,
      totalCost: params.meters * params.costPerMeter,
      reason: params.reason || 'Entrada manual em estoque',
      notes: params.notes,
      operatorId: params.currentUser.id,
      operatorName: params.currentUser.name,
      operatorRole: params.currentUser.role,
      timestamp: now
    };

    const movements = this.getMovements();
    movements.unshift(movement);
    saveToStorage(STORAGE_KEYS.MOVEMENTS, movements);

    this.addAuditLog({
      action: 'Entrada de Estoque',
      category: 'ESTOQUE',
      details: `Entrada de ${params.meters.toLocaleString('pt-BR')}m de plástico (${params.condition}) - Lote ${cleanBatch}.`,
      user: params.currentUser
    });

    return { success: true, message: 'Entrada registrada com sucesso no estoque!' };
  }

  static addStockExit(params: {
    stockItemId: string;
    meters: number;
    reason: string;
    notes?: string;
    currentUser: UserProfile;
  }): { success: boolean; message: string } {
    const stock = this.getStock();
    const item = stock.find(s => s.id === params.stockItemId);

    if (!item) return { success: false, message: 'Item de estoque não encontrado.' };
    if (params.meters <= 0) return { success: false, message: 'Quantidade deve ser maior que zero.' };

    if (item.metersAvailable < params.meters) {
      return { 
        success: false, 
        message: `Saldo insuficiente! Disponível: ${item.metersAvailable.toLocaleString('pt-BR')}m. Saldo negativo não é permitido.` 
      };
    }

    item.metersAvailable -= params.meters;
    item.lastUpdated = new Date().toISOString();
    saveToStorage(STORAGE_KEYS.STOCK, stock);

    const movement: StockMovement = {
      id: `mov-${Date.now()}`,
      type: 'SAIDA_AVULSA',
      farmId: item.farmId,
      plasticId: item.plasticId,
      batchNumber: item.batchNumber,
      condition: item.condition,
      meters: params.meters,
      costPerMeter: item.costPerMeter,
      totalCost: params.meters * item.costPerMeter,
      reason: params.reason || 'Baixa operacional de estoque',
      notes: params.notes,
      operatorId: params.currentUser.id,
      operatorName: params.currentUser.name,
      operatorRole: params.currentUser.role,
      timestamp: item.lastUpdated
    };

    const movements = this.getMovements();
    movements.unshift(movement);
    saveToStorage(STORAGE_KEYS.MOVEMENTS, movements);

    this.addAuditLog({
      action: 'Baixa de Estoque',
      category: 'ESTOQUE',
      details: `Baixa de ${params.meters.toLocaleString('pt-BR')}m do Lote ${item.batchNumber}. Motivo: ${params.reason}`,
      user: params.currentUser
    });

    return { success: true, message: 'Saída de estoque registrada com sucesso!' };
  }

  static transferStock(params: {
    sourceStockItemId: string;
    destinationFarmId: string;
    meters: number;
    reason: string;
    notes?: string;
    currentUser: UserProfile;
  }): { success: boolean; message: string } {
    const stock = this.getStock();
    const sourceItem = stock.find(s => s.id === params.sourceStockItemId);

    if (!sourceItem) return { success: false, message: 'Item de origem não encontrado.' };
    if (sourceItem.farmId === params.destinationFarmId) return { success: false, message: 'Destino não pode ser igual à origem.' };
    if (params.meters <= 0) return { success: false, message: 'Quantidade deve ser maior que zero.' };

    if (sourceItem.metersAvailable < params.meters) {
      return { 
        success: false, 
        message: `Saldo insuficiente na fazenda de origem! Disponível: ${sourceItem.metersAvailable.toLocaleString('pt-BR')}m.` 
      };
    }

    const now = new Date().toISOString();

    sourceItem.metersAvailable -= params.meters;
    sourceItem.lastUpdated = now;

    let destItem = stock.find(
      s => s.farmId === params.destinationFarmId &&
           s.plasticId === sourceItem.plasticId &&
           s.batchNumber.toUpperCase() === sourceItem.batchNumber.toUpperCase() &&
           s.condition === sourceItem.condition
    );

    if (destItem) {
      destItem.metersAvailable += params.meters;
      destItem.lastUpdated = now;
    } else {
      destItem = {
        id: `stk-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
        farmId: params.destinationFarmId,
        plasticId: sourceItem.plasticId,
        batchNumber: sourceItem.batchNumber,
        condition: sourceItem.condition,
        metersAvailable: params.meters,
        costPerMeter: sourceItem.costPerMeter,
        originDetails: `Transferido da Fazenda ID: ${sourceItem.farmId}`,
        lastUpdated: now
      };
      stock.push(destItem);
    }

    saveToStorage(STORAGE_KEYS.STOCK, stock);

    const movements = this.getMovements();
    const totalCost = params.meters * sourceItem.costPerMeter;

    const outMovement: StockMovement = {
      id: `mov-trans-out-${Date.now()}`,
      type: 'TRANSFERENCIA_SAIDA',
      farmId: sourceItem.farmId,
      destinationFarmId: params.destinationFarmId,
      plasticId: sourceItem.plasticId,
      batchNumber: sourceItem.batchNumber,
      condition: sourceItem.condition,
      meters: params.meters,
      costPerMeter: sourceItem.costPerMeter,
      totalCost,
      reason: `Transferência para fazenda destino. ${params.reason}`,
      notes: params.notes,
      operatorId: params.currentUser.id,
      operatorName: params.currentUser.name,
      operatorRole: params.currentUser.role,
      timestamp: now
    };

    const inMovement: StockMovement = {
      id: `mov-trans-in-${Date.now() + 1}`,
      type: 'TRANSFERENCIA_ENTRADA',
      farmId: params.destinationFarmId,
      originFarmId: sourceItem.farmId,
      plasticId: sourceItem.plasticId,
      batchNumber: sourceItem.batchNumber,
      condition: sourceItem.condition,
      meters: params.meters,
      costPerMeter: sourceItem.costPerMeter,
      totalCost,
      reason: `Transferência recebida da fazenda origem. ${params.reason}`,
      notes: params.notes,
      operatorId: params.currentUser.id,
      operatorName: params.currentUser.name,
      operatorRole: params.currentUser.role,
      timestamp: now
    };

    movements.unshift(outMovement, inMovement);
    saveToStorage(STORAGE_KEYS.MOVEMENTS, movements);

    this.addAuditLog({
      action: 'Transferência entre Fazendas',
      category: 'TRANSFERENCIA',
      details: `Transferência de ${params.meters.toLocaleString('pt-BR')}m do Lote ${sourceItem.batchNumber}. Origem: ${sourceItem.farmId} -> Destino: ${params.destinationFarmId}.`,
      user: params.currentUser
    });

    return { success: true, message: 'Transferência entre fazendas concluída com sucesso!' };
  }

  // --- INSTALLATIONS & SUBSTITUTIONS ---
  static getInstallations(): PlasticInstallation[] {
    return getFromStorage(STORAGE_KEYS.INSTALLATIONS, INITIAL_INSTALLATIONS);
  }

  static registerInstallation(params: {
    farmId: string;
    sector: string;
    parcelId: string;
    stockItemId: string;
    metersInstalled: number;
    installationDate: string;
    responsibleName: string;
    isSubstitution?: boolean;
    notes?: string;
    currentUser: UserProfile;
  }): { success: boolean; message: string; installation?: PlasticInstallation } {
    const stock = this.getStock();
    const stockItem = stock.find(s => s.id === params.stockItemId);

    if (!stockItem) return { success: false, message: 'Lote de estoque não encontrado.' };
    if (stockItem.farmId !== params.farmId) return { success: false, message: 'O plástico selecionado não pertence ao estoque desta fazenda.' };
    if (params.metersInstalled <= 0) return { success: false, message: 'Metragem deve ser superior a zero.' };

    if (stockItem.metersAvailable < params.metersInstalled) {
      return { 
        success: false, 
        message: `Saldo insuficiente! Disponível: ${stockItem.metersAvailable.toLocaleString('pt-BR')}m. Impossível prosseguir sem saldo.` 
      };
    }

    const parcels = this.getParcels();
    const parcel = parcels.find(p => p.id === params.parcelId);
    if (!parcel) return { success: false, message: 'Parcela não encontrada.' };

    const plastics = this.getPlastics();
    const plastic = plastics.find(p => p.id === stockItem.plasticId);

    const now = new Date().toISOString();

    // 1. Deduct from stock
    stockItem.metersAvailable -= params.metersInstalled;
    stockItem.lastUpdated = now;
    saveToStorage(STORAGE_KEYS.STOCK, stock);

    // 2. If it's a substitution, mark previous active installations on this parcel as substituted
    const installations = this.getInstallations();
    let substitutedPlasticName = '';
    if (params.isSubstitution) {
      installations.forEach(inst => {
        if (inst.parcelId === params.parcelId && inst.status === 'ATIVO') {
          inst.status = 'SUBSTITUIDO';
          substitutedPlasticName = inst.plasticName;
        }
      });
    }

    // 3. Create installation
    const installationId = `inst-${Date.now()}`;
    const totalCost = params.metersInstalled * stockItem.costPerMeter;

    const newInstallation: PlasticInstallation = {
      id: installationId,
      farmId: params.farmId,
      sector: params.sector,
      parcelId: params.parcelId,
      parcelCode: parcel.parcelCode,
      plasticId: stockItem.plasticId,
      plasticName: plastic?.name || stockItem.plasticId,
      batchNumber: stockItem.batchNumber,
      conditionUsed: stockItem.condition,
      metersInstalled: params.metersInstalled,
      costPerMeter: stockItem.costPerMeter,
      totalCost,
      installationDate: params.installationDate,
      responsibleName: params.responsibleName,
      isSubstitution: params.isSubstitution,
      substitutedPlasticName,
      status: 'ATIVO',
      metersActiveRemaining: params.metersInstalled,
      notes: params.notes,
      registeredBy: params.currentUser.name,
      registeredRole: params.currentUser.role,
      createdAt: now
    };

    installations.unshift(newInstallation);
    saveToStorage(STORAGE_KEYS.INSTALLATIONS, installations);

    // 4. Update Parcel situation and coverage history
    parcel.situation = 'Coberta';
    parcel.currentPlasticType = plastic?.name;
    parcel.currentPlasticId = plastic?.id;
    parcel.currentMetersCovered = params.metersInstalled;
    
    if (!parcel.coverageHistory) parcel.coverageHistory = [];
    if (params.isSubstitution) {
      parcel.coverageHistory.forEach(c => {
        if (c.status === 'Instalado Atualmente') {
          c.status = 'Substituído';
          c.isCurrentConfirmed = false;
        }
      });
    }

    parcel.coverageHistory.push({
      id: `cov-${Date.now()}`,
      coverageDate: params.installationDate,
      plasticType: plastic?.name || stockItem.plasticId,
      plasticId: stockItem.plasticId,
      metersInstalled: params.metersInstalled,
      status: 'Instalado Atualmente',
      isCurrentConfirmed: true,
      responsible: params.responsibleName,
      notes: params.notes,
      registeredAt: now,
      registeredBy: params.currentUser.name
    });

    saveToStorage(STORAGE_KEYS.PARCELS, parcels);

    // 5. Create Movement
    const movement: StockMovement = {
      id: `mov-inst-${Date.now()}`,
      type: params.isSubstitution ? 'SUBSTITUICAO' : 'INSTALACAO',
      farmId: params.farmId,
      plasticId: stockItem.plasticId,
      batchNumber: stockItem.batchNumber,
      condition: stockItem.condition,
      meters: params.metersInstalled,
      costPerMeter: stockItem.costPerMeter,
      totalCost,
      parcelId: params.parcelId,
      reason: params.isSubstitution ? `Substituição de cobertura na Parcela ${parcel.parcelCode}` : `Instalação na Parcela ${parcel.parcelCode}`,
      notes: params.notes,
      operatorId: params.currentUser.id,
      operatorName: params.currentUser.name,
      operatorRole: params.currentUser.role,
      timestamp: now
    };

    const movements = this.getMovements();
    movements.unshift(movement);
    saveToStorage(STORAGE_KEYS.MOVEMENTS, movements);

    this.addAuditLog({
      action: params.isSubstitution ? 'Substituição de Plástico' : 'Instalação de Plástico',
      category: params.isSubstitution ? 'SUBSTITUICAO' : 'INSTALACAO',
      details: `${params.isSubstitution ? 'Substituído por' : 'Instalados'} ${params.metersInstalled.toLocaleString('pt-BR')}m de plástico na Parcela ${parcel.parcelCode} (${parcel.farmName}). Custo: R$ ${totalCost.toFixed(2)}.`,
      user: params.currentUser
    });

    return { 
      success: true, 
      message: `Instalação registrada com sucesso! ${params.metersInstalled.toLocaleString('pt-BR')}m deduzidos do estoque.`,
      installation: newInstallation
    };
  }

  // --- REMOVALS & REUSE ---
  static getRemovals(): PlasticRemoval[] {
    return getFromStorage(STORAGE_KEYS.REMOVALS, INITIAL_REMOVALS);
  }

  static registerRemoval(params: {
    installationId?: string;
    farmId: string;
    parcelId: string;
    plasticId: string;
    totalMetersRemoved: number;
    reusableMeters: number;
    discardedMeters: number;
    removalDate: string;
    reason: any;
    responsibleName: string;
    notes?: string;
    currentUser: UserProfile;
  }): { success: boolean; message: string } {
    if (params.totalMetersRemoved <= 0) return { success: false, message: 'Metragem deve ser superior a zero.' };

    if (params.reusableMeters + params.discardedMeters !== params.totalMetersRemoved) {
      return { 
        success: false, 
        message: 'A soma dos metros reaproveitáveis e descartados deve ser exatamente igual ao total retirado!' 
      };
    }

    const plastics = this.getPlastics();
    const plastic = plastics.find(p => p.id === params.plasticId);
    const standardCostPerMeter = plastic ? plastic.pricePerMeter : 4.80;
    const reusableUnitValue = Number((standardCostPerMeter * 0.55).toFixed(2));
    const discardedUnitValue = standardCostPerMeter;

    const reusableTotalValue = Number((params.reusableMeters * reusableUnitValue).toFixed(2));
    const discardedTotalValue = Number((params.discardedMeters * discardedUnitValue).toFixed(2));

    const now = new Date().toISOString();
    const generatedBatch = `REUT-${new Date().getFullYear()}-${Math.floor(100 + Math.random() * 900)}`;

    const parcels = this.getParcels();
    const parcel = parcels.find(p => p.id === params.parcelId);

    // 1. Update installation if linked
    if (params.installationId) {
      const installations = this.getInstallations();
      const inst = installations.find(i => i.id === params.installationId);
      if (inst) {
        inst.metersActiveRemaining = Math.max(0, inst.metersActiveRemaining - params.totalMetersRemoved);
        if (inst.metersActiveRemaining === 0) {
          inst.status = 'CONCLUIDO_RETIRADO';
        }
        saveToStorage(STORAGE_KEYS.INSTALLATIONS, installations);
      }
    }

    // 2. Update parcel situation if full removal
    if (parcel) {
      if (parcel.currentMetersCovered) {
        parcel.currentMetersCovered = Math.max(0, parcel.currentMetersCovered - params.totalMetersRemoved);
      }
      if (!parcel.currentMetersCovered || parcel.currentMetersCovered === 0) {
        parcel.situation = 'Descoberta';
      }
      if (parcel.coverageHistory) {
        const last = parcel.coverageHistory[parcel.coverageHistory.length - 1];
        if (last && parcel.situation === 'Descoberta') {
          last.status = 'Removido';
          last.isCurrentConfirmed = false;
        }
      }
      saveToStorage(STORAGE_KEYS.PARCELS, parcels);
    }

    // 3. Return Reusable plastic to Stock as 'REUTILIZADO'
    if (params.reusableMeters > 0) {
      const stock = this.getStock();
      const parcelName = parcel ? `${parcel.parcelCode} - ${parcel.variety}` : `Parcela ${params.parcelId}`;

      const newReusedItem: StockItem = {
        id: `stk-reut-${Date.now()}`,
        farmId: params.farmId,
        plasticId: params.plasticId,
        batchNumber: generatedBatch,
        condition: 'REUTILIZADO',
        metersAvailable: params.reusableMeters,
        costPerMeter: reusableUnitValue,
        originDetails: `Retirado da ${parcelName} (${params.reason}). Higienizado e apto para reuso.`,
        lastUpdated: now
      };
      stock.push(newReusedItem);
      saveToStorage(STORAGE_KEYS.STOCK, stock);

      const movReuse: StockMovement = {
        id: `mov-reut-${Date.now()}`,
        type: 'RETIRADA_REAPROVEITADO',
        farmId: params.farmId,
        plasticId: params.plasticId,
        batchNumber: generatedBatch,
        condition: 'REUTILIZADO',
        meters: params.reusableMeters,
        costPerMeter: reusableUnitValue,
        totalCost: reusableTotalValue,
        parcelId: params.parcelId,
        reason: `Reaproveitamento de material: ${params.reason}`,
        notes: `Retornado ao estoque como Lote Reutilizado ${generatedBatch}`,
        operatorId: params.currentUser.id,
        operatorName: params.currentUser.name,
        operatorRole: params.currentUser.role,
        timestamp: now
      };
      const movements = this.getMovements();
      movements.unshift(movReuse);
      saveToStorage(STORAGE_KEYS.MOVEMENTS, movements);
    }

    // 4. Movement for Discarded
    if (params.discardedMeters > 0) {
      const movDiscard: StockMovement = {
        id: `mov-disc-${Date.now() + 2}`,
        type: 'RETIRADA_DESCARTE',
        farmId: params.farmId,
        plasticId: params.plasticId,
        batchNumber: 'PERDA-DESCARTE',
        condition: 'NOVO',
        meters: params.discardedMeters,
        costPerMeter: discardedUnitValue,
        totalCost: discardedTotalValue,
        parcelId: params.parcelId,
        reason: `Descarte definitivo: ${params.reason}`,
        notes: params.notes,
        operatorId: params.currentUser.id,
        operatorName: params.currentUser.name,
        operatorRole: params.currentUser.role,
        timestamp: now
      };
      const movements = this.getMovements();
      movements.unshift(movDiscard);
      saveToStorage(STORAGE_KEYS.MOVEMENTS, movements);
    }

    const removalId = `rem-${Date.now()}`;
    const newRemoval: PlasticRemoval = {
      id: removalId,
      installationId: params.installationId,
      farmId: params.farmId,
      parcelId: params.parcelId,
      plasticId: params.plasticId,
      plasticName: plastic?.name || params.plasticId,
      removalDate: params.removalDate,
      totalMetersRemoved: params.totalMetersRemoved,
      reusableMeters: params.reusableMeters,
      discardedMeters: params.discardedMeters,
      reusableValue: reusableTotalValue,
      discardedValue: discardedTotalValue,
      generatedBatchNumber: generatedBatch,
      reason: params.reason,
      responsibleName: params.responsibleName,
      notes: params.notes,
      registeredBy: params.currentUser.name,
      registeredRole: params.currentUser.role,
      createdAt: now
    };

    const removals = this.getRemovals();
    removals.unshift(newRemoval);
    saveToStorage(STORAGE_KEYS.REMOVALS, removals);

    this.addAuditLog({
      action: 'Retirada e Reutilização',
      category: 'RETIRADA',
      details: `Retirados ${params.totalMetersRemoved.toLocaleString('pt-BR')}m da Parcela ${parcel?.parcelCode || params.parcelId}. Reutilizados: ${params.reusableMeters}m (Lote: ${generatedBatch}), Descartados: ${params.discardedMeters}m.`,
      user: params.currentUser
    });

    return { 
      success: true, 
      message: `Retirada registrada! ${params.reusableMeters.toLocaleString('pt-BR')}m retornaram ao estoque como material reutilizado (Lote: ${generatedBatch}).` 
    };
  }

  // --- AUDIT LOGS ---
  static getAuditLogs(): AuditLog[] {
    return getFromStorage(STORAGE_KEYS.AUDIT, INITIAL_AUDIT_LOGS);
  }

  static addAuditLog(params: {
    action: string;
    category: AuditLog['category'];
    details: string;
    user: UserProfile;
  }): void {
    const logs = this.getAuditLogs();
    const newLog: AuditLog = {
      id: `audit-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      action: params.action,
      category: params.category,
      details: params.details,
      userId: params.user.id,
      userName: params.user.name,
      userRole: params.user.role,
      timestamp: new Date().toISOString()
    };
    logs.unshift(newLog);
    if (logs.length > 500) logs.pop();
    saveToStorage(STORAGE_KEYS.AUDIT, logs);
  }

  // --- HISTÓRICO SERROPLAST ---
  static getSerroplastRecords(): SerroplastRecord[] {
    return getFromStorage(STORAGE_KEYS.SERROPLAST, INITIAL_SERROPLAST_RECORDS);
  }

  static saveSerroplastRecord(record: SerroplastRecord, currentUser: UserProfile): void {
    const records = this.getSerroplastRecords();
    const index = records.findIndex(r => r.id === record.id);
    const isNew = index < 0;
    const now = new Date().toISOString();

    if (isNew) {
      record.criadoEm = record.criadoEm || now;
      record.atualizadoEm = now;
      records.push(record);
    } else {
      record.atualizadoEm = now;
      records[index] = record;
    }

    saveToStorage(STORAGE_KEYS.SERROPLAST, records);

    this.addAuditLog({
      action: isNew ? 'Novo Registro Serroplast' : 'Edição Serroplast',
      category: 'CADASTRO',
      details: `Registro Serroplast [${record.sigla}] Parcela ${record.parcela} (${record.variedade}, ${record.areaHa} ha) ${isNew ? 'criado' : 'atualizado'} por ${currentUser.name}.`,
      user: currentUser
    });
  }

  static toggleSerroplastStatus(params: {
    id: string;
    ativo: boolean;
    motivo?: string;
    currentUser: UserProfile;
  }): { success: boolean; message: string } {
    const records = this.getSerroplastRecords();
    const record = records.find(r => r.id === params.id);
    if (!record) return { success: false, message: 'Registro não encontrado.' };

    record.ativo = params.ativo;
    record.atualizadoEm = new Date().toISOString();
    if (!params.ativo) {
      record.motivoInativacao = params.motivo || 'Inativado pelo usuário';
      record.inativadoEm = new Date().toISOString();
    } else {
      record.motivoInativacao = undefined;
      record.inativadoEm = undefined;
    }

    saveToStorage(STORAGE_KEYS.SERROPLAST, records);

    this.addAuditLog({
      action: params.ativo ? 'Reativação de Registro Serroplast' : 'Inativação de Registro Serroplast',
      category: 'CADASTRO',
      details: `Registro Serroplast [${record.sigla}] Parcela ${record.parcela} ${params.ativo ? 'reativado' : 'inativado'}. Motivo: ${params.motivo || 'N/A'}.`,
      user: params.currentUser
    });

    return { 
      success: true, 
      message: `Registro [${record.sigla} - Parcela ${record.parcela}] ${params.ativo ? 'reativado' : 'inativado'} com sucesso (histórico preservado)!` 
    };
  }

  static importSerroplastBatch(incomingRecords: SerroplastRecord[], currentUser: UserProfile): { 
    success: boolean; 
    addedCount: number; 
    updatedCount: number; 
    total: number;
    message: string;
  } {
    const existing = this.getSerroplastRecords();
    let addedCount = 0;
    let updatedCount = 0;

    incomingRecords.forEach(inc => {
      // Key for duplicate check: sigla + setorInterno + parcela + variedade
      const matchIndex = existing.findIndex(
        e => e.sigla.toUpperCase() === inc.sigla.toUpperCase() &&
             e.setorInterno.trim().toUpperCase() === inc.setorInterno.trim().toUpperCase() &&
             e.parcela.trim().toUpperCase() === inc.parcela.trim().toUpperCase() &&
             e.variedade.trim().toUpperCase() === inc.variedade.trim().toUpperCase()
      );

      if (matchIndex >= 0) {
        existing[matchIndex] = {
          ...inc,
          id: existing[matchIndex].id,
          ativo: existing[matchIndex].ativo,
          motivoInativacao: existing[matchIndex].motivoInativacao,
          inativadoEm: existing[matchIndex].inativadoEm,
          atualizadoEm: new Date().toISOString()
        };
        updatedCount++;
      } else {
        existing.push({
          ...inc,
          id: inc.id || `serro-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`,
          criadoEm: new Date().toISOString(),
          atualizadoEm: new Date().toISOString()
        });
        addedCount++;
      }
    });

    saveToStorage(STORAGE_KEYS.SERROPLAST, existing);

    this.addAuditLog({
      action: 'Importação Lote Serroplast',
      category: 'IMPORTACAO',
      details: `Importação de registros Serroplast realizada por ${currentUser.name}: ${addedCount} novos, ${updatedCount} atualizados. Total ativo no banco: ${existing.length}.`,
      user: currentUser
    });

    return {
      success: true,
      addedCount,
      updatedCount,
      total: existing.length,
      message: `Importação concluída! ${addedCount} novos registros inseridos, ${updatedCount} já existentes sincronizados.`
    };
  }

  // --- ATIVIDADES DE PLASTICULTURA ---
  static getActivities(): PlasticultureActivity[] {
    return getFromStorage(STORAGE_KEYS.ACTIVITIES, INITIAL_ACTIVITIES);
  }

  static saveActivity(activity: PlasticultureActivity, currentUser: UserProfile): { success: boolean; message: string } {
    const activities = this.getActivities();
    const index = activities.findIndex(a => a.id === activity.id);
    const isNew = index < 0;
    const now = new Date().toISOString();

    if (isNew) {
      const creationEntry: ActivityHistoryEntry = {
        id: `acth-${Date.now()}-c`,
        timestamp: now,
        action: 'Criação',
        userName: currentUser.name,
        userRole: currentUser.role,
        newStatus: activity.status,
        summary: `Atividade cadastrada: ${activity.activityType} em ${activity.farmName} (${activity.sector} • ${activity.parcelCode}) - ${activity.hoursWorked}h com ${activity.peopleCount} pessoa(s).`
      };
      const record: PlasticultureActivity = {
        ...activity,
        createdBy: activity.createdBy || currentUser.name,
        createdAt: activity.createdAt || now,
        updatedAt: now,
        history: activity.history && activity.history.length > 0 ? activity.history : [creationEntry]
      };
      activities.unshift(record);
    } else {
      const prev = activities[index];
      const changes: string[] = [];
      if (prev.status !== activity.status) changes.push(`Status: ${prev.status} → ${activity.status}`);
      if (prev.farmCode !== activity.farmCode || prev.sector !== activity.sector || prev.parcelCode !== activity.parcelCode) {
        changes.push(`Local: ${activity.farmCode}/${activity.sector}/${activity.parcelCode}`);
      }
      if (prev.executionDate !== activity.executionDate) changes.push(`Data: ${activity.executionDate}`);
      if (prev.activityType !== activity.activityType) changes.push(`Tipo: ${activity.activityType}`);
      if (prev.supervisor !== activity.supervisor) changes.push(`Responsável: ${activity.supervisor}`);
      if (prev.teamName !== activity.teamName || prev.peopleCount !== activity.peopleCount) {
        changes.push(`Equipe: ${activity.teamName} (${activity.peopleCount} pessoas)`);
      }
      if (prev.hoursWorked !== activity.hoursWorked) changes.push(`Horas: ${prev.hoursWorked}h → ${activity.hoursWorked}h`);
      if (prev.serviceDescription !== activity.serviceDescription) changes.push('Descrição atualizada');
      if ((prev.observations || '') !== (activity.observations || '')) changes.push('Observações atualizadas');

      const editEntry: ActivityHistoryEntry = {
        id: `acth-${Date.now()}-e`,
        timestamp: now,
        action: prev.status !== activity.status && changes.length === 1 ? 'Alteração de Status' : 'Edição',
        userName: currentUser.name,
        userRole: currentUser.role,
        previousStatus: prev.status,
        newStatus: activity.status,
        summary: changes.length > 0 ? changes.join(' · ') : 'Registro revisado e salvo sem alterações de valores.'
      };

      activities[index] = {
        ...activity,
        createdBy: prev.createdBy,
        createdAt: prev.createdAt,
        updatedAt: now,
        history: [...(prev.history || []), editEntry]
      };
    }

    saveToStorage(STORAGE_KEYS.ACTIVITIES, activities);

    this.addAuditLog({
      action: isNew ? 'Cadastro de Atividade' : 'Edição de Atividade',
      category: 'ATIVIDADES',
      details: `[${activity.farmCode}] ${activity.activityType} • ${activity.sector} (${activity.parcelCode}) - Responsável: ${activity.supervisor} - Status: ${activity.status} (${activity.hoursWorked}h).`,
      user: currentUser
    });

    return {
      success: true,
      message: isNew ? 'Atividade cadastrada e salva com sucesso!' : 'Atividade atualizada e histórico registrado!'
    };
  }

  static updateActivityStatus(params: {
    activityId: string;
    status: ActivityStatus;
    notes?: string;
    currentUser: UserProfile;
  }): { success: boolean; message: string } {
    const activities = this.getActivities();
    const index = activities.findIndex(a => a.id === params.activityId);
    if (index < 0) return { success: false, message: 'Atividade não encontrada.' };

    const prev = activities[index];
    if (prev.status === params.status && !params.notes) {
      return { success: true, message: 'Status mantido sem alterações.' };
    }

    const now = new Date().toISOString();
    const historyEntry: ActivityHistoryEntry = {
      id: `acth-${Date.now()}-s`,
      timestamp: now,
      action: 'Alteração de Status',
      userName: params.currentUser.name,
      userRole: params.currentUser.role,
      previousStatus: prev.status,
      newStatus: params.status,
      summary: `Status alterado de "${prev.status}" para "${params.status}"${params.notes ? ` — Obs: ${params.notes}` : ''}.`
    };

    activities[index] = {
      ...prev,
      status: params.status,
      observations: params.notes ? (prev.observations ? `${prev.observations}\n[${new Date().toLocaleDateString('pt-BR')}] ${params.notes}` : params.notes) : prev.observations,
      updatedAt: now,
      history: [...(prev.history || []), historyEntry]
    };

    saveToStorage(STORAGE_KEYS.ACTIVITIES, activities);

    this.addAuditLog({
      action: 'Alteração de Status de Atividade',
      category: 'ATIVIDADES',
      details: `[${prev.farmCode}] ${prev.activityType} (${prev.parcelCode}): "${prev.status}" → "${params.status}" por ${params.currentUser.name}.`,
      user: params.currentUser
    });

    return {
      success: true,
      message: `Status da atividade atualizado para "${params.status}".`
    };
  }

  static deleteActivity(activityId: string, currentUser: UserProfile): { success: boolean; message: string } {
    const activities = this.getActivities();
    const target = activities.find(a => a.id === activityId);
    if (!target) return { success: false, message: 'Atividade não encontrada.' };

    const remaining = activities.filter(a => a.id !== activityId);
    saveToStorage(STORAGE_KEYS.ACTIVITIES, remaining);

    this.addAuditLog({
      action: 'Exclusão de Atividade',
      category: 'ATIVIDADES',
      details: `[${target.farmCode}] ${target.activityType} • ${target.sector} (${target.parcelCode}) - Data: ${target.executionDate} - Responsável: ${target.supervisor} excluída por ${currentUser.name}.`,
      user: currentUser
    });

    return {
      success: true,
      message: `Atividade "${target.activityType}" (${target.parcelCode}) excluída permanentemente.`
    };
  }

  // --- TIPOS DE ATIVIDADES (EDITÁVEL E PERSISTENTE) ---
  static getActivityTypes(): ActivityTypeItem[] {
    return getFromStorage(STORAGE_KEYS.ACTIVITY_TYPES, INITIAL_ACTIVITY_TYPES);
  }

  static saveActivityType(params: {
    id?: string;
    name: string;
    active?: boolean;
    currentUser: UserProfile;
  }): { success: boolean; message: string; item?: ActivityTypeItem } {
    const cleanName = params.name.trim();
    if (!cleanName) {
      return { success: false, message: 'Informe o nome do tipo de atividade.' };
    }

    const types = this.getActivityTypes();
    const duplicate = types.find(
      t => t.id !== params.id && t.name.trim().toLowerCase() === cleanName.toLowerCase()
    );
    if (duplicate) {
      if (!duplicate.active && params.active !== false) {
        duplicate.active = true;
        duplicate.updatedAt = new Date().toISOString();
        saveToStorage(STORAGE_KEYS.ACTIVITY_TYPES, types);
        return { success: true, message: `Tipo "${duplicate.name}" reativado.`, item: duplicate };
      }
      return { success: false, message: `O tipo de atividade "${cleanName}" já está cadastrado.` };
    }

    const now = new Date().toISOString();
    let savedItem: ActivityTypeItem;

    if (params.id) {
      const idx = types.findIndex(t => t.id === params.id);
      if (idx < 0) return { success: false, message: 'Tipo de atividade não encontrado.' };
      const previousName = types[idx].name;
      savedItem = {
        ...types[idx],
        name: cleanName,
        active: params.active !== undefined ? params.active : types[idx].active,
        updatedAt: now
      };
      types[idx] = savedItem;
      saveToStorage(STORAGE_KEYS.ACTIVITY_TYPES, types);

      // Se renomeado, atualizar atividades que usavam o nome antigo para manter consistência
      if (previousName !== cleanName) {
        const activities = this.getActivities();
        let updatedActs = false;
        const synced = activities.map(a => {
          if (a.activityType === previousName) {
            updatedActs = true;
            return { ...a, activityType: cleanName, updatedAt: now };
          }
          return a;
        });
        if (updatedActs) {
          saveToStorage(STORAGE_KEYS.ACTIVITIES, synced);
        }
      }

      this.addAuditLog({
        action: 'Edição de Tipo de Atividade',
        category: 'ATIVIDADES',
        details: `Tipo de atividade "${previousName}" atualizado para "${cleanName}" (${savedItem.active ? 'Ativo' : 'Inativo'}) por ${params.currentUser.name}.`,
        user: params.currentUser
      });

      return { success: true, message: `Tipo "${cleanName}" atualizado com sucesso.`, item: savedItem };
    }

    savedItem = {
      id: `act-type-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`,
      name: cleanName,
      active: params.active !== undefined ? params.active : true,
      isDefault: false,
      createdAt: now,
      updatedAt: now
    };
    types.push(savedItem);
    saveToStorage(STORAGE_KEYS.ACTIVITY_TYPES, types);

    this.addAuditLog({
      action: 'Novo Tipo de Atividade',
      category: 'ATIVIDADES',
      details: `Tipo de atividade "${cleanName}" cadastrado por ${params.currentUser.name}.`,
      user: params.currentUser
    });

    return { success: true, message: `Tipo "${cleanName}" adicionado ao cadastro!`, item: savedItem };
  }

  static deleteActivityType(id: string, currentUser: UserProfile): { success: boolean; message: string } {
    const types = this.getActivityTypes();
    const target = types.find(t => t.id === id);
    if (!target) return { success: false, message: 'Tipo de atividade não encontrado.' };

    const activities = this.getActivities();
    const inUseCount = activities.filter(
      a => a.activityType.trim().toLowerCase() === target.name.trim().toLowerCase()
    ).length;

    if (inUseCount > 0) {
      return {
        success: false,
        message: `Este tipo está vinculado a ${inUseCount} atividade(s). Inative-o para ocultar dos novos cadastros sem perder o histórico.`
      };
    }

    const remaining = types.filter(t => t.id !== id);
    saveToStorage(STORAGE_KEYS.ACTIVITY_TYPES, remaining);

    this.addAuditLog({
      action: 'Exclusão de Tipo de Atividade',
      category: 'ATIVIDADES',
      details: `Tipo de atividade "${target.name}" excluído por ${currentUser.name}.`,
      user: currentUser
    });

    return { success: true, message: `Tipo "${target.name}" excluído com sucesso.` };
  }

  // --- VALOR POR HECTARE COBERTO (PLASTICULTURA) ---
  static getCoveredHectareValue(): number {
    const val = getFromStorage<number>(STORAGE_KEYS.COVERED_HECTARE_VALUE, DEFAULT_COVERED_HECTARE_VALUE);
    return typeof val === 'number' && Number.isFinite(val) && val >= 0
      ? Number(val.toFixed(2))
      : DEFAULT_COVERED_HECTARE_VALUE;
  }

  static saveCoveredHectareValue(value: number, currentUser: UserProfile): { success: boolean; message: string } {
    if (typeof value !== 'number' || !Number.isFinite(value) || value < 0) {
      return { success: false, message: 'Informe um valor financeiro válido por hectare (maior ou igual a zero).' };
    }

    const normalized = Number(value.toFixed(2));
    const previous = this.getCoveredHectareValue();
    saveToStorage(STORAGE_KEYS.COVERED_HECTARE_VALUE, normalized);

    this.addAuditLog({
      action: 'Atualização do Valor por Hectare Coberto',
      category: 'CADASTRO',
      details: `Valor de referência por hectare com plasticultura alterado de R$ ${previous.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} para R$ ${normalized.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/ha por ${currentUser.name}.`,
      user: currentUser
    });

    return {
      success: true,
      message: `Valor por hectare coberto salvo: R$ ${normalized.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}/ha.`
    };
  }

  // --- ATIVIDADES DE PLASTICULTURA (PLANO PARREIRAL 2027) ---
  static getPlasticulturePlanActivities(): PlasticulturePlanActivity[] {
    return getFromStorage(STORAGE_KEYS.PLASTICULTURE_PLAN_ACTIVITIES, INITIAL_PLASTICULTURE_PLAN_ACTIVITIES);
  }

  static savePlasticulturePlanActivity(
    activity: PlasticulturePlanActivity,
    currentUser: UserProfile
  ): { success: boolean; message: string } {
    if (activity.activityType === 'Outras' && !activity.customActivityDescription?.trim()) {
      return {
        success: false,
        message: 'Descreva a atividade manualmente quando selecionar a opção "Outras".'
      };
    }

    const list = this.getPlasticulturePlanActivities();
    const index = list.findIndex(item => item.id === activity.id);
    const isNew = index < 0;
    const now = new Date().toISOString();

    const record: PlasticulturePlanActivity = {
      ...activity,
      customActivityDescription:
        activity.activityType === 'Outras' ? activity.customActivityDescription?.trim() : undefined,
      observations: activity.observations?.trim() || undefined,
      createdBy: isNew ? (activity.createdBy || currentUser.name) : list[index].createdBy,
      createdAt: isNew ? (activity.createdAt || now) : list[index].createdAt,
      updatedAt: now
    };

    if (isNew) {
      list.unshift(record);
    } else {
      list[index] = record;
    }

    saveToStorage(STORAGE_KEYS.PLASTICULTURE_PLAN_ACTIVITIES, list);

    const activityLabel =
      record.activityType === 'Outras' && record.customActivityDescription
        ? `Outras: ${record.customActivityDescription}`
        : record.activityType;

    this.addAuditLog({
      action: isNew ? 'Nova Atividade de Plasticultura' : 'Edição de Atividade de Plasticultura',
      category: 'ATIVIDADES',
      details: `[${record.farmCode}] ${activityLabel} • ${record.sector} / ${record.parcelCode} (${record.variety}) - ${record.areaHa.toLocaleString('pt-BR', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} ha - Status: ${record.status} - Responsável: ${record.responsible}.`,
      user: currentUser
    });

    return {
      success: true,
      message: isNew
        ? 'Atividade de plasticultura cadastrada com sucesso!'
        : 'Atividade de plasticultura atualizada com sucesso!'
    };
  }

  static updatePlasticulturePlanActivityStatus(params: {
    activityId: string;
    status: PlasticulturePlanActivityStatus;
    currentUser: UserProfile;
  }): { success: boolean; message: string } {
    const list = this.getPlasticulturePlanActivities();
    const index = list.findIndex(item => item.id === params.activityId);
    if (index < 0) return { success: false, message: 'Atividade de plasticultura não encontrada.' };

    const prev = list[index];
    if (prev.status === params.status) {
      return { success: true, message: 'Status mantido sem alterações.' };
    }

    const now = new Date().toISOString();
    list[index] = {
      ...prev,
      status: params.status,
      updatedAt: now
    };
    saveToStorage(STORAGE_KEYS.PLASTICULTURE_PLAN_ACTIVITIES, list);

    const activityLabel =
      prev.activityType === 'Outras' && prev.customActivityDescription
        ? `Outras: ${prev.customActivityDescription}`
        : prev.activityType;

    this.addAuditLog({
      action: 'Status de Atividade de Plasticultura',
      category: 'ATIVIDADES',
      details: `[${prev.farmCode}] ${activityLabel} (${prev.parcelCode}): "${prev.status}" → "${params.status}" por ${params.currentUser.name}.`,
      user: params.currentUser
    });

    return {
      success: true,
      message: `Status atualizado para "${params.status}".`
    };
  }

  static deletePlasticulturePlanActivity(
    activityId: string,
    currentUser: UserProfile
  ): { success: boolean; message: string } {
    const list = this.getPlasticulturePlanActivities();
    const target = list.find(item => item.id === activityId);
    if (!target) return { success: false, message: 'Atividade de plasticultura não encontrada.' };

    const remaining = list.filter(item => item.id !== activityId);
    saveToStorage(STORAGE_KEYS.PLASTICULTURE_PLAN_ACTIVITIES, remaining);

    const activityLabel =
      target.activityType === 'Outras' && target.customActivityDescription
        ? `Outras: ${target.customActivityDescription}`
        : target.activityType;

    this.addAuditLog({
      action: 'Exclusão de Atividade de Plasticultura',
      category: 'ATIVIDADES',
      details: `[${target.farmCode}] ${activityLabel} • ${target.sector} (${target.parcelCode}) excluída por ${currentUser.name}.`,
      user: currentUser
    });

    return {
      success: true,
      message: `Atividade "${activityLabel}" (${target.parcelCode}) excluída.`
    };
  }

  // --- CADASTRO DE ITENS PARA ATIVIDADES DE PLASTICULTURA (VÍNCULO POR FAZENDA) ---
  static getPlasticultureCatalogItems(): PlasticultureCatalogItem[] {
    return getFromStorage(STORAGE_KEYS.PLASTICULTURE_CATALOG, INITIAL_PLASTICULTURE_CATALOG_ITEMS);
  }

  static savePlasticultureCatalogItem(
    item: PlasticultureCatalogItem,
    currentUser: UserProfile
  ): { success: boolean; message: string; item?: PlasticultureCatalogItem } {
    const cleanName = item.name.trim();
    if (!cleanName) {
      return { success: false, message: 'Informe o nome do item.' };
    }
    if (!item.farmIds || item.farmIds.length === 0) {
      return { success: false, message: 'Selecione ao menos uma fazenda para vincular o item.' };
    }

    const list = this.getPlasticultureCatalogItems();
    const index = list.findIndex(existing => existing.id === item.id);
    const isNew = index < 0;
    const now = new Date().toISOString();

    const record: PlasticultureCatalogItem = {
      ...item,
      name: cleanName,
      farmIds: Array.from(new Set(item.farmIds)),
      sectorName: item.sectorName?.trim() || undefined,
      varietyName: item.varietyName?.trim() || undefined,
      supervisorName: item.supervisorName?.trim() || undefined,
      notes: item.notes?.trim() || undefined,
      createdAt: isNew ? (item.createdAt || now) : list[index].createdAt,
      updatedAt: now
    };

    if (isNew) {
      list.unshift(record);
    } else {
      list[index] = record;
    }

    saveToStorage(STORAGE_KEYS.PLASTICULTURE_CATALOG, list);

    const farms = this.getFarms();
    const farmLabels = record.farmIds
      .map(fid => farms.find(f => f.id === fid)?.code || fid)
      .join(', ');

    this.addAuditLog({
      action: isNew ? 'Cadastro de Item de Plasticultura' : 'Atualização de Item de Plasticultura',
      category: 'CADASTRO',
      details: `[${record.category}] "${record.name}" vinculado às fazendas: ${farmLabels} (${record.active ? 'Ativo' : 'Inativo'}) por ${currentUser.name}.`,
      user: currentUser
    });

    return {
      success: true,
      message: isNew
        ? `"${record.name}" cadastrado e vinculado com sucesso!`
        : `Vínculos e dados de "${record.name}" atualizados!`,
      item: record
    };
  }

  static deletePlasticultureCatalogItem(
    itemId: string,
    currentUser: UserProfile
  ): { success: boolean; message: string } {
    const list = this.getPlasticultureCatalogItems();
    const target = list.find(i => i.id === itemId);
    if (!target) return { success: false, message: 'Item não encontrado.' };

    if (target.isSystemDefault) {
      return {
        success: false,
        message: 'Itens padrão do módulo não podem ser excluídos; você pode inativá-los ou ajustar suas fazendas vinculadas.'
      };
    }

    const remaining = list.filter(i => i.id !== itemId);
    saveToStorage(STORAGE_KEYS.PLASTICULTURE_CATALOG, remaining);

    this.addAuditLog({
      action: 'Exclusão de Item de Plasticultura',
      category: 'CADASTRO',
      details: `[${target.category}] "${target.name}" excluído por ${currentUser.name}.`,
      user: currentUser
    });

    return {
      success: true,
      message: `"${target.name}" removido do cadastro.`
    };
  }

  // --- BACKUP & RESTORE JSON ---
  static exportAllData(): string {
    const dump = {
      exportDate: new Date().toISOString(),
      systemVersion: '2.0.0-GestaoPlasticoAgricola-Oficial',
      farms: this.getFarms(),
      sectors: this.getSectors(),
      parcels: this.getParcels(),
      plastics: this.getPlastics(),
      stock: this.getStock(),
      movements: this.getMovements(),
      installations: this.getInstallations(),
      removals: this.getRemovals(),
      users: this.getUsers(),
      audit: this.getAuditLogs(),
      serroplast: this.getSerroplastRecords(),
      activities: this.getActivities(),
      activityTypes: this.getActivityTypes(),
      plasticulturePlanActivities: this.getPlasticulturePlanActivities(),
      plasticultureCatalogItems: this.getPlasticultureCatalogItems(),
      coveredHectareValue: this.getCoveredHectareValue()
    };
    return JSON.stringify(dump, null, 2);
  }

  static importData(jsonContent: string, currentUser: UserProfile): { success: boolean; message: string } {
    try {
      const data = JSON.parse(jsonContent);
      if (!data.farms || !data.plastics || !data.stock) {
        return { success: false, message: 'Arquivo JSON inválido. Estrutura não reconhecida.' };
      }

      saveToStorage(STORAGE_KEYS.FARMS, data.farms);
      if (data.sectors) saveToStorage(STORAGE_KEYS.SECTORS, data.sectors);
      if (data.parcels) saveToStorage(STORAGE_KEYS.PARCELS, data.parcels);
      saveToStorage(STORAGE_KEYS.PLASTICS, data.plastics);
      saveToStorage(STORAGE_KEYS.STOCK, data.stock);
      if (data.movements) saveToStorage(STORAGE_KEYS.MOVEMENTS, data.movements);
      if (data.installations) saveToStorage(STORAGE_KEYS.INSTALLATIONS, data.installations);
      if (data.removals) saveToStorage(STORAGE_KEYS.REMOVALS, data.removals);
      if (data.serroplast) saveToStorage(STORAGE_KEYS.SERROPLAST, data.serroplast);
      if (data.activities) saveToStorage(STORAGE_KEYS.ACTIVITIES, data.activities);
      if (data.activityTypes) saveToStorage(STORAGE_KEYS.ACTIVITY_TYPES, data.activityTypes);
      if (data.plasticulturePlanActivities) {
        saveToStorage(STORAGE_KEYS.PLASTICULTURE_PLAN_ACTIVITIES, data.plasticulturePlanActivities);
      }
      if (data.plasticultureCatalogItems) {
        saveToStorage(STORAGE_KEYS.PLASTICULTURE_CATALOG, data.plasticultureCatalogItems);
      }
      if (typeof data.coveredHectareValue === 'number' && Number.isFinite(data.coveredHectareValue) && data.coveredHectareValue >= 0) {
        saveToStorage(STORAGE_KEYS.COVERED_HECTARE_VALUE, Number(data.coveredHectareValue.toFixed(2)));
      }

      this.addAuditLog({
        action: 'Restauração de Backup',
        category: 'SEGURANCA',
        details: 'Banco de dados restaurado a partir de arquivo JSON.',
        user: currentUser
      });

      return { success: true, message: 'Dados restaurados com sucesso!' };
    } catch (err) {
      return { success: false, message: 'Falha ao processar arquivo: ' + String(err) };
    }
  }
}
