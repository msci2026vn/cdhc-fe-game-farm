const fs = require('fs');

const viPath = 'src/locales/vi/common.json';
const enPath = 'src/locales/en/common.json';

const viData = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

if (!viData.campaign) viData.campaign = {};
if (!enData.campaign) enData.campaign = {};

const viCamp = viData.campaign;
const enCamp = enData.campaign;

// 1. Archetypes
viCamp.archetypes = {
    glass_cannon: { label: "Glass Cannon", counterText: "Tấn Công (rush kill)", worstText: "", tip: "Giết nhanh, né khi boss rage" },
    tank: { label: "Tank", counterText: "Tấn Công (phá giáp)", worstText: "Phòng Thủ (dame bị DEF chặn)", tip: "ATK cao phá giáp. Kiên nhẫn phase 1, burst phase rage" },
    healer: { label: "Healer", counterText: "Tấn Công (vượt hồi)", worstText: "Phòng Thủ (DPS < hồi máu)", tip: "DPS phải vượt heal/turn. Dồn burst khi boss mở guard" },
    assassin: { label: "Assassin", counterText: "Phòng Thủ (tank burst)", worstText: "Tấn Công (DEF thấp, chết nhanh)", tip: "DEF giảm MỖI đòn ×Freq. Né phase rage (Freq tăng)" },
    controller: { label: "Controller", counterText: "Cân Bằng (Mana chống drain)", worstText: "Tấn Công (bị disrupt)", tip: "Mana cao chịu drain tốt. Nhớ pattern stun" },
    hybrid: { label: "Hybrid", counterText: "Tấn Công (burst vượt hồi)", worstText: "Cân Bằng (HP thấp vs true damage)", tip: "Cuộc đua DPS. Né true damage. Boss tự hủy khi HP thấp" },
    all: { label: "Đế Vương", counterText: "Phòng Thủ (an toàn nhất)", worstText: "", tip: "4 phase: Tank→Assassin→Healer→Glass. Tích Mana ở P1, Né ở P2, Burst ở P3, Sống sót P4" },
    none: { label: "Thường", counterText: "Mọi build đều OK", worstText: "", tip: "Quái thường, không có cơ chế đặc biệt" }
};
enCamp.archetypes = {
    glass_cannon: { label: "Glass Cannon", counterText: "Attack (rush kill)", worstText: "", tip: "Kill fast, dodge when boss rages" },
    tank: { label: "Tank", counterText: "Attack (armor break)", worstText: "Defense (damage blocked by DEF)", tip: "High ATK to break armor. Be patient in phase 1, burst in rage." },
    healer: { label: "Healer", counterText: "Attack (out-damage heal)", worstText: "Defense (DPS < boss heal)", tip: "DPS must exceed heal. Burst when guard is down." },
    assassin: { label: "Assassin", counterText: "Defense (tank burst)", worstText: "Attack (low DEF, die fast)", tip: "DEF reduction per hit ×Freq. Dodge rage phase." },
    controller: { label: "Controller", counterText: "Balanced (Mana resists drain)", worstText: "Attack (disrupted)", tip: "High Mana resists drain well. Remember stun pattern." },
    hybrid: { label: "Hybrid", counterText: "Attack (burst > heal)", worstText: "Balanced (low HP vs true damage)", tip: "DPS race. Dodge true damage. Boss self-destructs at low HP." },
    all: { label: "Emperor", counterText: "Defense (safest)", worstText: "", tip: "4 phases: Tank→Assassin→Healer→Glass. Save Mana in P1, Dodge in P2, Burst in P3, Survive P4" },
    none: { label: "Normal", counterText: "Any build is OK", worstText: "", tip: "Normal monster, no special mechanics" }
};

