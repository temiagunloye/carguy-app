const SourceTier = {
    TIER_1_OEM: "TIER_1_OEM",
    TIER_2_COMMONS: "TIER_2_COMMONS",
    TIER_3_REPUTABLE: "TIER_3_REPUTABLE",
    TIER_4_BLOCKED: "TIER_4_BLOCKED"
};

const ALLOWED_DOMAINS = {
    // OEM Press Sites (Tier 1)
    "newsroom.porsche.com": SourceTier.TIER_1_OEM,
    "press.bmwgroup.com": SourceTier.TIER_1_OEM,
    "media.subaru.com": SourceTier.TIER_1_OEM,
    "media.mercedes-benz.com": SourceTier.TIER_1_OEM,
    "audi-mediacenter.com": SourceTier.TIER_1_OEM,

    // Commons (Tier 2)
    "commons.wikimedia.org": SourceTier.TIER_2_COMMONS,
    "upload.wikimedia.org": SourceTier.TIER_2_COMMONS,

    // Reputable (Tier 3 - Requires strict provenance check)
    "netcarshow.com": SourceTier.TIER_3_REPUTABLE,
    "autowp.ru": SourceTier.TIER_3_REPUTABLE,
};

function classifyDomain(url) {
    try {
        const hostname = new URL(url).hostname;
        if (ALLOWED_DOMAINS[hostname]) return ALLOWED_DOMAINS[hostname];
        for (const [domain, tier] of Object.entries(ALLOWED_DOMAINS)) {
            if (hostname.endsWith(domain)) return tier;
        }
        return SourceTier.TIER_4_BLOCKED;
    } catch (e) {
        return SourceTier.TIER_4_BLOCKED;
    }
}

module.exports = { SourceTier, ALLOWED_DOMAINS, classifyDomain };
