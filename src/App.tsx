/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useEffect, useMemo, useState } from 'react';
import { AppProvider, useApp } from './context/AppContext';
import { Header } from './components/layout/Header';
import { Sidebar, ActiveTab } from './components/layout/Sidebar';
import { GlobalFilterBar } from './components/layout/GlobalFilterBar';
import { ToastContainer } from './components/common/ToastContainer';
import { OfflineIndicator } from './components/common/OfflineIndicator';
import { LoginView } from './components/auth/LoginView';
import { DashboardView } from './components/dashboard/DashboardView';
import { FarmsHierarchyView } from './components/farms/FarmsHierarchyView';
import { OfficialDataImportView } from './components/import/OfficialDataImportView';
import { PlasticsCatalogView } from './components/plastics/PlasticsCatalogView';
import { StockControlView } from './components/stock/StockControlView';
import { InstallationView } from './components/installation/InstallationView';
import { RemovalView } from './components/removal/RemovalView';
import { ReportsView } from './components/reports/ReportsView';
import { AuditSecurityView } from './components/audit/AuditSecurityView';
import { SerroplastHistoryView } from './components/serroplast/SerroplastHistoryView';
import { ActivitiesView } from './components/activities/ActivitiesView';
import { PlasticultureActivitiesView } from './components/activities/PlasticultureActivitiesView';
import { PlasticultureCatalogView } from './components/activities/PlasticultureCatalogView';
import { UserManagementView } from './components/users/UserManagementView';
import { AlertTriangle, Lock, X } from 'lucide-react';

