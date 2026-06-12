import { useEffect, useState } from "react";
import {
  ArrowLeft,
  CheckCircle2,
  Download,
  FileText,
  History,
  LoaderCircle,
  ShieldCheck
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
  const [request, setRequest] = useState<RequestDetails | null>(null);
  const [reviewOptions, setReviewOptions] = useState<EnumOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        <span>Carregando detalhes...</span>
      </div>
    );
  }

  if (!request) {
    return (
      <div className="request-feedback error-state detail-loading">
        <strong>Nao foi possivel abrir a solicitacao</strong>
        <span>{error}</span>
        <button className="secondary-button" onClick={onBack}>
          Voltar
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

  return (
    <>
      <div className="page-heading request-detail-heading">
        <div>
          <button className="back-button" onClick={onBack}>
            <ArrowLeft size={17} />
            Voltar para solicitacoes
          </button>
          <span className="eyebrow">Solicitacao #{request.id}</span>
          <h1>{request.templateName}</h1>
          <p>{request.clientName}</p>
        </div>
        <span className={`status-badge detail-status status-${request.status}`}>
          {request.statusDescription}
        </span>
      </div>

      {error && <div className="form-error detail-error">{error}</div>}

      <section className="detail-summary">
        <SummaryItem label="Cliente" value={request.clientName} />
        {request.clientCpf && <SummaryItem label="CPF/CNPJ" value={request.clientCpf} />}
        <SummaryItem label="Criada em" value={formatDate(request.createDateUtc)} />
        <SummaryItem
          label="Enviada em"
          value={request.submittedAtUtc ? formatDate(request.submittedAtUtc) : "-"}
        />
        <SummaryItem
          label="Expira em"
          value={request.expiresAtUtc ? formatDate(request.expiresAtUtc) : "Sem prazo"}
        />
      </section>

      <section className="detail-section">
        <div className="section-heading">
          <div>
            <h2>Documentos</h2>
            <p>Arquivos recebidos e situacao da analise.</p>
          </div>
        </div>

        {request.documents.length === 0 ? (
          <div className="empty-state compact-empty">
            <FileText size={25} />
            <h3>Nenhum documento enviado</h3>
          </div>
        ) : (
          <div className="document-review-list">
            {request.documents.map((document) => (
              <DocumentReview
                document={document}
                key={document.id}
                mineOnly={mineOnly}
                options={reviewOptions}
                onDownload={(original) =>
                  void handleDownload(token, document, original)
                }
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
              <h2>Historico</h2>
              <p>Eventos registrados nesta solicitacao.</p>
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
                    {formatDate(event.occurredAtUtc)}
                    {event.actorDisplay ? ` por ${event.actorDisplay}` : ""}
                  </span>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}
    </>
  );
}

function DocumentReview({
  document,
  mineOnly,
  options,
  onDownload,
  onReview
}: {
  document: RequestDocument;
  mineOnly: boolean;
  options: EnumOption[];
  onDownload: (original: boolean) => void;
  onReview: (
    document: RequestDocument,
    status: number,
    comment: string
  ) => Promise<void>;
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
              placeholder="Comentario da analise (opcional)"
              value={comment}
            />
            <button
              className="secondary-button"
              disabled={saving}
              onClick={() => void saveReview()}
            >
              <CheckCircle2 size={16} />
              {saving ? "Salvando..." : "Salvar analise"}
            </button>
          </div>
        )}
      </div>

      {!mineOnly && (
        <div className="download-actions">
          <button className="icon-button bordered" onClick={() => onDownload(false)} title="Baixar com marca d'agua">
            <ShieldCheck size={17} />
          </button>
          <button className="icon-button bordered" onClick={() => onDownload(true)} title="Baixar original">
            <Download size={17} />
          </button>
        </div>
      )}
    </article>
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

function formatDate(value: string) {
  return new Intl.DateTimeFormat(undefined, {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}

function formatBytes(value: number) {
  if (value < 1024 * 1024) return `${Math.max(1, Math.round(value / 1024))} KB`;
  return `${(value / (1024 * 1024)).toFixed(1)} MB`;
}
