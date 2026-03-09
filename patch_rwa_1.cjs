const fs = require('fs');
const path = require('path');

const srcDir = path.join('d:', 'du-an', 'cdhc', 'cdhc-game-vite', 'src');
const localesViPath = path.join(srcDir, 'locales', 'vi', 'common.json');
const localesEnPath = path.join(srcDir, 'locales', 'en', 'common.json');

const viDict = {
    otp_claim: {
        "title_result": "Đã đăng ký nhận quà!",
        "title_form": "Nhận quà Tuần {{weekNumber}}",
        "review_info": "Thông tin giao hàng:",
        "edit_info": "Chỉnh sửa thông tin",
        "review_note": "Ghi chú cho lần giao này:",
        "review_note_placeholder": "VD: Nhận sau 18h, gửi bảo vệ, cổng B...",
        "review_note_hint": "💡 VD: giờ nhận, cổng vào, gửi bảo vệ...",
        "quick_submit": "Xác nhận nhận quà",
        "cancel": "Hủy",
        "name_label": "Họ tên người nhận *",
        "name_placeholder": "Nguyễn Văn A",
        "name_error_empty": "Vui lòng nhập họ tên (ít nhất 2 ký tự)",
        "name_error_max": "Họ tên tối đa 100 ký tự",
        "phone_label": "Số điện thoại *",
        "phone_error": "Số điện thoại không hợp lệ",
        "address_label": "Địa chỉ giao hàng *",
        "address_placeholder": "456 Đường ABC, Quận 1, TP.HCM",
        "address_error": "Vui lòng nhập địa chỉ đầy đủ (ít nhất 10 ký tự)",
        "note_label": "Ghi chú (tùy chọn)",
        "note_placeholder": "Tầng 3, cổng trái...",
        "otp_display": "Mã nhận hàng của bạn:",
        "expiry": "Hết hạn",
        "copy_btn": "Copy mã",
        "copied": "Đã copy!",
        "toast_copy_success": "Đã copy mã OTP",
        "toast_copy_error": "Không thể copy",
        "deliver_to": "Giao đến",
        "source": "Nguồn gốc",
        "harvest": "Thu hoạch"
    },
    delivery_detail: {
        "title": "Chi tiết nhận hàng",
        "week": "Tuần",
        "delivery_info": "Thông tin nhận hàng",
        "time": "Thời gian",
        "status_received": "Đã nhận",
        "method": "Phương thức",
        "verified": "Đã xác nhận",
        "pending_verify": "Chờ xác nhận",
        "recipient": "Người nhận",
        "name": "Họ tên",
        "phone": "SĐT",
        "address": "Địa chỉ",
        "note": "Ghi chú",
        "product_info": "Sản phẩm",
        "farm": "Nông trại",
        "harvest_date": "Thu hoạch",
        "blockchain": "Blockchain",
        "view_snowtrace": "Xem trên Snowtrace",
        "pending_blockchain": "Đang chờ ghi blockchain",
        "blockchain_note": "Dữ liệu sẽ được ghi lên chain hàng ngày lúc 00:00",
        "no_blockchain_data": "Chưa có dữ liệu blockchain"
    },
    sensor: {
        "status_good": "Tốt",
        "status_warning": "Cảnh báo",
        "status_danger": "Nguy hiểm",
        "seconds_ago": "{{count}} giây trước",
        "minutes_ago": "{{count}} phút trước",
        "hours_ago": "{{count}} giờ trước",
        "title": "Cảm biến Vườn",
        "active": "Đang hoạt động",
        "today": "Hôm nay",
        "no_data_hour": "Không có dữ liệu cho giờ này",
        "go_to_data": "Chuyển đến giờ có dữ liệu",
        "temp": "Nhiệt độ",
        "humidity": "Độ ẩm",
        "light": "Ánh sáng",
        "soil_ph": "pH Đất",
        "soil_moisture": "Độ ẩm đất",
        "readings_count": "{{count}} lần đo trong giờ này",
        "error_load": "Không thể tải dữ liệu cảm biến"
    },
    delivery_slot: {
        "box_index": "Hộp {{index}}",
        "status_available": "Sẵn sàng nhận rau",
        "status_claimed": "Chờ giao hàng",
        "status_shipped": "Đang giao hàng",
        "status_delivered": "Đã nhận",
        "status_expired": "Hết hạn",
        "claim_btn": "Nhận quà",
        "code": "Mã",
        "scan_btn": "Scan nhận hàng",
        "manual_btn": "Nhập mã thủ công",
        "on_chain": "Đã ghi on-chain",
        "pending_chain": "Đang chờ ghi blockchain",
        "view_detail": "Xem chi tiết"
    }
};

