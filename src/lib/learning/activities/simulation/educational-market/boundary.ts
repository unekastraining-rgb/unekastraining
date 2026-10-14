/**
 * 2P-17 — Educational boundary guards (fake money only).
 */

export function educationalMarketIsNotBrokerage(): true {
  return true;
}

export function educationalMarketIsNotRealMoney(): true {
  return true;
}

export function educationalMarketIsNotFinancialAdvice(): true {
  return true;
}

/** Reject source strings that look like brokerage / real-money integrations. */
export function sourceMentionsForbiddenBrokerageInfra(sourceText: string): boolean {
  const banned = [
    /from\s+['\"]@?[\w/-]*broker/i,
    /\balpaca\b|\brobinhood\b|interactive\s*brokers|td\s*ameritrade|schwab\s*api/i,
    /placeOrder\s*\(.*real/i,
    /stripe\.|plaid\.|ach\s*transfer|wire\s*transfer/i,
    /depositRealMoney|withdrawFunds|linkBankAccount/i,
    /fetch\s*\(\s*['\"]https?:\/\/[^'\"]*broker/i,
  ];
  return banned.some((re) => re.test(sourceText));
}

export function educationalMarketBoundaryTruthSummary(): {
  noBrokerageApis: true;
  noRealMoney: true;
  noDepositsWithdrawals: true;
  notFinancialAdvice: true;
  profitIsNotMastery: true;
  lossIsNotAutomaticFailure: true;
} {
  return {
    noBrokerageApis: true,
    noRealMoney: true,
    noDepositsWithdrawals: true,
    notFinancialAdvice: true,
    profitIsNotMastery: true,
    lossIsNotAutomaticFailure: true,
  };
}
