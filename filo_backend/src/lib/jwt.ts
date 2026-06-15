import { SignJWT, jwtVerify } from "jose";

// ─── Types ────────────────────────────────────────────────────────────────────
export interface TokenPayload {
  id: string;
  email: string;
  role: "user" | "admin";
}

type TokenType = "access" | "refresh";

// ─── TokenConfig ──────────────────────────────────────────────────────────────
class TokenConfig {
  readonly secret: Uint8Array;
  readonly expiresIn: string;

  constructor(envKey: string, defaultExpiry: string) {
    this.secret = TokenConfig.resolveSecret(envKey);
    this.expiresIn = process.env[`${envKey}_EXPIRES_IN`] ?? defaultExpiry;
  }

  private static resolveSecret(envKey: string): Uint8Array {
    const value = process.env[envKey];
    if (!value) {
      throw new Error(`Missing required environment variable: ${envKey}`);
    }
    return new TextEncoder().encode(value);
  }
}

// ─── JwtService ───────────────────────────────────────────────────────────────
export class JwtService {
  private readonly accessConfig: TokenConfig;
  private readonly refreshConfig: TokenConfig;

  constructor() {
    this.accessConfig = new TokenConfig("ACCESS_TOKEN_SECRET", "15m");
    this.refreshConfig = new TokenConfig("REFRESH_TOKEN_SECRET", "30d");
  }

  async sign(
    id: string,
    email: string,
    role: TokenPayload["role"] = "user",
    type: TokenType = "access",
  ): Promise<string> {
    const { secret, expiresIn } = this.getConfig(type);

    return new SignJWT({ id, email, role })
      .setProtectedHeader({ alg: "HS256" })
      .setIssuedAt()
      .setExpirationTime(expiresIn)
      .sign(secret);
  }

  async verify(token: string, type: TokenType): Promise<TokenPayload | null> {
    try {
      const { payload } = await jwtVerify(token, this.getConfig(type).secret);
      return this.buildPayload(payload);
    } catch {
      return null;
    }
  }

  private getConfig(type: TokenType): TokenConfig {
    return type === "access" ? this.accessConfig : this.refreshConfig;
  }

  private buildPayload(payload: Record<string, unknown>): TokenPayload {
    const { id, email, role } = payload;

    if (typeof id !== "string" || typeof email !== "string" || typeof role !== "string") {
      throw new Error("Invalid token payload shape");
    }

    if (role !== "user" && role !== "admin") {
      throw new Error(`Invalid role in token payload: ${role}`);
    }

    return { id, email, role };
  }
}

// ─── Singleton ────────────────────────────────────────────────────────────────
export const jwtService = new JwtService();
