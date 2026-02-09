export interface BossQuestion {
  question: string;
  answer: boolean; // true = Đúng, false = Sai
  explanation: string;
}

const BOSS_QUESTIONS: BossQuestion[] = [
  { question: 'Diệt bọ rùa bằng ớt cay là phương pháp hữu cơ', answer: true, explanation: 'Dung dịch ớt cay là thuốc trừ sâu tự nhiên' },
  { question: 'Phun thuốc hóa học là nông nghiệp hữu cơ', answer: false, explanation: 'Hữu cơ không sử dụng hóa chất tổng hợp' },
  { question: 'Giun đất giúp đất tơi xốp hơn', answer: true, explanation: 'Giun đất đào hang tạo kênh không khí cho đất' },
  { question: 'Cây đậu tương có thể cố định đạm trong đất', answer: true, explanation: 'Vi khuẩn cộng sinh ở rễ đậu cố định nitơ' },
  { question: 'Luân canh làm đất cằn cỗi hơn', answer: false, explanation: 'Luân canh giúp cải tạo đất, giảm sâu bệnh' },
  { question: 'Tưới nhỏ giọt tốn nhiều nước hơn tưới tràn', answer: false, explanation: 'Tưới nhỏ giọt tiết kiệm 30-60% nước' },
  { question: 'Bọ rùa là thiên địch của rệp cây', answer: true, explanation: 'Một bọ rùa ăn 50-60 con rệp mỗi ngày' },
  { question: 'Phân compost có thể làm từ rác nhà bếp', answer: true, explanation: 'Vỏ trái cây, rau thừa đều ủ được compost' },
  { question: 'Cây sả có tác dụng xua đuổi muỗi', answer: true, explanation: 'Tinh dầu sả là chất đuổi côn trùng tự nhiên' },
  { question: 'Đất có pH 2.0 là tốt nhất cho rau', answer: false, explanation: 'Rau cần pH 6.0-7.0, pH 2.0 quá chua' },
  { question: 'Nuôi ong giúp tăng năng suất cây trồng', answer: true, explanation: 'Ong thụ phấn giúp cây ra quả nhiều hơn' },
  { question: 'Thuốc trừ sâu hóa học an toàn cho sức khỏe', answer: false, explanation: 'Hóa chất tổng hợp gây hại cho sức khỏe con người' },
  { question: 'Trồng cây che phủ giúp chống xói mòn đất', answer: true, explanation: 'Rễ cây giữ đất, lá cản nước mưa trực tiếp' },
  { question: 'Phân ure là phân hữu cơ', answer: false, explanation: 'Phân ure là phân hóa học (vô cơ)' },
  { question: 'Nước vo gạo có thể dùng tưới cây', answer: true, explanation: 'Nước vo gạo chứa vitamin B và tinh bột tốt cho cây' },
  { question: 'Cỏ dại luôn có hại cho vườn', answer: false, explanation: 'Một số cỏ dại giữ ẩm, thu hút thiên địch' },
  { question: 'Mùn cưa có thể dùng ủ compost', answer: true, explanation: 'Mùn cưa là chất nâu tốt cho ủ compost' },
  { question: 'Châu chấu là côn trùng có lợi cho nông nghiệp', answer: false, explanation: 'Châu chấu ăn lá cây gây thiệt hại mùa màng' },
  { question: 'Nấm rễ (mycorrhiza) giúp cây hấp thu dinh dưỡng', answer: true, explanation: 'Nấm rễ mở rộng hệ rễ cây gấp nhiều lần' },
  { question: 'Trồng xen canh chỉ lãng phí đất', answer: false, explanation: 'Xen canh tận dụng đất, giảm sâu bệnh, tăng năng suất' },
];

export function getRandomBossQuestions(count: number): BossQuestion[] {
  const shuffled = [...BOSS_QUESTIONS].sort(() => Math.random() - 0.5);
  return shuffled.slice(0, Math.min(count, shuffled.length));
}
