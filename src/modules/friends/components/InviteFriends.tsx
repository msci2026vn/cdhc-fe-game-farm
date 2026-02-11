import { useState, useCallback } from 'react';
import { useUIStore } from '@/shared/stores/uiStore';
import { useReferralInfo } from '@/shared/hooks/useSocial';
import type { ReferredUser, CommissionTransaction } from '@/shared/types/game-api.types';

interface InviteFriendsProps {
  open: boolean;
  onClose: () => void;
}

const BONUS_PER_FRIEND = 50;

type DetailTab = 'none' | 'referred' | 'commission' | 'transactions';

// ═══════════════════════════════════════════════════════════════
// SUB-COMPONENTS
// ═══════════════════════════════════════════════════════════════

function ReferredUsersList({ users }: { users: ReferredUser[] }) {
  if (users.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        <div className="text-2xl mb-2">👥</div>
        <p className="text-xs font-semibold">Chưa có ai tham gia</p>
      </div>
    );
  }

  return (
    <div className="space-y-2 mt-3 max-h-60 overflow-y-auto">
      {users.map((user) => (
        <div
          key={user.userId}
          className="flex items-center gap-3 p-3 bg-white rounded-xl shadow-sm border border-gray-100"
        >
          {/* Avatar + online dot */}
          <div className="relative flex-shrink-0">
            <img
              src={user.picture || '/default-avatar.png'}
              alt={user.name}
              className="w-10 h-10 rounded-full object-cover bg-gray-200"
            />
            <div
              className={`absolute bottom-0 right-0 w-3 h-3 rounded-full border-2 border-white ${
                user.isOnline ? 'bg-green-500' : 'bg-gray-400'
              }`}
            />
          </div>

          {/* Info */}
          <div className="flex-1 min-w-0">
            <div className="font-semibold text-sm truncate text-gray-800">{user.name}</div>
            <div className="text-xs text-gray-500">
              Tham gia: {new Date(user.joinedAt).toLocaleDateString('vi-VN')}
            </div>
            <div className="text-xs text-gray-400 flex items-center gap-1">
              {user.isOnline ? (
                <>
                  <span className="w-2 h-2 rounded-full bg-green-500" />
                  Đang online
                </>
              ) : (
                <>
                  <span className="w-2 h-2 rounded-full bg-gray-400" />
                  {user.lastSeenAgo || 'Offline'}
                </>
              )}
            </div>
          </div>

          {/* OGN + Level */}
          <div className="text-right flex-shrink-0">
            <div className="text-sm font-bold text-green-600">💰 {user.ogn}</div>
            <div className="text-xs text-gray-400">Lv.{user.level}</div>
          </div>
        </div>
      ))}
    </div>
  );
}

