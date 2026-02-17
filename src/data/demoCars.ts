// src/data/demoCars.ts
// Demo car catalog for free tier users
import { Image } from 'react-native';

export interface DemoCarAngle {
    angleKey: string;
    imageUrl: string;
}

export interface DemoCar {
    id: string;
    make: string;
    model: string;
    year: number;
    displayName: string;
    thumbnail: string;
    angles: DemoCarAngle[];
    baseModelId?: string;
}

export const DEMO_CARS: DemoCar[] = [
    // --- TOP 5 WEBSITE MODELS ---
    {
        id: 'audi_rs6_standard_grey',
        make: 'Audi',
        model: 'RS6 Avant',
        year: 2024,
        displayName: 'Audi RS6 (Standard Grey)',
        thumbnail: Image.resolveAssetSource(require('../../assets/cars/audi_rs6_standard/angle_01.png')).uri,
        angles: [
            { angleKey: 'driver_front', imageUrl: Image.resolveAssetSource(require('../../assets/cars/audi_rs6_standard/angle_01.png')).uri },
            { angleKey: 'front_center', imageUrl: Image.resolveAssetSource(require('../../assets/cars/audi_rs6_standard/angle_02.png')).uri },
            { angleKey: 'passenger_front', imageUrl: Image.resolveAssetSource(require('../../assets/cars/audi_rs6_standard/angle_03.png')).uri },
            { angleKey: 'full_passenger_side', imageUrl: Image.resolveAssetSource(require('../../assets/cars/audi_rs6_standard/angle_04.png')).uri },
            { angleKey: 'passenger_rear', imageUrl: Image.resolveAssetSource(require('../../assets/cars/audi_rs6_standard/angle_05.png')).uri },
            { angleKey: 'rear_center', imageUrl: Image.resolveAssetSource(require('../../assets/cars/audi_rs6_standard/angle_06.png')).uri },
            { angleKey: 'driver_rear', imageUrl: Image.resolveAssetSource(require('../../assets/cars/audi_rs6_standard/angle_07.png')).uri },
            { angleKey: 'full_driver_side', imageUrl: Image.resolveAssetSource(require('../../assets/cars/audi_rs6_standard/angle_08.png')).uri },
            { angleKey: 'front_low', imageUrl: Image.resolveAssetSource(require('../../assets/cars/audi_rs6_standard/angle_09.png')).uri },
            { angleKey: 'rear_low', imageUrl: Image.resolveAssetSource(require('../../assets/cars/audi_rs6_standard/angle_10.png')).uri },
        ],
        baseModelId: 'AUDI_RS6',
    },
    {
        id: 'subaru_brz_standard_blue',
        make: 'Subaru',
        model: 'BRZ',
        year: 2024,
        displayName: 'Subaru BRZ (Standard Blue)',
        thumbnail: Image.resolveAssetSource(require('../../assets/cars/subaru_brz_blue/subaru_brz_driver_front_1769334531869.png')).uri,
        angles: [
            { angleKey: 'driver_front', imageUrl: Image.resolveAssetSource(require('../../assets/cars/subaru_brz_blue/subaru_brz_driver_front_1769334531869.png')).uri },
            { angleKey: 'passenger_front', imageUrl: Image.resolveAssetSource(require('../../assets/cars/subaru_brz_blue/subaru_brz_passenger_front_1769334543245.png')).uri },
            { angleKey: 'full_driver_side', imageUrl: Image.resolveAssetSource(require('../../assets/cars/subaru_brz_blue/subaru_brz_full_driver_side_1769334557740.png')).uri },
            { angleKey: 'full_passenger_side', imageUrl: Image.resolveAssetSource(require('../../assets/cars/subaru_brz_blue/subaru_brz_full_passenger_side_1769334575449.png')).uri },
            { angleKey: 'driver_rear', imageUrl: Image.resolveAssetSource(require('../../assets/cars/subaru_brz_blue/subaru_brz_driver_rear_1769334593703.png')).uri },
            { angleKey: 'passenger_rear', imageUrl: Image.resolveAssetSource(require('../../assets/cars/subaru_brz_blue/subaru_brz_passenger_rear_1769334606663.png')).uri },
            { angleKey: 'front_center', imageUrl: Image.resolveAssetSource(require('../../assets/cars/subaru_brz_blue/subaru_brz_front_center_1769334620607.png')).uri },
            { angleKey: 'rear_center', imageUrl: Image.resolveAssetSource(require('../../assets/cars/subaru_brz_blue/subaru_brz_rear_center_1769348339065.png')).uri },
            { angleKey: 'front_low', imageUrl: Image.resolveAssetSource(require('../../assets/cars/subaru_brz_blue/subaru_brz_front_low_1769352490174.png')).uri },
            { angleKey: 'rear_low', imageUrl: Image.resolveAssetSource(require('../../assets/cars/subaru_brz_blue/subaru_brz_rear_low_1769352507236.png')).uri },
        ],
        baseModelId: 'SUBARU_BRZ_2022',
    },
    {
        id: 'bmw_m3_custom_white',
        make: 'BMW',
        model: 'M3',
        year: 2023,
        displayName: 'BMW M3 (White)',
        thumbnail: Image.resolveAssetSource(require('../../assets/cars/bmw_m3/angle_08.png')).uri,
        angles: [
            { angleKey: 'full_passenger_side', imageUrl: Image.resolveAssetSource(require('../../assets/cars/bmw_m3/angle_04.png')).uri },
            { angleKey: 'passenger_rear', imageUrl: Image.resolveAssetSource(require('../../assets/cars/bmw_m3/angle_05.png')).uri },
            { angleKey: 'rear_center', imageUrl: Image.resolveAssetSource(require('../../assets/cars/bmw_m3/angle_06.png')).uri },
            { angleKey: 'driver_rear', imageUrl: Image.resolveAssetSource(require('../../assets/cars/bmw_m3/angle_07.png')).uri },
            { angleKey: 'full_driver_side', imageUrl: Image.resolveAssetSource(require('../../assets/cars/bmw_m3/angle_08.png')).uri },
            { angleKey: 'front_low', imageUrl: Image.resolveAssetSource(require('../../assets/cars/bmw_m3/angle_09.png')).uri },
            { angleKey: 'rear_low', imageUrl: Image.resolveAssetSource(require('../../assets/cars/bmw_m3/angle_10.png')).uri },
        ],
        baseModelId: 'bmw_m3_2023',
    },
    {
        id: 'subaru_brz_custom_grey',
        make: 'Subaru',
        model: 'BRZ',
        year: 2022,
        displayName: 'Subaru BRZ (Grey)',
        thumbnail: Image.resolveAssetSource(require('../../assets/cars/subaru_brz_grey/angle_01.png')).uri,
        angles: [
            { angleKey: 'driver_front', imageUrl: Image.resolveAssetSource(require('../../assets/cars/subaru_brz_grey/angle_01.png')).uri },
            { angleKey: 'front_center', imageUrl: Image.resolveAssetSource(require('../../assets/cars/subaru_brz_grey/angle_02.png')).uri },
            { angleKey: 'passenger_front', imageUrl: Image.resolveAssetSource(require('../../assets/cars/subaru_brz_grey/angle_03.png')).uri },
            { angleKey: 'full_passenger_side', imageUrl: Image.resolveAssetSource(require('../../assets/cars/subaru_brz_grey/angle_04.png')).uri },
            { angleKey: 'passenger_rear', imageUrl: Image.resolveAssetSource(require('../../assets/cars/subaru_brz_grey/angle_05.png')).uri },
            { angleKey: 'rear_center', imageUrl: Image.resolveAssetSource(require('../../assets/cars/subaru_brz_grey/angle_06.png')).uri },
            { angleKey: 'driver_rear', imageUrl: Image.resolveAssetSource(require('../../assets/cars/subaru_brz_grey/angle_07.png')).uri },
            { angleKey: 'full_driver_side', imageUrl: Image.resolveAssetSource(require('../../assets/cars/subaru_brz_grey/angle_08.png')).uri },
            { angleKey: 'front_low', imageUrl: Image.resolveAssetSource(require('../../assets/cars/subaru_brz_grey/angle_09.png')).uri },
            { angleKey: 'rear_low', imageUrl: Image.resolveAssetSource(require('../../assets/cars/subaru_brz_grey/angle_10.png')).uri },
        ],
        baseModelId: 'SUBARU_BRZ_2022',
    },
    {
        id: 'mercedes_c63_stock',
        make: 'Mercedes-AMG',
        model: 'C63 S',
        year: 2024,
        displayName: 'Mercedes-AMG C63',
        thumbnail: Image.resolveAssetSource(require('../../assets/cars/mercedes_c63/angle_01.png')).uri,
        angles: [
            { angleKey: 'driver_front', imageUrl: Image.resolveAssetSource(require('../../assets/cars/mercedes_c63/angle_01.png')).uri },
            { angleKey: 'front_center', imageUrl: Image.resolveAssetSource(require('../../assets/cars/mercedes_c63/angle_02.png')).uri },
            { angleKey: 'passenger_front', imageUrl: Image.resolveAssetSource(require('../../assets/cars/mercedes_c63/angle_03.png')).uri },
            { angleKey: 'full_passenger_side', imageUrl: Image.resolveAssetSource(require('../../assets/cars/mercedes_c63/angle_04.png')).uri },
            { angleKey: 'passenger_rear', imageUrl: Image.resolveAssetSource(require('../../assets/cars/mercedes_c63/angle_05.png')).uri },
            { angleKey: 'rear_center', imageUrl: Image.resolveAssetSource(require('../../assets/cars/mercedes_c63/angle_06.png')).uri },
            { angleKey: 'driver_rear', imageUrl: Image.resolveAssetSource(require('../../assets/cars/mercedes_c63/angle_07.png')).uri },
            { angleKey: 'full_driver_side', imageUrl: Image.resolveAssetSource(require('../../assets/cars/mercedes_c63/angle_08.png')).uri },
            { angleKey: 'front_low', imageUrl: Image.resolveAssetSource(require('../../assets/cars/mercedes_c63/angle_09.png')).uri },
            { angleKey: 'rear_low', imageUrl: Image.resolveAssetSource(require('../../assets/cars/mercedes_c63/angle_10.png')).uri },
        ],
        baseModelId: 'MERCEDES_C63',
    },

    // --- OTHER CURATED ---
    {
        id: 'audi_rs6_custom_blue',
        make: 'Audi',
        model: 'RS6 Avant',
        year: 2024,
        displayName: 'Audi RS6 Avant (Custom Blue)',
        thumbnail: Image.resolveAssetSource(require('../../assets/cars/audi_rs6_custom/angle_01.png')).uri,
        angles: [
            { angleKey: 'driver_front', imageUrl: Image.resolveAssetSource(require('../../assets/cars/audi_rs6_custom/angle_01.png')).uri },
            { angleKey: 'front_center', imageUrl: Image.resolveAssetSource(require('../../assets/cars/audi_rs6_custom/angle_02.png')).uri },
            { angleKey: 'passenger_front', imageUrl: Image.resolveAssetSource(require('../../assets/cars/audi_rs6_custom/angle_03.png')).uri },
            { angleKey: 'full_passenger_side', imageUrl: Image.resolveAssetSource(require('../../assets/cars/audi_rs6_custom/angle_04.png')).uri },
            { angleKey: 'passenger_rear', imageUrl: Image.resolveAssetSource(require('../../assets/cars/audi_rs6_custom/angle_05.png')).uri },
            { angleKey: 'rear_center', imageUrl: Image.resolveAssetSource(require('../../assets/cars/audi_rs6_custom/angle_06.png')).uri },
        ],
        baseModelId: 'AUDI_RS6',
    },
    {
        id: 'porsche_manthey_green',
        make: 'Porsche',
        model: '911 GT3',
        year: 2024,
        displayName: 'Porsche 911 GT3 MR (Green)',
        thumbnail: Image.resolveAssetSource(require('../../assets/cars/porsche_manthey/angle_01.png')).uri,
        angles: [
            { angleKey: 'driver_front', imageUrl: Image.resolveAssetSource(require('../../assets/cars/porsche_manthey/angle_01.png')).uri },
            { angleKey: 'front_center', imageUrl: Image.resolveAssetSource(require('../../assets/cars/porsche_manthey/angle_02.png')).uri },
            { angleKey: 'passenger_front', imageUrl: Image.resolveAssetSource(require('../../assets/cars/porsche_manthey/angle_03.png')).uri },
            { angleKey: 'full_passenger_side', imageUrl: Image.resolveAssetSource(require('../../assets/cars/porsche_manthey/angle_04.png')).uri },
            { angleKey: 'passenger_rear', imageUrl: Image.resolveAssetSource(require('../../assets/cars/porsche_manthey/angle_05.png')).uri },
            { angleKey: 'rear_center', imageUrl: Image.resolveAssetSource(require('../../assets/cars/porsche_manthey/angle_06.png')).uri },
            { angleKey: 'driver_rear', imageUrl: Image.resolveAssetSource(require('../../assets/cars/porsche_manthey/angle_07.png')).uri },
            { angleKey: 'full_driver_side', imageUrl: Image.resolveAssetSource(require('../../assets/cars/porsche_manthey/angle_08.png')).uri },
            { angleKey: 'front_low', imageUrl: Image.resolveAssetSource(require('../../assets/cars/porsche_manthey/angle_09.png')).uri },
            { angleKey: 'rear_low', imageUrl: Image.resolveAssetSource(require('../../assets/cars/porsche_manthey/angle_10.png')).uri },
        ],
        baseModelId: 'PORSCHE_MANTHEY',
    },
];

export function getDemoCarById(id: string): DemoCar | undefined {
    return DEMO_CARS.find((car) => car.id === id);
}
