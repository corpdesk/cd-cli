export interface KeyValueStorage<T> {
  key: string;
  value: T;
  expiresAt?: number; // Optional expiration timestamp
}
