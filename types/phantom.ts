import { PublicKey, Transaction } from "@solana/web3.js"

export interface PhantomWallet {
  isPhantom?: boolean;
  publicKey?: PublicKey;
  isConnected: boolean;
  signTransaction(transaction: Transaction): Promise<Transaction>;
  signAllTransactions(transactions: Transaction[]): Promise<Transaction[]>;
  signMessage(message: Uint8Array): Promise<{ signature: Uint8Array }>;
  connect(): Promise<{ publicKey: PublicKey }>;
  disconnect(): Promise<void>;
}
