class DeviceFingerprint {
  async generate() {
      const fingerprint = {
          userAgent: navigator.userAgent,
          platform: navigator.platform,
          language: navigator.language,
          screenResolution: `${screen.width}x${screen.height}`,
          colorDepth: screen.colorDepth,
          timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
          touchSupport: 'ontouchstart' in window,
          cookiesEnabled: navigator.cookieEnabled,
          localStorage: !!window.localStorage,
          sessionStorage: !!window.sessionStorage,
          timestamp: new Date().getTime()
      };

      // Check for VPN (simplified - in production use API)
      fingerprint.vpn_detected = await this.detectVPN();

      return fingerprint;
  }

  async detectVPN() {
      // Simplified VPN detection
      // In production, use WebRTC leak detection or VPN detection APIs
      try {
          const response = await fetch('https://api.ipify.org?format=json');
          const data = await response.json();
          
          // Check if IP is from known VPN ranges (simplified)
          // This is just a demo - use real VPN detection in production
          return false;
      } catch (error) {
          return false;
      }
  }

  generateHash() {
      const str = JSON.stringify(this.generate());
      let hash = 0;
      for (let i = 0; i < str.length; i++) {
          const char = str.charCodeAt(i);
          hash = ((hash << 5) - hash) + char;
          hash = hash & hash;
      }
      return hash.toString();
  }
}

export default new DeviceFingerprint();