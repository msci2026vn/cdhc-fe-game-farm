interface UpdatePopupProps {
  visible: boolean;
  onUpdate: () => void;
  onDismiss: () => void;
}

export const UpdatePopup = ({ visible, onUpdate, onDismiss }: UpdatePopupProps) => {
  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="polite"
      style={{
        position: 'fixed',
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 99999,
        display: 'flex',
        justifyContent: 'center',
        padding: '16px',
        pointerEvents: 'none',
        animation: 'updateSlideUp 0.35s ease-out',
      }}
    >
      <div
        style={{
          pointerEvents: 'auto',
          background: 'linear-gradient(135deg, #1a2e1a 0%, #0f1f0f 100%)',
          border: '1px solid rgba(34, 197, 94, 0.4)',
          borderRadius: '16px',
          padding: '16px 20px',
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          maxWidth: '420px',
          width: '100%',
          boxShadow: '0 8px 32px rgba(0,0,0,0.5), 0 0 0 1px rgba(34,197,94,0.15)',
          backdropFilter: 'blur(12px)',
        }}
      >
        <div style={{ fontSize: '28px', lineHeight: 1 }}>🔄</div>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ color: '#fff', fontWeight: 600, fontSize: '14px', marginBottom: '2px' }}>
            Phiên bản mới đã sẵn sàng!
          </div>
          <div style={{ color: 'rgba(255,255,255,0.6)', fontSize: '12px' }}>
            Cập nhật để trải nghiệm tốt hơn
          </div>
        </div>
        <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={onDismiss}
            style={{
              background: 'transparent',
              border: '1px solid rgba(255,255,255,0.2)',
              borderRadius: '10px',
              color: 'rgba(255,255,255,0.7)',
              padding: '8px 14px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 500,
            }}
          >
            Bỏ qua
          </button>
          <button
            onClick={onUpdate}
            style={{
              background: 'linear-gradient(135deg, #16a34a, #15803d)',
              border: 'none',
              borderRadius: '10px',
              color: '#fff',
              padding: '8px 14px',
              fontSize: '13px',
              cursor: 'pointer',
              fontWeight: 600,
              boxShadow: '0 2px 8px rgba(22,163,74,0.4)',
            }}
          >
            Cập nhật
          </button>
        </div>
      </div>

      <style>{`
        @keyframes updateSlideUp {
          from { opacity: 0; transform: translateY(100%); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
};
