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
import { useI18n } from "../../i18n/I18nContext";
import {
  buildCreateRequestInput,
  ClientMode,
  getLocalDateInputValue,
  validateCreateRequestForm
} from "./createRequestForm";

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
  const { locale } = useI18n();
  const c = locale === "en-US" ? createRequestCopy.en : createRequestCopy.pt;
  const [templates, setTemplates] = useState<RequestTemplate[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [templateId, setTemplateId] = useState("");
  const [clientMode, setClientMode] = useState<ClientMode>("existing");
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

    const values = {
      templateId,
      clientMode,
      clientId,
      fullName,
      cpf,
      email,
      phone,
      expiresAt
    };
    const validationError = validateCreateRequestForm(values);
    if (validationError) {
      setError({
        "template-required": c.selectTemplateError,
        "client-required": c.selectClientError,
        "new-client-required": c.newClientError,
        "expiration-in-past": c.expirationError
      }[validationError]);
      return;
    }

    setSubmitting(true);
    try {
      const result = await createRequest(token, buildCreateRequestInput(values));
      setCreated(result);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : c.createError
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
        <span>{c.preparing}</span>
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
        <span className="eyebrow">{c.created}</span>
        <h1>{c.linkReady}</h1>
        <p>
          {c.createdDescription
            .replace("{id}", String(created.request.id))
            .replace("{client}", created.request.clientName)}
        </p>

        <div className="one-time-link">
          <div>
            <strong>{c.copyNow}</strong>
            <span>{c.oneTimeWarning}</span>
          </div>
          <div className="copy-row">
            <input readOnly value={publicUrl} />
            <button className="secondary-button" onClick={() => void copyPublicAccess()}>
              {copied ? <Check size={17} /> : <Clipboard size={17} />}
              {copied ? c.copied : c.copy}
            </button>
          </div>
        </div>

        <div className="success-actions">
          <button className="primary-button compact-button" onClick={onFinished}>
            {c.viewRequests}
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
            {c.back}
          </button>
          <span className="eyebrow">{c.documents}</span>
          <h1>{c.title}</h1>
          <p>{c.subtitle}</p>
        </div>
      </div>

      <form className="creation-form" onSubmit={handleSubmit}>
        <section className="form-section">
          <div className="form-section-heading">
            <span className="step-number">1</span>
            <div>
              <h2>{c.templateSection}</h2>
              <p>{c.templateHint}</p>
            </div>
          </div>

          <label htmlFor="template">{c.template}</label>
          <select
            id="template"
            onChange={(event) => setTemplateId(event.target.value)}
            value={templateId}
          >
            <option value="">{c.selectTemplate}</option>
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
                      {!requirement.isRequired && <small>{c.optional}</small>}
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
              <h2>{c.client}</h2>
              <p>{c.clientHint}</p>
            </div>
          </div>

          <div className="segmented-control">
            <button
              className={clientMode === "existing" ? "active" : ""}
              onClick={() => setClientMode("existing")}
              type="button"
            >
              {c.existingClient}
            </button>
            <button
              className={clientMode === "new" ? "active" : ""}
              onClick={() => setClientMode("new")}
              type="button"
            >
              <UserPlus size={16} />
              {c.newClient}
            </button>
          </div>

          {clientMode === "existing" ? (
            <>
              <label htmlFor="client">{c.client}</label>
              <select
                id="client"
                onChange={(event) => setClientId(event.target.value)}
                value={clientId}
              >
                <option value="">{c.selectClient}</option>
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
                <label htmlFor="fullName">{c.fullName}</label>
                <input
                  id="fullName"
                  maxLength={200}
                  onChange={(event) => setFullName(event.target.value)}
                  value={fullName}
                />
              </div>
              <div>
                <label htmlFor="cpf">{c.taxId}</label>
                <input
                  id="cpf"
                  maxLength={32}
                  onChange={(event) => setCpf(event.target.value)}
                  value={cpf}
                />
              </div>
              <div>
                <label htmlFor="phone">{c.phone}</label>
                <input
                  id="phone"
                  maxLength={50}
                  onChange={(event) => setPhone(event.target.value)}
                  value={phone}
                />
              </div>
              <div className="full-field">
                <label htmlFor="email">{c.email}</label>
                <input
                  id="email"
                  maxLength={200}
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
              <h2>{c.validity}</h2>
              <p>{c.validityHint}</p>
            </div>
          </div>
          <label htmlFor="expiresAt">{c.expirationDate}</label>
          <input
            id="expiresAt"
            min={getLocalDateInputValue()}
            onChange={(event) => setExpiresAt(event.target.value)}
            type="date"
            value={expiresAt}
          />
        </section>

        {error && <div className="form-error creation-error">{error}</div>}

        <div className="form-actions">
          <button className="secondary-button" onClick={onCancel} type="button">
            {c.cancel}
          </button>
          <button className="primary-button compact-button" disabled={submitting}>
            {submitting ? c.creating : c.create}
          </button>
        </div>
      </form>
    </>
  );
}

const createRequestCopy = {
  pt: {
    selectTemplateError: "Selecione um modelo de solicitação.",
    selectClientError: "Selecione um cliente.",
    newClientError: "Informe o nome e o CPF/CNPJ do novo cliente.",
    expirationError: "A data de expiração não pode estar no passado.",
    createError: "Não foi possível criar a solicitação.",
    preparing: "Preparando nova solicitação...",
    created: "Solicitação criada",
    linkReady: "Link pronto para envio",
    createdDescription: "A solicitação #{id} para {client} foi criada com sucesso.",
    copyNow: "Copie este link agora",
    oneTimeWarning: "Por segurança, ele não poderá ser consultado novamente.",
    copied: "Copiado",
    copy: "Copiar",
    viewRequests: "Ver solicitações",
    back: "Voltar",
    documents: "Documentos",
    title: "Nova solicitação",
    subtitle: "Escolha o modelo, o cliente e a validade do acesso público.",
    templateSection: "Modelo de documentos",
    templateHint: "Define os documentos que o cliente deverá enviar.",
    template: "Modelo",
    selectTemplate: "Selecione um modelo",
    optional: "Opcional",
    client: "Cliente",
    clientHint: "Use um cadastro existente ou crie um novo.",
    existingClient: "Cliente existente",
    newClient: "Novo cliente",
    selectClient: "Selecione um cliente",
    fullName: "Nome completo",
    taxId: "CPF/CNPJ",
    phone: "Telefone",
    email: "E-mail",
    validity: "Validade",
    validityHint: "Opcionalmente limite até quando o link poderá ser usado.",
    expirationDate: "Data de expiração",
    cancel: "Cancelar",
    creating: "Criando...",
    create: "Criar solicitação"
  },
  en: {
    selectTemplateError: "Select a request template.",
    selectClientError: "Select a client.",
    newClientError: "Enter the new client's name and tax ID.",
    expirationError: "The expiration date cannot be in the past.",
    createError: "Could not create the request.",
    preparing: "Preparing new request...",
    created: "Request created",
    linkReady: "Link ready to share",
    createdDescription: "Request #{id} for {client} was created successfully.",
    copyNow: "Copy this link now",
    oneTimeWarning: "For security, it cannot be retrieved again.",
    copied: "Copied",
    copy: "Copy",
    viewRequests: "View requests",
    back: "Back",
    documents: "Documents",
    title: "New request",
    subtitle: "Choose the template, client, and public access expiration.",
    templateSection: "Document template",
    templateHint: "Defines the documents the client must submit.",
    template: "Template",
    selectTemplate: "Select a template",
    optional: "Optional",
    client: "Client",
    clientHint: "Use an existing client or create a new one.",
    existingClient: "Existing client",
    newClient: "New client",
    selectClient: "Select a client",
    fullName: "Full name",
    taxId: "Tax ID",
    phone: "Phone",
    email: "Email",
    validity: "Expiration",
    validityHint: "Optionally limit how long the link can be used.",
    expirationDate: "Expiration date",
    cancel: "Cancel",
    creating: "Creating...",
    create: "Create request"
  }
};
