const startTime = Date.now();

export function getBehaviorInfo() {
  return {
    loginTime: Date.now() - startTime
  };
}