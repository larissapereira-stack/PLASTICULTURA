import 'dotenv/config';
import express from 'express';
import crypto from 'node:crypto';
import fs from 'node:fs';
import path from 'node:path';
import type { Request, Response, NextFunction } from 'express';
import type {
  UserPermissionKey,
  UserPermissions,
  UserProfile,
  UserRole,
  UserStatus,
} from './src/types/index.ts';
import { normalizePermissions } from './src/utils/permissions.ts';

interface StoredUser {
  id: string;
  name: string;
  email: string;
  login: string;
  role: UserRole;
  jobTitle: string;
  farmScope: string;
  farmAssigned?: string;
  status: UserStatus;
  permissions: UserPermissions;
  passwordHash?: string;
  passwordSalt?: string;
  tokenVersion: number;
  lastLoginAt?: string;
  createdAt: string;
  updatedAt: string;
  avatarUrl?: string;
}

interface StoredInvite {
  id: string;
  userId: string;
  token: string;
  expiresAt: string;
  createdAt: string;
  createdBy: string;
  revoked: boolean;
  revokedAt?: string;
  usedAt?: string;
}

interface AccessControlStore {
  adminBootstrapped: boolean;
  users: StoredUser[];
  invites: StoredInvite[];
}

interface TokenPayload {
  sub: string;
  role: UserRole;
  v: number;
  exp: number;
}

interface AuthenticatedRequest extends Request {
  authUser?: StoredUser;
}

const PORT = Number(process.env.PORT || 3000);
const SESSION_SECRET = process.env.SESSION_SECRET?.trim() || crypto.randomBytes(32).toString('hex');
const TOKEN_TTL_MS = 12 * 60 * 60 * 1000;
const DATA_DIR = path.resolve(process.cwd(), '.data');
const STORE_PATH = path.join(DATA_DIR, 'access-control.json');

const FARM_NAMES: Record<string, string> = {
  'farm-lab1': 'Labrunier I',
  'farm-lab2': 'Labrunier II',
  'farm-br-uvas': 'Brasil Uvas',
  'farm-vale-uvas': 'Vale das Uvas',
};

const VALID_ROLES: UserRole[] = ['Administrador', 'Gestor', 'Operador'];
const VALID_STATUSES: UserStatus[] = ['Ativo', 'Inativo'];
const VALID_PERMISSION_KEYS: UserPermissionKey[] = [
  'view_info',
  'create_records',
  'edit_records',
  'delete_records',
  'access_reports',
  'access_plasticulture_activities',
  'access_covered_areas',
  'access_catalogs',
  'access_user_management',
];

function createDefaultStore(): AccessControlStore {
  const now = new Date().toISOString();
  return {
    adminBootstrapped: false,
    users: [
      {
        id: 'user-larissa',
        name: 'Larissa Pereira',
        email: 'larissa.pereira@elciruelo.com.br',
        login: 'larissa.pereira',
        role: 'Administrador',
        jobTitle: 'Administradora Geral de Plasticultura',
        farmScope: 'ALL',
        status: 'Ativo',
        permissions: normalizePermissions('Administrador'),
        tokenVersion: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'user-carlos',
        name: 'Carlos Eduardo Mendes',
        email: 'carlos.mendes@labrunier.com.br',
        login: 'carlos.mendes',
        role: 'Gestor',
        jobTitle: 'Gestor Agrícola',
        farmScope: 'farm-lab1',
        farmAssigned: 'Labrunier I',
        status: 'Ativo',
        permissions: normalizePermissions('Gestor'),
        tokenVersion: 1,
        createdAt: now,
        updatedAt: now,
      },
      {
        id: 'user-joao',
        name: 'João Marcos da Silva',
        email: 'joao.silva@fazendas.com.br',
        login: 'joao.silva',
        role: 'Operador',
        jobTitle: 'Operador de Campo',
        farmScope: 'farm-br-uvas',
        farmAssigned: 'Brasil Uvas',
        status: 'Ativo',
        permissions: normalizePermissions('Operador'),
        tokenVersion: 1,
        createdAt: now,
        updatedAt: now,
      },
    ],
    invites: [],
  };
}

