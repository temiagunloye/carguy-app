// src/services/DemoSandboxService.ts

import { deleteDoc, doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { getDb } from './firebaseConfig';

/**
 * Service for enforcing free tier limits in the sandbox try-on experience
 * MAX 3 saved parts (paint + wheels + one cosmetic)
 * Only 1 active build at a time
 */

export interface UserBuild {
    mode: 'standardDealer';
    standardCarId: string;
    selectedPaintVariantId: string;
    selectedWheelsId?: string;
    selectedCosmeticId?: string;
    savedPartsCount: number;
    updatedAt: any;
}

export type PartType = 'paint' | 'wheels' | 'cosmetic';

class DemoSandboxService {
    private db = getDb();

    /**
     * Get the user's active build (free tier has only 1 slot)
     */
    async getActiveBuild(userId: string): Promise<UserBuild | null> {
        if (!this.db) throw new Error('Firestore not initialized');

        const buildRef = doc(this.db, `users/${userId}/builds/activeBuild`);
        const buildSnap = await getDoc(buildRef);

        if (!buildSnap.exists()) {
            return null;
        }

        return buildSnap.data() as UserBuild;
    }

    /**
     * Check if user can save a part (max 3 parts total)
     */
    async canSavePart(userId: string, partType: PartType): Promise<boolean> {
        const build = await this.getActiveBuild(userId);

        if (!build) {
            // No build yet, can always save
            return true;
        }

        // Count currently saved parts
        let currentCount = 0;
        if (build.selectedPaintVariantId) currentCount++;
        if (build.selectedWheelsId) currentCount++;
        if (build.selectedCosmeticId) currentCount++;

        // Check if adding this part would exceed limit
        const partAlreadySaved = this.isPartSaved(build, partType);

        if (partAlreadySaved) {
            // Replacing existing part of same type is allowed
            return true;
        }

        // Adding new part type
        return currentCount < 3;
    }

    /**
     * Helper to check if a part type is already saved
     */
    private isPartSaved(build: UserBuild, partType: PartType): boolean {
        switch (partType) {
            case 'paint':
                return !!build.selectedPaintVariantId;
            case 'wheels':
                return !!build.selectedWheelsId;
            case 'cosmetic':
                return !!build.selectedCosmeticId;
            default:
                return false;
        }
    }

    /**
     * Count number of saved parts in a build
     */
    private countSavedParts(build: UserBuild): number {
        let count = 0;
        if (build.selectedPaintVariantId) count++;
        if (build.selectedWheelsId) count++;
        if (build.selectedCosmeticId) count++;
        return count;
    }

    /**
     * Save a part to the user's active build
     * Throws if limit exceeded
     */
    async savePart(
        userId: string,
        standardCarId: string,
        partType: PartType,
        partId: string
    ): Promise<void> {
        if (!this.db) throw new Error('Firestore not initialized');

        // Check if save is allowed
        const canSave = await this.canSavePart(userId, partType);
        if (!canSave) {
            throw new Error(
                'Free tier limit reached: You can only save 3 parts (paint + wheels + one cosmetic). Upgrade to Pro for unlimited parts.'
            );
        }

        const buildRef = doc(this.db, `users/${userId}/builds/activeBuild`);
        const existingBuild = await this.getActiveBuild(userId);

        // Build the updated build object
        const buildData: any = existingBuild || {
            mode: 'standardDealer',
            standardCarId,
        };

        // Update the specific part
        switch (partType) {
            case 'paint':
                buildData.selectedPaintVariantId = partId;
                break;
            case 'wheels':
                buildData.selectedWheelsId = partId;
                break;
            case 'cosmetic':
                buildData.selectedCosmeticId = partId;
                break;
        }

        buildData.updatedAt = new Date();

        // Calculate saved parts count
        buildData.savedPartsCount = this.countSavedPartsFromData(buildData);

        // Validate count (should never exceed 3 due to canSavePart check)
        if (buildData.savedPartsCount > 3) {
            throw new Error('Cannot save more than 3 parts');
        }

        // Save to Firestore
        if (existingBuild) {
            await updateDoc(buildRef, buildData);
        } else {
            await setDoc(buildRef, buildData);
        }
    }

    /**
     * Helper to count saved parts from build data object
     */
    private countSavedPartsFromData(buildData: any): number {
        let count = 0;
        if (buildData.selectedPaintVariantId) count++;
        if (buildData.selectedWheelsId) count++;
        if (buildData.selectedCosmeticId) count++;
        return count;
    }

    /**
     * Remove a specific part from the build
     */
    async removePart(userId: string, partType: PartType): Promise<void> {
        if (!this.db) throw new Error('Firestore not initialized');

        const buildRef = doc(this.db, `users/${userId}/builds/activeBuild`);
        const existingBuild = await this.getActiveBuild(userId);

        if (!existingBuild) {
            return; // No build to update
        }

        const buildData: any = { ...existingBuild };

        // Remove the specific part
        switch (partType) {
            case 'paint':
                delete buildData.selectedPaintVariantId;
                break;
            case 'wheels':
                delete buildData.selectedWheelsId;
                break;
            case 'cosmetic':
                delete buildData.selectedCosmeticId;
                break;
        }

        buildData.updatedAt = new Date();
        buildData.savedPartsCount = this.countSavedPartsFromData(buildData);

        await updateDoc(buildRef, buildData);
    }

    /**
     * Clear the entire build (reset build slot)
     */
    async clearBuild(userId: string): Promise<void> {
        if (!this.db) throw new Error('Firestore not initialized');

        const buildRef = doc(this.db, `users/${userId}/builds/activeBuild`);
        await deleteDoc(buildRef);
    }

    /**
     * Create or update a build with a new car
     */
    async createBuild(
        userId: string,
        standardCarId: string,
        defaultPaintVariantId: string
    ): Promise<void> {
        if (!this.db) throw new Error('Firestore not initialized');

        const buildRef = doc(this.db, `users/${userId}/builds/activeBuild`);

        const buildData: UserBuild = {
            mode: 'standardDealer',
            standardCarId,
            selectedPaintVariantId: defaultPaintVariantId,
            savedPartsCount: 1, // Starting with paint
            updatedAt: new Date(),
        };

        await setDoc(buildRef, buildData);
    }
}

// Export singleton instance
export const demoSandboxService = new DemoSandboxService();
export default demoSandboxService;
