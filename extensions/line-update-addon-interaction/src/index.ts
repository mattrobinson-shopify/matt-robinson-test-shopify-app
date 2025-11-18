import type {
  CartTransformRunInput,
  FunctionRunResult,
  Operation,
} from '../generated/api';

// TEST CONFIGURATION - Enable/disable operations to test separately
const TEST_CONFIG = {
  enableExpand: false,
  enableMerge: true,
  enableUpdate: false,  // Set to true to test lineUpdate on child items with parent relationships
};

export function cartTransformRun(input: CartTransformRunInput): FunctionRunResult {
  console.error(JSON.stringify({
    message: "Function called",
    cartLines: input.cart.lines.length,
    config: TEST_CONFIG
  }));

  const operations: Operation[] = [];

  // Test 1: lineExpand - Expand a single line into multiple child lines (creates parent relationship)
  // Find a line to expand (NOT filtering out parent relationships - test how they interact!)
  const lineToExpand = TEST_CONFIG.enableExpand ? input.cart.lines.find(line =>
    line.merchandise.__typename === 'ProductVariant' &&
    (line.merchandise.title?.toLowerCase().includes('expand') || line.merchandise.title?.toLowerCase().includes('bundle'))
  ) : undefined;

  if (TEST_CONFIG.enableExpand && lineToExpand && lineToExpand.merchandise.__typename === 'ProductVariant') {
    console.error(JSON.stringify({ message: "Creating lineExpand operation", lineId: lineToExpand.id }));

    operations.push({
      lineExpand: {
        cartLineId: lineToExpand.id,
        title: "Expanded Bundle",
        expandedCartItems: [
          {
            merchandiseId: lineToExpand.merchandise.id,
            quantity: 1,
          },
          {
            merchandiseId: lineToExpand.merchandise.id, // Using same variant for testing
            quantity: 1,
          }
        ]
      }
    });
  }

  // Test 2: linesMerge - Merge multiple lines into a single
  // Find lines to merge (look for lines with "merge" in title or take multiple non-child lines)
  let linesToMerge: typeof input.cart.lines = [];

  if (TEST_CONFIG.enableMerge) {
    console.error(JSON.stringify({
      message: "Starting merge filter",
      totalLines: input.cart.lines.length
    }));

    linesToMerge = input.cart.lines.filter(line => {
      // NOT filtering out parent relationships - test how they interact!
      if (line.merchandise.__typename !== 'ProductVariant') return false;
      if (line.id === lineToExpand?.id) return false;

      const title = (line.merchandise.title || '').toLowerCase();
      const productTitle = (line.merchandise.product?.title || '').toLowerCase();

      return title.includes('merge') || title.includes('component') ||
             productTitle.includes('merge') || productTitle.includes('component');
    });

    console.error(JSON.stringify({
      message: "Filtered lines for merge",
      count: linesToMerge.length,
      lines: linesToMerge.map(l => ({
        id: l.id,
        title: l.merchandise.__typename === 'ProductVariant' ? l.merchandise.title : 'N/A',
        hasParentRelationship: !!l.parentRelationship,
        parentId: l.parentRelationship?.parent.id
      }))
    }));
  }

  if (TEST_CONFIG.enableMerge && linesToMerge.length >= 2) {
    console.error(JSON.stringify({
      message: "Attempting to create linesMerge operation",
      lineCount: linesToMerge.length
    }));

    const firstLine = linesToMerge[0];
    if (firstLine.merchandise.__typename === 'ProductVariant') {
      console.error(JSON.stringify({
        message: "Creating linesMerge operation",
        lineIds: linesToMerge.map(l => l.id),
        parentVariantId: firstLine.merchandise.id
      }));

      operations.push({
        linesMerge: {
          parentVariantId: firstLine.merchandise.id,
          title: "Merged Bundle",
          cartLines: linesToMerge.map(line => ({
            cartLineId: line.id,
            quantity: line.quantity
          }))
        }
      });

      console.error(JSON.stringify({ message: "linesMerge operation added successfully" }));
    }
  }

  // Test 3: lineUpdate - Update presentation of lines
  // Apply to remaining lines, testing behavior with child items
  if (TEST_CONFIG.enableUpdate) {
    for (const line of input.cart.lines) {
    // Skip lines we're already operating on
    if (line.id === lineToExpand?.id || linesToMerge.some(l => l.id === line.id)) {
      continue;
    }

    // TEST: Try updating child items to see how it interacts with parent relationships
    if (line.parentRelationship) {
      console.error(JSON.stringify({
        message: "TESTING: Attempting lineUpdate on child item with parent relationship",
        lineId: line.id,
        parentId: line.parentRelationship.parent.id
      }));

      operations.push({
        lineUpdate: {
          cartLineId: line.id,
          title: "Updated Child Item (testing parent relationship interaction)",
        }
      });
    } else {
      console.error(JSON.stringify({ message: "Creating lineUpdate operation", lineId: line.id }));

      operations.push({
        lineUpdate: {
          cartLineId: line.id,
          title: "Updated Item",
        }
      });
    }
    }
  }

  console.error(JSON.stringify({
    message: "Returning operations",
    count: operations.length,
    operationTypes: operations.map(op => {
      if (op.lineExpand) return 'expand';
      if (op.linesMerge) return 'merge';
      if (op.lineUpdate) return 'update';
      return 'unknown';
    })
  }));

  return { operations };
}

export default cartTransformRun;
