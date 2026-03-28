import crypto from 'crypto';
import pool from '@/database/connection';
import {
  BrokerSession,
  BrokerDealHighlight,
  ShareLink,
  CreateBrokerSessionRequest,
} from '@/types';

export class BrokerService {
  /**
   * Create a draft broker session
   */
  static async createSession(
    brokerId: string,
    data: CreateBrokerSessionRequest
  ): Promise<BrokerSession> {
    const result = await pool.query(
      `INSERT INTO broker_sessions (
        broker_id, client_name, client_email,
        property_value, deposit, purchase_type, property_type, leasehold,
        gross_income, joint_application, second_income, employment_status,
        monthly_outgoings, credit_profile, age, term_years, priorities,
        overpayment_plans, overpayment_amount, moving_within_5_years,
        risk_tolerance, savings_amount, broker_notes
      ) VALUES (
        $1, $2, $3, $4, $5, $6, $7, $8, $9, $10,
        $11, $12, $13, $14, $15, $16, $17, $18, $19, $20, $21, $22, $23
      ) RETURNING *`,
      [
        brokerId,
        data.clientName,
        data.clientEmail || null,
        data.propertyValue,
        data.deposit,
        data.purchaseType,
        data.propertyType || null,
        data.leasehold || false,
        data.grossIncome,
        data.jointApplication || false,
        data.secondIncome || 0,
        data.employmentStatus || null,
        data.monthlyOutgoings || 0,
        data.creditProfile || null,
        data.age || null,
        data.termYears,
        data.priorities || [],
        data.overpaymentPlans || false,
        data.overpaymentAmount || 0,
        data.movingWithin5Years || false,
        data.riskTolerance ?? 50,
        data.savingsAmount || 0,
        data.brokerNotes || null,
      ]
    );

    return result.rows[0];
  }

  /**
   * Update session fields
   */
  static async updateSession(
    sessionId: string,
    brokerId: string,
    data: Partial<CreateBrokerSessionRequest>
  ): Promise<BrokerSession> {
    const fields: string[] = [];
    const values: any[] = [];
    let paramCount = 1;

    const fieldMap: Record<string, string> = {
      clientName: 'client_name',
      clientEmail: 'client_email',
      propertyValue: 'property_value',
      deposit: 'deposit',
      purchaseType: 'purchase_type',
      propertyType: 'property_type',
      leasehold: 'leasehold',
      grossIncome: 'gross_income',
      jointApplication: 'joint_application',
      secondIncome: 'second_income',
      employmentStatus: 'employment_status',
      monthlyOutgoings: 'monthly_outgoings',
      creditProfile: 'credit_profile',
      age: 'age',
      termYears: 'term_years',
      priorities: 'priorities',
      overpaymentPlans: 'overpayment_plans',
      overpaymentAmount: 'overpayment_amount',
      movingWithin5Years: 'moving_within_5_years',
      riskTolerance: 'risk_tolerance',
      savingsAmount: 'savings_amount',
      brokerNotes: 'broker_notes',
    };

    for (const [key, column] of Object.entries(fieldMap)) {
      if ((data as any)[key] !== undefined) {
        fields.push(`${column} = $${paramCount++}`);
        values.push((data as any)[key]);
      }
    }

    if (fields.length === 0) {
      throw { statusCode: 400, message: 'No fields to update' };
    }

    fields.push('updated_at = CURRENT_TIMESTAMP');
    values.push(sessionId, brokerId);

    const result = await pool.query(
      `UPDATE broker_sessions SET ${fields.join(', ')}
       WHERE id = $${paramCount++} AND broker_id = $${paramCount}
       RETURNING *`,
      values
    );

    if (result.rows.length === 0) {
      throw { statusCode: 404, message: 'Session not found' };
    }

    return result.rows[0];
  }

  /**
   * Get session with highlights
   */
  static async getSession(sessionId: string): Promise<{ session: BrokerSession; highlights: BrokerDealHighlight[] }> {
    const sessionResult = await pool.query(
      'SELECT * FROM broker_sessions WHERE id = $1',
      [sessionId]
    );

    if (sessionResult.rows.length === 0) {
      throw { statusCode: 404, message: 'Session not found' };
    }

    const highlightsResult = await pool.query(
      'SELECT * FROM broker_deal_highlights WHERE session_id = $1 ORDER BY display_order ASC',
      [sessionId]
    );

    return {
      session: sessionResult.rows[0],
      highlights: highlightsResult.rows,
    };
  }

  /**
   * List all broker's sessions
   */
  static async getSessions(brokerId: string): Promise<BrokerSession[]> {
    const result = await pool.query(
      'SELECT * FROM broker_sessions WHERE broker_id = $1 ORDER BY created_at DESC',
      [brokerId]
    );
    return result.rows;
  }

