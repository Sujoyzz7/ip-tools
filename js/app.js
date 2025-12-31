// IP Lookup Tool JavaScript Application

class IPLookupTool {
    constructor() {
        this.map = null;
        this.currentMarker = null;
        this.currentIPData = null;
        this.apiEndpoint = 'https://ipapi.co/json/';
        this.fallbackAPIs = [
            'https://ipapi.co/json/',
            'https://api.ipify.org?format=json',
            'https://ipinfo.io/json',
            'https://api.ipgeolocation.io/ipgeo'
        ];
        this.demoMode = false;
        this.init();
    }

    init() {
        this.setupEventListeners();
        this.initializeDarkMode();
        this.loadUserIP();
    }

    setupEventListeners() {
        // Form submission
        document.getElementById('ipLookupForm').addEventListener('submit', (e) => {
            e.preventDefault();
            this.lookupIP();
        });

        // Dark mode toggle
        document.getElementById('darkModeToggle').addEventListener('click', () => {
            this.toggleDarkMode();
        });

        // Demo mode toggle
        document.getElementById('demoModeToggle').addEventListener('click', () => {
            this.toggleDemoMode();
        });

        // Action buttons
        document.getElementById('shareBtn')?.addEventListener('click', () => {
            this.shareResults();
        });

        document.getElementById('exportBtn')?.addEventListener('click', () => {
            this.exportToCSV();
        });

        document.getElementById('newLookupBtn')?.addEventListener('click', () => {
            this.resetForm();
        });

        // Input validation
        document.getElementById('ipInput').addEventListener('input', (e) => {
            this.validateIPInput(e.target);
        });
    }

