import { afterEach, describe, expect, it, vi } from "vitest";
import {
  ApiError,
  apiRequest,
  SESSION_EXPIRED_EVENT,
  setApiCulture
} from "./client";

afterEach(() => {
  vi.restoreAllMocks();
  vi.unstubAllGlobals();
});

describe("apiRequest", () => {
  it("sends authentication and culture headers", async () => {
    const fetchMock = vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: true,
          data: { id: 12 },
          code: "ok",
          message: "OK"
        }),
        {
          status: 200,
          headers: { "Content-Type": "application/json" }
        }
      )
    );

    setApiCulture("en-US");
    await expect(apiRequest("/requests", {}, "token-value")).resolves.toEqual({
      id: 12
    });

    const [, options] = fetchMock.mock.calls[0];
    const headers = new Headers(options?.headers);
    expect(headers.get("Authorization")).toBe("Bearer token-value");
    expect(headers.get("Accept-Language")).toBe("en-US");
  });

  it("throws the standardized API error payload", async () => {
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          data: null,
          code: "validation_error",
          message: "Invalid request"
        }),
        {
          status: 400,
          headers: { "Content-Type": "application/json" }
        }
      )
    );

    const promise = apiRequest("/requests");
    await expect(promise).rejects.toMatchObject({
      name: "ApiError",
      status: 400,
      code: "validation_error",
      message: "Invalid request"
    });
  });

  it("notifies the application when an authenticated session expires", async () => {
    const eventTarget = new EventTarget();
    const listener = vi.fn();
    eventTarget.addEventListener(SESSION_EXPIRED_EVENT, listener);
    vi.stubGlobal("window", eventTarget);
    vi.spyOn(globalThis, "fetch").mockResolvedValue(
      new Response(
        JSON.stringify({
          success: false,
          data: null,
          code: "unauthorized",
          message: "Unauthorized"
        }),
        {
          status: 401,
          headers: { "Content-Type": "application/json" }
        }
      )
    );

    await expect(apiRequest("/auth/me", {}, "expired-token")).rejects.toBeInstanceOf(
      ApiError
    );
    expect(listener).toHaveBeenCalledOnce();
  });
});
