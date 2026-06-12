import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  FileCheck2,
  FileStack,
  FolderKanban,
  LibraryBig,
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
  getCurrentUserAvatar,
  getCurrentUser,
  getHealth,
  HealthStatus,
  login
} from "../services/api/auth";
import { ApiError, setApiCulture } from "../services/api/client";
import { getRequests, RequestSummary } from "../services/api/requests";
import {
  getRequestMetrics,
  RequestsView
} from "../features/requests/RequestsView";
import { CreateRequestView } from "../features/requests/CreateRequestView";
import { PublicRequestPage } from "../features/publicRequests/PublicRequestPage";
import { RequestDetailsView } from "../features/requests/RequestDetailsView";
import { ClientsView } from "../features/clients/ClientsView";
import { ProfileView } from "../features/profile/ProfileView";
import { UsersView } from "../features/users/UsersView";
import { SettingsView } from "../features/settings/SettingsView";
import { CatalogsView } from "../features/catalogs/CatalogsView";

const TOKEN_STORAGE_KEY = "trustnetdocs.accessToken";

interface NavigationItem {
  id: ViewId;
  label: string;
  icon: typeof FileStack;
  roles?: string[];
}

type ViewId =
  | "dashboard"
  | "my-requests"
  | "requests"
  | "new-request"
  | "request-detail"
  | "profile"
  | "clients"
  | "catalogs"
  | "users"
  | "settings";

const navigation: NavigationItem[] = [
  { id: "dashboard", label: "Visao geral", icon: FolderKanban },
  { id: "my-requests", label: "Minhas solicitacoes", icon: FileCheck2 },
  {
    id: "requests",
    label: "Solicitacoes",
    icon: FileStack,
    roles: ["SuperAdmin", "Administrator"]
  },
  {
    id: "clients",
    label: "Clientes",
    icon: Building2,
    roles: ["SuperAdmin", "Administrator"]
  },
  {
    id: "catalogs",
    label: "Catalogos",
    icon: LibraryBig,
    roles: ["SuperAdmin", "Administrator"]
  },
  { id: "users", label: "Usuarios", icon: Users, roles: ["SuperAdmin"] },
  { id: "settings", label: "Configuracoes", icon: Settings, roles: ["SuperAdmin"] }
];

function hasAnyRole(user: CurrentUser, roles?: string[]) {
  return !roles || roles.some((role) => user.roles.includes(role));
}