const enDict = {
    otp_claim: {
        "title_result": "Gift Registration Successful!",
        "title_form": "Claim Week {{weekNumber}} Gift",
        "review_info": "Delivery Information:",
        "edit_info": "Edit Information",
        "review_note": "Note for this delivery:",
        "review_note_placeholder": "E.g. Deliver after 18:00, leave at security...",
        "review_note_hint": "💡 E.g. delivery time, gate, security...",
        "quick_submit": "Confirm Claim",
        "cancel": "Cancel",
        "name_label": "Recipient Name *",
        "name_placeholder": "John Doe",
        "name_error_empty": "Please enter name (at least 2 characters)",
        "name_error_max": "Name must be under 100 characters",
        "phone_label": "Phone Number *",
        "phone_error": "Invalid phone number",
        "address_label": "Delivery Address *",
        "address_placeholder": "456 ABC Street, District 1, HCMC",
        "address_error": "Please enter full address (at least 10 characters)",
        "note_label": "Note (optional)",
        "note_placeholder": "Floor 3, left gate...",
        "otp_display": "Your Claim Code:",
        "expiry": "Expires",
        "copy_btn": "Copy Code",
        "copied": "Copied!",
        "toast_copy_success": "OTP code copied",
        "toast_copy_error": "Failed to copy",
        "deliver_to": "Deliver To",
        "source": "Origin",
        "harvest": "Harvest"
    },
    delivery_detail: {
        "title": "Delivery Details",
        "week": "Week",
        "delivery_info": "Delivery Info",
        "time": "Time",
        "status_received": "Received",
        "method": "Method",
        "verified": "Verified",
        "pending_verify": "Pending Check",
        "recipient": "Recipient",
        "name": "Name",
        "phone": "Phone",
        "address": "Address",
        "note": "Note",
        "product_info": "Product",
        "farm": "Farm",
        "harvest_date": "Harvest",
        "blockchain": "Blockchain",
        "view_snowtrace": "View on Snowtrace",
        "pending_blockchain": "Pending Blockchain Record",
        "blockchain_note": "Data will be recorded on-chain daily at 00:00",
        "no_blockchain_data": "No blockchain data yet"
    },
    sensor: {
        "status_good": "Good",
        "status_warning": "Warning",
        "status_danger": "Danger",
        "seconds_ago": "{{count}} seconds ago",
        "minutes_ago": "{{count}} minutes ago",
        "hours_ago": "{{count}} hours ago",
        "title": "Garden Sensor",
        "active": "Active",
        "today": "Today",
        "no_data_hour": "No data for this hour",
        "go_to_data": "Go to recorded hour",
        "temp": "Temperature",
        "humidity": "Humidity",
        "light": "Light",
        "soil_ph": "Soil pH",
        "soil_moisture": "Soil Moisture",
        "readings_count": "{{count}} readings this hour",
        "error_load": "Cannot load sensor data"
    },
    delivery_slot: {
        "box_index": "Box {{index}}",
        "status_available": "Ready for Harvest",
        "status_claimed": "Pending Delivery",
        "status_shipped": "Shipping",
        "status_delivered": "Delivered",
        "status_expired": "Expired",
        "claim_btn": "Claim Gift",
        "code": "Code",
        "scan_btn": "Scan to Claim",
        "manual_btn": "Enter Code Manually",
        "on_chain": "Recorded On-Chain",
        "pending_chain": "Pending Blockchain Record",
        "view_detail": "View Details"
    }
};

// Update JSONs
[
    { file: localesViPath, dict: viDict },
    { file: localesEnPath, dict: enDict }
].forEach(({ file, dict }) => {
    let content = fs.readFileSync(file, 'utf8');
    const json = JSON.parse(content);
    json.rwa = { ...json.rwa, ...dict };
    fs.writeFileSync(file, JSON.stringify(json, null, 2), 'utf8');
});

