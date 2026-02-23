import React from "react";
import { renderToStaticMarkup } from "react-dom/server";
import { describe, expect, it, vi } from "vitest";

import { SolanaAuthPanel } from "@/components/auth/solana-auth-panel";

const mockWalletState = {
  connected: false,
  connecting: false,
  publicKey: null as { toBase58: () => string } | null,
  signMessage: undefined as ((message: Uint8Array) => Promise<Uint8Array>) | undefined,
};

const mockSessionState = {
  data: null as { session?: unknown; user?: { name?: string | null } } | null,
  isPending: false,
  refetch: vi.fn(),
};

vi.mock("next-intl", () => ({
  useTranslations: vi.fn(() => (key: string) => key),
}));

vi.mock("@solana/wallet-adapter-react", () => ({
  useWallet: function walletHook() {
    return mockWalletState;
  },
}));

vi.mock("@solana/wallet-adapter-react-ui", () => ({
  useWalletModal: function walletModalHook() {
    return { setVisible: vi.fn() };
  },
}));

vi.mock("@/lib/auth/auth-client", () => ({
  authClient: {
    useSession: function sessionHook() {
      return mockSessionState;
    },
    web3: {
      nonce: vi.fn(),
    },
    linkSocial: vi.fn(),
    signOut: vi.fn(),
  },
}));

describe("SolanaAuthPanel", () => {
  it("wallet 未認証でも X ボタンを表示し、無効化する", () => {
    mockWalletState.connected = false;
    mockWalletState.connecting = false;
    mockWalletState.publicKey = null;
    mockSessionState.data = null;

    const html = renderToStaticMarkup(React.createElement(SolanaAuthPanel));

    expect(html).toContain(">connectWallet<");
    expect(html).toContain(">connectX<");
    expect(html).toContain("disabled");
  });

  it("onboarding variant でも wallet 認証後に X ボタンを表示する", () => {
    mockWalletState.connected = true;
    mockWalletState.connecting = false;
    mockWalletState.publicKey = { toBase58: () => "7K6r3x7y8jP2m6PV4m9WQbqv9cG7hX5aQk3bF1wVx5kD" };
    mockSessionState.data = { session: { id: "s1" }, user: { name: "alice" } };

    const html = renderToStaticMarkup(React.createElement(SolanaAuthPanel, { variant: "onboarding" }));

    expect(html).toContain(">connectX<");
    expect(html).not.toContain(">Sign Out<");
  });
});
