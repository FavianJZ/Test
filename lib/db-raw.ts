const mysql = require('mysql2/promise');

let connection: mysql.Connection | null = null;

async function getConnection() {
  if (!connection) {
    connection = await mysql.createConnection({
      host: 'localhost',
      user: 'root',
      password: '',
      database: 'hikaricha_db'
    });
  }
  return connection;
}

export interface BorderWithUnlockStatus {
  id: string;
  name: string;
  description: string | null;
  imageUrl: string;
  price: number | null;
  rarity: string;
  isActive: boolean;
  sortOrder: number;
  unlocked: boolean;
  unlockType?: string;
  unlockedAt?: Date | null;
  pricePaid?: number | null;
}

export interface User {
  id: string;
  name: string | null;
  email: string;
  bio: string | null;
  location: string | null;
  points: number;
  selectedBorder: string;
  createdAt: Date;
  updatedAt: Date;
}

export interface Activity {
  id: string;
  userId: string;
  type: string;
  title: string;
  description: string | null;
  metadata: string | null;
  createdAt: Date;
}

export class DatabaseService {
  public async getConnection() {
    return await getConnection();
  }

  async getUserByEmail(email: string): Promise<User | null> {
    try {
      const conn = await this.getConnection();
      const [rows] = await conn.execute(
        'SELECT id, name, email, bio, location, points, selectedBorder, image, createdAt, updatedAt FROM user WHERE email = ?',
        [email]
      ) as any;

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  }

  async getUserById(userId: string): Promise<User | null> {
    try {
      const conn = await this.getConnection();
      const [rows] = await conn.execute(
        'SELECT id, name, email, bio, location, points, selectedBorder, image, createdAt, updatedAt FROM user WHERE id = ?',
        [userId]
      ) as any;

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error getting user:', error);
      return null;
    }
  }

  async updateUserProfile(userId: string, data: Partial<User>): Promise<boolean> {
    try {
      const conn = await getConnection();
      const fields = [];
      const values = [];

      if (data.name !== undefined) {
        fields.push('name = ?');
        values.push(data.name);
      }
      if (data.bio !== undefined) {
        fields.push('bio = ?');
        values.push(data.bio);
      }
      if (data.location !== undefined) {
        fields.push('location = ?');
        values.push(data.location);
      }
      if (data.selectedBorder !== undefined) {
        fields.push('selectedBorder = ?');
        values.push(data.selectedBorder);
      }

      if (fields.length === 0) return true;

      values.push(userId);

      await conn.execute(
        `UPDATE user SET ${fields.join(', ')} WHERE id = ?`,
        values
      );

      return true;
    } catch (error) {
      console.error('Error updating user profile:', error);
      return false;
    }
  }

  async getAllBordersWithUnlockStatus(userId: string): Promise<BorderWithUnlockStatus[]> {
    try {
      const conn = await getConnection();

      // Get all borders
      const [borders] = await conn.execute(
        'SELECT id, name, description, imageUrl, price, rarity, isActive, sortOrder FROM border WHERE isActive = true ORDER BY sortOrder ASC, rarity ASC, name ASC'
      ) as any;

      // Get user's unlocked borders
      const [unlocks] = await conn.execute(
        'SELECT borderId, unlockType, unlockedAt, pricePaid FROM borderunlock WHERE userId = ?',
        [userId]
      ) as any;

      const unlockedBorderIds = new Set(unlocks.map((unlock: any) => unlock.borderId));
      const unlockMap = new Map(unlocks.map((unlock: any) => [unlock.borderId, unlock]));

      return borders.map((border: any) => {
        const unlockData = unlockedBorderIds.has(border.id) ? unlockMap.get(border.id) : {};
        return {
          ...border,
          unlocked: unlockedBorderIds.has(border.id) || border.name.toLowerCase() === 'default',
          unlockType: unlockData?.unlockType,
          unlockedAt: unlockData?.unlockedAt,
          pricePaid: unlockData?.pricePaid
        };
      });

    } catch (error) {
      console.error('Error getting borders:', error);
      return [];
    }
  }

  async getUserPoints(userId: string): Promise<number> {
    try {
      const conn = await getConnection();
      const [rows] = await conn.execute(
        'SELECT points FROM user WHERE id = ?',
        [userId]
      ) as any;

      return rows.length > 0 ? rows[0].points : 0;
    } catch (error) {
      console.error('Error getting user points:', error);
      return 0;
    }
  }

  async purchaseBorder(userId: string, borderId: string): Promise<{ success: boolean; message: string; newPointsBalance?: number }> {
    try {
      const conn = await getConnection();

      // Get border and user info
      const [borderRows] = await conn.execute(
        'SELECT * FROM border WHERE id = ? AND isActive = true',
        [borderId]
      ) as any;

      const [userRows] = await conn.execute(
        'SELECT id, points FROM user WHERE id = ?',
        [userId]
      ) as any;

      if (borderRows.length === 0) {
        return { success: false, message: 'Border tidak ditemukan' };
      }

      if (userRows.length === 0) {
        return { success: false, message: 'User tidak ditemukan' };
      }

      const border = borderRows[0];
      const user = userRows[0];

      if (!border.price || border.price <= 0) {
        return { success: false, message: 'Border ini tidak bisa dibeli dengan poin' };
      }

      if (user.points < border.price) {
        return {
          success: false,
          message: `Poin tidak cukup. Diperlukan ${border.price} poin, Anda punya ${user.points} poin`
        };
      }

      // Check if already unlocked
      const [existingUnlocks] = await conn.execute(
        'SELECT id FROM borderunlock WHERE userId = ? AND borderId = ?',
        [userId, borderId]
      ) as any;

      if (existingUnlocks.length > 0) {
        return { success: false, message: 'Border ini sudah Anda miliki' };
      }

      // Start transaction - skip transaction for now due to MySQL2 limitations
      // await conn.query('START TRANSACTION');

      try {
        // Deduct points
        await conn.query(
          `UPDATE user SET points = points - ${border.price} WHERE id = '${userId}'`
        );

        // Create border unlock
        const unlockId = `${userId}_${borderId}_${Date.now()}`;
        await conn.query(
          `INSERT INTO borderunlock (id, userId, borderId, unlockType, unlockedAt, pricePaid) VALUES ('${unlockId}', '${userId}', '${borderId}', 'PURCHASE', NOW(), ${border.price})`
        );

        // Create point transaction record
        const transactionId = `${userId}_${borderId}_${Date.now()}_tx`;
        await conn.query(
          `INSERT INTO pointtransaction (id, userId, type, amount, description, metadata, createdAt) VALUES ('${transactionId}', '${userId}', 'SPENT', ${-border.price}, 'Membeli border ${border.name}', '${JSON.stringify({ borderId, borderName: border.name, purchaseType: 'border' })}', NOW())`
        );

        // await conn.query('COMMIT');

        // Get updated points
        const [updatedUser] = await conn.execute(
          'SELECT points FROM user WHERE id = ?',
          [userId]
        ) as any;

        return {
          success: true,
          message: `Berhasil membeli border ${border.name}!`,
          newPointsBalance: updatedUser[0].points
        };

      } catch (error) {
        // await conn.query('ROLLBACK');
        throw error;
      }

    } catch (error) {
      console.error('Error purchasing border:', error);
      return { success: false, message: 'Terjadi kesalahan saat membeli border' };
    }
  }

  async selectUserBorder(userId: string, borderId: string): Promise<{ success: boolean; message: string }> {
    try {
      const conn = await getConnection();

      // Check if user has unlocked this border
      const [unlocks] = await conn.execute(
        'SELECT id FROM borderunlock WHERE userId = ? AND borderId = ?',
        [userId, borderId]
      ) as any;

      // Check if border exists and is default
      const [borderRows] = await conn.execute(
        'SELECT name FROM border WHERE id = ?',
        [borderId]
      ) as any;

      if (borderRows.length === 0) {
        return { success: false, message: 'Border tidak ditemukan' };
      }

      const border = borderRows[0];

      if (border.name.toLowerCase() !== 'default' && unlocks.length === 0) {
        return { success: false, message: 'Anda belum memiliki border ini' };
      }

      // Update user's selected border
      await conn.execute(
        'UPDATE user SET selectedBorder = ? WHERE id = ?',
        [borderId, userId]
      );

      return {
        success: true,
        message: `Border ${border.name} berhasil dipilih`
      };

    } catch (error) {
      console.error('Error selecting border:', error);
      return { success: false, message: 'Terjadi kesalahan saat memilih border' };
    }
  }

  async getUserActivities(userId: string, limit = 20): Promise<Activity[]> {
    try {
      const conn = await getConnection();
      const [rows] = await conn.execute(
        'SELECT * FROM activity WHERE userId = ? ORDER BY createdAt DESC LIMIT ?',
        [userId, limit]
      ) as any;

      return rows;
    } catch (error) {
      console.error('Error getting user activities:', error);
      return [];
    }
  }

  async getBorderById(borderId: string): Promise<any | null> {
    try {
      const conn = await getConnection();
      const [rows] = await conn.execute(
        'SELECT id, name, description, imageUrl, price, rarity, isActive, sortOrder FROM border WHERE id = ? AND isActive = true',
        [borderId]
      ) as any;

      return rows.length > 0 ? rows[0] : null;
    } catch (error) {
      console.error('Error getting border by ID:', error);
      return null;
    }
  }

  async getAllBorders(): Promise<any[]> {
    try {
      const conn = await getConnection();
      const [rows] = await conn.execute(
        'SELECT id, name, description, imageUrl, price, rarity, isActive, sortOrder FROM border WHERE isActive = true ORDER BY sortOrder ASC, rarity ASC, name ASC'
      ) as any;

      return rows;
    } catch (error) {
      console.error('Error getting all borders:', error);
      return [];
    }
  }

  async createActivity(userId: string, type: string, title: string, description?: string, metadata?: any): Promise<boolean> {
    try {
      const conn = await getConnection();
      const activityId = `${userId}_${type}_${Date.now()}`;

      await conn.execute(
        'INSERT INTO activity (id, userId, type, title, description, metadata, createdAt) VALUES (?, ?, ?, ?, ?, ?, NOW())',
        [activityId, userId, type, title, description, metadata ? JSON.stringify(metadata) : null]
      );

      return true;
    } catch (error) {
      console.error('Error creating activity:', error);
      return false;
    }
  }
}

export const dbService = new DatabaseService();