// Helper
function patchFile(filepath, replacements) {
    let content = fs.readFileSync(filepath, 'utf8');
    if (!content.includes("useTranslation")) {
        const importLine = "import { useTranslation } from 'react-i18next';";
        const lines = content.split('\n');

        // Find last import
        let lastImport = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import')) {
                lastImport = i;
            }
        }
        lines.splice(lastImport + 1, 0, importLine);
        content = lines.join('\n');
    }

    // add hook
    if (!content.includes("const { t } = useTranslation()")) {
        // match component export
        content = content.replace(/export default function ([A-Za-z0-9_]+)\([^)]*\) \{/, (match) => {
            return match + "\n  const { t } = useTranslation();";
        });
        content = content.replace(/export function ([A-Za-z0-9_]+)\([^)]*\) \{/, (match) => {
            return match + "\n  const { t } = useTranslation();";
        });
        content = content.replace(/function ([A-Za-z0-9_]+)\([^)]*\) \{/, (match) => {
            // Only add if it's a React component
            if (match.match(/function (Section|Row|MetricCard)/) || match.includes("DeliverySlotCard")) {
                return match + "\n  const { t } = useTranslation();";
            }
            return match;
        });
    }

    replacements.forEach(([from, to]) => {
        if (typeof from === 'string') {
            content = content.split(from).join(to);
        } else {
            content = content.replace(from, to);
        }
    });

    fs.writeFileSync(filepath, content, 'utf8');
}

// 1. OtpClaimModal.tsx
patchFile(path.join(srcDir, 'modules/rwa/components/OtpClaimModal.tsx'), [
    ["'Đã copy mã OTP', 'success'", "t('rwa.otp_claim.toast_copy_success'), 'success'"],
    ["'Không thể copy', 'error'", "t('rwa.otp_claim.toast_copy_error'), 'error'"],
    ["'Đã đăng ký nhận quà!'", "t('rwa.otp_claim.title_result')"],
    ["`Nhận quà Tuần ${weekNumber}`", "t('rwa.otp_claim.title_form', { weekNumber })"],
    [">Thông tin giao hàng:</label>", ">{t('rwa.otp_claim.review_info')}</label>"],
    [">✏️</span> Chỉnh sửa thông tin", ">✏️</span> {t('rwa.otp_claim.edit_info')}"],
    [">Ghi chú cho lần giao này:</label>", ">{t('rwa.otp_claim.review_note')}</label>"],
    ['placeholder="VD: Nhận sau 18h, gửi bảo vệ, cổng B..."', 'placeholder={t("rwa.otp_claim.review_note_placeholder")}'],
    [">💡 VD: giờ nhận, cổng vào, gửi bảo vệ...</p>", ">{t('rwa.otp_claim.review_note_hint')}</p>"],
    ["'Xác nhận nhận quà'", "t('rwa.otp_claim.quick_submit')"],
    [">\n                Hủy\n              </button>", ">\n                {t('common.cancel')}\n              </button>"],
    ["← Quay lại", "{t('rwa.otp_claim.back')}"],
    [">Họ tên người nhận *</label>", ">{t('rwa.otp_claim.name_label')}</label>"],
    ['placeholder="Nguyễn Văn A"', 'placeholder={t("rwa.otp_claim.name_placeholder")}'],
    [">Số điện thoại *</label>", ">{t('rwa.otp_claim.phone_label')}</label>"],
    [">Địa chỉ giao hàng *</label>", ">{t('rwa.otp_claim.address_label')}</label>"],
    ['placeholder="456 Đường ABC, Quận 1, TP.HCM"', 'placeholder={t("rwa.otp_claim.address_placeholder")}'],
    [">Ghi chú (tùy chọn)</label>", ">{t('rwa.otp_claim.note_label')}</label>"],
    ['placeholder="Tầng 3, cổng trái..."', 'placeholder={t("rwa.otp_claim.note_placeholder")}'],
    [">Mã nhận hàng của bạn:</p>", ">{t('rwa.otp_claim.otp_display')}</p>"],
    ["Hết hạn: {formatExpiry(result.expiresAt)}", "{t('rwa.otp_claim.expiry')}: {formatExpiry(result.expiresAt)}"],
    ["'Đã copy!' : 'Copy mã'", "t('rwa.otp_claim.copied') : t('rwa.otp_claim.copy_btn')"],
    [">Giao đến</span>", ">{t('rwa.otp_claim.deliver_to')}</span>"],
    [">Nguồn gốc</span>", ">{t('rwa.otp_claim.source')}</span>"],
    ["Thu hoạch: {result.batchInfo.harvestDate}", "{t('rwa.otp_claim.harvest')} {result.batchInfo.harvestDate}"],
    [">\n                Đóng\n              </button>", ">\n                {t('common.close')}\n              </button>"],
    ["'Vui lòng nhập họ tên (ít nhất 2 ký tự)'", "t('rwa.otp_claim.name_error_empty')"],
    ["'Họ tên tối đa 100 ký tự'", "t('rwa.otp_claim.name_error_max')"],
    ["'Số điện thoại không hợp lệ'", "t('rwa.otp_claim.phone_error')"],
    ["'Vui lòng nhập địa chỉ đầy đủ (ít nhất 10 ký tự)'", "t('rwa.otp_claim.address_error')"]
]);

