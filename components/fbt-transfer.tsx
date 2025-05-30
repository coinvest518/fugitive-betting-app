import { useState } from "react"
import { PublicKey, Connection, Transaction, SystemProgram } from "@solana/web3.js"
import { getAssociatedTokenAddress, createTransferInstruction, createAssociatedTokenAccountInstruction } from "@solana/spl-token"

const FBT_MINT = process.env.NEXT_PUBLIC_FBT_TOKEN_MINT || "3WTRBAff4xWSYPjHephFmupG2LeTXvSyFAx8YKKWNpzY"
const FBT_DECIMALS = 9
const FEE_WALLET = process.env.NEXT_PUBLIC_FBT_FEE_WALLET || "321pvxk5pcQCQuDy7PDZe6iUqHj9pEEyJZiHFsvD7Jzw"
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com"
const FEE_BPS = 100 // 1% fee (100 basis points)

export function FbtTransfer({ walletAddress }: { walletAddress: string | null }) {
  const [recipient, setRecipient] = useState("")
  const [amount, setAmount] = useState("")
  const [status, setStatus] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)

  const handleTransfer = async () => {
    if (!walletAddress || !recipient || !amount) return
    setLoading(true)
    setStatus(null)
    try {
      // @ts-ignore
      const provider = window.solana
      if (!provider) throw new Error("Wallet not found")
      await provider.connect()
      const connection = new Connection(SOLANA_RPC)
      const from = new PublicKey(walletAddress)
      const to = new PublicKey(recipient)
      const mint = new PublicKey(FBT_MINT)
      const feeWallet = new PublicKey(FEE_WALLET)
      const ataFrom = await getAssociatedTokenAddress(mint, from)
      const ataTo = await getAssociatedTokenAddress(mint, to)
      const ataFee = await getAssociatedTokenAddress(mint, feeWallet)
      // Check if recipient ATA exists
      const ataToInfo = await connection.getAccountInfo(ataTo)
      // Check if fee wallet ATA exists
      const ataFeeInfo = await connection.getAccountInfo(ataFee)
      const instructions = []
      if (!ataToInfo) {
        instructions.push(
          createAssociatedTokenAccountInstruction(from, ataTo, to, mint)
        )
      }
      if (!ataFeeInfo) {
        instructions.push(
          createAssociatedTokenAccountInstruction(from, ataFee, feeWallet, mint)
        )
      }
      const rawAmount = Math.floor(Number(amount) * 10 ** FBT_DECIMALS)
      const fee = Math.floor((rawAmount * FEE_BPS) / 10000)
      const toSend = rawAmount - fee
      if (toSend <= 0) throw new Error("Amount too small after fee")
      const ix1 = createTransferInstruction(ataFrom, ataTo, from, toSend)
      const ix2 = createTransferInstruction(ataFrom, ataFee, from, fee)
      instructions.push(ix1, ix2)
      const tx = new Transaction().add(...instructions)
      tx.feePayer = from
      tx.recentBlockhash = (await connection.getLatestBlockhash()).blockhash
      if (!provider.signTransaction) throw new Error("Wallet does not support signTransaction")
      const signed = await provider.signTransaction(tx)
      const sig = await connection.sendRawTransaction(signed.serialize())
      setStatus(`Success! Tx: ${sig}`)
    } catch (e: any) {
      setStatus(e.message || "Transfer failed")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="bg-black/30 border border-purple-800/30 rounded-lg p-4 mt-4">
      <div className="font-bold text-white mb-2">Send FBT Token</div>
      <input
        className="w-full mb-2 p-2 rounded bg-black/50 text-white border border-purple-800/30"
        placeholder="Recipient Address"
        value={recipient}
        onChange={e => setRecipient(e.target.value)}
      />
      <input
        className="w-full mb-2 p-2 rounded bg-black/50 text-white border border-purple-800/30"
        placeholder="Amount"
        type="number"
        min="0"
        value={amount}
        onChange={e => setAmount(e.target.value)}
      />
      <button
        className="w-full bg-gradient-to-r from-purple-600 to-pink-600 text-white py-2 rounded disabled:opacity-50"
        onClick={handleTransfer}
        disabled={loading || !walletAddress}
      >
        {loading ? "Sending..." : "Send FBT"}
      </button>
      {status && <div className="mt-2 text-xs text-purple-300">{status}</div>}
      <div className="text-xs text-gray-400 mt-1">1% fee goes to the platform wallet</div>
    </div>
  )
}
