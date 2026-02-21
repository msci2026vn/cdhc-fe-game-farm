import { useState, useCallback, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Carousel, CarouselContent, CarouselItem } from '@/components/ui/carousel';
import BottomNav from '@/shared/components/BottomNav';
import Toast from '@/shared/components/Toast';
import PointsFlyUp from '@/shared/components/PointsFlyUp';
import { usePrayerStatus } from '../hooks/usePrayerStatus';
import { usePrayerPresets } from '../hooks/usePrayerPresets';
import { usePrayerOffer } from '../hooks/usePrayerOffer';
import { PrayerCounter } from '../components/PrayerCounter';
import { PrayerCard } from '../components/PrayerCard';
import { PrayerReward } from '../components/PrayerReward';
import { PrayerLeaderboard } from '../components/PrayerLeaderboard';
import { PrayerHistoryModal } from '../components/PrayerHistoryModal';
import { PrayerSparkles } from '../components/PrayerSparkles';
import { PrayerTextFly } from '../components/PrayerTextFly';
import { PrayerPresetModal } from '../components/PrayerPresetModal';
import { PrayerCustomModal } from '../components/PrayerCustomModal';
import { PrayerLeaderboardModal } from '../components/PrayerLeaderboardModal';
import { FloatingPrayers } from '../components/FloatingPrayers';
import type { PrayerOfferResponse } from '../types/prayer.types';
import { playSound, audioManager } from '@/shared/audio';

const CATEGORIES = [
  { key: 'all', label: 'Tất cả', emoji: '🙏' },
  { key: 'peace', label: 'Hòa bình', emoji: '🕊️' },
  { key: 'nature', label: 'Thiên nhiên', emoji: '🌿' },
  { key: 'harvest', label: 'Mùa màng', emoji: '🌾' },
  { key: 'health', label: 'Sức khỏe', emoji: '❤️' },
  { key: 'family', label: 'Gia đình', emoji: '👨‍👩‍👧‍👦' },
  { key: 'community', label: 'Cộng đồng', emoji: '🤝' },
  { key: 'earth', label: 'Trái đất', emoji: '🌍' },
  { key: 'spiritual', label: 'Tâm linh', emoji: '🧘' },
] as const;

