import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { beforeEach, describe, expect, it, vi } from "vitest";

import { SolanaWalletProvider } from "@/components/providers/solana-wallet-provider";

interface CapturedWalletProviderProps {
  wallets: unknown[];
  autoConnect?: boolean;
  children?: React.ReactNode;
}

const captured = {
  endpoint: undefined as string | undefined,
  walletProviderProps: undefined as CapturedWalletProviderProps | undefined,
};

vi.mock("@solana/wallet-adapter-base", () => ({
  WalletAdapterNetwork: {
    Mainnet: "mainnet-beta",
  },
}));

vi.mock("@solana/web3.js", () => ({
  clusterApiUrl: vi.fn(() => "https://mainnet.example.rpc"),
}));

vi.mock("@solana/wallet-adapter-wallets", () => ({
  PhantomWalletAdapter: function PhantomWalletAdapter() {},
  SolflareWalletAdapter: function SolflareWalletAdapter() {},
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  ConnectionProvider: ({ endpoint, children }: { endpoint: string; children: React.ReactNode }) => {
    captured.endpoint = endpoint;
    return React.createElement("div", { "data-testid": "connection-provider" }, children);
  },
  WalletProvider: (props: CapturedWalletProviderProps) => {
    captured.walletProviderProps = props;
    return React.createElement("div", { "data-testid": "wallet-provider" }, props.children);
  },
}));

vi.mock("@solana/wallet-adapter-react-ui", () => ({
  WalletModalProvider: ({ children }: { children: React.ReactNode }) =>
    React.createElement("div", { "data-testid": "wallet-modal-provider" }, children),
}));

describe("SolanaWalletProvider", () => {
  beforeEach(() => {
    captured.endpoint = undefined;
    captured.walletProviderProps = undefined;
    delete process.env.NEXT_PUBLIC_SOLANA_RPC_URL;
  });

  it("環境変数がない場合は clusterApiUrl のエンドポイントを使う", () => {
    renderToStaticMarkup(
      React.createElement(SolanaWalletProvider, {
        children: React.createElement("div", null, "child"),
      }),
    );

    expect(captured.endpoint).toBe("https://mainnet.example.rpc");
    expect(captured.walletProviderProps?.wallets).toHaveLength(2);
  });

  it("WalletProvider で autoConnect を有効化する", () => {
    renderToStaticMarkup(
      React.createElement(SolanaWalletProvider, {
        children: React.createElement("div", null, "child"),
      }),
    );

    expect(captured.walletProviderProps?.autoConnect).toBe(true);
  });
});
