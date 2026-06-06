import { Controller, Get, Post, Body, UnauthorizedException, Headers } from '@nestjs/common';
import { PrismaService } from './prisma/prisma.service';
import * as jwt from 'jsonwebtoken';
import { randomBytes, createHash } from 'crypto';

// --- Pickleball Auth Helpers ---
const PB_JWT_SECRET = () =>
  process.env.PICKLEBALL_JWT_SECRET ||
  process.env.ADMIN_PASSWORD ||
  'pickleball-default-secret-change-me';

const PB_ACCESS_EXPIRES = '15m';
const PB_REFRESH_EXPIRES_MS = 7 * 24 * 60 * 60 * 1000; // 7 ngày

function signAccessToken(): string {
  return jwt.sign({ role: 'admin', app: 'pickleball' }, PB_JWT_SECRET(), {
    expiresIn: PB_ACCESS_EXPIRES,
  } as jwt.SignOptions);
}

function verifyAccessToken(token: string): jwt.JwtPayload {
  return jwt.verify(token, PB_JWT_SECRET()) as jwt.JwtPayload;
}

function hashToken(raw: string): string {
  return createHash('sha256').update(raw).digest('hex');
}

function extractBearer(authHeader?: string): string | null {
  if (!authHeader?.startsWith('Bearer ')) return null;
  return authHeader.slice(7);
}

@Controller()
export class AppController {
  constructor(private readonly prisma: PrismaService) {}

  @Get()
  healthCheck(): string {
    return '🏓 Pickleball API is running';
  }

  // ===== Tournament State =====

  @Get('pickleball-state')
  async getState() {
    const record = await this.prisma.keyValuePair.findUnique({
      where: { key: 'live_group_final' },
    });
    return record ? JSON.parse(record.value) : null;
  }

  @Post('pickleball-state')
  async saveState(
    @Body() state: any,
    @Headers('authorization') authHeader?: string,
  ) {
    const token = extractBearer(authHeader);
    if (!token) throw new UnauthorizedException('Thiếu access token.');
    try {
      verifyAccessToken(token);
    } catch {
      throw new UnauthorizedException('Access token không hợp lệ hoặc đã hết hạn.');
    }

    await this.prisma.keyValuePair.upsert({
      where: { key: 'live_group_final' },
      create: { key: 'live_group_final', value: JSON.stringify(state) },
      update: { value: JSON.stringify(state) },
    });
    return { success: true };
  }

  // ===== Auth =====

  @Post('pickleball-login')
  async pickleballLogin(@Body() body: { password: string }) {
    const adminPass =
      process.env.PICKLEBALL_ADMIN_PASSWORD ||
      process.env.ADMIN_PASSWORD ||
      'golab2026';

    if (body?.password !== adminPass) {
      throw new UnauthorizedException('Mật khẩu không đúng.');
    }

    const accessToken = signAccessToken();
    const rawRefresh = randomBytes(48).toString('base64url');
    const tokenHash = hashToken(rawRefresh);
    const expiresAt = new Date(Date.now() + PB_REFRESH_EXPIRES_MS);

    await this.prisma.keyValuePair.upsert({
      where: { key: `pb_refresh_${tokenHash}` },
      create: { key: `pb_refresh_${tokenHash}`, value: expiresAt.toISOString() },
      update: { value: expiresAt.toISOString() },
    });

    return { accessToken, refreshToken: rawRefresh };
  }

  @Post('pickleball-refresh')
  async pickleballRefresh(@Body() body: { refreshToken: string }) {
    if (!body?.refreshToken) {
      throw new UnauthorizedException('Thiếu refresh token.');
    }

    const tokenHash = hashToken(body.refreshToken);
    const record = await this.prisma.keyValuePair.findUnique({
      where: { key: `pb_refresh_${tokenHash}` },
    });

    if (!record) {
      throw new UnauthorizedException('Refresh token không hợp lệ.');
    }

    const expiresAt = new Date(record.value);
    if (expiresAt <= new Date()) {
      await this.prisma.keyValuePair.delete({ where: { key: `pb_refresh_${tokenHash}` } });
      throw new UnauthorizedException('Refresh token đã hết hạn. Vui lòng đăng nhập lại.');
    }

    // Rotate: xóa cũ, cấp mới
    await this.prisma.keyValuePair.delete({ where: { key: `pb_refresh_${tokenHash}` } });

    const accessToken = signAccessToken();
    const rawRefresh = randomBytes(48).toString('base64url');
    const newHash = hashToken(rawRefresh);
    const newExpiry = new Date(Date.now() + PB_REFRESH_EXPIRES_MS);

    await this.prisma.keyValuePair.upsert({
      where: { key: `pb_refresh_${newHash}` },
      create: { key: `pb_refresh_${newHash}`, value: newExpiry.toISOString() },
      update: { value: newExpiry.toISOString() },
    });

    return { accessToken, refreshToken: rawRefresh };
  }

  @Post('pickleball-logout')
  async pickleballLogout(@Body() body: { refreshToken?: string }) {
    if (body?.refreshToken) {
      const tokenHash = hashToken(body.refreshToken);
      await this.prisma.keyValuePair
        .delete({ where: { key: `pb_refresh_${tokenHash}` } })
        .catch(() => {});
    }
    return { success: true };
  }
}
