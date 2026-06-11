import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  FileCheck2,
  FileStack,
  FolderKanban,
  Languages,
  LogOut,
  Menu,
  Settings,
  ShieldCheck,
  Users,
  X
} from "lucide-react";
import {
  CurrentUser,
  getCurrentUser,
  getHealth,
  HealthStatus,
  login
} from "../services/api/auth";
import { ApiError } from "../services/api/client";

const TOKEN_STORAGE_KEY = "trustnetdocs.accessToken";

interface NavigationItem {
  label: string;
  icon: typeof FileStack;
  roles?: string[];
}

const navigation: NavigationItem[] = [
  { label: "Visao geral", icon: FolderKanban },
  { label: "Minhas solicitacoes", icon: FileCheck2 },
  { label: "Solicitacoes", icon: FileStack, roles: ["SuperAdmin", "Administrator"] },
  { label: "Clientes", icon: Building2, roles: ["SuperAdmin", "Administrator"] },
  { label: "Usuarios", icon: Users, roles: ["SuperAdmin"] },
  { label: "Configuracoes", icon: Settings, roles: ["SuperAdmin"] }
];

function hasAnyRole(user: CurrentUser, roles?: string[]) {
  return !roles || roles.some((role) => user.roles.includes(role));
}

export function App() {
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [sessionLoading, setSessionLoading] = useState(Boolean(token));

  useEffect(() => {
    getHealth().then(setHealth).catch(() => setHealth(null));
  }, []);

  useEffect(() => {
    if (!token) {
      setSessionLoading(false);
      return;
    }

    getCurrentUser(token)
      .then(setUser)
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
      })
      .finally(() => setSessionLoading(false));
  }, [token]);

  function handleAuthenticated(accessToken: string, currentUser: CurrentUser) {
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    setToken(accessToken);
    setUser(currentUser);
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }

  if (sessionLoading) {
    return <AppLoading />;
  }

  if (!token || !user) {
    return <LoginScreen health={health} onAuthenticated={handleAuthenticated} />;
  }

  return <Workspace user={user} health={health} onLogout={handleLogout} />;
}

function AppLoading() {
  return (
    <main className="loading-screen">
      <BrandMark />
      <div className="loading-line" />
    </main>
  );
}

function LoginScreen({
  health,
  onAuthenticated
}: {
  health: HealthStatus | null;
  onAuthenticated: (token: string, user: CurrentUser) => void;
}) {
  const [loginValue, setLoginValue] = useState("tenantadmin@trustnetdocs.local");
  const [password, setPassword] = useState("TrustNet@123");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const result = await login(loginValue, password);
      if (result.requiresTwoFactor || !result.accessToken) {
        setError("Esta conta requer a etapa de autenticacao em dois fatores.");
        return;
      }

      const currentUser = await getCurrentUser(result.accessToken);
      onAuthenticated(result.accessToken, currentUser);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Nao foi possivel acessar a API."
      );
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <main className="login-page">
      <section className="login-brand-panel">
        <div className="brand-lockup">
          <BrandMark />
          <span>TrustNetDocs</span>
        </div>
        <div className="login-message">
          <span className="eyebrow">Gestao segura de documentos</span>
          <h1>Documentos organizados. Acessos sob controle.</h1>
          <p>
            Centralize solicitacoes, acompanhe envios e revise documentos em um
            unico ambiente por empresa.
          </p>
        </div>
        <div className="security-note">
          <ShieldCheck size={20} />
          <span>Permissoes por perfil e isolamento por empresa</span>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-wrap">
          <div className="mobile-brand">
            <BrandMark />
            <span>TrustNetDocs</span>
          </div>

          <div className="form-heading">
            <h2>Acesse sua conta</h2>
            <p>Use suas credenciais para continuar.</p>
          </div>

          <form onSubmit={handleSubmit}>
            <label htmlFor="login">E-mail</label>
            <input
              id="login"
              autoComplete="username"
              value={loginValue}
              onChange={(event) => setLoginValue(event.target.value)}
              placeholder="nome@empresa.com"
            />

            <div className="label-row">
              <label htmlFor="password">Senha</label>
              <button className="text-button" type="button">
                Esqueci minha senha
              </button>
            </div>
            <input
              id="password"
              type="password"
              autoComplete="current-password"
              value={password}
              onChange={(event) => setPassword(event.target.value)}
              placeholder="Sua senha"
            />

            {error && <div className="form-error">{error}</div>}

            <button className="primary-button" disabled={submitting} type="submit">
              {submitting ? "Entrando..." : "Entrar"}
              {!submitting && <ChevronRight size={18} />}
            </button>
          </form>

          <div className={`api-status ${health ? "online" : "offline"}`}>
            <span className="status-dot" />
            {health
              ? `API e banco ${health.databaseStatus.toLowerCase()}`
              : "API indisponivel"}
          </div>
        </div>
      </section>
    </main>
  );
}

