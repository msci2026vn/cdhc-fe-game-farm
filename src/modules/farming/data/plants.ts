export interface PlantType {
    id: string;
    name: string;
    emoji: string;
    price: number;
    growthTime: string;
}

export const PLANT_TYPES: PlantType[] = [
    { id: 'wheat', name: 'Lúa Mì', emoji: '🌾', price: 50, growthTime: '15 phut' },
    { id: 'tomato', name: 'Cà Chua', emoji: '🍅', price: 200, growthTime: '1 gio' },
    { id: 'carrot', name: 'Cà Rốt', emoji: '🥕', price: 400, growthTime: '3 gio' },
    { id: 'chili', name: 'Ớt', emoji: '🌶️', price: 800, growthTime: '6 gio' },
];

export const getPlantTypeById = (id: string): PlantType | undefined => {
    return PLANT_TYPES.find((p) => p.id === id);
};