function readStore(): AccessControlStore {
  try {
    if (!fs.existsSync(STORE_PATH)) {
      const initial = createDefaultStore();
      writeStore(initial);
      return initial;
    }
    const raw = fs.readFileSync(STORE_PATH, 'utf-8');
    const parsed = JSON.parse(raw) as AccessControlStore;
    if (!Array.isArray(parsed.users) || parsed.users.length === 0) {
      const initial = createDefaultStore();
      writeStore(initial);
      return initial;
    }
    return {
      adminBootstrapped: Boolean(parsed.adminBootstrapped),
      users: parsed.users.map((u) => ({
        ...u,
        login: u.login || u.email.split('@')[0] || u.id,
        farmScope: u.farmScope || 'ALL',
        status: VALID_STATUSES.includes(u.status) ? u.status : 'Ativo',
        permissions: normalizePermissions(u.role, u.permissions),
        tokenVersion: typeof u.tokenVersion === 'number' ? u.tokenVersion : 1,
      })),
      invites: Array.isArray(parsed.invites) ? parsed.invites : [],
    };
  } catch {
    const initial = createDefaultStore();
    writeStore(initial);
    return initial;
  }
}

function writeStore(store: AccessControlStore): void {
  fs.mkdirSync(DATA_DIR, { recursive: true });
  const tmpPath = `${STORE_PATH}.tmp`;
  fs.writeFileSync(tmpPath, JSON.stringify(store, null, 2), { encoding: 'utf-8', mode: 0o600 });
  fs.renameSync(tmpPath, STORE_PATH);
}

function hashPassword(password: string, salt?: string): { hash: string; salt: string } {
  const actualSalt = salt || crypto.randomBytes(16).toString('hex');
  const derived = crypto.scryptSync(password, actualSalt, 64).toString('hex');
  return { hash: derived, salt: actualSalt };
}

function verifyPassword(password: string, storedHash?: string, storedSalt?: string): boolean {
  if (!storedHash || !storedSalt) return false;
  const candidate = crypto.scryptSync(password, storedSalt, 64);
  const expected = Buffer.from(storedHash, 'hex');
  if (candidate.length !== expected.length) return false;
  return crypto.timingSafeEqual(candidate, expected);
}

function verifyEnvPasscode(candidate: string, envPasscode: string): boolean {
  const a = crypto.createHash('sha256').update(candidate).digest();
  const b = crypto.createHash('sha256').update(envPasscode).digest();
  return crypto.timingSafeEqual(a, b);
}

function signSessionToken(user: StoredUser): string {
  const payload: TokenPayload = {
    sub: user.id,
    role: user.role,
    v: user.tokenVersion,
    exp: Date.now() + TOKEN_TTL_MS,
  };
  const payloadEncoded = Buffer.from(JSON.stringify(payload), 'utf-8').toString('base64url');
  const sig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadEncoded).digest('base64url');
  return `${payloadEncoded}.${sig}`;
}

function verifySessionToken(token: string): TokenPayload | null {
  const parts = token.split('.');
  if (parts.length !== 2) return null;
  const [payloadEncoded, sig] = parts;
  if (!payloadEncoded || !sig) return null;

  const expectedSig = crypto.createHmac('sha256', SESSION_SECRET).update(payloadEncoded).digest('base64url');
  const sigBuf = Buffer.from(sig);
  const expectedBuf = Buffer.from(expectedSig);
  if (sigBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(sigBuf, expectedBuf)) {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(payloadEncoded, 'base64url').toString('utf-8')) as TokenPayload;
    if (!payload.sub || typeof payload.exp !== 'number' || payload.exp <= Date.now()) {
      return null;
    }
    return payload;
  } catch {
    return null;
  }
}