// 2. DeliveryDetailModal.tsx
patchFile(path.join(srcDir, 'modules/rwa/components/DeliveryDetailModal.tsx'), [
    ["{copied ? '✓ Copied' : '📋'}", "{copied ? `✓ ${t('common.success')}` : '📋'}"],
    ["<span>📦</span> Chi tiết nhận hàng", "<span>📦</span> {t('rwa.delivery_detail.title')}"],
    ["Tuần {weekNumber}", "{t('rwa.delivery_detail.week')} {weekNumber}"],
    ['title="Thông tin nhận hàng"', 'title={t("rwa.delivery_detail.delivery_info")}'],
    ['label="Thời gian"', 'label={t("rwa.delivery_detail.time")}'],
    ["?? 'Đã nhận'", "?? t('rwa.delivery_detail.status_received')"],
    ['label="Phương thức"', 'label={t("rwa.delivery_detail.method")}'],
    ["? 'Đã xác nhận' : 'Chờ xác nhận'", "? t('rwa.delivery_detail.verified') : t('rwa.delivery_detail.pending_verify')"],
    ['title="Người nhận"', 'title={t("rwa.delivery_detail.recipient")}'],
    ['label="Họ tên"', 'label={t("rwa.delivery_detail.name")}'],
    ['label="SĐT"', 'label={t("rwa.delivery_detail.phone")}'],
    ['label="Địa chỉ"', 'label={t("rwa.delivery_detail.address")}'],
    ['label="Ghi chú"', 'label={t("rwa.delivery_detail.note")}'],
    ['title="Sản phẩm"', 'title={t("rwa.delivery_detail.product_info")}'],
    ['label="Sản phẩm"', 'label={t("rwa.delivery_detail.product_info")}'],
    ['label="Nông trại"', 'label={t("rwa.delivery_detail.farm")}'],
    ['label="Thu hoạch"', 'label={t("rwa.delivery_detail.harvest_date")}'],
    ['title="Blockchain"', 'title={t("rwa.delivery_detail.blockchain")}'],
    ["🔍 Xem trên Snowtrace", "🔍 {t('rwa.delivery_detail.view_snowtrace')}"],
    [">⏳ Đang chờ ghi blockchain</p>", ">{t('rwa.delivery_detail.pending_blockchain')}</p>"],
    [">Dữ liệu sẽ được ghi lên chain hàng ngày lúc 00:00</p>", ">{t('rwa.delivery_detail.blockchain_note')}</p>"],
    [">Chưa có dữ liệu blockchain</p>", ">{t('rwa.delivery_detail.no_blockchain_data')}</p>"],
    [">\n            Đóng\n          </button>", ">\n            {t('common.close')}\n          </button>"]
]);

// 3. SensorTimeline.tsx
patchFile(path.join(srcDir, 'modules/rwa/components/SensorTimeline.tsx'), [
    ["label: 'Tốt'", "label: t('rwa.sensor.status_good')"],
    ["label: 'Cảnh báo'", "label: t('rwa.sensor.status_warning')"],
    ["label: 'Nguy hiểm'", "label: t('rwa.sensor.status_danger')"],
    ["`${seconds} giây trước`", "t('rwa.sensor.seconds_ago', { count: seconds })"],
    ["`${minutes} phút trước`", "t('rwa.sensor.minutes_ago', { count: minutes })"],
    ["`${hours} giờ trước`", "t('rwa.sensor.hours_ago', { count: hours })"],
    [">Cảm biến Vườn</h3>", ">{t('rwa.sensor.title')}</h3>"],
    [">\n                Hôm nay\n              </button>", ">\n                {t('rwa.sensor.today')}\n              </button>"],
    [">Không có dữ liệu cho giờ này</p>", ">{t('rwa.sensor.no_data_hour')}</p>"],
    [">\n                  Chuyển đến giờ có dữ liệu\n                </button>", ">\n                  {t('rwa.sensor.go_to_data')}\n                </button>"],
    ['label="Nhiệt độ"', 'label={t("rwa.sensor.temp")}'],
    ['label="Độ ẩm"', 'label={t("rwa.sensor.humidity")}'],
    ['label="Ánh sáng"', 'label={t("rwa.sensor.light")}'],
    ['label="pH Đất"', 'label={t("rwa.sensor.soil_ph")}'],
    ['label="Độ ẩm đất"', 'label={t("rwa.sensor.soil_moisture")}'],
    ["{currentHourData.readingCount} lần đo trong giờ này", "{t('rwa.sensor.readings_count', { count: currentHourData.readingCount })}"],
    // For the hook in pure function
    ["function timeAgo(dateStr: string): string {", "function timeAgo(dateStr: string, t: any): string {"],
    ["timeAgo(latestReading.recordedAt)", "timeAgo(latestReading.recordedAt, t)"]
]);

