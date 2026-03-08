import { useTranslation } from 'react-i18next';
import { BottomDrawer } from './BottomDrawer';

const ORGANIC_KEYWORDS = [
  'thiên địch', 'hữu cơ', 'không cần thuốc', 'không phun',
  'trichoderma', 'lycosa', 'phytoseiulus', 'anagrus', 'trichogramma',
  'bọ rùa', 'ong ký sinh', 'vịt', 'bacillus', 'metarhizium',
  'nông dân thông thái', 'điểm yếu', 'phòng bệnh từ gốc',
];

function isOrganicSection(text: string): boolean {
  const lower = text.toLowerCase();
  return ORGANIC_KEYWORDS.some(k => lower.includes(k));
}

function parseStory(storyFull: string): string[] {
  return storyFull.split(/\n\n+/).map(p => p.trim()).filter(Boolean);
}

interface StoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  storyFull: string | null;
  bossName: string;
}

export function StoryDrawer({ isOpen, onClose, storyFull, bossName }: StoryDrawerProps) {
  const { t } = useTranslation();
  const parts = storyFull ? parseStory(storyFull) : [];

  return (
    <BottomDrawer isOpen={isOpen} onClose={onClose} title={t('world_boss.story.title')}>
      <p className="text-sm text-yellow-400 italic mb-4">{bossName}</p>

      {parts.length === 0 ? (
        <p className="text-sm text-gray-500">{t('world_boss.story.empty')}</p>
      ) : (
        <div className="flex flex-col gap-4">
          {parts.map((part, i) => {
            const organic = isOrganicSection(part);
            return organic ? (
              <div
                key={i}
                className="border-l-4 border-green-500 bg-green-900/20 rounded-r-lg pl-3 pr-2 py-2"
              >
                <p className="text-xs text-green-400 font-bold mb-1">{t('world_boss.story.biology_control')}</p>
                <p className="text-sm text-gray-200 leading-relaxed">{part}</p>
              </div>
            ) : (
              <p key={i} className="text-sm text-gray-300 leading-relaxed">{part}</p>
            );
          })}
        </div>
      )}
    </BottomDrawer>
  );
}
