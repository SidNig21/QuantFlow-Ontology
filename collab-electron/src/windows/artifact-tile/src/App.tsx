import { useEffect, useState } from "react";

type ArtifactRow = {
  id: string;
  kind: string;
  content_hash: string;
  storage_ref: string;
  created_at: string;
};

function shortId(id: string): string {
  return id.length <= 12 ? id : `${id.slice(0, 8)}…${id.slice(-4)}`;
}

function App() {
  const [artifactId] = useState(() => {
    const p = new URLSearchParams(window.location.search);
    return p.get("artifactId") ?? "";
  });
  const [row, setRow] = useState<ArtifactRow | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!artifactId) {
      setError("No artifactId");
      return;
    }
    let cancelled = false;
    (async () => {
      const res = await window.api.qf.listArtifacts();
      if (cancelled) return;
      if (!res.ok) {
        setError(`${res.error.name}: ${res.error.message}`);
        return;
      }
      // Gate 4 evidence: log the list response the tile receives on mount.
      console.log("qf:artifacts:list", JSON.stringify(res.artifacts));
      const found = res.artifacts.find((a) => a.id === artifactId) as
        | ArtifactRow
        | undefined;
      if (!found) {
        setError(`Artifact not found: ${shortId(artifactId)}`);
        return;
      }
      setRow(found);
    })().catch((e: unknown) => {
      if (!cancelled) setError(e instanceof Error ? e.message : String(e));
    });
    return () => {
      cancelled = true;
    };
  }, [artifactId]);

  if (error) {
    return (
      <div className="artifact-tile artifact-tile--error">{error}</div>
    );
  }
  if (!row) {
    return <div className="artifact-tile artifact-tile--muted">Loading…</div>;
  }

  return (
    <div className="artifact-tile">
      <div className="artifact-tile__row">
        <span className="artifact-tile__label">id</span>
        <span className="artifact-tile__value" title={row.id}>
          {shortId(row.id)}
        </span>
      </div>
      <div className="artifact-tile__row">
        <span className="artifact-tile__label">kind</span>
        <span className="artifact-tile__value">{row.kind}</span>
      </div>
      <div className="artifact-tile__row">
        <span className="artifact-tile__label">content_hash</span>
        <span className="artifact-tile__value" title={row.content_hash}>
          {shortId(row.content_hash)}
        </span>
      </div>
      <div className="artifact-tile__row">
        <span className="artifact-tile__label">storage_ref</span>
        <span className="artifact-tile__value">{row.storage_ref}</span>
      </div>
      <div className="artifact-tile__row">
        <span className="artifact-tile__label">created_at</span>
        <span className="artifact-tile__value">{row.created_at}</span>
      </div>
    </div>
  );
}

export default App;

