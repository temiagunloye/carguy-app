// src/types/BaseModel.ts
// Type definitions for base car models in Firestore

export interface BaseModel {
    modelId: string;
    displayName: string;
    year: number;
    make: string;
    model: string;
    bodyStyle: string;
    glbUrl: string;
    glbSize: number;
    active: boolean;
    license: {
        type: string;
        source: string;
        attribution: string;
        commercial: boolean;
    };
    metadata: {
        polyCount: number;
        version: string;
        dateAdded: Date | any; // Firestore Timestamp
    };
    tags: string[];
}

export interface BaseModelSnapshot {
    id: string;
    data: BaseModel;
}