// 2. Boss skills
viCamp.boss_skills = {
    stun: { label: "Choáng!", desc: "Khóa grid {{duration}}s" },
    burn: { label: "Đốt!", desc: "{{value}}% maxHP/giây × {{duration}}s" },
    heal_block: { label: "Khóa hồi!", desc: "Khóa hồi HP {{duration}}s" },
    armor_break: { label: "Phá giáp!", desc: "DEF = 0 trong {{duration}}s" },
    shield: { label: "Bất tử!", desc: "Miễn nhiễm damage {{duration}}s" },
    reflect: { label: "Phản dame!", desc: "Phản {{value}}% dame {{duration}}s" },
    egg: { label: "Đẻ trứng!", desc: "Trứng nở {{duration}}s → hồi {{value}}% HP" },
    gem_lock: { label: "Khóa gem!", desc: "Khóa {{value}} gem × {{duration}}s" }
};
enCamp.boss_skills = {
    stun: { label: "Stun!", desc: "Lock grid for {{duration}}s" },
    burn: { label: "Burn!", desc: "{{value}}% maxHP/sec × {{duration}}s" },
    heal_block: { label: "Heal block!", desc: "Block HP healing for {{duration}}s" },
    armor_break: { label: "Armor break!", desc: "DEF = 0 for {{duration}}s" },
    shield: { label: "Immortal!", desc: "Immune to damage for {{duration}}s" },
    reflect: { label: "Reflect!", desc: "Reflect {{value}}% damage for {{duration}}s" },
    egg: { label: "Lay egg!", desc: "Hatch in {{duration}}s → heals {{value}}% HP" },
    gem_lock: { label: "Gem lock!", desc: "Lock {{value}} gems for {{duration}}s" }
};

// 3. Boss phases
viCamp.boss_phases = {
    tank: { skillName: "Giáp thần!", description: "DEF cực cao, đánh chậm. Tập trung phá giáp." },
    assassin: { skillName: "Tam liên kích!", description: "3 đòn liên hoàn, ATK cực cao. NÉ hoặc chết!" },
    healer: { skillName: "Hồi sinh!", description: "Hồi 3% HP mỗi 5 giây. DPS race — burst nhanh!" },
    glass_cannon: { skillName: "Hủy diệt!", description: "ATK tối đa, tự mất 2% HP/5s. Sống sót = thắng!" }
};
enCamp.boss_phases = {
    tank: { skillName: "Divine Armor!", description: "Extremely high DEF, slow attacks. Focus on armor break." },
    assassin: { skillName: "Triple Strike!", description: "3 continuous strikes, very high ATK. DODGE or die!" },
    healer: { skillName: "Resurrection!", description: "Heals 3% HP every 5 seconds. DPS race — burst quickly!" },
    glass_cannon: { skillName: "Destruction!", description: "Max ATK, auto loses 2% HP/5s. Survive = win!" }
};

