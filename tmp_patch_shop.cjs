const fs = require('fs');
let file = fs.readFileSync('src/modules/shop/components/AutoPlayShopSection.tsx', 'utf8');

// 1. Add import
file = file.replace("import { useState } from 'react';", "import { useState } from 'react';\nimport { useTranslation } from 'react-i18next';");

// 2. PkgMeta
file = file.replace('nameVi: string;', 'nameKey: string;');
file = file.replace(/nameVi: 'Thông minh'/g, "nameKey: 'autoplay_smart'");
file = file.replace(/nameVi: 'Nâng cao'/g, "nameKey: 'autoplay_advanced'");
file = file.replace(/nameVi: 'Chuyên gia'/g, "nameKey: 'autoplay_expert'");
file = file.replace(/nameVi: 'Tối thượng'/g, "nameKey: 'autoplay_ultimate'");
file = file.replace(/{ nameVi: 'Cơ bản', icon: '🤖', color: '#9ca3af' },/, "{ nameKey: 'autoplay_basic', icon: '🤖', color: '#9ca3af' },");
file = file.replace(/{ nameVi: 'Thông minh', icon: '🧠', color: '#3b82f6' },/, "{ nameKey: 'autoplay_smart', icon: '🧠', color: '#3b82f6' },");
file = file.replace(/{ nameVi: 'Nâng cao', icon: '⚡', color: '#8b5cf6' },/, "{ nameKey: 'autoplay_advanced', icon: '⚡', color: '#8b5cf6' },");
file = file.replace(/{ nameVi: 'Chuyên gia', icon: '🎯', color: '#f59e0b' },/, "{ nameKey: 'autoplay_expert', icon: '🎯', color: '#f59e0b' },");
file = file.replace(/{ nameVi: 'Tối thượng', icon: '🧠✨', color: '#ec4899' },/, "{ nameKey: 'autoplay_ultimate', icon: '🧠✨', color: '#ec4899' },");
file = file.replace(/Record<number, \{ nameVi: string; icon: string; color: string \}>/, "Record<number, { nameKey: string; icon: string; color: string }>");

// 3. init t
file = file.replace('export default function AutoPlayShopSection() {', "export default function AutoPlayShopSection() {\n  const { t } = useTranslation();");

// 4. Features
file = file.replace("'Auto kỹ năng'", "'Auto skill'");
file = file.replace("'Toàn bộ kỹ năng'", "'All skills'");

// 5. error handling
file = file.replace("'Thanh toán thất bại'", "t('payment_failed')");
file = file.replace("'Không thể chuẩn bị giao dịch'", "t('prepare_tx_error')");
file = file.replace(/'Lỗi xác nhận giao dịch'/g, "t('verify_tx_error')");
file = file.replace("'Lỗi Smart Wallet'", "t('smart_wallet_error')");
file = file.replace("'Giao dịch thất bại'", "t('tx_failed')");
file = file.replace("'Xác minh thất bại'", "t('verify_failed')");

// 6. toast 'Không đủ OGN' -> `t('not_enough_ogn')`
file = file.replace(/toast\.error\('Không đủ OGN'\)/g, "toast.error(t('not_enough_ogn'))");
file = file.replace(/'Không đủ OGN'/g, "t('not_enough_ogn')");

// 7. Buttons and rendering texts
file = file.replace('Đã mua vĩnh viễn ✅', "{t('purchased_permanently')}");
file = file.replace("Đang thuê ✅{daysUntilExpiry !== null ? ` (${daysUntilExpiry}d)` : ''}", "{t('renting_status', { daysText: daysUntilExpiry !== null ? ` (${daysUntilExpiry}d)` : '' })}");
file = file.replace("{canAfford ? `Thuê 7 ngày` : t('not_enough_ogn')}", "{canAfford ? t('rent_7_days') : t('not_enough_ogn')}");
file = file.replace('Đã mua ✅', "{t('purchased_status')}");
file = file.replace('{avaxPrice} AVAX — Vĩnh viễn', "{t('price_permanent', { price: avaxPrice })}");
file = file.replace('{pkg.algorithm} — {pkg.nameVi}', "{pkg.algorithm} — {t(pkg.nameKey)}");
file = file.replace("🪙 {prices?.rent[pkg.level]?.toLocaleString() ?? '—'} OGN / tuần", "{t('rent_price_per_week', { price: prices?.rent[pkg.level]?.toLocaleString() ?? '—' })}");

