import type { FriendRequest } from '@/shared/types/social.types';
import { playSound } from '@/shared/audio';

interface RequestCardProps {
  request: FriendRequest;
  onAccept: (fromId: string) => void;
  onDecline: (fromId: string) => void;
  isLoading?: boolean;
}

export default function RequestCard({ request, onAccept, onDecline, isLoading }: RequestCardProps) {
  return (
    <div className="bg-white rounded-2xl shadow-sm border border-gray-100 p-3 flex items-center gap-3 animate-slide-up">
      {/* Avatar */}
      <div className="w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center text-2xl overflow-hidden border-2 border-white shadow-sm flex-shrink-0">
        {request.fromPicture
          ? <img src={request.fromPicture} alt={request.fromName} className="w-full h-full object-cover" />
          : '👤'}
      </div>

      {/* Info */}
      <div className="flex-1 min-w-0">
        <span className="font-heading font-bold text-gray-800 text-sm truncate block">{request.fromName}</span>
        <span className="text-[10px] text-gray-500 font-medium">Lv.{request.fromLevel}</span>
      </div>

      {/* Actions */}
      <div className="flex gap-2 flex-shrink-0">
        <button
          onClick={() => { playSound('ui_click'); onDecline(request.fromId); }}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-gray-500 bg-gray-100 border border-gray-200 active:scale-95 transition-transform disabled:opacity-40">
          Từ chối
        </button>
        <button
          onClick={() => { playSound('ui_click'); onAccept(request.fromId); }}
          disabled={isLoading}
          className="px-3 py-1.5 rounded-lg text-xs font-bold text-white active:scale-95 transition-transform disabled:opacity-40"
          style={{ background: isLoading ? '#94a3b8' : 'linear-gradient(135deg, #2d8a4e, #4eca6a)' }}>
          {isLoading ? '...' : 'Chấp nhận'}
        </button>
      </div>
    </div>
  );
}