function sanitizeUser(user: StoredUser): UserProfile {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    login: user.login,
    role: user.role,
    jobTitle: user.jobTitle,
    farmScope: user.farmScope,
    farmAssigned: user.farmScope === 'ALL' ? 'Todas as Fazendas' : FARM_NAMES[user.farmScope] || user.farmAssigned,
    status: user.status,
    permissions: normalizePermissions(user.role, user.permissions),
    hasPasswordSet: Boolean(user.passwordHash),
    lastLoginAt: user.lastLoginAt,
    createdAt: user.createdAt,
    updatedAt: user.updatedAt,
    avatarUrl: user.avatarUrl || '',
  };
}

function getEnvAdminPasscode(): string {
  const val = process.env.ADMIN_PASSCODE?.trim();
  return val || '';
}

function getPublicBaseUrl(req: Request): string {
  const configured = process.env.APP_URL?.trim();
  if (configured && configured !== 'MY_APP_URL' && /^https?:\/\//i.test(configured)) {
    return configured.replace(/\/+$/, '');
  }
  const protoHeader = (req.headers['x-forwarded-proto'] as string | undefined)?.split(',')[0]?.trim();
  const proto = protoHeader || req.protocol || 'https';
  const hostHeader = (req.headers['x-forwarded-host'] as string | undefined)?.split(',')[0]?.trim();
  const host = hostHeader || req.get('host') || `localhost:${PORT}`;
  return `${proto}://${host}`;
}

function getInviteStatus(invite: StoredInvite): 'Ativo' | 'Expirado' | 'Revogado' | 'Utilizado' {
  if (invite.revoked) return 'Revogado';
  if (invite.usedAt) return 'Utilizado';
  if (new Date(invite.expiresAt).getTime() <= Date.now()) return 'Expirado';
  return 'Ativo';
}

function sanitizeInvite(invite: StoredInvite, baseUrl: string, users: StoredUser[]) {
  const owner = users.find((u) => u.id === invite.userId);
  return {
    id: invite.id,
    userId: invite.userId,
    userName: owner?.name || 'Usuário removido',
    userEmail: owner?.email || '',
    userRole: owner?.role || 'Operador',
    farmScope: owner?.farmScope || 'ALL',
    token: invite.token,
    url: `${baseUrl}/?invite=${encodeURIComponent(invite.token)}`,
    expiresAt: invite.expiresAt,
    createdAt: invite.createdAt,
    createdBy: invite.createdBy,
    revoked: invite.revoked,
    revokedAt: invite.revokedAt,
    usedAt: invite.usedAt,
    status: getInviteStatus(invite),
  };
}

function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const authHeader = req.headers.authorization;
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    res.status(401).json({ error: 'Autenticação obrigatória.' });
    return;
  }
  const token = authHeader.slice(7).trim();
  const payload = verifySessionToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Sessão expirada ou inválida. Faça login novamente.' });
    return;
  }

  const store = readStore();
  const user = store.users.find((u) => u.id === payload.sub);
  if (!user || user.status !== 'Ativo' || user.tokenVersion !== payload.v) {
    res.status(401).json({ error: 'Acesso revogado ou usuário inativo.' });
    return;
  }

  req.authUser = user;
  next();
}

function requireAdmin(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  if (!req.authUser || req.authUser.role !== 'Administrador' || req.authUser.status !== 'Ativo') {
    res.status(403).json({ error: 'Somente o administrador pode gerenciar usuários e permissões.' });
    return;
  }
  next();
}

function validateFarmScope(farmScope: unknown): string | null {
  if (typeof farmScope !== 'string') return null;
  const trimmed = farmScope.trim();
  if (trimmed === 'ALL' || Object.prototype.hasOwnProperty.call(FARM_NAMES, trimmed)) {
    return trimmed;
  }
  return null;
}

function parsePermissionsInput(role: UserRole, input: unknown): UserPermissions {
  if (!input || typeof input !== 'object') {
    return normalizePermissions(role);
  }
  const partial: Partial<UserPermissions> = {};
  const obj = input as Record<string, unknown>;
  for (const key of VALID_PERMISSION_KEYS) {
    if (typeof obj[key] === 'boolean') {
      partial[key] = obj[key] as boolean;
    }
  }
  return normalizePermissions(role, partial);
}