// 8. Texts
file = file.replace('Đang dùng: Lv.{effectiveLevel} {currentInfo.nameVi} {currentInfo.icon}', "{t('current_using', { level: effectiveLevel, name: t(currentInfo.nameKey), icon: currentInfo.icon })}");
file = file.replace("· Thuê còn {daysUntilExpiry}d", "{t('rent_remaining_days', { days: daysUntilExpiry })}");
file = file.replace("· Mua: Lv.{purchasedLevel}", "{t('purchased_level_info', { level: purchasedLevel })}");
file = file.replace("📚 AI Learning", "{t('ai_learning_btn')}");
file = file.replace("Hide", "{t('hide')}");
file = file.replace("'Hide' : {t('ai_learning_btn')}", "t('hide') : t('ai_learning_btn')");
file = file.replace("'Hide' : '📚 AI Learning'", "t('hide') : t('ai_learning_btn')");
file = file.replace(">Self-Learning Data<", ">{t('self_learning_data')}<");
file = file.replace(">Reset<", ">{t('reset')}<");
file = file.replace("'🪙 Thuê OGN'", "t('rent_ogn_tab')");
file = file.replace("'💎 Mua AVAX'", "t('buy_avax_tab')");
file = file.replace("OGN hiện có: 🪙 {ogn.toLocaleString()}", "{t('current_ogn_balance', { balance: ogn.toLocaleString() })}");
file = file.replace(">Xác nhận thuê Auto AI<", ">{t('confirm_rent_ai')}<");
file = file.replace(">Trừ:<", ">{t('deduct_label')}<");
file = file.replace(">Thời hạn:<", ">{t('duration_label')}<");
file = file.replace(">7 ngày<", ">{t('duration_7_days')}<");
file = file.replace(">OGN còn lại:<", ">{t('remaining_ogn_label')}<");
file = file.replace("⚠️ Sẽ thay thế thuê Lv.{rentedLevel} hiện tại", "{t('replace_renting_warning', { level: rentedLevel })}");
file = file.replace(">Hủy<", ">{t('cancel')}<");
file = file.replace("'...' : '✅ Xác nhận'", "'...' : t('confirm_btn_action')");

file = file.replace(">Mua Auto AI vĩnh viễn<", ">{t('buy_ai_permanent')}<");
file = file.replace(">Đang xử lý thanh toán...<", ">{t('processing_payment')}<");
file = file.replace("Xác thực vân tay để gửi {prices?.buy[buyTarget.level]} AVAX", "{t('fingerprint_auth_prompt', { amount: prices?.buy[buyTarget.level] })}");
file = file.replace(/>Xác thực vân tay</, ">{t('fingerprint_auth_btn')}<");
file = file.replace(/>Quay lại</g, ">{t('go_back_label')}<");
file = file.replace("Ví FARMVERSE ({parseFloat(custodialWallet.balance || '0').toFixed(4)} AVAX)", "{t('farmverse_wallet', { balance: parseFloat(custodialWallet.balance || '0').toFixed(4) })}");
file = file.replace(">Số dư ví không đủ<", ">{t('insufficient_wallet_balance')}<");
file = file.replace(/>Smart Wallet</, ">{t('smart_wallet_btn')}<");
file = file.replace(/>Đang chuẩn bị...</, ">{t('preparing_status')}<");
file = file.replace(/>Gửi từ ví khác \(nhập txHash\)</, ">{t('manual_transfer_btn')}<");
file = file.replace("Bước 1: Gửi {prices.buy[buyTarget.level]} AVAX đến:", "{t('manual_step1', { amount: prices.buy[buyTarget.level] })}");
file = file.replace(">Bước 2: Nhập Transaction Hash:<", ">{t('manual_step2')}<");
file = file.replace(/>Xác nhận giao dịch</, ">{t('verify_tx_btn')}<");
file = file.replace("'Đang xác nhận...' : 'Xác nhận giao dịch'", "t('verifying_status') : t('verify_tx_btn')");

fs.writeFileSync('src/modules/shop/components/AutoPlayShopSection.tsx', file, 'utf8');
console.log('Update Complete.');
