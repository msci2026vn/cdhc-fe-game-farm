import { STAT_CONFIG } from '../utils/stat-constants';
import { playSound } from '../audio';

type StatKey = 'atk' | 'hp' | 'def' | 'mana';

interface StatHelpModalProps {
  stat: StatKey;
  isOpen: boolean;
  onClose: () => void;
}

const STAT_HELP_DATA: Record<StatKey, {
  icon: string;
  name: string;
  perPoint: string;
  description: string;
  color: string;
  bg: string;
  effects: string[];
  milestones: { threshold: number; name: string; desc: string }[];
  tip: string;
}> = {
  atk: {
    icon: '⚔️',
    name: 'Sát thương (ATK)',
    perPoint: `+${STAT_CONFIG.PER_POINT.ATK} sát thương`,
    description: 'Chỉ số tấn công — quyết định dame bạn gây ra khi đánh boss.',
    color: '#e74c3c',
    bg: 'linear-gradient(135deg, #ffe0e0, #ffb3b3)',
    effects: [
      'Mỗi gem ⚔️ gây dame mạnh hơn',
      'Mỗi gem ⭐ cũng gây thêm dame',
      'ULT (chiêu cuối) mạnh hơn',
    ],
    milestones: [
      { threshold: 300, name: 'Chí Mạng I', desc: '10% cơ hội dame x2' },
      { threshold: 800, name: 'Chí Mạng II', desc: '15% cơ hội dame x2' },
      { threshold: 2000, name: 'Hủy Diệt', desc: 'Match-5 gây dame diện rộng' },
    ],
    tip: 'Muốn hạ boss nhanh → dồn ATK',
  },
  hp: {
    icon: '❤️',
    name: 'Máu tối đa (HP)',
    perPoint: `+${STAT_CONFIG.PER_POINT.HP} máu tối đa`,
    description: 'Chỉ số sinh mệnh — quyết định bạn chịu được bao nhiêu đòn từ boss.',
    color: '#4eca6a',
    bg: 'linear-gradient(135deg, #d4f8dc, #a8e6a0)',
    effects: [
      'Máu tối đa cao hơn → sống lâu hơn',
      'Gem ❤️ hồi nhiều máu hơn',
    ],
    milestones: [
      { threshold: 1500, name: 'Tái Sinh I', desc: 'Tự hồi 5% HP mỗi 5 lượt' },
      { threshold: 5000, name: 'Tái Sinh II', desc: 'Tự hồi 8% HP mỗi 5 lượt' },
      { threshold: 15000, name: 'Bất Tử', desc: '1 lần/trận hồi sinh khi chết' },
    ],
    tip: 'Muốn trụ lâu, đánh boss mạnh → dồn HP',
  },
  def: {
    icon: '🛡️',
    name: 'Giáp cơ bản (DEF)',
    perPoint: `+${STAT_CONFIG.PER_POINT.DEF} giáp`,
    description: 'Chỉ số phòng thủ — giảm sát thương nhận từ boss.',
    color: '#3498db',
    bg: 'linear-gradient(135deg, #d4eeff, #a8d4f0)',
    effects: [
      'Boss đánh đau ít hơn (giảm tối đa 50%)',
      'Shield ban đầu dày hơn',
      'Gem 🛡️ cộng nhiều shield hơn',
    ],
    milestones: [
      { threshold: 200, name: 'Phản Đòn I', desc: 'Phản 10% dame về boss' },
      { threshold: 600, name: 'Phản Đòn II', desc: 'Phản 20% dame về boss' },
      { threshold: 1500, name: 'Thành Trì', desc: 'Cứ 10 lượt miễn 1 đòn' },
    ],
    tip: 'Boss đánh mạnh tuần này → dồn DEF để tank',
  },
  mana: {
    icon: '✨',
    name: 'Mana',
    perPoint: `+${STAT_CONFIG.PER_POINT.MANA} mana tối đa`,
    description: 'Năng lượng phép thuật — dùng để NÉ đòn boss và tung chiêu cuối (ULT).',
    color: '#9b59b6',
    bg: 'linear-gradient(135deg, #f0d4ff, #d4a8f0)',
    effects: [
      'NÉ đòn boss tốn 30 mana',
      'ULT (chiêu cuối) tốn 80 mana',
      'Mana hồi tự động mỗi lượt',
      'Mana cao → xài NÉ + ULT nhiều hơn',
    ],
    milestones: [
      { threshold: 250, name: 'Tiết Kiệm I', desc: 'NÉ chỉ tốn 25 mana' },
      { threshold: 800, name: 'Tiết Kiệm II', desc: 'ULT chỉ tốn 65 mana' },
      { threshold: 3000, name: 'Siêu Năng', desc: 'ULT miễn phí, cooldown 8 lượt' },
    ],
    tip: 'Thích spam NÉ + ULT → dồn Mana',
  },
};

