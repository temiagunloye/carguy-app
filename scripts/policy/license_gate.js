const { SourceTier } = require('./source_tiers');

const LicenseCategory = {
    PERMITTED: "PERMITTED",
    RESTRICTED: "RESTRICTED",
    UNKNOWN: "UNKNOWN"
};

const PublishStatus = {
    APPROVED: "approved",
    NEEDS_REVIEW: "needs_review",
    DRAFT_TESTING_ONLY: "draft_testing_only",
    REJECTED: "rejected"
};

function determinePublishStatus(evidence) {
    if (evidence.tier === SourceTier.TIER_4_BLOCKED) {
        return PublishStatus.REJECTED;
    }
    if (evidence.tier === SourceTier.TIER_1_OEM) {
        return PublishStatus.APPROVED;
    }
    if (evidence.tier === SourceTier.TIER_2_COMMONS) {
        if (evidence.licenseText?.toLowerCase().includes('noncommercial')) {
            return PublishStatus.DRAFT_TESTING_ONLY;
        }
        return PublishStatus.APPROVED;
    }
    if (evidence.tier === SourceTier.TIER_3_REPUTABLE) {
        return PublishStatus.NEEDS_REVIEW;
    }
    return PublishStatus.DRAFT_TESTING_ONLY;
}

module.exports = { LicenseCategory, PublishStatus, determinePublishStatus };
