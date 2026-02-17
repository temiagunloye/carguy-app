# Render Generation Runbook

**Generated:** 2026-02-17T01:49:59.899Z
**Total Tasks:** 86 missing angles across 16 builds

## Rules

1. Generate ONE image at a time
2. Wait 25-40 seconds between requests
3. After each build completes:
   ```bash
   bash scripts/import_to_canonical.sh <buildId> <artifacts-dir>
   ```
4. Never regenerate existing angles

## Queue

- **audi_rs6_stock_grey**: 6/10 (missing: angle_07, angle_08, angle_09, angle_10)
- **audi_rs6_custom_blue**: ✅ Complete
- **audi_rs6_bbs_mesh**: 0/10 (missing: angle_01, angle_02, angle_03, angle_04, angle_05, angle_06, angle_07, angle_08, angle_09, angle_10)
- **bmw_m3_stock_white**: ✅ Complete
- **bmw_m3_custom_red**: ✅ Complete
- **bmw_m3_toronto_red_bbs_fir**: 0/10 (missing: angle_01, angle_02, angle_03, angle_04, angle_05, angle_06, angle_07, angle_08, angle_09, angle_10)
- **c63_stock_black**: ✅ Complete
- **mercedes_c63_rohana_matte_coal**: 0/10 (missing: angle_01, angle_02, angle_03, angle_04, angle_05, angle_06, angle_07, angle_08, angle_09, angle_10)
- **brz_stock_blue**: 8/10 (missing: angle_01, angle_05)
- **brz_custom_matte**: ✅ Complete
- **subaru_brz_te37_matte_coal**: 0/10 (missing: angle_01, angle_02, angle_03, angle_04, angle_05, angle_06, angle_07, angle_08, angle_09, angle_10)
- **porsche_gt3_stock_red**: 0/10 (missing: angle_01, angle_02, angle_03, angle_04, angle_05, angle_06, angle_07, angle_08, angle_09, angle_10)
- **gt3_manthey_green**: ✅ Complete
- **porsche_911_stock**: 0/10 (missing: angle_01, angle_02, angle_03, angle_04, angle_05, angle_06, angle_07, angle_08, angle_09, angle_10)
- **porsche_911_manthey_carbon_disc**: 0/10 (missing: angle_01, angle_02, angle_03, angle_04, angle_05, angle_06, angle_07, angle_08, angle_09, angle_10)
- **porsche_911_camo_green**: 0/10 (missing: angle_01, angle_02, angle_03, angle_04, angle_05, angle_06, angle_07, angle_08, angle_09, angle_10)
