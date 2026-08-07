# Optimization Plan - High-Conversion Layout for "1,000 Palabras en Inglés"

The goal is to implement the specific high-conversion elements from the reference image (`product1.jpg`) into the detail page of the "1,000 Palabras en Inglés" product, while maintaining the iLingue Relax brand style.

## Proposed Changes

### 1. Enhanced Product Header
- **Localized Benefit Bullets**: Add specific bullets under the title like "From Beauty to Radiance" (localized) or "Fast Global Shipping" (localized).
- **Verified Reviews**: Improve the review count display to say "(X+ Reseñas Verificadas)" next to the stars.

### 2. Urgency & Social Proof
- **Cart Badge**: Add a "X personas tienen esto en su carrito" (X people have this in their cart) badge above the "Comprar ahora" button.
- **Stock Alert**: Add an "¡Solo quedan Y a este precio!" (Only Y left at this price!) alert below the button.
- **Social Proof Pill**: Add a small pill above the trust icons showing recent purchase activity (e.g., "Michelle y 3806 personas más compraron esto").

### 3. Product Description & Information
- **Product Type Badge**: Add a badge specifying "Producto Digital" or "Libro Físico" (as appropriate) above the description.

### 4. Interactive FAQ / Footer
- **Accordion Section**: Add the "Why is this unique?" or "What's inside?" accordion section at the bottom, mirroring the reference image's structure.

### 5. Localization
- Add all new strings to the translation system (`en.ts`, `es.ts`, etc.) to ensure consistent multi-language support.

## Implementation Steps

1. **Update Translations**: Add keys for `peopleInCart`, `peoplePurchased`, `onlyLeft`, `productBenefits`, and FAQ sections.
2. **Create/Update Components**:
    - Modify `ProductDynamic.tsx` (the component used for this product) to include the new UI elements.
    - Create small reusable UI components for the badges (Cart, Stock, Social Proof).
3. **Styling**: Apply the pink/teal accent theme to match the user's reference image while staying within the project's design system.
4. **Validation**: Test the layout on mobile and desktop viewports.
