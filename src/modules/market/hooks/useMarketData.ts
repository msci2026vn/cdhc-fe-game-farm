import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { API_BASE_URL } from '@/shared/utils/constants';
import { MarketData, PredictResult, RatioData, HistoryStats, PredictionRow, LeaderboardEntry } from '../types/market.types';

export function useMarketData() {
    const navigate = useNavigate();
    const [data, setData] = useState<MarketData | null>(null);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const [predicting, setPredicting] = useState(false);
    const [predictResult, setPredictResult] = useState<PredictResult | null>(null);
    const [streak, setStreak] = useState(0);

    const [ratio, setRatio] = useState<RatioData | null>(null);
    const [history, setHistory] = useState<{ predictions: PredictionRow[]; stats: HistoryStats } | null>(null);
    const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);

    useEffect(() => {
        fetchMarketData();
        checkExistingPrediction();
        fetchRatio();
        fetchLeaderboard();
    }, []);

    async function fetchMarketData() {
        try {
            setLoading(true);
            setError(null);
            const res = await fetch(`${API_BASE_URL}/api/market/latest`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) throw new Error(`HTTP ${res.status}`);
            const json = await res.json();
            if (json.success && json.data) setData(json.data);
            else setError('Không có dữ liệu thị trường');
        } catch (err) {
            console.error('[Market] fetchMarketData error:', err);
            setError('Không thể kết nối server');
        } finally {
            setLoading(false);
        }
    }

    async function checkExistingPrediction() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/market/predictions?status=pending&limit=1`, {
                method: 'GET',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) return;
            const json = await res.json();
            if (!json.success) return;

            const { predictions = [], currentStreak = 0 } = json.data || {};
            setStreak(currentStreak);

            if (predictions.length > 0) {
                const pred = predictions[0];
                setPredictResult({
                    success: true,
                    direction: pred.direction,
                    alreadyPredicted: true,
                    message: pred.direction === 'up'
                        ? '🔺 Đã dự đoán TĂNG! Chờ kết quả lúc 18:00.'
                        : '🔻 Đã dự đoán GIẢM! Chờ kết quả lúc 18:00.',
                });
            }
        } catch {
            // Ignore
        }
    }

    async function fetchRatio() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/market/ratio`);
            if (!res.ok) return;
            const json = await res.json();
            if (json.success && json.data) setRatio(json.data);
        } catch { /* ignore */ }
    }

    async function fetchHistory() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/market/predictions/history`, {
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
            });
            if (!res.ok) return;
            const json = await res.json();
            if (json.success && json.data) setHistory(json.data);
        } catch { /* ignore */ }
    }

    async function fetchLeaderboard() {
        try {
            const res = await fetch(`${API_BASE_URL}/api/market/leaderboard`);
            if (!res.ok) return;
            const json = await res.json();
            if (json.success && json.data?.leaderboard) setLeaderboard(json.data.leaderboard);
        } catch { /* ignore */ }
    }

    async function handlePredict(direction: 'up' | 'down') {
        if (predicting || predictResult?.success || predictResult?.alreadyPredicted) return;
        try {
            setPredicting(true);
            setPredictResult(null);
            const res = await fetch(`${API_BASE_URL}/api/market/predict`, {
                method: 'POST',
                credentials: 'include',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ direction }),
            });
            const json = await res.json();
            if (res.status === 401) { navigate('/login'); return; }
            if (res.ok && json.success) {
                setPredictResult({
                    success: true,
                    direction,
                    alreadyPredicted: true,
                    message: direction === 'up'
                        ? '🔺 Đã dự đoán TĂNG! Kết quả công bố lúc 18:00.'
                        : '🔻 Đã dự đoán GIẢM! Kết quả công bố lúc 18:00.',
                });
                fetchRatio();
            } else {
                const code = json?.error?.code || '';
                const msg = json?.error?.message || 'Không thể dự đoán';
                if (code === 'ALREADY_PREDICTED' || msg.toLowerCase().includes('already') || msg.toLowerCase().includes('đã dự đoán')) {
                    setPredictResult({ success: false, alreadyPredicted: true, message: '📅 Bạn đã dự đoán hôm nay rồi. Quay lại ngày mai!' });
                } else if (code === 'NOT_TRADING_DAY') {
                    setPredictResult({ success: false, message: '🚫 Hôm nay không phải ngày giao dịch.' });
                } else {
                    setPredictResult({ success: false, message: msg });
                }
            }
        } catch (err) {
            console.error('[Market] handlePredict error:', err);
            setPredictResult({ success: false, message: 'Lỗi kết nối, thử lại nhé!' });
        } finally {
            setPredicting(false);
        }
    }

    return {
        data, loading, error, fetchMarketData,
        predicting, predictResult, streak, handlePredict,
        ratio, history, fetchHistory, leaderboard
    };
}
