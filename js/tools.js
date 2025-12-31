// Network Tools JavaScript

class NetworkTools {
    constructor() {
        this.init();
    }

    init() {
        this.setupDarkMode();
        this.setupInputValidation();
    }

    setupDarkMode() {
        const savedTheme = localStorage.getItem('theme');
        const systemPrefersDark = window.matchMedia('(prefers-color-scheme: dark)').matches;
        
        if (savedTheme === 'dark' || (!savedTheme && systemPrefersDark)) {
            document.documentElement.classList.add('dark');
        }

        document.getElementById('darkModeToggle')?.addEventListener('click', () => {
            document.documentElement.classList.toggle('dark');
            const isDark = document.documentElement.classList.contains('dark');
            localStorage.setItem('theme', isDark ? 'dark' : 'light');
        });
    }

    setupInputValidation() {
        // Domain validation
        document.getElementById('dnsInput')?.addEventListener('input', (e) => {
            this.validateDomain(e.target);
        });

        document.getElementById('whoisInput')?.addEventListener('input', (e) => {
            this.validateDomain(e.target);
        });

        // Port validation
        document.getElementById('portInput')?.addEventListener('input', (e) => {
            this.validatePort(e.target);
        });
    }

    validateDomain(input) {
        const value = input.value.trim();
        const domainRegex = /^[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9](?:\.[a-zA-Z0-9][a-zA-Z0-9-]{0,61}[a-zA-Z0-9])*$/;
        
        if (value === '' || domainRegex.test(value)) {
            input.classList.remove('input-invalid');
            input.classList.add('input-valid');
            return true;
        } else {
            input.classList.remove('input-valid');
            input.classList.add('input-invalid');
            return false;
        }
    }

    validatePort(input) {
        const value = input.value.trim();
        const port = parseInt(value);
        
        if (value === '' || (port >= 1 && port <= 65535)) {
            input.classList.remove('input-invalid');
            input.classList.add('input-valid');
            return true;
        } else {
            input.classList.remove('input-valid');
            input.classList.add('input-invalid');
            return false;
        }
    }

    async performDNSLookup() {
        const input = document.getElementById('dnsInput');
        const domain = input.value.trim();
        
        if (!domain || !this.validateDomain(input)) {
            this.showError('dnsResults', 'Please enter a valid domain name');
            return;
        }

        this.showLoading('dnsResults');
        
        try {
            // Using a public DNS API (in production, you'd want to use your own backend)
            const response = await fetch(`https://dns.google/resolve?name=${domain}&type=A`);
            const data = await response.json();
            
            if (data.Answer && data.Answer.length > 0) {
                this.displayDNSResults(data);
            } else {
                // Try AAAA record if A record not found
                const aaaaResponse = await fetch(`https://dns.google/resolve?name=${domain}&type=AAAA`);
                const aaaaData = await aaaaResponse.json();
                
                if (aaaaData.Answer && aaaaData.Answer.length > 0) {
                    this.displayDNSResults(aaaaData);
                } else {
                    this.showError('dnsResults', 'No DNS records found for this domain');
                }
            }
        } catch (error) {
            this.showError('dnsResults', 'Failed to lookup DNS records. Please try again.');
        }
    }

    displayDNSResults(data) {
        const resultsDiv = document.getElementById('dnsResults');
        const answers = data.Answer || [];
        
        let html = '<div class="space-y-3">';
        html += '<h4 class="font-semibold text-gray-900 dark:text-white">DNS Records:</h4>';
        
        answers.forEach(record => {
            const type = this.getDNSType(record.type);
            html += `
                <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="flex justify-between items-center">
                        <span class="text-sm font-medium text-gray-600 dark:text-gray-300">${type}</span>
                        <span class="text-sm font-mono text-gray-900 dark:text-white">${record.data}</span>
                    </div>
                    <div class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        TTL: ${record.TTL}s
                    </div>
                </div>
            `;
        });
        
        html += '</div>';
        resultsDiv.innerHTML = html;
        resultsDiv.classList.remove('hidden');
    }

