import { useState, useCallback } from 'react';
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
import { PrayerInput } from '../components/PrayerInput';
import { PrayerButton } from '../components/PrayerButton';
import { PrayerReward } from '../components/PrayerReward';
import { PrayerLeaderboard } from '../components/PrayerLeaderboard';
import { PrayerHistory } from '../components/PrayerHistory';
import { PrayerSparkles } from '../components/PrayerSparkles';
import { PrayerTextFly } from '../components/PrayerTextFly';
import type { PrayerOfferResponse } from '../types/prayer.types';

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
  const [activeTab, setActiveTab] = useState<'preset' | 'custom'>('preset');
  const [rewardData, setRewardData] = useState<PrayerOfferResponse | null>(null);
  const [bottomTab, setBottomTab] = useState<'pray' | 'leaderboard' | 'history'>('pray');
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [showSparkles, setShowSparkles] = useState(false);
  const [flyText, setFlyText] = useState<string | null>(null);

  const { data: status, refetch: refetchStatus } = usePrayerStatus();
  const { data: presets } = usePrayerPresets(selectedCategory === 'all' ? undefined : selectedCategory);
  const offerMutation = usePrayerOffer();

  const handlePray = useCallback(() => {
    if (activeTab === 'preset' && selectedPresetId) {
      const currentText = presets?.find(p => p.id === selectedPresetId)?.text || '';
      offerMutation.mutate(
        { type: 'preset', presetId: selectedPresetId },
        {
          onSuccess: (data) => {
            setRewardData(data);
            setShowSparkles(true);
            setFlyText(currentText);
            setSelectedPresetId(null);
            refetchStatus();
          },
        },
      );
    } else if (activeTab === 'custom' && customText.length >= 10) {
      const currentText = customText;
      offerMutation.mutate(
        { type: 'custom', text: customText },
        {
          onSuccess: (data) => {
            setRewardData(data);
            setShowSparkles(true);
            setFlyText(currentText);
            setCustomText('');
            refetchStatus();
          },
        },
      );
    }
  }, [activeTab, selectedPresetId, customText, presets, offerMutation, refetchStatus]);

  const canSubmit = activeTab === 'preset'
    ? !!selectedPresetId && (status?.freeUsed ?? 0) < (status?.freeMax ?? 5)
    : customText.length >= 10 && (status?.customUsed ?? 0) < (status?.customMax ?? 3);

  return (
    <div className="h-[100dvh] max-w-[430px] mx-auto relative prayer-gradient flex flex-col overflow-hidden">
      {/* Header */}
      <div className="safe-top sticky top-0 z-20 px-4 pt-3 pb-2">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <button
              onClick={() => navigate('/farm')}
              className="w-8 h-8 rounded-full bg-white/10 flex items-center justify-center active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined text-white text-lg">arrow_back</span>
            </button>
            <h1 className="font-heading text-xl text-white font-bold">🙏 Cầu Nguyện</h1>
          </div>
          {status && (
            <div className="text-xs text-white/60 bg-white/10 px-2 py-1 rounded-full">
              🔥 {status.currentStreak} ngày
            </div>
          )}
        </div>
      </div>

      {/* Scrollable content */}
      <div className="flex-1 overflow-y-auto px-4 pb-28">

        {/* Global counter */}
        <PrayerCounter />

        {/* Section tab switcher */}
        <div className="flex gap-2 mb-4">
          {([
            { key: 'pray', label: '🙏 Cầu nguyện' },
            { key: 'leaderboard', label: '🏆 BXH' },
            { key: 'history', label: '📜 Lịch sử' },
          ] as const).map((tab) => (
            <button
              key={tab.key}
              onClick={() => setBottomTab(tab.key)}
              className={`flex-1 py-2 rounded-xl text-xs font-medium transition-all
                ${bottomTab === tab.key
                  ? 'bg-white/20 text-white'
                  : 'bg-white/5 text-white/50'
                }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* TAB: Cau nguyen */}
        {bottomTab === 'pray' && (
          <>
            {/* Preset / Custom tabs */}
            <div className="flex mb-4 bg-white/10 rounded-xl p-1">
              <button
                onClick={() => setActiveTab('preset')}
                className={`flex-1 py-2 text-sm rounded-lg font-medium transition-all
                  ${activeTab === 'preset'
                    ? 'bg-white/20 text-white'
                    : 'text-white/50'
                  }`}
              >
                Có sẵn ({status?.freeUsed ?? 0}/{status?.freeMax ?? 5})
              </button>
              <button
                onClick={() => setActiveTab('custom')}
                className={`flex-1 py-2 text-sm rounded-lg font-medium transition-all
                  ${activeTab === 'custom'
                    ? 'bg-white/20 text-white'
                    : 'text-white/50'
                  }`}
              >
                Tự viết ({status?.customUsed ?? 0}/{status?.customMax ?? 3})
              </button>
            </div>

            {/* Tab content: Presets */}
            {activeTab === 'preset' && (
              <div className="mb-4">
                {/* Category filter chips */}
                <div className="flex gap-2 overflow-x-auto pb-3 mb-3 no-scrollbar">
                  {CATEGORIES.map(cat => (
                    <button
                      key={cat.key}
                      onClick={() => setSelectedCategory(cat.key)}
                      className={`shrink-0 px-3 py-1.5 rounded-full text-xs font-medium transition-all
                        ${selectedCategory === cat.key
                          ? 'bg-white/20 text-white'
                          : 'bg-white/5 text-white/50'
                        }`}
                    >
                      {cat.emoji} {cat.label}
                    </button>
                  ))}
                </div>

                {/* Carousel or skeleton */}
                {presets && presets.length > 0 ? (
                  <Carousel opts={{ align: 'start', loop: true, dragFree: true }}>
                    <CarouselContent className="-ml-2">
                      {presets.map((preset) => (
                        <CarouselItem key={preset.id} className="pl-2 basis-[85%]">
                          <PrayerCard
                            text={preset.text}
                            category={preset.category}
                            isSelected={selectedPresetId === preset.id}
                            onClick={() => setSelectedPresetId(
                              selectedPresetId === preset.id ? null : preset.id
                            )}
                          />
                        </CarouselItem>
                      ))}
                    </CarouselContent>
                  </Carousel>
                ) : (
                  <div className="flex gap-2 overflow-hidden">
                    {[1, 2].map(i => (
                      <div key={i} className="rounded-2xl p-5 min-h-[140px] basis-[85%] shrink-0 bg-white/10 border border-white/20 animate-pulse">
                        <div className="h-4 bg-white/10 rounded w-3/4 mb-3" />
                        <div className="h-4 bg-white/10 rounded w-full mb-2" />
                        <div className="h-4 bg-white/10 rounded w-1/2" />
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}

            {/* Tab content: Custom text */}
            {activeTab === 'custom' && (
              <div className="mb-4">
                <PrayerInput
                  value={customText}
                  onChange={setCustomText}
                  disabled={offerMutation.isPending}
                />
              </div>
            )}

            {/* Daily limit info */}
            {status && (
              <div className="text-center text-xs text-white/50 mb-3">
                {activeTab === 'preset'
                  ? `Còn ${Math.max(0, status.freeMax - status.freeUsed)} lượt có sẵn hôm nay`
                  : `Còn ${Math.max(0, status.customMax - status.customUsed)} lượt tự viết hôm nay`
                }
              </div>
            )}

            {/* Prayer button */}
            <PrayerButton
              onClick={handlePray}
              disabled={!canSubmit || !status?.canPray}
              loading={offerMutation.isPending}
              cooldownSeconds={status?.cooldownRemaining || 0}
            />
          </>
        )}

        {/* TAB: Leaderboard */}
        {bottomTab === 'leaderboard' && <PrayerLeaderboard />}

        {/* TAB: History */}
        {bottomTab === 'history' && <PrayerHistory />}
      </div>

      {/* Bottom Nav */}
      <BottomNav />

      {/* Toast + FlyUp */}
      <Toast />
      <PointsFlyUp />

      {/* Sparkle effects */}
      <PrayerSparkles active={showSparkles} onDone={() => setShowSparkles(false)} />

      {/* Text fly up */}
      <PrayerTextFly text={flyText} onDone={() => setFlyText(null)} />

      {/* Reward popup */}
      {rewardData && (
        <PrayerReward
          ognReward={rewardData.ognReward}
          xpReward={rewardData.xpReward}
          multiplier={rewardData.multiplier}
          milestone={rewardData.milestone}
          onDone={() => setRewardData(null)}
        />
      )}
    </div>
  );
}
