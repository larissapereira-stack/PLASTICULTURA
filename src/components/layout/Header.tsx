import React from 'react';
import { useApp } from '../../context/AppContext';
import {
  Menu,
  Bell,
  LogOut,
  RotateCcw,
  UserCheck
} from 'lucide-react';
import { ElCirueloLogo } from '../common/ElCirueloLogo';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface HeaderProps {
  onToggleSidebar: () => void;
  onOpenAlerts: () => void;
}

export const Header: React.FC<HeaderProps> = ({ onToggleSidebar, onOpenAlerts }) => {
  const { currentUser, isAdmin, kpis, resetToDefaults, logout } = useApp();

  return (
    <header className="sticky top-0 z-30 bg-gradient-to-r from-[#4A072E] via-[#5A0A37] to-[#8E1057] text-white border-b border-[#D65F95]/30 shadow-md">
      <div className="px-4 sm:px-6 py-2.5 flex items-center justify-between gap-3">
        {/* Left: Mobile Toggle, Official El Ciruelo Logo & Platform Name */}
        <div className="flex items-center gap-2.5 sm:gap-3 min-w-0">
          <button
            type="button"
            onClick={onToggleSidebar}
            className="min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-pink-200 hover:text-white hover:bg-white/10 lg:hidden transition shrink-0"
            aria-label="Abrir menu lateral"
          >
            <Menu className="w-5 h-5" />
          </button>

          {/* El Ciruelo Official Brand Logo & Nome da Plataforma */}
          <div className="flex items-center gap-2.5 sm:gap-3.5 min-w-0">
            <ElCirueloLogo variant="dark" size="md" />

            <div className="h-7 w-px bg-[#D65F95]/40 shrink-0" />

            <h1 className="text-xs sm:text-base font-black tracking-wider text-white uppercase drop-shadow-xs whitespace-nowrap truncate">
              PLASTICULTURA FAZENDAS
            </h1>
          </div>
        </div>

        {/* Right: PWA Install, Stock alerts, Authenticated User & Logout */}
        <div className="flex items-center gap-2 shrink-0">
          <div className="hidden sm:block">
            <PWAInstallButton variant="header" />
          </div>

          {/* Low Stock Alerts Notification Button */}
          <button
            type="button"
            onClick={onOpenAlerts}
            className="relative min-h-[40px] min-w-[40px] flex items-center justify-center rounded-lg text-pink-100 hover:text-white hover:bg-white/10 transition"
            title={`${kpis.lowStockAlertsCount} alertas de estoque`}
            aria-label="Alertas de estoque"
          >
            <Bell className="w-5 h-5" />
            {kpis.lowStockAlertsCount > 0 && (
              <span className="absolute top-1 right-1 flex h-4 w-4 items-center justify-center rounded-full bg-amber-400 text-[10px] font-black text-[#1E120D] shadow-xs tabular-nums">
                {kpis.lowStockAlertsCount}
              </span>
            )}
          </button>

          {/* Usuário Autenticado */}
          <div className="hidden md:flex items-center gap-2 bg-[#3A0423]/80 border border-[#D65F95]/40 rounded-lg px-2.5 py-1.5">
            <UserCheck className="w-3.5 h-3.5 text-[#D65F95] shrink-0" />
            <div className="text-left leading-tight">
              <div className="text-xs font-bold text-white whitespace-nowrap max-w-[140px] truncate">
                {currentUser.name}
              </div>
              <div className="text-[10px] text-pink-200/80 whitespace-nowrap">
                {currentUser.role}
              </div>
            </div>
          </div>

          {isAdmin && (
            <button
              type="button"
              onClick={() => {
                if (window.confirm('Deseja recarregar a base com os dados oficiais El Ciruelo das 4 fazendas?')) {
                  resetToDefaults();
                }
              }}
              className="hidden xl:flex items-center gap-1 text-xs text-pink-200 hover:text-white px-2.5 py-1.5 rounded-lg hover:bg-white/10 border border-transparent hover:border-[#D65F95]/40 transition whitespace-nowrap"
              title="Restaurar dados originais"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reiniciar</span>
            </button>
          )}

          <button
            type="button"
            onClick={() => logout()}
            className="min-h-[36px] flex items-center gap-1.5 px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#3A0423]/80 hover:bg-[#3A0423] border border-[#D65F95]/40 text-pink-100 hover:text-white text-xs font-bold transition whitespace-nowrap"
            title="Sair da conta"
          >
            <LogOut className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Sair</span>
          </button>
        </div>
      </div>
    </header>
  );
};
