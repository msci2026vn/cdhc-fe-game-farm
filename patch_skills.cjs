const fs = require('fs');

const viPath = 'src/locales/vi/common.json';
const enPath = 'src/locales/en/common.json';

const viData = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

viData.campaign.boss_random_skills = {
    glass_cannon: ['Đòn chí mạng!', 'Song kiếm!', 'Cuồng nộ!'],
    tank: ['Lao đầu!', 'Đập đất!', 'Giáp gai!'],
    healer: ['Hồi máu!', 'Bào tử hồi!', 'Hút máu!'],
    assassin: ['Đa đòn!', 'Tấn công tốc!', 'Ám sát!'],
    controller: ['Xáo trộn!', 'Hút mana!', 'Choáng!'],
    hybrid: ['Hỗn hợp!', 'Toàn diện!', 'Tổng lực!'],
    all: ['Đế Vương giáng!', 'Thiên phạt!'],
    none: ['Tấn công mạnh!', 'Lửa Địa Ngục!', 'Sấm Sét!', 'Đòn Cuồng Phong!']
};

enData.campaign.boss_random_skills = {
    glass_cannon: ['Critical Strike!', 'Twin Blades!', 'Enrage!'],
    tank: ['Headbutt!', 'Earth Smash!', 'Thorn Armor!'],
    healer: ['Heal!', 'Healing Spores!', 'Lifesteal!'],
    assassin: ['Multi-Strike!', 'Speed Attack!', 'Assassinate!'],
    controller: ['Shuffle!', 'Mana Drain!', 'Stun!'],
    hybrid: ['Hybrid Strike!', 'All-round Attack!', 'Full Force!'],
    all: ['Emperor Descent!', 'Heaven Penalty!'],
    none: ['Heavy Attack!', 'Hellfire!', 'Thunderbolt!', 'Tempest Strike!']
};

fs.writeFileSync(viPath, JSON.stringify(viData, null, 2));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
