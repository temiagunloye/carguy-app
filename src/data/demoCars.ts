// src/data/demoCars.ts
// Demo car catalog for free tier users

export interface DemoCarAngle {
    angleKey: string;
    imageUrl: string; // Placeholder for now, will be real assets
}

export interface DemoCar {
    id: string;
    make: string;
    model: string;
    year: number;
    displayName: string;
    thumbnail: string;
    angles: DemoCarAngle[];
    baseModelId?: string;  // Reference to baseModels collection for 3D viewer
}

// 10 required angles
const ANGLE_KEYS = [
    'driver_front',
    'passenger_front',
    'driver_rear',
    'passenger_rear',
    'full_driver_side',
    'full_passenger_side',
    'front_center',
    'rear_center',
    'front_low',
    'rear_low',
];

function generatePlaceholderAngles(carName: string): DemoCarAngle[] {
    return ANGLE_KEYS.map((angleKey) => ({
        angleKey,
        imageUrl: `https://via.placeholder.com/800x600?text=${encodeURIComponent(
            `${carName} ${angleKey}`
        )}`,
    }));
}

// Placeholder demo car data
// In production, these would reference actual 10-angle photo sets
export const DEMO_CARS: DemoCar[] = [
    {
        id: 'demo_porsche_911',
        make: 'Porsche',
        model: '911',
        year: 2024,
        displayName: '2024 Porsche 911 Carrera 4S',
        thumbnail: 'https://via.placeholder.com/400x300?text=Porsche+911',
        angles: generatePlaceholderAngles('Porsche 911'),
        baseModelId: 'porsche_911_2024',  // Links to baseModels collection
    },
    {
        id: 'demo_bmw_m3',
        make: 'BMW',
        model: 'M3',
        year: 2023,
        displayName: '2023 BMW M3 Touring',
        thumbnail: 'https://via.placeholder.com/400x300?text=BMW+M3',
        angles: generatePlaceholderAngles('BMW M3'),
        baseModelId: 'bmw_m3_2023',  // Links to baseModels collection
    },
    {
        id: 'demo_subaru_brz',
        make: 'Subaru',
        model: 'BRZ',
        year: 2022,
        displayName: '2022 Subaru BRZ tS',
        thumbnail: 'https://via.placeholder.com/400x300?text=Subaru+BRZ',
        angles: generatePlaceholderAngles('Subaru BRZ'),
        baseModelId: 'subaru_brz_2022',  // Links to baseModels collection
    },
    // Add 12 more demo cars (total 15)
    ...Array.from({ length: 12 }, (_, i) => ({
        id: `demo_car_${i + 4}`,
        make: 'Generic',
        model: `Model ${i + 4}`,
        year: 2024,
        displayName: `Demo Car ${i + 4}`,
        thumbnail: `https://via.placeholder.com/400x300?text=Demo+Car+${i + 4}`,
        angles: generatePlaceholderAngles(`Demo Car ${i + 4}`),
    })),
];

export function getDemoCarById(id: string): DemoCar | undefined {
    return DEMO_CARS.find((car) => car.id === id);
}
