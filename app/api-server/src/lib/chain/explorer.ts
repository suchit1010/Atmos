function clusterQuery(network: string): string {
  if (network === "mainnet-beta") return "";
  if (network === "localnet") return "?cluster=custom&customUrl=http%3A%2F%2Flocalhost%3A8899";
  return `?cluster=${encodeURIComponent(network)}`;
}

export function explorerTxUrl(signature: string, network: string): string {
  return `https://explorer.solana.com/tx/${encodeURIComponent(signature)}${clusterQuery(network)}`;
}

export function explorerAddressUrl(address: string, network: string): string {
  return `https://explorer.solana.com/address/${encodeURIComponent(address)}${clusterQuery(network)}`;
}