function CommissionSummary({
  total,
  history,
}: {
  total: number;
  history: CommissionTransaction[];
}) {
  return (
    <div className="mt-3">
      <div className="text-center p-4 bg-green-50 rounded-xl mb-3 border border-green-100">
        <div className="text-3xl font-bold text-green-600">💰 {total.toLocaleString('vi-VN')}</div>
        <div className="text-sm text-gray-600">Tổng hoa hồng đã nhận</div>
      </div>

      {history.length === 0 ? (
        <div className="text-center py-6 text-gray-400">
          <div className="text-2xl mb-2">💸</div>
          <p className="text-xs font-semibold">Chưa có hoa hồng</p>
        </div>
      ) : (
        <div className="max-h-60 overflow-y-auto space-y-2">
          {history.map((c) => (
            <div
              key={c.id}
              className="flex justify-between items-center p-3 bg-white rounded-xl shadow-sm border border-gray-100"
            >
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium text-gray-800 truncate">
                  {c.spenderName} mua {c.spendAction.replace('buy_', '')}
                </div>
                <div className="text-xs text-gray-400">
                  {new Date(c.createdAt).toLocaleDateString('vi-VN')}
                </div>
              </div>
              <div className="text-green-600 font-bold text-sm flex-shrink-0 ml-2">
                +{c.commissionAmount} OGN
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

function TransactionsList({ transactions }: { transactions: CommissionTransaction[] }) {
  if (transactions.length === 0) {
    return (
      <div className="text-center py-6 text-gray-400">
        <div className="text-2xl mb-2">📊</div>
        <p className="text-xs font-semibold">Chưa có giao dịch</p>
      </div>
    );
  }

  return (
    <div className="mt-3 space-y-2 max-h-60 overflow-y-auto">
      {transactions.map((tx) => (
        <div
          key={tx.id}
          className="p-3 bg-white rounded-xl shadow-sm border border-gray-100"
        >
          <div className="flex justify-between items-start mb-1">
            <span className="font-medium text-sm text-gray-800">{tx.spenderName}</span>
            <span className="text-green-600 font-bold text-sm">+{tx.commissionAmount} OGN</span>
          </div>
          <div className="flex justify-between text-xs text-gray-400 mt-1">
            <span>
              Mua: {tx.spendAmount} OGN ({tx.commissionRateBps / 100}%)
            </span>
            <span>{new Date(tx.createdAt).toLocaleString('vi-VN')}</span>
          </div>
        </div>
      ))}
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════
// MAIN COMPONENT
// ═══════════════════════════════════════════════════════════════

export default function InviteFriends({ open, onClose }: InviteFriendsProps) {
  const addToast = useUIStore((s) => s.addToast);
  const { data: referralData, isLoading } = useReferralInfo();
  const [copied, setCopied] = useState(false);
  const [activeTab, setActiveTab] = useState<DetailTab>('none');

  const referralCode = referralData?.referralCode || 'LOADING...';
  const referralLink = `${window.location.origin}/?ref=${referralCode}`;

  const joinedCount = referralData?.referredCount || 0;
  const totalCommissionEarned = referralData?.totalCommissionEarned || 0;
  const commissionCount = referralData?.commissionCount || 0;

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
      } catch {
        /* user cancelled */
      }
    } else {
      handleCopy();
    }
  }, [referralLink, handleCopy]);

  const toggleTab = useCallback(
    (tab: DetailTab) => {
      setActiveTab((prev) => (prev === tab ? 'none' : tab));
    },
    []
  );

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-end justify-center">
      <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={onClose} />

      <div
        className="relative w-full max-w-[430px] rounded-t-2xl overflow-hidden animate-slide-up"
        style={{ maxHeight: '85vh' }}
      >
        {/* Header */}
        <div
          className="px-5 py-4 text-center relative"
          style={{ background: 'linear-gradient(135deg, #f0b429, #e67e22)' }}
        >
          <button
            onClick={onClose}
            className="absolute right-4 top-4 text-white/70 text-xl font-bold w-8 h-8 flex items-center justify-center"
          >
            ✕
          </button>
          <div className="text-4xl mb-1">🎁</div>
          <h3 className="font-heading text-xl font-bold text-white">Mời Bạn Bè</h3>
          <p className="text-sm text-white/80 font-semibold mt-1">
            Mời bạn nhận <span className="text-white font-bold">{BONUS_PER_FRIEND} OGN</span> mỗi người!
          </p>
        </div>

        <div className="bg-white overflow-y-auto" style={{ maxHeight: 'calc(85vh - 120px)' }}>
          {/* Stats - Clickable cards */}
          <div className="flex gap-3 px-5 py-4">
            <div
              onClick={() => toggleTab('referred')}
              className={`flex-1 text-center p-3 rounded-xl cursor-pointer transition-all ${
                activeTab === 'referred'
                  ? 'ring-2 ring-green-500 bg-green-50'
                  : 'hover:shadow-md'
              }`}
              style={{ background: activeTab === 'referred' ? '' : '#f0faf2' }}
            >
              <p className="font-heading text-2xl font-bold text-primary">
                {isLoading ? '...' : joinedCount}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground">Đã tham gia</p>
            </div>
            <div
              onClick={() => toggleTab('commission')}
              className={`flex-1 text-center p-3 rounded-xl cursor-pointer transition-all ${
                activeTab === 'commission'
                  ? 'ring-2 ring-yellow-500 bg-yellow-50'
                  : 'hover:shadow-md'
              }`}
              style={{ background: activeTab === 'commission' ? '' : '#fff8e1' }}
            >
              <p
                className="font-heading text-2xl font-bold"
                style={{ color: '#d49a1a' }}
              >
                {isLoading ? '...' : totalCommissionEarned.toLocaleString('vi-VN')}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground">Hoa hồng đã nhận</p>
            </div>
            <div
              onClick={() => toggleTab('transactions')}
              className={`flex-1 text-center p-3 rounded-xl cursor-pointer transition-all ${
                activeTab === 'transactions'
                  ? 'ring-2 ring-purple-500 bg-purple-50'
                  : 'hover:shadow-md'
              }`}
              style={{ background: activeTab === 'transactions' ? '' : '#f0f0ff' }}
            >
              <p
                className="font-heading text-2xl font-bold"
                style={{ color: '#6c5ce7' }}
              >
                {commissionCount}
              </p>
              <p className="text-[10px] font-bold text-muted-foreground">Giao dịch hoa hồng</p>
            </div>
          </div>

          {/* Detail Views */}
          {activeTab === 'referred' && (
            <div className="px-5 pb-2">
              <ReferredUsersList users={referralData?.referredUsers || []} />
            </div>
          )}

          {activeTab === 'commission' && (
            <div className="px-5 pb-2">
              <CommissionSummary
                total={totalCommissionEarned}
                history={referralData?.recentCommissions || []}
              />
            </div>
          )}

          {activeTab === 'transactions' && (
            <div className="px-5 pb-2">
              <TransactionsList transactions={referralData?.recentCommissions || []} />
            </div>
          )}

          {/* Referral link */}
          <div className="px-5 mb-4">
            <p className="text-xs font-bold text-muted-foreground mb-2">Link mời của bạn</p>
            <div className="flex gap-2">
              <div
                className="flex-1 px-3 py-2.5 rounded-lg text-xs font-mono truncate"
                style={{ background: '#f5f0e8', border: '1px solid #e8e0d4', color: '#5c4a3a' }}
              >
                {referralLink}
              </div>
              <button
                onClick={handleCopy}
                className="px-4 py-2.5 rounded-lg font-heading text-xs font-bold text-white flex-shrink-0 active:scale-95 transition-transform"
                style={{
                  background: copied
                    ? '#27ae60'
                    : 'linear-gradient(135deg, #2d8a4e, #4eca6a)',
                }}
              >
                {copied ? '✅' : '📋 Copy'}
              </button>
            </div>
          </div>

          {/* Share buttons */}
          <div className="px-5 mb-4 flex gap-2">
            <button
              onClick={handleShare}
              className="flex-1 py-3 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-transform"
              style={{
                background: 'linear-gradient(135deg, #2d8a4e, #4eca6a)',
                boxShadow: '0 4px 15px rgba(45,138,78,0.3)',
              }}
            >
              📤 Chia sẻ link
            </button>
            <button
              onClick={() => {
                window.open(
                  `https://t.me/share/url?url=${encodeURIComponent(referralLink)}&text=${encodeURIComponent('Tham gia Organic Kingdom cùng mình! 🌱')}`,
                  '_blank'
                );
              }}
              className="py-3 px-5 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-transform"
              style={{ background: 'linear-gradient(135deg, #0088cc, #229ED9)' }}
            >
              ✈️
            </button>
            <button
              onClick={() => {
                window.open(
                  `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(referralLink)}`,
                  '_blank'
                );
              }}
              className="py-3 px-5 rounded-xl font-heading text-sm font-bold text-white active:scale-[0.97] transition-transform"
              style={{ background: 'linear-gradient(135deg, #1877f2, #4a9eff)' }}
            >
              📘
            </button>
          </div>

          {/* Rewards info */}
          <div
            className="mx-5 mb-4 p-3 rounded-xl"
            style={{
              background: 'rgba(240,180,41,0.1)',
              border: '1px solid rgba(240,180,41,0.2)',
            }}
          >
            <p className="text-xs font-bold mb-2" style={{ color: '#d49a1a' }}>
              🎁 Phần thưởng & Hoa hồng
            </p>
            <div className="space-y-1 text-[11px] font-semibold text-muted-foreground">
              <div className="flex items-center gap-2">
                <span>👤 Bạn nhận khi bạn bè đăng ký:</span>
                <span className="font-bold" style={{ color: '#d49a1a' }}>
                  {BONUS_PER_FRIEND} OGN
                </span>
              </div>
              <div className="flex items-center gap-2">
                <span>💰 Hoa hồng khi bạn bè mua item:</span>
                <span className="font-bold" style={{ color: '#d49a1a' }}>
                  5%
                </span>
              </div>
            </div>
          </div>

          {/* Referred Users List - Real data */}
          <div className="px-5 pb-8">
            <p className="text-xs font-bold text-muted-foreground mb-3">Người được giới thiệu</p>
            {isLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-2xl mb-2 animate-bounce">🔄</div>
                <p className="text-xs font-semibold">Đang tải...</p>
              </div>
            ) : referralData?.referredUsers && referralData.referredUsers.length > 0 ? (
              <ReferredUsersList users={referralData.referredUsers} />
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <div className="text-3xl mb-2">🌱</div>
                <p className="text-xs font-semibold">Chưa có ai tham gia</p>
                <p className="text-[10px] mt-1">Chia sẻ link để mời bạn bè!</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
