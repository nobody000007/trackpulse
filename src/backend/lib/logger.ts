function getClient() {
  try {
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const ai = require('applicationinsights') as typeof import('applicationinsights');
    return ai.defaultClient ?? null;
  } catch {
    return null;
  }
}

export const logger = {
  info(message: string, properties?: Record<string, string>) {
    console.log(`[INFO] ${message}`);
    getClient()?.trackTrace({ message, severity: 'Information', properties });
  },

  warn(message: string, properties?: Record<string, string>) {
    console.warn(`[WARN] ${message}`);
    getClient()?.trackTrace({ message, severity: 'Warning', properties });
  },

  error(message: string, error?: Error, properties?: Record<string, string>) {
    console.error(`[ERROR] ${message}`, error);
    getClient()?.trackTrace({ message, severity: 'Error', properties });
    if (error) getClient()?.trackException({ exception: error, properties });
  },

  event(name: string, properties?: Record<string, string>) {
    getClient()?.trackEvent({ name, properties });
  },
};
