interface UploadItem {
  name: string;
  loaded: number;
  total: number;
}

interface UploadOverlayProps {
  uploads: UploadItem[];
  onCancel: () => void;
}

export function UploadOverlay({ uploads, onCancel }: UploadOverlayProps) {
  if (uploads.length === 0) return null;

  const totalLoaded = uploads.reduce((sum, u) => sum + u.loaded, 0);
  const totalSize = uploads.reduce((sum, u) => sum + u.total, 0);
  const overallPct = totalSize > 0 ? Math.round((totalLoaded / totalSize) * 100) : 0;

  return (
    <div
      style={{
        position: 'fixed',
        bottom: 16,
        right: 16,
        width: 280,
        background: 'var(--bg-secondary)',
        border: '1px solid var(--border-primary)',
        borderRadius: 'var(--radius-md)',
        boxShadow: 'var(--shadow-lg)',
        padding: '12px 14px',
        zIndex: 1100,
        fontSize: 12,
      }}
    >
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          marginBottom: 8,
        }}
      >
        <span style={{ fontWeight: 500, color: 'var(--text-primary)' }}>
          Uploading {uploads.length} {uploads.length === 1 ? 'file' : 'files'}
        </span>
        <button
          onClick={onCancel}
          style={{
            background: 'none',
            border: 'none',
            cursor: 'pointer',
            color: 'var(--text-secondary)',
            fontSize: 14,
            padding: '0 2px',
            lineHeight: 1,
          }}
          aria-label="Cancel upload"
        >
          ×
        </button>
      </div>

      {uploads.map((u) => {
        const pct = u.total > 0 ? Math.round((u.loaded / u.total) * 100) : 0;
        return (
          <div key={u.name} style={{ marginBottom: 8 }}>
            <div
              style={{
                display: 'flex',
                justifyContent: 'space-between',
                color: 'var(--text-secondary)',
                marginBottom: 3,
              }}
            >
              <span
                style={{
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                  maxWidth: '200px',
                }}
              >
                {u.name}
              </span>
              <span style={{ flexShrink: 0, marginLeft: 8 }}>{pct}%</span>
            </div>
            <div
              style={{
                height: 4,
                background: 'var(--border-primary)',
                borderRadius: 2,
                overflow: 'hidden',
              }}
            >
              <div
                style={{
                  height: '100%',
                  width: `${pct}%`,
                  background: 'var(--accent)',
                  borderRadius: 2,
                  transition: 'width 0.2s ease',
                }}
              />
            </div>
          </div>
        );
      })}

      {uploads.length > 1 && (
        <div style={{ marginTop: 4, color: 'var(--text-tertiary)' }}>
          Overall: {overallPct}%
        </div>
      )}
    </div>
  );
}
