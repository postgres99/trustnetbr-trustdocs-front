import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Building2,
  CheckCircle2,
  ChevronRight,
  CircleUserRound,
  Eye,
  EyeOff,
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
import {
  ApiError,
  SESSION_EXPIRED_EVENT,
  setApiCulture
} from "../services/api/client";
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
import {
  MessageKey,
  useI18n
} from "../i18n/I18nContext";
import {
  Navigate,
  Route,
  Routes,
  useLocation,
  useNavigate,
  useParams
} from "react-router-dom";
import {
  APPLICATION_ROLES,
  canManageSystem,
  canManageTenantResources,
  canManageUsers,
  hasAnyRole
} from "./accessControl";

const TOKEN_STORAGE_KEY = "trustnetdocs.accessToken";

interface NavigationItem {
  id: ViewId;
  path: string;
  labelKey: MessageKey;
  icon: typeof FileStack;
  roles?: string[];
}

type ViewId =
  | "dashboard"
  | "my-requests"
  | "requests"
  | "clients"
  | "catalogs"
  | "users"
  | "settings";

const navigation: NavigationItem[] = [
  { id: "dashboard", path: "/", labelKey: "nav.dashboard", icon: FolderKanban },
  { id: "my-requests", path: "/my-requests", labelKey: "nav.myRequests", icon: FileCheck2 },
  {
    id: "requests",
    path: "/requests",
    labelKey: "nav.requests",
    icon: FileStack,
    roles: [APPLICATION_ROLES.systemAdmin, APPLICATION_ROLES.tenantAdmin]
  },
  {
    id: "clients",
    path: "/clients",
    labelKey: "nav.clients",
    icon: Building2,
    roles: [APPLICATION_ROLES.systemAdmin, APPLICATION_ROLES.tenantAdmin]
  },
  {
    id: "catalogs",
    path: "/catalogs",
    labelKey: "nav.catalogs",
    icon: LibraryBig,
    roles: [APPLICATION_ROLES.systemAdmin, APPLICATION_ROLES.tenantAdmin]
  },
  {
    id: "users",
    path: "/users",
    labelKey: "nav.users",
    icon: Users,
    roles: [APPLICATION_ROLES.systemAdmin, APPLICATION_ROLES.tenantAdmin]
  },
  {
    id: "settings",
    path: "/settings",
    labelKey: "nav.settings",
    icon: Settings,
    roles: [APPLICATION_ROLES.systemAdmin]
  }
];

