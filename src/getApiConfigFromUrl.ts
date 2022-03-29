import queryString from "query-string";

export default function getApiConfigFromUrl() {
  const { location } = window;
  const { k: apiKey = "", s: apiSecret = "" } = queryString.parse(
    location.search
  ) as {
    k: string;
    s: string;
  };

  return {
    apiKey: window.atob(apiKey),
    apiSecret: window.atob(apiSecret),
  };
}
