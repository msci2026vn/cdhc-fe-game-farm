import { useEffect, useState } from 'react';
import { usePlayerProfile } from '@/shared/hooks/usePlayerProfile';

const DEMO_PRAYERS = [
    "Cầu cho mưa thuận gió hòa",
    "Cầu cho gia đình bình an",
    "Bình an cho tất cả mọi người",
    "Ước gì cây luôn xanh tốt",
    "Mong sức khỏe cho cha mẹ",
    "Chúc mọi người một ngày tốt lành!",
    "Cầu nguyện thế giới hòa bình",
    "Tâm thanh tịnh, cõi lòng an vui",
    "Cầu cho mùa màng bội thu",
    "Mong mưa đến tưới mát ruộng đồng",
    "Cầu cho đàn bò mau lớn",
    "Mong hạt giống nảy mầm tươi tốt",
    "Cầu cho khu vườn không bị sâu bệnh",
    "Ước gì ngày mai trời nắng đẹp",
    "Chúc mọi người nhiều niềm vui",
    "Cầu cho ông bà mạnh khỏe",
    "Mong anh chị em hòa thuận",
    "Cầu cho vụ mùa tới trúng lớn",
    "Mong mọi người không còn buồn đau",
    "Cầu cho trái đất thêm xanh mướt",
    "Chúc mọi hạt giống đều nảy mầm",
    "Mong dịch bệnh không còn",
    "Cầu xin mẹ thiên nhiên che chở",
    "Cầu cho bão lũ mau tan",
    "Cầu cho không khí trong lành",
    "Mong muôn loài sống hòa bình",
    "Cầu cho bản thân luôn kiên cường",
    "Trân trọng những gì đang có",
    "Cầu mong một đêm ngon giấc",
    "Mong ngày mai sẽ tốt đẹp hơn"
];

interface FloatingPrayerData {
    id: string;
    text: string;
    avatarUrl: string;
    left: number; // percentage
    animationDuration: number; // 8 to 15s
    isLeftFacing: boolean; // Randomly flip the UI
}

export function FloatingPrayers({ flyText }: { flyText: string | null }) {
    const { data: profile } = usePlayerProfile();
    const [activePrayers, setActivePrayers] = useState<FloatingPrayerData[]>([]);

    // Add a specific prayer to the floating list
    const addPrayer = (text: string, avatarUrl: string) => {
        const id = Date.now() + Math.random().toString();
        const minX = 5;
        const maxX = 65; // Max left % to prevent overflow on right
        const left = minX + Math.random() * (maxX - minX);
        const animationDuration = 7 + Math.random() * 5; // 7s to 12s
        const isLeftFacing = Math.random() > 0.5;

        const newPrayer: FloatingPrayerData = {
            id, text, avatarUrl, left, animationDuration, isLeftFacing
        };

        setActivePrayers(prev => [...prev, newPrayer]);

        // Cleanup after animation
        setTimeout(() => {
            setActivePrayers(prev => prev.filter(p => p.id !== id));
        }, animationDuration * 1000);
    };

    // Periodically add demo prayers
    useEffect(() => {
        let timeoutId: NodeJS.Timeout;

        const spawnDemoPrayer = () => {
            // Don't spawn if there are already too many active
            if (activePrayers.length <= 4) {
                const text = DEMO_PRAYERS[Math.floor(Math.random() * DEMO_PRAYERS.length)];
                // Get a random avatar from pravatar
                const avatarUrl = `https://i.pravatar.cc/150?u=${Math.random()}`;
                addPrayer(text, avatarUrl);
            }

            // Schedule next spawn with slight random delay to feel natural
            timeoutId = setTimeout(spawnDemoPrayer, 3000 + Math.random() * 4000);
        };

        // Initial spawn slightly delayed
        timeoutId = setTimeout(spawnDemoPrayer, 1000);

        return () => clearTimeout(timeoutId);
    }, [activePrayers.length]); // Re-evaluate when length changes to avoid stale state issues

    // Listen for user submitted prayer
    useEffect(() => {
        if (flyText) {
            // Use player's avatar if available, else a generated one
            const avatarUrl = profile?.avatarUrl || profile?.gmailAvatar || `https://i.pravatar.cc/150?u=${profile?.id || Math.random()}`;
            addPrayer(flyText, avatarUrl);
        }
    }, [flyText, profile]);

    return (
        <div className="absolute inset-x-0 bottom-40 top-20 z-0 pointer-events-none overflow-hidden">
            {activePrayers.map((prayer) => (
                <div
                    key={prayer.id}
                    className={`absolute bottom-[-100px] flex items-center gap-2 opacity-0 transition-opacity ${prayer.isLeftFacing ? '' : 'flex-row-reverse'}`}
                    style={{
                        left: `${prayer.left}%`,
                        animation: `floatUp ${prayer.animationDuration}s linear forwards`,
                    }}
                >
                    <div className={`w-8 h-8 rounded-full border-2 border-white shadow-md overflow-hidden shrink-0 ${prayer.isLeftFacing ? 'bg-orange-200' : 'bg-blue-200'}`}>
                        <img alt="Avatar" className="w-full h-full object-cover" src={prayer.avatarUrl} />
                    </div>
                    <div className={`bg-white/80 backdrop-blur-sm px-3 py-1.5 shadow-sm border ${prayer.isLeftFacing ? 'rounded-r-xl rounded-bl-xl border-yellow-200' : 'rounded-l-xl rounded-br-xl border-green-200'} max-w-[150px]`}>
                        <p className="text-[10px] text-farm-brown-dark font-medium leading-tight">"{prayer.text}"</p>
                    </div>
                </div>
            ))}
        </div>
    );
}
