import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Check,
  Clipboard,
  History,
  KeyRound,
  Pencil,
  Plus,
  Power,
  Search,
  ShieldCheck,
  UserRound,
  X
} from "lucide-react";
import { CurrentUser } from "../../services/api/auth";
import { ApiError } from "../../services/api/client";
import {
  getApplicationRoles,
  getSupportedCultures,
  getSupportedTimeZones,
  NamedOption
} from "../../services/api/enums";
import { getTenants, Tenant } from "../../services/api/tenants";
import {
  createUser,
  getUser,
  getUserAudit,
  getUsers,
  resetUserPassword,
  toggleUserActive,
  updateUser,
  updateUserPreferences,
  updateUserRoles,
  UserAuditEvent,
  UserDetails,
  UserListItem
} from "../../services/api/users";
import { useI18n } from "../../i18n/I18nContext";
import {
  APPLICATION_ROLES,
  canManageSystem
} from "../../app/accessControl";
import {
  formatCpfOrCnpj,
  isEmptyOrValidCpfOrCnpj,
  normalizeBrazilianTaxId
} from "../../utils/brazilianTaxId";

export function UsersView({
  token,
  currentUser
}: {
  token: string;
  currentUser: CurrentUser;
}) {
  const { locale, formatDateTime } = useI18n();
  const c = locale === "en-US" ? usersCopy.en : usersCopy.pt;
  const isSystemAdmin = canManageSystem(currentUser.roles);
  const [users, setUsers] = useState<UserListItem[]>([]);
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [roles, setRoles] = useState<NamedOption[]>([]);
  const [cultures, setCultures] = useState<NamedOption[]>([]);
  const [timeZones, setTimeZones] = useState<NamedOption[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<UserDetails | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");
  const [oneTimePassword, setOneTimePassword] = useState<{
    title: string;
    password: string;
  } | null>(null);
  const [auditUser, setAuditUser] = useState<UserListItem | null>(null);
  const [auditEvents, setAuditEvents] = useState<UserAuditEvent[]>([]);
  const [auditLoading, setAuditLoading] = useState(false);

  async function loadUsers(query = search) {
    setLoading(true);
    setError("");
    try {
      setUsers(await getUsers(token, query));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    const tenantsRequest = isSystemAdmin
      ? getTenants(token)
      : Promise.resolve(
          currentUser.tenantId
            ? [{
                id: currentUser.tenantId,
                name: currentUser.tenantName ?? c.currentCompany,
                cnpj: null,
                slug: `tenant-${currentUser.tenantId}`,
                isActive: true
              }]
            : []
        );

    Promise.all([
      getUsers(token),
      tenantsRequest,
      getApplicationRoles(),
      getSupportedCultures(),
      getSupportedTimeZones()
    ])
      .then(([userData, tenantData, roleData, cultureData, timeZoneData]) => {
        setUsers(userData);
        setTenants(tenantData.filter((tenant) => tenant.isActive));
        setRoles(
          isSystemAdmin
            ? roleData
            : roleData.filter(
                (role) => role.value !== APPLICATION_ROLES.systemAdmin
              )
        );
        setCultures(cultureData);
        setTimeZones(timeZoneData);
      })
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [
    c.currentCompany,
    currentUser.tenantId,
    currentUser.tenantName,
    isSystemAdmin,
    token
  ]);

  async function openEdit(userId: string) {
    setError("");
    try {
      setEditing(await getUser(token, userId));
      setFormOpen(true);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function toggleActive(user: UserListItem) {
    if (user.id === currentUser.id && user.isActive) return;
    if (!window.confirm(`${user.isActive ? c.deactivate : c.activate} ${user.fullName}?`)) {
      return;
    }

    try {
      const updated = await toggleUserActive(token, user.id);
      updateList(updated);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function resetPassword(user: UserListItem) {
    if (!window.confirm(`${c.resetConfirm} ${user.fullName}?`)) {
      return;
    }

    try {
      const result = await resetUserPassword(token, user.id);
      setOneTimePassword({
        title: `${c.temporaryPasswordOf} ${user.fullName}`,
        password: result.temporaryPassword
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  async function openAudit(user: UserListItem) {
    setAuditUser(user);
    setAuditEvents([]);
    setAuditLoading(true);
    setError("");
    try {
      setAuditEvents(await getUserAudit(token, user.id));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      setAuditUser(null);
    } finally {
      setAuditLoading(false);
    }
  }

  function updateList(user: UserDetails) {
    setUsers((current) =>
      current
        .map((item) => (item.id === user.id ? user : item))
        .sort((a, b) => a.fullName.localeCompare(b.fullName))
    );
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">
            {isSystemAdmin ? c.globalAdmin : c.companyAdmin}
          </span>
          <h1>{c.title}</h1>
          <p>{c.subtitle}</p>
        </div>
        <button
          className="primary-button compact-button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={17} />
          {c.newUser}
        </button>
      </div>

      {error && <div className="form-error client-page-error">{error}</div>}

      <section className="dashboard-section requests-section">
        <form
          className="request-toolbar"
          onSubmit={(event) => {
            event.preventDefault();
            void loadUsers();
          }}
        >
          <div className="search-field">
            <Search size={17} />
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder={c.searchPlaceholder}
              value={search}
            />
          </div>
          <button className="secondary-button search-button">{c.search}</button>
        </form>

        {loading ? (
          <div className="request-feedback">{c.loading}</div>
        ) : (
          <div className="request-table-wrap">
            <table className="request-table users-table">
              <thead>
                <tr>
                  <th>{c.user}</th>
                  <th>{c.company}</th>
                  <th>{c.roles}</th>
                  <th>{c.status}</th>
                  <th>{c.actions}</th>
                </tr>
              </thead>
              <tbody>
                {users.map((user) => (
                  <tr key={user.id}>
                    <td>
                      <strong>{user.fullName}</strong>
                      <span>{user.email}</span>
                    </td>
                    <td>{getTenantName(user.tenantId, tenants)}</td>
                    <td>
                      <div className="role-badges">
                        {user.roles.map((role) => (
                          <span key={role}>{getRoleDescription(role, roles)}</span>
                        ))}
                      </div>
                    </td>
                    <td>
                      <span
                        className={`status-badge ${user.isActive ? "success" : "danger"}`}
                      >
                        {user.isActive ? c.active : c.inactive}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="icon-button"
                          onClick={() => void openEdit(user.id)}
                          title={c.edit}
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          className="icon-button"
                          onClick={() => void resetPassword(user)}
                          title={c.resetPassword}
                        >
                          <KeyRound size={17} />
                        </button>
                        <button
                          className="icon-button"
                          onClick={() => void openAudit(user)}
                          title={c.auditHistory}
                        >
                          <History size={17} />
                        </button>
                        <button
                          className={`icon-button ${user.isActive ? "danger-button" : "bordered"}`}
                          disabled={user.id === currentUser.id && user.isActive}
                          onClick={() => void toggleActive(user)}
                          title={
                            user.id === currentUser.id && user.isActive
                              ? c.cannotDeactivateSelf
                              : user.isActive
                                ? c.deactivate
                                : c.activate
                          }
                        >
                          <Power size={17} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>

      {formOpen && (
        <UserForm
          cultures={cultures}
          copy={c}
          currentUser={currentUser}
          roles={roles}
          tenants={tenants}
          timeZones={timeZones}
          token={token}
          user={editing}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onCreated={(user, password) => {
            setUsers((current) =>
              [...current, user].sort((a, b) => a.fullName.localeCompare(b.fullName))
            );
            setFormOpen(false);
            setOneTimePassword({
              title: `${c.temporaryPasswordOf} ${user.fullName}`,
              password
            });
          }}
          onUpdated={(user) => {
            updateList(user);
            setFormOpen(false);
            setEditing(null);
          }}
        />
      )}

      {oneTimePassword && (
        <OneTimePasswordDialog
          password={oneTimePassword.password}
          copy={c}
          title={oneTimePassword.title}
          onClose={() => setOneTimePassword(null)}
        />
      )}

      {auditUser && (
        <UserAuditDialog
          events={auditEvents}
          formatDateTime={formatDateTime}
          loading={auditLoading}
          user={auditUser}
          copy={c}
          onClose={() => setAuditUser(null)}
        />
      )}
    </>
  );
}

function UserForm({
  token,
  user,
  currentUser,
  tenants,
  roles,
  cultures,
  timeZones,
  copy,
  onClose,
  onCreated,
  onUpdated
}: {
  token: string;
  user: UserDetails | null;
  currentUser: CurrentUser;
  tenants: Tenant[];
  roles: NamedOption[];
  cultures: NamedOption[];
  timeZones: NamedOption[];
  copy: Record<keyof (typeof usersCopy)["pt"], string>;
  onClose: () => void;
  onCreated: (user: UserDetails, password: string) => void;
  onUpdated: (user: UserDetails) => void;
}) {
  const names = splitFullName(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [firstName, setFirstName] = useState(names.firstName);
  const [lastName, setLastName] = useState(names.lastName);
  const [cpfCnpj, setCpfCnpj] = useState(user?.cpfCnpj ?? "");
  const actorIsSystemAdmin = canManageSystem(currentUser.roles);
  const [tenantId, setTenantId] = useState(
    String(user?.tenantId ?? currentUser.tenantId ?? "")
  );
  const [selectedRoles, setSelectedRoles] = useState<string[]>(
    user?.roles ?? [APPLICATION_ROLES.regularUser]
  );
  const [culture, setCulture] = useState(user?.preferredCulture ?? "pt-BR");
  const [timeZone, setTimeZone] = useState(user?.timeZoneId ?? "America/Sao_Paulo");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const taxIdError = cpfCnpj.trim() && !isEmptyOrValidCpfOrCnpj(cpfCnpj) ? copy.taxIdInvalid : "";

  const isSystemAdmin = selectedRoles.includes(APPLICATION_ROLES.systemAdmin);

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      setError(copy.requiredIdentity);
      return;
    }
    if (selectedRoles.length === 0) {
      setError(copy.selectRole);
      return;
    }
    if (!isSystemAdmin && !tenantId) {
      setError(copy.selectCompany);
      return;
    }
    if (!isEmptyOrValidCpfOrCnpj(cpfCnpj)) {
      setError(copy.taxIdInvalid);
      return;
    }

    setSaving(true);
    try {
      if (!user) {
        const result = await createUser(token, {
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          cpfCnpj: cpfCnpj.trim() ? normalizeBrazilianTaxId(cpfCnpj) : null,
          tenantId: tenantId ? Number(tenantId) : null,
          roles: selectedRoles,
          timeZoneId: timeZone,
          preferredCulture: culture
        });
        onCreated(result.user, result.temporaryPassword);
        return;
      }

      const rolesChanged = !sameRoles(user.roles, selectedRoles);
      const promotingToSystemAdmin =
        rolesChanged &&
        selectedRoles.includes(APPLICATION_ROLES.systemAdmin) &&
        !user.roles.includes(APPLICATION_ROLES.systemAdmin);

      let updated = user;
      if (promotingToSystemAdmin) {
        updated = await updateUserRoles(token, user.id, selectedRoles);
      }

      updated = await updateUser(token, user.id, {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        cpfCnpj: cpfCnpj.trim() ? normalizeBrazilianTaxId(cpfCnpj) : null,
        tenantId: tenantId ? Number(tenantId) : null
      });

      if (rolesChanged && !promotingToSystemAdmin) {
        updated = await updateUserRoles(token, user.id, selectedRoles);
      }

      if (
        updated.timeZoneId !== timeZone ||
        updated.preferredCulture !== culture
      ) {
        updated = await updateUserPreferences(
          token,
          user.id,
          timeZone,
          culture
        );
      }

      onUpdated(updated);
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  function toggleRole(role: string) {
    setSelectedRoles((current) =>
      current.includes(role)
        ? current.filter((item) => item !== role)
        : [...current, role]
    );
  }

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section
        aria-modal="true"
        className="side-dialog user-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="dialog-header">
          <div>
            <span className="eyebrow">{copy.administration}</span>
            <h2>{user ? copy.editUser : copy.newUser}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <form className="dialog-form user-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="full-field">
              <label>{copy.email}</label>
              <input
                autoFocus
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
            </div>
            <div>
              <label>{copy.firstName}</label>
              <input
                onChange={(event) => setFirstName(event.target.value)}
                value={firstName}
              />
            </div>
            <div>
              <label>{copy.lastName}</label>
              <input
                onChange={(event) => setLastName(event.target.value)}
                value={lastName}
              />
            </div>
            <div className="full-field">
              <label>{copy.taxId}</label>
              <input
                aria-invalid={Boolean(taxIdError)}
                aria-describedby={taxIdError ? "user-tax-id-error" : undefined}
                inputMode="numeric"
                maxLength={18}
                onChange={(event) => setCpfCnpj(formatCpfOrCnpj(event.target.value))}
                value={cpfCnpj}
              />
              {taxIdError && (
                <small className="field-error" id="user-tax-id-error">
                  {taxIdError}
                </small>
              )}
            </div>
          </div>

          <div>
            <label>{copy.roles}</label>
            <div className="role-options">
              {roles.map((role) => (
                <label
                  className={selectedRoles.includes(role.value) ? "selected" : ""}
                  key={role.value}
                >
                  <input
                    checked={selectedRoles.includes(role.value)}
                    onChange={() => toggleRole(role.value)}
                    type="checkbox"
                  />
                  <ShieldCheck size={17} />
                  <span>
                    <strong>{role.description}</strong>
                    <small>{role.value}</small>
                  </span>
                </label>
              ))}
            </div>
          </div>

          <div>
            <label>{copy.company}</label>
            <select
              disabled={isSystemAdmin || !actorIsSystemAdmin}
              onChange={(event) => setTenantId(event.target.value)}
              value={isSystemAdmin ? "" : tenantId}
            >
              <option value="">
                {isSystemAdmin ? copy.notApplicable : copy.select}
              </option>
              {tenants.map((tenant) => (
                <option key={tenant.id} value={tenant.id}>
                  {tenant.name}
                </option>
              ))}
            </select>
          </div>

          <div className="form-grid">
            <div>
              <label>{copy.language}</label>
              <select
                onChange={(event) => setCulture(event.target.value)}
                value={culture}
              >
                {cultures.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.description}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label>{copy.timeZone}</label>
              <select
                onChange={(event) => setTimeZone(event.target.value)}
                value={timeZone}
              >
                {timeZones.map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.description}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {error && <div className="form-error">{error}</div>}

          <footer className="dialog-actions">
            <button className="secondary-button" onClick={onClose} type="button">
              {copy.cancel}
            </button>
            <button className="primary-button compact-button" disabled={saving}>
              {saving
                ? copy.saving
                : user
                  ? copy.saveChanges
                  : copy.createUser}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function OneTimePasswordDialog({
  title,
  password,
  copy,
  onClose
}: {
  title: string;
  password: string;
  copy: Record<keyof (typeof usersCopy)["pt"], string>;
  onClose: () => void;
}) {
  const [copied, setCopied] = useState(false);

  return (
    <div className="dialog-backdrop centered-dialog-backdrop">
      <section className="password-dialog" role="dialog">
        <span className="success-icon">
          <KeyRound size={25} />
        </span>
        <h2>{title}</h2>
        <p>{copy.copyPasswordNow}</p>
        <div className="temporary-password">
          <code>{password}</code>
          <button
            className="icon-button bordered"
            onClick={async () => {
              await navigator.clipboard.writeText(password);
              setCopied(true);
            }}
          >
            {copied ? <Check size={17} /> : <Clipboard size={17} />}
          </button>
        </div>
        <button className="primary-button compact-button" onClick={onClose}>
          {copy.finish}
        </button>
      </section>
    </div>
  );
}

function UserAuditDialog({
  user,
  events,
  loading,
  formatDateTime,
  copy,
  onClose
}: {
  user: UserListItem;
  events: UserAuditEvent[];
  loading: boolean;
  formatDateTime: (value: string | Date) => string;
  copy: Record<keyof (typeof usersCopy)["pt"], string>;
  onClose: () => void;
}) {
  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section
        className="side-dialog user-audit-dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="dialog-header">
          <div>
            <span className="eyebrow">{copy.audit}</span>
            <h2>{user.fullName}</h2>
            <p>{user.email}</p>
          </div>
          <button className="icon-button" onClick={onClose} title={copy.close}>
            <X size={20} />
          </button>
        </header>

        <div className="user-audit-content">
          {loading ? (
            <div className="request-feedback">{copy.loadingAudit}</div>
          ) : events.length === 0 ? (
            <div className="request-feedback">{copy.noAuditEvents}</div>
          ) : (
            <div className="timeline user-audit-timeline">
              {events.map((event) => (
                <article className="timeline-item" key={event.id}>
                  <span className="timeline-dot" />
                  <div>
                    <strong>{event.eventTypeDescription}</strong>
                    <span>
                      {formatDateTime(event.occurredAtUtc)} · {copy.by}{" "}
                      {event.actorDisplay || event.actorUserId}
                    </span>
                    {event.ipAddress && (
                      <span>{copy.ipAddress}: {event.ipAddress}</span>
                    )}
                    {getAuditDetails(event.dataJson) && (
                      <code className="audit-details">
                        {getAuditDetails(event.dataJson)}
                      </code>
                    )}
                  </div>
                </article>
              ))}
            </div>
          )}
        </div>
      </section>
    </div>
  );
}

function getAuditDetails(dataJson: string | null) {
  if (!dataJson || dataJson === "{}") return "";

  try {
    const data = JSON.parse(dataJson) as Record<string, unknown>;
    return Object.entries(data)
      .map(([key, value]) => `${key}: ${String(value)}`)
      .join(" · ");
  } catch {
    return dataJson;
  }
}

function getTenantName(tenantId: number | null, tenants: Tenant[]) {
  if (!tenantId) return "Global";
  return tenants.find((tenant) => tenant.id === tenantId)?.name ?? `#${tenantId}`;
}

function getRoleDescription(role: string, roles: NamedOption[]) {
  return roles.find((option) => option.value === role)?.description ?? role;
}

function splitFullName(fullName: string) {
  const parts = fullName.trim().split(/\s+/).filter(Boolean);
  return {
    firstName: parts.shift() ?? "",
    lastName: parts.join(" ")
  };
}

function sameRoles(current: string[], desired: string[]) {
  return (
    current.length === desired.length &&
    current.every((role) => desired.includes(role))
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Nao foi possivel concluir a operacao.";
}

const usersCopy = {
  pt: {
    deactivate: "Desativar",
    activate: "Ativar",
    resetConfirm: "Gerar uma nova senha temporária para",
    temporaryPasswordOf: "Senha temporária de",
    globalAdmin: "Administração global",
    companyAdmin: "Administração da empresa",
    currentCompany: "Minha empresa",
    title: "Usuários",
    subtitle: "Gerencie acessos, empresas, perfis e credenciais.",
    newUser: "Novo usuário",
    searchPlaceholder: "Buscar por nome ou e-mail",
    search: "Buscar",
    loading: "Carregando usuários...",
    user: "Usuário",
    company: "Empresa",
    roles: "Perfis",
    status: "Status",
    actions: "Ações",
    active: "Ativo",
    inactive: "Inativo",
    edit: "Editar",
    resetPassword: "Redefinir senha",
    auditHistory: "Histórico de auditoria",
    cannotDeactivateSelf: "Você não pode desativar seu próprio usuário",
    requiredIdentity: "Informe e-mail, nome e sobrenome.",
    taxIdInvalid: "Informe um CPF ou CNPJ válido.",
    selectRole: "Selecione pelo menos um perfil.",
    selectCompany: "Selecione uma empresa para administradores e usuários regulares.",
    administration: "Administração",
    editUser: "Editar usuário",
    email: "E-mail",
    firstName: "Nome",
    lastName: "Sobrenome",
    taxId: "CPF/CNPJ",
    notApplicable: "Não se aplica ao SuperAdmin",
    select: "Selecione",
    language: "Idioma",
    timeZone: "Fuso horário",
    cancel: "Cancelar",
    saving: "Salvando...",
    saveChanges: "Salvar alterações",
    createUser: "Criar usuário",
    copyPasswordNow: "Copie agora. Esta senha não poderá ser consultada novamente.",
    finish: "Concluir",
    audit: "Auditoria",
    loadingAudit: "Carregando histórico...",
    noAuditEvents: "Nenhum evento de auditoria registrado.",
    close: "Fechar",
    by: "por",
    ipAddress: "Endereço IP"
  },
  en: {
    deactivate: "Deactivate",
    activate: "Activate",
    resetConfirm: "Generate a new temporary password for",
    temporaryPasswordOf: "Temporary password for",
    globalAdmin: "Global administration",
    companyAdmin: "Company administration",
    currentCompany: "My company",
    title: "Users",
    subtitle: "Manage access, companies, roles, and credentials.",
    newUser: "New user",
    searchPlaceholder: "Search by name or email",
    search: "Search",
    loading: "Loading users...",
    user: "User",
    company: "Company",
    roles: "Roles",
    status: "Status",
    actions: "Actions",
    active: "Active",
    inactive: "Inactive",
    edit: "Edit",
    resetPassword: "Reset password",
    auditHistory: "Audit history",
    cannotDeactivateSelf: "You cannot deactivate your own user",
    requiredIdentity: "Enter email, first name, and last name.",
    taxIdInvalid: "Enter a valid CPF or CNPJ.",
    selectRole: "Select at least one role.",
    selectCompany: "Select a company for administrators and regular users.",
    administration: "Administration",
    editUser: "Edit user",
    email: "Email",
    firstName: "First name",
    lastName: "Last name",
    taxId: "Tax ID",
    notApplicable: "Not applicable to SuperAdmin",
    select: "Select",
    language: "Language",
    timeZone: "Time zone",
    cancel: "Cancel",
    saving: "Saving...",
    saveChanges: "Save changes",
    createUser: "Create user",
    copyPasswordNow: "Copy now. This password cannot be retrieved again.",
    finish: "Finish",
    audit: "Audit",
    loadingAudit: "Loading history...",
    noAuditEvents: "No audit events recorded.",
    close: "Close",
    by: "by",
    ipAddress: "IP address"
  }
};
