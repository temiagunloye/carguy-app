// src/shop/partImportUtils.js
// Utilities for importing parts from product URLs

/**
 * Extract part information from a product URL
 * This is a placeholder - in production, this would call a Cloud Function
 * that scrapes the URL and extracts product details, images, dimensions, etc.
 * 
 * @param {string} url - Product URL
 * @returns {Promise<Object>} Part data object
 */
export async function importPartFromURL(url, carId = null) {
  // Validate URL
  if (!url || !url.startsWith('http')) {
    throw new Error('Invalid URL');
  }

  try {
    const { getFunctions, httpsCallable } = await import("firebase/functions");
    const { functions } = await import("../services/firebaseConfig");

    // Call the Cloud Function
    const submitCandidate = httpsCallable(functions, 'submitPartCandidate');
    const result = await submitCandidate({ url, carId });
    const { success, candidateId } = result.data;

    if (!success) {
      throw new Error('Failed to submit candidate');
    }

    // Now polling or fetching the candidate document would happen.
    // For this immediate step, we'll try to fetch the created doc to get the metadata
    // that the Cloud Function scraped.

    const { doc, getDoc } = await import("firebase/firestore");
    const { db } = await import("../services/firebaseConfig");

    // Quick polling to wait for the document to be written
    // In a real app, this should be a snapshot listener or more robust polling
    await new Promise(resolve => setTimeout(resolve, 2000));

    const candidateRef = doc(db, "partCandidates", candidateId);
    const candidateSnap = await getDoc(candidateRef);

    if (candidateSnap.exists()) {
      const data = candidateSnap.data();
      return {
        name: data.metadata?.title || "Unknown Part",
        price: data.metadata?.price || null,
        imageUrl: data.metadata?.imageUrl || null,
        description: data.metadata?.description || "",
        category: data.analysis?.partType || "other", // AI hint
        sourceUrl: url,
        // Additional metadata from AI analysis can be mapped here
        aiAnalysis: data.analysis
      };
    }

    return { name: "Processing...", sourceUrl: url };

  } catch (error) {
    console.error("Cloud Function Error:", error);
    throw error;
  }
}

/**
 * Validate if a URL is a supported product source
 * @param {string} url
 * @returns {boolean}
 */
export function isSupportedProductURL(url) {
  if (!url) return false;

  // List of supported domains (expandable)
  const supportedDomains = [
    'tirerack.com',
    'amazon.com',
    'ebay.com',
    'ecstuning.com',
    'fcpeuro.com',
    'turnermotorsport.com',
    'bimmerworld.com',
    'vividracing.com',
    'modbargains.com',
    // Add more as needed
  ];

  try {
    const urlObj = new URL(url);
    return supportedDomains.some(domain => urlObj.hostname.includes(domain));
  } catch {
    return false;
  }
}

/**
 * Extract basic info from URL (fallback when scraping isn't available)
 * @param {string} url
 * @returns {Object} Basic info
 */
export function extractBasicInfoFromURL(url) {
  try {
    const urlObj = new URL(url);
    const hostname = urlObj.hostname.replace('www.', '');

    return {
      sourceDomain: hostname,
      sourceUrl: url,
    };
  } catch {
    return {
      sourceDomain: 'unknown',
      sourceUrl: url,
    };
  }
}


