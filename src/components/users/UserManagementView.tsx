import React, { useEffect, useMemo, useState } from 'react';
import QRCode from 'qrcode';
import {
  AlertTriangle,
  Ban,
  Check,
  CheckCircle2,
  Copy,
  Download,
  Edit3,
  Globe,
  KeyRound,
  Laptop,
  Link2,
  Lock,
  Plus,
  QrCode,
  Search,
  Share,
  Shield,
  ShieldCheck,
  Smartphone,
  Trash2,
  Unlock,
  UserPlus,
  Users,
  X,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import {
  UserInviteLink,
  UserPermissionKey,
  UserPermissions,
  UserProfile,
  UserRole,
  UserStatus,
} from '../../types';
import {
  PERMISSION_DEFINITIONS,
  getDefaultPermissionsForRole,
  normalizePermissions,
} from '../../utils/permissions';
import { PWAInstallButton } from '../common/PWAInstallButton';

const EXPIRATION_OPTIONS = [
  { label: '24 horas', hours: 24 },
  { label: '72 horas (3 dias)', hours: 72 },
  { label: '7 dias', hours: 168 },
  { label: '30 dias', hours: 720 },
];

export const UserManagementView: React.FC = () => {
  const {
    isAdmin,
    currentUser,
    allFarms,
    managedUsers,
    userInvites,
    isLoadingUsers,
    appPublicUrl,
    saveManagedUser,
    toggleManagedUserStatus,
    deleteManagedUser,
    createUserInvite,
    revokeUserInvite,
    showToast,
  } = useApp();

  const [subTab, setSubTab] = useState<'users' | 'invites' | 'publish'>('users');
  const [searchTerm, setSearchTerm] = useState('');
  const [filterFarm, setFilterFarm] = useState<string>('ALL_FILTER');
  const [filterStatus, setFilterStatus] = useState<'ALL' | UserStatus>('ALL');

  // User Create/Edit Modal
  const [isUserModalOpen, setIsUserModalOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<UserProfile | null>(null);
  const [formName, setFormName] = useState('');
  const [formEmail, setFormEmail] = useState('');
  const [formLogin, setFormLogin] = useState('');
  const [formRole, setFormRole] = useState<UserRole>('Operador');
  const [formJobTitle, setFormJobTitle] = useState('');
  const [formFarmScope, setFormFarmScope] = useState<string>('ALL');
  const [formStatus, setFormStatus] = useState<UserStatus>('Ativo');
  const [formPassword, setFormPassword] = useState('');
  const [formPermissions, setFormPermissions] = useState<UserPermissions>(() =>
    getDefaultPermissionsForRole('Operador')
  );
  const [isSavingUser, setIsSavingUser] = useState(false);

  // Delete Confirmation Modal
  const [deletingUser, setDeletingUser] = useState<UserProfile | null>(null);

  // QR / Invite Modal
  const [qrModalUser, setQrModalUser] = useState<UserProfile | null>(null);
  const [inviteValidityHours, setInviteValidityHours] = useState<number>(72);
  const [activeInvite, setActiveInvite] = useState<UserInviteLink | null>(null);
  const [qrDataUrl, setQrDataUrl] = useState<string>('');
  const [isGeneratingInvite, setIsGeneratingInvite] = useState(false);

  // Official App QR Code
  const [officialAppQrUrl, setOfficialAppQrUrl] = useState<string>('');

  const resolvedPublicUrl = useMemo(() => {
    if (appPublicUrl && appPublicUrl.startsWith('http')) return appPublicUrl;
    if (typeof window !== 'undefined') return window.location.origin;
    return '';
  }, [appPublicUrl]);

  useEffect(() => {
    if (!resolvedPublicUrl) return;
    QRCode.toDataURL(resolvedPublicUrl, {
      width: 280,
      margin: 2,
      color: { dark: '#4A072E', light: '#FFFFFF' },
    })
      .then(setOfficialAppQrUrl)
      .catch(() => setOfficialAppQrUrl(''));
  }, [resolvedPublicUrl]);

  useEffect(() => {
    if (!activeInvite?.url) {
      setQrDataUrl('');
      return;
    }
    QRCode.toDataURL(activeInvite.url, {
      width: 320,
      margin: 2,
      color: { dark: '#4A072E', light: '#FFFFFF' },
    })
      .then(setQrDataUrl)
      .catch(() => setQrDataUrl(''));
  }, [activeInvite]);

  const stats = useMemo(() => {
    const total = managedUsers.length;
    const ativos = managedUsers.filter(u => u.status === 'Ativo').length;
    const bloqueados = managedUsers.filter(u => u.status === 'Inativo').length;
    const convitesAtivos = userInvites.filter(i => i.status === 'Ativo').length;
    return { total, ativos, bloqueados, convitesAtivos };
  }, [managedUsers, userInvites]);

  const filteredUsers = useMemo(() => {
    const q = searchTerm.trim().toLowerCase();
    return managedUsers.filter(u => {
      if (filterStatus !== 'ALL' && u.status !== filterStatus) return false;
      if (filterFarm !== 'ALL_FILTER' && u.farmScope !== filterFarm) return false;
      if (q) {
        const hay = `${u.name} ${u.email} ${u.login || ''} ${u.jobTitle || ''} ${u.farmAssigned || ''}`.toLowerCase();
        if (!hay.includes(q)) return false;
      }
      return true;
    });
  }, [managedUsers, searchTerm, filterFarm, filterStatus]);

  if (!isAdmin) {
    return (
      <div className="bg-white border border-[#F0E4EB] rounded-2xl p-8 text-center space-y-3 shadow-xs">
        <Lock className="w-10 h-10 text-[#8E1057] mx-auto" />
        <h2 className="text-lg font-extrabold text-[#1E120D]">Acesso Exclusivo do Administrador</h2>
        <p className="text-xs text-[#1E120D]/65 max-w-md mx-auto">
          Somente o administrador do sistema pode cadastrar usuários, configurar permissões individuais ou gerar links e QR Codes de acesso.
        </p>
      </div>
    );
  }

  const openCreateUserModal = () => {
    setEditingUser(null);
    setFormName('');
    setFormEmail('');
    setFormLogin('');
    setFormRole('Operador');
    setFormJobTitle('');
    setFormFarmScope(allFarms[0]?.id || 'ALL');
    setFormStatus('Ativo');
    setFormPassword('');
    setFormPermissions(getDefaultPermissionsForRole('Operador'));
    setIsUserModalOpen(true);
  };

  const openEditUserModal = (user: UserProfile) => {
    setEditingUser(user);
    setFormName(user.name);
    setFormEmail(user.email);
    setFormLogin(user.login || '');
    setFormRole(user.role);
    setFormJobTitle(user.jobTitle || '');
    setFormFarmScope(user.farmScope || 'ALL');
    setFormStatus(user.status);
    setFormPassword('');
    setFormPermissions(normalizePermissions(user.role, user.permissions));
    setIsUserModalOpen(true);
  };

  const handleRoleChange = (role: UserRole) => {
    setFormRole(role);
    setFormPermissions(getDefaultPermissionsForRole(role));
    if (role === 'Administrador') {
      setFormFarmScope('ALL');
    }
  };

  const togglePermission = (key: UserPermissionKey) => {
    if (key === 'access_user_management' && formRole !== 'Administrador') {
      return;
    }
    setFormPermissions(prev => ({
      ...prev,
      [key]: !prev[key],
    }));
  };

  const handleSaveUserSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSavingUser(true);
    const res = await saveManagedUser({
      id: editingUser?.id,
      name: formName,
      email: formEmail,
      login: formLogin,
      role: formRole,
      jobTitle: formJobTitle,
      farmScope: formFarmScope,
      status: formStatus,
      permissions: formPermissions,
      ...(editingUser ? { newPassword: formPassword } : { initialPassword: formPassword }),
    });
    setIsSavingUser(false);
    if (res.success) {
      setIsUserModalOpen(false);
    }
  };

  const handleOpenQrForUser = async (user: UserProfile) => {
    setQrModalUser(user);
    const existingActive = userInvites.find(i => i.userId === user.id && i.status === 'Ativo');
    if (existingActive) {
      setActiveInvite(existingActive);
      return;
    }
    setActiveInvite(null);
    setIsGeneratingInvite(true);
    const res = await createUserInvite(user.id, inviteValidityHours);
    setIsGeneratingInvite(false);
    if (res.success && res.invite) {
      setActiveInvite(res.invite);
    }
  };

  const handleGenerateFreshInvite = async () => {
    if (!qrModalUser) return;
    setIsGeneratingInvite(true);
    const res = await createUserInvite(qrModalUser.id, inviteValidityHours);
    setIsGeneratingInvite(false);
    if (res.success && res.invite) {
      setActiveInvite(res.invite);
    }
  };

  const copyToClipboard = async (text: string, label: string) => {
    try {
      await navigator.clipboard.writeText(text);
      showToast('success', 'Copiado', `${label} copiado para a área de transferência.`);
    } catch {
      showToast('info', 'Link disponível', text);
    }
  };

  const downloadQrImage = (dataUrl: string, filename: string) => {
    if (!dataUrl) return;
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const countActivePermissions = (perms: UserPermissions) =>
    Object.values(perms).filter(Boolean).length;

  return (
    <div className="space-y-6 text-[#1E120D]">
      {/* Cabeçalho */}
      <div className="bg-white border border-[#F0E4EB] rounded-2xl p-5 shadow-xs flex flex-col lg:flex-row lg:items-center justify-between gap-4">
        <div>
          <div className="flex items-center gap-2 text-xs font-bold text-[#8E1057] uppercase tracking-wider mb-1">
            <ShieldCheck className="w-4 h-4 text-[#D65F95]" />
            Administração & Segurança de Acesso
          </div>
          <h2 className="text-xl font-extrabold text-[#1E120D] tracking-tight">
            Usuários e Acessos
          </h2>
          <p className="text-xs text-[#1E120D]/65 mt-0.5">
            Controle quem entra no Plasticultura Fazendas, permissões por módulo, restrição por fazenda, convites por QR Code e publicação PWA.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2.5">
          <PWAInstallButton variant="card" />
          <button
            type="button"
            onClick={openCreateUserModal}
            className="min-h-[44px] flex items-center gap-2 bg-[#8E1057] hover:bg-[#750D48] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition whitespace-nowrap shrink-0"
          >
            <UserPlus className="w-4 h-4" />
            <span>Cadastrar Usuário</span>
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-3.5">
        <div className="bg-white border border-[#F0E4EB] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#1E120D]/60 block">
            Usuários Cadastrados
          </span>
          <div className="text-2xl font-black text-[#1E120D] mt-1 tabular-nums">{stats.total}</div>
          <span className="text-[11px] text-[#1E120D]/60">Contas no controle de acesso</span>
        </div>
        <div className="bg-white border border-[#F0E4EB] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-700 block">
            Usuários Ativos
          </span>
          <div className="text-2xl font-black text-emerald-700 mt-1 tabular-nums">{stats.ativos}</div>
          <span className="text-[11px] text-[#1E120D]/60">Autorizados a entrar</span>
        </div>
        <div className="bg-white border border-[#F0E4EB] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 block">
            Bloqueados / Inativos
          </span>
          <div className="text-2xl font-black text-rose-700 mt-1 tabular-nums">{stats.bloqueados}</div>
          <span className="text-[11px] text-[#1E120D]/60">Acesso suspenso</span>
        </div>
        <div className="bg-white border border-[#F0E4EB] rounded-xl p-4 shadow-xs">
          <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E1057] block">
            Convites QR Ativos
          </span>
          <div className="text-2xl font-black text-[#8E1057] mt-1 tabular-nums">{stats.convitesAtivos}</div>
          <span className="text-[11px] text-[#1E120D]/60">Links dentro da validade</span>
        </div>
      </div>

      {/* Sub-Navegação */}
      <div className="flex flex-wrap items-center gap-1.5 p-1.5 bg-white border border-[#F0E4EB] rounded-xl shadow-xs w-fit">
        <button
          type="button"
          onClick={() => setSubTab('users')}
          className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            subTab === 'users'
              ? 'bg-[#8E1057] text-white shadow-xs'
              : 'text-[#1E120D]/70 hover:text-[#1E120D] hover:bg-[#FAF6F8]'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>Usuários e Permissões</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('invites')}
          className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            subTab === 'invites'
              ? 'bg-[#8E1057] text-white shadow-xs'
              : 'text-[#1E120D]/70 hover:text-[#1E120D] hover:bg-[#FAF6F8]'
          }`}
        >
          <QrCode className="w-4 h-4" />
          <span>Links de Convite & QR Codes</span>
        </button>
        <button
          type="button"
          onClick={() => setSubTab('publish')}
          className={`min-h-[40px] px-4 py-2 rounded-lg text-xs font-bold transition flex items-center gap-2 whitespace-nowrap ${
            subTab === 'publish'
              ? 'bg-[#8E1057] text-white shadow-xs'
              : 'text-[#1E120D]/70 hover:text-[#1E120D] hover:bg-[#FAF6F8]'
          }`}
        >
          <Smartphone className="w-4 h-4" />
          <span>Publicação & Aplicativo (PWA)</span>
        </button>
      </div>

      {/* TAB 1: USUÁRIOS E PERMISSÕES */}
      {subTab === 'users' && (
        <div className="bg-white border border-[#F0E4EB] rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#F0E4EB] grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="relative lg:col-span-2">
              <Search className="w-4 h-4 text-[#1E120D]/40 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                placeholder="Buscar por nome, e-mail, login ou cargo..."
                className="w-full min-h-[42px] bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl pl-9 pr-3 text-xs focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
              />
            </div>

            <select
              value={filterFarm}
              onChange={(e) => setFilterFarm(e.target.value)}
              className="min-h-[42px] bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
            >
              <option value="ALL_FILTER">Todas as Fazendas (Filtro)</option>
              <option value="ALL">Acesso Global (4 Fazendas)</option>
              {allFarms.map(f => (
                <option key={f.id} value={f.id}>
                  {f.name} ({f.code})
                </option>
              ))}
            </select>

            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value as 'ALL' | UserStatus)}
              className="min-h-[42px] bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl px-3 text-xs font-medium focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
            >
              <option value="ALL">Todos os Status</option>
              <option value="Ativo">Somente Ativos</option>
              <option value="Inativo">Somente Inativos / Bloqueados</option>
            </select>
          </div>

          {isLoadingUsers ? (
            <div className="p-8 text-center text-xs text-[#1E120D]/60">Carregando usuários...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="p-8 text-center space-y-3">
              <p className="text-xs text-[#1E120D]/60">Nenhum usuário encontrado para os filtros aplicados.</p>
              <button
                type="button"
                onClick={openCreateUserModal}
                className="px-4 py-2 rounded-xl bg-[#8E1057] text-white text-xs font-bold"
              >
                Cadastrar Primeiro Usuário
              </button>
            </div>
          ) : (
            <>
              {/* Desktop Table */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-left text-xs">
                  <thead className="bg-[#FAF6F8] text-[#1E120D]/80 font-bold border-b border-[#F0E4EB] uppercase tracking-wider text-[11px]">
                    <tr>
                      <th className="py-3 px-4">Usuário</th>
                      <th className="py-3 px-4">Cargo / Perfil</th>
                      <th className="py-3 px-4">Fazenda Vinculada</th>
                      <th className="py-3 px-4">Permissões</th>
                      <th className="py-3 px-4">Status</th>
                      <th className="py-3 px-4 text-right">Ações</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-[#F0E4EB]">
                    {filteredUsers.map(u => {
                      const activePermsCount = countActivePermissions(u.permissions);
                      const isSelf = u.id === currentUser.id;
                      return (
                        <tr key={u.id} className="hover:bg-[#FAF6F8]/60 transition">
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#1E120D] flex items-center gap-2">
                              <span>{u.name}</span>
                              {isSelf && (
                                <span className="text-[10px] font-bold text-[#8E1057]">· Você</span>
                              )}
                            </div>
                            <div className="text-[11px] text-[#1E120D]/65 mt-0.5">
                              {u.email} · <span className="font-mono">{u.login || u.email.split('@')[0]}</span>
                            </div>
                            {!u.hasPasswordSet && (
                              <div className="text-[10px] font-semibold text-amber-700 mt-0.5">
                                Aguardando ativação por senha ou QR Code
                              </div>
                            )}
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-bold text-[#1E120D]">{u.role}</div>
                            <div className="text-[11px] text-[#1E120D]/60">{u.jobTitle || 'Função padrão'}</div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span className="font-semibold text-[#8E1057]">
                              {u.farmScope === 'ALL'
                                ? 'Todas as Fazendas'
                                : allFarms.find(f => f.id === u.farmScope)?.name || u.farmAssigned || u.farmScope}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="font-semibold text-[#1E120D] tabular-nums">
                              {activePermsCount} de 9 acessos
                            </div>
                            <div className="text-[11px] text-[#1E120D]/60">
                              {u.permissions.edit_records ? 'Edição' : 'Leitura'} ·{' '}
                              {u.permissions.access_reports ? 'Relatórios' : 'Sem relatórios'}
                            </div>
                          </td>
                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center gap-1 text-[11px] font-bold ${
                                u.status === 'Ativo' ? 'text-emerald-700' : 'text-rose-700'
                              }`}
                            >
                              {u.status === 'Ativo' ? (
                                <CheckCircle2 className="w-3.5 h-3.5" />
                              ) : (
                                <Ban className="w-3.5 h-3.5" />
                              )}
                              {u.status}
                            </span>
                          </td>
                          <td className="py-3.5 px-4">
                            <div className="flex items-center justify-end gap-1.5">
                              <button
                                type="button"
                                onClick={() => handleOpenQrForUser(u)}
                                className="min-h-[36px] px-2.5 py-1.5 rounded-lg bg-[#FAF6F8] hover:bg-[#F0E4EB] text-[#8E1057] border border-[#D65F95]/40 font-bold text-[11px] flex items-center gap-1 transition"
                                title="Gerar QR Code e Link de Convite"
                              >
                                <QrCode className="w-3.5 h-3.5" />
                                <span>QR Code</span>
                              </button>
                              <button
                                type="button"
                                onClick={() => openEditUserModal(u)}
                                className="min-h-[36px] p-2 rounded-lg text-[#1E120D]/70 hover:text-[#8E1057] hover:bg-[#FAF6F8] transition"
                                title="Editar usuário e permissões"
                              >
                                <Edit3 className="w-4 h-4" />
                              </button>
                              <button
                                type="button"
                                onClick={() =>
                                  toggleManagedUserStatus(u.id, u.status === 'Ativo' ? 'Inativo' : 'Ativo')
                                }
                                disabled={isSelf && u.status === 'Ativo'}
                                className={`min-h-[36px] p-2 rounded-lg transition disabled:opacity-40 ${
                                  u.status === 'Ativo'
                                    ? 'text-amber-700 hover:bg-amber-50'
                                    : 'text-emerald-700 hover:bg-emerald-50'
                                }`}
                                title={u.status === 'Ativo' ? 'Bloquear usuário' : 'Ativar usuário'}
                              >
                                {u.status === 'Ativo' ? <Ban className="w-4 h-4" /> : <Unlock className="w-4 h-4" />}
                              </button>
                              <button
                                type="button"
                                onClick={() => setDeletingUser(u)}
                                disabled={isSelf}
                                className="min-h-[36px] p-2 rounded-lg text-rose-700 hover:bg-rose-50 disabled:opacity-30 transition"
                                title="Excluir usuário"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card List */}
              <div className="md:hidden divide-y divide-[#F0E4EB]">
                {filteredUsers.map(u => {
                  const isSelf = u.id === currentUser.id;
                  return (
                    <div key={u.id} className="p-4 space-y-3">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h4 className="font-extrabold text-sm text-[#1E120D]">{u.name}</h4>
                          <p className="text-xs text-[#1E120D]/65">{u.email}</p>
                        </div>
                        <span
                          className={`text-xs font-bold ${
                            u.status === 'Ativo' ? 'text-emerald-700' : 'text-rose-700'
                          }`}
                        >
                          {u.status}
                        </span>
                      </div>
                      <div className="text-xs text-[#1E120D]/75 space-y-1">
                        <div>
                          <strong>{u.role}</strong> · {u.jobTitle || 'Função padrão'}
                        </div>
                        <div className="text-[#8E1057] font-semibold">
                          Fazenda:{' '}
                          {u.farmScope === 'ALL'
                            ? 'Todas as Fazendas'
                            : allFarms.find(f => f.id === u.farmScope)?.name || u.farmAssigned}
                        </div>
                        <div className="tabular-nums">
                          {countActivePermissions(u.permissions)} de 9 permissões ativas
                        </div>
                      </div>
                      <div className="grid grid-cols-2 gap-2 pt-1">
                        <button
                          type="button"
                          onClick={() => handleOpenQrForUser(u)}
                          className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-[#FAF6F8] border border-[#D65F95]/40 text-[#8E1057] text-xs font-bold"
                        >
                          <QrCode className="w-4 h-4" />
                          <span>QR Code</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => openEditUserModal(u)}
                          className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl bg-[#8E1057] text-white text-xs font-bold"
                        >
                          <Edit3 className="w-4 h-4" />
                          <span>Permissões</span>
                        </button>
                        <button
                          type="button"
                          disabled={isSelf && u.status === 'Ativo'}
                          onClick={() =>
                            toggleManagedUserStatus(u.id, u.status === 'Ativo' ? 'Inativo' : 'Ativo')
                          }
                          className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl border border-[#F0E4EB] text-xs font-semibold text-amber-800 disabled:opacity-40"
                        >
                          {u.status === 'Ativo' ? 'Bloquear' : 'Ativar'}
                        </button>
                        <button
                          type="button"
                          disabled={isSelf}
                          onClick={() => setDeletingUser(u)}
                          className="min-h-[44px] flex items-center justify-center gap-1.5 rounded-xl border border-rose-200 text-xs font-semibold text-rose-700 disabled:opacity-40"
                        >
                          Excluir
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </>
          )}
        </div>
      )}

      {/* TAB 2: LINKS DE CONVITE & QR CODES */}
      {subTab === 'invites' && (
        <div className="bg-white border border-[#F0E4EB] rounded-2xl shadow-xs overflow-hidden">
          <div className="p-4 border-b border-[#F0E4EB] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h3 className="font-bold text-sm text-[#1E120D]">
                Links de Convite e QR Codes Gerados ({userInvites.length})
              </h3>
              <p className="text-xs text-[#1E120D]/60">
                Cada convite possui validade definida e pode ser revogado imediatamente pelo administrador.
              </p>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              {managedUsers.filter(u => u.status === 'Ativo').length > 0 && (
                <button
                  type="button"
                  onClick={() => {
                    const firstNonSelf =
                      managedUsers.find(u => u.status === 'Ativo' && u.id !== currentUser.id) ||
                      managedUsers.find(u => u.status === 'Ativo');
                    if (firstNonSelf) handleOpenQrForUser(firstNonSelf);
                  }}
                  className="min-h-[42px] px-4 py-2 rounded-xl bg-[#8E1057] hover:bg-[#750D48] text-white text-xs font-bold flex items-center gap-2 transition"
                >
                  <Plus className="w-4 h-4" />
                  <span>Gerar Novo QR Code / Link</span>
                </button>
              )}
            </div>
          </div>

          {userInvites.length === 0 ? (
            <div className="p-8 text-center space-y-2">
              <QrCode className="w-10 h-10 text-[#D65F95] mx-auto" />
              <p className="text-sm font-bold text-[#1E120D]">Nenhum convite gerado ainda</p>
              <p className="text-xs text-[#1E120D]/60">
                Clique em "QR Code" ao lado de qualquer usuário ativo para gerar um link com validade.
              </p>
            </div>
          ) : (
            <div className="divide-y divide-[#F0E4EB]">
              {userInvites.map(inv => {
                const owner = managedUsers.find(u => u.id === inv.userId);
                return (
                  <div
                    key={inv.id}
                    className="p-4 flex flex-col md:flex-row md:items-center justify-between gap-3 hover:bg-[#FAF6F8]/60 transition"
                  >
                    <div className="space-y-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <span className="font-bold text-sm text-[#1E120D]">{inv.userName}</span>
                        <span className="text-xs text-[#1E120D]/55">· {inv.userEmail}</span>
                        <span
                          className={`text-xs font-bold ${
                            inv.status === 'Ativo'
                              ? 'text-emerald-700'
                              : inv.status === 'Utilizado'
                                ? 'text-[#8E1057]'
                                : 'text-rose-700'
                          }`}
                        >
                          · {inv.status}
                        </span>
                      </div>
                      <div className="text-[11px] text-[#1E120D]/65 font-mono break-all">{inv.url}</div>
                      <div className="text-[11px] text-[#1E120D]/60 tabular-nums">
                        Criado em {new Date(inv.createdAt).toLocaleString('pt-BR')} · Expira em{' '}
                        {new Date(inv.expiresAt).toLocaleString('pt-BR')}
                      </div>
                    </div>

                    <div className="flex flex-wrap items-center gap-2 shrink-0">
                      {inv.status === 'Ativo' && owner && (
                        <button
                          type="button"
                          onClick={() => {
                            setQrModalUser(owner);
                            setActiveInvite(inv);
                          }}
                          className="min-h-[40px] px-3 py-1.5 rounded-lg bg-[#FAF6F8] hover:bg-[#F0E4EB] text-[#8E1057] border border-[#D65F95]/40 text-xs font-bold flex items-center gap-1.5"
                        >
                          <QrCode className="w-3.5 h-3.5" />
                          <span>Ver QR Code</span>
                        </button>
                      )}
                      {inv.status === 'Ativo' && (
                        <>
                          <button
                            type="button"
                            onClick={() => copyToClipboard(inv.url, 'Link de convite')}
                            className="min-h-[40px] px-3 py-1.5 rounded-lg border border-[#F0E4EB] hover:bg-[#FAF6F8] text-xs font-semibold flex items-center gap-1.5"
                          >
                            <Copy className="w-3.5 h-3.5" />
                            <span>Copiar</span>
                          </button>
                          <button
                            type="button"
                            onClick={() => revokeUserInvite(inv.id)}
                            className="min-h-[40px] px-3 py-1.5 rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50 text-xs font-bold flex items-center gap-1.5"
                          >
                            <Ban className="w-3.5 h-3.5" />
                            <span>Revogar</span>
                          </button>
                        </>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* TAB 3: PUBLICAÇÃO & APLICATIVO (PWA) */}
      {subTab === 'publish' && (
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-5">
          {/* Official URL + QR */}
          <div className="lg:col-span-6 bg-white border border-[#F0E4EB] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#8E1057] uppercase tracking-wider">
              <Globe className="w-4 h-4" />
              Link Oficial de Acesso
            </div>
            <h3 className="text-base font-extrabold text-[#1E120D]">
              Endereço Web & QR Code do Aplicativo
            </h3>
            <p className="text-xs text-[#1E120D]/70 leading-relaxed">
              Compartilhe o link oficial ou o QR Code abaixo para que usuários autorizados abram o aplicativo no celular ou notebook e façam login com suas credenciais.
            </p>

            <div className="p-3 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] flex flex-col sm:flex-row sm:items-center justify-between gap-2">
              <span className="text-xs font-mono text-[#1E120D] break-all">{resolvedPublicUrl}</span>
              <button
                type="button"
                onClick={() => copyToClipboard(resolvedPublicUrl, 'Link oficial do aplicativo')}
                className="min-h-[40px] shrink-0 px-3 py-1.5 rounded-lg bg-[#8E1057] hover:bg-[#750D48] text-white text-xs font-bold flex items-center justify-center gap-1.5"
              >
                <Copy className="w-3.5 h-3.5" />
                <span>Copiar Link</span>
              </button>
            </div>

            {officialAppQrUrl && (
              <div className="flex flex-col sm:flex-row items-center gap-4 pt-2">
                <img
                  src={officialAppQrUrl}
                  alt="QR Code oficial do Plasticultura Fazendas"
                  className="w-40 h-40 rounded-xl border border-[#F0E4EB] p-1.5 bg-white"
                />
                <div className="space-y-2 text-xs text-[#1E120D]/75">
                  <p className="font-bold text-[#1E120D]">Acesso Rápido via Câmera</p>
                  <p>
                    Aponte a câmera do celular para abrir a tela de login do <strong>Plasticultura Fazendas</strong>. Para novos usuários sem senha, utilize um link de convite individual na aba anterior.
                  </p>
                  <button
                    type="button"
                    onClick={() =>
                      downloadQrImage(officialAppQrUrl, 'qrcode-plasticultura-fazendas.png')
                    }
                    className="min-h-[40px] px-3.5 py-2 rounded-xl border border-[#D65F95]/50 text-[#8E1057] font-bold inline-flex items-center gap-1.5 hover:bg-[#FAF6F8]"
                  >
                    <Download className="w-3.5 h-3.5" />
                    <span>Baixar QR Code Oficial</span>
                  </button>
                </div>
              </div>
            )}
          </div>

          {/* PWA Installation Guide */}
          <div className="lg:col-span-6 bg-white border border-[#F0E4EB] rounded-2xl p-5 shadow-xs space-y-4">
            <div className="flex items-center gap-2 text-xs font-bold text-[#8E1057] uppercase tracking-wider">
              <Download className="w-4 h-4" />
              Aplicativo Instalável (PWA)
            </div>
            <h3 className="text-base font-extrabold text-[#1E120D]">
              Instalar Plasticultura Fazendas no Dispositivo
            </h3>
            <p className="text-xs text-[#1E120D]/70 leading-relaxed">
              O sistema está configurado com manifesto PWA, ícone próprio El Ciruelo, tela de abertura dedicada e funcionamento em tela cheia sem barra de navegador.
            </p>

            <div>
              <PWAInstallButton variant="card" showFallbackInfo />
            </div>

            <div className="space-y-2.5 text-xs pt-2">
              <div className="p-3.5 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB]">
                <div className="font-bold text-[#1E120D] flex items-center gap-2 mb-1">
                  <Smartphone className="w-4 h-4 text-[#8E1057]" />
                  <span>Celulares Android (Chrome)</span>
                </div>
                <p className="text-[#1E120D]/70">
                  Clique em <strong>Instalar Aplicativo</strong> ou abra o menu <strong>⋮ → Instalar aplicativo</strong> para criar o atalho na tela inicial.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB]">
                <div className="font-bold text-[#1E120D] flex items-center gap-2 mb-1">
                  <Share className="w-4 h-4 text-[#8E1057]" />
                  <span>iPhone / iPad (Safari)</span>
                </div>
                <p className="text-[#1E120D]/70">
                  Toque em <strong>Compartilhar</strong> no Safari e escolha <strong>Adicionar à Tela de Início</strong>.
                </p>
              </div>
              <div className="p-3.5 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB]">
                <div className="font-bold text-[#1E120D] flex items-center gap-2 mb-1">
                  <Laptop className="w-4 h-4 text-[#8E1057]" />
                  <span>Notebooks e Computadores (Chrome / Edge)</span>
                </div>
                <p className="text-[#1E120D]/70">
                  Clique no ícone de instalação na barra de endereço para fixar o <strong>Plasticultura Fazendas</strong> na área de trabalho.
                </p>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* MODAL CADASTRO / EDIÇÃO + PERMISSÕES INDIVIDUAIS */}
      {isUserModalOpen && (
        <div className="fixed inset-0 bg-[#1E120D]/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full shadow-2xl border border-[#F0E4EB] my-8 overflow-hidden">
            <div className="p-5 border-b border-[#F0E4EB] flex items-center justify-between bg-[#FAF6F8]">
              <div>
                <h3 className="text-base font-extrabold text-[#1E120D]">
                  {editingUser ? `Editar Usuário — ${editingUser.name}` : 'Cadastrar Novo Usuário'}
                </h3>
                <p className="text-xs text-[#1E120D]/60">
                  Defina dados de identificação, fazenda vinculada e permissões individuais por módulo.
                </p>
              </div>
              <button
                type="button"
                onClick={() => setIsUserModalOpen(false)}
                className="p-2 rounded-lg text-[#1E120D]/50 hover:text-[#1E120D]"
                aria-label="Fechar modal"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSaveUserSubmit} className="p-5 space-y-5 max-h-[78vh] overflow-y-auto">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3.5 text-xs">
                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Nome Completo *</label>
                  <input
                    type="text"
                    value={formName}
                    onChange={(e) => setFormName(e.target.value)}
                    placeholder="Ex: Edicarlos Oliveira"
                    className="w-full min-h-[42px] bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">E-mail *</label>
                  <input
                    type="text"
                    value={formEmail}
                    onChange={(e) => setFormEmail(e.target.value)}
                    placeholder="usuario@elciruelo.com.br"
                    className="w-full min-h-[42px] bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                    required
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Login de Acesso (opcional)</label>
                  <input
                    type="text"
                    value={formLogin}
                    onChange={(e) => setFormLogin(e.target.value)}
                    placeholder="Gerado automaticamente pelo e-mail se vazio"
                    className="w-full min-h-[42px] bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Cargo ou Função</label>
                  <input
                    type="text"
                    value={formJobTitle}
                    onChange={(e) => setFormJobTitle(e.target.value)}
                    placeholder="Ex: Supervisor de Plasticultura"
                    className="w-full min-h-[42px] bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  />
                </div>
                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Perfil de Acesso *</label>
                  <select
                    value={formRole}
                    onChange={(e) => handleRoleChange(e.target.value as UserRole)}
                    className="w-full min-h-[42px] bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl px-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  >
                    <option value="Operador">Operador</option>
                    <option value="Gestor">Gestor</option>
                    <option value="Administrador">Administrador</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Fazenda Vinculada *</label>
                  <select
                    value={formFarmScope}
                    onChange={(e) => setFormFarmScope(e.target.value)}
                    className="w-full min-h-[42px] bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl px-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  >
                    <option value="ALL">Todas as Fazendas (Acesso Global)</option>
                    {allFarms.map(f => (
                      <option key={f.id} value={f.id}>
                        Somente {f.name} ({f.code})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">Status do Usuário *</label>
                  <select
                    value={formStatus}
                    onChange={(e) => setFormStatus(e.target.value as UserStatus)}
                    className="w-full min-h-[42px] bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl px-3 font-semibold focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  >
                    <option value="Ativo">Ativo (Autorizado)</option>
                    <option value="Inativo">Inativo (Bloqueado)</option>
                  </select>
                </div>
                <div>
                  <label className="block font-bold text-[#1E120D] mb-1">
                    {editingUser ? 'Redefinir Senha (opcional)' : 'Senha Inicial (ou deixe vazio para QR Code)'}
                  </label>
                  <input
                    type="password"
                    value={formPassword}
                    onChange={(e) => setFormPassword(e.target.value)}
                    placeholder="Mínimo 6 caracteres"
                    className="w-full min-h-[42px] bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl px-3 focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  />
                </div>
              </div>

              {/* Permissões Individuais */}
              <div className="pt-4 border-t border-[#F0E4EB] space-y-3">
                <div className="flex flex-wrap items-center justify-between gap-2">
                  <div>
                    <h4 className="text-xs font-extrabold uppercase tracking-wider text-[#8E1057] flex items-center gap-1.5">
                      <Shield className="w-4 h-4" />
                      Permissões Individuais por Módulo
                    </h4>
                    <p className="text-[11px] text-[#1E120D]/60">
                      Marque exatamente quais funcionalidades este usuário poderá utilizar.
                    </p>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {(['Operador', 'Gestor', 'Administrador'] as UserRole[]).map(preset => (
                      <button
                        key={preset}
                        type="button"
                        onClick={() => setFormPermissions(getDefaultPermissionsForRole(preset))}
                        className="px-2.5 py-1 rounded-lg border border-[#F0E4EB] bg-[#FAF6F8] hover:bg-[#F0E4EB] text-[11px] font-semibold text-[#1E120D]"
                      >
                        Padrão {preset}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
                  {PERMISSION_DEFINITIONS.map(perm => {
                    const lockedByRole =
                      perm.key === 'access_user_management' && formRole !== 'Administrador';
                    const checked = lockedByRole ? false : formPermissions[perm.key];
                    return (
                      <label
                        key={perm.key}
                        className={`flex items-start gap-3 p-3 rounded-xl border transition cursor-pointer ${
                          lockedByRole
                            ? 'bg-stone-50 border-stone-200 opacity-60 cursor-not-allowed'
                            : checked
                              ? 'bg-[#FAF6F8] border-[#8E1057]/50'
                              : 'bg-white border-[#F0E4EB] hover:border-[#D65F95]/40'
                        }`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={lockedByRole}
                          onChange={() => togglePermission(perm.key)}
                          className="mt-0.5 w-4 h-4 accent-[#8E1057]"
                        />
                        <div className="text-xs">
                          <div className="font-bold text-[#1E120D]">
                            {perm.label}{' '}
                            <span className="font-normal text-[#8E1057]">· {perm.module}</span>
                          </div>
                          <p className="text-[11px] text-[#1E120D]/60 mt-0.5 leading-snug">
                            {perm.description}
                          </p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-[#F0E4EB] flex flex-col-reverse sm:flex-row sm:justify-end gap-2.5">
                <button
                  type="button"
                  onClick={() => setIsUserModalOpen(false)}
                  className="min-h-[44px] px-4 py-2 rounded-xl border border-[#F0E4EB] text-xs font-bold text-[#1E120D]/70 hover:bg-[#FAF6F8]"
                >
                  Cancelar
                </button>
                <button
                  type="submit"
                  disabled={isSavingUser}
                  className="min-h-[44px] px-5 py-2 rounded-xl bg-[#8E1057] hover:bg-[#750D48] disabled:opacity-60 text-white text-xs font-bold flex items-center justify-center gap-2 shadow-xs"
                >
                  <Check className="w-4 h-4" />
                  <span>{isSavingUser ? 'Salvando...' : editingUser ? 'Salvar Alterações' : 'Cadastrar Usuário'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL QR CODE & LINK DE CONVITE */}
      {qrModalUser && (
        <div className="fixed inset-0 bg-[#1E120D]/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full shadow-2xl border border-[#F0E4EB] overflow-hidden">
            <div className="p-5 border-b border-[#F0E4EB] flex items-center justify-between bg-[#FAF6F8]">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8E1057]">
                  Convite Individual com Validade
                </p>
                <h3 className="text-base font-extrabold text-[#1E120D]">
                  QR Code & Link — {qrModalUser.name}
                </h3>
              </div>
              <button
                type="button"
                onClick={() => {
                  setQrModalUser(null);
                  setActiveInvite(null);
                }}
                className="p-2 rounded-lg text-[#1E120D]/50 hover:text-[#1E120D]"
                aria-label="Fechar modal QR Code"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-4 text-xs">
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 p-3 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB]">
                <div>
                  <span className="font-bold text-[#1E120D]">Validade do novo link:</span>
                </div>
                <div className="flex items-center gap-2">
                  <select
                    value={inviteValidityHours}
                    onChange={(e) => setInviteValidityHours(Number(e.target.value))}
                    className="min-h-[38px] bg-white border border-[#F0E4EB] rounded-lg px-2.5 text-xs font-semibold"
                  >
                    {EXPIRATION_OPTIONS.map(opt => (
                      <option key={opt.hours} value={opt.hours}>
                        {opt.label}
                      </option>
                    ))}
                  </select>
                  <button
                    type="button"
                    onClick={handleGenerateFreshInvite}
                    disabled={isGeneratingInvite}
                    className="min-h-[38px] px-3 py-1.5 rounded-lg bg-[#8E1057] hover:bg-[#750D48] text-white font-bold flex items-center gap-1.5 disabled:opacity-50"
                  >
                    <KeyRound className="w-3.5 h-3.5" />
                    <span>{isGeneratingInvite ? 'Gerando...' : 'Gerar Novo'}</span>
                  </button>
                </div>
              </div>

              {isGeneratingInvite ? (
                <div className="py-10 text-center text-[#1E120D]/60">Gerando QR Code seguro...</div>
              ) : activeInvite ? (
                <div className="space-y-4">
                  <div className="flex flex-col items-center justify-center p-4 rounded-2xl bg-[#FAF6F8] border border-[#F0E4EB]">
                    {qrDataUrl ? (
                      <img
                        src={qrDataUrl}
                        alt={`QR Code de acesso para ${qrModalUser.name}`}
                        className="w-52 h-52 rounded-xl bg-white p-2 border border-[#F0E4EB]"
                      />
                    ) : (
                      <div className="w-52 h-52 flex items-center justify-center text-[#1E120D]/40">
                        Carregando QR Code...
                      </div>
                    )}
                    <p className="text-[11px] text-[#1E120D]/65 mt-2 text-center tabular-nums">
                      Válido até <strong>{new Date(activeInvite.expiresAt).toLocaleString('pt-BR')}</strong>
                    </p>
                  </div>

                  <div className="p-3 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] space-y-1.5">
                    <div className="font-bold text-[#8E1057] flex items-center gap-1.5">
                      <Link2 className="w-3.5 h-3.5" />
                      <span>Link de Ativação Individual</span>
                    </div>
                    <div className="font-mono text-[11px] text-[#1E120D] break-all">{activeInvite.url}</div>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
                    <button
                      type="button"
                      onClick={() => copyToClipboard(activeInvite.url, 'Link de convite')}
                      className="min-h-[42px] px-3 py-2 rounded-xl bg-[#8E1057] hover:bg-[#750D48] text-white font-bold flex items-center justify-center gap-1.5"
                    >
                      <Copy className="w-3.5 h-3.5" />
                      <span>Copiar Link</span>
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        downloadQrImage(
                          qrDataUrl,
                          `qrcode-${qrModalUser.login || qrModalUser.id}.png`
                        )
                      }
                      className="min-h-[42px] px-3 py-2 rounded-xl border border-[#D65F95]/50 text-[#8E1057] font-bold flex items-center justify-center gap-1.5 hover:bg-[#FAF6F8]"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Baixar QR</span>
                    </button>
                    <button
                      type="button"
                      onClick={async () => {
                        await revokeUserInvite(activeInvite.id);
                        setActiveInvite(null);
                      }}
                      className="min-h-[42px] px-3 py-2 rounded-xl border border-rose-200 text-rose-700 font-bold flex items-center justify-center gap-1.5 hover:bg-rose-50"
                    >
                      <Ban className="w-3.5 h-3.5" />
                      <span>Revogar</span>
                    </button>
                  </div>
                </div>
              ) : (
                <div className="py-8 text-center text-[#1E120D]/60">
                  Clique em "Gerar Novo" para criar um QR Code e link de acesso.
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL CONFIRMAR EXCLUSÃO DE USUÁRIO */}
      {deletingUser && (
        <div className="fixed inset-0 bg-[#1E120D]/70 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-[#F0E4EB] space-y-4">
            <div className="flex items-start gap-3">
              <div className="p-2.5 rounded-xl bg-rose-100 text-rose-700 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-base font-extrabold text-[#1E120D]">Excluir Usuário</h3>
                <p className="text-xs text-[#1E120D]/70 mt-1">
                  Tem certeza de que deseja excluir <strong>{deletingUser.name}</strong> ({deletingUser.email})? Todos os links de convite vinculados também serão removidos.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2.5 pt-2">
              <button
                type="button"
                onClick={() => setDeletingUser(null)}
                className="min-h-[42px] px-4 py-2 rounded-xl border border-[#F0E4EB] text-xs font-bold text-[#1E120D]/70 hover:bg-[#FAF6F8]"
              >
                Cancelar
              </button>
              <button
                type="button"
                onClick={async () => {
                  await deleteManagedUser(deletingUser.id);
                  setDeletingUser(null);
                }}
                className="min-h-[42px] px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-bold"
              >
                Confirmar Exclusão
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
