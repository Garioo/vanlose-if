type AnalyticsValue = string | number | boolean;

type PlausibleEventOptions = {
  props?: Record<string, AnalyticsValue>;
};

declare global {
  interface Window {
    plausible?: (event: string, options?: PlausibleEventOptions) => void;
  }
}

export function trackEvent(event: string, props?: Record<string, AnalyticsValue>) {
  if (typeof window === "undefined") return;
  if (typeof window.plausible !== "function") return;

  if (props) {
    window.plausible(event, { props });
    return;
  }

  window.plausible(event);
}
