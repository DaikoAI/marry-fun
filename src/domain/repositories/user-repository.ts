export interface WalletAddressSummary {
  type: string;
  address: string;
  chainId: number | null;
  isPrimary: boolean;
}

export interface UserSummary {
  id: string;
  name: string | null;
  email: string | null;
  walletAddresses: WalletAddressSummary[];
}

export interface UserRepository {
  findById: (userId: string) => Promise<UserSummary | null>;
  findByWalletAddress: (walletAddress: string) => Promise<UserSummary | null>;
}
