import { describe, expect, it } from "vitest";
import { RequestSummary } from "../../services/api/requests";
import { getRequestMetrics } from "./requestMetrics";

function request(status: number): RequestSummary {
  return {
    id: status + 1,
    templateName: "Template",
    clientName: "Client",
    status,
    statusDescription: `Status ${status}`,
    createDate: "2026-06-14T12:00:00Z",
    submittedAtUtc: null
  };
}

describe("getRequestMetrics", () => {
  it("groups request statuses into dashboard metrics", () => {
    const metrics = getRequestMetrics([
      request(0),
      request(1),
      request(2),
      request(3),
      request(4),
      request(5),
      request(9)
    ]);

    expect(metrics).toEqual({
      waiting: 3,
      reviewing: 2,
      approved: 1,
      resubmission: 1
    });
  });

  it("does not include terminal statuses in unrelated metrics", () => {
    expect(getRequestMetrics([request(6), request(7), request(8)])).toEqual({
      waiting: 0,
      reviewing: 0,
      approved: 0,
      resubmission: 0
    });
  });
});
