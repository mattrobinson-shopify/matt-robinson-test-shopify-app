import type {
  CartTransformRunInput,
  FunctionRunResult,
  Operation,
} from '../generated/api';

export function cartTransformRun(input: CartTransformRunInput): FunctionRunResult {
  const operations: Operation[] = [];

  // Check if there is at least one cart line
  if (input.cart.lines.length > 0) {
    const firstLine = input.cart.lines[0];
    operations.push({
      lineUpdate: {
        cartLineId: firstLine.id,
        // Note: lineUpdate doesn't support changing quantity directly
        // You can only modify title, image, and price
        title: "Updated Item (Test)",
      }
    });
  }

  return { operations };
}

export default cartTransformRun;
