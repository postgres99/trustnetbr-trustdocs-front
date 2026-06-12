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

export function PublicRequestPage({ token }: { token: string }) {
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
      setError("O arquivo deve ter no maximo 20 MB.");
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
    if (!window.confirm(`Remover o arquivo "${requirement.currentDocument.fileName}"?`)) {
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
    if (!window.confirm("Confirmar o envio definitivo dos documentos?")) return;

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
        <span>Carregando solicitacao...</span>
      </main>
    );
  }

  if (!request) {
    return (
      <main className="public-request-page public-centered">
        <BrandHeader />
        <AlertCircle size={34} />
        <h1>Link indisponivel</h1>
        <p>{error || "Esta solicitacao nao foi encontrada."}</p>
        <button className="secondary-button" onClick={() => void loadRequest()}>
          <RefreshCw size={16} />
          Tentar novamente
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
            <span className="eyebrow">Envio seguro de documentos</span>
            <h1>{request.templateName}</h1>
            <p>
              Ola, {request.clientName}. Envie os documentos solicitados abaixo.
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
              ? "Este acesso expirou."
              : `Acesso disponivel ate ${formatDate(request.expiresAtUtc)}.`}
          </div>
        )}

        {finished && (
          <div className="submission-complete">
            <span className="success-icon">
              <Check size={25} />
            </span>
            <div>
              <strong>Documentos enviados</strong>
              <p>
                Recebemos seus arquivos. Eles agora seguirao para analise.
              </p>
            </div>
          </div>
        )}

        {error && <div className="form-error public-error">{error}</div>}

        <section className="public-progress">
          <div>
            <strong>
              {requiredUploaded} de {requiredTotal} obrigatorios enviados
            </strong>
            <span>Arquivos com tamanho maximo de 20 MB.</span>
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
                    <span>{requirement.isRequired ? "Obrigatorio" : "Opcional"}</span>
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
                        {document ? "Substituir" : "Selecionar arquivo"}
                        <input
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
                          title="Remover arquivo"
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
              <strong>Revise os arquivos antes de enviar</strong>
              <span>Depois do envio, os documentos nao poderao ser alterados.</span>
            </div>
            <button
              className="primary-button compact-button"
              disabled={!request.canSubmit || submitting}
              onClick={() => void handleSubmit()}
            >
              {submitting ? "Enviando..." : "Enviar documentos"}
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat("pt-BR", { dateStyle: "long" }).format(
    new Date(value)
  );
}

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
