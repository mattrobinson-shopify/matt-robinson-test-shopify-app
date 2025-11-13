export * from './cart_transform_run';

import {
  CartTransformOperation,
  CartTransformResult,
  RunInput,
  run,
} from '@shopify/cart-transform';

export default run((input: RunInput): CartTransformResult => {
  const operations: CartTransformOperation[] = [];

  // Check if there is at least one cart line
  if (input.cart.lines.length > 0) {
    const firstLine = input.cart.lines[0];
    operations.push({
      type: 'lineUpdate',
      id: firstLine.id,
      quantity: 2, // Set quantity to 2 for testing
    });
  }

  return { operations };
});
