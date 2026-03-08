import { useState, useEffect, useCallback } from 'react';
import { nftApi, type NftCard } from '@/shared/api/api-nft';
import { Trans, useTranslation } from 'react-i18next';

interface NftCardRevealProps {
  eventId: string;
  onClose: () => void;
}

const RARITY_MAP: Record<string, { glow: string; label: string; gradient: string }> = {
  normal: { glow: 'rgba(158,158,158,0.6)', label: 'Common', gradient: 'from-gray-400 to-gray-500' },
  hard: { glow: 'rgba(255,143,0,0.6)', label: 'Rare', gradient: 'from-amber-500 to-yellow-400' },
  extreme: { glow: 'rgba(123,31,162,0.6)', label: 'Epic', gradient: 'from-purple-600 to-purple-400' },
  catastrophic: { glow: 'rgba(211,47,47,0.6)', label: 'Legendary', gradient: 'from-red-600 to-orange-500' },
};

function getCardType(type: string | undefined, t: any) {
  const configs: Record<string, { icon: string; label: string }> = {
    last_hit: { icon: '⚔️', label: t('world_boss.nft_reveal.achievement_lasthit') },
    top_damage: { icon: '💥', label: t('world_boss.nft_reveal.achievement_topdamage') },
    dual_champion: { icon: '👑', label: 'Dual Champion' },
  };
  return configs[type || 'last_hit'] || configs['last_hit'];
}

function getTeaser(pct: number, difficulty: string | undefined, t: any) {
  const rarity = RARITY_MAP[difficulty || 'hard']?.label || 'Rare';
  const keys = [
    { max: 15, key: 'step_1' },
    { max: 30, key: 'step_2' },
    { max: 45, key: 'step_3' },
    { max: 55, key: 'step_4' },
    { max: 65, key: 'step_5' },
    { max: 75, key: 'step_6' },
    { max: 85, key: 'step_7' },
    { max: 95, key: 'step_8' },
    { max: 100, key: 'step_9' },
  ];
  const item = keys.find(k => pct <= k.max) || keys[0];
  return t(`world_boss.nft_reveal.${item.key}`, { rarity });
}

