import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Eye,
  EyeOff,
  KeyRound,
  Laptop,
  Lock,
  LogIn,
  ShieldCheck,
  Smartphone,
} from 'lucide-react';
import { useApp } from '../../context/AppContext';
import { ElCirueloLogo } from '../common/ElCirueloLogo';
import { PWAInstallButton } from '../common/PWAInstallButton';

interface InvitePreview {
  valid: boolean;
  reason?: string;
  expiresAt?: string;
  user?: {
    name: string;
    email: string;
    login: string;
    role: string;
    jobTitle?: string;
    farmScope: string;
    farmAssigned: string;
  };
}

export const LoginView: React.FC = () => {
  const {
    needsAdminBootstrap,
    bootstrapAdminEmail,
    loginWithPassword,
    bootstrapAdminAccount,
    activateInviteAccount,
  } = useApp();

  const [inviteToken, setInviteToken] = useState<string>(() => {
    if (typeof window === 'undefined') return '';
    return new URLSearchParams(window.location.search).get('invite')?.trim() || '';
  });
  const [inviteLoading, setInviteLoading] = useState<boolean>(Boolean(inviteToken));
  const [inviteInfo, setInviteInfo] = useState<InvitePreview | null>(null);

  // Login state
  const [identifier, setIdentifier] = useState<string>('');
  const [password, setPassword] = useState<string>('');
  const [showPassword, setShowPassword] = useState<boolean>(false);

  // Setup / Activation state
  const [setupEmail, setSetupEmail] = useState<string>(bootstrapAdminEmail);
  const [setupPassword, setSetupPassword] = useState<string>('');
  const [setupConfirm, setSetupConfirm] = useState<string>('');
  const [showSetupPassword, setShowSetupPassword] = useState<boolean>(false);

  const [submitting, setSubmitting] = useState<boolean>(false);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    setSetupEmail(bootstrapAdminEmail);
  }, [bootstrapAdminEmail]);

  useEffect(() => {
    if (!inviteToken) {
      setInviteLoading(false);
      setInviteInfo(null);
      return;
    }

    let active = true;
    const validateInvite = async () => {
      setInviteLoading(true);
      setErrorMsg('');
      try {
        const res = await fetch(`/api/auth/invite/${encodeURIComponent(inviteToken)}`);
        const data = (await res.json()) as InvitePreview;
        if (active) {
          setInviteInfo(data);
        }
      } catch {
        if (active) {
          setInviteInfo({
            valid: false,
            reason: 'Não foi possível validar o link de convite. Verifique sua conexão.',
          });
        }
      } finally {
        if (active) setInviteLoading(false);
      }
    };
    validateInvite();
    return () => {
      active = false;
    };
  }, [inviteToken]);

  const clearInviteFromUrl = () => {
    setInviteToken('');
    setInviteInfo(null);
    setErrorMsg('');
    if (typeof window !== 'undefined') {
      const url = new URL(window.location.href);
      url.searchParams.delete('invite');
      window.history.replaceState({}, '', url.pathname + url.search);
    }
  };

  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!identifier.trim() || !password) {
      setErrorMsg('Informe seu e-mail ou login e sua senha de acesso.');
      return;
    }
    setSubmitting(true);
    const res = await loginWithPassword(identifier, password);
    setSubmitting(false);
    if (!res.success) {
      setErrorMsg(res.message || 'Falha ao entrar no sistema.');
    }
  };

  const handleBootstrapSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (!setupEmail.trim()) {
      setErrorMsg('Informe o e-mail do administrador.');
      return;
    }
    if (setupPassword.trim().length < 6) {
      setErrorMsg('Defina uma senha com pelo menos 6 caracteres.');
      return;
    }
    if (setupPassword !== setupConfirm) {
      setErrorMsg('As senhas digitadas não conferem.');
      return;
    }
    setSubmitting(true);
    const res = await bootstrapAdminAccount(setupEmail.trim(), setupPassword);
    setSubmitting(false);
    if (!res.success) {
      setErrorMsg(res.message || 'Erro ao salvar configuração inicial.');
    }
  };

  const handleInviteActivateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg('');
    if (setupPassword.trim().length < 6) {
      setErrorMsg('Defina uma senha pessoal com pelo menos 6 caracteres.');
      return;
    }
    if (setupPassword !== setupConfirm) {
      setErrorMsg('A confirmação da senha não confere.');
      return;
    }
    setSubmitting(true);
    const res = await activateInviteAccount(inviteToken, setupPassword);
    setSubmitting(false);
    if (res.success) {
      clearInviteFromUrl();
    } else {
      setErrorMsg(res.message || 'Não foi possível ativar seu acesso.');
    }
  };

  return (
    <div className="min-h-screen bg-[#FAF6F8] flex flex-col justify-center p-4 sm:p-6 lg:p-10 text-[#1E120D]">
      <div className="max-w-5xl w-full mx-auto grid grid-cols-1 lg:grid-cols-12 rounded-3xl overflow-hidden shadow-2xl border border-[#F0E4EB] bg-white items-stretch">
        {/* Left Brand & Platform Overview */}
        <div className="lg:col-span-5 bg-gradient-to-br from-[#4A072E] via-[#5A0A37] to-[#8E1057] text-white p-6 sm:p-8 flex flex-col justify-between">
          <div>
            <ElCirueloLogo variant="dark" size="lg" />
            <div className="mt-6">
              <p className="text-[11px] font-bold uppercase tracking-widest text-pink-200/90">
                Acesso Corporativo Protegido
              </p>
              <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-white mt-1">
                PLASTICULTURA FAZENDAS
              </h1>
              <p className="text-xs sm:text-sm text-pink-100/85 mt-3 leading-relaxed">
                Plataforma oficial El Ciruelo para gestão de áreas cobertas, estruturas, estoque de filmes agrícolas e atividades operacionais das fazendas.
              </p>
            </div>
          </div>

          <div className="mt-8 pt-6 border-t border-[#D65F95]/30 space-y-3 text-xs text-pink-100/90">
            <div className="flex items-start gap-2.5">
              <ShieldCheck className="w-4 h-4 text-[#D65F95] shrink-0 mt-0.5" />
              <span>Acesso autorizado por usuário, perfil e fazenda vinculada.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Smartphone className="w-4 h-4 text-[#D65F95] shrink-0 mt-0.5" />
              <span>Compatível com Android, iPhone e ativação via QR Code.</span>
            </div>
            <div className="flex items-start gap-2.5">
              <Laptop className="w-4 h-4 text-[#D65F95] shrink-0 mt-0.5" />
              <span>Instalável como aplicativo no celular ou notebook.</span>
            </div>
          </div>
        </div>

        {/* Right Form Panel */}
        <div className="lg:col-span-7 p-6 sm:p-10 flex flex-col justify-center bg-white">
          {/* Invite Activation Mode */}
          {inviteToken ? (
            inviteLoading ? (
              <div className="py-12 text-center space-y-3">
                <div className="w-10 h-10 border-4 border-[#F0E4EB] border-t-[#8E1057] rounded-full animate-spin mx-auto" />
                <p className="text-sm font-bold text-[#1E120D]">Validando link de convite...</p>
                <p className="text-xs text-[#1E120D]/60">Verificando validade e autorização de acesso.</p>
              </div>
            ) : !inviteInfo?.valid ? (
              <div className="space-y-5">
                <div className="p-4 rounded-2xl bg-rose-50 border border-rose-200 flex items-start gap-3">
                  <AlertTriangle className="w-5 h-5 text-rose-600 shrink-0 mt-0.5" />
                  <div>
                    <h2 className="text-sm font-extrabold text-rose-900">Convite indisponível</h2>
                    <p className="text-xs text-rose-800 mt-1 leading-relaxed">
                      {inviteInfo?.reason || 'Este link de acesso não é válido.'}
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={clearInviteFromUrl}
                  className="w-full min-h-[44px] rounded-xl bg-[#8E1057] hover:bg-[#750D48] text-white text-xs font-bold transition shadow-xs"
                >
                  Ir para a Tela de Login
                </button>
              </div>
            ) : (
              <form onSubmit={handleInviteActivateSubmit} className="space-y-4">
                <div>
                  <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8E1057]">
                    <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                    Convite Autorizado
                  </span>
                  <h2 className="text-xl font-extrabold text-[#1E120D] mt-1">
                    Ativar Acesso de Usuário
                  </h2>
                  <p className="text-xs text-[#1E120D]/65 mt-1">
                    Confirme seus dados e crie sua senha pessoal para entrar no aplicativo.
                  </p>
                </div>

                <div className="p-4 rounded-2xl bg-[#FAF6F8] border border-[#F0E4EB] text-xs space-y-1.5">
                  <div className="font-extrabold text-sm text-[#1E120D]">{inviteInfo.user?.name}</div>
                  <div className="text-[#1E120D]/70">
                    {inviteInfo.user?.email} · Login: <span className="font-mono">{inviteInfo.user?.login}</span>
                  </div>
                  <div className="text-[#8E1057] font-semibold">
                    {inviteInfo.user?.role} · {inviteInfo.user?.farmAssigned}
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E120D] mb-1.5">
                    Criar Senha de Acesso (mínimo 6 caracteres)
                  </label>
                  <div className="relative">
                    <input
                      type={showSetupPassword ? 'text' : 'password'}
                      value={setupPassword}
                      onChange={(e) => setSetupPassword(e.target.value)}
                      placeholder="Digite sua senha pessoal"
                      className="w-full min-h-[44px] bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl px-3.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => setShowSetupPassword(p => !p)}
                      className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#1E120D]/50 hover:text-[#1E120D]"
                      aria-label="Mostrar ou ocultar senha"
                    >
                      {showSetupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>

                <div>
                  <label className="block text-xs font-bold text-[#1E120D] mb-1.5">
                    Confirmar Senha
                  </label>
                  <input
                    type={showSetupPassword ? 'text' : 'password'}
                    value={setupConfirm}
                    onChange={(e) => setSetupConfirm(e.target.value)}
                    placeholder="Repita a senha digitada"
                    className="w-full min-h-[44px] bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                    required
                  />
                </div>

                {errorMsg && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                    {errorMsg}
                  </div>
                )}

                <div className="flex flex-col sm:flex-row gap-2.5 pt-2">
                  <button
                    type="submit"
                    disabled={submitting}
                    className="flex-1 min-h-[46px] flex items-center justify-center gap-2 rounded-xl bg-[#8E1057] hover:bg-[#750D48] disabled:opacity-60 text-white text-sm font-bold shadow-sm transition"
                  >
                    <KeyRound className="w-4 h-4" />
                    <span>{submitting ? 'Ativando acesso...' : 'Ativar Acesso e Entrar'}</span>
                  </button>
                  <button
                    type="button"
                    onClick={clearInviteFromUrl}
                    className="min-h-[46px] px-4 rounded-xl border border-[#F0E4EB] text-xs font-semibold text-[#1E120D]/70 hover:bg-[#FAF6F8] transition"
                  >
                    Voltar ao Login
                  </button>
                </div>
              </form>
            )
          ) : needsAdminBootstrap ? (
            /* First-Run Inline Admin Setup / Claim */
            <form onSubmit={handleBootstrapSubmit} className="space-y-4">
              <div>
                <span className="text-[11px] font-bold uppercase tracking-wider text-[#8E1057]">
                  Primeiro Acesso do Sistema
                </span>
                <h2 className="text-xl font-extrabold text-[#1E120D] mt-1">
                  Definir Senha da Administradora
                </h2>
                <p className="text-xs text-[#1E120D]/65 mt-1 leading-relaxed">
                  Configure a senha inicial da conta administradora para proteger o aplicativo e liberar a gestão de usuários, permissões e convites por QR Code.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E120D] mb-1.5">
                  E-mail da Administradora
                </label>
                <input
                  type="email"
                  value={setupEmail}
                  onChange={(e) => setSetupEmail(e.target.value)}
                  className="w-full min-h-[44px] bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E120D] mb-1.5">
                  Senha Inicial de Acesso (mínimo 6 caracteres)
                </label>
                <div className="relative">
                  <input
                    type={showSetupPassword ? 'text' : 'password'}
                    value={setupPassword}
                    onChange={(e) => setSetupPassword(e.target.value)}
                    placeholder="Escolha a senha do administrador"
                    className="w-full min-h-[44px] bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl px-3.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowSetupPassword(p => !p)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#1E120D]/50 hover:text-[#1E120D]"
                    aria-label="Mostrar ou ocultar senha"
                  >
                    {showSetupPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E120D] mb-1.5">
                  Confirmar Senha
                </label>
                <input
                  type={showSetupPassword ? 'text' : 'password'}
                  value={setupConfirm}
                  onChange={(e) => setSetupConfirm(e.target.value)}
                  placeholder="Repita a senha"
                  className="w-full min-h-[44px] bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  required
                />
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[46px] flex items-center justify-center gap-2 rounded-xl bg-[#8E1057] hover:bg-[#750D48] disabled:opacity-60 text-white text-sm font-bold shadow-sm transition"
              >
                <ShieldCheck className="w-4 h-4" />
                <span>{submitting ? 'Salvando configuração...' : 'Configurar Acesso e Entrar'}</span>
              </button>

              <div className="pt-2">
                <PWAInstallButton variant="login" showFallbackInfo />
              </div>
            </form>
          ) : (
            /* Standard Login Screen */
            <form onSubmit={handleLoginSubmit} className="space-y-4">
              <div>
                <span className="inline-flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-wider text-[#8E1057]">
                  <Lock className="w-3.5 h-3.5" />
                  Acesso Restrito
                </span>
                <h2 className="text-xl sm:text-2xl font-extrabold text-[#1E120D] mt-1">
                  Entrar no Plasticultura Fazendas
                </h2>
                <p className="text-xs text-[#1E120D]/65 mt-1">
                  Informe suas credenciais autorizadas pelo administrador para acessar o sistema.
                </p>
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E120D] mb-1.5">
                  E-mail ou Login
                </label>
                <input
                  type="text"
                  autoComplete="username"
                  value={identifier}
                  onChange={(e) => setIdentifier(e.target.value)}
                  placeholder="nome@elciruelo.com.br ou login"
                  className="w-full min-h-[44px] bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl px-3.5 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                  required
                />
              </div>

              <div>
                <label className="block text-xs font-bold text-[#1E120D] mb-1.5">
                  Senha
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="Digite sua senha"
                    className="w-full min-h-[44px] bg-[#FAF6F8] border border-[#F0E4EB] rounded-xl px-3.5 pr-11 text-sm focus:outline-none focus:ring-2 focus:ring-[#8E1057]"
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-2 top-1/2 -translate-y-1/2 p-2 text-[#1E120D]/50 hover:text-[#1E120D]"
                    aria-label="Mostrar ou ocultar senha"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {errorMsg && (
                <div className="p-3 rounded-xl bg-rose-50 border border-rose-200 text-xs text-rose-800 font-medium">
                  {errorMsg}
                </div>
              )}

              <button
                type="submit"
                disabled={submitting}
                className="w-full min-h-[46px] flex items-center justify-center gap-2 rounded-xl bg-[#8E1057] hover:bg-[#750D48] disabled:opacity-60 text-white text-sm font-bold shadow-sm transition"
              >
                <LogIn className="w-4 h-4" />
                <span>{submitting ? 'Autenticando...' : 'Entrar'}</span>
              </button>

              <div className="pt-2 space-y-2">
                <PWAInstallButton variant="login" showFallbackInfo />
                <p className="text-[11px] text-center text-[#1E120D]/55">
                  Não possui senha? Solicite um QR Code ou link de convite ao administrador.
                </p>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};