// 4. Boss specials
viCamp.boss = viCamp.boss || {};
enCamp.boss = enCamp.boss || {};
viCamp.boss.special = {
    "3": "Hút 10% Mana mỗi đòn đánh",
    "4": "Mưa độc: -5% HP mỗi 5 lượt",
    "6": "Lá chắn: Giảm 50% sát thương từ gem Đỏ",
    "7": "Hồi 10% HP khi người chơi hụt match",
    "8": "Ngẫu nhiên khóa 2 skill người chơi trong 3 lượt",
    "9": "Nhện chúa: Gọi đàn nhện con cản trở bàn đấu",
    "11": "Mỗi đòn đánh giảm 10% ATK người chơi (tích dồn)",
    "12": "Sâu độc: Rải gai độc, người chơi nhận sát thương mỗi lượt di chuyển",
    "13": "Thỏ điên: Tốc độ x2 khi HP < 50%",
    "14": "Đào tẩu: Sẽ bỏ chạy nếu không tiêu diệt trong 15 lượt",
    "15": "Sát thủ: Tỷ lệ chí mạng 30%",
    "16": "Phân bóng: Tạo 2 ảo ảnh chia sẻ HP",
    "18": "Hút máu: Hồi HP bằng 50% sát thương gây ra",
    "19": "Da sắt: Miễn nhiễm sát thương phép (Gem nguyên tố)",
    "20": "Cộng sinh: Hồi sinh 1 lần với 30% HP",
    "22": "Nóng giận: ATK tăng 20% mỗi lượt qua đi",
    "23": "Mê hoặc: Giảm tỷ lệ combo của người chơi",
    "24": "Ma tốc độ: Né tránh 30% đòn tấn công",
    "25": "Gấu trúc: Ăn trúc hồi đầy HP nếu bị bỏ mặc",
    "26": "Giáp gai: Phản 20% sát thương cận chiến",
    "27": "Phong ấn: Khóa chức năng hồi máu của người chơi",
    "28": "Long Vương: Gọi mưa sao băng mỗi 10 lượt",
    "29": "Bùn lầy: Tốc độ người chơi giảm 50%",
    "30": "Cóc độc: Nổ độc khi chết gây sát thương lớn",
    "31": "Trăn tinh: Quấn siết, mỗi hiệp mất 5% HP tối đa",
    "32": "Cá sấu chúa: Đòn cắn tử thần bỏ qua DEF",
    "33": "Hỏa ngục: Sân thiêu đốt liên tục",
    "34": "Dung nham: Khiển gem đỏ thành bom nổ chậm",
    "35": "Phượng hoàng: Trùng sinh từ đống tro tàn",
    "36": "Hỏa Thần: Triệu hồi cột lửa hủy grid",
    "37": "Hắc ám: Che mờ 1 phần grid đấu",
    "38": "Linh hồn: Bỏ qua 50% phòng thủ người chơi",
    "39": "Lời nguyền: Trái bom tử thần đếm ngược",
    "40": "Đại Ma Vương: Thay đổi cơ chế mỗi 25% HP",
    "none": "Không có cơ chế đặc biệt."
};
enCamp.boss.special = {
    "3": "Drains 10% Mana per attack",
    "4": "Poison Rain: -5% HP every 5 turns",
    "6": "Shield: Reduces damage from Red gems by 50%",
    "7": "Heals 10% HP on player miss",
    "8": "Randomly locks 2 player skills for 3 turns",
    "9": "Spider Queen: Summons spiderlings to block the board",
    "11": "Each hit reduces player ATK by 10% (stacks)",
    "12": "Toxic Worm: Spreads toxic spikes, player takes damage per move",
    "13": "Mad Rabbit: x2 Speed when HP < 50%",
    "14": "Escape: Will run away if not defeated in 15 turns",
    "15": "Assassin: 30% Critical rate",
    "16": "Shadow Clone: Creates 2 illusions that share HP",
    "18": "Lifesteal: Heals HP equal to 50% of damage dealt",
    "19": "Iron Skin: Immune to magic damage (Elemental gems)",
    "20": "Symbiosis: Revives once with 30% HP",
    "22": "Enrage: ATK increases by 20% every passing turn",
    "23": "Charm: Reduces player combo rate",
    "24": "Phantom Speed: Evades 30% of attacks",
    "25": "Panda: Eats bamboo to fully heal if left unchecked",
    "26": "Thorn Armor: Reflects 20% melee damage",
    "27": "Seal: Locks player's healing abilities",
    "28": "Dragon King: Summons meteor shower every 10 turns",
    "29": "Mud: Player speed reduced by 50%",
    "30": "Toxic Toad: Explodes on death causing massive damage",
    "31": "Python: Constricts, draining 5% Max HP per turn",
    "32": "Crocodile King: Death Roll ignores DEF",
    "33": "Inferno: Battlefield constantly burns",
    "34": "Magma: Turns red gems into time bombs",
    "35": "Phoenix: Rebirths from the ashes",
    "36": "Fire God: Summons fire pillars to destroy the grid",
    "37": "Darkness: Obscures part of the battle grid",
    "38": "Soul: Ignores 50% of player's defense",
    "39": "Curse: Death bomb countdown",
    "40": "Demon Lord: Changes mechanics every 25% HP",
    "none": "No special mechanics."
};

Object.keys(viCamp.boss.special).forEach(key => {
    if (key === 'none') {
        viData.campaign_boss_special_none = viCamp.boss.special[key];
        enData.campaign_boss_special_none = enCamp.boss.special[key];
    } else {
        viData[`campaign_boss_special_${key}`] = viCamp.boss.special[key];
        enData[`campaign_boss_special_${key}`] = enCamp.boss.special[key];
    }
});

// Since they were accessed via `t(campaign.boss.special.X)`: Note `detail.specialVi` was like `campaign.boss.special.X`. Wait, my keys right above added them to `viData.campaign.boss.special`. This works perfectly for nested.
// Wait, react-i18next uses dot notation for nested keys. So `campaign.boss.special.3` maps to `viData.campaign.boss.special["3"]`.

fs.writeFileSync(viPath, JSON.stringify(viData, null, 2));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
console.log('Patched vi and en locale JSON successfully.');