function Workspace({
  user,
  health,
  onLogout
}: {
  user: CurrentUser;
  health: HealthStatus | null;
  onLogout: () => void;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const visibleNavigation = useMemo(
    () => navigation.filter((item) => hasAnyRole(user, item.roles)),
    [user]
  );

  return (
    <div className="workspace">
      {sidebarOpen && (
        <button
          aria-label="Fechar menu"
          className="sidebar-backdrop"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      <aside className={`sidebar ${sidebarOpen ? "open" : ""}`}>
        <div className="sidebar-header">
          <div className="brand-lockup compact">
            <BrandMark />
            <span>TrustNetDocs</span>
          </div>
          <button
            aria-label="Fechar menu"
            className="icon-button mobile-only"
            onClick={() => setSidebarOpen(false)}
          >
            <X size={20} />
          </button>
        </div>

        <nav>
          {visibleNavigation.map((item, index) => {
            const Icon = item.icon;
            return (
              <button className={index === 0 ? "active" : ""} key={item.label}>
                <Icon size={18} />
                <span>{item.label}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className={`compact-status ${health ? "online" : ""}`}>
            <span className="status-dot" />
            Sistema {health ? "online" : "indisponivel"}
          </div>
          <button onClick={onLogout}>
            <LogOut size={18} />
            <span>Sair</span>
          </button>
        </div>
      </aside>

      <div className="workspace-main">
        <header className="topbar">
          <button
            aria-label="Abrir menu"
            className="icon-button mobile-only"
            onClick={() => setSidebarOpen(true)}
          >
            <Menu size={21} />
          </button>
          <div className="topbar-spacer" />
          <button className="language-button">
            <Languages size={17} />
            {user.preferredCulture}
          </button>
          <button className="user-menu">
            <span className="avatar">
              <CircleUserRound size={21} />
            </span>
            <span className="user-meta">
              <strong>{user.displayName}</strong>
              <small>{getRoleLabel(user.roles)}</small>
            </span>
          </button>
        </header>

        <main className="dashboard">
          <div className="page-heading">
            <div>
              <span className="eyebrow">Visao geral</span>
              <h1>Ola, {user.displayName.split(" ")[0]}</h1>
              <p>Acompanhe o trabalho recente da sua empresa.</p>
            </div>
            <button className="primary-button compact-button">
              Nova solicitacao
              <ChevronRight size={17} />
            </button>
          </div>

          <section className="metric-grid">
            <Metric label="Aguardando envio" value="0" detail="Solicitacoes abertas" />
            <Metric label="Em analise" value="0" detail="Documentos recebidos" />
            <Metric label="Aprovadas" value="0" detail="Concluidas no periodo" />
            <Metric label="Reenvio solicitado" value="0" detail="Precisam de atencao" />
          </section>

          <section className="dashboard-section">
            <div className="section-heading">
              <div>
                <h2>Solicitacoes recentes</h2>
                <p>Os dados reais serao carregados no proximo modulo.</p>
              </div>
              <button className="text-button">Ver todas</button>
            </div>

            <div className="empty-state">
              <span className="empty-icon">
                <FileStack size={24} />
              </span>
              <h3>Nenhuma solicitacao encontrada</h3>
              <p>Crie a primeira solicitacao para iniciar o fluxo de documentos.</p>
              <button className="secondary-button">Criar solicitacao</button>
            </div>
          </section>
        </main>
      </div>
    </div>
  );
}

function Metric({
  label,
  value,
  detail
}: {
  label: string;
  value: string;
  detail: string;
}) {
  return (
    <article className="metric">
      <div className="metric-label">
        <span>{label}</span>
        <CheckCircle2 size={17} />
      </div>
      <strong>{value}</strong>
      <small>{detail}</small>
    </article>
  );
}

function BrandMark() {
  return (
    <span className="brand-mark" aria-hidden="true">
      <img src="/brand/trustnetbr-icon.png" alt="" />
    </span>
  );
}

function getRoleLabel(roles: string[]) {
  if (roles.includes("SuperAdmin")) return "Administrador do sistema";
  if (roles.includes("Administrator")) return "Administrador da empresa";
  return "Usuario";
}
