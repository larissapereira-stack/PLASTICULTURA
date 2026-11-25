import React, { createContext, useContext, useState, useEffect, useMemo, useCallback } from 'react';
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
  DashboardFilters,
  UserRole,
  ParcelSituation,
  StructureStatus,
  SerroplastRecord,
  ActivityStatus,
  PlasticultureActivity,
  ActivityTypeItem,
  PlasticulturePlanActivity,
  PlasticulturePlanActivityStatus,
  PlasticultureCatalogItem,
  UserPermissionKey,
  UserPermissions,
  UserStatus,
  UserInviteLink
} from '../types';
import { AppStorageService } from '../services/storage';
import { computeFarmAreaSummary, FarmAreaSummaryReport } from '../utils/farmAreaSummary';
import { userHasPermission } from '../utils/permissions';

interface ToastNotification {
  id: string;
  type: 'success' | 'error' | 'info' | 'warning';
  title: string;
  message?: string;
}

export interface SaveManagedUserInput {
  id?: string;
  name: string;
  email: string;
  login?: string;
  role: UserRole;
  jobTitle?: string;
  farmScope: string;
  status: UserStatus;
  permissions: UserPermissions;
  initialPassword?: string;
  newPassword?: string;
}

interface AppContextType {
  // Entidades (escopo aplicado conforme fazenda vinculada do usuário)
  farms: Farm[];
  allFarms: Farm[];
  sectors: Sector[];
  parcels: Parcel[];
  plastics: PlasticMaterial[];
  stock: StockItem[];
  movements: StockMovement[];
  installations: PlasticInstallation[];
  removals: PlasticRemoval[];
  auditLogs: AuditLog[];
  serroplastRecords: SerroplastRecord[];
  activities: PlasticultureActivity[];
  activityTypes: ActivityTypeItem[];
  plasticulturePlanActivities: PlasticulturePlanActivity[];
  plasticultureCatalogItems: PlasticultureCatalogItem[];
  
  // Auth & Controle de Acesso
  isAuthenticated: boolean;
  isAuthLoading: boolean;
  needsAdminBootstrap: boolean;
  bootstrapAdminEmail: string;
  appPublicUrl: string;
  currentUser: UserProfile;
  availableUsers: UserProfile[];
  isAdmin: boolean;
  isFarmRestricted: boolean;
  restrictedFarmId: string | null;
  hasPermission: (key: UserPermissionKey) => boolean;
  canPerform: (action: 'CREATE_MASTER' | 'EDIT_MASTER' | 'STOCK_OPERATION' | 'INSTALLATION' | 'REMOVAL' | 'SYSTEM_CONFIG') => boolean;
  loginWithPassword: (identifier: string, password: string) => Promise<{ success: boolean; message?: string }>;
  bootstrapAdminAccount: (email: string, password: string) => Promise<{ success: boolean; message?: string }>;
  activateInviteAccount: (token: string, password: string) => Promise<{ success: boolean; message?: string }>;
  logout: () => Promise<void>;

  // Gestão de Usuários e Convites (exclusivo Administrador)
  managedUsers: UserProfile[];
  userInvites: UserInviteLink[];
  isLoadingUsers: boolean;
  loadUsersAndInvites: () => Promise<void>;
  saveManagedUser: (input: SaveManagedUserInput) => Promise<{ success: boolean; message: string; user?: UserProfile }>;
  toggleManagedUserStatus: (userId: string, status: UserStatus) => Promise<{ success: boolean; message: string }>;
  deleteManagedUser: (userId: string) => Promise<{ success: boolean; message: string }>;
  createUserInvite: (userId: string, expiresInHours: number) => Promise<{ success: boolean; message: string; invite?: UserInviteLink }>;
  revokeUserInvite: (inviteId: string) => Promise<{ success: boolean; message: string }>;

  // Filtros Globais
  filters: DashboardFilters;
  setFilters: React.Dispatch<React.SetStateAction<DashboardFilters>>;
  resetFilters: () => void;

  // Métodos de Cadastro
  saveFarm: (farm: Farm) => void;
  saveSector: (sector: Sector) => void;
  saveParcel: (parcel: Parcel) => void;
  confirmParcelSituation: (params: {
    parcelId: string;
    situation: ParcelSituation;
    structureStatus?: StructureStatus;
    structureNotes?: string;
    currentPlasticType?: string;
    currentMetersCovered?: number;
    notes?: string;
  }) => { success: boolean; message: string };
  addCoverageToParcel: (params: {
    parcelId: string;
    coverageDate: string;
    plasticType: string;
    plasticId?: string;
    metersInstalled: number;
    isCurrentConfirmed: boolean;
    responsible: string;
    notes?: string;
  }) => { success: boolean; message: string };
  importOfficialParcels: (parcels: Parcel[]) => { success: boolean; message: string; count: number };
  savePlastic: (plastic: PlasticMaterial) => void;
  
  // Operações de Estoque
  addStockEntry: (params: {
    farmId: string;
    plasticId: string;
    batchNumber: string;
    condition: 'NOVO' | 'REUTILIZADO';
    meters: number;
    costPerMeter: number;
    reason: string;
    notes?: string;
    originDetails?: string;
  }) => { success: boolean; message: string };

  addStockExit: (params: {
    stockItemId: string;
    meters: number;
    reason: string;
    notes?: string;
  }) => { success: boolean; message: string };

  transferStock: (params: {
    sourceStockItemId: string;
    destinationFarmId: string;
    meters: number;
    reason: string;
    notes?: string;
  }) => { success: boolean; message: string };

  registerInstallation: (params: {
    farmId: string;
    sector: string;
    parcelId: string;
    stockItemId: string;
    metersInstalled: number;
    installationDate: string;
    responsibleName: string;
    isSubstitution?: boolean;
    notes?: string;
  }) => { success: boolean; message: string };

  registerRemoval: (params: {
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
  }) => { success: boolean; message: string };

  // Serroplast Oficial
  saveSerroplastRecord: (record: SerroplastRecord) => void;
  toggleSerroplastStatus: (id: string, ativo: boolean, motivo?: string) => { success: boolean; message: string };
  importSerroplastBatch: (records: SerroplastRecord[]) => { success: boolean; addedCount: number; updatedCount: number; total: number; message: string };

  // Atividades de Plasticultura
  saveActivity: (activity: PlasticultureActivity) => { success: boolean; message: string };
  updateActivityStatus: (activityId: string, status: ActivityStatus, notes?: string) => { success: boolean; message: string };
  deleteActivity: (activityId: string) => { success: boolean; message: string };
  saveActivityType: (params: { id?: string; name: string; active?: boolean }) => { success: boolean; message: string; item?: ActivityTypeItem };
  deleteActivityType: (id: string) => { success: boolean; message: string };

