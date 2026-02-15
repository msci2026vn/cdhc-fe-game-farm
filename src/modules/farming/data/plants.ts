export interface PlantType {
    id: string;
    name: string;
    emoji: string;
    price: number;
    growthTime: string;
}

export const PLANT_TYPES: PlantType[] = [
    { id: 'tomato', name: 'Cà Chua', emoji: '🍅', price: 200, growthTime: '1h' },
    { id: 'lettuce', name: 'Rau Diếp', emoji: '🥬', price: 150, growthTime: '45m' },
    { id: 'cucumber', name: 'Dưa Leo', emoji: '🥒', price: 180, growthTime: '50m' },
    { id: 'carrot', name: 'Cà Rốt', emoji: '🥕', price: 120, growthTime: '40m' },
    { id: 'chili', name: 'Ớt', emoji: '🌶️', price: 250, growthTime: '1h30' },
    { id: 'corn', name: 'Bắp', emoji: '🌽', price: 160, growthTime: '55m' },
    { id: 'wheat', name: 'Lúa Mì', emoji: '🌾', price: 100, growthTime: '30m' },
    { id: 'sunflower', name: 'Hướng Dương', emoji: '🌻', price: 300, growthTime: '2h' },
];

export const getPlantTypeById = (id: string): PlantType | undefined => {
    return PLANT_TYPES.find((p) => p.id === id);
};