export function App() {
  const publicToken = getPublicRequestToken();
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [sessionLoading, setSessionLoading] = useState(Boolean(token));

  useEffect(() => {
    if (publicToken) return;
    getHealth().then(setHealth).catch(() => setHealth(null));
  }, [publicToken]);

  useEffect(() => {
    if (publicToken) {
      setSessionLoading(false);
      return;
    }

    if (!token) {
      setSessionLoading(false);
      return;
    }

    getCurrentUser(token)
      .then((currentUser) => {
        setApiCulture(currentUser.preferredCulture);
        setUser(currentUser);
      })
      .catch(() => {
        localStorage.removeItem(TOKEN_STORAGE_KEY);
        setToken(null);
      })
      .finally(() => setSessionLoading(false));
  }, [publicToken, token]);

  function handleAuthenticated(accessToken: string, currentUser: CurrentUser) {
    localStorage.setItem(TOKEN_STORAGE_KEY, accessToken);
    setApiCulture(currentUser.preferredCulture);
    setToken(accessToken);
    setUser(currentUser);
  }

  function handleLogout() {
    localStorage.removeItem(TOKEN_STORAGE_KEY);
    setToken(null);
    setUser(null);
  }

  if (publicToken) {
    return <PublicRequestPage token={publicToken} />;
  }

  if (sessionLoading) {
    return <AppLoading />;
  }

  if (!token || !user) {
    return <LoginScreen health={health} onAuthenticated={handleAuthenticated} />;
  }

  return (
    <Workspace
      token={token}
      user={user}
      health={health}
      onLogout={handleLogout}
      onUserUpdated={setUser}
    />
  );
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
  token,
  user,
  health,
  onLogout,
  onUserUpdated
}: {
  token: string;
  user: CurrentUser;
  health: HealthStatus | null;
  onLogout: () => void;
  onUserUpdated: (user: CurrentUser) => void;
}) {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [activeView, setActiveView] = useState<ViewId>("dashboard");
  const [selectedRequest, setSelectedRequest] = useState<{
    id: number;
    mineOnly: boolean;
  } | null>(null);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const visibleNavigation = useMemo(
    () => navigation.filter((item) => hasAnyRole(user, item.roles)),
    [user]
  );

  useEffect(() => {
    let objectUrl: string | null = null;

    getCurrentUserAvatar(token)
      .then((avatar) => {
        if (!avatar) {
          setAvatarUrl(null);
          return;
        }

        objectUrl = URL.createObjectURL(avatar);
        setAvatarUrl(objectUrl);
      })
      .catch(() => setAvatarUrl(null));

    return () => {
      if (objectUrl) URL.revokeObjectURL(objectUrl);
    };
  }, [avatarVersion, token]);

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
          {visibleNavigation.map((item) => {
            const Icon = item.icon;
            return (
              <button
                className={activeView === item.id ? "active" : ""}
                key={item.id}
                onClick={() => {
                  setActiveView(item.id);
                  setSidebarOpen(false);
                }}
              >
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
          <button
            className="language-button"
            onClick={() => setActiveView("profile")}
          >
            <Languages size={17} />
            {user.preferredCulture}
          </button>
          <button className="user-menu" onClick={() => setActiveView("profile")}>
            <span className="avatar">
              {avatarUrl ? (
                <img alt="" src={avatarUrl} />
              ) : (
                <CircleUserRound size={21} />
              )}
            </span>
            <span className="user-meta">
              <strong>{user.displayName}</strong>
              <small>{getRoleLabel(user.roles)}</small>
            </span>
          </button>
        </header>

        <main className="dashboard">
          {activeView === "dashboard" && (
            <Dashboard
              token={token}
              user={user}
              onCreateRequest={() => setActiveView("new-request")}
              onOpenRequests={() =>
                setActiveView(
                  hasAnyRole(user, ["SuperAdmin", "Administrator"])
                    ? "requests"
                    : "my-requests"
                )
              }
              onOpenRequest={(requestId, mineOnly) => {
                setSelectedRequest({ id: requestId, mineOnly });
                setActiveView("request-detail");
              }}
            />
          )}
          {activeView === "my-requests" && (
            <RequestsPage
              token={token}
              mineOnly
              onOpen={(requestId) => {
                setSelectedRequest({ id: requestId, mineOnly: true });
                setActiveView("request-detail");
              }}
              title="Minhas solicitacoes"
            />
          )}
          {activeView === "requests" && (
            <RequestsPage
              token={token}
              mineOnly={false}
              onCreate={() => setActiveView("new-request")}
              onOpen={(requestId) => {
                setSelectedRequest({ id: requestId, mineOnly: false });
                setActiveView("request-detail");
              }}
              title="Solicitacoes"
            />
          )}
          {activeView === "new-request" && (
            <CreateRequestView
              token={token}
              onCancel={() => setActiveView("requests")}
              onFinished={() => setActiveView("requests")}
            />
          )}
          {activeView === "request-detail" && selectedRequest && (
            <RequestDetailsView
              token={token}
              requestId={selectedRequest.id}
              mineOnly={selectedRequest.mineOnly}
              onBack={() =>
                setActiveView(selectedRequest.mineOnly ? "my-requests" : "requests")
              }
            />
          )}
          {activeView === "clients" && <ClientsView token={token} />}
          {activeView === "catalogs" && <CatalogsView token={token} />}
          {activeView === "profile" && (
            <ProfileView
              token={token}
              user={user}
              onAvatarChanged={() => setAvatarVersion((value) => value + 1)}
              onUserUpdated={onUserUpdated}
            />
          )}
          {activeView === "users" && (
            <UsersView currentUser={user} token={token} />
          )}
          {activeView === "settings" && (
            <SettingsView token={token} />
          )}
        </main>
      </div>
    </div>
  );
}

function Dashboard({
  token,
  user,
  onCreateRequest,
  onOpenRequest,
  onOpenRequests
}: {
  token: string;
  user: CurrentUser;
  onCreateRequest: () => void;
  onOpenRequest: (requestId: number, mineOnly: boolean) => void;
  onOpenRequests: () => void;
}) {
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const canManageRequests = hasAnyRole(user, ["SuperAdmin", "Administrator"]);

  useEffect(() => {
    getRequests(token, !canManageRequests).then(setRequests).catch(() => setRequests([]));
  }, [canManageRequests, token]);

  const metrics = getRequestMetrics(requests);

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Visao geral</span>
          <h1>Ola, {user.displayName.split(" ")[0]}</h1>
          <p>Acompanhe o trabalho recente da sua empresa.</p>
        </div>
        {canManageRequests && (
          <button
            className="primary-button compact-button"
            onClick={onCreateRequest}
          >
            Nova solicitacao
            <ChevronRight size={17} />
          </button>
        )}
      </div>

      <section className="metric-grid">
        <Metric
          label="Aguardando envio"
          value={String(metrics.waiting)}
          detail="Solicitacoes abertas"
        />
        <Metric
          label="Em analise"
          value={String(metrics.reviewing)}
          detail="Documentos recebidos"
        />
        <Metric
          label="Aprovadas"
          value={String(metrics.approved)}
          detail="Concluidas"
        />
        <Metric
          label="Reenvio solicitado"
          value={String(metrics.resubmission)}
          detail="Precisam de atencao"
        />
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>Solicitacoes recentes</h2>
            <p>Ultimas movimentacoes disponiveis para o seu perfil.</p>
          </div>
          <button className="text-button" onClick={onOpenRequests}>
            Ver todas
          </button>
        </div>
        <RequestsView
          compact
          mineOnly={!canManageRequests}
          onCreate={canManageRequests ? onCreateRequest : undefined}
          onOpen={(requestId) => onOpenRequest(requestId, !canManageRequests)}
          token={token}
        />
      </section>
    </>
  );
}

function RequestsPage({
  token,
  mineOnly,
  onCreate,
  onOpen,
  title
}: {
  token: string;
  mineOnly: boolean;
  onCreate?: () => void;
  onOpen?: (requestId: number) => void;
  title: string;
}) {
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Documentos</span>
          <h1>{title}</h1>
          <p>
            {mineOnly
              ? "Acompanhe as solicitacoes criadas por voce."
              : "Acompanhe os envios e o andamento dos documentos da empresa."}
          </p>
        </div>
        {!mineOnly && (
          <button
            className="primary-button compact-button"
            onClick={onCreate}
          >
            Nova solicitacao
            <ChevronRight size={17} />
          </button>
        )}
      </div>
      <section className="dashboard-section requests-section">
        <RequestsView
          mineOnly={mineOnly}
          onCreate={onCreate}
          onOpen={onOpen}
          token={token}
        />
      </section>
    </>
  );
}

function ComingSoon({ view }: { view: ViewId }) {
  const labels: Partial<Record<ViewId, string>> = {
    clients: "Clientes",
    users: "Usuarios",
    settings: "Configuracoes"
  };

  return (
    <section className="placeholder-page">
      <span className="eyebrow">Proximo modulo</span>
      <h1>{labels[view]}</h1>
      <p>Esta area sera conectada a API nas proximas etapas.</p>
    </section>
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

function getPublicRequestToken() {
  const match = window.location.pathname.match(/^\/public\/requests\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}
