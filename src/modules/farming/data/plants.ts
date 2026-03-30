export interface PlantType {
    id: string;
    name: string;
    emoji: string;
    icon: string;
    price: number;
    growthTime: string;
}

export const PLANT_TYPES: PlantType[] = [
    { id: 'wheat', name: 'Lúa Mì', emoji: '🌾', icon: '/assets/farm/icon_wheat.png', price: 50, growthTime: '15 phut' },
    { id: 'tomato', name: 'Cà Chua', emoji: '🍅', icon: '/assets/farm/icon_tomato.png', price: 200, growthTime: '1 gio' },
    { id: 'carrot', name: 'Cà Rốt', emoji: '🥕', icon: '/assets/farm/icon_carot.png', price: 400, growthTime: '3 gio' },
    { id: 'chili', name: 'Ớt', emoji: '🌶️', icon: '/assets/farm/icon_chili.png', price: 800, growthTime: '6 gio' },
];

export const getPlantTypeById = (id: string): PlantType | undefined => {
    return PLANT_TYPES.find((p) => p.id === id);
};
