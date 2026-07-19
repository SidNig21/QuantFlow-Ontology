import { useEffect, useState } from "react";

type SessionRow = {
  id: string;
  status: string;
  label: string | null;
  created_at: string;
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
    const offChunk = window.api.qf.onSessionChunk?.(onChunk);
    const offDone = window.api.qf.onSessionDone?.(onDone);

    return () => {
      cancelled = true;
      clearInterval(timer);
      offChunk?.();
      offDone?.();
    };
  }, [sessionId]);

  const cancel = async () => {
    await window.api.qf.cancelSession(sessionId);
  };

  if (error) {
    return <div className="session-tile session-tile--error">{error}</div>;
  }
  if (!row) {
    return <div className="session-tile">Loading…</div>;
  }

  const terminal = ["closed", "cancelled", "failed"].includes(row.status);

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
      <div className="session-tile__stream">{stream || "(streaming…)"}</div>
      <div className="session-tile__actions">
        <button type="button" disabled={terminal} onClick={() => void cancel()}>
          Cancel
        </button>
      </div>
    </div>
  );
}

export default App;
