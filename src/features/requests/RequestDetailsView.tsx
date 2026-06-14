import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  Eye,
  FileText,
  History,
  LoaderCircle,
  ShieldCheck,
  X
} from "lucide-react";
import { ApiError } from "../../services/api/client";
import {
  EnumOption,
  getDocumentReviewStatuses
} from "../../services/api/enums";
import {
  downloadDocument,
  getRequestDetails,
  RequestDetails,
  RequestDocument,
  updateDocumentStatus
} from "../../services/api/requests";
import { useI18n } from "../../i18n/I18nContext";

interface RequestDetailsViewProps {
  token: string;
  requestId: number;
  mineOnly: boolean;
  onBack: () => void;
}

export function RequestDetailsView({
  token,
  requestId,
  mineOnly,
  onBack
}: RequestDetailsViewProps) {
  const { formatDateTime, locale } = useI18n();
  const c = locale === "en-US" ? detailsCopy.en : detailsCopy.pt;
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [reviewOptions, setReviewOptions] = useState<EnumOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [previewLoadingId, setPreviewLoadingId] = useState<number | null>(null);
  const [preview, setPreview] = useState<{
    url: string;
    contentType: string;
    fileName: string;
  } | null>(null);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview.url);
      }
    };
  }, [preview]);

  useEffect(() => {
    const calls: Promise<unknown>[] = [
      getRequestDetails(token, requestId, mineOnly).then(setRequest)
    ];

    if (!mineOnly) {
      calls.push(getDocumentReviewStatuses().then(setReviewOptions));
    }

    Promise.all(calls)
      .catch((requestError) => setError(getErrorMessage(requestError)))
      .finally(() => setLoading(false));
  }, [mineOnly, requestId, token]);

  if (loading) {
    return (
      <div className="request-feedback detail-loading">
        <LoaderCircle className="spin" size={24} />
        <span>{c.loading}</span>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="request-feedback error-state detail-loading">
        <strong>{c.openError}</strong>
        <span>{error}</span>
        <button className="secondary-button" onClick={onBack}>
          {c.back}
        </button>
      </div>
    );
  }

  async function handleReview(
    document: RequestDocument,
    status: number,
    comment: string
  ) {
    setError("");
    try {
      setRequest(
        await updateDocumentStatus(token, document.id, status, comment)
      );
    } catch (requestError) {
      setError(getErrorMessage(requestError));
      throw requestError;
    }
  }

  async function openPreview(document: RequestDocument) {
    setPreviewLoadingId(document.id);
    setError("");
    try {
      const result = await downloadDocument(token, document.id, false);
      setPreview((current) => {
        if (current) {
          URL.revokeObjectURL(current.url);
        }

        return {
          url: URL.createObjectURL(result.blob),
          contentType: document.contentType,
          fileName: document.fileName
        };
      });
    } catch (requestError) {
      setError(getErrorMessage(requestError));
    } finally {
      setPreviewLoadingId(null);
    }
  }

  function closePreview() {
    setPreview((current) => {
      if (current) {
        URL.revokeObjectURL(current.url);
      }
      return null;
    });
  }

  return (
    <>
      <div className="page-heading request-detail-heading">
        <div>
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={17} />
            {c.backToRequests}
          </button>
          <span className="eyebrow">{c.request} #{request.id}</span>
          <h1>{request.templateName}</h1>
          <p>{request.clientName}</p>
        </div>
        <span className={`status-badge detail-status status-${request.status}`}>
          {request.statusDescription}
        </span>
      </div>

      {error && <div className="form-error detail-error">{error}</div>}

      <section className="detail-summary">
        <SummaryItem label={c.client} value={request.clientName} />
        {request.clientCpf && <SummaryItem label={c.taxId} value={request.clientCpf} />}
        <SummaryItem label={c.createdAt} value={formatDateTime(request.createDateUtc)} />
        <SummaryItem
          label={c.submittedAt}
          value={request.submittedAtUtc ? formatDateTime(request.submittedAtUtc) : "-"}
        />
        <SummaryItem
          label={c.expiresAt}
          value={request.expiresAtUtc ? formatDateTime(request.expiresAtUtc) : c.noDeadline}
        />
      </section>

      <section className="detail-section">
        <div className="section-heading">
          <div>
            <h2>{c.documents}</h2>
            <p>{c.documentsHint}</p>
          </div>
        </div>

        {request.documents.length === 0 ? (
          <div className="empty-state compact-empty">
            <FileText size={25} />
            <h3>{c.noDocuments}</h3>
          </div>
        ) : (
          <div className="document-review-list">
            {request.documents.map((document) => (
              <DocumentReview
                document={document}
                key={document.id}
                mineOnly={mineOnly}
                options={reviewOptions}
                previewLoading={previewLoadingId === document.id}
                onDownload={(original) =>
                  void handleDownload(token, document, original)
                }
                onPreview={() => void openPreview(document)}
                copy={c}
                onReview={handleReview}
              />
            ))}
          </div>
        )}
      </section>

      {!mineOnly && request.timeline && (
        <section className="detail-section">
          <div className="section-heading">
            <div>
              <h2>{c.history}</h2>
              <p>{c.historyHint}</p>
            </div>
            <History size={19} />
          </div>
          <div className="timeline">
            {request.timeline.map((event) => (
              <div className="timeline-item" key={event.id}>
                <span className="timeline-dot" />
                <div>
                  <strong>{event.eventTypeDescription}</strong>
                  <span>
                    {formatDateTime(event.occurredAtUtc)}
                    {event.actorDisplay ? ` ${c.by} ${event.actorDisplay}` : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {preview && (
        <DocumentPreviewDialog
          contentType={preview.contentType}
          fileName={preview.fileName}
          url={preview.url}
          copy={c}
          onClose={closePreview}
        />
      )}
    </>
  );
}

function DocumentReview({
  document,
  mineOnly,
  options,
  previewLoading,
  onDownload,
  onPreview,
  onReview,
  copy
}: {
  document: RequestDocument;
  mineOnly: boolean;
  options: EnumOption[];
  previewLoading: boolean;
  onDownload: (original: boolean) => void;
  onPreview: () => void;
  onReview: (
    document: RequestDocument,
    status: number,
    comment: string
  ) => Promise<void>;
  copy: Record<keyof (typeof detailsCopy)["pt"], string>;
}) {
  const [status, setStatus] = useState(String(document.reviewStatus));
  const [comment, setComment] = useState(document.lastReviewerComment ?? "");
  const [saving, setSaving] = useState(false);
  const finalized = [2, 3].includes(document.reviewStatus);

  async function saveReview() {
    setSaving(true);
    try {
      await onReview(document, Number(status), comment);
    } finally {
      setSaving(false);
    }
  }

  return (
    <article className="document-review">
      <span className="document-file-icon">
        <FileText size={21} />
      </span>
      <div className="document-review-main">
        <div className="document-review-heading">
          <div>
            <strong>{document.documentTypeName}</strong>
            <span>
              {document.fileName} · {formatBytes(document.sizeBytes)}
            </span>
          </div>
          <span className={`status-badge review-status-${document.reviewStatus}`}>
            {document.reviewStatusDescription}
          </span>
        </div>

        {document.lastReviewerComment && mineOnly && (
          <div className="review-comment">
            <ShieldCheck size={16} />
            {document.lastReviewerComment}
          </div>
        )}

        {!mineOnly && !finalized && (
          <div className="review-form">
            <select value={status} onChange={(event) => setStatus(event.target.value)}>
              {options
                .filter((option) => option.value !== 0)
                .map((option) => (
                  <option key={option.value} value={option.value}>
                    {option.description}
                  </option>
                ))}
            </select>
            <input
              onChange={(event) => setComment(event.target.value)}
              placeholder={copy.commentPlaceholder}
              value={comment}
            />
            <button
              className="secondary-button"
              disabled={saving}
              onClick={() => void saveReview()}
            >
              <CheckCircle2 size={16} />
              {saving ? copy.saving : copy.saveReview}
            </button>
          </div>
        )}
      </div>

      {!mineOnly && (
        <div className="download-actions">
          {canPreview(document.contentType) && (
            <button
              className="icon-button bordered"
              disabled={previewLoading}
              onClick={onPreview}
              title={copy.previewWatermarked}
            >
              {previewLoading ? (
                <LoaderCircle className="spin" size={17} />
              ) : (
                <Eye size={17} />
              )}
            </button>
          )}
          <button className="icon-button bordered" onClick={() => onDownload(false)} title={copy.watermarkedDownload}>
            <ShieldCheck size={17} />
          </button>
          <button className="icon-button bordered" onClick={() => onDownload(true)} title={copy.originalDownload}>
            <Download size={17} />
          </button>
        </div>
      )}
    </article>
  );
}

function DocumentPreviewDialog({
  url,
  contentType,
  fileName,
  copy,
  onClose
}: {
  url: string;
  contentType: string;
  fileName: string;
  copy: Record<keyof (typeof detailsCopy)["pt"], string>;
  onClose: () => void;
}) {
  const isPdf = contentType.toLocaleLowerCase() === "application/pdf";

  useEffect(() => {
    function closeOnEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        onClose();
      }
    }

    window.addEventListener("keydown", closeOnEscape);
    return () => window.removeEventListener("keydown", closeOnEscape);
  }, [onClose]);

  return (
    <div
      className="dialog-backdrop document-preview-backdrop"
      onMouseDown={onClose}
    >
      <section
        className="document-preview-dialog"
        onMouseDown={(event) => event.stopPropagation()}
        aria-modal="true"
        role="dialog"
      >
        <header>
          <div>
            <span className="eyebrow">{copy.protectedPreview}</span>
            <h2>{fileName}</h2>
          </div>
          <button className="icon-button" onClick={onClose} title={copy.close}>
            <X size={20} />
          </button>
        </header>
        <div className="document-preview-content">
          {isPdf ? (
            <iframe src={url} title={fileName} />
          ) : (
            <img alt={fileName} src={url} />
          )}
        </div>
        <footer>
          <ShieldCheck size={16} />
          {copy.previewHint}
        </footer>
      </section>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: string }) {
  return (
    <div>
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}

async function handleDownload(
  token: string,
  document: RequestDocument,
  original: boolean
) {
  const result = await downloadDocument(token, document.id, original);
  const url = URL.createObjectURL(result.blob);
  const anchor = window.document.createElement("a");
  anchor.href = url;
  anchor.download = result.fileName;
  anchor.click();
  URL.revokeObjectURL(url);
}

function getErrorMessage(error: unknown) {
  return error instanceof ApiError
    ? error.message
    : "Nao foi possivel concluir a operacao.";
}

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}

function canPreview(contentType: string) {
  return [
    "application/pdf",
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp"
  ].includes(contentType.toLocaleLowerCase());
}

const detailsCopy = {
  pt: {
    loading: "Carregando detalhes...",
    openError: "Não foi possível abrir a solicitação",
    back: "Voltar",
    backToRequests: "Voltar para solicitações",
    request: "Solicitação",
    client: "Cliente",
    taxId: "CPF/CNPJ",
    createdAt: "Criada em",
    submittedAt: "Enviada em",
    expiresAt: "Expira em",
    noDeadline: "Sem prazo",
    documents: "Documentos",
    documentsHint: "Arquivos recebidos e situação da análise.",
    noDocuments: "Nenhum documento enviado",
    history: "Histórico",
    historyHint: "Eventos registrados nesta solicitação.",
    by: "por",
    commentPlaceholder: "Comentário da análise (opcional)",
    saving: "Salvando...",
    saveReview: "Salvar análise",
    previewWatermarked: "Visualizar cópia protegida",
    protectedPreview: "Visualização protegida",
    previewHint: "Esta visualização utiliza a cópia com marca d'água.",
    close: "Fechar",
    watermarkedDownload: "Baixar com marca d'água",
    originalDownload: "Baixar original"
  },
  en: {
    loading: "Loading details...",
    openError: "Could not open the request",
    back: "Back",
    backToRequests: "Back to requests",
    request: "Request",
    client: "Client",
    taxId: "Tax ID",
    createdAt: "Created at",
    submittedAt: "Submitted at",
    expiresAt: "Expires at",
    noDeadline: "No deadline",
    documents: "Documents",
    documentsHint: "Received files and review status.",
    noDocuments: "No documents uploaded",
    history: "History",
    historyHint: "Events recorded for this request.",
    by: "by",
    commentPlaceholder: "Review comment (optional)",
    saving: "Saving...",
    saveReview: "Save review",
    previewWatermarked: "Preview protected copy",
    protectedPreview: "Protected preview",
    previewHint: "This preview uses the watermarked copy.",
    close: "Close",
    watermarkedDownload: "Download watermarked",
    originalDownload: "Download original"
  }
};
