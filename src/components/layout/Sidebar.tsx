import React from 'react';
import { useApp } from '../../context/AppContext';
import { 
  LayoutDashboard, 
  MapPin, 
  Layers, 
  Boxes, 
  ArrowDownToDot, 
  Recycle, 
  FileSpreadsheet, 
  ShieldAlert,
  ChevronRight,
  Database,
  ShieldCheck,
  ClipboardList,
  ClipboardCheck,
  SlidersHorizontal,
  Users
} from 'lucide-react';
import { ElCirueloLogo } from '../common/ElCirueloLogo';
import { PWAInstallButton } from '../common/PWAInstallButton';

export type ActiveTab = 
  | 'dashboard'
  | 'activities'
  | 'plasticulture-activities'
  | 'plasticulture-catalog'
  | 'farms'
  | 'serroplast'
  | 'import'
  | 'plastics'
  | 'stock'
  | 'installation'
  | 'removal'
  | 'reports'
  | 'users'
  | 'audit';

interface SidebarProps {
  activeTab: ActiveTab;
  setActiveTab: (tab: ActiveTab) => void;
  isOpen: boolean;
  onClose: () => void;
}

export const Sidebar: React.FC<SidebarProps> = ({ activeTab, setActiveTab, isOpen, onClose }) => {
  const {
    kpis,
    currentUser,
    isAdmin,
    hasPermission,
    serroplastRecords,
    activities,
    plasticulturePlanActivities,
    plasticultureCatalogItems,
    managedUsers
  } = useApp();
  const pendingOrActiveCount = activities.filter(a => a.status !== 'Concluída').length;
  const openPlastPlanCount = plasticulturePlanActivities.filter(a => a.status !== 'Finalizada').length;
  const activeCatalogCount = plasticultureCatalogItems.filter(i => i.active).length;

  const allNavItems: {
    id: ActiveTab;
    label: string;
    icon: React.ReactNode;
    badge?: string | number;
    badgeColor?: string;
    visible: boolean;
  }[] = [
    {
      id: 'dashboard',
      label: 'Dashboard Geral',
      icon: <LayoutDashboard className="w-5 h-5" />,
      visible: hasPermission('view_info')
    },
    {
      id: 'activities',
      label: 'Atividades',
      icon: <ClipboardList className="w-5 h-5" />,
      badge: pendingOrActiveCount > 0 ? `${pendingOrActiveCount} abertas` : `${activities.length} reg`,
      badgeColor: pendingOrActiveCount > 0 ? 'bg-[#D65F95] text-white border-[#D65F95]' : 'bg-[#FAF6F8] text-[#8E1057] border-[#D65F95]/50',
      visible: hasPermission('view_info')
    },
    {
      id: 'plasticulture-activities',
      label: 'Atividades de Plasticultura',
      icon: <ClipboardCheck className="w-5 h-5" />,
      badge: openPlastPlanCount > 0 ? `${openPlastPlanCount} abertas` : `${plasticulturePlanActivities.length} reg`,
      badgeColor: openPlastPlanCount > 0 ? 'bg-[#D65F95] text-white border-[#D65F95]' : 'bg-[#FAF6F8] text-[#8E1057] border-[#D65F95]/50',
      visible: hasPermission('access_plasticulture_activities')
    },
    {
      id: 'plasticulture-catalog',
      label: 'Cadastros de Plasticultura',
      icon: <SlidersHorizontal className="w-5 h-5" />,
      badge: `${activeCatalogCount} itens`,
      badgeColor: 'bg-[#FAF6F8] text-[#8E1057] border-[#D65F95]/50',
      visible: hasPermission('access_catalogs')
    },
    {
      id: 'serroplast',
      label: 'Histórico Serroplast',
      icon: <ShieldCheck className="w-5 h-5" />,
      badge: `${serroplastRecords.length} reg`,
      badgeColor: 'bg-emerald-500 text-white border-emerald-400',
      visible: hasPermission('access_covered_areas')
    },
    {
      id: 'farms',
      label: 'Fazendas & Parcelas',
      icon: <MapPin className="w-5 h-5" />,
      badge: kpis.duplicateParcelsCount > 0 ? `${kpis.duplicateParcelsCount} conf.` : undefined,
      badgeColor: 'bg-amber-100 text-amber-900 border-amber-300',
      visible: hasPermission('access_catalogs')
    },
    {
      id: 'import',
      label: 'Importação Oficial (PDF)',
      icon: <Database className="w-5 h-5" />,
      badge: 'Datas Oficial',
      badgeColor: 'bg-[#8E1057] text-white border-[#D65F95]/50',
      visible: hasPermission('access_catalogs')
    },
    {
      id: 'plastics',
      label: 'Catálogo de Plásticos',
      icon: <Layers className="w-5 h-5" />,
      visible: hasPermission('access_catalogs')
    },
    {
      id: 'stock',
      label: 'Controle de Estoque',
      icon: <Boxes className="w-5 h-5" />,
      badge: kpis.lowStockAlertsCount > 0 ? `${kpis.lowStockAlertsCount} alerta` : undefined,
      badgeColor: 'bg-amber-100 text-amber-800 border-amber-300',
      visible: hasPermission('view_info')
    },
    {
      id: 'installation',
      label: 'Instalação & Trocas',
      icon: <ArrowDownToDot className="w-5 h-5" />,
      visible: hasPermission('view_info')
    },
    {
      id: 'removal',
      label: 'Retirada e Reuso',
      icon: <Recycle className="w-5 h-5" />,
      badge: `${kpis.reuseRatePercentage}% reuso`,
      badgeColor: 'bg-[#FAF6F8] text-[#8E1057] border-[#D65F95]/50',
      visible: hasPermission('view_info')
    },
    {
      id: 'reports',
      label: 'Relatórios & Exportação',
      icon: <FileSpreadsheet className="w-5 h-5" />,
      visible: hasPermission('access_reports')
    },
    {
      id: 'users',
      label: 'Usuários e Acessos',
      icon: <Users className="w-5 h-5" />,
      badge: managedUsers.length > 0 ? `${managedUsers.length} usr` : undefined,
      badgeColor: 'bg-[#D65F95] text-white border-[#D65F95]',
      visible: isAdmin
    },
    {
      id: 'audit',
      label: 'Auditoria & Perfis',
      icon: <ShieldAlert className="w-5 h-5" />,
      visible: hasPermission('view_info')
    }
  ];

  const navItems = allNavItems.filter(item => item.visible);

  return (
    <>
      {isOpen && (
        <div 
          onClick={onClose}
          className="fixed inset-0 bg-[#1E120D]/70 z-30 lg:hidden backdrop-blur-xs transition-opacity"
        />
      )}

      <aside className={`
        fixed top-[57px] bottom-0 left-0 z-30 w-72 bg-gradient-to-b from-[#4A072E] via-[#5A0A37] to-[#3A0423] text-stone-100 border-r border-[#750D48] 
        flex flex-col transition-transform duration-200 ease-in-out
        lg:translate-x-0 ${isOpen ? 'translate-x-0' : '-translate-x-full'}
      `}>
        {/* Mobile Header Brand inside drawer */}
        <div className="lg:hidden p-4 border-b border-[#750D48] bg-[#3A0423]">
          <ElCirueloLogo variant="dark" size="md" />
          <div className="mt-2 text-xs font-black tracking-wider text-pink-100 uppercase">
            PLASTICULTURA FAZENDAS
          </div>
        </div>

        {/* Identificação da Plataforma no Topo do Menu Lateral */}
        <div className="px-4 py-2.5 border-b border-[#750D48] bg-[#3A0423]/50">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#D65F95] inline-block shadow-xs" />
            <span className="text-[11px] font-black uppercase tracking-wider text-white">
              PLASTICULTURA FAZENDAS
            </span>
          </div>
          <p className="text-[10px] text-pink-200/70 mt-0.5">
            El Ciruelo • Controle de Cobertura
          </p>
        </div>

        <div className="flex-1 overflow-y-auto p-3 space-y-1">
          <div className="px-3 py-2 text-[11px] font-bold uppercase tracking-wider text-pink-200/80">
            Módulos Operacionais
          </div>

          {navItems.map((item) => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => {
                  setActiveTab(item.id);
                  onClose();
                }}
                className={`
                  w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-sm font-medium transition-all group
                  ${isActive 
                    ? 'bg-[#8E1057] text-white shadow-md shadow-[#1E120D]/50 font-semibold border border-[#D65F95]/60' 
                    : 'text-stone-200 hover:bg-[#750D48]/70 hover:text-white'}
                `}
              >
                <div className="flex items-center gap-3">
                  <span className={`${isActive ? 'text-white' : 'text-pink-200/70 group-hover:text-[#D65F95] transition'}`}>
                    {item.icon}
                  </span>
                  <span>{item.label}</span>
                </div>

                <div className="flex items-center gap-1.5">
                  {item.badge && (
                    <span className={`text-[10px] px-1.5 py-0.5 rounded font-semibold border ${item.badgeColor || 'bg-stone-700 text-stone-300'}`}>
                      {item.badge}
                    </span>
                  )}
                  {isActive && <ChevronRight className="w-4 h-4 text-pink-200" />}
                </div>
              </button>
            );
          })}
        </div>

        {/* User Card at Bottom */}
        <div className="p-3 border-t border-[#750D48] bg-[#3A0423] space-y-2.5">
          <div className="sm:hidden">
            <PWAInstallButton variant="login" showFallbackInfo />
          </div>

          <div className="flex items-center gap-3 p-2.5 rounded-xl bg-[#4A072E] border border-[#D65F95]/30">
            <div className="w-10 h-10 rounded-full bg-[#8E1057] text-white font-bold flex items-center justify-center shrink-0 border border-[#D65F95] overflow-hidden shadow-xs">
              {currentUser.avatarUrl ? (
                <img src={currentUser.avatarUrl} alt={currentUser.name} className="w-full h-full object-cover" />
              ) : (
                currentUser.name.charAt(0)
              )}
            </div>
            <div className="flex-1 min-w-0 text-left">
              <p className="text-xs font-semibold text-white truncate">{currentUser.name}</p>
              <div className="flex items-center gap-1.5 mt-0.5">
                <span className="text-[11px] text-pink-200 font-medium truncate">
                  {currentUser.role} · {currentUser.farmScope === 'ALL' ? 'Global' : currentUser.farmAssigned || 'Vinculada'}
                </span>
              </div>
            </div>
          </div>

          <div className="px-2 flex items-center justify-between text-[11px] text-pink-200/80">
            <span>El Ciruelo • Brasil</span>
            <span className="text-[#D65F95] font-semibold">
              Sessão Protegida
            </span>
          </div>
        </div>
      </aside>
    </>
  );
};
