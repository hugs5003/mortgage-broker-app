# Moneyfacts API Integration Guide

This guide walks you through connecting your mortgage broker app to the **Moneyfacts API** for real, live mortgage product data.

## 1. Getting Started with Moneyfacts

### Prerequisites

- **FCA Regulation** — You must be registered as a mortgage broker/advisor with the FCA
  - Apply at: https://register.fca.org.uk
  - Registration typically takes 2-4 weeks
  - Required for any mortgage brokerage in the UK

- **Moneyfacts Business Account**
  - Go to: https://www.moneyfacts.co.uk/business/
  - Contact their sales team
  - They'll assess your firm and provide pricing

### Pricing (Approximate)

- Startup plan: ~£500/month
- Growth plan: ~£1,500-3,000/month (depending on data refresh frequency)
- Enterprise: Custom pricing

## 2. API Credentials Setup

Once approved, Moneyfacts will provide:

```
API_KEY: Your unique API key
API_SECRET: Your API secret (keep safe!)
API_URL: https://api.moneyfacts.co.uk/v2  (or latest version)
PARTNER_ID: Your partner ID
```

Add to your `.env` file:

```bash
MORTGAGE_DATA_PROVIDER=moneyfacts
MONEYFACTS_API_KEY=your_key_here
MONEYFACTS_API_SECRET=your_secret_here
MONEYFACTS_API_URL=https://api.moneyfacts.co.uk/v2
MONEYFACTS_PARTNER_ID=your_partner_id
```

## 3. Understanding Moneyfacts Data

Moneyfacts returns product data with these key fields (typical structure):

```json
{
  "ProductCode": "BARC00001",          // Unique deal ID
  "LenderName": "Barclays",
  "ProductName": "2-Year Fixed Rate",
  "ProductType": "FIXED",              // FIXED, TRACKER, VARIABLE, IO
  "InterestRate": "4.29",               // As a percentage
  "InterestRateMargin": "0.24",        // For trackers
  "Term": 24,                           // In months
  "LVR": [75, 80, 85, 90],            // Max LTV tiers
  "ArrangementFee": 999,
  "CompletionDate": "2024-01-15",
  "ProductURL": "https://...",
  // ... many more fields
}
```

## 4. Mapping to Our Format

In `server/src/services/mortgageDataProvider.ts`, map Moneyfacts fields to our `MortgageDeal` interface:

```typescript
private mapMoneyfactsDeal(raw: any): MortgageDeal {
  return {
    id: raw.ProductCode,
    lender: raw.LenderName,
    dealName: raw.ProductName,
    type: this.mapProductType(raw.ProductType),
    rate: parseFloat(raw.InterestRate),
    rateMargin: raw.InterestRateMargin ? parseFloat(raw.InterestRateMargin) : undefined,
    fixedPeriod: raw.Term ? Math.round(raw.Term / 12) : 0,
    svr: parseFloat(raw.SVRRate || '7.5'), // May not be in data, use estimate
    arrangementFee: parseFloat(raw.ArrangementFee || '0'),
    valuationFee: 0, // Moneyfacts may not include this
    legalFees: 0,
    maxLTV: Math.max(...raw.LVR) || 85,
    minLTV: Math.min(...raw.LVR) || 0,
    ercYear1: raw.ERCYear1 || 0,
    ercYear2: raw.ERCYear2 || 0,
    ercYear3: raw.ERCYear3 || 0,
    ercYear4: raw.ERCYear4 || 0,
    ercYear5: raw.ERCYear5 || 0,
    overpaymentAllowance: parseFloat(raw.OverpaymentAllowance || '10'),
    portable: raw.PortableFlag === 'Y',
    cashback: parseFloat(raw.Cashback || '0'),
    features: this.extractFeatures(raw),
    lastUpdated: new Date(raw.UpdatedDate || Date.now()),
    provider: 'moneyfacts',
  };
}

private mapProductType(type: string): MortgageType {
  const typeMap: Record<string, MortgageType> = {
    'FIXED_2': 'fixed_2yr',
    'FIXED_3': 'fixed_3yr',
    'FIXED_5': 'fixed_5yr',
    'FIXED_10': 'fixed_10yr',
    'TRACKER': 'tracker',
    'SVR': 'svr',
    'DISCOUNT': 'discount',
    'OFFSET': 'offset',
    'IO': 'interest_only',
  };
  return typeMap[type] || 'svr';
}
```

## 5. Implement API Calls

Update `MoneyfactsMortgageDataProvider.getDeals()`:

```typescript
async getDeals(filters?: DealsFilter): Promise<MortgageDeal[]> {
  try {
    // Build query params
    const params = new URLSearchParams();
    if (filters?.maxLTV) params.append('maxLVR', filters.maxLTV.toString());
    if (filters?.minRate) params.append('minRate', filters.minRate.toString());
    if (filters?.maxRate) params.append('maxRate', filters.maxRate.toString());
    if (filters?.type) params.append('productType', filters.type);

    // Call API
    const response = await axios.get(
      `${this.baseUrl}/products`,
      {
        params,
        headers: {
          'Authorization': `Bearer ${this.apiKey}:${this.apiSecret}`,
          'X-Partner-ID': process.env.MONEYFACTS_PARTNER_ID,
        },
      }
    );

    // Map to our format
    const deals = response.data.products.map((p: any) => this.mapMoneyfactsDeal(p));

    // Cache in Redis (optional but recommended)
    await this.cache.set('moneyfacts_deals', deals, 3600); // 1 hour TTL

    return deals;
  } catch (error) {
    console.error('Moneyfacts API error:', error);
    // Fall back to cached data or mock
    const cached = await this.cache.get('moneyfacts_deals');
    if (cached) return cached;
    throw new Error('Failed to fetch Moneyfacts products');
  }
}

async refreshDeals(): Promise<void> {
  // Run this daily via scheduler (Bull queue)
  // Pulls latest rates and updates cache
  console.log('Refreshing Moneyfacts deals...');
  await this.getDeals(); // Populates cache
}
```