const MainContent: React.FC = () => {
  const [activeTab, setActiveTab] = useState<ActiveTab>('dashboard');
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isAlertsModalOpen, setIsAlertsModalOpen] = useState(false);
  const {
    isAuthenticated,
    isAuthLoading,
    isAdmin,
    hasPermission,
    kpis
  } = useApp();

  const canAccessTab = useMemo(() => {
    const map: Record<ActiveTab, boolean> = {
      dashboard: hasPermission('view_info'),
      activities: hasPermission('view_info'),
      'plasticulture-activities': hasPermission('access_plasticulture_activities'),
      'plasticulture-catalog': hasPermission('access_catalogs'),
      serroplast: hasPermission('access_covered_areas'),
      farms: hasPermission('access_catalogs'),
      import: hasPermission('access_catalogs'),
      plastics: hasPermission('access_catalogs'),
      stock: hasPermission('view_info'),
      installation: hasPermission('view_info'),
      removal: hasPermission('view_info'),
      reports: hasPermission('access_reports'),
      users: isAdmin,
      audit: hasPermission('view_info'),
    };
    return map;
  }, [hasPermission, isAdmin]);

  // Se o usuário autenticado não tiver acesso à aba atual, redireciona para a primeira aba autorizada
  useEffect(() => {
    if (!isAuthenticated) return;
    if (!canAccessTab[activeTab]) {
      const order: ActiveTab[] = [
        'dashboard',
        'plasticulture-activities',
        'activities',
        'serroplast',
        'reports',
        'farms',
        'plasticulture-catalog',
        'stock',
        'installation',
        'removal',
        'audit',
        'users',
      ];
      const firstAllowed = order.find(t => canAccessTab[t]);
      if (firstAllowed) setActiveTab(firstAllowed);
    }
  }, [isAuthenticated, activeTab, canAccessTab]);

  if (isAuthLoading) {
    return (
      <div className="min-h-screen bg-[#FAF6F8] flex flex-col items-center justify-center p-6 text-[#1E120D]">
        <div className="w-10 h-10 border-4 border-[#F0E4EB] border-t-[#8E1057] rounded-full animate-spin mb-3" />
        <p className="text-sm font-bold text-[#8E1057]">Carregando Plasticultura Fazendas...</p>
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <>
        <ToastContainer />
        <OfflineIndicator />
        <LoginView />
      </>
    );
  }

  return (
    <div className="min-h-screen bg-[#FAF6F8] flex flex-col antialiased text-[#1E120D]">
      {/* Camada de Notificações Toast & Offline */}
      <ToastContainer />
      <OfflineIndicator />

      {/* Cabeçalho Superior */}
      <Header 
        onToggleSidebar={() => setIsSidebarOpen(prev => !prev)} 
        onOpenAlerts={() => setIsAlertsModalOpen(true)}
      />

      <div className="flex flex-1">
        {/* Menu Lateral */}
        <Sidebar 
          activeTab={activeTab} 
          setActiveTab={setActiveTab}
          isOpen={isSidebarOpen}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Área de Conteúdo Principal */}
        <main className="flex-1 lg:pl-72 p-4 sm:p-6 max-w-7xl mx-auto w-full">
          {/* Barra de Filtros Operacionais */}
          {activeTab !== 'users' && (
            <div className="no-print">
              <GlobalFilterBar />
            </div>
          )}

          {/* Módulos protegidos por permissão */}
          <div className="transition-all duration-200">
            {!canAccessTab[activeTab] ? (
              <div className="bg-white border border-[#F0E4EB] rounded-2xl p-8 text-center space-y-2 shadow-xs">
                <Lock className="w-9 h-9 text-[#8E1057] mx-auto" />
                <h2 className="text-base font-extrabold text-[#1E120D]">Módulo não autorizado</h2>
                <p className="text-xs text-[#1E120D]/65">
                  Seu perfil não possui permissão para acessar esta funcionalidade. Solicite ao administrador caso precise de liberação.
                </p>
              </div>
            ) : (
              <>
                {activeTab === 'dashboard' && (
                  <DashboardView 
                    onNavigate={(tab) => setActiveTab(tab)} 
                    onOpenStockModal={() => setActiveTab('stock')}
                  />
                )}
                {activeTab === 'activities' && <ActivitiesView />}
                {activeTab === 'plasticulture-activities' && (
                  <PlasticultureActivitiesView onOpenCatalog={() => setActiveTab('plasticulture-catalog')} />
                )}
                {activeTab === 'plasticulture-catalog' && (
                  <PlasticultureCatalogView onNavigateToActivities={() => setActiveTab('plasticulture-activities')} />
                )}
                {activeTab === 'serroplast' && <SerroplastHistoryView />}
                {activeTab === 'farms' && <FarmsHierarchyView />}
                {activeTab === 'import' && <OfficialDataImportView />}
                {activeTab === 'plastics' && <PlasticsCatalogView />}
                {activeTab === 'stock' && <StockControlView />}
                {activeTab === 'installation' && (
                  <InstallationView onNavigateToRemoval={() => setActiveTab('removal')} />
                )}
                {activeTab === 'removal' && <RemovalView />}
                {activeTab === 'reports' && <ReportsView />}
                {activeTab === 'users' && <UserManagementView />}
                {activeTab === 'audit' && <AuditSecurityView />}
              </>
            )}
          </div>
        </main>
      </div>

      {/* Modal de Alertas de Estoque Baixo */}
      {isAlertsModalOpen && (
        <div className="fixed inset-0 bg-[#1E120D]/60 z-50 flex items-center justify-center p-4 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-[#F0E4EB] animate-scale-up">
            <div className="flex items-center justify-between pb-3 border-b border-[#F0E4EB]">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-600" />
                <h3 className="font-bold text-[#1E120D] text-base">
                  Alertas de Estoque Crítico ({kpis.lowStockAlertsCount})
                </h3>
              </div>
              <button 
                onClick={() => setIsAlertsModalOpen(false)}
                className="text-[#1E120D]/40 hover:text-[#1E120D] p-1 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 space-y-3 max-h-[60vh] overflow-y-auto">
              {kpis.lowStockItems.length === 0 ? (
                <p className="text-xs text-[#1E120D]/60 text-center py-4">
                  Não existem alertas de estoque baixo no momento.
                </p>
              ) : (
                kpis.lowStockItems.map(({ stock: item, plastic, farm }) => (
                  <div key={item.id} className="p-3 bg-amber-50 rounded-xl border border-amber-200 text-xs space-y-1">
                    <div className="flex items-center justify-between font-bold text-[#1E120D]">
                      <span>{plastic.name}</span>
                      <span className="text-amber-800 font-black tabular-nums">{item.metersAvailable.toLocaleString('pt-BR')} m</span>
                    </div>
                    <div className="text-[11px] text-[#1E120D]/70 flex items-center justify-between">
                      <span>Fazenda: <strong>{farm.name}</strong> • Lote: <span className="font-mono">{item.batchNumber}</span></span>
                      <span className="tabular-nums">Mínimo: {plastic.minStockAlertMeters.toLocaleString('pt-BR')}m</span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="pt-3 border-t border-[#F0E4EB] flex justify-end">
              <button
                onClick={() => {
                  setIsAlertsModalOpen(false);
                  setActiveTab('stock');
                }}
                className="px-4 py-2 bg-[#8E1057] hover:bg-[#750D48] text-white font-bold text-xs rounded-xl transition shadow-xs"
              >
                Ir para Controle de Estoque
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default function App() {
  return (
    <AppProvider>
      <MainContent />
    </AppProvider>
  );
}
