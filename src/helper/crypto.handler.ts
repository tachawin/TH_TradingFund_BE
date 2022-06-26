import crypto from 'crypto';

import config from '../config/config';

export function encryptWebhookTransaction(plaintext: string): string {
  const {
    algorithm, vector, secret, encoding, format,
  } = config.encrypt.webhook_transaction;

  const encrypter = crypto.createCipheriv(algorithm, secret, vector);

  let encrypted = encrypter.update(plaintext, encoding, format);
  encrypted += encrypter.final('hex');

  return encrypted;
}

export function decryptWebhookTransaction(encrypted: string): string {
  const {
    algorithm, vector, secret, encoding, format,
  } = config.encrypt.webhook_transaction;

  const decrypter = crypto.createDecipheriv(algorithm, secret, vector);

  const decrypted = decrypter.update(encrypted, format, encoding);

  return decrypted;
}
