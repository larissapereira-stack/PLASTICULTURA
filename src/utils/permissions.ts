import type { UserPermissionKey, UserPermissions, UserProfile, UserRole } from '../types/index.ts';

export interface PermissionDefinition {
  key: UserPermissionKey;
  label: string;
  description: string;
  module: string;
  adminOnly?: boolean;
}

export const PERMISSION_DEFINITIONS: PermissionDefinition[] = [
  {
    key: 'view_info',
    label: 'Visualizar informações',
    description: 'Consultar painéis, histórico e dados operacionais das fazendas liberadas.',
    module: 'Geral',
  },
  {
    key: 'create_records',
    label: 'Cadastrar novos registros',
    description: 'Criar lançamentos de estoque, instalações, retiradas e atividades.',
    module: 'Operacional',
  },
  {
    key: 'edit_records',
    label: 'Editar registros',
    description: 'Alterar lançamentos existentes, status de atividades e confirmações.',
    module: 'Operacional',
  },
  {
    key: 'delete_records',
    label: 'Excluir registros',
    description: 'Remover atividades e registros operacionais com confirmação.',
    module: 'Operacional',
  },
  {
    key: 'access_reports',
    label: 'Acessar relatórios',
    description: 'Visualizar e exportar planilhas, PDFs e relatórios consolidados.',
    module: 'Relatórios',
  },
  {
    key: 'access_plasticulture_activities',
    label: 'Acessar atividades de plasticultura',
    description: 'Entrar na aba Atividades de Plasticultura e acompanhar cronogramas.',
    module: 'Atividades de Plasticultura',
  },
  {
    key: 'access_covered_areas',
    label: 'Acessar dados de áreas cobertas',
    description: 'Consultar áreas com plasticultura, estrutura física, Serroplast e valores por hectare.',
    module: 'Áreas Cobertas',
  },
  {
    key: 'access_catalogs',
    label: 'Acessar cadastros',
    description: 'Acessar Fazendas & Parcelas, Cadastros de Plasticultura, Plásticos e Importação.',
    module: 'Cadastros',
  },
  {
    key: 'access_user_management',
    label: 'Acessar a gestão de usuários',
    description: 'Gerenciar usuários, permissões, bloqueios, QR Codes e links de convite (exclusivo Administrador).',
    module: 'Segurança',
    adminOnly: true,
  },
];

export function getDefaultPermissionsForRole(role: UserRole): UserPermissions {
  if (role === 'Administrador') {
    return {
      view_info: true,
      create_records: true,
      edit_records: true,
      delete_records: true,
      access_reports: true,
      access_plasticulture_activities: true,
      access_covered_areas: true,
      access_catalogs: true,
      access_user_management: true,
    };
  }
  if (role === 'Gestor') {
    return {
      view_info: true,
      create_records: true,
      edit_records: true,
      delete_records: false,
      access_reports: true,
      access_plasticulture_activities: true,
      access_covered_areas: true,
      access_catalogs: true,
      access_user_management: false,
    };
  }
  return {
    view_info: true,
    create_records: true,
    edit_records: false,
    delete_records: false,
    access_reports: false,
    access_plasticulture_activities: true,
    access_covered_areas: true,
    access_catalogs: false,
    access_user_management: false,
  };
}

export function normalizePermissions(
  role: UserRole,
  partial?: Partial<UserPermissions> | null
): UserPermissions {
  const defaults = getDefaultPermissionsForRole(role);
  const next: UserPermissions = {
    view_info: typeof partial?.view_info === 'boolean' ? partial.view_info : defaults.view_info,
    create_records: typeof partial?.create_records === 'boolean' ? partial.create_records : defaults.create_records,
    edit_records: typeof partial?.edit_records === 'boolean' ? partial.edit_records : defaults.edit_records,
    delete_records: typeof partial?.delete_records === 'boolean' ? partial.delete_records : defaults.delete_records,
    access_reports: typeof partial?.access_reports === 'boolean' ? partial.access_reports : defaults.access_reports,
    access_plasticulture_activities:
      typeof partial?.access_plasticulture_activities === 'boolean'
        ? partial.access_plasticulture_activities
        : defaults.access_plasticulture_activities,
    access_covered_areas:
      typeof partial?.access_covered_areas === 'boolean'
        ? partial.access_covered_areas
        : defaults.access_covered_areas,
    access_catalogs: typeof partial?.access_catalogs === 'boolean' ? partial.access_catalogs : defaults.access_catalogs,
    access_user_management:
      role === 'Administrador'
        ? typeof partial?.access_user_management === 'boolean'
          ? partial.access_user_management
          : true
        : false,
  };
  return next;
}

export function userHasPermission(user: UserProfile | null | undefined, key: UserPermissionKey): boolean {
  if (!user || user.status !== 'Ativo') return false;
  if (key === 'access_user_management') {
    return user.role === 'Administrador' && Boolean(user.permissions?.access_user_management ?? true);
  }
  if (user.role === 'Administrador') {
    return user.permissions ? Boolean(user.permissions[key]) : true;
  }
  return Boolean(user.permissions?.[key]);
}