async function startServer() {
  const app = express();
  app.set('trust proxy', 1);
  app.use(express.json({ limit: '1mb' }));

  // Ensure initial store exists on disk
  readStore();

  // Public auth status (no user list or secrets leaked)
  app.get('/api/auth/status', (req, res) => {
    const store = readStore();
    const hasEnvPasscode = Boolean(getEnvAdminPasscode());
    const primaryAdmin = store.users.find((u) => u.role === 'Administrador' && u.status === 'Ativo');
    const needsAdminBootstrap =
      !hasEnvPasscode && !store.adminBootstrapped && !primaryAdmin?.passwordHash;

    res.json({
      hasEnvPasscode,
      needsAdminBootstrap,
      adminEmail: needsAdminBootstrap ? primaryAdmin?.email || 'larissa.pereira@elciruelo.com.br' : undefined,
      appPublicUrl: getPublicBaseUrl(req),
    });
  });

  // One-time inline first-run Admin password claim
  app.post('/api/auth/bootstrap-admin', (req, res) => {
    const hasEnvPasscode = Boolean(getEnvAdminPasscode());
    if (hasEnvPasscode) {
      res.status(403).json({ error: 'Senha administrativa configurada via ambiente.' });
      return;
    }

    const store = readStore();
    const adminIndex = store.users.findIndex((u) => u.role === 'Administrador');
    if (store.adminBootstrapped || (adminIndex >= 0 && store.users[adminIndex].passwordHash)) {
      res.status(403).json({ error: 'Configuração inicial já concluída. Utilize a tela de login.' });
      return;
    }

    const { email, password } = req.body as { email?: unknown; password?: unknown };
    if (typeof password !== 'string' || password.trim().length < 6 || password.length > 128) {
      res.status(400).json({ error: 'Defina uma senha com pelo menos 6 caracteres.' });
      return;
    }

    const now = new Date().toISOString();
    const { hash, salt } = hashPassword(password);

    if (adminIndex >= 0) {
      const currentAdmin = store.users[adminIndex];
      if (typeof email === 'string' && email.trim().length >= 3 && email.trim().length <= 120) {
        currentAdmin.email = email.trim().toLowerCase();
      }
      currentAdmin.passwordHash = hash;
      currentAdmin.passwordSalt = salt;
      currentAdmin.status = 'Ativo';
      currentAdmin.permissions = normalizePermissions('Administrador');
      currentAdmin.lastLoginAt = now;
      currentAdmin.updatedAt = now;
      store.adminBootstrapped = true;
      writeStore(store);

      const token = signSessionToken(currentAdmin);
      res.json({ token, user: sanitizeUser(currentAdmin) });
      return;
    }

    res.status(500).json({ error: 'Conta administradora padrão não encontrada.' });
  });

  // Standard login with email or login + password
  app.post('/api/auth/login', (req, res) => {
    const { identifier, password } = req.body as { identifier?: unknown; password?: unknown };
    if (typeof identifier !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Informe e-mail/login e senha.' });
      return;
    }

    const cleanId = identifier.trim().toLowerCase();
    if (!cleanId || !password) {
      res.status(400).json({ error: 'Informe e-mail/login e senha.' });
      return;
    }

    const store = readStore();
    const user = store.users.find(
      (u) => u.email.toLowerCase() === cleanId || u.login.toLowerCase() === cleanId
    );

    if (!user) {
      res.status(401).json({ error: 'Credenciais inválidas ou usuário não autorizado.' });
      return;
    }

    if (user.status !== 'Ativo') {
      res.status(403).json({
        error: 'Este usuário está bloqueado ou inativo. Solicite liberação ao administrador.',
      });
      return;
    }

    const envPasscode = getEnvAdminPasscode();
    const isEnvAdminMatch =
      user.role === 'Administrador' &&
      Boolean(envPasscode) &&
      verifyEnvPasscode(password, envPasscode);

    const isStoredMatch = verifyPassword(password, user.passwordHash, user.passwordSalt);

    if (!isEnvAdminMatch && !isStoredMatch) {
      if (!user.passwordHash && !isEnvAdminMatch) {
        res.status(401).json({
          error:
            'Acesso ainda não ativado para este usuário. Solicite ao administrador um link de convite ou QR Code.',
        });
        return;
      }
      res.status(401).json({ error: 'E-mail/login ou senha incorretos.' });
      return;
    }

    user.lastLoginAt = new Date().toISOString();
    writeStore(store);

    const token = signSessionToken(user);
    res.json({ token, user: sanitizeUser(user) });
  });

  app.get('/api/auth/me', requireAuth, (req: AuthenticatedRequest, res) => {
    res.json({ user: sanitizeUser(req.authUser!) });
  });

  app.post('/api/auth/logout', requireAuth, (_req, res) => {
    res.json({ success: true });
  });

  // Public invite validation
  app.get('/api/auth/invite/:token', (req, res) => {
    const token = String(req.params.token || '').trim();
    if (!token || token.length > 200) {
      res.status(400).json({ valid: false, reason: 'Link de convite inválido.' });
      return;
    }

    const store = readStore();
    const invite = store.invites.find((inv) => {
      const a = Buffer.from(inv.token);
      const b = Buffer.from(token);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    });

    if (!invite) {
      res.status(404).json({ valid: false, reason: 'Link de convite não encontrado.' });
      return;
    }

    const status = getInviteStatus(invite);
    if (status === 'Revogado') {
      res.status(403).json({ valid: false, reason: 'Este link de convite foi revogado pelo administrador.' });
      return;
    }
    if (status === 'Utilizado') {
      res.status(410).json({ valid: false, reason: 'Este link de convite já foi utilizado. Faça login com sua senha.' });
      return;
    }
    if (status === 'Expirado') {
      res.status(410).json({ valid: false, reason: 'Este link de convite expirou. Solicite um novo QR Code ao administrador.' });
      return;
    }

    const user = store.users.find((u) => u.id === invite.userId);
    if (!user) {
      res.status(404).json({ valid: false, reason: 'Usuário vinculado não encontrado.' });
      return;
    }
    if (user.status !== 'Ativo') {
      res.status(403).json({ valid: false, reason: 'Este usuário está bloqueado ou inativo pelo administrador.' });
      return;
    }

    res.json({
      valid: true,
      expiresAt: invite.expiresAt,
      user: {
        name: user.name,
        email: user.email,
        login: user.login,
        role: user.role,
        jobTitle: user.jobTitle,
        farmScope: user.farmScope,
        farmAssigned: user.farmScope === 'ALL' ? 'Todas as Fazendas' : FARM_NAMES[user.farmScope] || 'Fazenda vinculada',
      },
    });
  });

  // Activate authorized user via QR Code / invite link
  app.post('/api/auth/activate-invite', (req, res) => {
    const { token, password } = req.body as { token?: unknown; password?: unknown };
    if (typeof token !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Token e senha são obrigatórios.' });
      return;
    }
    if (password.trim().length < 6 || password.length > 128) {
      res.status(400).json({ error: 'A senha deve possuir no mínimo 6 caracteres.' });
      return;
    }

    const cleanToken = token.trim();
    const store = readStore();
    const invite = store.invites.find((inv) => {
      const a = Buffer.from(inv.token);
      const b = Buffer.from(cleanToken);
      return a.length === b.length && crypto.timingSafeEqual(a, b);
    });

    if (!invite) {
      res.status(404).json({ error: 'Link de convite inválido.' });
      return;
    }

    const status = getInviteStatus(invite);
    if (status !== 'Ativo') {
      res.status(403).json({
        error:
          status === 'Revogado'
            ? 'Este convite foi revogado pelo administrador.'
            : status === 'Utilizado'
              ? 'Este convite já foi utilizado.'
              : 'Este link de convite expirou.',
      });
      return;
    }

    const user = store.users.find((u) => u.id === invite.userId);
    if (!user || user.status !== 'Ativo') {
      res.status(403).json({ error: 'Usuário inativo ou não autorizado.' });
      return;
    }

    const now = new Date().toISOString();
    const { hash, salt } = hashPassword(password);
    user.passwordHash = hash;
    user.passwordSalt = salt;
    user.tokenVersion += 1;
    user.lastLoginAt = now;
    user.updatedAt = now;
    invite.usedAt = now;

    writeStore(store);

    const sessionToken = signSessionToken(user);
    res.json({ token: sessionToken, user: sanitizeUser(user) });
  });

  app.get('/api/config/public-url', requireAuth, (req, res) => {
    res.json({ publicUrl: getPublicBaseUrl(req) });
  });

  // Admin-only: List users & invites
  app.get('/api/users', requireAuth, requireAdmin, (req, res) => {
    const store = readStore();
    const baseUrl = getPublicBaseUrl(req);
    res.json({
      users: store.users.map(sanitizeUser),
      invites: store.invites
        .map((inv) => sanitizeInvite(inv, baseUrl, store.users))
        .sort((a, b) => b.createdAt.localeCompare(a.createdAt)),
      publicUrl: baseUrl,
    });
  });

  // Admin-only: Create user
  app.post('/api/users', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
    const body = req.body as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim() : '';
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : '';
    const login = typeof body.login === 'string' && body.login.trim()
      ? body.login.trim().toLowerCase()
      : email.split('@')[0] || '';
    const role = VALID_ROLES.includes(body.role as UserRole) ? (body.role as UserRole) : null;
    const status = VALID_STATUSES.includes(body.status as UserStatus) ? (body.status as UserStatus) : 'Ativo';
    const farmScope = validateFarmScope(body.farmScope || 'ALL');
    const jobTitle = typeof body.jobTitle === 'string' ? body.jobTitle.trim() : '';
    const initialPassword = typeof body.initialPassword === 'string' ? body.initialPassword : '';

    if (name.length < 2 || name.length > 120) {
      res.status(400).json({ error: 'Informe um nome completo válido.' });
      return;
    }
    if (email.length < 3 || email.length > 150) {
      res.status(400).json({ error: 'Informe um e-mail ou login válido.' });
      return;
    }
    if (!role) {
      res.status(400).json({ error: 'Cargo/perfil inválido.' });
      return;
    }
    if (!farmScope) {
      res.status(400).json({ error: 'Fazenda vinculada inválida.' });
      return;
    }
    if (initialPassword && initialPassword.trim().length < 6) {
      res.status(400).json({ error: 'A senha inicial deve possuir no mínimo 6 caracteres.' });
      return;
    }

    const store = readStore();
    const duplicate = store.users.find(
      (u) => u.email.toLowerCase() === email || (login && u.login.toLowerCase() === login)
    );
    if (duplicate) {
      res.status(409).json({ error: 'Já existe um usuário cadastrado com este e-mail ou login.' });
      return;
    }

    const now = new Date().toISOString();
    const id = `user-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`;
    const permissions = parsePermissionsInput(role, body.permissions);

    let passwordHash: string | undefined;
    let passwordSalt: string | undefined;
    if (initialPassword.trim().length >= 6) {
      const hashed = hashPassword(initialPassword);
      passwordHash = hashed.hash;
      passwordSalt = hashed.salt;
    }

    const newUser: StoredUser = {
      id,
      name,
      email,
      login,
      role,
      jobTitle: jobTitle || role,
      farmScope,
      farmAssigned: farmScope === 'ALL' ? 'Todas as Fazendas' : FARM_NAMES[farmScope],
      status,
      permissions,
      passwordHash,
      passwordSalt,
      tokenVersion: 1,
      createdAt: now,
      updatedAt: now,
    };

    store.users.push(newUser);
    writeStore(store);

    res.status(201).json({ user: sanitizeUser(newUser) });
  });

  // Admin-only: Update user & permissions
  app.put('/api/users/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
    const id = String(req.params.id || '').trim();
    const store = readStore();
    const user = store.users.find((u) => u.id === id);
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    const body = req.body as Record<string, unknown>;
    const name = typeof body.name === 'string' ? body.name.trim() : user.name;
    const email = typeof body.email === 'string' ? body.email.trim().toLowerCase() : user.email;
    const login = typeof body.login === 'string' && body.login.trim()
      ? body.login.trim().toLowerCase()
      : user.login;
    const role = VALID_ROLES.includes(body.role as UserRole) ? (body.role as UserRole) : user.role;
    const status = VALID_STATUSES.includes(body.status as UserStatus) ? (body.status as UserStatus) : user.status;
    const farmScope = body.farmScope !== undefined ? validateFarmScope(body.farmScope) : user.farmScope;
    const jobTitle = typeof body.jobTitle === 'string' ? body.jobTitle.trim() : user.jobTitle;
    const newPassword = typeof body.newPassword === 'string' ? body.newPassword : '';

    if (name.length < 2 || name.length > 120) {
      res.status(400).json({ error: 'Nome completo inválido.' });
      return;
    }
    if (email.length < 3 || email.length > 150) {
      res.status(400).json({ error: 'E-mail ou login inválido.' });
      return;
    }
    if (!farmScope) {
      res.status(400).json({ error: 'Fazenda vinculada inválida.' });
      return;
    }
    if (newPassword && newPassword.trim().length < 6) {
      res.status(400).json({ error: 'A nova senha deve ter pelo menos 6 caracteres.' });
      return;
    }

    // Prevent removing/blocking the last active Administrador
    const otherActiveAdmins = store.users.filter(
      (u) => u.id !== user.id && u.role === 'Administrador' && u.status === 'Ativo'
    );
    if ((role !== 'Administrador' || status !== 'Ativo') && otherActiveAdmins.length === 0) {
      res.status(400).json({
        error: 'O sistema precisa manter pelo menos um Administrador ativo.',
      });
      return;
    }

    const duplicate = store.users.find(
      (u) => u.id !== user.id && (u.email.toLowerCase() === email || (login && u.login.toLowerCase() === login))
    );
    if (duplicate) {
      res.status(409).json({ error: 'Outro usuário já utiliza este e-mail ou login.' });
      return;
    }

    user.name = name;
    user.email = email;
    user.login = login;
    user.role = role;
    user.jobTitle = jobTitle || role;
    user.farmScope = farmScope;
    user.farmAssigned = farmScope === 'ALL' ? 'Todas as Fazendas' : FARM_NAMES[farmScope];
    user.status = status;
    user.permissions = body.permissions !== undefined
      ? parsePermissionsInput(role, body.permissions)
      : normalizePermissions(role, user.permissions);

    if (newPassword.trim().length >= 6) {
      const hashed = hashPassword(newPassword);
      user.passwordHash = hashed.hash;
      user.passwordSalt = hashed.salt;
      user.tokenVersion += 1;
    } else if (status === 'Inativo') {
      user.tokenVersion += 1;
    }

    user.updatedAt = new Date().toISOString();
    writeStore(store);

    res.json({ user: sanitizeUser(user) });
  });

  // Admin-only: Quick Block / Unblock
  app.patch('/api/users/:id/status', requireAuth, requireAdmin, (req, res) => {
    const id = String(req.params.id || '').trim();
    const { status } = req.body as { status?: unknown };
    if (!VALID_STATUSES.includes(status as UserStatus)) {
      res.status(400).json({ error: 'Status inválido.' });
      return;
    }

    const store = readStore();
    const user = store.users.find((u) => u.id === id);
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    if (status === 'Inativo' && user.role === 'Administrador') {
      const otherAdmins = store.users.filter(
        (u) => u.id !== user.id && u.role === 'Administrador' && u.status === 'Ativo'
      );
      if (otherAdmins.length === 0) {
        res.status(400).json({ error: 'Não é possível bloquear o último administrador ativo.' });
        return;
      }
    }

    user.status = status as UserStatus;
    if (user.status === 'Inativo') {
      user.tokenVersion += 1;
    }
    user.updatedAt = new Date().toISOString();
    writeStore(store);

    res.json({ user: sanitizeUser(user) });
  });

  // Admin-only: Delete user
  app.delete('/api/users/:id', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
    const id = String(req.params.id || '').trim();
    if (req.authUser?.id === id) {
      res.status(400).json({ error: 'Você não pode excluir o próprio usuário conectado.' });
      return;
    }

    const store = readStore();
    const target = store.users.find((u) => u.id === id);
    if (!target) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }

    if (target.role === 'Administrador') {
      const otherAdmins = store.users.filter(
        (u) => u.id !== target.id && u.role === 'Administrador' && u.status === 'Ativo'
      );
      if (otherAdmins.length === 0) {
        res.status(400).json({ error: 'Não é possível excluir o último administrador ativo.' });
        return;
      }
    }

    store.users = store.users.filter((u) => u.id !== id);
    store.invites = store.invites.filter((inv) => inv.userId !== id);
    writeStore(store);

    res.json({ success: true });
  });

  // Admin-only: Generate Invite Link + QR Code token
  app.post('/api/invites', requireAuth, requireAdmin, (req: AuthenticatedRequest, res) => {
    const { userId, expiresInHours } = req.body as { userId?: unknown; expiresInHours?: unknown };
    if (typeof userId !== 'string' || !userId.trim()) {
      res.status(400).json({ error: 'Selecione um usuário válido para gerar o convite.' });
      return;
    }

    const hours = Number(expiresInHours) || 72;
    const boundedHours = Math.max(1, Math.min(720, hours));

    const store = readStore();
    const user = store.users.find((u) => u.id === userId.trim());
    if (!user) {
      res.status(404).json({ error: 'Usuário não encontrado.' });
      return;
    }
    if (user.status !== 'Ativo') {
      res.status(400).json({ error: 'Reative o usuário antes de gerar um link ou QR Code de acesso.' });
      return;
    }

    const now = new Date();
    const expiresAt = new Date(now.getTime() + boundedHours * 60 * 60 * 1000).toISOString();
    const newInvite: StoredInvite = {
      id: `inv-${Date.now()}-${crypto.randomBytes(3).toString('hex')}`,
      userId: user.id,
      token: crypto.randomBytes(24).toString('base64url'),
      expiresAt,
      createdAt: now.toISOString(),
      createdBy: req.authUser!.name,
      revoked: false,
    };

    store.invites.push(newInvite);
    writeStore(store);

    const baseUrl = getPublicBaseUrl(req);
    res.status(201).json({
      invite: sanitizeInvite(newInvite, baseUrl, store.users),
    });
  });

  // Admin-only: Revoke invite link
  app.post('/api/invites/:id/revoke', requireAuth, requireAdmin, (req, res) => {
    const id = String(req.params.id || '').trim();
    const store = readStore();
    const invite = store.invites.find((inv) => inv.id === id);
    if (!invite) {
      res.status(404).json({ error: 'Link de convite não encontrado.' });
      return;
    }

    invite.revoked = true;
    invite.revokedAt = new Date().toISOString();
    writeStore(store);

    const baseUrl = getPublicBaseUrl(req);
    res.json({
      invite: sanitizeInvite(invite, baseUrl, store.users),
    });
  });

  const isProd = process.env.NODE_ENV === 'production';
  if (!isProd) {
    const { createServer: createViteServer } = await import('vite');
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  } else {
    const distDir = path.resolve(process.cwd(), 'dist');
    app.use(express.static(distDir));
    app.get('*', (_req, res) => {
      res.sendFile(path.join(distDir, 'index.html'));
    });
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Plasticultura Fazendas server listening on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
