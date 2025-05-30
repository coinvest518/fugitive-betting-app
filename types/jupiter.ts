export interface JupiterTransactionResult {
  txid: string;
  inputMint: string;
  outputMint: string;
}

export interface JupiterTerminalStyles {
  pageBackground?: string;
  containerBackground?: string;
  contentBackground?: string;
  fontFamily?: string;
  primaryButtonBg?: string;
  secondaryButtonBg?: string;
  buttonTextColor?: string;
  borderRadius?: string;
  containerBorder?: string;
  tooltipBackground?: string;
}

export interface JupiterTerminalConfig {
  endpoint: string;
  containerId: string;
  containerStyles?: JupiterTerminalStyles;
  defaultExplorer?: string;
  displayMode?: 'modal' | 'integrated';
  integratedTargetId?: string;
  platformFeeAndAccounts?: {
    feeBps: number;
    feeAccounts: Record<string, string>;
  };
  onSuccess?: (result: JupiterTransactionResult) => void;
  onError?: (error: Error) => void;
}

declare global {
  interface Window {
    Jupiter?: {
      init(config: JupiterTerminalConfig): void;
      close(): void;
      _instance?: unknown;
    };
  }
}