  // Atividades de Plasticultura (Plano de Parreiral 2027)
  savePlasticulturePlanActivity: (activity: PlasticulturePlanActivity) => { success: boolean; message: string };
  updatePlasticulturePlanActivityStatus: (activityId: string, status: PlasticulturePlanActivityStatus) => { success: boolean; message: string };
  deletePlasticulturePlanActivity: (activityId: string) => { success: boolean; message: string };

  // Cadastro de Itens para Atividades de Plasticultura (Vínculo por Fazenda)
  savePlasticultureCatalogItem: (item: PlasticultureCatalogItem) => { success: boolean; message: string; item?: PlasticultureCatalogItem };
  deletePlasticultureCatalogItem: (itemId: string) => { success: boolean; message: string };

  // Sistema
  resetToDefaults: () => void;
  exportBackupJson: () => void;
  importBackupJson: (fileContent: string) => { success: boolean; message: string };
  
  // Notificações
  toasts: ToastNotification[];
  removeToast: (id: string) => void;
  showToast: (type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => void;

  // KPIs & Análises Consolidadas
  kpis: {
    totalHectares: number;
    coveredHectares: number;
    uncoveredHectares: number;
    toConfirmHectares: number;
    coverageRatePercentage: number;
    totalParcelsCount: number;
    coveredParcelsCount: number;
    uncoveredParcelsCount: number;
    toConfirmParcelsCount: number;
    duplicateParcelsCount: number;
    totalMetersPurchased: number;
    totalMetersInStock: number;
    totalMetersInStockNew: number;
    totalMetersInStockReused: number;
    totalMetersInstalledActive: number;
    totalMetersRemoved: number;
    totalMetersReused: number;
    totalMetersDiscarded: number;
    reuseRatePercentage: number;
    lossRatePercentage: number;
    totalSavedFromReuse: number;
    totalLossFromDiscard: number;
    lowStockAlertsCount: number;
    lowStockItems: { stock: StockItem; plastic: PlasticMaterial; farm: Farm }[];
  };

  // Resumo independente por fazenda: Plasticultura vs. Estrutura Física + Valor por Hectare Coberto
  coveredHectareValue: number;
  updateCoveredHectareValue: (value: number) => { success: boolean; message: string };
  farmAreaSummary: FarmAreaSummaryReport;
}

const AppContext = createContext<AppContextType | null>(null);

const DEFAULT_FILTERS: DashboardFilters = {
  farmId: 'all',
  plasticId: 'all',
  sector: 'all',
  supervisor: 'all',
  variety: 'all',
  situation: 'ALL',
  condition: 'ALL',
  hasDuplicatesOnly: false
};

export const AppProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  useEffect(() => {
    AppStorageService.initStorage();
  }, []);

  const [farms, setFarms] = useState<Farm[]>(() => AppStorageService.getFarms());
  const [sectors, setSectors] = useState<Sector[]>(() => AppStorageService.getSectors());
  const [parcels, setParcels] = useState<Parcel[]>(() => AppStorageService.getParcels());
  const [plastics, setPlastics] = useState<PlasticMaterial[]>(() => AppStorageService.getPlastics());
  const [stock, setStock] = useState<StockItem[]>(() => AppStorageService.getStock());
  const [movements, setMovements] = useState<StockMovement[]>(() => AppStorageService.getMovements());
  const [installations, setInstallations] = useState<PlasticInstallation[]>(() => AppStorageService.getInstallations());
  const [removals, setRemovals] = useState<PlasticRemoval[]>(() => AppStorageService.getRemovals());
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(() => AppStorageService.getAuditLogs());
  const [serroplastRecords, setSerroplastRecords] = useState<SerroplastRecord[]>(() => AppStorageService.getSerroplastRecords());
  const [activities, setActivities] = useState<PlasticultureActivity[]>(() => AppStorageService.getActivities());
  const [activityTypes, setActivityTypes] = useState<ActivityTypeItem[]>(() => AppStorageService.getActivityTypes());
  const [plasticulturePlanActivities, setPlasticulturePlanActivities] = useState<PlasticulturePlanActivity[]>(
    () => AppStorageService.getPlasticulturePlanActivities()
  );
  const [plasticultureCatalogItems, setPlasticultureCatalogItems] = useState<PlasticultureCatalogItem[]>(
    () => AppStorageService.getPlasticultureCatalogItems()
  );
  const [coveredHectareValue, setCoveredHectareValue] = useState<number>(() => AppStorageService.getCoveredHectareValue());

  // Estado de Autenticação em Memória (sem armazenar token em localStorage/sessionStorage)
  const [authToken, setAuthToken] = useState<string | null>(null);
  const [authenticatedUser, setAuthenticatedUser] = useState<UserProfile | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState<boolean>(true);
  const [needsAdminBootstrap, setNeedsAdminBootstrap] = useState<boolean>(false);
  const [bootstrapAdminEmail, setBootstrapAdminEmail] = useState<string>('larissa.pereira@elciruelo.com.br');
  const [appPublicUrl, setAppPublicUrl] = useState<string>(() =>
    typeof window !== 'undefined' ? window.location.origin : ''
  );

  // Gestão de Usuários e Convites (Administrador)
  const [managedUsers, setManagedUsers] = useState<UserProfile[]>([]);
  const [userInvites, setUserInvites] = useState<UserInviteLink[]>([]);
  const [isLoadingUsers, setIsLoadingUsers] = useState<boolean>(false);

  const [filters, setFiltersState] = useState<DashboardFilters>(DEFAULT_FILTERS);
  const [toasts, setToasts] = useState<ToastNotification[]>([]);

