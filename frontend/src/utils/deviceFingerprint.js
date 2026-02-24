export function getDeviceInfo() {
    return {
      userAgent: navigator.userAgent,
      screen: `${window.screen.width}x${window.screen.height}`
    };
  }