const fs = require('fs');
const path = require('path');

const srcDir = path.join('d:', 'du-an', 'cdhc', 'cdhc-game-vite', 'src');
const localesViPath = path.join(srcDir, 'locales', 'vi', 'common.json');
const localesEnPath = path.join(srcDir, 'locales', 'en', 'common.json');

const viDict = {
    qr_scanner: {
        "title": "Scan QR nhận hàng",
        "instruction": "Chĩa camera vào QR trên phiếu giao hàng",
        "confirming": "Đang xác nhận...",
        "success": "Nhận hàng thành công!",
        "close": "Đóng",
        "error_camera": "Không thể mở camera. Vui lòng cấp quyền camera hoặc nhập mã thủ công.",
        "error_invalid_qr": "QR không hợp lệ. Vui lòng scan lại QR trên phiếu giao hàng.",
        "error_not_farmverse": "QR không phải FARMVERSE. Vui lòng scan QR trên phiếu giao hàng.",
        "error_mismatch": "QR không khớp hộp quà này. Vui lòng kiểm tra lại.",
        "error_missing_data": "QR thiếu dữ liệu. Vui lòng nhập mã thủ công.",
        "error_confirm": "Xác nhận thất bại. Vui lòng thử lại.",
        "retry": "Thử lại"
    },
    blockchain_log: {
        "status_confirmed": "Đã xác nhận",
        "status_processing": "Đang xử lý",
        "status_pending": "Chờ xử lý",
        "status_failed": "Thất bại",
        "copy": "Sao chép",
        "title": "Nhật ký Blockchain",
        "view_snowtrace": "Xem trên Snowtrace",
        "no_batch": "Chưa có batch nào",
        "contract_stats": "Thống kê Contract",
        "view_contract": "Xem Contract"
    },
    blockchain_proof: {
        "title": "Chứng nhận Blockchain",
        "not_delivered": "Chưa nhận hàng",
        "not_delivered_desc": "Nhận hàng trước khi xem chứng nhận blockchain",
        "pending_chain": "Đang chờ ghi blockchain",
        "pending_desc": "Dữ liệu sẽ được ghi lên chain trong vòng 12h",
        "box_week": "Hộp Tuần {{weekNumber}}",
        "received_at": "Đã nhận: "
    },
    manual_verify: {
        "error_length": "Vui lòng nhập đủ 6 số",
        "error_confirm": "Xác nhận thất bại",
        "title": "Nhập mã nhận hàng",
        "success": "Nhận hàng thành công!",
        "instruction": "Nhập mã 6 số trên phiếu giao hàng:",
        "confirm": "Xác nhận",
        "close": "Đóng",
        "cancel": "Hủy"
    },
    my_garden: {
        "history": "Lịch sử nhận rau",
        "claimed": "đã nhận",
        "no_history": "Chưa có lịch sử",
        "title": "Vườn Của Tôi",
        "instruction": "hộp rau/ngày. Bấm \"Nhận quà\" để điền thông tin giao hàng. Khi nhận hàng, bấm \"Scan nhận hàng\" hoặc nhập mã 6 số để xác nhận.",
        "error_load": "Không tải được dữ liệu"
    },
    locked_garden: {
        "title": "Vườn Của Tôi",
        "upgrade_msg": "Nâng cấp VIP để nhận rau hữu cơ",
        "desc": "Rau tươi từ nông trại CDHC giao tận nơi mỗi tuần!",
        "times_per_month": "{{count}} lần/tháng",
        "upgrade_btn": "Nâng cấp VIP"
    },
    camera: {
        "title": "Camera Vườn",
        "live": "Đang phát trực tiếp",
        "offline": "Offline",
        "camera_offline": "Camera đang offline",
        "reconnecting": "Đang thử kết nối lại..."
    }
};

