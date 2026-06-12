import { FormEvent, useEffect, useState } from "react";
import {
  Building2,
  Check,
  Mail,
  Pencil,
  Plus,
  Save,
  Search,
  Server,
  X
} from "lucide-react";
import { ApiError } from "../../services/api/client";
import {
  getSystemConfiguration,
  SystemConfiguration,
  updateSystemConfiguration
} from "../../services/api/configuration";
import {
  createTenant,
  getTenants,
  Tenant,
  TenantInput,
  updateTenant
} from "../../services/api/tenants";

type SettingsTab = "companies" | "email";

export function SettingsView({ token }: { token: string }) {
  const [tab, setTab] = useState<SettingsTab>("companies");

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">Administracao global</span>
          <h1>Configuracoes</h1>
          <p>Gerencie empresas e servicos operacionais do sistema.</p>
        </div>
      </div>

      <div className="settings-tabs">
        <button
          className={tab === "companies" ? "active" : ""}
          onClick={() => setTab("companies")}
        >
          <Building2 size={17} />
          Empresas
        </button>
        <button
          className={tab === "email" ? "active" : ""}
          onClick={() => setTab("email")}
        >
          <Mail size={17} />
          E-mail
        </button>
      </div>

      {tab === "companies" ? (
        <CompaniesSettings token={token} />
      ) : (
        <EmailSettings token={token} />
      )}
    </>
  );
}