## 6. Caching Strategy (Recommended)

Add Redis for performance (optional):

```typescript
import redis from 'redis';

export class MoneyfactsMortgageDataProvider {
  private client = redis.createClient();

  async getDeals(filters?: DealsFilter): Promise<MortgageDeal[]> {
    // Check cache first
    const cacheKey = `deals:${JSON.stringify(filters)}`;
    const cached = await this.client.get(cacheKey);
    if (cached) return JSON.parse(cached);

    // Fetch from API
    const deals = await this.fetchFromAPI(filters);

    // Cache for 1 hour
    await this.client.setex(cacheKey, 3600, JSON.stringify(deals));

    return deals;
  }
}
```

Add to `docker-compose.yml`:

```yaml
redis:
  image: redis:7-alpine
  ports:
    - "6379:6379"
```

## 7. Scheduler (Daily Refresh)

Use Bull queue to refresh deals every night:

```typescript
import Queue from 'bull';

const refreshQueue = new Queue('refresh-deals', {
  redis: { host: 'localhost', port: 6379 },
});

// Run every day at 2 AM
refreshQueue.process('daily', async () => {
  const provider = getMortgageDataProvider();
  await provider.refreshDeals();
  console.log('✓ Deals refreshed');
});

// Schedule
cron.schedule('0 2 * * *', () => {
  refreshQueue.add('daily', {}, { repeat: { cron: '0 2 * * *' } });
});
```

## 8. Testing Your Integration

### Test 1: Verify API Connection

```bash
curl -X GET "https://api.moneyfacts.co.uk/v2/products" \
  -H "Authorization: Bearer YOUR_KEY:YOUR_SECRET" \
  -H "X-Partner-ID: YOUR_PARTNER_ID"
```

Should return a JSON array of products.

### Test 2: Verify Mapping

```bash
curl -X POST http://localhost:5000/api/deals/calculate \
  -H "Content-Type: application/json" \
  -d '{
    "propertyValue": 300000,
    "deposit": 60000,
    "termYears": 25,
    "grossIncome": 55000
  }'
```

Should return deals from Moneyfacts (if working).

### Test 3: Load Testing

Test with realistic volumes:

```typescript
it('should handle 100 concurrent requests', async () => {
  const requests = Array(100).fill(null).map(() =>
    provider.getDeals()
  );
  const results = await Promise.all(requests);
  expect(results).toHaveLength(100);
});
```

## 9. Monitoring & Alerting

Add monitoring to catch API issues:

```typescript
const monitorMoneyfactsAPI = async () => {
  try {
    const deals = await provider.getDeals();
    if (deals.length === 0) {
      sendAlert('Moneyfacts API returned no deals');
    }
  } catch (err) {
    sendAlert(`Moneyfacts API error: ${err.message}`);
    // Fall back to mock provider
  }
};

// Run every 30 minutes
setInterval(monitorMoneyfactsAPI, 30 * 60 * 1000);
```

## 10. Deployment

### Environment Variables (Production)

```bash
MORTGAGE_DATA_PROVIDER=moneyfacts
MONEYFACTS_API_KEY=<prod_key>
MONEYFACTS_API_SECRET=<prod_secret>
MONEYFACTS_API_URL=https://api.moneyfacts.co.uk/v2
REDIS_URL=redis://your-redis-url
```

### Switch Back to Mock (if API down)

Add a fallback:

```typescript
export function getMortgageDataProvider(): IMortgageDataProvider {
  const providerName = process.env.MORTGAGE_DATA_PROVIDER || 'mock';

  try {
    if (providerName === 'moneyfacts') {
      return new MoneyfactsMortgageDataProvider();
    }
  } catch (err) {
    console.error('Failed to initialize Moneyfacts, falling back to mock');
    return new MockMortgageDataProvider();
  }

  return new MockMortgageDataProvider();
}
```

## Checklist

- [ ] Register with Moneyfacts
- [ ] Get API credentials
- [ ] Test API access in sandbox
- [ ] Implement `MoneyfactsMortgageDataProvider.getDeals()`
- [ ] Map Moneyfacts fields to `MortgageDeal`
- [ ] Add Redis caching
- [ ] Add daily refresh scheduler
- [ ] Test with real data
- [ ] Set up monitoring/alerts
- [ ] Deploy to production
- [ ] Monitor for 48 hours

## Troubleshooting

**"401 Unauthorized"**
- Check API key/secret format
- Verify X-Partner-ID header is included
- May need to URL-encode credentials

**"Rate limited"**
- Moneyfacts has rate limits (~1000 req/hour typical)
- Implement caching to reduce API calls
- Contact them to increase limits

**"Products array is empty"**
- Check filter parameters
- Try without filters first
- Verify credentials haven't been revoked

**"Field missing in response"**
- Moneyfacts data varies by product type
- Use defaults (e.g., `valuation_fee: 0`)
- Map what's available

## Support

- Moneyfacts support: support@moneyfacts.co.uk
- API docs: Available after sign-up at moneyfacts.co.uk/business
- Tech contact: Your account manager

---

**Next:** Once Moneyfacts is working, repeat same steps for Defaqto or other providers.
