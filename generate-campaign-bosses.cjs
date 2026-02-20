const fs = require('fs');
const path = require('path');

const outDir = path.join(__dirname, 'public/assets/campaign-bosses');
if (!fs.existsSync(outDir)) {
    fs.mkdirSync(outDir, { recursive: true });
}

// 10 Zones, 4 Bosses each = 40 Bosses
const zones = [
    { name: 'Ruộng Lúa', theme: 'bug', colors: ['#8bc34a', '#4caf50', '#aed581'], bg: '#e8f5e9' },
    { name: 'Vườn Cà Chua', theme: 'spider', colors: ['#e53935', '#b71c1c', '#ef5350'], bg: '#ffebee' },
    { name: 'Vườn Ớt', theme: 'beetle', colors: ['#d84315', '#bf360c', '#ff7043'], bg: '#fbe9e7' },
    { name: 'Rẫy Cà Rốt', theme: 'grasshopper', colors: ['#fb8c00', '#e65100', '#ffa726'], bg: '#fff3e0' },
    { name: 'Nhà Kho', theme: 'snail', colors: ['#8d6e63', '#5d4037', '#bcaaa4'], bg: '#efebe9' },
    { name: 'Đồng Hoang', theme: 'mouse', colors: ['#9e9e9e', '#616161', '#bdbdbd'], bg: '#fafafa' },
    { name: 'Rừng Tre', theme: 'scorpion', colors: ['#558b2f', '#33691e', '#8bc34a'], bg: '#f1f8e9' },
    { name: 'Đầm Lầy', theme: 'frog', colors: ['#00897b', '#004d40', '#4db6ac'], bg: '#e0f2f1' },
    { name: 'Núi Lửa', theme: 'lizard', colors: ['#f4511e', '#bf360c', '#ff8a65'], bg: '#fbe9e7' },
    { name: 'Thế Giới Ngầm', theme: 'ant', colors: ['#d32f2f', '#b71c1c', '#ef5350'], bg: '#eceff1' }
];

const accessories = [
    // 1: Minion, 2: Elite, 3: Mini-boss, 4: Boss
    (c) => `<rect x="-5" y="-30" width="10" height="5" fill="${c[1]}" />`, // Headband
    (c) => `<path d="M-8,-25 L8,-25 L0,-35 Z" fill="${c[2]}" />`, // Small hat
    (c) => `<path d="M-10,-25 Q0,-35 10,-25 L8,-20 L-8,-20 Z" fill="${c[1]}" />`, // Helmet
    (c) => `<path d="M-12,-25 Q0,-40 12,-25 L10,-15 L-10,-15 Z" fill="#ffb300" stroke="#f57c00" stroke-width="2"/>` // Crown
];

const vehicles = [
    // 1: Leaf board
    `<g transform="translate(100, 110)">
     <path d="M-30,0 Q0,10 30,0 Q40,-5 15,-10 Q-40,-10 -30,0 Z" fill="#66bb6a" stroke="#388e3c" stroke-width="1.5"/>
   </g>`,
    // 2: Twig car
    `<g transform="translate(100, 110)">
     <rect x="-35" y="-5" width="70" height="10" rx="3" fill="#8d6e63" stroke="#5d4037" stroke-width="1.5"/>
     <circle cx="-20" cy="5" r="8" fill="#424242" stroke="#FFF" stroke-width="1.5" class="wheel"/>
     <circle cx="20" cy="5" r="8" fill="#424242" stroke="#FFF" stroke-width="1.5" class="wheel"/>
   </g>`,
    // 3: Stone Kart
    `<g transform="translate(100, 110)">
     <path d="M-30,-10 L30,-10 L40,5 L-40,5 Z" fill="#9e9e9e" stroke="#616161" stroke-width="2"/>
     <circle cx="-25" cy="5" r="10" fill="#212121" stroke="#9e9e9e" stroke-width="2" class="wheel"/>
     <circle cx="25" cy="5" r="10" fill="#212121" stroke="#9e9e9e" stroke-width="2" class="wheel"/>
   </g>`,
    // 4: Boss Chariot
    `<g transform="translate(100, 110)">
     <path d="M-40,-15 L40,-15 L50,5 L-50,5 Z" fill="#ffca28" stroke="#f57c00" stroke-width="2"/>
     <circle cx="-30" cy="5" r="12" fill="#3e2723" stroke="#ffca28" stroke-width="2" class="wheel"/>
     <circle cx="30" cy="5" r="12" fill="#3e2723" stroke="#ffca28" stroke-width="2" class="wheel"/>
     <path d="M-50,5 Q-60,0 -50,-10" fill="none" stroke="#f57c00" stroke-width="2"/>
   </g>`
];

for (let i = 0; i < 40; i++) {
    const zoneIdx = Math.floor(i / 4);
    const bossTier = i % 4; // 0 to 3
    const zone = zones[zoneIdx];
    const color = zone.colors[bossTier % 3];
    const darkColor = zone.colors[1];
    const lightColor = zone.colors[2];

    const svg = `<svg viewBox="0 0 200 150" xmlns="http://www.w3.org/2000/svg">
  <style>
    @keyframes bob { 0%, 100% { transform: translateY(0); } 50% { transform: translateY(-3px); } }
    @keyframes wheelSpin { 100% { transform: rotate(360deg); } }
    @keyframes cloudMove { 0% { transform: translateX(200px); } 100% { transform: translateX(-100px); } }
    .car { animation: bob 1s infinite alternate ease-in-out; transform-origin: center; }
    .wheel { animation: wheelSpin 1.5s infinite linear; transform-origin: center; }
    .cloud { animation: cloudMove 20s infinite linear; }
  </style>

  <rect width="200" height="150" fill="${zone.bg}" />
  <g fill="#FFF" opacity="0.6" class="cloud" transform="translate(${Math.random() * 100}, 20) scale(${0.4 + Math.random() * 0.4})">
    <circle cx="20" cy="20" r="20"/><circle cx="50" cy="20" r="25"/><circle cx="80" cy="20" r="20"/>
  </g>

  <!-- Ground -->
  <rect x="0" y="115" width="200" height="35" fill="#4B4B4B" />
  <g stroke="#FFF" stroke-width="2" stroke-dasharray="15 15">
    <line x1="0" y1="130" x2="200" y2="130" />
  </g>

  <g class="car">
    <!-- Character Base -->
    <g transform="translate(100, 95)">
      <!-- Body -->
      <circle cx="0" cy="-20" r="${15 + bossTier * 2}" fill="${color}" stroke="${darkColor}" stroke-width="2"/>
      
      <!-- Eyes -->
      <circle cx="-6" cy="-25" r="3" fill="#111"/>
      <circle cx="6" cy="-25" r="3" fill="#111"/>
      
      <!-- Accessory based on tier -->
      ${accessories[bossTier](zone.colors)}
    </g>

    <!-- Vehicle based on tier -->
    ${vehicles[bossTier]}
  </g>
</svg>`;

    fs.writeFileSync(path.join(outDir, `boss-${i + 1}.svg`), svg);
}

console.log('Generated 40 campaign boss SVGs');
