interface DownloadPromptProps {
  fileCount: number;
  onIndividual: () => void;
  onZip: () => void;
  onCancel: () => void;
}

export function DownloadPrompt({ fileCount, onIndividual, onZip, onCancel }: DownloadPromptProps) {
  return (
    <div
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 1050,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
      }}
    >
      {/* Backdrop */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0, 0, 0, 0.4)',
          backdropFilter: 'blur(2px)',
        }}
        onClick={onCancel}
      />

      {/* Modal */}
      <div
        style={{
          position: 'relative',
          background: 'var(--bg-secondary)',
          border: '1px solid var(--border-primary)',
          borderRadius: 'var(--radius-lg)',
          boxShadow: 'var(--shadow-lg)',
          padding: '24px 28px',
          width: 320,
          textAlign: 'center',
        }}
      >
        <h2
          style={{
            margin: '0 0 8px',
            fontSize: 15,
            fontWeight: 600,
            color: 'var(--text-primary)',
          }}
        >
          Download {fileCount} {fileCount === 1 ? 'file' : 'files'}
        </h2>
        <p
          style={{
            margin: '0 0 20px',
            fontSize: 12,
            color: 'var(--text-secondary)',
          }}
        >
          How would you like to download the selected files?
        </p>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          <button
            onClick={onIndividual}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: '1px solid var(--border-primary)',
              background: 'var(--bg-primary)',
              color: 'var(--text-primary)',
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Download individually
          </button>
          <button
            onClick={onZip}
            style={{
              padding: '8px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'var(--accent)',
              color: 'white',
              fontSize: 13,
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Download as ZIP
          </button>
          <button
            onClick={onCancel}
            style={{
              padding: '6px 16px',
              borderRadius: 'var(--radius-md)',
              border: 'none',
              background: 'none',
              color: 'var(--text-secondary)',
              fontSize: 12,
              cursor: 'pointer',
            }}
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  );
}
