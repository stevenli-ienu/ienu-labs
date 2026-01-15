import { describe, it, expect } from '@jest/globals';

// --- 🚧 BAD PATTERN (Legacy Code) 🚧 ---
// Problem: Adapter does too much (DB, Logging), hiding logic from the Cron Service
// and making it impossible to reuse or test in isolation.

class LegacyDB {
  async save(data: any) {
    return 'saved';
  }
  async getLog() {
    return 'log';
  }
}

// This Adapter violates Single Responsibility Principle
class BadLogisticsAdapter {
  constructor(private db: LegacyDB) {}

  async fetchAndProcessShipments(apiParams: any) {
    // 1. Hidden Dependency: Fetches log from DB
    const log = await this.db.getLog();
    // 2. Simulated API Call
    const apiData = [{ id: 1, amount: 100 }];

    // 3. Hidden Side Effect: Writes directly to DB
    await this.db.save(apiData);

    return 'Done'; // Return value is meaningless; Cron Job blindly trusts it finished
  }
}

// --- ✅ GOOD PATTERN (Refactored) ✅ ---
// Solution: Adapter is only a "Translator". Cron Service owns the "Orchestration".

interface StandardShipment {
  trackingId: string;
  weight: number;
  status: 'DELIVERED' | 'PENDING';
}

class CleanLogisticsAdapter {
  // No DB dependency. Pure API interaction and data transformation.
  async fetchShipments(since: Date): Promise<StandardShipment[]> {
    // Simulated API response
    const rawApiData = [{ fedex_id: 'abc', val: 50.5, current_state: 1 }];

    // Core Value: Standardize data format from different providers
    return rawApiData.map((raw) => ({
      trackingId: raw.fedex_id,
      weight: raw.val,
      status: raw.current_state === 1 ? 'DELIVERED' : 'PENDING',
    }));
  }
}

class ShipmentSyncService {
  constructor(
    private adapter: CleanLogisticsAdapter,
    private repo: LegacyDB,
  ) {}

  async syncShipments() {
    // 1. Clear Flow: Fetch data first
    const shipments = await this.adapter.fetchShipments(new Date());

    // 2. Centralized Processing: Decide how to persist (Batch Update / Transaction)
    // We can clearly see every Cron Job doing the same thing.
    await this.repo.save(shipments);

    return shipments.length;
  }
}

// --- 🧪 TEST PROOF ---

describe('Architecture: Adapter Responsibility Refactoring', () => {
  it('SHOULD allow CronService to orchestrate logic when Adapter is pure', async () => {
    const db = new LegacyDB();
    const adapter = new CleanLogisticsAdapter();
    const service = new ShipmentSyncService(adapter, db);

    const processedCount = await service.syncShipments();

    // We can clearly assert the result, rather than just "Done"
    expect(processedCount).toBe(1);
  });

  it('SHOULD standardize data format regardless of provider implementation', async () => {
    const adapter = new CleanLogisticsAdapter();
    const result = await adapter.fetchShipments(new Date());

    expect(result[0]).toHaveProperty('trackingId'); // Ensure return is standard format
    expect(result[0].status).toBe('DELIVERED');
  });
});
