// Vietnamese names + exchange for each commodity ID
export const COMMODITY_VI: Record<string, { name: string; subname: string }> = {
    WHEAT: { name: 'Lúa mì', subname: 'Sàn CBOT' },
    CORN: { name: 'Ngô', subname: 'Sàn CBOT' },
    COFFEE: { name: 'Cà phê', subname: 'Sàn ICE' },
    COTTON: { name: 'Bông vải', subname: 'Sàn ICE' },
    SUGAR: { name: 'Đường', subname: 'Sàn ICE' },
};

// Material icon + colour per commodity
export const COMMODITY_ICON: Record<string, { icon: string; bg: string; border: string; text: string }> = {
    WHEAT: { icon: 'grain', bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700' },
    CORN: { icon: 'grain', bg: 'bg-yellow-100', border: 'border-yellow-300', text: 'text-yellow-700' },
    COFFEE: { icon: 'coffee', bg: 'bg-amber-100', border: 'border-amber-300', text: 'text-amber-800' },
    COTTON: { icon: 'water_drop', bg: 'bg-sky-100', border: 'border-sky-300', text: 'text-sky-600' },
    SUGAR: { icon: 'nutrition', bg: 'bg-orange-100', border: 'border-orange-300', text: 'text-orange-700' },
};

export const DEFAULT_ICON = { icon: 'eco', bg: 'bg-green-100', border: 'border-green-300', text: 'text-green-700' };
