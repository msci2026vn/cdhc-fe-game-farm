const fs = require('fs');

const enPath = 'src/locales/en/common.json';
const viPath = 'src/locales/vi/common.json';

const enMap = {
    "not_enough_mana_short": "Not enough mana! ({{cost}})",
    "dodge_success": "🏃 Dodge success!",
    "immune_popup": "🏰 Immune!",
    "immune_combat_notif": "🏰 Fortress Immune!",
    "immune_attack_msg": "Fortress Immune!",
    "immortal_popup": "👼 Immortal!",
    "immortal_combat_notif": "👼 Immortality activated!",
    "reflect_popup": "🛡️ Reflect -{{dmg}}",
    "reflect_combat_notif": "🛡️ Reflected {{dmg}} DMG!",
    "boss_attacks": "Boss attacks!",
    "loading_boss": "Loading boss...",
    "error_loading_boss": "Error loading boss",
    "boss_not_found": "Boss not found",
    "difficulty_easy": "Easy",
    "difficulty_medium": "Medium",
    "difficulty_hard": "Hard",
    "difficulty_legendary": "Legendary",
    "boss_rep_xanh_desc": "Chubby caterpillar eating young leaves. Take it down!",
    "boss_sau_to_desc": "Diamondback moth larva spinning webs. Don't let it rampage!",
    "boss_bo_rua_desc": "A greedy ladybug. Cute but highly destructive!",
    "boss_chau_chau_desc": "Locust jumping around. It eats super fast!",
    "boss_bo_xit_desc": "Stink bug, smelly and dangerous. Beware its gas!",
    "boss_oc_sen_desc": "Snail that crawls slowly but very tough. Hit it brings death!",
    "boss_chuot_dong_desc": "Cunning field mouse. It eats roots too!",
    "boss_rong_lua_desc": "Legendary Fire Dragon guarding the ancient garden. Beat it to enter the club!"
};

const viMap = {
    "not_enough_mana_short": "Thiếu mana! ({{cost}})",
    "dodge_success": "🏃 Né thành công!",
    "immune_popup": "🏰 Miễn nhiễm!",
    "immune_combat_notif": "🏰 Thành Trì bất!",
    "immune_attack_msg": "Thành Trì bất!",
    "immortal_popup": "👼 Bất Tử!",
    "immortal_combat_notif": "👼 Bất Tử kích hoạt!",
    "reflect_popup": "🛡️ Phản -{{dmg}}",
    "reflect_combat_notif": "🛡️ Phản xạ {{dmg}} DMG!",
    "boss_attacks": "Boss tấn công!",
    "loading_boss": "Đang tải boss...",
    "error_loading_boss": "Lỗi tải boss",
    "boss_not_found": "Boss không tìm thấy",
    "difficulty_easy": "Dễ",
    "difficulty_medium": "Trung bình",
    "difficulty_hard": "Khó",
    "difficulty_legendary": "Huyền thoại",
    "boss_rep_xanh_desc": "Sâu béo bự chuyên ăn lá non. Đánh bay nó thôi!",
    "boss_sau_to_desc": "Sâu tơ dệt kén làm héo cây. Đừng để nó lộng hành!",
    "boss_bo_rua_desc": "Bọ rùa đỏ tham ăn. Trông dễ thương nhưng phá hoại kinh!",
    "boss_chau_chau_desc": "Châu chấu dua nhảy khắp vườn. Nó ăn siêu nhanh!",
    "boss_bo_xit_desc": "Bọ xít hôi thối nhưng nguy hiểm. Cẩn thận chiêu xịt hơi!",
    "boss_oc_sen_desc": "Ốc sên trườn bò chậm nhưng dai. Dính là chết!",
    "boss_chuot_dong_desc": "Chuột đồng tinh ranh. Nó ăn cả rễ cây đấy!",
    "boss_rong_lua_desc": "Huyền thoại Rồng Lửa canh vườn cổ. Đánh thắng mới vào club!"
};

const enJSON = JSON.parse(fs.readFileSync(enPath, 'utf-8'));
Object.assign(enJSON, enMap);
fs.writeFileSync(enPath, JSON.stringify(enJSON, null, 2) + '\n', 'utf8');

const viJSON = JSON.parse(fs.readFileSync(viPath, 'utf-8'));
Object.assign(viJSON, viMap);
fs.writeFileSync(viPath, JSON.stringify(viJSON, null, 2) + '\n', 'utf8');
console.log('Locales updated for hooks!');