  const showToast = useCallback((type: 'success' | 'error' | 'info' | 'warning', title: string, message?: string) => {
    const id = `toast-${Date.now()}-${Math.random().toString(36).substring(2, 5)}`;
    setToasts(prev => [...prev, { id, type, title, message }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4500);
  }, []);

  const removeToast = useCallback((id: string) => {
    setToasts(prev => prev.filter(t => t.id !== id));
  }, []);

  // Verifica status inicial de autenticação no servidor
  useEffect(() => {
    let active = true;
    const checkStatus = async () => {
      try {
        const res = await fetch('/api/auth/status');
        if (res.ok && active) {
          const data = await res.json();
          setNeedsAdminBootstrap(Boolean(data.needsAdminBootstrap));
          if (data.adminEmail) setBootstrapAdminEmail(data.adminEmail);
          if (data.appPublicUrl) setAppPublicUrl(data.appPublicUrl);
        }
      } catch {
        // Offline fallback handled cleanly by UI
      } finally {
        if (active) setIsAuthLoading(false);
      }
    };
    checkStatus();
    return () => {
      active = false;
    };
  }, []);

  const currentUser: UserProfile = useMemo(
    () => authenticatedUser || AppStorageService.getCurrentUser(),
    [authenticatedUser]
  );

  const isAuthenticated = Boolean(authToken && authenticatedUser);
  const isAdmin = isAuthenticated && currentUser.role === 'Administrador' && currentUser.status === 'Ativo';
  const restrictedFarmId =
    isAuthenticated && currentUser.farmScope && currentUser.farmScope !== 'ALL'
      ? currentUser.farmScope
      : null;
  const isFarmRestricted = Boolean(restrictedFarmId);

  // Força o filtro de fazenda quando o usuário estiver restrito a uma fazenda específica
  useEffect(() => {
    if (restrictedFarmId) {
      setFiltersState(prev => ({
        ...prev,
        farmId: restrictedFarmId,
        sector: 'all',
        supervisor: 'all',
        variety: 'all'
      }));
    }
  }, [restrictedFarmId]);

  const setFilters: React.Dispatch<React.SetStateAction<DashboardFilters>> = useCallback(
    (updater) => {
      setFiltersState(prev => {
        const next = typeof updater === 'function' ? updater(prev) : updater;
        if (restrictedFarmId) {
          return { ...next, farmId: restrictedFarmId };
        }
        return next;
      });
    },
    [restrictedFarmId]
  );

  const loadUsersAndInvites = useCallback(async () => {
    if (!authToken || currentUser.role !== 'Administrador') return;
    setIsLoadingUsers(true);
    try {
      const res = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${authToken}` },
      });
      if (res.ok) {
        const data = await res.json();
        setManagedUsers(Array.isArray(data.users) ? data.users : []);
        setUserInvites(Array.isArray(data.invites) ? data.invites : []);
        if (data.publicUrl) setAppPublicUrl(data.publicUrl);
      } else if (res.status === 401) {
        setAuthToken(null);
        setAuthenticatedUser(null);
      }
    } catch {
      showToast('error', 'Falha de conexão', 'Não foi possível carregar os usuários.');
    } finally {
      setIsLoadingUsers(false);
    }
  }, [authToken, currentUser.role, showToast]);

  useEffect(() => {
    if (isAdmin && authToken) {
      loadUsersAndInvites();
    } else {
      setManagedUsers([]);
      setUserInvites([]);
    }
  }, [isAdmin, authToken, loadUsersAndInvites]);

  const loginWithPassword = useCallback(async (identifier: string, password: string) => {
    try {
      const res = await fetch('/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ identifier, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Falha na autenticação.' };
      }
      setAuthToken(data.token);
      setAuthenticatedUser(data.user);
      setNeedsAdminBootstrap(false);
      AppStorageService.setCurrentUser(data.user);
      return { success: true };
    } catch {
      return { success: false, message: 'Erro de comunicação com o servidor de autenticação.' };
    }
  }, []);

  const bootstrapAdminAccount = useCallback(async (email: string, password: string) => {
    try {
      const res = await fetch('/api/auth/bootstrap-admin', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Não foi possível configurar o administrador.' };
      }
      setAuthToken(data.token);
      setAuthenticatedUser(data.user);
      setNeedsAdminBootstrap(false);
      AppStorageService.setCurrentUser(data.user);
      return { success: true };
    } catch {
      return { success: false, message: 'Erro de comunicação ao configurar administrador.' };
    }
  }, []);

  const activateInviteAccount = useCallback(async (token: string, password: string) => {
    try {
      const res = await fetch('/api/auth/activate-invite', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        return { success: false, message: data.error || 'Não foi possível ativar o convite.' };
      }
      setAuthToken(data.token);
      setAuthenticatedUser(data.user);
      setNeedsAdminBootstrap(false);
      AppStorageService.setCurrentUser(data.user);
      return { success: true };
    } catch {
      return { success: false, message: 'Erro de comunicação ao ativar acesso.' };
    }
  }, []);

  const logout = useCallback(async () => {
    if (authToken) {
      try {
        await fetch('/api/auth/logout', {
          method: 'POST',
          headers: { Authorization: `Bearer ${authToken}` },
        });
      } catch {
        // Ignore network errors on logout
      }
    }
    setAuthToken(null);
    setAuthenticatedUser(null);
    setManagedUsers([]);
    setUserInvites([]);
    setFiltersState(DEFAULT_FILTERS);
  }, [authToken]);

  const saveManagedUser = useCallback(async (input: SaveManagedUserInput) => {
    if (!authToken || !isAdmin) {
      return { success: false, message: 'Somente o administrador pode gerenciar usuários.' };
    }
    try {
      const isEdit = Boolean(input.id);
      const res = await fetch(isEdit ? `/api/users/${encodeURIComponent(input.id!)}` : '/api/users', {
        method: isEdit ? 'PUT' : 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(input),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', 'Erro ao salvar usuário', data.error);
        return { success: false, message: data.error || 'Erro ao salvar usuário.' };
      }
      if (data.user?.id === currentUser.id) {
        setAuthenticatedUser(data.user);
        AppStorageService.setCurrentUser(data.user);
      }
      await loadUsersAndInvites();
      showToast('success', isEdit ? 'Usuário atualizado' : 'Usuário cadastrado', `${data.user.name} salvo com sucesso.`);
      return { success: true, message: 'Usuário salvo com sucesso.', user: data.user };
    } catch {
      return { success: false, message: 'Erro de comunicação ao salvar usuário.' };
    }
  }, [authToken, isAdmin, currentUser.id, loadUsersAndInvites, showToast]);

  const toggleManagedUserStatus = useCallback(async (userId: string, status: UserStatus) => {
    if (!authToken || !isAdmin) {
      return { success: false, message: 'Somente o administrador pode bloquear ou ativar usuários.' };
    }
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}/status`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ status }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', 'Operação não permitida', data.error);
        return { success: false, message: data.error || 'Erro ao atualizar status.' };
      }
      await loadUsersAndInvites();
      showToast(
        status === 'Ativo' ? 'success' : 'warning',
        status === 'Ativo' ? 'Usuário ativado' : 'Usuário bloqueado',
        `${data.user.name} agora está ${status}.`
      );
      return { success: true, message: `Status atualizado para ${status}.` };
    } catch {
      return { success: false, message: 'Erro de comunicação ao alterar status.' };
    }
  }, [authToken, isAdmin, loadUsersAndInvites, showToast]);

  const deleteManagedUser = useCallback(async (userId: string) => {
    if (!authToken || !isAdmin) {
      return { success: false, message: 'Somente o administrador pode excluir usuários.' };
    }
    try {
      const res = await fetch(`/api/users/${encodeURIComponent(userId)}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', 'Não foi possível excluir', data.error);
        return { success: false, message: data.error || 'Erro ao excluir usuário.' };
      }
      await loadUsersAndInvites();
      showToast('success', 'Usuário excluído', 'Cadastro e convites removidos com segurança.');
      return { success: true, message: 'Usuário excluído.' };
    } catch {
      return { success: false, message: 'Erro de comunicação ao excluir usuário.' };
    }
  }, [authToken, isAdmin, loadUsersAndInvites, showToast]);

  const createUserInvite = useCallback(async (userId: string, expiresInHours: number) => {
    if (!authToken || !isAdmin) {
      return { success: false, message: 'Somente o administrador pode gerar links de convite.' };
    }
    try {
      const res = await fetch('/api/invites', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ userId, expiresInHours }),
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', 'Erro ao gerar convite', data.error);
        return { success: false, message: data.error || 'Erro ao gerar convite.' };
      }
      await loadUsersAndInvites();
      showToast('success', 'Convite & QR Code gerados', 'Link pronto para envio ao usuário autorizado.');
      return { success: true, message: 'Convite gerado.', invite: data.invite as UserInviteLink };
    } catch {
      return { success: false, message: 'Erro ao gerar convite.' };
    }
  }, [authToken, isAdmin, loadUsersAndInvites, showToast]);

  const revokeUserInvite = useCallback(async (inviteId: string) => {
    if (!authToken || !isAdmin) {
      return { success: false, message: 'Somente o administrador pode revogar convites.' };
    }
    try {
      const res = await fetch(`/api/invites/${encodeURIComponent(inviteId)}/revoke`, {
        method: 'POST',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) {
        showToast('error', 'Erro ao revogar', data.error);
        return { success: false, message: data.error || 'Erro ao revogar convite.' };
      }
      await loadUsersAndInvites();
      showToast('info', 'Link revogado', 'Este QR Code/link não poderá mais ser utilizado.');
      return { success: true, message: 'Convite revogado.' };
    } catch {
      return { success: false, message: 'Erro ao revogar convite.' };
    }
  }, [authToken, isAdmin, loadUsersAndInvites, showToast]);

  const refreshState = useCallback(() => {
    setFarms(AppStorageService.getFarms());
    setSectors(AppStorageService.getSectors());
    setParcels(AppStorageService.getParcels());
    setPlastics(AppStorageService.getPlastics());
    setStock(AppStorageService.getStock());
    setMovements(AppStorageService.getMovements());
    setInstallations(AppStorageService.getInstallations());
    setRemovals(AppStorageService.getRemovals());
    setAuditLogs(AppStorageService.getAuditLogs());
    setSerroplastRecords(AppStorageService.getSerroplastRecords());
    setActivities(AppStorageService.getActivities());
    setActivityTypes(AppStorageService.getActivityTypes());
    setPlasticulturePlanActivities(AppStorageService.getPlasticulturePlanActivities());
    setPlasticultureCatalogItems(AppStorageService.getPlasticultureCatalogItems());
    setCoveredHectareValue(AppStorageService.getCoveredHectareValue());
  }, []);

  const hasPermission = useCallback(
    (key: UserPermissionKey): boolean => {
      if (!isAuthenticated) return false;
      return userHasPermission(currentUser, key);
    },
    [isAuthenticated, currentUser]
  );

  const canPerform = useCallback(
    (action: 'CREATE_MASTER' | 'EDIT_MASTER' | 'STOCK_OPERATION' | 'INSTALLATION' | 'REMOVAL' | 'SYSTEM_CONFIG'): boolean => {
      if (!isAuthenticated || currentUser.status !== 'Ativo') return false;
      if (action === 'SYSTEM_CONFIG') return currentUser.role === 'Administrador';
      if (action === 'CREATE_MASTER') {
        return userHasPermission(currentUser, 'create_records') && userHasPermission(currentUser, 'access_catalogs');
      }
      if (action === 'EDIT_MASTER') {
        return userHasPermission(currentUser, 'edit_records') && userHasPermission(currentUser, 'access_catalogs');
      }
      if (action === 'STOCK_OPERATION') {
        return userHasPermission(currentUser, 'create_records') || userHasPermission(currentUser, 'edit_records');
      }
      if (action === 'INSTALLATION' || action === 'REMOVAL') {
        return userHasPermission(currentUser, 'create_records');
      }
      return false;
    },
    [isAuthenticated, currentUser]
  );

  // CADASTRO
  const saveFarm = useCallback((farm: Farm) => {
    const isEdit = farms.some(f => f.id === farm.id);
    if (!hasPermission('access_catalogs') || !hasPermission(isEdit ? 'edit_records' : 'create_records')) {
      showToast('error', 'Acesso Negado', 'Você não tem permissão para salvar fazendas.');
      return;
    }
    AppStorageService.saveFarm(farm, currentUser);
    refreshState();
    showToast('success', 'Fazenda salva com sucesso!');
  }, [farms, currentUser, hasPermission, refreshState, showToast]);

  const saveSector = useCallback((sector: Sector) => {
    const isEdit = sectors.some(s => s.id === sector.id);
    if (!hasPermission('access_catalogs') || !hasPermission(isEdit ? 'edit_records' : 'create_records')) {
      showToast('error', 'Acesso Negado', 'Você não tem permissão para salvar setores.');
      return;
    }
    AppStorageService.saveSector(sector, currentUser);
    refreshState();
    showToast('success', 'Setor salvo com sucesso!');
  }, [sectors, currentUser, hasPermission, refreshState, showToast]);

  const saveParcel = useCallback((parcel: Parcel) => {
    const isEdit = parcels.some(p => p.id === parcel.id);
    if (!hasPermission('access_catalogs') || !hasPermission(isEdit ? 'edit_records' : 'create_records')) {
      showToast('error', 'Acesso Negado', 'Você não tem permissão para salvar parcelas.');
      return;
    }
    AppStorageService.saveParcel(parcel, currentUser);
    refreshState();
    showToast('success', 'Parcela salva com sucesso!');
  }, [parcels, currentUser, hasPermission, refreshState, showToast]);

  const confirmParcelSituation = useCallback((params: Omit<Parameters<typeof AppStorageService.confirmParcelSituation>[0], 'currentUser'>) => {
    if (!hasPermission('edit_records')) {
      const msg = 'Você não tem permissão para confirmar ou editar situações de parcelas.';
      showToast('error', 'Acesso Negado', msg);
      return { success: false, message: msg };
    }
    const res = AppStorageService.confirmParcelSituation({ ...params, currentUser });
    if (res.success) {
      refreshState();
      showToast('success', 'Situação Confirmada', res.message);
    } else {
      showToast('error', 'Erro', res.message);
    }
    return res;
  }, [currentUser, hasPermission, refreshState, showToast]);

  const addCoverageToParcel = useCallback((params: Omit<Parameters<typeof AppStorageService.addCoverageToParcel>[0], 'currentUser'>) => {
    if (!hasPermission('create_records')) {
      const msg = 'Você não tem permissão para registrar novas coberturas.';
      showToast('error', 'Acesso Negado', msg);
      return { success: false, message: msg };
    }
    const res = AppStorageService.addCoverageToParcel({ ...params, currentUser });
    if (res.success) {
      refreshState();
      showToast('success', 'Cobertura Registrada', res.message);
    } else {
      showToast('error', 'Erro', res.message);
    }
    return res;
  }, [currentUser, hasPermission, refreshState, showToast]);

  const importOfficialParcels = useCallback((newParcels: Parcel[]) => {
    if (!hasPermission('access_catalogs') || !hasPermission('create_records')) {
      const msg = 'Você não tem permissão para importar parcelas.';
      showToast('error', 'Acesso Negado', msg);
      return { success: false, message: msg, count: 0 };
    }
    const res = AppStorageService.importOfficialParcels(newParcels, currentUser);
    if (res.success) {
      refreshState();
      showToast('success', 'Importação Concluída', res.message);
    } else {
      showToast('error', 'Erro na Importação', res.message);
    }
    return res;
  }, [currentUser, hasPermission, refreshState, showToast]);

  const savePlastic = useCallback((plastic: PlasticMaterial) => {
    const isEdit = plastics.some(p => p.id === plastic.id);
    if (!hasPermission('access_catalogs') || !hasPermission(isEdit ? 'edit_records' : 'create_records')) {
      showToast('error', 'Acesso Negado', 'Você não tem permissão para salvar plásticos.');
      return;
    }
    AppStorageService.savePlastic(plastic, currentUser);
    refreshState();
    showToast('success', 'Material plástico salvo com sucesso!');
  }, [plastics, currentUser, hasPermission, refreshState, showToast]);

  // ESTOQUE & MOVIMENTAÇÕES
  const addStockEntry = useCallback((params: Omit<Parameters<typeof AppStorageService.addStockEntry>[0], 'currentUser'>) => {
    if (!hasPermission('create_records')) {
      const msg = 'Você não tem permissão para lançar entradas de estoque.';
      showToast('error', 'Acesso Negado', msg);
      return { success: false, message: msg };
    }
    const res = AppStorageService.addStockEntry({ ...params, currentUser });
    if (res.success) {
      refreshState();
      showToast('success', 'Entrada concluída', res.message);
    } else {
      showToast('error', 'Erro na entrada', res.message);
    }
    return res;
  }, [currentUser, hasPermission, refreshState, showToast]);

  const addStockExit = useCallback((params: Omit<Parameters<typeof AppStorageService.addStockExit>[0], 'currentUser'>) => {
    if (!hasPermission('create_records') && !hasPermission('edit_records')) {
      const msg = 'Você não tem permissão para lançar baixas de estoque.';
      showToast('error', 'Acesso Negado', msg);
      return { success: false, message: msg };
    }
    const res = AppStorageService.addStockExit({ ...params, currentUser });
    if (res.success) {
      refreshState();
      showToast('success', 'Baixa concluída', res.message);
    } else {
      showToast('error', 'Erro na baixa', res.message);
    }
    return res;
  }, [currentUser, hasPermission, refreshState, showToast]);

  const transferStock = useCallback((params: Omit<Parameters<typeof AppStorageService.transferStock>[0], 'currentUser'>) => {
    if (!hasPermission('create_records') && !hasPermission('edit_records')) {
      const msg = 'Você não tem permissão para transferir estoque.';
      showToast('error', 'Acesso Negado', msg);
      return { success: false, message: msg };
    }
    const res = AppStorageService.transferStock({ ...params, currentUser });
    if (res.success) {
      refreshState();
      showToast('success', 'Transferência realizada', res.message);
    } else {
      showToast('error', 'Falha na transferência', res.message);
    }
    return res;
  }, [currentUser, hasPermission, refreshState, showToast]);

  const registerInstallation = useCallback((params: Omit<Parameters<typeof AppStorageService.registerInstallation>[0], 'currentUser'>) => {
    if (!hasPermission('create_records')) {
      const msg = 'Você não tem permissão para registrar instalações.';
      showToast('error', 'Acesso Negado', msg);
      return { success: false, message: msg };
    }
    const res = AppStorageService.registerInstallation({ ...params, currentUser });
    if (res.success) {
      refreshState();
      showToast('success', 'Instalação registrada', res.message);
    } else {
      showToast('error', 'Erro ao instalar', res.message);
    }
    return res;
  }, [currentUser, hasPermission, refreshState, showToast]);

  const registerRemoval = useCallback((params: Omit<Parameters<typeof AppStorageService.registerRemoval>[0], 'currentUser'>) => {
    if (!hasPermission('create_records')) {
      const msg = 'Você não tem permissão para registrar retiradas.';
      showToast('error', 'Acesso Negado', msg);
      return { success: false, message: msg };
    }
    const res = AppStorageService.registerRemoval({ ...params, currentUser });
    if (res.success) {
      refreshState();
      showToast('success', 'Retirada registrada', res.message);
    } else {
      showToast('error', 'Erro ao registrar retirada', res.message);
    }
    return res;
  }, [currentUser, hasPermission, refreshState, showToast]);

  const resetToDefaults = useCallback(() => {
    if (!isAdmin) {
      showToast('error', 'Acesso Negado', 'Somente o administrador pode restaurar a base de dados.');
      return;
    }
    AppStorageService.resetToDefaults();
    refreshState();
    showToast('info', 'Dados reinicializados', 'Base de dados restaurada para o padrão oficial.');
  }, [isAdmin, refreshState, showToast]);

  const exportBackupJson = useCallback(() => {
    if (!hasPermission('access_reports') && !isAdmin) {
      showToast('error', 'Acesso Negado', 'Você não tem permissão para exportar backups.');
      return;
    }
    const jsonStr = AppStorageService.exportAllData();
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `backup_plasticultura_oficial_${new Date().toISOString().slice(0, 10)}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    showToast('success', 'Backup exportado', 'Arquivo JSON baixado com sucesso.');
  }, [hasPermission, isAdmin, showToast]);

  const importBackupJson = useCallback((content: string) => {
    if (!isAdmin) {
      const msg = 'Somente o administrador pode restaurar backups completos.';
      showToast('error', 'Acesso Negado', msg);
      return { success: false, message: msg };
    }
    const res = AppStorageService.importData(content, currentUser);
    if (res.success) {
      refreshState();
      showToast('success', 'Backup restaurado', res.message);
    } else {
      showToast('error', 'Erro no backup', res.message);
    }
    return res;
  }, [isAdmin, currentUser, refreshState, showToast]);

  // SERROPLAST
  const saveSerroplastRecord = useCallback((record: SerroplastRecord) => {
    const isEdit = serroplastRecords.some(r => r.id === record.id);
    if (!hasPermission('access_covered_areas') || !hasPermission(isEdit ? 'edit_records' : 'create_records')) {
      showToast('error', 'Acesso Negado', 'Você não tem permissão para salvar registros de áreas cobertas.');
      return;
    }
    AppStorageService.saveSerroplastRecord(record, currentUser);
    refreshState();
    showToast('success', 'Registro Serroplast salvo', `Parcela ${record.parcela} (${record.sigla}) atualizada.`);
  }, [serroplastRecords, currentUser, hasPermission, refreshState, showToast]);

  const toggleSerroplastStatus = useCallback((id: string, ativo: boolean, motivo?: string) => {
    if (!hasPermission('access_covered_areas') || !hasPermission('edit_records')) {
      const msg = 'Você não tem permissão para alterar status de registros Serroplast.';
      showToast('error', 'Acesso Negado', msg);
      return { success: false, message: msg };
    }
    const res = AppStorageService.toggleSerroplastStatus({ id, ativo, motivo, currentUser });
    if (res.success) {
      refreshState();
      showToast(ativo ? 'success' : 'info', ativo ? 'Registro reativado' : 'Registro inativado', res.message);
    } else {
      showToast('error', 'Erro', res.message);
    }
    return res;
  }, [currentUser, hasPermission, refreshState, showToast]);

  const importSerroplastBatch = useCallback((records: SerroplastRecord[]) => {
    if (!hasPermission('access_covered_areas') || !hasPermission('create_records')) {
      const msg = 'Você não tem permissão para importar lotes Serroplast.';
      showToast('error', 'Acesso Negado', msg);
      return { success: false, addedCount: 0, updatedCount: 0, total: 0, message: msg };
    }
    const res = AppStorageService.importSerroplastBatch(records, currentUser);
    if (res.success) {
      refreshState();
      showToast('success', 'Importação Serroplast', res.message);
    } else {
      showToast('error', 'Falha na Importação', res.message);
    }
    return res;
  }, [currentUser, hasPermission, refreshState, showToast]);

  // ATIVIDADES
  const saveActivity = useCallback((activity: PlasticultureActivity) => {
    const isEdit = activities.some(a => a.id === activity.id);
    if (!hasPermission(isEdit ? 'edit_records' : 'create_records')) {
      const msg = isEdit ? 'Você não tem permissão para editar registros.' : 'Você não tem permissão para cadastrar novos registros.';
      showToast('error', 'Acesso Negado', msg);
      return { success: false, message: msg };
    }
    const res = AppStorageService.saveActivity(activity, currentUser);
    if (res.success) {
      refreshState();
      showToast('success', 'Atividade Salva', res.message);
    } else {
      showToast('error', 'Erro', res.message);
    }
    return res;
  }, [activities, currentUser, hasPermission, refreshState, showToast]);

  const updateActivityStatus = useCallback((activityId: string, status: ActivityStatus, notes?: string) => {
    if (!hasPermission('edit_records')) {
      const msg = 'Você não tem permissão para editar registros.';
      showToast('error', 'Acesso Negado', msg);
      return { success: false, message: msg };
    }
    const res = AppStorageService.updateActivityStatus({ activityId, status, notes, currentUser });
    if (res.success) {
      refreshState();
      showToast('success', 'Status Atualizado', res.message);
    } else {
      showToast('error', 'Erro', res.message);
    }
    return res;
  }, [currentUser, hasPermission, refreshState, showToast]);

  const deleteActivity = useCallback((activityId: string) => {
    if (!hasPermission('delete_records')) {
      const msg = 'Você não tem permissão para excluir registros.';
      showToast('error', 'Acesso Negado', msg);
      return { success: false, message: msg };
    }
    const res = AppStorageService.deleteActivity(activityId, currentUser);
    if (res.success) {
      refreshState();
      showToast('success', 'Atividade Excluída', res.message);
    } else {
      showToast('error', 'Erro ao Excluir', res.message);
    }
    return res;
  }, [currentUser, hasPermission, refreshState, showToast]);

  const saveActivityType = useCallback((params: { id?: string; name: string; active?: boolean }) => {
    const isEdit = Boolean(params.id);
    if (!hasPermission(isEdit ? 'edit_records' : 'create_records')) {
      const msg = 'Você não tem permissão para alterar tipos de atividade.';
      showToast('error', 'Acesso Negado', msg);
      return { success: false, message: msg };
    }
    const res = AppStorageService.saveActivityType({ ...params, currentUser });
    if (res.success) {
      refreshState();
      showToast('success', 'Tipo de Atividade', res.message);
    } else {
      showToast('error', 'Atenção', res.message);
    }
    return res;
  }, [currentUser, hasPermission, refreshState, showToast]);

  const deleteActivityType = useCallback((id: string) => {
    if (!hasPermission('delete_records')) {
      const msg = 'Você não tem permissão para excluir registros.';
      showToast('error', 'Acesso Negado', msg);
      return { success: false, message: msg };
    }
    const res = AppStorageService.deleteActivityType(id, currentUser);
    if (res.success) {
      refreshState();
      showToast('success', 'Tipo Excluído', res.message);
    } else {
      showToast('error', 'Não foi possível excluir', res.message);
    }
    return res;
  }, [currentUser, hasPermission, refreshState, showToast]);

  // ATIVIDADES DE PLASTICULTURA (PLANO PARREIRAL 2027)
  const savePlasticulturePlanActivity = useCallback((activity: PlasticulturePlanActivity) => {
    const isEdit = plasticulturePlanActivities.some(a => a.id === activity.id);
    if (!hasPermission(isEdit ? 'edit_records' : 'create_records')) {
      const msg = isEdit ? 'Você não tem permissão para editar registros.' : 'Você não tem permissão para cadastrar novos registros.';
      showToast('error', 'Acesso Negado', msg);
      return { success: false, message: msg };
    }
    const res = AppStorageService.savePlasticulturePlanActivity(activity, currentUser);
    if (res.success) {
      refreshState();
      showToast('success', 'Atividade Salva', res.message);
    } else {
      showToast('error', 'Erro ao Salvar', res.message);
    }
    return res;
  }, [plasticulturePlanActivities, currentUser, hasPermission, refreshState, showToast]);

  const updatePlasticulturePlanActivityStatus = useCallback((activityId: string, status: PlasticulturePlanActivityStatus) => {
    if (!hasPermission('edit_records')) {
      const msg = 'Você não tem permissão para editar registros.';
      showToast('error', 'Acesso Negado', msg);
      return { success: false, message: msg };
    }
    const res = AppStorageService.updatePlasticulturePlanActivityStatus({ activityId, status, currentUser });
    if (res.success) {
      refreshState();
      showToast('success', 'Status Atualizado', res.message);
    } else {
      showToast('error', 'Erro', res.message);
    }
    return res;
  }, [currentUser, hasPermission, refreshState, showToast]);

  const deletePlasticulturePlanActivity = useCallback((activityId: string) => {
    if (!hasPermission('delete_records')) {
      const msg = 'Você não tem permissão para excluir registros.';
      showToast('error', 'Acesso Negado', msg);
      return { success: false, message: msg };
    }
    const res = AppStorageService.deletePlasticulturePlanActivity(activityId, currentUser);
    if (res.success) {
      refreshState();
      showToast('success', 'Atividade Excluída', res.message);
    } else {
      showToast('error', 'Erro ao Excluir', res.message);
    }
    return res;
  }, [currentUser, hasPermission, refreshState, showToast]);

  // CADASTRO DE ITENS PARA ATIVIDADES DE PLASTICULTURA (VÍNCULO POR FAZENDA)
  const savePlasticultureCatalogItem = useCallback((item: PlasticultureCatalogItem) => {
    const isEdit = plasticultureCatalogItems.some(i => i.id === item.id);
    if (!hasPermission('access_catalogs') || !hasPermission(isEdit ? 'edit_records' : 'create_records')) {
      const msg = 'Você não tem permissão para salvar itens de cadastro.';
      showToast('error', 'Acesso Negado', msg);
      return { success: false, message: msg };
    }
    const res = AppStorageService.savePlasticultureCatalogItem(item, currentUser);
    if (res.success) {
      refreshState();
      showToast('success', 'Item Salvo', res.message);
    } else {
      showToast('error', 'Atenção', res.message);
    }
    return res;
  }, [plasticultureCatalogItems, currentUser, hasPermission, refreshState, showToast]);

  const deletePlasticultureCatalogItem = useCallback((itemId: string) => {
    if (!hasPermission('access_catalogs') || !hasPermission('delete_records')) {
      const msg = 'Você não tem permissão para excluir itens de cadastro.';
      showToast('error', 'Acesso Negado', msg);
      return { success: false, message: msg };
    }
    const res = AppStorageService.deletePlasticultureCatalogItem(itemId, currentUser);
    if (res.success) {
      refreshState();
      showToast('success', 'Item Removido', res.message);
    } else {
      showToast('error', 'Não foi possível excluir', res.message);
    }
    return res;
  }, [currentUser, hasPermission, refreshState, showToast]);

  const updateCoveredHectareValue = useCallback((value: number) => {
    if (!hasPermission('access_covered_areas') || !hasPermission('edit_records')) {
      const msg = 'Você não tem permissão para alterar o valor de referência por hectare.';
      showToast('error', 'Acesso Negado', msg);
      return { success: false, message: msg };
    }
    const res = AppStorageService.saveCoveredHectareValue(value, currentUser);
    if (res.success) {
      refreshState();
      showToast('success', 'Valor por Hectare Atualizado', res.message);
    } else {
      showToast('error', 'Valor Inválido', res.message);
    }
    return res;
  }, [currentUser, hasPermission, refreshState, showToast]);

  const resetFilters = useCallback(() => {
    setFiltersState({
      ...DEFAULT_FILTERS,
      farmId: restrictedFarmId || 'all'
    });
  }, [restrictedFarmId]);

  // Escopo automático por fazenda vinculada ao usuário autenticado
  const restrictedFarmCode = useMemo(() => {
    if (!restrictedFarmId) return null;
    return farms.find(f => f.id === restrictedFarmId)?.code || null;
  }, [farms, restrictedFarmId]);

  const scopedFarms = useMemo(
    () => (restrictedFarmId ? farms.filter(f => f.id === restrictedFarmId) : farms),
    [farms, restrictedFarmId]
  );

  const scopedSectors = useMemo(
    () => (restrictedFarmId ? sectors.filter(s => s.farmId === restrictedFarmId) : sectors),
    [sectors, restrictedFarmId]
  );

  const scopedParcels = useMemo(
    () => (restrictedFarmId ? parcels.filter(p => p.farmId === restrictedFarmId) : parcels),
    [parcels, restrictedFarmId]
  );

  const scopedStock = useMemo(
    () => (restrictedFarmId ? stock.filter(s => s.farmId === restrictedFarmId) : stock),
    [stock, restrictedFarmId]
  );

  const scopedMovements = useMemo(
    () => (restrictedFarmId ? movements.filter(m => m.farmId === restrictedFarmId) : movements),
    [movements, restrictedFarmId]
  );

  const scopedInstallations = useMemo(
    () => (restrictedFarmId ? installations.filter(i => i.farmId === restrictedFarmId) : installations),
    [installations, restrictedFarmId]
  );

  const scopedRemovals = useMemo(
    () => (restrictedFarmId ? removals.filter(r => r.farmId === restrictedFarmId) : removals),
    [removals, restrictedFarmId]
  );

  const scopedSerroplastRecords = useMemo(
    () => (restrictedFarmCode ? serroplastRecords.filter(r => r.sigla === restrictedFarmCode) : serroplastRecords),
    [serroplastRecords, restrictedFarmCode]
  );

  const scopedActivities = useMemo(
    () => (restrictedFarmId ? activities.filter(a => a.farmId === restrictedFarmId) : activities),
    [activities, restrictedFarmId]
  );

  const scopedPlasticulturePlanActivities = useMemo(
    () => (restrictedFarmId ? plasticulturePlanActivities.filter(a => a.farmId === restrictedFarmId) : plasticulturePlanActivities),
    [plasticulturePlanActivities, restrictedFarmId]
  );

  const scopedPlasticultureCatalogItems = useMemo(
    () =>
      restrictedFarmId
        ? plasticultureCatalogItems.filter(item => item.farmIds.includes(restrictedFarmId))
        : plasticultureCatalogItems,
    [plasticultureCatalogItems, restrictedFarmId]
  );

  // COMPUTED KPIS
  const kpis = useMemo(() => {
    const filteredParcels = scopedParcels.filter(p => {
      if (filters.farmId !== 'all' && p.farmId !== filters.farmId) return false;
      if (filters.sector !== 'all' && p.sector !== filters.sector) return false;
      if (filters.supervisor !== 'all' && p.supervisor !== filters.supervisor) return false;
      if (filters.variety !== 'all' && p.variety !== filters.variety) return false;
      if (filters.situation !== 'ALL' && p.situation !== filters.situation) return false;
      if (filters.hasDuplicatesOnly && !p.hasDuplicateFlag) return false;
      return true;
    });

    const totalHectares = filteredParcels.reduce((sum, p) => sum + p.hectares, 0);
    const coveredHectares = filteredParcels
      .filter(p => p.situation === 'Coberta')
      .reduce((sum, p) => sum + p.hectares, 0);

    const uncoveredHectares = filteredParcels
      .filter(p => p.situation === 'Descoberta')
      .reduce((sum, p) => sum + p.hectares, 0);

    const toConfirmHectares = filteredParcels
      .filter(p => p.situation === 'A Confirmar' || p.situation === 'Em Substituição')
      .reduce((sum, p) => sum + p.hectares, 0);

    const coverageRatePercentage = totalHectares > 0
      ? Math.round((coveredHectares / totalHectares) * 100)
      : 0;

    const totalParcelsCount = filteredParcels.length;
    const coveredParcelsCount = filteredParcels.filter(p => p.situation === 'Coberta').length;
    const uncoveredParcelsCount = filteredParcels.filter(p => p.situation === 'Descoberta').length;
    const toConfirmParcelsCount = filteredParcels.filter(p => p.situation === 'A Confirmar' || p.situation === 'Em Substituição').length;
    const duplicateParcelsCount = filteredParcels.filter(p => p.hasDuplicateFlag).length;

    const filteredStock = scopedStock.filter(item => {
      if (filters.farmId !== 'all' && item.farmId !== filters.farmId) return false;
      if (filters.plasticId !== 'all' && item.plasticId !== filters.plasticId) return false;
      if (filters.condition !== 'ALL' && item.condition !== filters.condition) return false;
      return true;
    });

    const filteredMovements = scopedMovements.filter(mov => {
      if (filters.farmId !== 'all' && mov.farmId !== filters.farmId) return false;
      if (filters.plasticId !== 'all' && mov.plasticId !== filters.plasticId) return false;
      return true;
    });

    const filteredInstallations = scopedInstallations.filter(inst => {
      if (filters.farmId !== 'all' && inst.farmId !== filters.farmId) return false;
      if (filters.plasticId !== 'all' && inst.plasticId !== filters.plasticId) return false;
      return true;
    });

    const filteredRemovals = scopedRemovals.filter(rem => {
      if (filters.farmId !== 'all' && rem.farmId !== filters.farmId) return false;
      if (filters.plasticId !== 'all' && rem.plasticId !== filters.plasticId) return false;
      return true;
    });

    const totalMetersPurchased = filteredMovements
      .filter(m => m.type === 'ENTRADA')
      .reduce((acc, m) => acc + m.meters, 0);

    const totalMetersInStockNew = filteredStock
      .filter(s => s.condition === 'NOVO')
      .reduce((acc, s) => acc + s.metersAvailable, 0);

    const totalMetersInStockReused = filteredStock
      .filter(s => s.condition === 'REUTILIZADO')
      .reduce((acc, s) => acc + s.metersAvailable, 0);

    const totalMetersInStock = totalMetersInStockNew + totalMetersInStockReused;

    const totalMetersInstalledActive = filteredInstallations
      .reduce((acc, i) => acc + (i.status === 'CONCLUIDO_RETIRADO' ? 0 : i.metersActiveRemaining), 0);

    const totalMetersRemoved = filteredRemovals.reduce((acc, r) => acc + r.totalMetersRemoved, 0);
    const totalMetersReused = filteredRemovals.reduce((acc, r) => acc + r.reusableMeters, 0);
    const totalMetersDiscarded = filteredRemovals.reduce((acc, r) => acc + r.discardedMeters, 0);
    const totalSavedFromReuse = filteredRemovals.reduce((acc, r) => acc + (r.reusableValue || 0), 0);
    const totalLossFromDiscard = filteredRemovals.reduce((acc, r) => acc + (r.discardedValue || 0), 0);

    const reuseRatePercentage = totalMetersRemoved > 0 ? Math.round((totalMetersReused / totalMetersRemoved) * 100) : 0;
    const lossRatePercentage = totalMetersRemoved > 0 ? Math.round((totalMetersDiscarded / totalMetersRemoved) * 100) : 0;

    const lowStockItems: { stock: StockItem; plastic: PlasticMaterial; farm: Farm }[] = [];
    scopedStock.forEach(item => {
      const plastic = plastics.find(p => p.id === item.plasticId);
      const farm = scopedFarms.find(f => f.id === item.farmId);
      if (plastic && farm && item.metersAvailable <= (plastic.minStockAlertMeters || 1000)) {
        lowStockItems.push({ stock: item, plastic, farm });
      }
    });

    return {
      totalHectares,
      coveredHectares,
      uncoveredHectares,
      toConfirmHectares,
      coverageRatePercentage,
      totalParcelsCount,
      coveredParcelsCount,
      uncoveredParcelsCount,
      toConfirmParcelsCount,
      duplicateParcelsCount,
      totalMetersPurchased,
      totalMetersInStock,
      totalMetersInStockNew,
      totalMetersInStockReused,
      totalMetersInstalledActive,
      totalMetersRemoved,
      totalMetersReused,
      totalMetersDiscarded,
      reuseRatePercentage,
      lossRatePercentage,
      totalSavedFromReuse,
      totalLossFromDiscard,
      lowStockAlertsCount: lowStockItems.length,
      lowStockItems
    };
  }, [scopedParcels, scopedStock, scopedMovements, scopedInstallations, scopedRemovals, plastics, scopedFarms, filters]);

  const farmAreaSummary = useMemo(
    () => computeFarmAreaSummary(scopedFarms, scopedParcels, scopedSerroplastRecords, coveredHectareValue),
    [scopedFarms, scopedParcels, scopedSerroplastRecords, coveredHectareValue]
  );

  return (
    <AppContext.Provider
      value={{
        farms: scopedFarms,
        allFarms: farms,
        sectors: scopedSectors,
        parcels: scopedParcels,
        plastics,
        stock: scopedStock,
        movements: scopedMovements,
        installations: scopedInstallations,
        removals: scopedRemovals,
        auditLogs,
        serroplastRecords: scopedSerroplastRecords,
        activities: scopedActivities,
        activityTypes,
        plasticulturePlanActivities: scopedPlasticulturePlanActivities,
        plasticultureCatalogItems: scopedPlasticultureCatalogItems,
        isAuthenticated,
        isAuthLoading,
        needsAdminBootstrap,
        bootstrapAdminEmail,
        appPublicUrl,
        currentUser,
        availableUsers: managedUsers.length > 0 ? managedUsers : [currentUser],
        isAdmin,
        isFarmRestricted,
        restrictedFarmId,
        hasPermission,
        canPerform,
        loginWithPassword,
        bootstrapAdminAccount,
        activateInviteAccount,
        logout,
        managedUsers,
        userInvites,
        isLoadingUsers,
        loadUsersAndInvites,
        saveManagedUser,
        toggleManagedUserStatus,
        deleteManagedUser,
        createUserInvite,
        revokeUserInvite,
        filters,
        setFilters,
        resetFilters,
        saveFarm,
        saveSector,
        saveParcel,
        confirmParcelSituation,
        addCoverageToParcel,
        importOfficialParcels,
        savePlastic,
        addStockEntry,
        addStockExit,
        transferStock,
        registerInstallation,
        registerRemoval,
        saveSerroplastRecord,
        toggleSerroplastStatus,
        importSerroplastBatch,
        saveActivity,
        updateActivityStatus,
        deleteActivity,
        saveActivityType,
        deleteActivityType,
        savePlasticulturePlanActivity,
        updatePlasticulturePlanActivityStatus,
        deletePlasticulturePlanActivity,
        savePlasticultureCatalogItem,
        deletePlasticultureCatalogItem,
        resetToDefaults,
        exportBackupJson,
        importBackupJson,
        toasts,
        removeToast,
        showToast,
        kpis,
        coveredHectareValue,
        updateCoveredHectareValue,
        farmAreaSummary
      }}
    >
      {children}
    </AppContext.Provider>
  );
};

export const useApp = (): AppContextType => {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp deve ser utilizado dentro de um AppProvider');
  return context;
};
