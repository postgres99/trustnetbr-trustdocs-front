import { ChangeEvent, useEffect, useState } from "react";
import {
  AlertCircle,
  Calendar,
  Check,
  FileCheck2,
  FileUp,
  LoaderCircle,
  LockKeyhole,
  RefreshCw,
  Trash2
} from "lucide-react";
import { ApiError } from "../../services/api/client";
import {
  deletePublicDocument,
  getPublicRequest,
  PublicRequest,
  PublicRequestRequirement,
  submitPublicRequest,
  uploadPublicDocument
} from "../../services/api/publicRequests";
import { useI18n } from "../../i18n/I18nContext";

export function PublicRequestPage({ token }: { token: string }) {
  const { locale } = useI18n();
  const c = locale === "en-US" ? publicCopy.en : publicCopy.pt;
  const [request, setRequest] = useState<PublicRequest | null>(null);
  const [loading, setLoading] = useState(true);
  const [busyDocumentType, setBusyDocumentType] = useState<number | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  async function loadRequest() {
    setLoading(true);
    setError("");
    try {
      setRequest(await getPublicRequest(token));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRequest();
  }, [token]);

  async function handleUpload(
    documentTypeId: number,
    event: ChangeEvent<HTMLInputElement>
  ) {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;

    if (file.size > 20 * 1024 * 1024) {
      setError(c.maxFileSize);
      return;
    }

    if (!isAllowedDocument(file)) {
      setError(c.invalidFileFormat);
      return;
    }

    setBusyDocumentType(documentTypeId);
    setError("");
    try {
      setRequest(await uploadPublicDocument(token, documentTypeId, file));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyDocumentType(null);
    }
  }

  async function handleDelete(requirement: PublicRequestRequirement) {
    if (!requirement.currentDocument) return;
    if (!window.confirm(`${c.removeFile} "${requirement.currentDocument.fileName}"?`)) {
      return;
    }

    setBusyDocumentType(requirement.documentTypeId);
    setError("");
    try {
      setRequest(
        await deletePublicDocument(token, requirement.currentDocument.id)
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setBusyDocumentType(null);
    }
  }

  async function handleSubmit() {
    if (!window.confirm(c.confirmSubmit)) return;

    setSubmitting(true);
    setError("");
    try {
      setRequest(await submitPublicRequest(token));
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <main className="public-request-page public-centered">
        <BrandHeader />
        <LoaderCircle className="spin" size={28} />
        <span>{c.loading}</span>
      </main>
    );
  }

  if (!request) {
    return (
      <main className="public-request-page public-centered">
        <BrandHeader />
        <AlertCircle size={34} />
        <h1>{c.unavailable}</h1>
        <p>{error || c.notFound}</p>
        <button className="secondary-button" onClick={() => void loadRequest()}>
          <RefreshCw size={16} />
          {c.tryAgain}
        </button>
      </main>
    );
  }

  const requiredTotal = request.requirements.filter(
    (requirement) => requirement.isRequired
  ).length;
  const requiredUploaded = request.requirements.filter(
    (requirement) => requirement.isRequired && requirement.currentDocument
  ).length;
  const finished = !request.canUpload && request.submittedAtUtc;

  return (
    <main className="public-request-page">
      <BrandHeader />

      <section className="public-request-shell">
        <header className="public-request-heading">
          <div>
            <span className="eyebrow">{c.secureUpload}</span>
            <h1>{request.templateName}</h1>
            <p>
              {c.greeting.replace("{client}", request.clientName)}
            </p>
          </div>
          <div className="public-status">
            <LockKeyhole size={16} />
            {request.statusDescription}
          </div>
        </header>

        {request.expiresAtUtc && (
          <div className={`expiration-note ${request.isExpired ? "expired" : ""}`}>
            <Calendar size={17} />
            {request.isExpired
              ? c.expired
              : c.availableUntil.replace(
                  "{date}",
                  formatDate(request.expiresAtUtc, locale)
                )}
          </div>
        )}

        {finished && (
          <div className="submission-complete">
            <span className="success-icon">
              <Check size={25} />
            </span>
            <div>
              <strong>{c.submitted}</strong>
              <p>{c.submittedHint}</p>
            </div>
          </div>
        )}

        {error && <div className="form-error public-error">{error}</div>}

        <section className="public-progress">
          <div>
            <strong>
              {c.progress
                .replace("{uploaded}", String(requiredUploaded))
                .replace("{total}", String(requiredTotal))}
            </strong>
            <span>{c.fileHint}</span>
          </div>
          <div className="progress-track">
            <span
              style={{
                width: `${requiredTotal ? (requiredUploaded / requiredTotal) * 100 : 100}%`
              }}
            />
          </div>
        </section>

        <div className="public-requirements">
          {request.requirements
            .slice()
            .sort((a, b) => a.order - b.order)
            .map((requirement) => {
              const busy = busyDocumentType === requirement.documentTypeId;
              const document = requirement.currentDocument;

              return (
                <article className="public-requirement" key={requirement.documentTypeId}>
                  <span className={`document-state ${document ? "uploaded" : ""}`}>
                    {document ? <Check size={20} /> : <FileCheck2 size={20} />}
                  </span>
                  <div className="document-info">
                    <strong>{requirement.documentTypeName}</strong>
                    <span>{requirement.isRequired ? c.required : c.optional}</span>
                    {document && (
                      <div className="uploaded-file">
                        <span>{document.fileName}</span>
                        <small>{formatBytes(document.sizeBytes)}</small>
                        {document.lastReviewerComment && (
                          <p>{document.lastReviewerComment}</p>
                        )}
                      </div>
                    )}
                  </div>
                  {requirement.canUpload && (
                    <div className="document-actions">
                      <label className="upload-button">
                        {busy ? (
                          <LoaderCircle className="spin" size={17} />
                        ) : (
                          <FileUp size={17} />
                        )}
                        {document ? c.replace : c.selectFile}
                        <input
                          accept=".pdf,.jpg,.jpeg,.png,.webp,application/pdf,image/jpeg,image/png,image/webp"
                          disabled={busy}
                          onChange={(event) =>
                            void handleUpload(requirement.documentTypeId, event)
                          }
                          type="file"
                        />
                      </label>
                      {document && (
                        <button
                          aria-label={`Remover ${document.fileName}`}
                          className="icon-button danger-button"
                          disabled={busy}
                          onClick={() => void handleDelete(requirement)}
                          title={c.removeFile}
                        >
                          <Trash2 size={17} />
                        </button>
                      )}
                    </div>
                  )}
                </article>
              );
            })}
        </div>

        {request.canUpload && (
          <footer className="public-submit">
            <div>
              <strong>{c.reviewBeforeSubmit}</strong>
              <span>{c.noChangesAfterSubmit}</span>
            </div>
            <button
              className="primary-button compact-button"
              disabled={!request.canSubmit || submitting}
              onClick={() => void handleSubmit()}
            >
              {submitting ? c.submitting : c.submit}
            </button>
          </footer>
        )}
      </section>
    </main>
  );
}

function BrandHeader() {
  return (
    <header className="public-brand">
      <span className="brand-mark" aria-hidden="true">
        <img src="/brand/trustnetbr-icon.png" alt="" />
      </span>
      <span>TrustNetDocs</span>
    </header>
  );
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Nao foi possivel concluir a operacao.";
}

function formatDate(value: string, locale: string) {
  return new Intl.DateTimeFormat(locale, { dateStyle: "long" }).format(
    new Date(value)
  );
}

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

const publicCopy = {
  pt: {
    maxFileSize: "O arquivo deve ter no máximo 20 MB.",
    removeFile: "Remover o arquivo",
    confirmSubmit: "Confirmar o envio definitivo dos documentos?",
    loading: "Carregando solicitação...",
    unavailable: "Link indisponível",
    notFound: "Esta solicitação não foi encontrada.",
    tryAgain: "Tentar novamente",
    secureUpload: "Envio seguro de documentos",
    greeting: "Olá, {client}. Envie os documentos solicitados abaixo.",
    expired: "Este acesso expirou.",
    availableUntil: "Acesso disponível até {date}.",
    submitted: "Documentos enviados",
    submittedHint: "Recebemos seus arquivos. Eles agora seguirão para análise.",
    progress: "{uploaded} de {total} obrigatórios enviados",
    fileHint: "PDF, JPG, PNG ou WebP, com tamanho máximo de 20 MB.",
    invalidFileFormat: "Selecione um arquivo PDF, JPG, PNG ou WebP válido.",
    required: "Obrigatório",
    optional: "Opcional",
    replace: "Substituir",
    selectFile: "Selecionar arquivo",
    reviewBeforeSubmit: "Revise os arquivos antes de enviar",
    noChangesAfterSubmit:
      "Depois do envio, os documentos não poderão ser alterados.",
    submitting: "Enviando...",
    submit: "Enviar documentos"
  },
  en: {
    maxFileSize: "The file must be no larger than 20 MB.",
    removeFile: "Remove file",
    confirmSubmit: "Confirm the final document submission?",
    loading: "Loading request...",
    unavailable: "Link unavailable",
    notFound: "This request was not found.",
    tryAgain: "Try again",
    secureUpload: "Secure document upload",
    greeting: "Hello, {client}. Upload the requested documents below.",
    expired: "This access has expired.",
    availableUntil: "Access available until {date}.",
    submitted: "Documents submitted",
    submittedHint: "We received your files. They will now be reviewed.",
    progress: "{uploaded} of {total} required documents uploaded",
    fileHint: "PDF, JPG, PNG, or WebP files up to 20 MB.",
    invalidFileFormat: "Select a valid PDF, JPG, PNG, or WebP file.",
    required: "Required",
    optional: "Optional",
    replace: "Replace",
    selectFile: "Select file",
    reviewBeforeSubmit: "Review the files before submitting",
    noChangesAfterSubmit: "Documents cannot be changed after submission.",
    submitting: "Submitting...",
    submit: "Submit documents"
  }
};

function isAllowedDocument(file: File) {
  const extension = file.name.split(".").pop()?.toLocaleLowerCase();
  const allowedExtensions = ["pdf", "jpg", "jpeg", "png", "webp"];
  const allowedTypes = [
    "application/pdf",
    "image/jpeg",
    "image/png",
    "image/webp"
  ];

  return Boolean(
    extension &&
      allowedExtensions.includes(extension) &&
      allowedTypes.includes(file.type.toLocaleLowerCase())
  );
}
