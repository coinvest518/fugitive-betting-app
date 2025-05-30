import { TokenPriceProvider } from '@/components/token-price-provider'
import { ThemeProvider } from '@/components/theme-provider'
import { SolanaWalletProvider } from '@/components/solana-wallet-provider'
import './globals.css'

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode
}>) {
  return (
    <html lang="en">
      <body>
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <TokenPriceProvider>
            <SolanaWalletProvider>
              {children}
            </SolanaWalletProvider>
          </TokenPriceProvider>
        </ThemeProvider>
      </body>
    </html>
  )
}