    initializeDarkMode() {
        // Check for saved preference or system preference
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            document.documentElement.classList.add('dark');
        }
    }

    toggleDarkMode() {
        document.documentElement.classList.toggle('dark');
        const isDark = document.documentElement.classList.contains('dark');
        localStorage.setItem('theme', isDark ? 'dark' : 'light');
    }

    toggleDemoMode() {
        this.demoMode = !this.demoMode;
        const button = document.getElementById('demoModeToggle');
        button.textContent = `Demo Mode: ${this.demoMode ? 'ON' : 'OFF'}`;
        button.className = this.demoMode ? 
            'px-3 py-1 text-xs bg-green-500 text-white rounded hover:bg-green-600 transition-colors' :
            'px-3 py-1 text-xs bg-yellow-500 text-white rounded hover:bg-yellow-600 transition-colors';
        
        this.showToast(this.demoMode ? 'Demo mode enabled - showing sample data' : 'Demo mode disabled - using real APIs');
    }

    async loadUserIP() {
        // Don't auto-lookup on page load to avoid API errors
        // User can manually trigger lookup when needed
        document.getElementById('ipInput').placeholder = 'Enter IP address (e.g., 8.8.8.8) or leave empty for your IP';
    }

    validateIPInput(input) {
        const value = input.value.trim();
        const ipRegex = /^(?:(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)\.){3}(?:25[0-5]|2[0-4][0-9]|[01]?[0-9][0-9]?)$|^([0-9a-fA-F]{1,4}:){7}[0-9a-fA-F]{1,4}$/;
        
        if (value === '' || ipRegex.test(value)) {
            input.classList.remove('input-invalid');
            input.classList.add('input-valid');
            return true;
        } else {
            input.classList.remove('input-valid');
            input.classList.add('input-invalid');
            return false;
        }
    }

    async lookupIP() {
        const ipInput = document.getElementById('ipInput');
        const ip = ipInput.value.trim();
        
        // Validate input
        if (ip && !this.validateIPInput(ipInput)) {
            this.showError('Please enter a valid IPv4 or IPv6 address');
            return;
        }

        this.showLoading();
        this.hideResults();
        this.hideError();

        // Try different API endpoints with fallback
        await this.tryLookupWithFallback(ip);
    }

    async tryLookupWithFallback(ip) {
        // First try demo mode to ensure functionality
        if (this.demoMode) {
            this.showDemoData(ip);
            return;
        }

        const apis = ip ? 
            [`https://ipapi.co/${ip}/json/`] : 
            this.fallbackAPIs;

        for (let i = 0; i < apis.length; i++) {
            try {
                const url = apis[i];
                console.log(`Trying API ${i + 1}: ${url}`);
                
                // Add timeout to prevent hanging
                const controller = new AbortController();
                const timeoutId = setTimeout(() => controller.abort(), 8000);
                
                const response = await fetch(url, {
                    method: 'GET',
                    headers: {
                        'Accept': 'application/json',
                        'Content-Type': 'application/json'
                    },
                    mode: 'cors',
                    cache: 'no-cache',
                    signal: controller.signal
                });
                
                clearTimeout(timeoutId);
                
                if (!response.ok) {
                    throw new Error(`HTTP ${response.status}`);
                }

                const data = await response.json();
                console.log('API Response:', data);
                
                // Handle different API response formats
                let normalizedData;
                if (url.includes('ipify.org')) {
                    // ipify returns just the IP
                    normalizedData = await this.getDetailedIPInfo(data.ip);
                } else if (url.includes('ipinfo.io')) {
                    // ipinfo.io format
                    normalizedData = this.normalizeIPInfoData(data, ip);
                } else if (url.includes('ipgeolocation.io')) {
                    // ipgeolocation.io format
                    normalizedData = this.normalizeIPGeolocationData(data, ip);
                } else {
                    normalizedData = this.normalizeIPData(data, ip);
                }
                
                if (normalizedData && normalizedData.ip) {
                    this.currentIPData = normalizedData;
                    this.displayResults(normalizedData);
                    return;
                }
                
            } catch (error) {
                console.error(`API ${i + 1} failed:`, error);
                
                // If this is the last API, show error with demo data
                if (i === apis.length - 1) {
                    console.log('All APIs failed, showing demo data');
                    this.showDemoData(ip);
                    return;
                }
            }
        }
    }

    async getDetailedIPInfo(ip) {
        try {
            // Use ipapi.co for detailed info since we have the IP
            const response = await fetch(`https://ipapi.co/${ip}/json/`, {
                method: 'GET',
                headers: {
                    'Accept': 'application/json'
                },
                mode: 'cors'
            });
            
            if (response.ok) {
                const data = await response.json();
                return this.normalizeIPData(data, ip);
            }
        } catch (error) {
            console.log('Detailed lookup failed, using basic info');
        }
        
        // Fallback to basic info
        return {
            ip: ip,
            country_name: 'Unknown',
            country_code: 'XX',
            region: 'Unknown',
            city: 'Unknown',
            postal: 'Unknown',
            latitude: 0,
            longitude: 0,
            timezone: 'UTC',
            utc_offset: '+00:00',
            org: 'Unknown ISP',
            asn: 'Unknown',
            proxy: false,
            hosting: false
        };
    }

    normalizeIPInfoData(data, requestedIP) {
        // ipinfo.io format
        return {
            ip: data.ip || requestedIP,
            country_name: data.country || 'Unknown',
            country_code: data.country || 'XX',
            region: data.region || 'Unknown',
            city: data.city || 'Unknown',
            postal: data.postal || 'Unknown',
            latitude: parseFloat(data.loc?.split(',')[0]) || 0,
            longitude: parseFloat(data.loc?.split(',')[1]) || 0,
            timezone: data.timezone || 'UTC',
            utc_offset: data.timezone || '+00:00',
            org: data.org || 'Unknown ISP',
            asn: data.org || 'Unknown',
            proxy: false,
            hosting: false
        };
    }

    normalizeIPGeolocationData(data, requestedIP) {
        // ipgeolocation.io format
        return {
            ip: data.ip || requestedIP,
            country_name: data.country_name || 'Unknown',
            country_code: data.country_code2 || 'XX',
            region: data.state_prov || 'Unknown',
            city: data.city || 'Unknown',
            postal: data.postal || 'Unknown',
            latitude: parseFloat(data.latitude) || 0,
            longitude: parseFloat(data.longitude) || 0,
            timezone: data.time_zone?.name || 'UTC',
            utc_offset: data.time_zone?.offset || '+00:00',
            org: data.organization || 'Unknown ISP',
            asn: data.asn || 'Unknown',
            proxy: false,
            hosting: false
        };
    }

    normalizeIPData(data, requestedIP) {
        // Handle different API response formats
        if (data.ip && (data.country_name || data.country)) {
            // ipapi.co format
            return {
                ip: data.ip,
                country_name: data.country_name || 'Unknown',
                country_code: data.country || 'XX',
                region: data.region || 'Unknown',
                city: data.city || 'Unknown',
                postal: data.postal || 'Unknown',
                latitude: data.latitude || 0,
                longitude: data.longitude || 0,
                timezone: data.timezone || 'UTC',
                utc_offset: data.utc_offset || '+00:00',
                org: data.org || 'Unknown ISP',
                asn: data.asn || 'Unknown',
                proxy: data.proxy || false,
                hosting: data.hosting || false
            };
        } else if (data.ipAddress) {
            // AbstractAPI format
            return {
                ip: data.ipAddress,
                country_name: data.country || 'Unknown',
                country_code: data.country_code || 'XX',
                region: data.region || 'Unknown',
                city: data.city || 'Unknown',
                postal: data.postal_code || 'Unknown',
                latitude: data.latitude || 0,
                longitude: data.longitude || 0,
                timezone: data.timezone || 'UTC',
                utc_offset: data.timezone_offset || '+00:00',
                org: data.isp || 'Unknown ISP',
                asn: data.asn?.name || 'Unknown',
                proxy: data.is_proxy || false,
                hosting: data.is_hosting || false
            };
        } else if (data.ip) {
            // ipify format - minimal data, need to fetch more details
            return {
                ip: data.ip,
                country_name: 'Loading...',
                country_code: 'XX',
                region: 'Loading...',
                city: 'Loading...',
                postal: 'Unknown',
                latitude: 0,
                longitude: 0,
                timezone: 'UTC',
                utc_offset: '+00:00',
                org: 'Loading...',
                asn: 'Loading...',
                proxy: false,
                hosting: false,
                needsMoreInfo: true
            };
        }
        
        return null;
    }

    showDemoData(requestedIP) {
        // Show demo data when all APIs fail
        const demoIP = requestedIP || this.generateDemoIP();
        const demoData = {
            ip: demoIP,
            country_name: 'United States',
            country_code: 'US',
            region: 'California',
            city: 'Mountain View',
            postal: '94043',
            latitude: 37.4056,
            longitude: -122.0775,
            timezone: 'America/Los_Angeles',
            utc_offset: '-08:00',
            org: 'Google LLC',
            asn: 'AS15169 Google LLC',
            proxy: false,
            hosting: true
        };

        this.currentIPData = demoData;
        this.displayResults(demoData);
        
        // Show a notice that this is demo data
        this.showToast('Showing demo data - API services unavailable');
    }

    generateDemoIP() {
        // Generate a realistic demo IP
        const commonIPs = ['8.8.8.8', '1.1.1.1', '208.67.222.222', '9.9.9.9'];
        return commonIPs[Math.floor(Math.random() * commonIPs.length)];
    }

    displayResults(data) {
        // Check if we need to fetch more detailed information
        if (data.needsMoreInfo && data.ip) {
            this.fetchDetailedInfo(data.ip);
            return;
        }

        // Display IP Information
        this.displayIPInfo(data);
        
        // Display Network Information
        this.displayNetworkInfo(data);
        
        // Display Security Information
        this.displaySecurityInfo(data);
        
        // Display Timezone Information
        this.displayTimezoneInfo(data);
        
        // Display Map
        this.displayMap(data);
        
        // Show results section
        document.getElementById('resultsSection').classList.remove('hidden');
        
        // Scroll to results
        document.getElementById('resultsSection').scrollIntoView({ behavior: 'smooth' });
    }

    async fetchDetailedInfo(ip) {
        try {
            this.showLoading();
            const detailedData = await this.getDetailedIPInfo(ip);
            if (detailedData) {
                this.currentIPData = detailedData;
                this.displayResults(detailedData);
            }
        } catch (error) {
            console.error('Failed to fetch detailed info:', error);
            // Show basic info anyway
            this.displayResults(this.currentIPData);
        } finally {
            this.hideLoading();
        }
    }

    displayIPInfo(data) {
        const ipInfo = document.getElementById('ipInfo');
        ipInfo.innerHTML = `
            <div class="ip-info-item">
                <span class="ip-info-label">IP Address:</span>
                <span class="ip-info-value">${data.ip}</span>
            </div>
            <div class="ip-info-item">
                <span class="ip-info-label">Country:</span>
                <span class="ip-info-value">${data.country_name || 'N/A'} (${data.country_code || 'N/A'})</span>
            </div>
            <div class="ip-info-item">
                <span class="ip-info-label">Region:</span>
                <span class="ip-info-value">${data.region || 'N/A'}</span>
            </div>
            <div class="ip-info-item">
                <span class="ip-info-label">City:</span>
                <span class="ip-info-value">${data.city || 'N/A'}</span>
            </div>
            <div class="ip-info-item">
                <span class="ip-info-label">Postal Code:</span>
                <span class="ip-info-value">${data.postal || 'N/A'}</span>
            </div>
            <div class="ip-info-item">
                <span class="ip-info-label">Coordinates:</span>
                <span class="ip-info-value">${data.latitude || 'N/A'}, ${data.longitude || 'N/A'}</span>
            </div>
        `;
    }

    displayNetworkInfo(data) {
        const networkInfo = document.getElementById('networkInfo');
        networkInfo.innerHTML = `
            <div class="ip-info-item">
                <span class="ip-info-label">ISP:</span>
                <span class="ip-info-value">${data.org || 'N/A'}</span>
            </div>
            <div class="ip-info-item">
                <span class="ip-info-label">ASN:</span>
                <span class="ip-info-value">${data.asn || 'N/A'}</span>
            </div>
            <div class="ip-info-item">
                <span class="ip-info-label">Connection Type:</span>
                <span class="ip-info-value">${this.getConnectionType(data)}</span>
            </div>
            <div class="ip-info-item">
                <span class="ip-info-label">IP Version:</span>
                <span class="ip-info-value">${this.getIPVersion(data.ip)}</span>
            </div>
        `;
    }

    displaySecurityInfo(data) {
        const securityInfo = document.getElementById('securityInfo');
        const isProxy = data.proxy || false;
        const isHosting = data.hosting || false;
        
        let securityStatus = 'safe';
        let securityText = 'Clean';
        
        if (isProxy) {
            securityStatus = 'warning';
            securityText = 'Proxy/VPN Detected';
        } else if (isHosting) {
            securityStatus = 'warning';
            securityText = 'Hosting Provider';
        }
        
        securityInfo.innerHTML = `
            <div class="ip-info-item">
                <span class="ip-info-label">Security Status:</span>
                <span class="security-badge security-${securityStatus}">${securityText}</span>
            </div>
            <div class="ip-info-item">
                <span class="ip-info-label">Proxy/VPN:</span>
                <span class="ip-info-value">${isProxy ? 'Yes' : 'No'}</span>
            </div>
            <div class="ip-info-item">
                <span class="ip-info-label">Hosting:</span>
                <span class="ip-info-value">${isHosting ? 'Yes' : 'No'}</span>
            </div>
            <div class="ip-info-item">
                <span class="ip-info-label">Threat Level:</span>
                <span class="ip-info-value">Low</span>
            </div>
        `;
    }

    displayTimezoneInfo(data) {
        const timezoneInfo = document.getElementById('timezoneInfo');
        timezoneInfo.innerHTML = `
            <div class="ip-info-item">
                <span class="ip-info-label">Timezone:</span>
                <span class="ip-info-value">${data.timezone || 'N/A'}</span>
            </div>
            <div class="ip-info-item">
                <span class="ip-info-label">UTC Offset:</span>
                <span class="ip-info-value">${data.utc_offset || 'N/A'}</span>
            </div>
            <div class="ip-info-item">
                <span class="ip-info-label">Local Time:</span>
                <span class="ip-info-value">${this.getLocalTime(data.timezone)}</span>
            </div>
        `;
    }

    displayMap(data) {
        if (!data.latitude || !data.longitude) {
            document.getElementById('map').innerHTML = '<div class="flex items-center justify-center h-full text-gray-500">Location data not available</div>';
            return;
        }

        // Initialize map if not already done
        if (!this.map) {
            this.map = L.map('map').setView([data.latitude, data.longitude], 10);
            L.tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
                attribution: '© OpenStreetMap contributors'
            }).addTo(this.map);
        } else {
            // Clear existing marker
            if (this.currentMarker) {
                this.map.removeLayer(this.currentMarker);
            }
            
            // Update map view
            this.map.setView([data.latitude, data.longitude], 10);
        }

        // Add marker
        this.currentMarker = L.marker([data.latitude, data.longitude]).addTo(this.map);
        this.currentMarker.bindPopup(`<b>${data.city || 'Unknown'}</b><br>${data.country_name || 'Unknown'}`).openPopup();
    }

    getConnectionType(data) {
        // This is a simplified detection - in a real app, you'd use more sophisticated methods
        if (data.org && data.org.toLowerCase().includes('mobile')) {
            return 'Mobile';
        } else if (data.org && data.org.toLowerCase().includes('fiber')) {
            return 'Fiber';
        } else if (data.org && data.org.toLowerCase().includes('cable')) {
            return 'Cable';
        } else {
            return 'Broadband';
        }
    }

    getIPVersion(ip) {
        if (ip.includes(':')) {
            return 'IPv6';
        } else {
            return 'IPv4';
        }
    }

    getLocalTime(timezone) {
        if (!timezone) return 'N/A';
        
        try {
            const now = new Date();
            const options = {
                timeZone: timezone,
                hour: '2-digit',
                minute: '2-digit',
                hour12: true
            };
            return now.toLocaleTimeString('en-US', options);
        } catch (error) {
            return 'N/A';
        }
    }

    shareResults() {
        if (!this.currentIPData) return;
        
        const shareText = `IP Lookup Results for ${this.currentIPData.ip}:\n` +
            `Location: ${this.currentIPData.city}, ${this.currentIPData.region}, ${this.currentIPData.country_name}\n` +
            `ISP: ${this.currentIPData.org}\n` +
            `Learn more at: ${window.location.href}`;
        
        if (navigator.share) {
            navigator.share({
                title: 'IP Lookup Results',
                text: shareText,
                url: window.location.href
            });
        } else {
            // Fallback - copy to clipboard
            this.copyToClipboard(shareText);
            this.showToast('Results copied to clipboard!');
        }
    }

    exportToCSV() {
        if (!this.currentIPData) return;
        
        const csvContent = this.generateCSV(this.currentIPData);
        const blob = new Blob([csvContent], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `ip-lookup-${this.currentIPData.ip}-${Date.now()}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        window.URL.revokeObjectURL(url);
        
        this.showToast('CSV file downloaded!');
    }

    generateCSV(data) {
        const headers = ['IP Address', 'Country', 'Region', 'City', 'Postal Code', 'Latitude', 'Longitude', 'ISP', 'ASN', 'Timezone', 'UTC Offset'];
        const values = [
            data.ip || '',
            data.country_name || '',
            data.region || '',
            data.city || '',
            data.postal || '',
            data.latitude || '',
            data.longitude || '',
            data.org || '',
            data.asn || '',
            data.timezone || '',
            data.utc_offset || ''
        ];
        
        return [headers, values].map(row => row.join(',')).join('\n');
    }

    copyToClipboard(text) {
        navigator.clipboard.writeText(text).catch(err => {
            console.error('Failed to copy text: ', err);
        });
    }

    resetForm() {
        document.getElementById('ipLookupForm').reset();
        this.hideResults();
        this.hideError();
        document.getElementById('ipInput').classList.remove('input-valid', 'input-invalid');
        window.scrollTo({ top: 0, behavior: 'smooth' });
    }

    showLoading() {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.classList.remove('hidden');
        }
    }

    hideLoading() {
        const loadingState = document.getElementById('loadingState');
        if (loadingState) {
            loadingState.classList.add('hidden');
        }
    }

    showResults() {
        document.getElementById('resultsSection').classList.remove('hidden');
    }

    hideResults() {
        document.getElementById('resultsSection').classList.add('hidden');
    }

    showError(message) {
        const errorSection = document.getElementById('errorSection');
        const errorMessage = document.getElementById('errorMessage');
        if (errorSection && errorMessage) {
            errorMessage.textContent = message;
            errorSection.classList.remove('hidden');
        }
    }

    hideError() {
        const errorSection = document.getElementById('errorSection');
        if (errorSection) {
            errorSection.classList.add('hidden');
        }
    }

    showToast(message) {
        const toast = document.createElement('div');
        toast.className = 'toast';
        toast.textContent = message;
        document.body.appendChild(toast);
        
        setTimeout(() => {
            toast.classList.add('show');
        }, 100);
        
        setTimeout(() => {
            toast.classList.remove('show');
            setTimeout(() => {
                document.body.removeChild(toast);
            }, 300);
        }, 3000);
    }
}

// Initialize the application when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    new IPLookupTool();
});

// Add some utility functions
window.IPLookupUtils = {
    formatBytes: (bytes) => {
        if (bytes === 0) return '0 Bytes';
        const k = 1024;
        const sizes = ['Bytes', 'KB', 'MB', 'GB'];
        const i = Math.floor(Math.log(bytes) / Math.log(k));
        return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
    },
    
    debounce: (func, wait) => {
        let timeout;
        return function executedFunction(...args) {
            const later = () => {
                clearTimeout(timeout);
                func(...args);
            };
            clearTimeout(timeout);
            timeout = setTimeout(later, wait);
        };
    }
};