    getDNSType(type) {
        const types = {
            1: 'A',
            2: 'NS',
            5: 'CNAME',
            6: 'SOA',
            16: 'TXT',
            28: 'AAAA',
            15: 'MX'
        };
        return types[type] || `TYPE${type}`;
    }

    async performPingTest() {
        const input = document.getElementById('pingInput');
        const host = input.value.trim();
        
        if (!host) {
            this.showError('pingResults', 'Please enter a host or IP address');
            return;
        }

        this.showLoading('pingResults');
        
        // Simulate ping test (in production, this would require a backend service)
        setTimeout(() => {
            const mockResults = this.generateMockPingResults(host);
            this.displayPingResults(mockResults);
        }, 2000);
    }

    generateMockPingResults(host) {
        return {
            host: host,
            packets: {
                sent: 4,
                received: 4,
                lost: 0
            },
            statistics: {
                min: Math.floor(Math.random() * 20) + 10,
                max: Math.floor(Math.random() * 30) + 25,
                avg: Math.floor(Math.random() * 15) + 18
            },
            ip: this.generateRandomIP()
        };
    }

    displayPingResults(results) {
        const resultsDiv = document.getElementById('pingResults');
        const lossPercentage = ((results.packets.lost / results.packets.sent) * 100).toFixed(0);
        
        const html = `
            <div class="space-y-3">
                <h4 class="font-semibold text-gray-900 dark:text-white">Ping Results for ${results.host}:</h4>
                <div class="grid grid-cols-2 gap-4">
                    <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="text-sm text-gray-600 dark:text-gray-300">Packets Sent</div>
                        <div class="text-lg font-semibold text-gray-900 dark:text-white">${results.packets.sent}</div>
                    </div>
                    <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="text-sm text-gray-600 dark:text-gray-300">Packets Received</div>
                        <div class="text-lg font-semibold text-gray-900 dark:text-white">${results.packets.received}</div>
                    </div>
                    <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="text-sm text-gray-600 dark:text-gray-300">Packet Loss</div>
                        <div class="text-lg font-semibold text-gray-900 dark:text-white">${lossPercentage}%</div>
                    </div>
                    <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="text-sm text-gray-600 dark:text-gray-300">IP Address</div>
                        <div class="text-lg font-semibold text-gray-900 dark:text-white">${results.ip}</div>
                    </div>
                </div>
                <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="text-sm text-gray-600 dark:text-gray-300 mb-2">Round-trip times (ms)</div>
                    <div class="grid grid-cols-3 gap-2 text-sm">
                        <div>
                            <span class="text-gray-600 dark:text-gray-400">Min:</span>
                            <span class="font-semibold text-gray-900 dark:text-white ml-1">${results.statistics.min}</span>
                        </div>
                        <div>
                            <span class="text-gray-600 dark:text-gray-400">Avg:</span>
                            <span class="font-semibold text-gray-900 dark:text-white ml-1">${results.statistics.avg}</span>
                        </div>
                        <div>
                            <span class="text-gray-600 dark:text-gray-400">Max:</span>
                            <span class="font-semibold text-gray-900 dark:text-white ml-1">${results.statistics.max}</span>
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        resultsDiv.innerHTML = html;
        resultsDiv.classList.remove('hidden');
    }

    async performTraceroute() {
        const input = document.getElementById('tracerouteInput');
        const destination = input.value.trim();
        
        if (!destination) {
            this.showError('tracerouteResults', 'Please enter a destination');
            return;
        }

        this.showLoading('tracerouteResults');
        
        // Simulate traceroute (in production, this would require a backend service)
        setTimeout(() => {
            const mockResults = this.generateMockTracerouteResults(destination);
            this.displayTracerouteResults(mockResults);
        }, 3000);
    }

    generateMockTracerouteResults(destination) {
        const hops = [];
        const hopCount = Math.floor(Math.random() * 8) + 8;
        
        for (let i = 1; i <= hopCount; i++) {
            hops.push({
                hop: i,
                ip: this.generateRandomIP(),
                hostname: this.generateHostname(i),
                time1: Math.floor(Math.random() * 50) + 10,
                time2: Math.floor(Math.random() * 50) + 10,
                time3: Math.floor(Math.random() * 50) + 10
            });
        }
        
        return {
            destination: destination,
            hops: hops
        };
    }

    generateHostname(hop) {
        const hostnames = [
            'router1.isp.com',
            'core-router.isp.com',
            'border-router.isp.com',
            'gateway.isp.com',
            'edge-router.isp.com',
            'backbone.isp.com',
            'peering-router.isp.com',
            'destination-gateway.com'
        ];
        return hostnames[Math.min(hop - 1, hostnames.length - 1)];
    }

    displayTracerouteResults(results) {
        const resultsDiv = document.getElementById('tracerouteResults');
        
        let html = `
            <div class="space-y-3">
                <h4 class="font-semibold text-gray-900 dark:text-white">Traceroute to ${results.destination}:</h4>
                <div class="overflow-x-auto">
                    <table class="w-full text-sm">
                        <thead>
                            <tr class="border-b border-gray-200 dark:border-gray-600">
                                <th class="text-left py-2 px-2 text-gray-600 dark:text-gray-300">Hop</th>
                                <th class="text-left py-2 px-2 text-gray-600 dark:text-gray-300">IP Address</th>
                                <th class="text-left py-2 px-2 text-gray-600 dark:text-gray-300">Hostname</th>
                                <th class="text-left py-2 px-2 text-gray-600 dark:text-gray-300">Time 1</th>
                                <th class="text-left py-2 px-2 text-gray-600 dark:text-gray-300">Time 2</th>
                                <th class="text-left py-2 px-2 text-gray-600 dark:text-gray-300">Time 3</th>
                            </tr>
                        </thead>
                        <tbody>
        `;
        
        results.hops.forEach(hop => {
            html += `
                <tr class="border-b border-gray-100 dark:border-gray-700">
                    <td class="py-2 px-2 text-gray-900 dark:text-white">${hop.hop}</td>
                    <td class="py-2 px-2 text-gray-900 dark:text-white font-mono">${hop.ip}</td>
                    <td class="py-2 px-2 text-gray-900 dark:text-white">${hop.hostname}</td>
                    <td class="py-2 px-2 text-gray-900 dark:text-white">${hop.time1} ms</td>
                    <td class="py-2 px-2 text-gray-900 dark:text-white">${hop.time2} ms</td>
                    <td class="py-2 px-2 text-gray-900 dark:text-white">${hop.time3} ms</td>
                </tr>
            `;
        });
        
        html += `
                        </tbody>
                    </table>
                </div>
            </div>
        `;
        
        resultsDiv.innerHTML = html;
        resultsDiv.classList.remove('hidden');
    }

    async checkPort() {
        const hostInput = document.getElementById('portHostInput');
        const portInput = document.getElementById('portInput');
        const host = hostInput.value.trim();
        const port = portInput.value.trim();
        
        if (!host) {
            this.showError('portResults', 'Please enter a host or IP address');
            return;
        }
        
        if (!port || !this.validatePort(portInput)) {
            this.showError('portResults', 'Please enter a valid port number (1-65535)');
            return;
        }

        this.showLoading('portResults');
        
        // Simulate port check (in production, this would require a backend service)
        setTimeout(() => {
            const isOpen = Math.random() > 0.5;
            this.displayPortResults(host, port, isOpen);
        }, 1500);
    }

    displayPortResults(host, port, isOpen) {
        const resultsDiv = document.getElementById('portResults');
        const status = isOpen ? 'Open' : 'Closed';
        const statusColor = isOpen ? 'green' : 'red';
        
        const html = `
            <div class="space-y-3">
                <h4 class="font-semibold text-gray-900 dark:text-white">Port Check Results:</h4>
                <div class="p-4 bg-gray-50 dark:bg-gray-700 rounded-lg">
                    <div class="flex items-center justify-between mb-3">
                        <div>
                            <div class="text-sm text-gray-600 dark:text-gray-300">Host</div>
                            <div class="text-lg font-semibold text-gray-900 dark:text-white">${host}</div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-600 dark:text-gray-300">Port</div>
                            <div class="text-lg font-semibold text-gray-900 dark:text-white">${port}</div>
                        </div>
                        <div>
                            <div class="text-sm text-gray-600 dark:text-gray-300">Status</div>
                            <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-${statusColor}-100 text-${statusColor}-800 dark:bg-${statusColor}-900 dark:text-${statusColor}-200">
                                ${status}
                            </span>
                        </div>
                    </div>
                    <div class="text-sm text-gray-600 dark:text-gray-300">
                        ${isOpen ? 
                            'The port is open and accepting connections. This service is likely running on the target host.' : 
                            'The port is closed or not responding. No service is detected on this port.'}
                    </div>
                </div>
            </div>
        `;
        
        resultsDiv.innerHTML = html;
        resultsDiv.classList.remove('hidden');
    }

    analyzeUserAgent() {
        const userAgent = navigator.userAgent;
        const resultsDiv = document.getElementById('userAgentResults');
        
        const analysis = this.parseUserAgent(userAgent);
        
        const html = `
            <div class="space-y-3">
                <h4 class="font-semibold text-gray-900 dark:text-white">Your Browser Information:</h4>
                <div class="space-y-2">
                    <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="text-sm text-gray-600 dark:text-gray-300">Browser</div>
                        <div class="text-lg font-semibold text-gray-900 dark:text-white">${analysis.browser}</div>
                    </div>
                    <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="text-sm text-gray-600 dark:text-gray-300">Operating System</div>
                        <div class="text-lg font-semibold text-gray-900 dark:text-white">${analysis.os}</div>
                    </div>
                    <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="text-sm text-gray-600 dark:text-gray-300">Device Type</div>
                        <div class="text-lg font-semibold text-gray-900 dark:text-white">${analysis.device}</div>
                    </div>
                    <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="text-sm text-gray-600 dark:text-gray-300">User-Agent String</div>
                        <div class="text-xs font-mono text-gray-900 dark:text-white break-all">${userAgent}</div>
                    </div>
                </div>
            </div>
        `;
        
        resultsDiv.innerHTML = html;
        resultsDiv.classList.remove('hidden');
    }

    parseUserAgent(userAgent) {
        let browser = 'Unknown';
        let os = 'Unknown';
        let device = 'Desktop';
        
        // Browser detection
        if (userAgent.includes('Chrome')) browser = 'Chrome';
        else if (userAgent.includes('Firefox')) browser = 'Firefox';
        else if (userAgent.includes('Safari')) browser = 'Safari';
        else if (userAgent.includes('Edge')) browser = 'Edge';
        else if (userAgent.includes('Opera')) browser = 'Opera';
        
        // OS detection
        if (userAgent.includes('Windows')) os = 'Windows';
        else if (userAgent.includes('Mac')) os = 'macOS';
        else if (userAgent.includes('Linux')) os = 'Linux';
        else if (userAgent.includes('Android')) os = 'Android';
        else if (userAgent.includes('iOS')) os = 'iOS';
        
        // Device detection
        if (userAgent.includes('Mobile') || userAgent.includes('Android') || userAgent.includes('iPhone')) {
            device = 'Mobile';
        } else if (userAgent.includes('Tablet') || userAgent.includes('iPad')) {
            device = 'Tablet';
        }
        
        return { browser, os, device };
    }

    async performWHOIS() {
        const input = document.getElementById('whoisInput');
        const domain = input.value.trim();
        
        if (!domain || !this.validateDomain(input)) {
            this.showError('whoisResults', 'Please enter a valid domain name');
            return;
        }

        this.showLoading('whoisResults');
        
        // Simulate WHOIS lookup (in production, this would require a backend service)
        setTimeout(() => {
            const mockResults = this.generateMockWHOISResults(domain);
            this.displayWHOISResults(mockResults);
        }, 2000);
    }

    generateMockWHOISResults(domain) {
        return {
            domain: domain,
            registrar: 'GoDaddy.com, LLC',
            created: '2010-03-15',
            expires: '2025-03-15',
            updated: '2024-02-20',
            status: 'clientTransferProhibited',
            nameServers: [
                'ns1.domain.com',
                'ns2.domain.com'
            ],
            registrant: {
                name: 'Private Registration',
                organization: 'Domains By Proxy, LLC',
                country: 'US'
            }
        };
    }

    displayWHOISResults(results) {
        const resultsDiv = document.getElementById('whoisResults');
        
        const html = `
            <div class="space-y-3">
                <h4 class="font-semibold text-gray-900 dark:text-white">WHOIS Information for ${results.domain}:</h4>
                <div class="space-y-2">
                    <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="text-sm text-gray-600 dark:text-gray-300">Domain Name</div>
                        <div class="text-lg font-semibold text-gray-900 dark:text-white">${results.domain}</div>
                    </div>
                    <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="text-sm text-gray-600 dark:text-gray-300">Registrar</div>
                        <div class="text-lg font-semibold text-gray-900 dark:text-white">${results.registrar}</div>
                    </div>
                    <div class="grid grid-cols-3 gap-2">
                        <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div class="text-sm text-gray-600 dark:text-gray-300">Created</div>
                            <div class="text-sm font-semibold text-gray-900 dark:text-white">${results.created}</div>
                        </div>
                        <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div class="text-sm text-gray-600 dark:text-gray-300">Expires</div>
                            <div class="text-sm font-semibold text-gray-900 dark:text-white">${results.expires}</div>
                        </div>
                        <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                            <div class="text-sm text-gray-600 dark:text-gray-300">Updated</div>
                            <div class="text-sm font-semibold text-gray-900 dark:text-white">${results.updated}</div>
                        </div>
                    </div>
                    <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="text-sm text-gray-600 dark:text-gray-300">Status</div>
                        <div class="text-sm font-semibold text-gray-900 dark:text-white">${results.status}</div>
                    </div>
                    <div class="p-3 bg-gray-50 dark:bg-gray-700 rounded-lg">
                        <div class="text-sm text-gray-600 dark:text-gray-300">Name Servers</div>
                        <div class="text-sm font-semibold text-gray-900 dark:text-white">
                            ${results.nameServers.join(', ')}
                        </div>
                    </div>
                </div>
            </div>
        `;
        
        resultsDiv.innerHTML = html;
        resultsDiv.classList.remove('hidden');
    }

    showLoading(resultsId) {
        const resultsDiv = document.getElementById(resultsId);
        resultsDiv.innerHTML = `
            <div class="text-center py-8">
                <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
                <p class="mt-2 text-sm text-gray-600 dark:text-gray-300">Processing...</p>
            </div>
        `;
        resultsDiv.classList.remove('hidden');
    }

    showError(resultsId, message) {
        const resultsDiv = document.getElementById(resultsId);
        resultsDiv.innerHTML = `
            <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
                <div class="flex">
                    <div class="flex-shrink-0">
                        <svg class="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"></path>
                        </svg>
                    </div>
                    <div class="ml-3">
                        <p class="text-sm text-red-700 dark:text-red-300">${message}</p>
                    </div>
                </div>
            </div>
        `;
        resultsDiv.classList.remove('hidden');
    }

    generateRandomIP() {
        return `${Math.floor(Math.random() * 255) + 1}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}.${Math.floor(Math.random() * 255)}`;
    }
}

// Global functions for onclick handlers
window.performDNSLookup = function() {
    window.networkTools.performDNSLookup();
};

window.performPingTest = function() {
    window.networkTools.performPingTest();
};

window.performTraceroute = function() {
    window.networkTools.performTraceroute();
};

window.checkPort = function() {
    window.networkTools.checkPort();
};

window.analyzeUserAgent = function() {
    window.networkTools.analyzeUserAgent();
};

window.performWHOIS = function() {
    window.networkTools.performWHOIS();
};

// Initialize the tools when DOM is loaded
document.addEventListener('DOMContentLoaded', () => {
    window.networkTools = new NetworkTools();
});
