/**
 * Top 10 most popular currencies by trading volume and international usage
 */
export const POPULAR_CURRENCIES = [
  { code: "USD", name: "US Dollar", symbol: "$" },
  { code: "EUR", name: "Euro", symbol: "€" },
  { code: "GBP", name: "British Pound", symbol: "£" },
  { code: "JPY", name: "Japanese Yen", symbol: "¥" },
  { code: "INR", name: "Indian Rupee", symbol: "₹" },
  { code: "AUD", name: "Australian Dollar", symbol: "A$" },
  { code: "CAD", name: "Canadian Dollar", symbol: "C$" },
  { code: "CHF", name: "Swiss Franc", symbol: "CHF" },
  { code: "CNY", name: "Chinese Yuan", symbol: "¥" },
  { code: "SEK", name: "Swedish Krona", symbol: "kr" },
] as const;

export type CurrencyCode = typeof POPULAR_CURRENCIES[number]["code"];

export function getCurrencySymbol(code: string): string {
  const currency = POPULAR_CURRENCIES.find(c => c.code === code);
  return currency?.symbol || code;
}

export function getCurrencyName(code: string): string {
  const currency = POPULAR_CURRENCIES.find(c => c.code === code);
  return currency?.name || code;
}

export function formatCurrency(amount: number | string, currencyCode: string): string {
  const numAmount = typeof amount === "string" ? parseFloat(amount) : amount;
  const symbol = getCurrencySymbol(currencyCode);

  // Format with appropriate decimal places
  const formatted = numAmount.toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });

  return `${symbol} ${formatted}`;
}
