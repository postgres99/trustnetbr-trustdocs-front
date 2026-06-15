import { useEffect, useMemo, useState } from "react";
import {
  AlertCircle,
  CalendarDays,
  ChevronRight,
  FileStack,
  ListFilter,
  LoaderCircle,
  RefreshCw,
  Search,
  X
} from "lucide-react";
import { ApiError } from "../../services/api/client";
import { EnumOption, getRequestStatuses } from "../../services/api/enums";
import {
  getRequests,
  RequestSummary
} from "../../services/api/requests";
import { useI18n } from "../../i18n/I18nContext";
export { getRequestMetrics } from "./requestMetrics";

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
  const { formatDateTime, locale, t } = useI18n();
  const [requests, setRequests] = useState<RequestSummary[]>([]);
  const [statuses, setStatuses] = useState<EnumOption[]>([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  async function loadRequests() {
    setLoading(true);
    setError("");

    try {
      const [requestData, statusData] = await Promise.all([
        getRequests(token, mineOnly),
        getRequestStatuses().catch(() => [])
      ]);
      setRequests(requestData);
      setStatuses(statusData);
    } catch (requestError) {
      setError(
        requestError instanceof ApiError
          ? requestError.message
          : t("requests.loadError")
      );
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRequests();
  }, [token, mineOnly, locale]);

  const visibleRequests = useMemo(() => {
    const normalizedSearch = search.trim().toLocaleLowerCase();
    const from = dateFrom ? new Date(`${dateFrom}T00:00:00`) : null;
    const to = dateTo ? new Date(`${dateTo}T23:59:59.999`) : null;
    const filtered = requests.filter((request) => {
      const createdAt = new Date(request.createDate);
      const matchesSearch =
        !normalizedSearch ||
        [request.id, request.templateName, request.clientName, request.statusDescription]
          .join(" ")
          .toLocaleLowerCase()
          .includes(normalizedSearch);

      return (
        matchesSearch &&
        (!statusFilter || request.status === Number(statusFilter)) &&
        (!from || createdAt >= from) &&
        (!to || createdAt <= to)
      );
    });

    return compact ? filtered.slice(0, 5) : filtered;
  }, [compact, dateFrom, dateTo, requests, search, statusFilter]);

  const hasFilters = Boolean(search || statusFilter || dateFrom || dateTo);

  function clearFilters() {
    setSearch("");
    setStatusFilter("");
    setDateFrom("");
    setDateTo("");
  }

  if (loading) {
    return (
      <div className="request-feedback">
        <LoaderCircle className="spin" size={22} />
        <span>{t("requests.loading")}</span>
      </div>
    );
  }

  if (error) {
    return (
      <div className="request-feedback error-state">
        <AlertCircle size={22} />
        <strong>{t("requests.loadError")}</strong>
        <span>{error}</span>
        <button className="secondary-button" onClick={() => void loadRequests()}>
          <RefreshCw size={16} />
          {t("requests.retry")}
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
              placeholder={t("requests.searchPlaceholder")}
              value={search}
            />
          </div>
          <div className="request-filter-field">
            <ListFilter size={16} />
            <select
              aria-label={t("requests.statusFilter")}
              onChange={(event) => setStatusFilter(event.target.value)}
              value={statusFilter}
            >
              <option value="">{t("requests.allStatuses")}</option>
              {statuses.map((status) => (
                <option key={status.value} value={status.value}>
                  {status.description}
                </option>
              ))}
            </select>
          </div>
          <label className="date-filter">
            <CalendarDays size={16} />
            <span>{t("requests.from")}</span>
            <input
              aria-label={t("requests.from")}
              onChange={(event) => {
                const value = event.target.value;
                setDateFrom(value);
                if (dateTo && value > dateTo) {
                  setDateTo("");
                }
              }}
              type="date"
              value={dateFrom}
            />
          </label>
          <label className="date-filter">
            <span>{t("requests.to")}</span>
            <input
              aria-label={t("requests.to")}
              min={dateFrom || undefined}
              onChange={(event) => setDateTo(event.target.value)}
              type="date"
              value={dateTo}
            />
          </label>
          {hasFilters && (
            <button
              className="secondary-button clear-filters"
              onClick={clearFilters}
              type="button"
            >
              <X size={15} />
              {t("requests.clearFilters")}
            </button>
          )}
          <button
            aria-label="Atualizar solicitacoes"
            className="icon-button bordered"
            onClick={() => void loadRequests()}
            title={t("common.refresh")}
          >
            <RefreshCw size={17} />
          </button>
          <span className="request-result-count">
            {t("requests.resultCount", { count: visibleRequests.length })}
          </span>
        </div>
      )}

      {visibleRequests.length === 0 ? (
        <div className="empty-state">
          <span className="empty-icon">
            <FileStack size={24} />
          </span>
          <h3>
            {hasFilters ? t("requests.noResults") : t("requests.none")}
          </h3>
          <p>
            {hasFilters
              ? t("requests.noResultsHint")
              : t("requests.emptyHint")}
          </p>
          {!hasFilters && onCreate && (
            <button className="secondary-button" onClick={onCreate}>
              {t("requests.create")}
            </button>
          )}
        </div>
      ) : (
        <div className="request-table-wrap">
          <table className="request-table">
            <thead>
              <tr>
                <th>{t("requests.request")}</th>
                <th>{t("requests.client")}</th>
                <th>{t("requests.status")}</th>
                <th>{t("requests.createdAt")}</th>
                <th>{t("requests.submittedAt")}</th>
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
                  <td>{formatDate(request.createDate, formatDateTime)}</td>
                  <td>{formatDate(request.submittedAtUtc, formatDateTime)}</td>
                  <td>
                    <button
                      aria-label={t("requests.open", { id: request.id })}
                      className="row-action"
                      onClick={() => onOpen?.(request.id)}
                      title={t("requests.open", { id: request.id })}
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

function formatDate(
  value: string | null,
  formatter: (value: string | Date) => string
) {
  if (!value) return "-";
  return formatter(value);
}
