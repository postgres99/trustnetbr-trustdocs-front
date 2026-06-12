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

export function ClientsView({ token }: { token: string }) {
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
      `Excluir o cliente "${client.fullName}"?\n\nO cadastro sera desativado, mas o historico das solicitacoes sera preservado.`
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
          <span className="eyebrow">Cadastros</span>
          <h1>Clientes</h1>
          <p>Gerencie as pessoas e empresas que recebem solicitacoes.</p>
        </div>
        <button className="primary-button compact-button" onClick={openNewClient}>
          <Plus size={17} />
          Novo cliente
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
              placeholder="Buscar por nome, CPF/CNPJ ou e-mail"
              value={search}
            />
          </div>
          <button className="secondary-button search-button" type="submit">
            Buscar
          </button>
          <button
            aria-label="Atualizar clientes"
            className="icon-button bordered"
            onClick={() => void loadClients()}
            title="Atualizar"
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
            <h3>Nenhum cliente encontrado</h3>
            <p>
              {search
                ? "Ajuste os termos da busca."
                : "Cadastre o primeiro cliente para criar solicitacoes."}
            </p>
            {!search && (
              <button className="secondary-button" onClick={openNewClient}>
                Cadastrar cliente
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
                    {client.email || "E-mail nao informado"}
                  </span>
                  <span>
                    <Phone size={15} />
                    {client.phone || "Telefone nao informado"}
                  </span>
                </div>

                <footer className="client-card-actions">
                  <button
                    className="text-button"
                    onClick={() => openEditClient(client)}
                  >
                    <Pencil size={15} />
                    Editar
                  </button>
                  <button
                    className="text-button danger-text"
                    onClick={() => void handleDelete(client)}
                  >
                    <Trash2 size={15} />
                    Excluir
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
  onClose,
  onSaved
}: {
  token: string;
  client: Client | null;
  onClose: () => void;
  onSaved: (client: Client) => void;
}) {
  const [fullName, setFullName] = useState(client?.fullName ?? "");
  const [cpf, setCpf] = useState(client?.cpf ?? "");
  const [email, setEmail] = useState(client?.email ?? "");
  const [phone, setPhone] = useState(client?.phone ?? "");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!fullName.trim()) {
      setError("Informe o nome completo ou razao social.");
      return;
    }

    if (!cpf.trim()) {
      setError("Informe o CPF/CNPJ.");
      return;
    }

    const input: ClientInput = {
      fullName: fullName.trim(),
      cpf: cpf.trim(),
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
            <span className="eyebrow">Cliente</span>
            <h2 id="client-form-title">
              {client ? "Editar cliente" : "Novo cliente"}
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
            <label htmlFor="client-name">Nome completo ou razao social</label>
            <input
              autoFocus
              id="client-name"
              maxLength={200}
              onChange={(event) => setFullName(event.target.value)}
              value={fullName}
            />
          </div>
          <div>
            <label htmlFor="client-cpf">CPF/CNPJ</label>
            <input
              id="client-cpf"
              maxLength={32}
              onChange={(event) => setCpf(event.target.value)}
              value={cpf}
            />
          </div>
          <div>
            <label htmlFor="client-email">E-mail</label>
            <input
              id="client-email"
              onChange={(event) => setEmail(event.target.value)}
              type="email"
              value={email}
            />
          </div>
          <div>
            <label htmlFor="client-phone">Telefone</label>
            <input
              id="client-phone"
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
              Cancelar
            </button>
            <button className="primary-button compact-button" disabled={saving}>
              {saving ? "Salvando..." : client ? "Salvar alteracoes" : "Cadastrar"}
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
