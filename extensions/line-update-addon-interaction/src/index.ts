import type {
  CartTransformRunInput,
  FunctionRunResult,
  Operation,
} from '../generated/api';

export function cartTransformRun(input: CartTransformRunInput): FunctionRunResult {
  console.error(JSON.stringify({ message: "Function called", cartLines: input.cart.lines.length }));

  const operations: Operation[] = [];

  // Apply lineUpdate to ALL cart lines
  for (const line of input.cart.lines) {
    console.error(JSON.stringify({ message: "Creating lineUpdate operation", lineId: line.id }));

    operations.push({
      lineUpdate: {
        cartLineId: line.id,
        // Note: lineUpdate doesn't support changing quantity directly
        // You can only modify title, image, and price
        title: "Updated Item (Test)",
      }
    });
  }

  console.error(JSON.stringify({ message: "Returning operations", count: operations.length }));
  return { operations };
}

export default cartTransformRun;