export function StatHelpModal({ stat, isOpen, onClose }: StatHelpModalProps) {
  if (!isOpen) return null;

  const data = STAT_HELP_DATA[stat];

  const handleClose = () => { playSound('ui_modal_close'); onClose(); };

  return (
    <div className="fixed inset-0 z-50 flex items-end justify-center bg-black/60 animate-fade-in" onClick={handleClose}>
      <div
        className="bg-white rounded-t-2xl max-w-[430px] w-full shadow-2xl max-h-[80dvh] flex flex-col animate-slide-up"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between p-4 pb-2 flex-shrink-0">
          <div className="flex items-center gap-2">
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-lg"
              style={{ background: data.bg }}
            >
              {data.icon}
            </div>
            <h3 className="font-heading text-base font-bold">{data.name}</h3>
          </div>
          <button
            onClick={handleClose}
            className="w-7 h-7 rounded-full bg-gray-100 flex items-center justify-center text-gray-400 text-sm font-bold active:bg-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Content — scrollable */}
        <div className="flex-1 min-h-0 overflow-y-auto px-4 pb-4" style={{ scrollbarWidth: 'none' }}>
          {/* Description */}
          <p className="text-xs text-gray-600 mb-3">{data.description}</p>

          {/* Per point */}
          <div className="bg-gray-50 rounded-xl p-2.5 mb-3">
            <p className="text-xs font-bold">
              📊 Mỗi 1 điểm = <span style={{ color: data.color }}>{data.perPoint}</span>
            </p>
          </div>

          {/* Effects */}
          <div className="mb-3">
            <p className="text-[10px] font-bold text-gray-400 mb-1.5">{data.icon} Tác dụng trong trận</p>
            <div className="space-y-1">
              {data.effects.map((e, i) => (
                <div key={i} className="flex items-start gap-1.5">
                  <span className="text-[10px] text-gray-300 mt-0.5">•</span>
                  <p className="text-[11px] text-gray-600">{e}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Milestones */}
          <div className="mb-3">
            <p className="text-[10px] font-bold text-gray-400 mb-1.5">🔥 Mốc thưởng</p>
            <div className="space-y-1">
              {data.milestones.map((m) => (
                <div key={m.threshold} className="flex items-center gap-2 bg-amber-50 rounded-lg p-2">
                  <span
                    className="text-xs font-black min-w-[40px] text-right"
                    style={{ color: data.color }}
                  >
                    {m.threshold.toLocaleString('vi-VN')}
                  </span>
                  <div className="flex-1 min-w-0">
                    <p className="text-[11px] font-bold">{m.name}</p>
                    <p className="text-[10px] text-gray-500">{m.desc}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Tip */}
          <div className="bg-blue-50 rounded-xl p-2.5">
            <p className="text-[11px] text-blue-600 italic">💡 {data.tip}</p>
          </div>
        </div>

        {/* Footer button */}
        <div className="p-4 pt-2 flex-shrink-0">
          <button
            onClick={handleClose}
            className="w-full py-2.5 rounded-xl text-sm font-bold text-white active:scale-95 transition-all shadow-lg"
            style={{ background: `linear-gradient(135deg, ${data.color}, ${data.color}cc)` }}
          >
            Đã hiểu!
          </button>
        </div>
      </div>
    </div>
  );
}
