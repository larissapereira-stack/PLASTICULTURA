import React, { useRef } from 'react';
import { useApp } from '../../context/AppContext';
import { 
  ShieldCheck, 
  History, 
  Download, 
  Upload, 
  RotateCcw, 
  Lock, 
  UserCheck, 
  Database, 
  AlertTriangle,
  Sparkles,
  Info
} from 'lucide-react';

export const AuditSecurityView: React.FC = () => {
  const { 
    auditLogs, 
    currentUser, 
    exportBackupJson, 
    importBackupJson, 
    resetToDefaults,
    canPerform 
  } = useApp();

  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const content = event.target?.result as string;
      if (content) {
        importBackupJson(content);
      }
    };
    reader.readAsText(file);
    if (fileInputRef.current) fileInputRef.current.value = '';
  };

  const isConfigAdmin = canPerform('SYSTEM_CONFIG');

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="bg-white p-5 rounded-2xl border border-[#F0E4EB] shadow-xs">
        <div className="flex items-center gap-2 text-xs font-bold text-[#8E1057] uppercase tracking-wider mb-1">
          <ShieldCheck className="w-4 h-4 text-[#D65F95]" />
          Segurança, RBAC & Rastreabilidade
        </div>
        <h2 className="text-xl font-extrabold text-[#1E120D] tracking-tight">
          Auditoria, Perfis de Acesso e Integridade de Dados
        </h2>
        <p className="text-xs text-[#1E120D]/60 mt-0.5">
          Controle rigoroso de permissões (Administrador, Gestor, Operador), trilha de auditoria completa e backups persistentes.
        </p>
      </div>

      {/* Sessão Autenticada & Níveis de Acesso */}
      <div className="bg-white border border-[#F0E4EB] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0E4EB]">
          <div>
            <h3 className="font-bold text-[#1E120D] text-sm">
              Sessão Autenticada & Regras de Acesso (RBAC)
            </h3>
            <p className="text-xs text-[#1E120D]/60">
              A alteração de usuários, fazendas vinculadas e permissões é gerenciada exclusivamente pelo Administrador na aba Usuários e Acessos.
            </p>
          </div>
          <span className="text-xs font-semibold text-[#8E1057]">
            Conectado como {currentUser.role}
          </span>
        </div>

        <div className="p-4 rounded-xl bg-[#4A072E] text-white border border-[#8E1057] flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <div className="text-xs text-pink-200 font-semibold">{currentUser.role} · {currentUser.farmAssigned || 'Todas as Fazendas'}</div>
            <h4 className="font-extrabold text-base mt-0.5">{currentUser.name}</h4>
            <p className="text-xs text-[#FAF6F8]/80">{currentUser.email}</p>
          </div>
          <div className="text-xs text-pink-100/90 space-y-1">
            <div>Status: <strong>{currentUser.status}</strong></div>
            <div>Escopo: <strong>{currentUser.farmScope === 'ALL' ? 'Global (4 Fazendas)' : currentUser.farmAssigned}</strong></div>
          </div>
        </div>
      </div>

      {/* Backup, Restauração e Integridade Persistente */}
      <div className="bg-white border border-[#F0E4EB] rounded-2xl p-5 shadow-xs space-y-4">
        <div className="flex items-center justify-between pb-3 border-b border-[#F0E4EB]">
          <div>
            <h3 className="font-bold text-[#1E120D] text-sm">
              Persistência e Backup de Dados
            </h3>
            <p className="text-xs text-[#1E120D]/60">
              Os dados são armazenados de forma persistente e protegida no navegador. Exporte backups JSON para segurança externa.
            </p>
          </div>
          <Database className="w-5 h-5 text-[#8E1057]" />
        </div>

        <div className="flex flex-wrap items-center gap-3">
          <button
            onClick={exportBackupJson}
            className="flex items-center gap-2 bg-[#8E1057] hover:bg-[#750D48] text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs transition"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Backup Completo (JSON)</span>
          </button>

          {isConfigAdmin && (
            <>
              <label className="flex items-center gap-2 bg-[#1E120D] hover:bg-stone-800 text-white font-bold text-xs px-4 py-2.5 rounded-xl shadow-xs cursor-pointer transition">
                <Upload className="w-4 h-4" />
                <span>Restaurar Backup (JSON)</span>
                <input
                  ref={fileInputRef}
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  className="hidden"
                />
              </label>

              <button
                onClick={() => {
                  if (window.confirm('Tem certeza de que deseja restaurar os dados originais de demonstração das 4 fazendas? Dados atuais serão redefinidos.')) {
                    resetToDefaults();
                  }
                }}
                className="flex items-center gap-2 bg-red-50 hover:bg-red-100 text-red-700 font-bold text-xs px-4 py-2.5 rounded-xl border border-red-200 transition"
              >
                <RotateCcw className="w-4 h-4 text-red-600" />
                <span>Restaurar Base Padrão</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Trilha de Auditoria (Audit Log) */}
      <div className="bg-white border border-[#F0E4EB] rounded-2xl shadow-xs overflow-hidden">
        <div className="p-4 border-b border-[#F0E4EB] flex items-center justify-between">
          <div>
            <h3 className="font-bold text-[#1E120D] text-sm flex items-center gap-2">
              <History className="w-4 h-4 text-[#8E1057]" />
              Log de Auditoria de Ações no Sistema ({auditLogs.length} eventos)
            </h3>
            <p className="text-xs text-[#1E120D]/60">
              Registro histórico cronológico de todas as modificações, garantindo governança e rastreabilidade.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-[#FAF6F8] text-[#1E120D]/80 font-semibold border-b border-[#F0E4EB] uppercase tracking-wider text-[11px]">
              <tr>
                <th className="py-3 px-4">Data / Hora</th>
                <th className="py-3 px-4">Categoria</th>
                <th className="py-3 px-4">Ação</th>
                <th className="py-3 px-4">Descrição do Evento</th>
                <th className="py-3 px-4">Usuário</th>
                <th className="py-3 px-4">Perfil</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-stone-100">
              {auditLogs.map(log => {
                let catBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-stone-100 text-stone-700">{log.category}</span>;
                if (log.category === 'ESTOQUE') {
                  catBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-blue-100 text-blue-800">ESTOQUE</span>;
                } else if (log.category === 'INSTALACAO') {
                  catBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF6F8] text-[#8E1057] border border-[#D65F95]/30">INSTALAÇÃO</span>;
                } else if (log.category === 'RETIRADA') {
                  catBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#FAF6F8] text-[#8E1057] border border-[#D65F95]/40">RETIRADA</span>;
                } else if (log.category === 'TRANSFERENCIA') {
                  catBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-100 text-amber-800">TRANSFERÊNCIA</span>;
                } else if (log.category === 'ATIVIDADES') {
                  catBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-[#8E1057] text-white">ATIVIDADES</span>;
                } else if (log.category === 'SEGURANCA') {
                  catBadge = <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-red-100 text-red-800">SEGURANÇA</span>;
                }

                return (
                  <tr key={log.id} className="hover:bg-stone-50/80 transition">
                    <td className="py-3 px-4 font-mono text-[11px] text-stone-500 whitespace-nowrap">
                      {new Date(log.timestamp).toLocaleDateString('pt-BR')} {new Date(log.timestamp).toLocaleTimeString('pt-BR')}
                    </td>
                    <td className="py-3 px-4">{catBadge}</td>
                    <td className="py-3 px-4 font-bold text-stone-900">{log.action}</td>
                    <td className="py-3 px-4 text-stone-700">{log.details}</td>
                    <td className="py-3 px-4 font-medium text-stone-900">{log.userName}</td>
                    <td className="py-3 px-4">
                      <span className="text-[11px] font-semibold text-stone-500">{log.userRole}</span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
