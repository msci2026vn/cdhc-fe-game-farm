export interface QuizQuestion {
  question: string;
  image: string;
  options: { letter: string; text: string }[];
  correct: string;
}

const QUESTIONS: QuizQuestion[] = [
  {
    question: 'Phương pháp nào sau đây KHÔNG thuộc nông nghiệp hữu cơ?',
    image: '🌾',
    options: [
      { letter: 'A', text: 'Sử dụng phân hữu cơ' },
      { letter: 'B', text: 'Phun thuốc trừ sâu hóa học' },
      { letter: 'C', text: 'Luân canh cây trồng' },
      { letter: 'D', text: 'Nuôi thiên địch' },
    ],
    correct: 'B',
  },
  {
    question: 'Loại phân bón nào có nguồn gốc tự nhiên?',
    image: '🌿',
    options: [
      { letter: 'A', text: 'Phân ure' },
      { letter: 'B', text: 'Phân compost' },
      { letter: 'C', text: 'Phân DAP' },
      { letter: 'D', text: 'Phân NPK' },
    ],
    correct: 'B',
  },
  {
    question: 'Thiên địch của rệp cây là loài côn trùng nào?',
    image: '🐞',
    options: [
      { letter: 'A', text: 'Bọ rùa' },
      { letter: 'B', text: 'Bọ xít' },
      { letter: 'C', text: 'Châu chấu' },
      { letter: 'D', text: 'Dế mèn' },
    ],
    correct: 'A',
  },
  {
    question: 'Luân canh cây trồng giúp ích gì cho đất?',
    image: '🔄',
    options: [
      { letter: 'A', text: 'Tăng độ mặn đất' },
      { letter: 'B', text: 'Giảm sâu bệnh, cải tạo đất' },
      { letter: 'C', text: 'Làm đất khô hơn' },
      { letter: 'D', text: 'Tăng lượng thuốc cần dùng' },
    ],
    correct: 'B',
  },
  {
    question: 'Cây nào thuộc họ đậu, giúp cố định đạm trong đất?',
    image: '🫘',
    options: [
      { letter: 'A', text: 'Cây ngô' },
      { letter: 'B', text: 'Cây lúa' },
      { letter: 'C', text: 'Cây đậu tương' },
      { letter: 'D', text: 'Cây khoai' },
    ],
    correct: 'C',
  },
  {
    question: 'Tưới nhỏ giọt có ưu điểm gì?',
    image: '💧',
    options: [
      { letter: 'A', text: 'Tốn nhiều nước hơn' },
      { letter: 'B', text: 'Tiết kiệm nước, giảm cỏ dại' },
      { letter: 'C', text: 'Chỉ dùng cho cây ăn quả' },
      { letter: 'D', text: 'Gây xói mòn đất' },
    ],
    correct: 'B',
  },
  {
    question: 'Chất nào gây ô nhiễm đất nghiêm trọng nhất?',
    image: '☠️',
    options: [
      { letter: 'A', text: 'Phân chuồng' },
      { letter: 'B', text: 'Thuốc trừ sâu hóa học' },
      { letter: 'C', text: 'Nước mưa' },
      { letter: 'D', text: 'Lá cây mục' },
    ],
    correct: 'B',
  },
  {
    question: 'Giun đất có vai trò gì trong nông nghiệp hữu cơ?',
    image: '🪱',
    options: [
      { letter: 'A', text: 'Ăn hại rễ cây' },
      { letter: 'B', text: 'Làm đất tơi xốp, tăng dinh dưỡng' },
      { letter: 'C', text: 'Truyền bệnh cho cây' },
      { letter: 'D', text: 'Hút nước trong đất' },
    ],
    correct: 'B',
  },
  {
    question: 'Nông sản hữu cơ cần đạt tiêu chuẩn gì?',
    image: '✅',
    options: [
      { letter: 'A', text: 'Giá rẻ nhất thị trường' },
      { letter: 'B', text: 'Không dùng hóa chất tổng hợp' },
      { letter: 'C', text: 'Sản xuất công nghiệp quy mô lớn' },
      { letter: 'D', text: 'Sử dụng giống biến đổi gen' },
    ],
    correct: 'B',
  },
  {
    question: 'Ủ compost cần yếu tố nào sau đây?',
    image: '♻️',
    options: [
      { letter: 'A', text: 'Nhựa và kim loại' },
      { letter: 'B', text: 'Chất xanh, chất nâu, nước, không khí' },
      { letter: 'C', text: 'Thuốc tẩy và xà phòng' },
      { letter: 'D', text: 'Chỉ cần đất và nước' },
    ],
    correct: 'B',
  },
  {
    question: 'Loại cây nào giúp xua đuổi côn trùng tự nhiên?',
    image: '🌼',
    options: [
      { letter: 'A', text: 'Cây sả' },
      { letter: 'B', text: 'Cây lúa' },
      { letter: 'C', text: 'Cây mía' },
      { letter: 'D', text: 'Cây cao su' },
    ],
    correct: 'A',
  },
  {
    question: 'Độ pH đất phù hợp cho hầu hết rau màu là?',
    image: '🧪',
    options: [
      { letter: 'A', text: '2.0 - 3.0' },
      { letter: 'B', text: '6.0 - 7.0' },
      { letter: 'C', text: '9.0 - 10.0' },
      { letter: 'D', text: '12.0 - 14.0' },
    ],
    correct: 'B',
  },
];

/** Shuffle and pick `count` random questions */
export function getRandomQuestions(count: number): QuizQuestion[] {
  const shuffled = [...QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}

export const QUIZ_SIZE = 5;