function CompaniesSettings({ token }: { token: string }) {
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState<Tenant | null>(null);
  const [formOpen, setFormOpen] = useState(false);
  const [error, setError] = useState("");

  async function load(query = search) {
    setLoading(true);
    try {
      setTenants(await getTenants(token, query));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void load("");
  }, [token]);

  function saveTenant(tenant: Tenant) {
    setTenants((current) => {
      const exists = current.some((item) => item.id === tenant.id);
      return (exists
        ? current.map((item) => (item.id === tenant.id ? tenant : item))
        : [...current, tenant]
      ).sort((a, b) => a.name.localeCompare(b.name));
    });
    setFormOpen(false);
    setEditing(null);
  }

  async function toggleTenant(tenant: Tenant) {
    if (
      !window.confirm(
        `${tenant.isActive ? "Desativar" : "Ativar"} a empresa "${tenant.name}"?`
      )
    ) {
      return;
    }

    try {
      saveTenant(
        await updateTenant(token, tenant.id, {
          name: tenant.name,
          cnpj: tenant.cnpj,
          slug: tenant.slug,
          isActive: !tenant.isActive
        })
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  return (
    <>
      {error && <div className="form-error profile-feedback">{error}</div>}
      <section className="dashboard-section requests-section">
        <form
          className="request-toolbar"
          onSubmit={(event) => {
            event.preventDefault();
            void load();
          }}
        >
          <div className="search-field">
            <Search size={17} />
            <input
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por nome, CNPJ ou slug"
              value={search}
            />
          </div>
          <button className="secondary-button search-button">Buscar</button>
          <button
            className="primary-button compact-button"
            onClick={() => {
              setEditing(null);
              setFormOpen(true);
            }}
            type="button"
          >
            <Plus size={17} />
            Nova empresa
          </button>
        </form>

        {loading ? (
          <div className="request-feedback">Carregando empresas...</div>
        ) : (
          <div className="company-list">
            {tenants.map((tenant) => (
              <article className="company-row" key={tenant.id}>
                <span className="company-icon">
                  <Building2 size={20} />
                </span>
                <div>
                  <strong>{tenant.name}</strong>
                  <span>
                    {tenant.cnpj || "CNPJ nao informado"} · {tenant.slug}
                  </span>
                </div>
                <span
                  className={`status-badge ${tenant.isActive ? "success" : "danger"}`}
                >
                  {tenant.isActive ? "Ativa" : "Inativa"}
                </span>
                <div className="table-actions">
                  <button
                    className="icon-button"
                    onClick={() => {
                      setEditing(tenant);
                      setFormOpen(true);
                    }}
                    title="Editar"
                  >
                    <Pencil size={17} />
                  </button>
                  <button
                    className={`secondary-button tenant-toggle ${tenant.isActive ? "danger-text" : ""}`}
                    onClick={() => void toggleTenant(tenant)}
                  >
                    {tenant.isActive ? "Desativar" : "Ativar"}
                  </button>
                </div>
              </article>
            ))}
          </div>
        )}
      </section>

      {formOpen && (
        <TenantForm
          tenant={editing}
          token={token}
          onClose={() => {
            setFormOpen(false);
            setEditing(null);
          }}
          onSaved={saveTenant}
        />
      )}
    </>
  );
}

function TenantForm({
  token,
  tenant,
  onClose,
  onSaved
}: {
  token: string;
  tenant: Tenant | null;
  onClose: () => void;
  onSaved: (tenant: Tenant) => void;
}) {
  const [name, setName] = useState(tenant?.name ?? "");
  const [cnpj, setCnpj] = useState(tenant?.cnpj ?? "");
  const [slug, setSlug] = useState(tenant?.slug ?? "");
  const [isActive, setIsActive] = useState(tenant?.isActive ?? true);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!name.trim() || !slug.trim()) {
      setError("Informe o nome e o slug da empresa.");
      return;
    }

    const input: TenantInput = {
      name: name.trim(),
      cnpj: cnpj.trim() || null,
      slug: slug.trim(),
      isActive
    };

    setSaving(true);
    try {
      onSaved(
        tenant
          ? await updateTenant(token, tenant.id, input)
          : await createTenant(token, input)
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dialog-backdrop" onMouseDown={onClose}>
      <section
        className="side-dialog"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <header className="dialog-header">
          <div>
            <span className="eyebrow">Empresa</span>
            <h2>{tenant ? "Editar empresa" : "Nova empresa"}</h2>
          </div>
          <button className="icon-button" onClick={onClose}>
            <X size={20} />
          </button>
        </header>
        <form className="dialog-form" onSubmit={submit}>
          <div>
            <label>Nome</label>
            <input
              autoFocus
              maxLength={200}
              onChange={(event) => setName(event.target.value)}
              value={name}
            />
          </div>
          <div>
            <label>CNPJ</label>
            <input
              maxLength={32}
              onChange={(event) => setCnpj(event.target.value)}
              value={cnpj}
            />
          </div>
          <div>
            <label>Slug</label>
            <input
              maxLength={120}
              onChange={(event) =>
                setSlug(
                  event.target.value
                    .toLocaleLowerCase()
                    .replace(/\s+/g, "-")
                    .replace(/[^a-z0-9_-]/g, "")
                )
              }
              placeholder="nome-da-empresa"
              value={slug}
            />
          </div>
          <label className="toggle-field">
            <input
              checked={isActive}
              onChange={(event) => setIsActive(event.target.checked)}
              type="checkbox"
            />
            Empresa ativa
          </label>
          {error && <div className="form-error">{error}</div>}
          <footer className="dialog-actions">
            <button className="secondary-button" onClick={onClose} type="button">
              Cancelar
            </button>
            <button className="primary-button compact-button" disabled={saving}>
              {saving ? "Salvando..." : "Salvar empresa"}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function EmailSettings({ token }: { token: string }) {
  const [configuration, setConfiguration] =
    useState<SystemConfiguration | null>(null);
  const [password, setPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  useEffect(() => {
    getSystemConfiguration(token)
      .then(setConfiguration)
      .catch((requestError) => setError(getErrorMessage(requestError)));
  }, [token]);

  async function submit(event: FormEvent) {
    event.preventDefault();
    if (!configuration) return;

    setSaving(true);
    setError("");
    setMessage("");
    try {
      setConfiguration(
        await updateSystemConfiguration(token, {
          adminEmails: configuration.adminEmails,
          loginEmail: configuration.loginEmail,
          passwordEmail: password.trim() || null,
          emailFrom: configuration.emailFrom,
          emailNameFrom: configuration.emailNameFrom,
          port: Number(configuration.port),
          host: configuration.host,
          enableSsl: configuration.enableSsl,
          deliveryBy: Number(configuration.deliveryBy),
          useDefaultCredentials: configuration.useDefaultCredentials
        })
      );
      setPassword("");
      setMessage("Configuracoes de e-mail atualizadas.");
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  if (!configuration) {
    return (
      <div className="request-feedback">
        {error || "Carregando configuracoes de e-mail..."}
      </div>
    );
  }

  function update<K extends keyof SystemConfiguration>(
    field: K,
    value: SystemConfiguration[K]
  ) {
    setConfiguration((current) =>
      current ? { ...current, [field]: value } : current
    );
  }

  return (
    <form className="email-settings" onSubmit={submit}>
      <section className="profile-card profile-form">
        <div className="profile-section-heading">
          <span className="profile-heading-icon">
            <Server size={19} />
          </span>
          <div>
            <h2>Servidor SMTP</h2>
            <p>Credenciais utilizadas para os envios do sistema.</p>
          </div>
        </div>

        <div className="form-grid">
          <div className="full-field">
            <label>Host</label>
            <input
              onChange={(event) => update("host", event.target.value)}
              value={configuration.host}
            />
          </div>
          <div>
            <label>Porta</label>
            <input
              min={1}
              onChange={(event) => update("port", Number(event.target.value))}
              type="number"
              value={configuration.port}
            />
          </div>
          <div>
            <label>Metodo de entrega</label>
            <input
              min={0}
              onChange={(event) =>
                update("deliveryBy", Number(event.target.value))
              }
              type="number"
              value={configuration.deliveryBy}
            />
          </div>
          <div className="full-field">
            <label>Login</label>
            <input
              onChange={(event) => update("loginEmail", event.target.value)}
              value={configuration.loginEmail}
            />
          </div>
          <div className="full-field">
            <label>Nova senha SMTP</label>
            <input
              onChange={(event) => setPassword(event.target.value)}
              placeholder={
                configuration.hasPasswordEmail
                  ? "Deixe vazio para manter a senha atual"
                  : "Informe a senha SMTP"
              }
              type="password"
              value={password}
            />
          </div>
        </div>

        <div className="settings-toggles">
          <label className="toggle-field">
            <input
              checked={configuration.enableSsl}
              onChange={(event) => update("enableSsl", event.target.checked)}
              type="checkbox"
            />
            Usar SSL
          </label>
          <label className="toggle-field">
            <input
              checked={configuration.useDefaultCredentials}
              onChange={(event) =>
                update("useDefaultCredentials", event.target.checked)
              }
              type="checkbox"
            />
            Usar credenciais padrao
          </label>
        </div>
      </section>

      <section className="profile-card profile-form">
        <div className="profile-section-heading">
          <span className="profile-heading-icon">
            <Mail size={19} />
          </span>
          <div>
            <h2>Remetente e administradores</h2>
            <p>Identidade dos e-mails e destinatarios administrativos.</p>
          </div>
        </div>
        <div className="form-grid">
          <div>
            <label>E-mail remetente</label>
            <input
              onChange={(event) => update("emailFrom", event.target.value)}
              type="email"
              value={configuration.emailFrom}
            />
          </div>
          <div>
            <label>Nome do remetente</label>
            <input
              onChange={(event) => update("emailNameFrom", event.target.value)}
              value={configuration.emailNameFrom}
            />
          </div>
          <div className="full-field">
            <label>E-mails administrativos</label>
            <input
              onChange={(event) => update("adminEmails", event.target.value)}
              value={configuration.adminEmails}
            />
          </div>
        </div>
      </section>

      {error && <div className="form-error">{error}</div>}
      {message && (
        <div className="success-feedback">
          <Check size={17} />
          {message}
        </div>
      )}
      <div className="email-settings-actions">
        <button className="primary-button compact-button" disabled={saving}>
          <Save size={17} />
          {saving ? "Salvando..." : "Salvar configuracoes"}
        </button>
      </div>
    </form>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Nao foi possivel concluir a operacao.";
}
