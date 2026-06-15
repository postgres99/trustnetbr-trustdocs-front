import { RequestSummary } from "../../services/api/requests";

export function getRequestMetrics(requests: RequestSummary[]) {
  return {
    waiting: requests.filter((request) => [0, 1, 2].includes(request.status)).length,
    reviewing: requests.filter((request) => [3, 4].includes(request.status)).length,
    approved: requests.filter((request) => request.status === 5).length,
    resubmission: requests.filter((request) => request.status === 9).length
  };
}
