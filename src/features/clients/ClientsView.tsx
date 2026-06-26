import { FormEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  Building2,
  Mail,
  Pencil,
  Phone,
  Plus,
  RefreshCw,
  Search,
  Trash2,
  X
} from "lucide-react";
import {
  Client,
  ClientInput,
  createClient,
  deleteClient,
  getClients,
  updateClient
} from "../../services/api/clients";
import { ApiError } from "../../services/api/client";
import { useI18n } from "../../i18n/I18nContext";
import {
  formatCpfOrCnpj,
  isValidCpfOrCnpj,
  normalizeBrazilianTaxId
} from "../../utils/brazilianTaxId";

export function ClientsView({ token }: { token: string }) {
  const { locale } = useI18n();
  const c = locale === "en-US" ? clientsCopy.en : clientsCopy.pt;
  const [clients, setClients] = useState<Client[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [editingClient, setEditingClient] = useState<Client | null>(null);
  const [formOpen, setFormOpen] = useState(false);

  async function loadClients(query = search) {
    setLoading(true);
    setError("");
    try {
      setClients(await getClients(token, query));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadClients("");
  }, [token]);

  function openNewClient() {
    setEditingClient(null);
    setFormOpen(true);
  }

  function openEditClient(client: Client) {
    setEditingClient(client);
    setFormOpen(true);
  }

  async function handleDelete(client: Client) {
    const confirmed = window.confirm(
      `${c.deleteConfirm} "${client.fullName}"?\n\n${c.deleteHint}`
    );
    if (!confirmed) return;

    setError("");
    try {
      await deleteClient(token, client.id);
      setClients((current) => current.filter((item) => item.id !== client.id));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    }
  }

  function handleSaved(client: Client) {
    setClients((current) => {
      const exists = current.some((item) => item.id === client.id);
      const updated = exists
        ? current.map((item) => (item.id === client.id ? client : item))
        : [...current, client];

      return updated.sort((a, b) => a.fullName.localeCompare(b.fullName));
    });
    setFormOpen(false);
    setEditingClient(null);
  }

  return (
    <>
      <div className="page-heading">
        <div>
          <span className="eyebrow">{c.records}</span>
          <h1>{c.title}</h1>
          <p>{c.subtitle}</p>
        </div>
        <button className="primary-button compact-button" onClick={openNewClient}>
          <Plus size={17} />
          {c.newClient}
        </button>
      </div>

      {error && <div className="form-error client-page-error">{error}</div>}

      <section className="dashboard-section requests-section">
        <form
          className="request-toolbar"
          onSubmit={(event) => {
            event.preventDefault();
            void loadClients();
          }}
        >
          <div className="search-field">
            <Search size={17} />
            <input
              aria-label="Buscar clientes"
              onChange={(event) => setSearch(event.target.value)}
              placeholder={c.searchPlaceholder}
              value={search}
            />
          </div>
          <button className="secondary-button search-button" type="submit">
            {c.search}
          </button>
          <button
            aria-label="Atualizar clientes"
            className="icon-button bordered"
            onClick={() => void loadClients()}
            title={c.refresh}
            type="button"
          >
            <RefreshCw size={17} />
          </button>
        </form>

        {loading ? (
          <div className="client-grid skeleton-grid">
            {Array.from({ length: 6 }).map((_, index) => (
              <div className="client-card client-skeleton" key={index} />
            ))}
          </div>
        ) : clients.length === 0 ? (
          <div className="empty-state">
            <span className="empty-icon">
              <Building2 size={24} />
            </span>
            <h3>{c.none}</h3>
            <p>
              {search
                ? c.adjustSearch
                : c.emptyHint}
            </p>
            {!search && (
              <button className="secondary-button" onClick={openNewClient}>
                {c.registerClient}
              </button>
            )}
          </div>
        ) : (
          <div className="client-grid">
            {clients.map((client) => (
              <article className="client-card" key={client.id}>
                <div className="client-card-heading">
                  <span className="client-avatar">
                    {getInitials(client.fullName)}
                  </span>
                  <div>
                    <strong>{client.fullName}</strong>
                    <span>{client.cpf}</span>
                  </div>
                </div>

                <div className="client-contact">
                  <span>
                    <Mail size={15} />
                    {client.email || c.emailMissing}
                  </span>
                  <span>
                    <Phone size={15} />
                    {client.phone || c.phoneMissing}
                  </span>
                </div>

                <footer className="client-card-actions">
                  <button
                    className="text-button"
                    onClick={() => openEditClient(client)}
                  >
                    <Pencil size={15} />
                    {c.edit}
                  </button>
                  <button
                    className="text-button danger-text"
                    onClick={() => void handleDelete(client)}
                  >
                    <Trash2 size={15} />
                    {c.delete}
                  </button>
                </footer>
              </article>
            ))}
          </div>
        )}
      </section>

      {formOpen && (
        <ClientForm
          client={editingClient}
          copy={c}
          token={token}
          onClose={() => {
            setFormOpen(false);
            setEditingClient(null);
          }}
          onSaved={handleSaved}
        />
      )}
    </>
  );
}

function ClientForm({
  token,
  client,
  copy,
  onClose,
  onSaved
}: {
  token: string;
  client: Client | null;
  copy: Record<keyof (typeof clientsCopy)["pt"], string>;
  onClose: () => void;
  onSaved: (client: Client) => void;
}) {
  const [fullName, setFullName] = useState(client?.fullName ?? "");
  const [cpf, setCpf] = useState(client?.cpf ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const taxIdError = cpf.trim() && !isValidCpfOrCnpj(cpf) ? copy.taxIdInvalid : "";

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError(copy.nameRequired);
      return;
    }

    if (!cpf.trim()) {
      setError(copy.taxIdRequired);
      return;
    }

    if (!isValidCpfOrCnpj(cpf)) {
      setError(copy.taxIdInvalid);
      return;
    }

    const input: ClientInput = {
      fullName: fullName.trim(),
      cpf: normalizeBrazilianTaxId(cpf),
      email: email.trim() || null,
      phone: phone.trim() || null
    };

    setSaving(true);
    try {
      onSaved(
        client
          ? await updateClient(token, client.id, input)
          : await createClient(token, input)
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSaving(false);
    }
  }

  return (
    <div className="dialog-backdrop" role="presentation" onMouseDown={onClose}>
      <section
        aria-labelledby="client-form-title"
        aria-modal="true"
        className="side-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        role="dialog"
      >
        <header className="dialog-header">
          <div>
            <span className="eyebrow">{copy.client}</span>
            <h2 id="client-form-title">
              {client ? copy.editClient : copy.newClient}
            </h2>
          </div>
          <button
            aria-label="Fechar"
            className="icon-button"
            onClick={onClose}
            type="button"
          >
            <X size={20} />
          </button>
        </header>

        <form className="dialog-form" onSubmit={handleSubmit}>
          <div>
            <label htmlFor="client-name">{copy.name}</label>
            <input
              autoFocus
              id="client-name"
              maxLength={200}
              onChange={(event) => setFullName(event.target.value)}
              value={fullName}
            />
          </div>
          <div>
            <label htmlFor="client-cpf">{copy.taxId}</label>
            <input
              aria-invalid={Boolean(taxIdError)}
              aria-describedby={taxIdError ? "client-cpf-error" : undefined}
              id="client-cpf"
              inputMode="numeric"
              maxLength={18}
              onChange={(event) => setCpf(formatCpfOrCnpj(event.target.value))}
              value={cpf}
            />
            {taxIdError && (
              <small className="field-error" id="client-cpf-error">
                {taxIdError}
              </small>
            )}
          </div>
          <div>
            <label htmlFor="client-email">{copy.email}</label>
            <input
              id="client-email"
              maxLength={200}
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </div>
          <div>
            <label htmlFor="client-phone">{copy.phone}</label>
            <input
              id="client-phone"
              maxLength={50}
              onChange={(event) => setPhone(event.target.value)}
              value={phone}
            />
          </div>

          {error && (
            <div className="form-error dialog-error">
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <footer className="dialog-actions">
            <button className="secondary-button" onClick={onClose} type="button">
              {copy.cancel}
            </button>
            <button className="primary-button compact-button" disabled={saving}>
              {saving
                ? copy.saving
                : client
                  ? copy.saveChanges
                  : copy.register}
            </button>
          </footer>
        </form>
      </section>
    </div>
  );
}

function getInitials(name: string) {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0])
    .join("")
    .toLocaleUpperCase();
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Nao foi possivel concluir a operacao.";
}

const clientsCopy = {
  pt: {
    deleteConfirm: "Excluir o cliente",
    deleteHint:
      "O cadastro será desativado, mas o histórico das solicitações será preservado.",
    records: "Cadastros",
    title: "Clientes",
    subtitle: "Gerencie as pessoas e empresas que recebem solicitações.",
    newClient: "Novo cliente",
    searchPlaceholder: "Buscar por nome, CPF/CNPJ ou e-mail",
    search: "Buscar",
    refresh: "Atualizar",
    none: "Nenhum cliente encontrado",
    adjustSearch: "Ajuste os termos da busca.",
    emptyHint: "Cadastre o primeiro cliente para criar solicitações.",
    registerClient: "Cadastrar cliente",
    emailMissing: "E-mail não informado",
    phoneMissing: "Telefone não informado",
    edit: "Editar",
    delete: "Excluir",
    nameRequired: "Informe o nome completo ou razão social.",
    taxIdRequired: "Informe o CPF/CNPJ.",
    taxIdInvalid: "Informe um CPF ou CNPJ válido.",
    client: "Cliente",
    editClient: "Editar cliente",
    name: "Nome completo ou razão social",
    taxId: "CPF/CNPJ",
    email: "E-mail",
    phone: "Telefone",
    cancel: "Cancelar",
    saving: "Salvando...",
    saveChanges: "Salvar alterações",
    register: "Cadastrar"
  },
  en: {
    deleteConfirm: "Delete client",
    deleteHint:
      "The record will be deactivated, while request history will be preserved.",
    records: "Records",
    title: "Clients",
    subtitle: "Manage people and companies that receive requests.",
    newClient: "New client",
    searchPlaceholder: "Search by name, tax ID, or email",
    search: "Search",
    refresh: "Refresh",
    none: "No clients found",
    adjustSearch: "Adjust the search terms.",
    emptyHint: "Register the first client to create requests.",
    registerClient: "Register client",
    emailMissing: "Email not provided",
    phoneMissing: "Phone not provided",
    edit: "Edit",
    delete: "Delete",
    nameRequired: "Enter the full name or legal company name.",
    taxIdRequired: "Enter the tax ID.",
    taxIdInvalid: "Enter a valid CPF or CNPJ.",
    client: "Client",
    editClient: "Edit client",
    name: "Full name or legal company name",
    taxId: "Tax ID",
    email: "Email",
    phone: "Phone",
    cancel: "Cancel",
    saving: "Saving...",
    saveChanges: "Save changes",
    register: "Register"
  }
};