export function NftCardReveal({ eventId, onClose }: NftCardRevealProps) {
  const { t } = useTranslation();
  const [progress, setProgress] = useState(0);
  const [mintStatus, setMintStatus] = useState<string>('pending');
  const [cardData, setCardData] = useState<NftCard | null>(null);
  const [revealed, setRevealed] = useState(false);
  const [imageLoaded, setImageLoaded] = useState(false);

  // Polling API
  useEffect(() => {
    if (mintStatus === 'minted' || mintStatus === 'failed') return;

    let cancelled = false;
    const poll = async () => {
      try {
        const card = await nftApi.getCard(eventId);
        if (cancelled || !card) return;
        setMintStatus(card.nftMintStatus);
        if (card.nftMintStatus === 'minted' && card.nftCardImageUrl) {
          setCardData(card);
        }
      } catch { /* ignore polling errors */ }
    };

    poll(); // initial
    const interval = setInterval(poll, 5000);
    return () => { cancelled = true; clearInterval(interval); };
  }, [eventId, mintStatus]);

  // Fake progress
  useEffect(() => {
    if (mintStatus === 'minted') {
      setProgress(100);
      return;
    }
    if (mintStatus === 'failed') return;

    const interval = setInterval(() => {
      setProgress(prev => {
        if (mintStatus === 'minting') return Math.max(prev, 70 + Math.random() * 5);
        if (prev < 30) return prev + 2 + Math.random() * 3;
        if (prev < 50) return prev + 1 + Math.random() * 2;
        if (prev < 65) return prev + 0.5 + Math.random();
        return prev + 0.1;
      });
    }, 500);
    return () => clearInterval(interval);
  }, [mintStatus]);

  // Trigger reveal when progress hits 100 and image loaded
  useEffect(() => {
    if (progress >= 100 && cardData && imageLoaded && !revealed) {
      const timer = setTimeout(() => setRevealed(true), 800);
      return () => clearTimeout(timer);
    }
  }, [progress, cardData, imageLoaded, revealed]);

  // Preload image
  useEffect(() => {
    if (!cardData?.nftCardImageUrl) return;
    const img = new Image();
    img.onload = () => setImageLoaded(true);
    img.onerror = () => setImageLoaded(true); // show anyway
    img.src = cardData.nftCardImageUrl;
  }, [cardData?.nftCardImageUrl]);

  const difficulty = cardData?.bossDifficulty || 'hard';
  const rarity = RARITY_MAP[difficulty] || RARITY_MAP.hard;
  const cardType = getCardType(cardData?.nftCardType, t);
  const pct = Math.min(Math.round(progress), 100);

  if (mintStatus === 'failed') {
    return (
      <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center px-6">
        <div className="text-5xl mb-4">😔</div>
        <p className="text-white text-lg font-semibold mb-2">{t('world_boss.nft_reveal.error_title')}</p>
        <p className="text-gray-400 text-sm text-center mb-6">{t('world_boss.nft_reveal.error_desc')}</p>
        <button onClick={onClose} className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm">
          {t('world_boss.rewards.close', 'Đóng')}
        </button>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] bg-black/95 flex flex-col items-center justify-center px-6">
      {!revealed ? (
        /* ═══ LOADING SCREEN ═══ */
        <div className="w-full max-w-sm flex flex-col items-center gap-6">
          <div className="text-5xl nft-card-icon-pulse">🎴</div>
          <p className="text-white text-lg font-semibold">{t('world_boss.nft_reveal.generating')}</p>

          {/* Progress bar */}
          <div className="w-full h-2 bg-white/10 rounded-full overflow-hidden">
            <div
              className={`h-full rounded-full transition-all duration-500 bg-gradient-to-r ${rarity.gradient}`}
              style={{ width: `${pct}%` }}
            />
          </div>
          <span className="text-gray-400 text-sm">{pct}%</span>

          {/* Teaser */}
          <p className="text-gray-300 text-sm text-center italic min-h-[40px]">
            "{getTeaser(pct, difficulty, t)}"
          </p>

          <button onClick={onClose} className="mt-4 text-gray-500 text-xs hover:text-gray-400">
            {t('world_boss.nft_reveal.skip')}
          </button>
        </div>
      ) : (
        /* ═══ REVEAL SCREEN ═══ */
        <div className="flex flex-col items-center gap-5 nft-reveal-fade-in">
          {/* Card */}
          <div
            className="nft-card-glow relative rounded-2xl overflow-hidden"
            style={{
              width: 260,
              height: 380,
              boxShadow: `0 0 30px ${rarity.glow}, 0 0 60px ${rarity.glow.replace('0.6', '0.3')}`,
            }}
          >
            {cardData?.nftCardImageUrl ? (
              <img
                src={cardData.nftCardImageUrl}
                alt="NFT Card"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full bg-gray-800 flex items-center justify-center text-6xl">🎴</div>
            )}

            {/* Card type badge */}
            <div className="absolute top-3 left-3 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5 flex items-center gap-1.5">
              <span>{cardType.icon}</span>
              <span className="text-white text-xs font-bold">{cardType.label}</span>
            </div>

            {/* Rarity badge */}
            <div className="absolute top-3 right-3 bg-black/70 backdrop-blur-sm rounded-lg px-3 py-1.5">
              <span className={`text-xs font-bold bg-gradient-to-r ${rarity.gradient} bg-clip-text text-transparent`}>
                {rarity.label}
              </span>
            </div>
          </div>

          {/* Info */}
          <div className="text-center space-y-2">
            {cardData?.bossName && (
              <p className="text-white font-bold text-lg">{cardData.bossName}</p>
            )}
            <div className="flex items-center justify-center gap-4 text-sm">
              {cardData?.damage != null && (
                <span className="text-yellow-400">
                  💥 {cardData.damage.toLocaleString()} damage
                </span>
              )}
              {cardData?.rank != null && (
                <span className="text-blue-400">
                  <Trans i18nKey="world_boss.nft_reveal.rank" values={{ rank: cardData.rank }}>
                    🏆 Hạng #{cardData.rank}
                  </Trans>
                </span>
              )}
            </div>
          </div>

          {/* Blockchain link */}
          {cardData?.nftTxHash && (
            <a
              href={`https://snowscan.xyz/tx/${cardData.nftTxHash}`}
              target="_blank"
              rel="noopener noreferrer"
              className="flex flex-col items-center gap-1 px-5 py-2.5 bg-blue-600/20 border border-blue-500/40 rounded-xl text-blue-400 text-sm font-medium hover:bg-blue-600/30 transition-colors"
            >
              {t('world_boss.nft_reveal.view_blockchain')}
              <span className="text-xs text-blue-500/70">
                {cardData.nftTokenId != null ? `Token #${cardData.nftTokenId} • ` : ''}Avalanche C-Chain
              </span>
            </a>
          )}

          {/* Actions */}
          <div className="flex gap-3 mt-1">
            <button
              onClick={onClose}
              className="px-6 py-3 bg-gray-700 hover:bg-gray-600 text-white rounded-xl text-sm font-medium"
            >
              {t('world_boss.rewards.close', 'Đóng')}
            </button>
          </div>
        </div>
      )}

      <style>{`
        .nft-card-icon-pulse {
          animation: nftIconPulse 2s ease-in-out infinite;
        }
        @keyframes nftIconPulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.15); opacity: 0.8; }
        }
        .nft-card-glow {
          animation: nftGlowPulse 2.5s ease-in-out infinite;
        }
        @keyframes nftGlowPulse {
          0%, 100% { transform: scale(1); }
          50% { transform: scale(1.02); }
        }
        .nft-reveal-fade-in {
          animation: nftRevealIn 0.8s ease-out;
        }
        @keyframes nftRevealIn {
          from { opacity: 0; transform: scale(0.8) rotateY(90deg); }
          to { opacity: 1; transform: scale(1) rotateY(0deg); }
        }
      `}</style>
    </div>
  );
}
