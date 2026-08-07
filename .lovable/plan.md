# Plan: Automatic FAQ Language Switching by Country/Region

The objective is to ensure that the FAQ section on product pages automatically switches to the user's local language (based on their country/IP) instead of being hardcoded or only switching between Spanish and English based on the product's target language.

## Proposed Changes

### 1. Update Translation Files
- Add a new `productFaq` section to all translation files (`src/i18n/translations/es.ts`, `en.ts`, `fr.ts`, `pt.ts`) to provide localized versions of common product FAQ questions and answers.
- These will cover general questions like "What makes this guide special?", "How do I receive the product?", and "Is my payment secure?".

### 2. Update `ProductDynamic.tsx`
- Replace hardcoded FAQ logic (which currently only checks `product.target_language === 'en'`) with localized strings from the `t` object provided by `useI18n()`.
- This will ensure that a user in France sees the FAQ in French, a user in Brazil sees it in Portuguese, etc., regardless of which language book they are viewing.

### 3. Update Other Product Pages
- Apply similar changes to other specific product pages if they have hardcoded FAQs (e.g., `ProductCoreanoRelax.tsx`, `ProductPatronesEspeciales.tsx`, etc.).

### 4. Verification
- Use the preview to switch between different simulated countries (using `?country=FR`, `?country=BR`, etc.) and verify that the FAQ content updates accordingly.
- Check the console for any translation key errors.

## Context from User
- "ese le producto debe faq tieen ahcer autimacticamente idiomas por pais."
- The project already has an `I18nProvider` that detects the country and sets the site language.
- The `FAQ` component is generic and ready to receive localized props.
