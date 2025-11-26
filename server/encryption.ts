import crypto from "crypto";
import { ENV } from "./_core/env";

/**
 * APIキーの暗号化・復号化ヘルパー
 * AES-256-GCMを使用して安全に暗号化
 */

const ALGORITHM = "aes-256-gcm";
const IV_LENGTH = 16;
const SALT_LENGTH = 64;
const TAG_LENGTH = 16;
const KEY_LENGTH = 32;

/**
 * 暗号化キーを生成
 * JWT_SECRETをベースにPBKDF2でキーを導出
 */
function deriveKey(salt: Buffer): Buffer {
  return crypto.pbkdf2Sync(ENV.cookieSecret, salt, 100000, KEY_LENGTH, "sha512");
}

/**
 * APIキーを暗号化
 * @param plaintext 平文のAPIキー
 * @returns 暗号化されたAPIキー（Base64エンコード）
 */
export function encryptApiKey(plaintext: string): string {
  const salt = crypto.randomBytes(SALT_LENGTH);
  const key = deriveKey(salt);
  const iv = crypto.randomBytes(IV_LENGTH);

  const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
  const encrypted = Buffer.concat([cipher.update(plaintext, "utf8"), cipher.final()]);
  const tag = cipher.getAuthTag();

  // salt + iv + tag + encrypted を結合してBase64エンコード
  const result = Buffer.concat([salt, iv, tag, encrypted]);
  return result.toString("base64");
}

/**
 * APIキーを復号化
 * @param ciphertext 暗号化されたAPIキー（Base64エンコード）
 * @returns 平文のAPIキー
 */
export function decryptApiKey(ciphertext: string): string {
  const buffer = Buffer.from(ciphertext, "base64");

  const salt = buffer.subarray(0, SALT_LENGTH);
  const iv = buffer.subarray(SALT_LENGTH, SALT_LENGTH + IV_LENGTH);
  const tag = buffer.subarray(SALT_LENGTH + IV_LENGTH, SALT_LENGTH + IV_LENGTH + TAG_LENGTH);
  const encrypted = buffer.subarray(SALT_LENGTH + IV_LENGTH + TAG_LENGTH);

  const key = deriveKey(salt);

  const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
  decipher.setAuthTag(tag);

  const decrypted = Buffer.concat([decipher.update(encrypted), decipher.final()]);
  return decrypted.toString("utf8");
}