  /**
   * Publish session and auto-create share link
   */
  static async publishSession(
    sessionId: string,
    brokerId: string
  ): Promise<{ session: BrokerSession; shareLink: ShareLink }> {
    const client = await pool.connect();
    try {
      await client.query('BEGIN');

      const sessionResult = await client.query(
        `UPDATE broker_sessions SET status = 'published', updated_at = CURRENT_TIMESTAMP
         WHERE id = $1 AND broker_id = $2 AND status = 'draft'
         RETURNING *`,
        [sessionId, brokerId]
      );

      if (sessionResult.rows.length === 0) {
        throw { statusCode: 404, message: 'Draft session not found' };
      }

      const token = crypto.randomBytes(32).toString('hex');

      const linkResult = await client.query(
        `INSERT INTO share_links (session_id, token, expires_at)
         VALUES ($1, $2, CURRENT_TIMESTAMP + INTERVAL '30 days')
         RETURNING *`,
        [sessionId, token]
      );

      await client.query('COMMIT');

      return {
        session: sessionResult.rows[0],
        shareLink: linkResult.rows[0],
      };
    } catch (err) {
      await client.query('ROLLBACK');
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Add a deal highlight to a session
   */
  static async addDealHighlight(
    sessionId: string,
    dealId: string,
    highlightType: string,
    comment: string | null,
    order: number
  ): Promise<BrokerDealHighlight> {
    const result = await pool.query(
      `INSERT INTO broker_deal_highlights (session_id, deal_id, highlight_type, broker_comment, display_order)
       VALUES ($1, $2, $3, $4, $5)
       RETURNING *`,
      [sessionId, dealId, highlightType, comment, order]
    );
    return result.rows[0];
  }

  /**
   * Remove a deal highlight from a session
   */
  static async removeDealHighlight(sessionId: string, dealId: string): Promise<void> {
    const result = await pool.query(
      'DELETE FROM broker_deal_highlights WHERE session_id = $1 AND deal_id = $2',
      [sessionId, dealId]
    );

    if (result.rowCount === 0) {
      throw { statusCode: 404, message: 'Highlight not found' };
    }
  }

  /**
   * Public: get session by share token, increment view count
   */
  static async getSessionByShareToken(
    token: string
  ): Promise<{ session: BrokerSession; highlights: BrokerDealHighlight[]; shareLink: ShareLink }> {
    const linkResult = await pool.query(
      `UPDATE share_links
       SET view_count = view_count + 1, last_viewed_at = CURRENT_TIMESTAMP
       WHERE token = $1 AND is_active = true AND (expires_at IS NULL OR expires_at > CURRENT_TIMESTAMP)
       RETURNING *`,
      [token]
    );

    if (linkResult.rows.length === 0) {
      throw { statusCode: 404, message: 'Share link not found or expired' };
    }

    const shareLink: ShareLink = linkResult.rows[0];

    const sessionResult = await pool.query(
      'SELECT * FROM broker_sessions WHERE id = $1',
      [shareLink.session_id]
    );

    if (sessionResult.rows.length === 0) {
      throw { statusCode: 404, message: 'Session not found' };
    }

    // Mark session as viewed if still published
    if (sessionResult.rows[0].status === 'published') {
      await pool.query(
        `UPDATE broker_sessions SET status = 'viewed', updated_at = CURRENT_TIMESTAMP WHERE id = $1`,
        [shareLink.session_id]
      );
      sessionResult.rows[0].status = 'viewed';
    }

    const highlightsResult = await pool.query(
      'SELECT * FROM broker_deal_highlights WHERE session_id = $1 ORDER BY display_order ASC',
      [shareLink.session_id]
    );

    return {
      session: sessionResult.rows[0],
      highlights: highlightsResult.rows,
      shareLink,
    };
  }

  /**
   * Save consumer's what-if override
   */
  static async saveConsumerOverride(
    shareLinkId: string,
    overrideData: Record<string, any>
  ): Promise<any> {
    const result = await pool.query(
      `INSERT INTO consumer_overrides (share_link_id, override_data)
       VALUES ($1, $2)
       RETURNING *`,
      [shareLinkId, JSON.stringify(overrideData)]
    );
    return result.rows[0];
  }

  /**
   * Deactivate a share link
   */
  static async deactivateShareLink(linkId: string, brokerId: string): Promise<void> {
    const result = await pool.query(
      `UPDATE share_links SET is_active = false
       WHERE id = $1 AND session_id IN (
         SELECT id FROM broker_sessions WHERE broker_id = $2
       )`,
      [linkId, brokerId]
    );

    if (result.rowCount === 0) {
      throw { statusCode: 404, message: 'Share link not found' };
    }
  }
}
