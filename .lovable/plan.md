# Plan: Simplify Checkout UI Visual Complexity

The user reported that the payment methods section feels "too heavy" (visual complexity). I will simplify the UI by cleaning up the payment method badges and reducing the visual weight of the order summary and payment selection areas.

## User Review Required

> [!IMPORTANT]
> I will simplify the payment method icons and labels to make the checkout feel lighter and more professional, focusing on the most important trust signals.

## Proposed Changes

### Checkout UI Simplification

#### [OrderSummary.tsx]
- Reduce the opacity and prominence of the "Accepted Methods" footer icons.
- Streamline the layout to be more compact.

#### [PaymentMethodsGroup.tsx]
- Simplify the `LogoBadge`, `GooglePayBadge`, and `LinkBadge` designs to be cleaner.
- Reduce the number of visible bank badges in the list if they are redundant.
- Optimize the spacing between payment method rows to reduce vertical "noise".
- Ensure that the local currency badges are clearly visible but not visually overwhelming.

## Technical Details

- **Visual Cleanup**: Adjust Tailwind classes for spacing (`gap-2` instead of `gap-3` where appropriate) and colors (using more `muted-foreground` and lighter borders).
- **Badge Refactoring**: Standardize the height and styling of payment method badges to create a more uniform look.
- **Component Pruning**: Remove unnecessary visual elements that don't add functional value to the checkout process.

## Verification Plan

- **Manual Verification**: Check the checkout page on mobile and desktop to ensure the UI feels "lighter" and less cluttered.
- **Visual Check**: Verify that the payment methods are still clearly identifiable despite the simplified styling.
