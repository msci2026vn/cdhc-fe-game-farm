import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { restoreTranslation, watchTranslation } from "./shared/utils/translation-cache";
import "./i18n";

import { Suspense } from 'react';

// Khôi phục ngôn ngữ Google Translate đã lưu từ lần trước
restoreTranslation();

const root = createRoot(document.getElementById("root")!);
root.render(
    <Suspense fallback={<div className="h-[100dvh] w-full flex items-center justify-center bg-[#111]"><div className="w-8 h-8 rounded-full border-4 border-farm-brown-dark/30 border-t-farm-brown-dark animate-spin" /></div>}>
        <App />
    </Suspense>
);

// Lắng nghe ngôn ngữ mới → lưu cache
watchTranslation();

