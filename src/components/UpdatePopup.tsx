interface UpdatePopupProps {
  visible: boolean;
  dismissed?: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
  onShow?: () => void;
}

export const UpdatePopup = ({ visible, dismissed, onUpdate, onDismiss, onShow }: UpdatePopupProps) => {
  if (!visible) return null;

  if (dismissed) {
    return (
      <div
        role="button"
        title="Bản cập nhật mới"
        onClick={onShow}
        style={{
          position: 'fixed',
          top: '20px',
          right: '20px',
          zIndex: 99999,
          width: '36px',
          height: '36px',
          background: 'linear-gradient(135deg, #ef4444, #dc2626)',
          borderRadius: '50%',
          display: 'flex',
          justifyContent: 'center',
          alignItems: 'center',
          color: '#fff',
          fontWeight: 800,
          fontSize: '20px',
          cursor: 'pointer',
          boxShadow: '0 4px 12px rgba(239, 68, 68, 0.5)',
          animation: 'pulseAlert 2s infinite',
        }}
      >
        !
        <style>{`
          @keyframes pulseAlert {
            0% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0.7); }
            70% { transform: scale(1.05); box-shadow: 0 0 0 10px rgba(239, 68, 68, 0); }
            100% { transform: scale(1); box-shadow: 0 0 0 0 rgba(239, 68, 68, 0); }
          }
        `}</style>
      </div>
    );
  }

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'fixed',
        top: 0,
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        background: 'rgba(0,0,0,0.65)',
        animation: 'fadeInOverlay 0.2s ease-out',
        backdropFilter: 'blur(4px)',
      }}
    >
      <div
        style={{
          background: 'linear-gradient(135deg, #1a2e1a 0%, #0f1f0f 100%)',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          borderRadius: '20px',
          padding: '24px',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '16px',
          maxWidth: '320px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.8), 0 0 0 1px rgba(34,197,94,0.15)',
          animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        }}
      >
        <div style={{ fontSize: '48px', lineHeight: 1 }}>🔄</div>
        <div style={{ textAlign: 'center' }}>
          <div style={{ color: '#fff', fontWeight: 700, fontSize: '18px', marginBottom: '6px' }}>
            Phiên bản mới đã sẵn sàng!
          </div>
          <div style={{ color: 'rgba(255,255,255,0.7)', fontSize: '14px', lineHeight: 1.4 }}>
            Cập nhật để trải nghiệm tốt hơn
          </div>
        </div>
        <div style={{ display: 'flex', gap: '12px', width: '100%', marginTop: '8px' }}>
          <button
            onClick={onDismiss}
            style={{
              flex: 1,
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '12px',
              color: '#fff',
              padding: '12px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 600,
            }}
          >
            Bỏ qua
          </button>
          <button
            onClick={onUpdate}
            style={{
              flex: 1,
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              border: 'none',
              borderRadius: '12px',
              color: '#fff',
              padding: '12px',
              fontSize: '14px',
              cursor: 'pointer',
              fontWeight: 700,
              boxShadow: '0 4px 12px rgba(22,163,74,0.4)',
            }}
          >
            Cập nhật
          </button>
        </div>
      </div>

      <style>{`
        @keyframes fadeInOverlay {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9) translateY(10px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  );
};
