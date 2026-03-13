import { vi } from "vitest";
import type { GatewayRequestHandler } from "./types.js";

export function createActiveRun(
  sessionKey: string,
  params: {
    sessionId?: string;
    owner?: { connId?: string; deviceId?: string };
  } = {},
) {
  const now = Date.now();
  return {
    controller: new AbortController(),
    sessionId: params.sessionId ?? `${sessionKey}-session`,
    sessionKey,
    startedAtMs: now,
    expiresAtMs: now + 30_000,
    ownerConnId: params.owner?.connId,
    ownerDeviceId: params.owner?.deviceId,
  };
}

interface ChatAbortContext {
  chatAbortControllers: Map<string, ReturnType<typeof createActiveRun>>;
  chatRunBuffers: Map<string, string>;
  chatDeltaSentAt: Map<string, number>;
  chatAbortedRuns: Map<string, number>;
  removeChatRun: ReturnType<typeof vi.fn>;
  agentRunSeq: Map<string, number>;
  broadcast: ReturnType<typeof vi.fn>;
  nodeSendToSession: ReturnType<typeof vi.fn>;
  logGateway: { warn: ReturnType<typeof vi.fn> };
  dedupe?: { get: ReturnType<typeof vi.fn> };
}

export function createChatAbortContext(overrides: Record<string, unknown> = {}): ChatAbortContext {
  return {
    chatAbortControllers: new Map(),
    chatRunBuffers: new Map(),
    chatDeltaSentAt: new Map(),
    chatAbortedRuns: new Map<string, number>(),
    removeChatRun: vi
      .fn()
      .mockImplementation((run: string) => ({ sessionKey: "main", clientRunId: run })),
    agentRunSeq: new Map<string, number>(),
    broadcast: vi.fn(),
    nodeSendToSession: vi.fn(),
    logGateway: { warn: vi.fn() },
    ...overrides,
  };
}

export async function invokeChatAbortHandler(params: {
  handler: GatewayRequestHandler;
  context: ChatAbortContext;
  request: { sessionKey: string; runId?: string };
  client?: {
    connId?: string;
    connect?: {
      device?: { id?: string };
      scopes?: string[];
    };
  } | null;
  respond?: ReturnType<typeof vi.fn>;
}): Promise<ReturnType<typeof vi.fn>> {
  const respond = params.respond ?? vi.fn();
  await params.handler({
    params: params.request,
    respond: respond as never,
    context: params.context as never,
    req: {} as never,
    client: (params.client ?? null) as never,
    isWebchatConnect: () => false,
  });
  return respond;
}
