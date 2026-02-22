import { useNavigate } from 'react-router-dom';
import SensorDashboard from '../components/SensorDashboard';
import BlockchainLog from '../components/BlockchainLog';
import BlockchainBadge from '../components/BlockchainBadge';

export default function RwaScreen() {
  const navigate = useNavigate();

  return (
    <div className="min-h-[100dvh] bg-gradient-to-b from-green-50 via-amber-50/30 to-green-50/50">
      {/* Header */}
      <div className="sticky top-0 z-30 bg-white/80 backdrop-blur-md border-b border-green-100 px-4 py-3 flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="w-8 h-8 flex items-center justify-center rounded-full bg-white/60 border border-gray-200"
        >
          ←
        </button>
        <div>
          <h1 className="font-bold text-farm-brown-dark text-lg leading-tight">
            🌿 Nong trai thong minh
          </h1>
          <p className="text-[11px] text-gray-400">DePIN &middot; Blockchain-verified IoT</p>
        </div>
      </div>

      {/* Content */}
      <div className="px-4 py-4 space-y-4 pb-24">
        <SensorDashboard />
        <BlockchainLog />
        <BlockchainBadge size="lg" />
      </div>
    </div>
  );
}