// 4. DeliverySlotCard.tsx
patchFile(path.join(srcDir, 'modules/rwa/components/DeliverySlotCard.tsx'), [
    ["label: 'Sẵn sàng nhận rau'", "label: t('rwa.delivery_slot.status_available')"],
    ["label: 'Chờ giao hàng'", "label: t('rwa.delivery_slot.status_claimed')"],
    ["label: 'Đang giao hàng'", "label: t('rwa.delivery_slot.status_shipped')"],
    ["label: 'Đã nhận'", "label: t('rwa.delivery_slot.status_delivered')"],
    ["label: 'Hết hạn'", "label: t('rwa.delivery_slot.status_expired')"],
    ["Hộp {index + 1}", "{t('rwa.delivery_slot.box_index', { index: index + 1 })}"],
    ["🎁 Nhận quà<", "🎁 {t('rwa.delivery_slot.claim_btn')}<"],
    ["Mã: {slot.otpCode}", "{t('rwa.delivery_slot.code')}: {slot.otpCode}"],
    ["📷 Scan nhận hàng", "📷 {t('rwa.delivery_slot.scan_btn')}"],
    ["✏️ Nhập mã thủ công", "✏️ {t('rwa.delivery_slot.manual_btn')}"],
    ["Đã nhận'", "t('rwa.delivery_detail.status_received')'"],
    ["🔗 Đã ghi on-chain ✅", "🔗 {t('rwa.delivery_slot.on_chain')} ✅"],
    ["⏳ Đang chờ ghi blockchain", "⏳ {t('rwa.delivery_slot.pending_chain')}"],
    ["📋 Xem chi tiết", "📋 {t('rwa.delivery_slot.view_detail')}"] // wait I need to be careful with component hooks 
]);

// 5. SensorDashboard.tsx
patchFile(path.join(srcDir, 'modules/rwa/components/SensorDashboard.tsx'), [
    ["label: 'Tốt'", "label: t('rwa.sensor.status_good')"],
    ["label: 'Cảnh báo'", "label: t('rwa.sensor.status_warning')"],
    ["label: 'Nguy hiểm'", "label: t('rwa.sensor.status_danger')"],
    ["function timeAgo(dateStr: string): string {", "function timeAgo(dateStr: string, t: any): string {"],
    ["`${seconds} giây trước`", "t('rwa.sensor.seconds_ago', { count: seconds })"],
    ["`${minutes} phút trước`", "t('rwa.sensor.minutes_ago', { count: minutes })"],
    ["`${hours} giờ trước`", "t('rwa.sensor.hours_ago', { count: hours })"],
    ["Không thể tải dữ liệu cảm biến", "{t('rwa.sensor.error_load')}"],
    ["Cảm biến Vườn", "{t('rwa.sensor.title')}"],
    ["&middot; Đang hoạt động", "&middot; {t('rwa.sensor.active')}"],
    ["timeAgo(reading.recordedAt)", "timeAgo(reading.recordedAt, t)"],
    ['label="Nhiệt độ"', 'label={t("rwa.sensor.temp")}'],
    ['label="Độ ẩm"', 'label={t("rwa.sensor.humidity")}'],
    ['label="Ánh sáng"', 'label={t("rwa.sensor.light")}'],
    ['label="pH Đất"', 'label={t("rwa.sensor.soil_ph")}'],
    ['label="Độ ẩm đất"', 'label={t("rwa.sensor.soil_moisture")}']
]);

console.log('patched');