export default function PrayerScreen() {
  const navigate = useNavigate();
  const [selectedPresetId, setSelectedPresetId] = useState<string | null>(null);
  const [customText, setCustomText] = useState('');
  const [rewardData, setRewardData] = useState<PrayerOfferResponse | null>(null);
  const [bottomTab, setBottomTab] = useState<'pray' | 'history'>('pray');
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [showCustomModal, setShowCustomModal] = useState(false);
  const [showLeaderboardModal, setShowLeaderboardModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showSparkles, setShowSparkles] = useState(false);
  const [flyText, setFlyText] = useState<string | null>(null);

  // Preload prayer sounds + start BGM
  useEffect(() => {
    audioManager.preloadScene('prayer');
    audioManager.startBgm('prayer');
    return () => { audioManager.stopBgm(); };
  }, []);

  const { data: status, refetch: refetchStatus } = usePrayerStatus();
  const { data: presets } = usePrayerPresets();
  const offerMutation = usePrayerOffer();

  const handleSelectPreset = useCallback((presetId: string, text: string) => {
    setSelectedPresetId(presetId);
    setCustomText('');

    offerMutation.mutate(
      { type: 'preset', presetId },
      {
        onSuccess: (data) => {
          playSound('prayer_submit');
          setRewardData(data);
          setShowSparkles(true);
          setFlyText(text);
          setShowPresetModal(false);
          refetchStatus();
          if (data.ognReward > 0 || data.xpReward > 0) {
            setTimeout(() => playSound('prayer_reward'), 600);
          }
        },
      }
    );
  }, [offerMutation, refetchStatus]);

  const handleCustomSubmit = useCallback((text: string) => {
    offerMutation.mutate(
      { type: 'custom', text },
      {
        onSuccess: (data) => {
          playSound('prayer_submit');
          setRewardData(data);
          setShowSparkles(true);
          setFlyText(text);
          setShowCustomModal(false);
          refetchStatus();
          if (data.ognReward > 0 || data.xpReward > 0) {
            setTimeout(() => playSound('prayer_reward'), 600);
          }
        },
      },
    );
  }, [offerMutation, refetchStatus]);

  const handleQuickPray = useCallback(() => {
    if (presets && presets.length > 0) {
      const randomPreset = presets[Math.floor(Math.random() * presets.length)];
      offerMutation.mutate(
        { type: 'preset', presetId: randomPreset.id },
        {
          onSuccess: (data) => {
            playSound('prayer_submit');
            setRewardData(data);
            setShowSparkles(true);
            setFlyText(randomPreset.text);
            refetchStatus();
            if (data.ognReward > 0 || data.xpReward > 0) {
              setTimeout(() => playSound('prayer_reward'), 600);
            }
          },
        }
      );
    }
  }, [presets, offerMutation, refetchStatus]);



  return (
    <div className="h-[100dvh] max-w-[430px] mx-auto relative bg-nature-vibe shadow-2xl flex flex-col overflow-hidden">
      {/* Background elements */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-100px] left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-yellow-200/20 rounded-full blur-[60px] animate-pulse"></div>
        <div className="absolute top-20 left-10 w-4 h-4 bg-white/40 rounded-full animate-ping" style={{ animationDuration: '3s' }}></div>
        <div className="absolute top-40 right-10 w-6 h-6 bg-white/30 rounded-full animate-ping" style={{ animationDuration: '4s' }}></div>
        <div className="absolute -top-4 left-4 text-green-700/60 text-6xl rotate-180 z-0 opacity-40">
          <span className="material-symbols-outlined">psychiatry</span>
        </div>
        <div className="absolute -top-6 right-8 text-green-700/60 text-7xl rotate-180 z-0 opacity-40">
          <span className="material-symbols-outlined">psychiatry</span>
        </div>
        <FloatingPrayers flyText={flyText} />
      </div>

      {/* Header */}
      <div className="relative z-30 px-4 pt-6 pb-2 flex justify-between items-center safe-top">
        <button
          onClick={() => navigate('/farm')}
          className="w-10 h-10 bg-farm-brown rounded-full border-2 border-[#5d4037] flex items-center justify-center text-white shadow-md active:scale-95 transition-transform"
        >
          <span className="material-symbols-outlined">arrow_back</span>
        </button>
        <div className="wood-panel px-6 py-1.5 rounded-full flex items-center gap-2 bg-[#8c6239]">
          <span className="material-symbols-outlined text-yellow-300">spa</span>
          <span className="text-white font-display font-bold uppercase tracking-wide text-sm drop-shadow-md">Đền Thờ Mẹ Thiên Nhiên</span>
          <span className="material-symbols-outlined text-yellow-300">spa</span>
        </div>
        <button className="w-10 h-10 bg-farm-brown rounded-full border-2 border-[#5d4037] flex items-center justify-center text-white shadow-md active:scale-95 transition-transform flex-shrink-0">
          <span className="material-symbols-outlined">help</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="relative z-20 px-4 mt-2 mb-4">
        <div className="bg-[#f4e4bc] p-1 rounded-xl border-2 border-[#8c6239] shadow-md flex justify-between">
          {([
            { key: 'pray', label: 'Cầu Nguyện' },
            { key: 'leaderboard', label: 'BXH' },
            { key: 'history', label: 'Lịch Sử' },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => {
                if (tab.key === 'leaderboard') {
                  setShowLeaderboardModal(true);
                } else if (tab.key === 'history') {
                  setShowHistoryModal(true);
                } else {
                  setBottomTab('pray');
                }
              }}
              className={`flex-1 py-2 rounded-lg text-xs font-bold uppercase transition-all
                ${(bottomTab as string) === tab.key && tab.key === 'pray'
                  ? 'bg-[#2d6a4f] text-white shadow-sm border border-[#1b4332]'
                  : 'text-[#5d4037] hover:bg-[#8c6239]/10'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      <div className="flex-1 relative z-10 flex flex-col items-center justify-start px-4 overflow-y-auto pb-24 no-scrollbar">
        {bottomTab === 'pray' && (
          <>
            {/* Center animated icon */}
            <div className="relative w-full flex flex-col items-center mb-6 mt-4">
              <div className="absolute top-0 left-1/2 -translate-x-1/2 w-64 h-64 border-4 border-yellow-200/30 rounded-full halo-spin -z-10"></div>
              <div className="absolute top-4 left-1/2 -translate-x-1/2 w-56 h-56 border-2 border-yellow-400/20 rounded-full halo-spin -z-10" style={{ animationDirection: 'reverse' }}></div>

              <div className="relative w-48 h-64 float-gentle z-10">
                <div className="w-full h-full relative">
                  <div className="absolute inset-0 bg-yellow-100 rounded-full blur-3xl opacity-60"></div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="material-symbols-outlined text-[180px] text-green-600 drop-shadow-lg" style={{ fontVariationSettings: "'FILL' 1, 'wght' 300" }}>
                      female
                    </span>
                    <span className="absolute top-10 material-symbols-outlined text-[120px] text-green-500 drop-shadow-md opacity-80" style={{ fontVariationSettings: "'FILL' 1" }}>
                      psychology_alt
                    </span>
                    <div className="absolute top-2 w-24 h-12 border-t-4 border-yellow-400 rounded-full"></div>
                  </div>
                  <div className="absolute top-10 right-0 w-3 h-3 bg-yellow-400 rounded-full animate-ping"></div>
                  <div className="absolute bottom-20 left-0 w-2 h-2 bg-yellow-300 rounded-full animate-ping" style={{ animationDelay: '1s' }}></div>
                </div>
              </div>
              <div className="w-40 h-12 bg-[#8c6239] rounded-[50%] border-4 border-[#5d4037] relative -mt-6 z-0 shadow-lg">
                <div className="absolute inset-x-4 top-2 h-4 bg-[#a17a5b] rounded-[50%] opacity-50"></div>
              </div>
            </div>

            {/* Stats cards (streak, sent) */}
            <div className="w-full max-w-xs flex justify-between gap-3 mb-6">
              <div className="flex-1 bg-white/80 backdrop-blur border-2 border-[#e9c46a] rounded-xl p-2 flex flex-col items-center shadow-sm">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-orange-500">local_fire_department</span>
                  <span className="text-lg font-display font-bold text-[#5d4037]">{status?.currentStreak || 0}</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-gray-500">Chuỗi ngày</span>
              </div>
              <div className="flex-1 bg-white/80 backdrop-blur border-2 border-[#52b788] rounded-xl p-2 flex flex-col items-center shadow-sm">
                <div className="flex items-center gap-1">
                  <span className="material-symbols-outlined text-green-600">public</span>
                  <span className="text-lg font-display font-bold text-[#5d4037]">{status?.totalPrayers || 0}</span>
                </div>
                <span className="text-[10px] uppercase font-bold text-gray-500">Đã gửi</span>
              </div>
            </div>

            {/* Daily limit info */}
            {status && (
              <div className="text-center text-xs text-[#5d4037] mb-2 font-bold drop-shadow-sm">
                `Còn ${Math.max(0, status.freeMax - status.freeUsed)} lượt ngẫu nhiên hôm nay`
              </div>
            )}

            {/* Action buttons (Gửi nhanh, Chọn lời chúc, Viết lời chúc) */}
            <div className="w-full max-w-xs flex flex-col gap-3 mb-6">
              <button
                onClick={handleQuickPray}
                disabled={!status?.canPray || offerMutation.isPending || (status?.freeUsed ?? 0) >= (status?.freeMax ?? 5)}
                className="group relative w-full btn-spirit h-16 rounded-2xl flex items-center justify-center gap-3 overflow-hidden shimmer transition-transform active:scale-95 disabled:opacity-50 disabled:active:scale-100"
              >
                <div className="absolute inset-0 bg-gradient-to-t from-black/10 to-transparent"></div>
                <span className="material-symbols-outlined text-3xl text-red-600 drop-shadow-sm group-hover:scale-110 transition-transform">favorite</span>
                <span className="text-xl font-display font-bold text-[#78350f] uppercase tracking-wider drop-shadow-sm">
                  {offerMutation.isPending ? 'Đang gửi...' : 'Gửi Nhanh'}
                </span>
                <div className="absolute right-2 top-2 bg-red-500 text-white text-[9px] px-2 py-0.5 rounded-full font-bold shadow-sm animate-bounce">Miễn phí</div>
              </button>

              <div className="flex gap-3 w-full">
                <button
                  onClick={() => setShowPresetModal(true)}
                  className={`flex-1 btn-wood-rustic h-12 rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform`}
                >
                  <span className="material-symbols-outlined text-xl">auto_awesome</span>
                  <span className="text-xs font-bold uppercase tracking-wide">Chọn Lời Chúc</span>
                </button>
                <button
                  onClick={() => setShowCustomModal(true)}
                  className={`flex-1 btn-wood-rustic h-12 rounded-xl flex items-center justify-center gap-2 transition-transform active:scale-95`}
                >
                  <span className="material-symbols-outlined text-xl">edit_note</span>
                  <span className="text-xs font-bold uppercase tracking-wide">Viết Lời Chúc</span>
                </button>
              </div>
            </div>

            {/* Message from Mother Nature */}
            <div className="w-full bg-[#fdf6e3] border-2 border-[#8c6239] rounded-xl p-4 relative shadow-[4px_4px_0_#5d4037] mb-8 shrink-0">
              <div className="absolute top-2 left-2 w-2 h-2 rounded-full bg-[#5d4037] opacity-60"></div>
              <div className="absolute top-2 right-2 w-2 h-2 rounded-full bg-[#5d4037] opacity-60"></div>
              <div className="absolute bottom-2 left-2 w-2 h-2 rounded-full bg-[#5d4037] opacity-60"></div>
              <div className="absolute bottom-2 right-2 w-2 h-2 rounded-full bg-[#5d4037] opacity-60"></div>
              <div className="flex items-start gap-3">
                <div className="min-w-[40px] h-10 bg-green-100 rounded-full flex items-center justify-center border border-green-300">
                  <span className="material-symbols-outlined text-green-600">format_quote</span>
                </div>
                <div>
                  <h3 className="text-sm font-bold text-[#5d4037] mb-1">Lời nhắn từ Mẹ Thiên Nhiên</h3>
                  <p className="text-xs text-farm-brown italic leading-relaxed">"Hãy gieo một hạt giống yêu thương hôm nay, ngày mai con sẽ gặt hái cả khu rừng hạnh phúc."</p>
                </div>
              </div>
            </div>
          </>
        )}

      </div>

      {/* Decorative Bottom Bar instead of BottomNav */}
      <div className="absolute bottom-0 w-full h-16 bg-[url('https://www.transparenttextures.com/patterns/wood-pattern.png')] bg-[#5d4037] border-t-4 border-[#3e2723] z-40 rounded-t-[2rem] shadow-[0_-5px_15px_rgba(0,0,0,0.3)] flex justify-center items-center">
        <div className="text-[#8c6239] opacity-30 text-4xl flex gap-8">
          <span className="material-symbols-outlined">eco</span>
          <span className="material-symbols-outlined">eco</span>
          <span className="material-symbols-outlined">eco</span>
          <span className="material-symbols-outlined">eco</span>
          <span className="material-symbols-outlined">eco</span>
        </div>
      </div>

      <Toast />
      <PointsFlyUp />
      <PrayerSparkles active={showSparkles} onDone={() => setShowSparkles(false)} />
      <PrayerTextFly text={flyText} onDone={() => setFlyText(null)} />

      {rewardData && (
        <PrayerReward
          ognReward={rewardData.ognReward}
          xpReward={rewardData.xpReward}
          multiplier={rewardData.multiplier}
          milestone={rewardData.milestone}
          onDone={() => setRewardData(null)}
        />
      )}

      <PrayerPresetModal
        isOpen={showPresetModal}
        onClose={() => setShowPresetModal(false)}
        onSelect={handleSelectPreset}
        isPending={offerMutation.isPending}
      />

      <PrayerCustomModal
        isOpen={showCustomModal}
        onClose={() => setShowCustomModal(false)}
        onSubmit={handleCustomSubmit}
        isPending={offerMutation.isPending}
        limitUsed={status?.customUsed ?? 0}
        limitMax={status?.customMax ?? 3}
      />

      <PrayerLeaderboardModal
        isOpen={showLeaderboardModal}
        onClose={() => setShowLeaderboardModal(false)}
      />

      <PrayerHistoryModal
        isOpen={showHistoryModal}
        onClose={() => setShowHistoryModal(false)}
        onWriteNew={() => setShowCustomModal(true)}
      />
    </div>
  );
}