const enDict = {
    qr_scanner: {
        "title": "Scan QR to Claim",
        "instruction": "Point camera at the QR on delivery bill",
        "confirming": "Confirming...",
        "success": "Successfully claimed!",
        "close": "Close",
        "error_camera": "Cannot open camera. Please grand permission or enter code manually.",
        "error_invalid_qr": "Invalid QR. Please scan the QR on the delivery bill again.",
        "error_not_farmverse": "Not a FARMVERSE QR. Please scan the QR on the delivery bill.",
        "error_mismatch": "QR does not match this gift box. Please double check.",
        "error_missing_data": "QR is missing data. Please enter code manually.",
        "error_confirm": "Confirmation failed. Please try again.",
        "retry": "Retry"
    },
    blockchain_log: {
        "status_confirmed": "Confirmed",
        "status_processing": "Processing",
        "status_pending": "Pending",
        "status_failed": "Failed",
        "copy": "Copy",
        "title": "Blockchain Log",
        "view_snowtrace": "View on Snowtrace",
        "no_batch": "No batches yet",
        "contract_stats": "Contract Stats",
        "view_contract": "View Contract"
    },
    blockchain_proof: {
        "title": "Blockchain Proof",
        "not_delivered": "Not Received",
        "not_delivered_desc": "Receive item before viewing blockchain proof",
        "pending_chain": "Pending Blockchain Record",
        "pending_desc": "Data will be recorded to chain within 12h",
        "box_week": "Week {{weekNumber}} Box",
        "received_at": "Received at: "
    },
    manual_verify: {
        "error_length": "Please enter 6 digits",
        "error_confirm": "Confirmation failed",
        "title": "Enter Claim Code",
        "success": "Claim successful!",
        "instruction": "Enter the 6-digit code on the delivery bill:",
        "confirm": "Confirm",
        "close": "Close",
        "cancel": "Cancel"
    },
    my_garden: {
        "history": "Delivery History",
        "claimed": "claimed",
        "no_history": "No history yet",
        "title": "My Garden",
        "instruction": "boxes/day. Click 'Claim Gift' to fill delivery info. Upon receiving, click 'Scan to Claim' or enter 6-digit code to confirm.",
        "error_load": "Cannot load data"
    },
    locked_garden: {
        "title": "My Garden",
        "upgrade_msg": "Upgrade VIP for organic vegetables",
        "desc": "Fresh veggies from CDHC farm delivered to your door weekly!",
        "times_per_month": "{{count}} times/month",
        "upgrade_btn": "Upgrade VIP"
    },
    camera: {
        "title": "Garden Camera",
        "live": "Live Streaming",
        "offline": "Offline",
        "camera_offline": "Camera is offline",
        "reconnecting": "Attempting to reconnect..."
    }
};

[
    { file: localesViPath, dict: viDict },
    { file: localesEnPath, dict: enDict }
].forEach(({ file, dict }) => {
    let content = fs.readFileSync(file, 'utf8');
    const json = JSON.parse(content);
    json.rwa = { ...json.rwa, ...dict };
    fs.writeFileSync(file, JSON.stringify(json, null, 2), 'utf8');
});

