import { createRoot } from "react-dom/client";
import App from "./App.tsx";
import "./index.css";
import { restoreTranslation, watchTranslation } from "./shared/utils/translation-cache";
import "./i18n";

// Khôi phục ngôn ngữ Google Translate đã lưu từ lần trước
restoreTranslation();

const root = createRoot(document.getElementById("root")!);
root.render(<App />);

// Lắng nghe ngôn ngữ mới → lưu cache
watchTranslation();

