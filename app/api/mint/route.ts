import { NextResponse } from "next/server";
import { Connection, PublicKey, Keypair, SystemProgram } from "@solana/web3.js";
import { Metaplex, keypairIdentity } from "@metaplex-foundation/js";
import BN from "bn.js";
import { config } from "@/lib/config";

// Set your treasury wallet address (where users send SOL)
const TREASURY_WALLET = process.env.NEXT_PUBLIC_TREASURY_WALLET || "";
// Set the NFT price in SOL (should match frontend calculation)
const NFT_USD_PRICE = 20;
const SOLANA_RPC = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://api.mainnet-beta.solana.com";
const METAPLEX_PRIVATE_KEY = process.env.METAPLEX_PRIVATE_KEY || ""; // base58 or array

// Use pricing API from config, allow override by env
const PRICING_API_URL = process.env.NEXT_PUBLIC_JUPITER_PRICING_API_URL || config.jupiter.pricingApiUrl;
const SOL_MINT = config.solTokenMint;

async function getSolPrice() {
  // Use Jupiter price API (configurable)
  const url = `${PRICING_API_URL}price?ids=${SOL_MINT}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error("Failed to fetch SOL price");
  const data = await res.json();
  if (!data?.data?.[SOL_MINT]?.price) throw new Error("Invalid SOL price response");
  return data.data[SOL_MINT].price;
}

export async function POST(req: Request) {
  try {
    const { walletAddress, metadataUri, paymentSignature } = await req.json();
    if (!walletAddress || !metadataUri || !paymentSignature) {
      return NextResponse.json({ success: false, message: "Missing wallet address, metadata URI, or payment signature." }, { status: 400 });
    }
    if (!TREASURY_WALLET) {
      return NextResponse.json({ success: false, message: "Treasury wallet not set." }, { status: 500 });
    }
    // 1. Calculate required SOL amount
    const solPrice = await getSolPrice();
    const requiredSol = NFT_USD_PRICE / solPrice;
    const requiredLamports = Math.ceil(requiredSol * 1e9);
    // 2. Verify payment
    const connection = new Connection(SOLANA_RPC);
    const tx = await connection.getTransaction(paymentSignature, { commitment: "confirmed" });
    if (!tx) {
      return NextResponse.json({ success: false, message: "Payment transaction not found." }, { status: 400 });
    }
    // Find transfer to treasury
    let paid = false;
    for (const ix of tx.transaction.message.instructions) {
      // Use SystemProgram.programId for comparison
      const programIdIndex = 'programIdIndex' in ix ? ix.programIdIndex : undefined;
      const programId = programIdIndex !== undefined ? tx.transaction.message.accountKeys[programIdIndex].toBase58() : undefined;
      if (programId === SystemProgram.programId.toBase58()) {
        const data = Buffer.from(ix.data, "base64");
        if (data[0] === 2) { // transfer
          const keys = ix.accounts;
          const from = tx.transaction.message.accountKeys[keys[0]].toBase58();
          const to = tx.transaction.message.accountKeys[keys[1]].toBase58();
          const lamports = Number(data.readBigUInt64LE(1));
          if (from === walletAddress && to === TREASURY_WALLET && lamports >= requiredLamports) {
            paid = true;
            break;
          }
        }
      }
    }
    if (!paid) {
      return NextResponse.json({ success: false, message: "Payment not found or incorrect amount/recipient." }, { status: 400 });
    }
    // 3. Mint NFT using Metaplex
    if (!METAPLEX_PRIVATE_KEY) {
      return NextResponse.json({ success: false, message: "Metaplex private key not set." }, { status: 500 });
    }
    let secret: number[];
    try {
      secret = JSON.parse(METAPLEX_PRIVATE_KEY);
    } catch (e) {
      return NextResponse.json({ success: false, message: "Invalid Metaplex private key format." }, { status: 500 });
    }
    const payer = Keypair.fromSecretKey(Uint8Array.from(secret));
    const metaplex = Metaplex.make(connection)
      .use(keypairIdentity(payer)); // Use default storage (no .use(storage().bundlr()))
    const { nft } = await metaplex.nfts().create({
      uri: metadataUri,
      name: "Fugitive NFT",
      sellerFeeBasisPoints: 500,
      symbol: "FGT",
      updateAuthority: payer,
      mintAuthority: payer,
      tokenOwner: new PublicKey(walletAddress),
    });
    return NextResponse.json({ success: true, mintAddress: nft.address.toBase58() });
  } catch (e: any) {
    return NextResponse.json({ success: false, message: e?.message || "Server error." }, { status: 500 });
  }
}
