export interface PlantType {
    id: string;
    name: string;
    emoji: string;
    price: number;
    growthTime: string;
}

export const PLANT_TYPES: PlantType[] = [
    { id: 'wheat', name: 'Lúa Mì', emoji: '🌾', price: 50, growthTime: '30s' },
    { id: 'tomato', name: 'Cà Chua', emoji: '🍅', price: 200, growthTime: '2m' },
    { id: 'carrot', name: 'Cà Rốt', emoji: '🥕', price: 280, growthTime: '2m30' },
    { id: 'chili', name: 'Ớt', emoji: '🌶️', price: 400, growthTime: '3m20' },
];

export const getPlantTypeById = (id: string): PlantType | undefined => {
    return PLANT_TYPES.find((p) => p.id === id);
};
