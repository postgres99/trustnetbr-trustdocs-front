import { FormEvent, useEffect, useMemo, useState } from "react";
import {
  ArrowLeft,
  Check,
  Clipboard,
  FileCheck2,
  LoaderCircle,
  UserPlus
} from "lucide-react";
import { Client, getClients } from "../../services/api/clients";
import { ApiError } from "../../services/api/client";
import {
  getRequestTemplates,
  RequestTemplate
} from "../../services/api/requestTemplates";
import {
  createRequest,
  CreatedRequest
} from "../../services/api/requests";

interface CreateRequestViewProps {
  token: string;
  onCancel: () => void;
  onFinished: () => void;
}

export function CreateRequestView({
  token,
  onCancel,
  onFinished
}: CreateRequestViewProps) {
  const [templates, setTemplates] = useState<RequestTemplate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [clientMode, setClientMode] = useState<"existing" | "new">("existing");
  const [clientId, setClientId] = useState("");
  const [fullName, setFullName] = useState("");
  const [cpf, setCpf] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [created, setCreated] = useState<CreatedRequest | null>(null);
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    Promise.all([getRequestTemplates(token), getClients(token)])
      .then(([templateData, clientData]) => {
        setTemplates(templateData.filter((template) => template.isActive));
        setClients(clientData);
      })
      .catch((requestError) =>
        setError(
          requestError instanceof ApiError
            ? requestError.message
            : "Nao foi possivel carregar os dados do formulario."
        )
      )
      .finally(() => setLoading(false));
  }, [token]);

  const selectedTemplate = useMemo(
    () => templates.find((template) => template.id === Number(templateId)),
    [templateId, templates]
  );

  async function handleSubmit(event: FormEvent) {
    event.preventDefault();
    setError("");

    if (!templateId) {
      setError("Selecione um modelo de solicitacao.");
      return;
    }

    if (clientMode === "existing" && !clientId) {
      setError("Selecione um cliente.");
      return;
    }

    if (clientMode === "new" && (!fullName.trim() || !cpf.trim())) {
      setError("Informe o nome e o CPF/CNPJ do novo cliente.");
      return;
    }

    setSubmitting(true);
    try {
      const result = await createRequest(token, {
        requestTemplateId: Number(templateId),
        externalClientId: clientMode === "existing" ? Number(clientId) : null,
        clientFullName: clientMode === "new" ? fullName.trim() : null,
        clientCpf: clientMode === "new" ? cpf.trim() : null,
        clientEmail: clientMode === "new" && email.trim() ? email.trim() : null,
        clientPhone: clientMode === "new" && phone.trim() ? phone.trim() : null,
        expiresAtUtc: expiresAt ? new Date(`${expiresAt}T23:59:59`).toISOString() : null
      });
      setCreated(result);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Nao foi possivel criar a solicitacao."
      );
    } finally {
      setSubmitting(false);
    }
  }

  async function copyPublicAccess() {
    if (!created) return;

    const publicUrl = `${window.location.origin}/public/requests/${created.publicTokenOnce}`;
    await navigator.clipboard.writeText(publicUrl);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  if (loading) {
    return (
      <div className="request-feedback create-loading">
        <LoaderCircle className="spin" size={24} />
        <span>Preparando nova solicitacao...</span>
      </div>
    );
  }

  if (created) {
    const publicUrl = `${window.location.origin}/public/requests/${created.publicTokenOnce}`;

    return (
      <section className="creation-success">
        <span className="success-icon">
          <Check size={28} />
        </span>
        <span className="eyebrow">Solicitacao criada</span>
        <h1>Link pronto para envio</h1>
        <p>
          A solicitacao #{created.request.id} para {created.request.clientName} foi
          criada com sucesso.
        </p>

        <div className="one-time-link">
          <div>
            <strong>Copie este link agora</strong>
            <span>Por seguranca, ele nao podera ser consultado novamente.</span>
          </div>
          <div className="copy-row">
            <input readOnly value={publicUrl} />
            <button className="secondary-button" onClick={() => void copyPublicAccess()}>
              {copied ? <Check size={17} /> : <Clipboard size={17} />}
              {copied ? "Copiado" : "Copiar"}
            </button>
          </div>
        </div>

        <div className="success-actions">
          <button className="primary-button compact-button" onClick={onFinished}>
            Ver solicitacoes
          </button>
        </div>
      </section>
    );
  }

  return (
    <>
      <div className="page-heading create-heading">
        <div>
          <button className="back-button" onClick={onCancel}>
            <ArrowLeft size={17} />
            Voltar
          </button>
          <span className="eyebrow">Documentos</span>
          <h1>Nova solicitacao</h1>
          <p>Escolha o modelo, o cliente e a validade do acesso publico.</p>
        </div>
      </div>

      <form className="creation-form" onSubmit={handleSubmit}>
        <section className="form-section">
          <div className="form-section-heading">
            <span className="step-number">1</span>
            <div>
              <h2>Modelo de documentos</h2>
              <p>Define os documentos que o cliente devera enviar.</p>
            </div>
          </div>

          <label htmlFor="template">Modelo</label>
          <select
            id="template"
            onChange={(event) => setTemplateId(event.target.value)}
            value={templateId}
          >
            <option value="">Selecione um modelo</option>
            {templates.map((template) => (
              <option key={template.id} value={template.id}>
                {template.name}
              </option>
            ))}
          </select>

          {selectedTemplate && (
            <div className="template-preview">
              <strong>{selectedTemplate.name}</strong>
              {selectedTemplate.description && <p>{selectedTemplate.description}</p>}
              <div className="requirement-list">
                {selectedTemplate.requirements
                  .slice()
                  .sort((a, b) => a.order - b.order)
                  .map((requirement) => (
                    <span key={requirement.requirementId}>
                      <FileCheck2 size={15} />
                      {requirement.documentTypeName}
                      {!requirement.isRequired && <small>Opcional</small>}
                    </span>
                  ))}
              </div>
            </div>
          )}
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <span className="step-number">2</span>
            <div>
              <h2>Cliente</h2>
              <p>Use um cadastro existente ou crie um novo.</p>
            </div>
          </div>

          <div className="segmented-control">
            <button
              className={clientMode === "existing" ? "active" : ""}
              onClick={() => setClientMode("existing")}
              type="button"
            >
              Cliente existente
            </button>
            <button
              className={clientMode === "new" ? "active" : ""}
              onClick={() => setClientMode("new")}
              type="button"
            >
              <UserPlus size={16} />
              Novo cliente
            </button>
          </div>

          {clientMode === "existing" ? (
            <>
              <label htmlFor="client">Cliente</label>
              <select
                id="client"
                onChange={(event) => setClientId(event.target.value)}
                value={clientId}
              >
                <option value="">Selecione um cliente</option>
                {clients.map((client) => (
                  <option key={client.id} value={client.id}>
                    {client.fullName} - {client.cpf}
                  </option>
                ))}
              </select>
            </>
          ) : (
            <div className="form-grid">
              <div className="full-field">
                <label htmlFor="fullName">Nome completo</label>
                <input
                  id="fullName"
                  onChange={(event) => setFullName(event.target.value)}
                  value={fullName}
                />
              </div>
              <div>
                <label htmlFor="cpf">CPF/CNPJ</label>
                <input
                  id="cpf"
                  onChange={(event) => setCpf(event.target.value)}
                  value={cpf}
                />
              </div>
              <div>
                <label htmlFor="phone">Telefone</label>
                <input
                  id="phone"
                  onChange={(event) => setPhone(event.target.value)}
                  value={phone}
                />
              </div>
              <div className="full-field">
                <label htmlFor="email">E-mail</label>
                <input
                  id="email"
                  onChange={(event) => setEmail(event.target.value)}
                  type="email"
                  value={email}
                />
              </div>
            </div>
          )}
        </section>

        <section className="form-section">
          <div className="form-section-heading">
            <span className="step-number">3</span>
            <div>
              <h2>Validade</h2>
              <p>Opcionalmente limite ate quando o link podera ser usado.</p>
            </div>
          </div>
          <label htmlFor="expiresAt">Data de expiracao</label>
          <input
            id="expiresAt"
            min={new Date().toISOString().slice(0, 10)}
            onChange={(event) => setExpiresAt(event.target.value)}
            type="date"
            value={expiresAt}
          />
        </section>

        {error && <div className="form-error creation-error">{error}</div>}

        <div className="form-actions">
          <button className="secondary-button" onClick={onCancel} type="button">
            Cancelar
          </button>
          <button className="primary-button compact-button" disabled={submitting}>
            {submitting ? "Criando..." : "Criar solicitacao"}
          </button>
        </div>
      </form>
    </>
  );
}
