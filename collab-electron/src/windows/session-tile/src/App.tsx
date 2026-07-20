import { useEffect, useState } from "react";

type SessionRow = {
  id: string;
  status: string;
  label: string | null;
  created_at: string;
};

type PermissionPrompt = {
  requestId: string;
  toolTitle: string;
  toolKind: string | null;
};

function shortId(id: string): string {
  return id.length <= 12 ? id : `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function App() {
  const [sessionId] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get("sessionId") ?? "";
  });
  const [row, setRow] = useState<SessionRow | null>(null);
  const [stream, setStream] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [turnBusy, setTurnBusy] = useState(false);
  const [permission, setPermission] = useState<PermissionPrompt | null>(null);

  useEffect(() => {
    if (!sessionId) {
      setError("No sessionId");
      return;
    }
    let cancelled = false;
    const refresh = async () => {
      const res = await window.api.qf.listSessions();
      if (cancelled) return;
      if (!res.ok) {
        setError(`${res.error.name}: ${res.error.message}`);
        return;
      }
      console.log("qf:sessions:list", JSON.stringify(res.sessions));
      const found = res.sessions.find((s) => s.id === sessionId) as
        | SessionRow
        | undefined;
      if (!found) {
        setError(`Session not found: ${shortId(sessionId)}`);
        return;
      }
      setRow(found);
    };
    void refresh();
    const timer = setInterval(() => {
      void refresh();
    }, 500);

    const onChunk = (payload: { sessionId: string; text: string }) => {
      if (payload.sessionId === sessionId) {
        setStream((s) => s + payload.text);
      }
    };
    const onDone = () => {
      void refresh();
    };
    const onPermission = (payload: {
      requestId: string;
      sessionId: string;
      toolCall: {
        toolCallId: string;
        title: string | null;
        kind: string | null;
      };
    }) => {
      if (payload.sessionId !== sessionId) return;
      setPermission({
        requestId: payload.requestId,
        toolTitle: payload.toolCall.title ?? payload.toolCall.toolCallId,
        toolKind: payload.toolCall.kind,
      });
    };
    const offChunk = window.api.qf.onSessionChunk?.(onChunk);
    const offDone = window.api.qf.onSessionDone?.(onDone);
    const offPerm = window.api.qf.onSessionPermission?.(onPermission);

    return () => {
      cancelled = true;
      clearInterval(timer);
      offChunk?.();
      offDone?.();
      offPerm?.();
    };
  }, [sessionId]);

  const cancel = async () => {
    await window.api.qf.cancelSession(sessionId);
  };

  const decide = async (decision: "allow_once" | "allow_always" | "deny") => {
    if (!permission) return;
    const requestId = permission.requestId;
    setPermission(null);
    await window.api.qf.permissionDecision?.({ requestId, decision });
  };

  const runDemoTurn = async () => {
    setTurnBusy(true);
    try {
      const res = await window.api.qf.runTurn({
        sessionId,
        prompt: "uppercase quantflow",
      });
      if (!res.ok) {
        setError(`${res.error.name}: ${res.error.message}`);
      }
    } finally {
      setTurnBusy(false);
    }
  };

  if (error) {
    return <div className="session-tile session-tile--error">{error}</div>;
  }
  if (!row) {
    return <div className="session-tile">Loading…</div>;
  }

  const canCancel = row.status === "running" || row.status === "blocked";
  const canRunTurn = canCancel && !turnBusy;

  return (
    <div className="session-tile">
      <div className="session-tile__row">
        <span className="session-tile__label">id</span>
        <span className="session-tile__value" title={row.id}>
          {shortId(row.id)}
        </span>
      </div>
      <div className="session-tile__row">
        <span className="session-tile__label">species</span>
        <span className="session-tile__value">{row.label ?? "—"}</span>
      </div>
      <div className="session-tile__row">
        <span className="session-tile__label">status</span>
        <span className="session-tile__value">{row.status}</span>
      </div>
      {permission ? (
        <div className="session-tile__permission" role="dialog">
          <div className="session-tile__permission-title">
            Permission: {permission.toolTitle}
            {permission.toolKind ? ` (${permission.toolKind})` : ""}
          </div>
          <div className="session-tile__actions">
            <button type="button" onClick={() => void decide("allow_once")}>
              Allow once
            </button>
            <button type="button" onClick={() => void decide("allow_always")}>
              Allow always
            </button>
            <button type="button" onClick={() => void decide("deny")}>
              Deny
            </button>
          </div>
        </div>
      ) : null}
      <div className="session-tile__stream">{stream || "(streaming…)"}</div>
      <div className="session-tile__actions">
        {canRunTurn ? (
          <button type="button" onClick={() => void runDemoTurn()}>
            Run turn
          </button>
        ) : null}
        {canCancel ? (
          <button type="button" onClick={() => void cancel()}>
            Cancel
          </button>
        ) : null}
      </div>
    </div>
  );
}

export default App;
