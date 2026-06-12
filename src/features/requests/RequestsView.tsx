import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  ChevronRight,
  FileStack,
  LoaderCircle,
  RefreshCw,
  Search
} from "lucide-react";
import { ApiError } from "../../services/api/client";
import {
  getRequests,
  RequestSummary
} from "../../services/api/requests";

interface RequestsViewProps {
  token: string;
  mineOnly: boolean;
  compact?: boolean;
  onCreate?: () => void;
  onOpen?: (requestId: number) => void;
}

export function RequestsView({
  token,
  mineOnly,
  compact = false,
  onCreate,
  onOpen
}: RequestsViewProps) {
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRequests() {
    setLoading(true);
    setError("");

    try {
      setRequests(await getRequests(token, mineOnly));
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : "Nao foi possivel carregar as solicitacoes."
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests();
  }, [token, mineOnly]);

  const visibleRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const filtered = normalizedSearch
      ? requests.filter((request) =>
          [request.id, request.templateName, request.clientName, request.statusDescription]
            .join(" ")
            .toLocaleLowerCase()
            .includes(normalizedSearch)
        )
      : requests;

    return compact ? filtered.slice(0, 5) : filtered;
  }, [compact, requests, search]);

  if (loading) {
    return (
      <div className="request-feedback">
        <LoaderCircle className="spin" size={22} />
        <span>Carregando solicitacoes...</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="request-feedback error-state">
        <AlertCircle size={22} />
        <strong>Nao foi possivel carregar os dados</strong>
        <span>{error}</span>
        <button className="secondary-button" onClick={() => void loadRequests()}>
          <RefreshCw size={16} />
          Tentar novamente
        </button>
      </div>
    );
  }

  return (
    <>
      {!compact && (
        <div className="request-toolbar">
          <div className="search-field">
            <Search size={17} />
            <input
              aria-label="Buscar solicitacoes"
              onChange={(event) => setSearch(event.target.value)}
              placeholder="Buscar por cliente, modelo, status ou numero"
              value={search}
            />
          </div>
          <button
            aria-label="Atualizar solicitacoes"
            className="icon-button bordered"
            onClick={() => void loadRequests()}
            title="Atualizar"
          >
            <RefreshCw size={17} />
          </button>
        </div>
      )}

      {visibleRequests.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            <FileStack size={24} />
          </span>
          <h3>
            {search ? "Nenhum resultado encontrado" : "Nenhuma solicitacao encontrada"}
          </h3>
          <p>
            {search
              ? "Ajuste os termos da busca para localizar outra solicitacao."
              : "Crie a primeira solicitacao para iniciar o fluxo de documentos."}
          </p>
          {!search && onCreate && (
            <button className="secondary-button" onClick={onCreate}>
              Criar solicitacao
            </button>
          )}
        </div>
      ) : (
        <div className="request-table-wrap">
          <table className="request-table">
            <thead>
              <tr>
                <th>Solicitacao</th>
                <th>Cliente</th>
                <th>Status</th>
                <th>Criada em</th>
                <th>Enviada em</th>
                <th aria-label="Acoes" />
              </tr>
            </thead>
            <tbody>
              {visibleRequests.map((request) => (
                <tr key={request.id}>
                  <td>
                    <strong>#{request.id}</strong>
                    <span>{request.templateName}</span>
                  </td>
                  <td>{request.clientName}</td>
                  <td>
                    <StatusBadge
                      description={request.statusDescription}
                      status={request.status}
                    />
                  </td>
                  <td>{formatDate(request.createDate)}</td>
                  <td>{formatDate(request.submittedAtUtc)}</td>
                  <td>
                    <button
                      aria-label={`Abrir solicitacao ${request.id}`}
                      className="row-action"
                      onClick={() => onOpen?.(request.id)}
                      title="Abrir solicitacao"
                    >
                      <ChevronRight size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}

export function getRequestMetrics(requests: RequestSummary[]) {
  return {
    waiting: requests.filter((request) => [0, 1, 2].includes(request.status)).length,
    reviewing: requests.filter((request) => [3, 4].includes(request.status)).length,
    approved: requests.filter((request) => request.status === 5).length,
    resubmission: requests.filter((request) => request.status === 9).length
  };
}

function StatusBadge({
  status,
  description
}: {
  status: number;
  description: string;
}) {
  const tone =
    status === 5
      ? "success"
      : status === 6 || status === 8
        ? "danger"
        : status === 9
          ? "warning"
          : status === 3 || status === 4
            ? "info"
            : "neutral";

  return <span className={`status-badge ${tone}`}>{description}</span>;
}

function formatDate(value: string | null) {
  if (!value) return "-";

  return new Intl.DateTimeFormat("pt-BR", {
    dateStyle: "short",
    timeStyle: "short"
  }).format(new Date(value));
}
