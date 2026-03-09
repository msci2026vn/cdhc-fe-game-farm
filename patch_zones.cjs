const fs = require('fs');

const viPath = 'src/locales/vi/common.json';
const enPath = 'src/locales/en/common.json';

const viData = JSON.parse(fs.readFileSync(viPath, 'utf8'));
const enData = JSON.parse(fs.readFileSync(enPath, 'utf8'));

viData.campaign.zones = {
    "1": { name: "Ruộng Lúa" },
    "2": { name: "Vườn Cà Chua" },
    "3": { name: "Vườn Ớt" },
    "4": { name: "Rẫy Cà Rốt" },
    "5": { name: "Nhà Kho" },
    "6": { name: "Đồng Hoang" },
    "7": { name: "Rừng Tre" },
    "8": { name: "Đầm Lầy" },
    "9": { name: "Núi Lửa" },
    "10": { name: "Thế Giới Ngầm" }
};

enData.campaign.zones = {
    "1": { name: "Rice Field" },
    "2": { name: "Tomato Garden" },
    "3": { name: "Pepper Garden" },
    "4": { name: "Carrot Patch" },
    "5": { name: "Barn" },
    "6": { name: "Wasteland" },
    "7": { name: "Bamboo Forest" },
    "8": { name: "Swamp" },
    "9": { name: "Volcano" },
    "10": { name: "Underworld" }
};

fs.writeFileSync(viPath, JSON.stringify(viData, null, 2));
fs.writeFileSync(enPath, JSON.stringify(enData, null, 2));
