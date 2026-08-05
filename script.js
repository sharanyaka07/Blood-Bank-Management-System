// Global utility functions
function formatDate(date) {
    return new Date(date).toLocaleDateString();
}

function showAlert(message, type = 'info') {
    const alertDiv = document.createElement('div');
    alertDiv.className = `alert alert-${type} alert-dismissible fade show`;
    alertDiv.innerHTML = `
        ${message}
        <button type="button" class="btn-close" data-bs-dismiss="alert" aria-label="Close"></button>
    `;
    
    const container = document.querySelector('.container') || document.body;
    container.insertBefore(alertDiv, container.firstChild);
    
    // Auto-dismiss after 5 seconds
    setTimeout(() => {
        alertDiv.classList.remove('show');
        alertDiv.addEventListener('transitionend', () => alertDiv.remove());
    }, 5000);
}

// Form validation
function validateEmail(email) {
    const re = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return re.test(email);
}

function validatePhone(phone) {
    const re = /^\d{10}$/;
    return re.test(phone);
}

// Initialize page-specific functionality
document.addEventListener('DOMContentLoaded', function() {
    // Add current year to footer if exists
    const yearElement = document.getElementById('current-year');
    if (yearElement) {
        yearElement.textContent = new Date().getFullYear();
    }

    // Optional: Remove onclick from tab buttons and handle via event delegation
    // (you can keep onclick for now or remove them from HTML later)
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.addEventListener('click', function() {
            const tabName = this.getAttribute('onclick')
                ?.match(/showTab\('([^']+)'\)/)?.[1]
                ?.toLowerCase() || this.textContent.trim().toLowerCase().replace(/\s+/g, '');
            
            showTab(tabName);
        });
    });

    // Global click handler for dynamic buttons
    document.addEventListener('click', function(e) {
        const target = e.target;

        // ────────────────────────────────────────────────
        // Update Blood Stock
        // ────────────────────────────────────────────────
        if (target.classList.contains('update-stock-btn')) {
            e.preventDefault();
            const stockId = target.dataset.stockId;
            const input = document.getElementById(`units_${stockId}`);
            if (!input) return;

            const units = input.value.trim();
            if (!units || isNaN(units) || Number(units) < 0) {
                showAlert("Please enter a valid non-negative number.", "danger");
                return;
            }

            fetch('/admin/update_stock', {
                method: 'POST',
                headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
                body: `stock_id=${encodeURIComponent(stockId)}&units_available=${encodeURIComponent(units)}`
            })
            .then(async r => {
                const contentType = r.headers.get('content-type');
                if (!r.ok) {
                    let errMsg = 'Failed to update stock.';
                    if (contentType && contentType.includes('application/json')) {
                        const errData = await r.json();
                        errMsg = errData.message || errMsg;
                    } else {
                        errMsg = await r.text();
                    }
                    throw new Error(errMsg);
                }
                if (contentType && contentType.includes('application/json')) {
                    return r.json();
                } else {
                    throw new Error('Server returned non-JSON response.');
                }
            })
            .then(data => {
                if (data.success) {
                    showAlert(data.message || "Stock updated successfully!", "success");
                    setTimeout(() => location.reload(), 1500);
                } else {
                    showAlert(data.message || "Failed to update stock.", "danger");
                }
            })
            .catch(err => {
                console.error("Stock update error:", err);
                showAlert("Error updating stock: " + err.message, "danger");
            });
        }
        // ────────────────────────────────────────────────
        // Fulfill Blood Request
        // ────────────────────────────────────────────────
        if (target.classList.contains('fulfill-btn')) {
            e.preventDefault();
            const requestId = target.dataset.id;
            
            if (!confirm("Fulfill this request? This will deduct 1 unit from stock.")) {
                return;
            }

            fetch(`/admin/fulfill_request/${requestId}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({})
            })
            .then(async response => {
                const contentType = response.headers.get('content-type');
                if (!response.ok) {
                    let errMsg = 'Error fulfilling request';
                    if (contentType && contentType.includes('application/json')) {
                        const errData = await response.json();
                        errMsg = errData.message || errMsg;
                    } else {
                        errMsg = await response.text();
                    }
                    throw new Error(errMsg);
                }
                if (contentType && contentType.includes('application/json')) {
                    return response.json();
                } else {
                    throw new Error('Server returned non-JSON response.');
                }
            })
            .then(data => {
                if (data.success) {
                    showAlert(data.message || "Request fulfilled successfully!", "success");
                    setTimeout(() => location.reload(), 1500);
                } else {
                    showAlert(data.message || "Failed to fulfill request.", "danger");
                }
            })
            .catch(error => {
                console.error("Fulfill error:", error);
                showAlert(error.message || "Error fulfilling request", "danger");
            });
        }
    });
});

// Tab switching function (used by both onclick and event delegation)
function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.classList.remove('active');
    });
    document.querySelectorAll('.tab-btn').forEach(btn => {
        btn.classList.remove('active');
    });

    const targetTab = document.getElementById(tabName + '-tab');
    if (targetTab) {
        targetTab.classList.add('active');
    }

    // Optional: activate button if not already
    const btn = document.querySelector(`.tab-btn[onclick*="showTab('${tabName}')"]`) ||
                document.querySelector(`.tab-btn:contains("${tabName}")`);
    if (btn) btn.classList.add('active');
}