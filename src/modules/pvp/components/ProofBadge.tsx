// src/modules/pvp/components/ProofBadge.tsx
// Hiển thị khi match đã được verify on-chain (Avalanche Merkle proof)

interface ProofBadgeProps {
  merkleRoot?: string | null;
  txHash?:     string | null;
  ipfsHash?:   string | null;
  moveCount?:  number;
}

export function ProofBadge({ merkleRoot, txHash, ipfsHash, moveCount }: ProofBadgeProps) {
  if (!txHash) return null;

  const explorerBase =
    process.env.NODE_ENV === 'production'
      ? 'https://snowtrace.io'
      : 'https://testnet.snowtrace.io';
  const snowtraceUrl = `${explorerBase}/tx/${txHash}`;
  const ipfsUrl = ipfsHash ? `https://gateway.pinata.cloud/ipfs/${ipfsHash}` : null;

  const shortRoot = merkleRoot
    ? `${merkleRoot.slice(0, 10)}...${merkleRoot.slice(-6)}`
    : null;

  return (
    <div style={{
      background: 'linear-gradient(135deg, rgba(14,36,14,0.95), rgba(5,15,5,0.9))',
      border: '1.5px solid rgba(34,197,94,0.35)',
      borderRadius: 12,
      padding: '10px 14px',
      marginTop: 8,
      boxShadow: '0 0 12px rgba(34,197,94,0.1), inset 0 1px 2px rgba(255,255,255,0.05)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}>
        <span style={{ fontSize: 16 }}>⛓️</span>
        <span style={{
          fontSize: 13, fontWeight: 800, color: '#86efac',
          flex: 1,
        }}>
          On-chain Verified
        </span>
        <span style={{ fontSize: 14 }}>✅</span>
      </div>

      {/* Sub-info */}
      <div style={{ fontSize: 10, color: 'rgba(255,255,255,0.45)', marginTop: 3 }}>
        Avalanche{moveCount != null ? ` · ${moveCount} moves` : ''}
      </div>

      {/* Merkle root */}
      {shortRoot && (
        <div style={{
          fontFamily: 'monospace',
          fontSize: 10,
          color: 'rgba(240,200,64,0.7)',
          marginTop: 3,
        }}>
          {shortRoot}
        </div>
      )}

      {/* Links */}
      <div style={{ display: 'flex', gap: 12, marginTop: 7 }}>
        <a
          href={snowtraceUrl}
          target="_blank"
          rel="noreferrer"
          style={{ fontSize: 11, fontWeight: 700, color: '#60a5fa', textDecoration: 'none' }}
        >
          Snowtrace ↗
        </a>
        {ipfsUrl && (
          <a
            href={ipfsUrl}
            target="_blank"
            rel="noreferrer"
            style={{ fontSize: 11, fontWeight: 700, color: '#a78bfa', textDecoration: 'none' }}
          >
            Full Replay ↗
          </a>
        )}
      </div>
    </div>
  );
}
