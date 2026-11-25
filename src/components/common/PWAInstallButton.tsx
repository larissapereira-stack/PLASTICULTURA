import React, { useState } from 'react';
import { Download, Share, Smartphone, Laptop, X, CheckCircle2 } from 'lucide-react';
import { usePWAInstall } from '../../hooks/usePWAInstall';

interface PWAInstallButtonProps {
  variant?: 'header' | 'card' | 'login';
  showFallbackInfo?: boolean;
}

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  variant = 'header',
  showFallbackInfo = false,
}) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showGuideModal, setShowGuideModal] = useState(false);

  if (isInstalled) {
    if (variant === 'card') {
      return (
        <div className="inline-flex items-center gap-2 px-3.5 py-2 rounded-xl bg-emerald-50 text-emerald-800 border border-emerald-200 text-xs font-semibold">
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
          <span>Aplicativo já instalado neste dispositivo</span>
        </div>
      );
    }
    return null;
  }

  const handleAction = async () => {
    if (isInstallable) {
      const accepted = await install();
      if (!accepted && !isIOS) {
        return;
      }
      return;
    }
    setShowGuideModal(true);
  };

  if (!isInstallable && !isIOS && !showFallbackInfo && variant === 'header') {
    return null;
  }

  const buttonClasses =
    variant === 'header'
      ? 'flex items-center gap-1.5 rounded-lg bg-[#D65F95] hover:bg-[#c24d83] text-white px-3 py-1.5 text-xs font-bold shadow-xs transition whitespace-nowrap shrink-0 min-h-[36px]'
      : variant === 'login'
        ? 'w-full flex items-center justify-center gap-2 rounded-xl border border-[#D65F95]/50 bg-[#FAF6F8] hover:bg-[#F0E4EB] text-[#8E1057] px-4 py-2.5 text-xs font-bold transition min-h-[44px]'
        : 'inline-flex items-center justify-center gap-2 rounded-xl bg-[#8E1057] hover:bg-[#750D48] text-white px-4 py-2.5 text-xs font-bold shadow-xs transition min-h-[44px]';

  return (
    <>
      <button
        type="button"
        onClick={handleAction}
        className={buttonClasses}
        title="Instalar Plasticultura Fazendas no celular ou notebook"
      >
        <Download className="w-4 h-4 shrink-0" />
        <span>Instalar Aplicativo</span>
      </button>

      {showGuideModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#1E120D]/70 p-4 backdrop-blur-xs">
          <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl border border-[#F0E4EB] text-[#1E120D]">
            <div className="flex items-start justify-between gap-3 pb-3 border-b border-[#F0E4EB]">
              <div>
                <p className="text-[11px] font-bold uppercase tracking-wider text-[#8E1057]">
                  Aplicativo Instalável (PWA)
                </p>
                <h3 className="text-base font-extrabold text-[#1E120D] mt-0.5">
                  Instalar Plasticultura Fazendas
                </h3>
              </div>
              <button
                type="button"
                onClick={() => setShowGuideModal(false)}
                className="p-2 rounded-lg text-[#1E120D]/50 hover:text-[#1E120D] hover:bg-[#FAF6F8]"
                aria-label="Fechar instruções de instalação"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="py-4 space-y-3 text-xs text-[#1E120D]/80">
              {isIOS ? (
                <div className="p-3.5 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] space-y-2">
                  <div className="flex items-center gap-2 font-bold text-[#8E1057]">
                    <Smartphone className="w-4 h-4" />
                    <span>No iPhone ou iPad (Safari)</span>
                  </div>
                  <ol className="list-decimal list-inside space-y-1.5 leading-relaxed">
                    <li>
                      Toque no botão <strong className="inline-flex items-center gap-1"><Share className="w-3.5 h-3.5" /> Compartilhar</strong> na barra do Safari.
                    </li>
                    <li>
                      Role para baixo e toque em <strong>Adicionar à Tela de Início</strong>.
                    </li>
                    <li>
                      Confirme em <strong>Adicionar</strong> para criar o atalho do aplicativo <strong>Plasticultura Fazendas</strong>.
                    </li>
                  </ol>
                </div>
              ) : (
                <>
                  <div className="p-3.5 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-[#8E1057]">
                      <Smartphone className="w-4 h-4" />
                      <span>Celular Android (Chrome)</span>
                    </div>
                    <p className="leading-relaxed">
                      Abra o link oficial no Google Chrome, toque no menu (<strong>⋮</strong>) no canto superior direito e selecione <strong>Instalar aplicativo</strong> ou <strong>Adicionar à tela inicial</strong>.
                    </p>
                  </div>
                  <div className="p-3.5 rounded-xl bg-[#FAF6F8] border border-[#F0E4EB] space-y-1.5">
                    <div className="flex items-center gap-2 font-bold text-[#8E1057]">
                      <Laptop className="w-4 h-4" />
                      <span>Notebook ou Computador (Chrome / Edge)</span>
                    </div>
                    <p className="leading-relaxed">
                      Clique no ícone de instalação na barra de endereço do navegador (ou menu <strong>⋮ → Instalar Plasticultura Fazendas</strong>) para criar um atalho na área de trabalho.
                    </p>
                  </div>
                </>
              )}
            </div>

            <button
              type="button"
              onClick={() => setShowGuideModal(false)}
              className="w-full min-h-[44px] rounded-xl bg-[#8E1057] hover:bg-[#750D48] text-white text-xs font-bold transition"
            >
              Entendi
            </button>
          </div>
        </div>
      )}
    </>
  );
};
