# 🎨 Design Consistency Checklist

**Goal:** Maintain a calm, premium, low-density aesthetic ("Sorbet" language).

## 1. Visual Language
- [ ] **Palette**: Strictly adhere to existing Variables (Dark SaaS theme). No new colors.
- [ ] **Transitions**: Use Ombré gradients for section backgrounds (`linear-gradient(180deg, var(--bg-primary) 0%, var(--bg-secondary) 100%)`). Avoid harsh lines.
- [ ] **Typography**: Inter (Google Fonts). Headings Uppercase (Hero).
- [ ] **Shadows**: Soft glows (`var(--shadow-glow)`) rather than hard drops.

## 2. Layout & Density
- [ ] **Whitespace**: Use `--space-4xl` (approx 120px+) between major sections.
- [ ] **Hero**: Max 1 Headline, 1 Subtitle, 1 Primary CTA, 1 Visual.
- [ ] **Grids**: Maximum **3 columns** for features/bento grids. Avoid 4+ columns.
- [ ] **Breathing Room**: Content max-width 1200px, but text blocks max-width 600-800px for readability.

## 3. UI Components
- [ ] **Buttons**: 
    - Secondary: Transparent with border (`.btn-secondary`).
    - Primary: Gradient/Accent with glow (`.btn-primary`).
- [ ] **Cards**: Glassmorphism effect (`rgba(255,255,255,0.05)`) + delicate border.
- [ ] **Mockups**: "Clean" style (no bezels/frames preferred) or consistent dark framing.

## 4. Maintenance
- [ ] **New Sections**: Must inherit `styles.css` classes. Do not write inline styles.
- [ ] **Icons**: Use consistent stroke weight (Feather/Lucide style).
