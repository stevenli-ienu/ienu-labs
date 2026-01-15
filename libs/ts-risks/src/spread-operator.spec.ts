import { describe, it, expect } from '@jest/globals';

// --- Context: The "Order" Entity Pattern (Sanitized from original GameBet logic) ---

/**
 * Simulates a TypeORM Entity.
 * In a real app, this would extend BaseEntity or be decorated with @Entity
 */
class Order {
  id: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  metadata: Record<string, any>;

  constructor(partial: Partial<Order>) {
    Object.assign(this, partial);
  }
}

/**
 * Simulates the specific problem scenario:
 * A partial update function that uses the Spread Operator blindly.
 */
function riskyUpdateConfig(original: Order, updates: Partial<Order>): Order {
  // ❌ BAD PATTERN: Spreading the entity directly
  // logic: typeorm often creates a new object or the spread might overwrite 
  // getters/setters or lose prototype methods if not careful (though pure JS objects are mostly fine).
  // The REAL risk in the original context was usually about losing 
  // properties that weren't enumerable or strictly typed in the Partial, 
  // or unintentionally overwriting fields with undefined.
  
  // For this demo, let's simulate the issue where we accidentally 
  // overwrite a nested object entirely instead of merging it, 
  // OR we try to spread a class instance into a plain object 
  // which implies we lose method context if we had any.
  
  return { ...original, ...updates }; 
}

/**
 * ✅ GOOD PATTERN: Explicit mapping or using a merge utility.
 * This ensures we control exactly what gets updated.
 */
function safeUpdateConfig(original: Order, updates: Partial<Order>): Order {
  // Explicitly assign fields we ALLOW to change
  const updated = new Order(original);
  
  if (updates.status) updated.status = updates.status;
  if (updates.amount) updated.amount = updates.amount;
  
  // Deep merge for metadata if needed (simplified here)
  if (updates.metadata) {
    updated.metadata = { ...original.metadata, ...updates.metadata };
  }
  
  return updated;
}

describe('TypeScript Spread Operator Risks', () => {
  it('Risk 1: Shallow Copy Destroys Nested Data (Metadata Overwrite)', () => {
    // 1. Setup initial state
    const order = new Order({
      id: 'o_123',
      amount: 100,
      status: 'PENDING',
      metadata: {
        campaignId: 'summer_sale',
        referrer: 'google'
      }
    });

    // 2. The risky update
    // We only wanted to add a 'traceId', but we spread a new object object into metadata
    const updates: Partial<Order> = {
      metadata: { traceId: 'xyz_999' } 
    };

    const result = riskyUpdateConfig(order, updates);

    // 3. 💥 Assertion: Expect failure/data loss
    // The referrer and campaignId are GONE because spread does a shallow replace of 'metadata'
    expect(result.metadata.referrer).toBeUndefined(); 
    expect(result.metadata.traceId).toBe('xyz_999');
  });

  it('Safe Pattern: Deep Merge preserves nested data', () => {
    // 1. Setup
    const order = new Order({
      id: 'o_123',
      amount: 100,
      status: 'PENDING',
      metadata: {
        campaignId: 'summer_sale',
        referrer: 'google'
      }
    });

    // 2. The safe update
    const updates: Partial<Order> = {
        metadata: { traceId: 'xyz_999' }
    };
    
    // safeUpdate simulates logic that handles deep merging manually or via library
    const result = safeUpdateConfig(order, updates);

    // 3. ✅ Assertion: Data preserved
    expect(result.metadata.referrer).toBe('google');
    expect(result.metadata.traceId).toBe('xyz_999');
    // And we return a real instance of Order
    expect(result).toBeInstanceOf(Order);
  });
});