export function App() {
  const { setLocale } = useI18n();
  const publicToken = getPublicRequestToken();
  const [token, setToken] = useState(() => localStorage.getItem(TOKEN_STORAGE_KEY));
  const [user, setUser] = useState<CurrentUser | null>(null);
  const [health, setHealth] = useState<HealthStatus | null>(null);
  const [sessionLoading, setSessionLoading] = useState(Boolean(token));
  const [sessionExpired, setSessionExpired] = useState(false);

  useEffect(() => {
    function expireSession() {
      localStorage.removeItem(TOKEN_STORAGE_KEY);
      setToken(null);
      setUser(null);
      setSessionExpired(true);
    }

    window.addEventListener(SESSION_EXPIRED_EVENT, expireSession);
    return () => window.removeEventListener(SESSION_EXPIRED_EVENT, expireSession);
  }, []);

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
        setLocale(currentUser.preferredCulture);
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
    setLocale(currentUser.preferredCulture);
    setToken(accessToken);
    setUser(currentUser);
    setSessionExpired(false);
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
    return (
      <LoginScreen
        health={health}
        sessionExpired={sessionExpired}
        onAuthenticated={handleAuthenticated}
      />
    );
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
  sessionExpired,
  onAuthenticated
}: {
  health: HealthStatus | null;
  sessionExpired: boolean;
  onAuthenticated: (token: string, user: CurrentUser) => void;
}) {
  const { t } = useI18n();
  const [loginValue, setLoginValue] = useState(
    import.meta.env.DEV ? import.meta.env.VITE_DEV_LOGIN ?? "" : ""
  );
  const [password, setPassword] = useState(
    import.meta.env.DEV ? import.meta.env.VITE_DEV_PASSWORD ?? "" : ""
  );
  const [passwordVisible, setPasswordVisible] = useState(false);
  const [recoveryOpen, setRecoveryOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setSubmitting(true);
    setError("");

    try {
      const result = await login(loginValue, password);
      if (result.requiresTwoFactor || !result.accessToken) {
        setError(t("auth.twoFactor"));
        return;
      }

      const currentUser = await getCurrentUser(result.accessToken);
      onAuthenticated(result.accessToken, currentUser);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : t("auth.apiUnavailable")
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
          <span className="eyebrow">{t("auth.secureDocuments")}</span>
          <h1>{t("auth.hero")}</h1>
          <p>{t("auth.description")}</p>
        </div>
        <div className="security-note">
          <ShieldCheck size={20} />
          <span>{t("auth.security")}</span>
        </div>
      </section>

      <section className="login-form-panel">
        <div className="login-form-wrap">
          <div className="mobile-brand">
            <BrandMark />
            <span>TrustNetDocs</span>
          </div>

          <div className="form-heading">
            <h2>{t("auth.title")}</h2>
            <p>{t("auth.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit}>
            {sessionExpired && (
              <div className="session-feedback">{t("auth.sessionExpired")}</div>
            )}
            <label htmlFor="login">{t("auth.email")}</label>
            <input
              id="login"
              autoComplete="username"
              required
              value={loginValue}
              onChange={(event) => setLoginValue(event.target.value)}
              placeholder={t("auth.emailPlaceholder")}
            />

            <div className="label-row">
              <label htmlFor="password">{t("auth.password")}</label>
              <button
                className="text-button"
                onClick={() => setRecoveryOpen(true)}
                type="button"
              >
                {t("auth.forgot")}
              </button>
            </div>
            <div className="password-input">
              <input
                id="password"
                type={passwordVisible ? "text" : "password"}
                autoComplete="current-password"
                required
                value={password}
                onChange={(event) => setPassword(event.target.value)}
                placeholder={t("auth.passwordPlaceholder")}
              />
              <button
                aria-label={
                  passwordVisible
                    ? t("auth.hidePassword")
                    : t("auth.showPassword")
                }
                className="password-visibility"
                onClick={() => setPasswordVisible((current) => !current)}
                title={
                  passwordVisible
                    ? t("auth.hidePassword")
                    : t("auth.showPassword")
                }
                type="button"
              >
                {passwordVisible ? <EyeOff size={18} /> : <Eye size={18} />}
              </button>
            </div>

            {error && <div className="form-error">{error}</div>}

            <button className="primary-button" disabled={submitting} type="submit">
              {submitting ? t("auth.loggingIn") : t("auth.login")}
              {!submitting && <ChevronRight size={18} />}
            </button>
          </form>

          <div className={`api-status ${health ? "online" : "offline"}`}>
            <span className="status-dot" />
            {health
              ? t("auth.apiHealthy", {
                  status: health.databaseStatus.toLocaleLowerCase()
                })
              : t("auth.apiUnavailable")}
          </div>
        </div>
      </section>

      {recoveryOpen && (
        <div
          className="dialog-backdrop centered-dialog-backdrop"
          onMouseDown={() => setRecoveryOpen(false)}
        >
          <section
            className="password-dialog recovery-dialog"
            onMouseDown={(event) => event.stopPropagation()}
            role="dialog"
          >
            <span className="success-icon">
              <ShieldCheck size={25} />
            </span>
            <h2>{t("auth.recoveryTitle")}</h2>
            <p>{t("auth.recoveryDescription")}</p>
            <div className="recovery-note">
              {t("auth.recoverySecurity")}
            </div>
            <button
              className="primary-button compact-button"
              onClick={() => setRecoveryOpen(false)}
            >
              {t("common.close")}
            </button>
          </section>
        </div>
      )}
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
  const { t } = useI18n();
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);
  const [avatarVersion, setAvatarVersion] = useState(0);
  const visibleNavigation = useMemo(
    () => navigation.filter((item) => hasAnyRole(user.roles, item.roles)),
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
            const active =
              item.path === "/"
                ? location.pathname === "/"
                : location.pathname === item.path ||
                  location.pathname.startsWith(`${item.path}/`);
            return (
              <button
                className={active ? "active" : ""}
                key={item.id}
                onClick={() => {
                  navigate(item.path);
                  setSidebarOpen(false);
                }}
              >
                <Icon size={18} />
                <span>{t(item.labelKey)}</span>
              </button>
            );
          })}
        </nav>

        <div className="sidebar-footer">
          <div className={`compact-status ${health ? "online" : ""}`}>
            <span className="status-dot" />
            {health ? t("nav.systemOnline") : t("nav.systemOffline")}
          </div>
          <button onClick={onLogout}>
            <LogOut size={18} />
            <span>{t("nav.logout")}</span>
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
            onClick={() => navigate("/profile")}
          >
            <Languages size={17} />
            {user.preferredCulture}
          </button>
          <button className="user-menu" onClick={() => navigate("/profile")}>
            <span className="avatar">
              {avatarUrl ? (
                <img alt="" src={avatarUrl} />
              ) : (
                <CircleUserRound size={21} />
              )}
            </span>
            <span className="user-meta">
              <strong>{user.displayName}</strong>
              <small>
                {user.tenantName
                  ? `${getRoleLabel(user.roles, t)} | ${user.tenantName}`
                  : getRoleLabel(user.roles, t)}
              </small>
            </span>
          </button>
        </header>

        <main className="dashboard">
          <Routes>
            <Route
              path="/"
              element={
                <Dashboard
                  token={token}
                  user={user}
                  onCreateRequest={() => navigate("/requests/new")}
                  onOpenRequests={() =>
                    navigate(
                      canManageTenantResources(user.roles)
                        ? "/requests"
                        : "/my-requests"
                    )
                  }
                  onOpenRequest={(requestId, mineOnly) =>
                    navigate(
                      mineOnly
                        ? `/my-requests/${requestId}`
                        : `/requests/${requestId}`
                    )
                  }
                />
              }
            />
            <Route
              path="/my-requests"
              element={
                <RequestsPage
                  token={token}
                  mineOnly
                  onOpen={(requestId) => navigate(`/my-requests/${requestId}`)}
                  title={t("nav.myRequests")}
                />
              }
            />
            <Route
              path="/my-requests/:requestId"
              element={<RequestDetailsRoute token={token} mineOnly />}
            />
            {canManageTenantResources(user.roles) && (
              <>
                <Route
                  path="/requests"
                  element={
                    <RequestsPage
                      token={token}
                      mineOnly={false}
                      onCreate={() => navigate("/requests/new")}
                      onOpen={(requestId) => navigate(`/requests/${requestId}`)}
                      title={t("nav.requests")}
                    />
                  }
                />
                <Route
                  path="/requests/new"
                  element={
                    <CreateRequestView
                      token={token}
                      onCancel={() => navigate("/requests")}
                      onFinished={() => navigate("/requests")}
                    />
                  }
                />
                <Route
                  path="/requests/:requestId"
                  element={<RequestDetailsRoute token={token} mineOnly={false} />}
                />
                <Route path="/clients" element={<ClientsView token={token} />} />
                <Route path="/catalogs" element={<CatalogsView token={token} />} />
              </>
            )}
            <Route
              path="/profile"
              element={
                <ProfileView
                  token={token}
                  user={user}
                  onAvatarChanged={() => setAvatarVersion((value) => value + 1)}
                  onUserUpdated={onUserUpdated}
                />
              }
            />
            {canManageUsers(user.roles) && (
              <>
                <Route
                  path="/users"
                  element={<UsersView currentUser={user} token={token} />}
                />
                {canManageSystem(user.roles) && (
                  <Route path="/settings" element={<SettingsView token={token} />} />
                )}
              </>
            )}
            <Route path="*" element={<Navigate replace to="/" />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}

function RequestDetailsRoute({
  token,
  mineOnly
}: {
  token: string;
  mineOnly: boolean;
}) {
  const navigate = useNavigate();
  const { requestId } = useParams();
  const parsedRequestId = Number(requestId);

  if (!Number.isInteger(parsedRequestId) || parsedRequestId <= 0) {
    return <Navigate replace to={mineOnly ? "/my-requests" : "/requests"} />;
  }

  return (
    <RequestDetailsView
      token={token}
      requestId={parsedRequestId}
      mineOnly={mineOnly}
      onBack={() => navigate(mineOnly ? "/my-requests" : "/requests")}
    />
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
  const { t } = useI18n();
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const canManageRequests = canManageTenantResources(user.roles);

  useEffect(() => {
    getRequests(token, !canManageRequests).then(setRequests).catch(() => setRequests([]));
  }, [canManageRequests, token]);

  const metrics = getRequestMetrics(requests);

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("nav.dashboard")}</span>
          <h1>
            {t("dashboard.hello", { name: user.displayName.split(" ")[0] })}
          </h1>
          <p>{t("dashboard.subtitle")}</p>
        </div>
        {canManageRequests && (
          <button
            className="primary-button compact-button"
            onClick={onCreateRequest}
          >
            {t("dashboard.newRequest")}
            <ChevronRight size={17} />
          </button>
        )}
      </div>

      <section className="metric-grid">
        <Metric
          label={t("dashboard.waiting")}
          value={String(metrics.waiting)}
          detail={t("dashboard.openRequests")}
        />
        <Metric
          label={t("dashboard.reviewing")}
          value={String(metrics.reviewing)}
          detail={t("dashboard.received")}
        />
        <Metric
          label={t("dashboard.approved")}
          value={String(metrics.approved)}
          detail={t("dashboard.completed")}
        />
        <Metric
          label={t("dashboard.resubmission")}
          value={String(metrics.resubmission)}
          detail={t("dashboard.attention")}
        />
      </section>

      <section className="dashboard-section">
        <div className="section-heading">
          <div>
            <h2>{t("dashboard.recent")}</h2>
            <p>{t("dashboard.recentSubtitle")}</p>
          </div>
          <button className="text-button" onClick={onOpenRequests}>
            {t("dashboard.viewAll")}
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
  const { t } = useI18n();
  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{t("requests.documents")}</span>
          <h1>{title}</h1>
          <p>
            {mineOnly
              ? t("requests.mineSubtitle")
              : t("requests.allSubtitle")}
          </p>
        </div>
        {!mineOnly && (
          <button
            className="primary-button compact-button"
            onClick={onCreate}
          >
            {t("dashboard.newRequest")}
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

function getRoleLabel(
  roles: string[],
  t: (key: MessageKey) => string
) {
  if (roles.includes(APPLICATION_ROLES.systemAdmin)) return t("roles.systemAdmin");
  if (roles.includes(APPLICATION_ROLES.tenantAdmin)) return t("roles.tenantAdmin");
  return t("roles.user");
}

function getPublicRequestToken() {
  const match = window.location.pathname.match(/^\/public\/requests\/([^/]+)\/?$/);
  return match ? decodeURIComponent(match[1]) : null;
}
