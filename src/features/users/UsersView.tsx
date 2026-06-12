import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  Check,
  Clipboard,
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
  getUsers,
  resetUserPassword,
  toggleUserActive,
  updateUser,
  updateUserPreferences,
  updateUserRoles,
  UserDetails,
  UserListItem
} from "../../services/api/users";

export function UsersView({
  token,
  currentUser
}: {
  token: string;
  currentUser: CurrentUser;
}) {
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
    Promise.all([
      getUsers(token),
      getTenants(token),
      getApplicationRoles(),
      getSupportedCultures(),
      getSupportedTimeZones()
    ])
      .then(([userData, tenantData, roleData, cultureData, timeZoneData]) => {
        setUsers(userData);
        setTenants(tenantData.filter((tenant) => tenant.isActive));
        setRoles(roleData);
        setCultures(cultureData);
        setTimeZones(timeZoneData);
      })
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [token]);

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
    if (!window.confirm(`${user.isActive ? "Desativar" : "Ativar"} ${user.fullName}?`)) {
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
    if (!window.confirm(`Gerar uma nova senha temporaria para ${user.fullName}?`)) {
      return;
    }

    try {
      const result = await resetUserPassword(token, user.id);
      setOneTimePassword({
        title: `Senha temporaria de ${user.fullName}`,
        password: result.temporaryPassword
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
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
          <span className="eyebrow">Administracao global</span>
          <h1>Usuarios</h1>
          <p>Gerencie acessos, empresas, perfis e credenciais.</p>
        </div>
        <button
          className="primary-button compact-button"
          onClick={() => {
            setEditing(null);
            setFormOpen(true);
          }}
        >
          <Plus size={17} />
          Novo usuario
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
              placeholder="Buscar por nome ou e-mail"
              value={search}
            />
          </div>
          <button className="secondary-button search-button">Buscar</button>
        </form>

        {loading ? (
          <div className="request-feedback">Carregando usuarios...</div>
        ) : (
          <div className="request-table-wrap">
            <table className="request-table users-table">
              <thead>
                <tr>
                  <th>Usuario</th>
                  <th>Empresa</th>
                  <th>Perfis</th>
                  <th>Status</th>
                  <th>Acoes</th>
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
                        {user.isActive ? "Ativo" : "Inativo"}
                      </span>
                    </td>
                    <td>
                      <div className="table-actions">
                        <button
                          className="icon-button"
                          onClick={() => void openEdit(user.id)}
                          title="Editar"
                        >
                          <Pencil size={17} />
                        </button>
                        <button
                          className="icon-button"
                          onClick={() => void resetPassword(user)}
                          title="Redefinir senha"
                        >
                          <KeyRound size={17} />
                        </button>
                        <button
                          className={`icon-button ${user.isActive ? "danger-button" : "bordered"}`}
                          disabled={user.id === currentUser.id && user.isActive}
                          onClick={() => void toggleActive(user)}
                          title={
                            user.id === currentUser.id && user.isActive
                              ? "Voce nao pode desativar seu proprio usuario"
                              : user.isActive
                                ? "Desativar"
                                : "Ativar"
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
              title: `Senha temporaria de ${user.fullName}`,
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
          title={oneTimePassword.title}
          onClose={() => setOneTimePassword(null)}
        />
      )}
    </>
  );
}

function UserForm({
  token,
  user,
  tenants,
  roles,
  cultures,
  timeZones,
  onClose,
  onCreated,
  onUpdated
}: {
  token: string;
  user: UserDetails | null;
  tenants: Tenant[];
  roles: NamedOption[];
  cultures: NamedOption[];
  timeZones: NamedOption[];
  onClose: () => void;
  onCreated: (user: UserDetails, password: string) => void;
  onUpdated: (user: UserDetails) => void;
}) {
  const names = splitFullName(user?.fullName ?? "");
  const [email, setEmail] = useState(user?.email ?? "");
  const [firstName, setFirstName] = useState(names.firstName);
  const [lastName, setLastName] = useState(names.lastName);
  const [cpfCnpj, setCpfCnpj] = useState(user?.cpfCnpj ?? "");
  const [tenantId, setTenantId] = useState(user?.tenantId ? String(user.tenantId) : "");
  const [selectedRoles, setSelectedRoles] = useState<string[]>(user?.roles ?? ["Operator"]);
  const [culture, setCulture] = useState(user?.preferredCulture ?? "pt-BR");
  const [timeZone, setTimeZone] = useState(user?.timeZoneId ?? "America/Sao_Paulo");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const isSystemAdmin = selectedRoles.includes("SuperAdmin");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!email.trim() || !firstName.trim() || !lastName.trim()) {
      setError("Informe e-mail, nome e sobrenome.");
      return;
    }
    if (selectedRoles.length === 0) {
      setError("Selecione pelo menos um perfil.");
      return;
    }
    if (!isSystemAdmin && !tenantId) {
      setError("Selecione uma empresa para administradores e usuarios regulares.");
      return;
    }

    setSaving(true);
    try {
      if (!user) {
        const result = await createUser(token, {
          email: email.trim(),
          firstName: firstName.trim(),
          lastName: lastName.trim(),
          cpfCnpj: cpfCnpj.trim() || null,
          tenantId: tenantId ? Number(tenantId) : null,
          roles: selectedRoles,
          timeZoneId: timeZone,
          preferredCulture: culture
        });
        onCreated(result.user, result.temporaryPassword);
        return;
      }

      let updated = await updateUser(token, user.id, {
        email: email.trim(),
        firstName: firstName.trim(),
        lastName: lastName.trim(),
        cpfCnpj: cpfCnpj.trim() || null,
        tenantId: tenantId ? Number(tenantId) : null
      });

      if (!sameRoles(updated.roles, selectedRoles)) {
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
            <span className="eyebrow">Administracao</span>
            <h2>{user ? "Editar usuario" : "Novo usuario"}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </header>

        <form className="dialog-form user-form" onSubmit={handleSubmit}>
          <div className="form-grid">
            <div className="full-field">
              <label>E-mail</label>
              <input
                autoFocus
                onChange={(event) => setEmail(event.target.value)}
                type="email"
                value={email}
              />
            </div>
            <div>
              <label>Nome</label>
              <input
                onChange={(event) => setFirstName(event.target.value)}
                value={firstName}
              />
            </div>
            <div>
              <label>Sobrenome</label>
              <input
                onChange={(event) => setLastName(event.target.value)}
                value={lastName}
              />
            </div>
            <div className="full-field">
              <label>CPF/CNPJ</label>
              <input
                onChange={(event) => setCpfCnpj(event.target.value)}
                value={cpfCnpj}
              />
            </div>
          </div>

          <div>
            <label>Perfis</label>
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
            <label>Empresa</label>
            <select
              disabled={isSystemAdmin}
              onChange={(event) => setTenantId(event.target.value)}
              value={isSystemAdmin ? "" : tenantId}
            >
              <option value="">
                {isSystemAdmin ? "Nao se aplica ao SuperAdmin" : "Selecione"}
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
              <label>Idioma</label>
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
              <label>Fuso horario</label>
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
              Cancelar
            </button>
            <button className="primary-button compact-button" disabled={saving}>
              {saving ? "Salvando..." : user ? "Salvar alteracoes" : "Criar usuario"}
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
  onClose
}: {
  title: string;
  password: string;
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
        <p>Copie agora. Esta senha nao podera ser consultada novamente.</p>
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
          Concluir
        </button>
      </section>
    </div>
  );
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
