import { useState, useCallback, useMemo } from 'react';
import { useUIStore } from '@/shared/stores/uiStore';
import { useReferralInfo } from '@/shared/hooks/useSocial';

interface InviteFriendsProps {
  open: boolean;
  onClose: () => void;
}

const BONUS_PER_FRIEND = 50;

export default function InviteFriends({ open, onClose }: InviteFriendsProps) {
  const addToast = useUIStore((s) => s.addToast);
  const { data: referralData, isLoading } = useReferralInfo();
  const [copied, setCopied] = useState(false);

  const referralCode = referralData?.referralCode || 'LOADING...';
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const referredUsers = referralData?.referredUsers || [];
  const joinedCount = referredUsers.length;
  const totalCommissionEarned = referralData?.totalCommissionEarned || 0;

  const handleCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(referralLink);
      setCopied(true);
      addToast('Đã copy link mời! 📋', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      addToast('Không copy được, hãy copy thủ công', 'info');
    }
  }, [referralLink, addToast]);

  const handleShare = useCallback(async () => {
    if (navigator.share) {
      try {
        await navigator.share({
          title: 'Organic Kingdom - Mời bạn trồng cây!',
          text: `Tham gia Organic Kingdom cùng mình! Nhận ngay ${BONUS_PER_FRIEND} OGN khi đăng ký 🌱`,
          url: referralLink,
        });
      } catch { /* user cancelled */ }
    } else {
      handleCopy();
    }
  }, [referralLink, handleCopy]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div className="relative w-full max-w-[430px] rounded-t-2xl overflow-hidden animate-slide-up"
        style={{ maxHeight: '85vh' }}>

        {/* Header */}
        <div className="px-5 py-4 text-center relative"
          style={{ background: 'linear-gradient(135deg, #f0b429, #e67e22)' }}>
          <button onClick={onClose}
            className="absolute right-4 top-4 text-white/70 text-xl font-bold w-8 h-8 flex items-center justify-center">✕</button>
          <div className="text-4xl mb-1">🎁</div>
          <h3 className="font-heading text-xl font-bold text-white">Mời Bạn Bè</h3>
          <p className="text-sm text-white/80 font-semibold mt-1">
            Mời bạn nhận <span className="text-white font-bold">{BONUS_PER_FRIEND} OGN</span> mỗi người!
          </p>
        </div>

        <div className="bg-white overflow-y-auto" style={{ maxHeight: 'calc(85vh - 120px)' }}>

          {/* Stats */}
          <div className="flex gap-3 px-5 py-4">
            <div className="flex-1 text-center p-3 rounded-xl" style={{ background: '#f0faf2' }}>
              <p className="font-heading text-2xl font-bold text-primary">{isLoading ? '...' : joinedCount}</p>
              <p className="text-[10px] font-bold text-muted-foreground">Đã tham gia</p>
            </div>
            <div className="flex-1 text-center p-3 rounded-xl" style={{ background: '#fff8e1' }}>
              <p className="font-heading text-2xl font-bold" style={{ color: '#d49a1a' }}>{isLoading ? '...' : totalCommissionEarned.toLocaleString('vi-VN')}</p>
              <p className="text-[10px] font-bold text-muted-foreground">Hoa hồng đã nhận</p>
            </div>
            <div className="flex-1 text-center p-3 rounded-xl" style={{ background: '#f0f0ff' }}>
              <p className="font-heading text-2xl font-bold" style={{ color: '#6c5ce7' }}>{referralData?.commissionCount || 0}</p>
              <p className="text-[10px] font-bold text-muted-foreground">Giao dịch hoa hồng</p>
            </div>
          </div>

          {/* Referral link */}
          <div className="px-5 mb-4">
            <p className="text-xs font-bold text-muted-foreground mb-2">Link mời của bạn</p>
            <div className="flex gap-2">
              <div className="flex-1 px-3 py-2.5 rounded-lg text-xs font-mono truncate"
                style={{ background: '#f5f0e8', border: '1px solid #e8e0d4', color: '#5c4a3a' }}>
                {referralLink}
              </div>
              <button onClick={handleCopy}
                className="px-4 py-2.5 rounded-lg font-heading text-xs font-bold text-white flex-shrink-0 active:scale-95 transition-transform"
                style={{ background: copied ? '#27ae60' : 'linear-gradient(135deg, #2d8a4e, #4eca6a)' }}>
                {copied ? '✅' : '📋 Copy'}
              </button>
            </div>
          </div>

          {/* Share buttons */}
          <div className="px-5 mb-4 flex gap-2">
            <button onClick={handleShare}
              className="flex-1 py-3 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-transform"
              style={{ background: 'linear-gradient(135deg, #2d8a4e, #4eca6a)', boxShadow: '0 4px 15px rgba(45,138,78,0.3)' }}>
              📤 Chia sẻ link
            </button>
            <button onClick={() => {
              window.open(`https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Tham gia Organic Kingdom cùng mình! 🌱')}`, '_blank');
            }}
              className="py-3 px-5 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-transform"
              style={{ background: 'linear-gradient(135deg, #0088cc, #229ED9)' }}>
              ✈️
            </button>
            <button onClick={() => {
              window.open(`https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`, '_blank');
            }}
              className="py-3 px-5 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-transform"
              style={{ background: 'linear-gradient(135deg, #1877f2, #4a9eff)' }}>
              📘
            </button>
          </div>

          {/* Rewards info */}
          <div className="mx-5 mb-4 p-3 rounded-xl"
            style={{ background: 'rgba(240,180,41,0.1)', border: '1px solid rgba(240,180,41,0.2)' }}>
            <p className="text-xs font-bold mb-2" style={{ color: '#d49a1a' }}>🎁 Phần thưởng & Hoa hồng</p>
            <div className="space-y-1 text-[11px] font-semibold text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>👤 Bạn nhận khi bạn bè đăng ký:</span>
                <span className="font-bold" style={{ color: '#d49a1a' }}>{BONUS_PER_FRIEND} OGN</span>
              </div>
              <div className="flex items-center gap-2">
                <span>💰 Hoa hồng khi bạn bè mua item:</span>
                <span className="font-bold" style={{ color: '#d49a1a' }}>5%</span>
              </div>
            </div>
          </div>

          {/* Invited list */}
          <div className="px-5 pb-8">
            <p className="text-xs font-bold text-muted-foreground mb-3">Danh sách người được giới thiệu ({referredUsers.length})</p>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-2xl mb-2 animate-bounce">🔄</div>
                <p className="text-xs font-semibold">Đang tải...</p>
              </div>
            ) : referredUsers.length === 0 ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-3xl mb-2">👥</div>
                <p className="text-xs font-semibold">Chưa có người nào được giới thiệu</p>
                <p className="text-[10px] mt-1">Chia sẻ link để mời bạn bè tham gia!</p>
              </div>
            ) : (
              referredUsers.map((user, idx) => {
                const joinedDate = new Date(user.joinedAt);
                const daysAgo = Math.floor((Date.now() - joinedDate.getTime()) / (1000 * 60 * 60 * 24));

                return (
                  <div key={idx} className="flex items-center gap-3 py-3" style={{ borderBottom: '1px solid #f0ebe4' }}>
                    <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center text-xl">
                      👤
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-heading text-sm font-bold truncate">{user.name}</p>
                      <p className="text-[10px] font-semibold text-muted-foreground">
                        ✅ Đã tham gia • {daysAgo === 0 ? 'Hôm nay' : daysAgo === 1 ? 'Hôm qua' : `${daysAgo} ngày trước`}
                      </p>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
