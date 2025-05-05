/**
 * CryptoSecurity Platform - Main JavaScript
 * Main JavaScript functionalities for the cryptocurrency security platform
 */

document.addEventListener('DOMContentLoaded', function() {
    // Initialize tooltips
    const tooltipTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="tooltip"]'));
    tooltipTriggerList.map(function (tooltipTriggerEl) {
        return new bootstrap.Tooltip(tooltipTriggerEl);
    });

    // Initialize popovers
    const popoverTriggerList = [].slice.call(document.querySelectorAll('[data-bs-toggle="popover"]'));
    popoverTriggerList.map(function (popoverTriggerEl) {
        return new bootstrap.Popover(popoverTriggerEl);
    });

    // Handle wallet address formatting
    const walletAddresses = document.querySelectorAll('.wallet-address');
    walletAddresses.forEach(function(element) {
        const address = element.textContent;
        if (address && address.length > 12) {
            // Format as 0x1234...5678
            const formatted = address.slice(0, 6) + '...' + address.slice(-4);
            element.setAttribute('title', address);
            element.textContent = formatted;
        }
    });

    // Add validation for transaction form
    const transactionForm = document.getElementById('transactionForm');
    if (transactionForm) {
        transactionForm.addEventListener('submit', function(event) {
            // Add custom validation here if needed
            validateWalletAddress();
        });
    }

    // Wallet address validation
    function validateWalletAddress() {
        const walletInput = document.getElementById('wallet_address');
        if (walletInput) {
            const walletAddress = walletInput.value.trim();
            const walletPattern = /^0x[a-fA-F0-9]{40}$/;
            
            if (!walletPattern.test(walletAddress)) {
                // Add custom validation error
                walletInput.classList.add('is-invalid');
                
                // Get or create error message element
                let errorElement = walletInput.nextElementSibling;
                if (!errorElement || !errorElement.classList.contains('invalid-feedback')) {
                    errorElement = document.createElement('div');
                    errorElement.classList.add('invalid-feedback');
                    walletInput.parentNode.insertBefore(errorElement, walletInput.nextSibling);
                }
                
                errorElement.textContent = 'Please enter a valid Ethereum/BSC wallet address (42 characters starting with 0x)';
                return false;
            } else {
                walletInput.classList.remove('is-invalid');
                walletInput.classList.add('is-valid');
                return true;
            }
        }
        return true;
    }

    // Responsive navigation handling
    const navbarToggler = document.querySelector('.navbar-toggler');
    if (navbarToggler) {
        navbarToggler.addEventListener('click', function() {
            const expanded = this.getAttribute('aria-expanded') === 'true' || false;
            this.setAttribute('aria-expanded', !expanded);
        });
    }

    // Copy to clipboard functionality
    const copyButtons = document.querySelectorAll('.copy-to-clipboard');
    copyButtons.forEach(function(button) {
        button.addEventListener('click', function() {
            const textToCopy = this.getAttribute('data-clipboard-text');
            if (textToCopy) {
                navigator.clipboard.writeText(textToCopy).then(function() {
                    // Show success message or tooltip
                    const originalText = button.innerHTML;
                    button.innerHTML = '<i class="fas fa-check me-2"></i>Copied!';
                    
                    setTimeout(function() {
                        button.innerHTML = originalText;
                    }, 2000);
                }).catch(function(err) {
                    console.error('Failed to copy text: ', err);
                });
            }
        });
    });

    // Handle blockchain data refresh for transaction verification
    const refreshBlockchainBtn = document.getElementById('refreshBlockchainBtn');
    if (refreshBlockchainBtn) {
        refreshBlockchainBtn.addEventListener('click', function() {
            // This would typically make an AJAX call to refresh data
            // For demo purposes, just show loading state
            this.disabled = true;
            this.innerHTML = '<span class="spinner-border spinner-border-sm me-2" role="status" aria-hidden="true"></span>Refreshing...';
            
            setTimeout(() => {
                this.disabled = false;
                this.innerHTML = '<i class="fas fa-sync-alt me-2"></i>Re-check Blockchain Data';
                
                // Show a toast notification
                const toastHTML = `
                    <div class="toast align-items-center text-white bg-success border-0" role="alert" aria-live="assertive" aria-atomic="true">
                        <div class="d-flex">
                            <div class="toast-body">
                                <i class="fas fa-check-circle me-2"></i>Blockchain data refreshed successfully!
                            </div>
                            <button type="button" class="btn-close btn-close-white me-2 m-auto" data-bs-dismiss="toast" aria-label="Close"></button>
                        </div>
                    </div>
                `;
                
                const toastContainer = document.createElement('div');
                toastContainer.className = 'position-fixed bottom-0 end-0 p-3';
                toastContainer.style.zIndex = 11;
                toastContainer.innerHTML = toastHTML;
                
                document.body.appendChild(toastContainer);
                const toast = new bootstrap.Toast(toastContainer.querySelector('.toast'));
                toast.show();
                
                // Remove the toast container after it's hidden
                toastContainer.querySelector('.toast').addEventListener('hidden.bs.toast', function () {
                    toastContainer.remove();
                });
            }, 2000);
        });
    }

    // Handle status filter for admin transaction list
    const statusFilter = document.getElementById('statusFilter');
    if (statusFilter) {
        statusFilter.addEventListener('change', function() {
            const status = this.value;
            const rows = document.querySelectorAll('.transaction-table tbody tr');
            
            rows.forEach(function(row) {
                const statusCell = row.querySelector('td:nth-child(5)');
                if (statusCell) {
                    const rowStatus = statusCell.textContent.trim().toLowerCase();
                    if (status === '' || rowStatus === status) {
                        row.style.display = '';
                    } else {
                        row.style.display = 'none';
                    }
                }
            });
        });
    }

    // Handle search functionality for admin panels
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keyup', function() {
            const searchTerm = this.value.toLowerCase();
            let tableSelector = '.transaction-table';
            
            // Check which table we're searching
            if (document.querySelector('.certificate-table')) {
                tableSelector = '.certificate-table';
            }
            
            const rows = document.querySelectorAll(`${tableSelector} tbody tr`);
            
            rows.forEach(function(row) {
                const text = row.textContent.toLowerCase();
                if (text.includes(searchTerm)) {
                    row.style.display = '';
                } else {
                    row.style.display = 'none';
                }
            });
        });
    }
});
