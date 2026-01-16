// Mocking a Database Entity structure
type Address = { street: string; zip: string };
type PaymentMethod = { last4: string; token: string };
type Customer = {
  id: string;
  name: string;
  address?: Address;
  paymentMethod?: PaymentMethod;
};

// Bad Pattern: Service demands a "hydrated" entity
class LegacyFulfillmentService {
  processOrder(
    customer: Customer & { address: Address; paymentMethod: PaymentMethod },
    item: string,
  ) {
    if (!customer.address) throw new Error('Missing Address'); // Redundant check if type is trusted?
    return `Shipped ${item} to ${customer.address.street} using card ending in ${customer.paymentMethod.last4}`;
  }
}

// Good Pattern: Service accepts ID and hydrates data itself (Self-Contained)
class ModernFulfillmentService {
  constructor(private db: MockDatabase) {}

  async processOrder(customerId: string, item: string) {
    const customer = this.db.getCustomerWithDetails(customerId);
    if (!customer || !customer.address || !customer.paymentMethod) {
      throw new Error('Customer data incomplete');
    }
    return `Shipped ${item} to ${customer.address.street} using card ending in ${customer.paymentMethod.last4}`;
  }
}

// Mock DB
class MockDatabase {
  getCustomerWithDetails(
    id: string,
  ): Customer & { address: Address; paymentMethod: PaymentMethod } {
    return {
      id,
      name: 'John Doe',
      address: { street: '123 Main St', zip: '90210' },
      paymentMethod: { last4: '4242', token: 'tok_123' },
    };
  }
}

describe('Pattern: Parameter Coupling vs Self-Contained Service', () => {
  // ⛔️ BAD PATTERN
  it('Problem: Caller must know exact data requirements (Coupling)', () => {
    const service = new LegacyFulfillmentService();

    // The CALLER is burdened with fetching specific relations
    // If Service changes to need 'phoneNumber' later, THIS code must change.
    const hydratedCustomer = {
      id: 'c_1',
      name: 'John',
      address: { street: '123 Main St', zip: '90210' },
      paymentMethod: { last4: '4242', token: 'tok_123' },
    };

    const result = service.processOrder(hydratedCustomer, 'MacBook Pro');
    expect(result).toContain('Shipped MacBook Pro');
  });

  // ✅ GOOD PATTERN
  it('Solution: Pass ID, let Service handle data fetching', async () => {
    const db = new MockDatabase();
    const service = new ModernFulfillmentService(db); // Dependency Injection

    // The CALLER only provides the INTENT (Who and What)
    // Implementation details (which DB tables to join) are hidden inside.
    const result = await service.processOrder('c_1', 'MacBook Pro');

    expect(result).toContain('Shipped MacBook Pro');
  });
});