function patchFile(filepath, replacements) {
    let content = fs.readFileSync(filepath, 'utf8');
    if (!content.includes("useTranslation")) {
        const importLine = "import { useTranslation } from 'react-i18next';";
        const lines = content.split('\n');
        let lastImport = -1;
        for (let i = 0; i < lines.length; i++) {
            if (lines[i].startsWith('import')) {
                lastImport = i;
            }
        }
        lines.splice(lastImport + 1, 0, importLine);
        content = lines.join('\n');
    }

    if (!content.includes("const { t } = useTranslation()")) {
        content = content.replace(/export default function ([A-Za-z0-9_]+)\([^)]*\) \{/, (match) => match + "\n  const { t } = useTranslation();");
        content = content.replace(/export function ([A-Za-z0-9_]+)\([^)]*\) \{/, (match) => match + "\n  const { t } = useTranslation();");
        content = content.replace(/function ([A-Za-z0-9_]+)\([^)]*\) \{/, (match) => {
            if (match.match(/function (Section|Row|MetricCard|DeliveryInfo)/) || match.includes("CopyButton") || match.includes("CopyBtn")) {
                return match + "\n  const { t } = useTranslation();";
            }
            return match;
        });
        content = content.replace(/const CameraLiveView = \(\) => \{/, (match) => match + "\n  const { t } = useTranslation();");
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

// 6. QrScannerModal
patchFile(path.join(srcDir, 'modules/rwa/components/QrScannerModal.tsx'), [
    [">📷</span> Scan QR nhận hàng", ">📷</span> {t('rwa.qr_scanner.title')}"],
    [">Chĩa camera vào QR trên phiếu giao hàng</p>", ">{t('rwa.qr_scanner.instruction')}</p>"],
    ["Đang xác nhận...", "{t('rwa.qr_scanner.confirming')}"],
    [">Nhận hàng thành công!</p>", ">{t('rwa.qr_scanner.success')}</p>"],
    [">\n                Đóng\n              </button>", ">\n                {t('common.close')}\n              </button>"],
    [">\n            Đóng\n          </button>", ">\n            {t('common.close')}\n          </button>"],
    ["'Không thể mở camera. Vui lòng cấp quyền camera hoặc nhập mã thủ công.'", "t('rwa.qr_scanner.error_camera')"],
    ["'QR không hợp lệ. Vui lòng scan lại QR trên phiếu giao hàng.'", "t('rwa.qr_scanner.error_invalid_qr')"],
    ["'QR không phải FARMVERSE. Vui lòng scan QR trên phiếu giao hàng.'", "t('rwa.qr_scanner.error_not_farmverse')"],
    ["'QR không khớp hộp quà này. Vui lòng kiểm tra lại.'", "t('rwa.qr_scanner.error_mismatch')"],
    ["'QR thiếu dữ liệu. Vui lòng nhập mã thủ công.'", "t('rwa.qr_scanner.error_missing_data')"],
    ["'Xác nhận thất bại. Vui lòng thử lại.'", "t('rwa.qr_scanner.error_confirm')"],
    ["Thử lại\n              </button>", "{t('rwa.qr_scanner.retry')}\n              </button>"]
]);

// 7. BlockchainLog
patchFile(path.join(srcDir, 'modules/rwa/components/BlockchainLog.tsx'), [
    ["label: 'Đã xác nhận'", "label: t('rwa.blockchain_log.status_confirmed')"],
    ["label: 'Đang xử lý'", "label: t('rwa.blockchain_log.status_processing')"],
    ["label: 'Chờ xử lý'", "label: t('rwa.blockchain_log.status_pending')"],
    ["label: 'Thất bại'", "label: t('rwa.blockchain_log.status_failed')"],
    ["title=\"Sao chép\"", "title={t('rwa.blockchain_log.copy')}"],
    ["⛓️</span> Nhật ký Blockchain", "⛓️</span> {t('rwa.blockchain_log.title')}"],
    ["🔗 Xem trên Snowtrace", "🔗 {t('rwa.blockchain_log.view_snowtrace')}"],
    ["Chưa có batch nào", "{t('rwa.blockchain_log.no_batch')}"],
    ["📊 Thống kê Contract", "📊 {t('rwa.blockchain_log.contract_stats')}"],
    ["🔗 Xem Contract", "🔗 {t('rwa.blockchain_log.view_contract')}"]
]);

// 8. BlockchainProofModal
patchFile(path.join(srcDir, 'modules/rwa/components/BlockchainProofModal.tsx'), [
    [">🔗</span> Chứng nhận Blockchain", ">🔗</span> {t('rwa.blockchain_proof.title')}"],
    [">Chưa nhận hàng</p>", ">{t('rwa.blockchain_proof.not_delivered')}</p>"],
    [">Nhận hàng trước khi xem chứng nhận blockchain</p>", ">{t('rwa.blockchain_proof.not_delivered_desc')}</p>"],
    [">Đang chờ ghi blockchain</p>", ">{t('rwa.blockchain_proof.pending_chain')}</p>"],
    [">Dữ liệu sẽ được ghi lên chain trong vòng 12h</p>", ">{t('rwa.blockchain_proof.pending_desc')}</p>"],
    ["Hộp Tuần {weekNumber}", "{t('rwa.blockchain_proof.box_week', { weekNumber })}"],
    ["Đã nhận: {new", "{t('rwa.blockchain_proof.received_at')}{new"],
    ["🔗 Xem trên Snowtrace", "🔗 {t('rwa.delivery_detail.view_snowtrace')}"],
    [">\n            Đóng\n          </button>", ">\n            {t('common.close')}\n          </button>"]
]);

// 9. ManualVerifyModal
patchFile(path.join(srcDir, 'modules/rwa/components/ManualVerifyModal.tsx'), [
    ["'Vui lòng nhập đủ 6 số'", "t('rwa.manual_verify.error_length')"],
    ["'Xác nhận thất bại'", "t('rwa.manual_verify.error_confirm')"],
    [">✏️</span> Nhập mã nhận hàng", ">✏️</span> {t('rwa.manual_verify.title')}"],
    [">Nhận hàng thành công!</p>", ">{t('rwa.manual_verify.success')}</p>"],
    [">Nhập mã 6 số trên phiếu giao hàng:</p>", ">{t('rwa.manual_verify.instruction')}</p>"],
    ["'✅ Xác nhận'", "`✅ ${t('rwa.manual_verify.confirm')}`"],
    [">\n                Đóng\n              </button>", ">\n                {t('common.close')}\n              </button>"],
    [">\n                Hủy\n              </button>", ">\n                {t('common.cancel')}\n              </button>"]
]);

// 10. MyGardenView
patchFile(path.join(srcDir, 'modules/rwa/components/MyGardenView.tsx'), [
    ["Lịch sử nhận rau\n            </span>", "{t('rwa.my_garden.history')}\n            </span>"],
    ["{garden.claimedSlots}/{garden.totalSlots} đã nhận", "{garden.claimedSlots}/{garden.totalSlots} {t('rwa.my_garden.claimed')}"],
    ["{d.deliveredSlots}/{d.totalSlots} đã nhận", "{d.deliveredSlots}/{d.totalSlots} {t('rwa.my_garden.claimed')}"],
    ["Chưa có lịch sử", "{t('rwa.my_garden.no_history')}"],
    [">🌿</span> Vườn Của Tôi", ">🌿</span> {t('rwa.my_garden.title')}"],
    [
        `{garden.deliveriesPerDay} hộp rau/ngày. Bấm "Nhận quà" để điền thông tin giao hàng. Khi nhận hàng, bấm "Scan nhận hàng" hoặc nhập mã 6 số để xác nhận.`,
        `{garden.deliveriesPerDay} {t('rwa.my_garden.instruction')}`
    ]
]);

// 11. LockedGardenView
patchFile(path.join(srcDir, 'modules/rwa/components/LockedGardenView.tsx'), [
    [">🔒</span> Vườn Của Tôi", ">🔒</span> {t('rwa.locked_garden.title')}"],
    ["Nâng cấp VIP để nhận rau hữu cơ", "{t('rwa.locked_garden.upgrade_msg')}"],
    ["Rau tươi từ nông trại CDHC giao tận nơi mỗi tuần!", "{t('rwa.locked_garden.desc')}"],
    ["4 lần/tháng", "{t('rwa.locked_garden.times_per_month', { count: 4 })}"],
    ["8 lần/tháng", "{t('rwa.locked_garden.times_per_month', { count: 8 })}"],
    ["Nâng cấp VIP", "{t('rwa.locked_garden.upgrade_btn')}"]
]);

// 12. CameraLiveView
patchFile(path.join(srcDir, 'modules/rwa/components/CameraLiveView.tsx'), [
    [">Camera Vườn</span>", ">{t('rwa.camera.title')}</span>"],
    ["'Đang phát trực tiếp' : 'Offline'", "t('rwa.camera.live') : t('rwa.camera.offline')"],
    [">Camera đang offline</p>", ">{t('rwa.camera.camera_offline')}</p>"],
    [">Đang thử kết nối lại...</p>", ">{t('rwa.camera.reconnecting')}</p>"]
]);

// 14. MyGardenScreen
patchFile(path.join(srcDir, 'modules/rwa/screens/MyGardenScreen.tsx'), [
    ["Không tải được dữ liệu", "{t('rwa.my_garden.error_load')}"]
]);

console.log('patched_2_and_3');
