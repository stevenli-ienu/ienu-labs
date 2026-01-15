import { describe, it, expect } from '@jest/globals';

// --- Context: The "Order" Entity Pattern ---
// Scenario: We have an Entity with nested data (metadata).
// We want to update it partially.

class Order {
  id: string;
  amount: number;
  status: 'PENDING' | 'PAID' | 'CANCELLED';
  metadata: Record<string, any>;

  constructor(partial: Partial<Order>) {
    Object.assign(this, partial);
  }

  // A method we expect to exist on the object
  isPaid(): boolean {
    return this.status === 'PAID';
  }
}

// --- 🚧 BAD PATTERN (Risky Spread) 🚧 ---
// Problem: The Spread Operator (...) does a SHALLOW copy.
// 1. It wipes out nested properties if not careful.
// 2. It converts a Class Instance into a Plain Object (losing methods).

function riskyUpdateOrder(original: Order, updates: Partial<Order>): any {
  // ❌ Risk 1: '...original' creates a plain object, stripping 'isPaid()' method.
  // ❌ Risk 2: '...updates' will completely REPLACE 'metadata' object, not merge it.
  return { ...original, ...updates };
}

// --- ✅ GOOD PATTERN (Explicit Update) ✅ ---
// Solution: Use explicit assignment or deep merge utilities.
// Maintain the Class instance prototype.

function safeUpdateOrder(original: Order, updates: Partial<Order>): Order {
  // 1. Maintain Prototype Chain (New Instance)
  const updated = new Order(original);

  // 2. Explicit Assignment (Safety Check)
  if (updates.status) updated.status = updates.status;
  if (updates.amount) updated.amount = updates.amount;

  // 3. Handle Nested Data (Deep Merge)
  if (updates.metadata) {
    updated.metadata = {
      ...original.metadata, // Keep existing keys
      ...updates.metadata, // Overwrite only specific keys
    };
  }

  return updated;
}

// --- 🧪 TEST PROOF ---

describe('TypeScript: Spread Operator Risks', () => {
  it('RISK 1: Spread operator destroys Class Methods (Prototype Chain)', () => {
    const order = new Order({ id: '1', amount: 100, status: 'PAID' });

    // Action: Update using spread
    const result = riskyUpdateOrder(order, { amount: 200 });

    // Proof: The method isPaid() is gone because it's now a plain JSON object
    // Expecting: "result.isPaid is not a function"
    expect(() => result.isPaid()).toThrow();
    expect(result).not.toBeInstanceOf(Order);
  });

  it('RISK 2: Shallow Copy destroys nested data (Metadata Loss)', () => {
    // Setup: Order with existing metadata
    const order = new Order({
      id: 'o_123',
      metadata: {
        campaign: 'summer_sale',
        referrer: 'google', // 👈 Essential data
      },
    });

    // Action: We want to ADD a traceId
    const updates = {
      metadata: { traceId: 'xyz_999' },
    };

    // The risky function simply spreads the new metadata object over the old one
    const result = riskyUpdateOrder(order, updates);

    // Proof: 'referrer' is LOST. It was fully replaced, not merged.
    expect(result.metadata.referrer).toBeUndefined();
    expect(result.metadata.traceId).toBe('xyz_999');
  });

  it('SOLUTION: Safe Update preserves Prototype and Nested Data', () => {
    const order = new Order({
      id: 'o_123',
      status: 'PENDING',
      metadata: { campaign: 'summer_sale' },
    });

    const result = safeUpdateOrder(order, {
      status: 'PAID',
      metadata: { traceId: 'safe_1' }, // Adding new key
    });

    // Proof 1: Prototype preserved
    expect(result).toBeInstanceOf(Order);
    expect(result.isPaid()).toBe(true);

    // Proof 2: Nested data merged
    expect(result.metadata.campaign).toBe('summer_sale'); // Preserved
    expect(result.metadata.traceId).toBe('safe_1'); // Added
  });
});
