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
      <head>
        {/* Google tag (gtag.js) */}
        <script async src="https://www.googletagmanager.com/gtag/js?id=G-2MDDHWK9B0"></script>
        <script dangerouslySetInnerHTML={{
          __html: `
            window.dataLayer = window.dataLayer || [];
            function gtag(){dataLayer.push(arguments);}
            gtag('js', new Date());
            gtag('config', 'G-2MDDHWK9B0');
          `,
        }} />
      </head>
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
