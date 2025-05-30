import { useEffect, useState } from "react"
import { PublicKey, Connection } from "@solana/web3.js"
import { getAssociatedTokenAddress, getAccount } from "@solana/spl-token"
import Image from "next/image"

const FBT_MINT = process.env.NEXT_PUBLIC_FBT_TOKEN_MINT || "3WTRBAff4xWSYPjHephFmupG2LeTXvSyFAx8YKKWNpzY"
const FBT_METADATA_URL = "https://gateway.irys.xyz/DhfH8QAoKK1thMpTdvdaaCXhLqpu1qyNdXBCp9edexFk"
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"

export function FbtBalance({ walletAddress }: { walletAddress: string | null }) {
  const [balance, setBalance] = useState<number | null>(null)
  const [meta, setMeta] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!walletAddress) return
    setLoading(true)
    const fetchBalance = async () => {
      try {
        const connection = new Connection(SOLANA_RPC)
        const mint = new PublicKey(FBT_MINT)
        const user = new PublicKey(walletAddress)
        const ata = await getAssociatedTokenAddress(mint, user)
        const account = await getAccount(connection, ata)
        setBalance(Number(account.amount) / 1_000_000_000)
      } catch (e) {
        setBalance(0)
      } finally {
        setLoading(false)
      }
    }
    fetchBalance()
  }, [walletAddress])

  useEffect(() => {
    fetch(FBT_METADATA_URL)
      .then(res => res.json())
      .then(setMeta)
      .catch(() => setMeta(null))
  }, [])

  if (!walletAddress) return null
  return (
    <div className="flex items-center gap-3 bg-black/30 border border-purple-800/30 rounded-lg px-4 py-2">
      {meta?.image && (
        <Image src={meta.image} alt="FBT Token" width={32} height={32} className="rounded-full" />
      )}
      <div>
        <div className="text-white font-bold text-lg">{loading ? "..." : balance ?? 0} FBT</div>
        <div className="text-xs text-purple-300">Fugitive Betting Token</div>
      </div>
    </div>
  )
}
