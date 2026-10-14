/**
 * Knowledge pack: Stocks fundamentals (Phase 3B-1 vertical slice).
 * Distinct from economics/business packs — finance / stocks subject.
 * Knowledge only — not a lesson generator. Not trading advice.
 */

import type { InstructionalKnowledgePack } from "@/lib/learning/knowledge/instructional-library";
import { registerInstructionalPack } from "@/lib/learning/knowledge/instructional-library";

export const STOCKS_FUNDAMENTALS_PACK: InstructionalKnowledgePack = {
  id: "stocks-fundamentals",
  match: [
    "stocks",
    "stock market",
    "stocks and shares",
    "what is a stock",
    "what are stocks",
    "market capitalization",
    "market cap",
    "p/e ratio",
    "pe ratio",
    "price to earnings",
    "price-to-earnings",
  ],
  domain: "finance",
  subject: "stocks",
  displayTitle: "Stocks fundamentals",
  learningFrame:
    "Introductory stock-market knowledge: what a share is, what market cap measures, and what a P/E ratio describes — not buy/sell advice.",
  cheatSheet:
    "Share = ownership slice · Market cap = price × shares outstanding · P/E = price ÷ earnings per share",
  concepts: [
    {
      id: "stocks-share",
      title: "Stock / share",
      aliases: [
        "stocks",
        "shares",
        "stocks and shares",
        "what is a stock",
        "what are stocks",
        "stock share ownership",
        "equity shares",
      ],
      role: "concept",
      definition:
        "A stock (or share) is a unit of ownership in a corporation; shareholders own a claim on the company’s residual value and typically some voting rights.",
      explanation:
        "When you buy a share, you buy a small piece of the company — not a loan to the company (that would be a bond). Companies issue shares to raise capital for growth without borrowing that amount. Ownership is proportional: owning 100 of 1,000,000 shares means you own 0.01% of the firm. Share prices move on exchanges as buyers and sellers agree on value. Shareholders may receive dividends if the company distributes profits, but many growth firms reinvest instead. This concept explains ownership structure; it is not a recommendation to buy or sell any security.",
      purpose: "Explain what equity ownership means at a basic level.",
      example:
        "If a company has 1,000,000 shares outstanding and you buy 1,000 shares, you own 0.1% of the company.",
      examples: [
        "A startup sells shares to investors to fund product development without taking a bank loan for the full amount.",
        "Two investors can own different numbers of shares and therefore different ownership percentages.",
      ],
      nonExamples: [
        "A bank loan that must be repaid with interest (debt, not equity ownership)",
        "A gift card or customer credit — that is not a share of the company",
      ],
      misconceptions: [
        "Buying a share does not mean you manage day-to-day operations.",
        "A rising share price is not a guarantee of future gains.",
      ],
      misconception:
        "Confusing owning shares with lending money to the company like a bondholder.",
      vocabulary: [
        "share",
        "stock",
        "shareholder",
        "equity",
        "dividend",
        "shares outstanding",
      ],
      relatedConcepts: ["stocks-market-cap", "stocks-pe-ratio"],
      workedExamples: [
        "Given 2,000,000 shares outstanding, compute ownership % for someone who buys 5,000 shares.",
      ],
      practiceForms: ["calculation", "explain", "scenario"],
      masteryCriteria: [
        "Can explain that a share represents ownership, not a loan",
        "Can relate number of shares owned to ownership percentage",
      ],
      difficulty: 1,
      curriculumMappings: [
        {
          curriculumId: "intro-investing-survey",
          label: "Intro Investing Survey",
          unit: "Equities",
          chapter: "What is a stock?",
          conceptId: "stocks-share",
        },
      ],
      checkPrompt: "What does owning a share of a company mean?",
    },
    {
      id: "stocks-market-cap",
      title: "Market capitalization",
      aliases: [
        "market cap",
        "market capitalisation",
        "what is market cap",
        "company market capitalization",
      ],
      role: "concept",
      definition:
        "Market capitalization (market cap) is the total market value of a company’s outstanding shares, estimated as share price × shares outstanding.",
      explanation:
        "Market cap answers: “What is the equity of this company worth at today’s share price?” Multiply the current share price by the number of shares outstanding. It is different from the price of one share: a $10 stock with huge share count can have a larger market cap than a $500 stock with few shares. Investors often group companies as large-cap, mid-cap, or small-cap using market cap ranges (definitions vary by source). Market cap changes whenever price or share count changes. It is a size measure, not a complete statement of quality or future returns.",
      purpose: "Compare company equity size using a standard market-based measure.",
      example:
        "Share price $50 × 10,000,000 shares outstanding = $500,000,000 market cap.",
      examples: [
        "Company A: $20 × 100M shares = $2B market cap; Company B: $200 × 5M shares = $1B market cap — A is larger despite a lower share price.",
      ],
      nonExamples: [
        "Using only the share price to decide which company is “bigger”",
        "Equating market cap with cash in the bank or book value of assets",
      ],
      misconceptions: [
        "A higher share price does not automatically mean a larger company.",
        "Market cap is not the same as enterprise value (which also considers debt/cash).",
      ],
      misconception:
        "Judging company size from share price alone without shares outstanding.",
      breakdown:
        "1) Find current share price\n2) Find shares outstanding\n3) Multiply → market cap",
      vocabulary: [
        "market capitalization",
        "shares outstanding",
        "share price",
        "large-cap",
        "small-cap",
      ],
      prerequisites: ["stocks-share"],
      relatedConcepts: ["stocks-pe-ratio"],
      workedExamples: [
        "Price $35, shares outstanding 80,000,000 — compute market cap.",
      ],
      practiceForms: ["calculation", "compare", "explain"],
      masteryCriteria: [
        "Can compute market cap from price and shares outstanding",
        "Can explain why share price alone does not measure company size",
      ],
      difficulty: 2,
      curriculumMappings: [
        {
          curriculumId: "intro-investing-survey",
          label: "Intro Investing Survey",
          unit: "Equities",
          chapter: "Market capitalization",
          conceptId: "stocks-market-cap",
        },
      ],
      checkPrompt: "What two numbers multiply to give market capitalization?",
    },
    {
      id: "stocks-pe-ratio",
      title: "P/E ratio",
      aliases: [
        "pe ratio",
        "price to earnings",
        "price-to-earnings",
        "price earnings ratio",
        "what is p/e",
      ],
      role: "concept",
      definition:
        "The price-to-earnings (P/E) ratio compares a company’s share price to its earnings per share (EPS): roughly share price ÷ EPS.",
      explanation:
        "P/E asks how much investors are paying for one dollar of reported earnings. If a share costs $40 and EPS is $2, P/E is 20. A higher P/E can mean the market expects faster growth — or that the stock is expensive relative to current earnings; a lower P/E can mean value opportunity or weaker prospects. Interpretation depends on industry, growth, accounting choices, and whether earnings are trailing or forward. P/E is one valuation snapshot, not a buy or sell signal by itself, and not trading advice.",
      purpose: "Relate share price to earnings in a simple, widely cited ratio.",
      example:
        "Share price $40, earnings per share $2 → P/E = 40 ÷ 2 = 20.",
      examples: [
        "Compare two peers in the same industry: similar growth but very different P/E may invite questions about expectations or risk.",
      ],
      nonExamples: [
        "Using P/E alone as an automatic “buy if low, sell if high” rule",
      ],
      misconceptions: [
        "A low P/E is not automatically a bargain.",
        "P/E is undefined or misleading when earnings are near zero or negative.",
      ],
      misconception:
        "Treating P/E as a complete investment decision without context.",
      breakdown:
        "1) Obtain share price\n2) Obtain EPS\n3) Divide price by EPS → P/E",
      vocabulary: [
        "P/E",
        "EPS",
        "earnings",
        "valuation",
        "trailing",
        "forward",
      ],
      prerequisites: ["stocks-share"],
      relatedConcepts: ["stocks-market-cap"],
      workedExamples: [
        "Price $72, EPS $4.5 — compute P/E and state one reason context still matters.",
      ],
      practiceForms: ["calculation", "interpret", "explain"],
      masteryCriteria: [
        "Can compute P/E from price and EPS",
        "Can state that P/E needs industry/growth context and is not a trade signal alone",
      ],
      difficulty: 2,
      curriculumMappings: [
        {
          curriculumId: "intro-investing-survey",
          label: "Intro Investing Survey",
          unit: "Valuation basics",
          chapter: "P/E ratio",
          conceptId: "stocks-pe-ratio",
        },
      ],
      checkPrompt: "How do you calculate a basic P/E ratio?",
    },
    {
      id: "stocks-revenue-earnings",
      title: "Revenue and earnings",
      aliases: ["company revenue", "earnings vs revenue", "profit vs revenue stocks"],
      definition:
        "Revenue is money from core business activity; earnings (net income) is profit after expenses.",
      explanation:
        "Revenue (sales) is top-line. Earnings are what remains after costs, interest, and taxes. A company can grow revenue while earnings fall if costs rise. These are accounting measures, not stock tips.",
      purpose: "Separate sales from profit.",
      example:
        "Revenue $100M and expenses $90M → earnings $10M (simplified).",
      misconceptions: ["High revenue alone does not guarantee high earnings."],
      misconception: "Equating revenue with profit.",
      vocabulary: ["revenue", "earnings", "net income", "expenses"],
      relatedConcepts: ["stocks-eps", "stocks-pe-ratio"],
      practiceForms: ["explain", "compare"],
      masteryCriteria: ["Can contrast revenue and earnings in one sentence"],
      difficulty: 1,
      checkPrompt: "How does revenue differ from earnings?",
    },
    {
      id: "stocks-eps",
      title: "Earnings per share (EPS)",
      aliases: ["EPS", "earnings per share", "what is EPS"],
      definition:
        "EPS is earnings attributed to each common share: roughly net income ÷ shares outstanding.",
      explanation:
        "EPS scales total earnings to a per-share figure used in P/E. Diluted EPS accounts for potential share issuance. EPS depends on accounting choices and share count.",
      purpose: "Express earnings on a per-share basis.",
      example: "Net income $50M ÷ 25M shares = $2.00 EPS",
      misconceptions: ["EPS is not cash automatically deposited to shareholders."],
      misconception: "Thinking EPS means you receive that cash per share.",
      vocabulary: ["EPS", "diluted", "shares outstanding"],
      relatedConcepts: ["stocks-pe-ratio", "stocks-revenue-earnings"],
      practiceForms: ["calculation"],
      masteryCriteria: ["Can compute basic EPS from income and share count"],
      difficulty: 2,
      checkPrompt: "What two numbers make a simple EPS?",
    },
    {
      id: "stocks-dividends",
      title: "Dividends",
      aliases: ["stock dividends", "dividend basics"],
      definition:
        "A dividend is a distribution of corporate profits to shareholders, often in cash.",
      explanation:
        "Not all companies pay dividends — many reinvest earnings. Dividend yield relates annual dividends to price. Dividends are not guaranteed. This is instructional, not advice to chase yield.",
      purpose: "Explain one way shareholders may receive cash from ownership.",
      example:
        "If a firm pays $1 per share annually and the share price is $50, yield is 2%.",
      misconceptions: ["A high dividend is not automatically safer."],
      misconception: "Assuming dividends cannot be cut.",
      vocabulary: ["dividend", "yield", "distribution"],
      relatedConcepts: ["stocks-share"],
      practiceForms: ["explain", "calculate"],
      masteryCriteria: ["Can define a dividend and note it is optional"],
      difficulty: 1,
      checkPrompt: "Do all public companies pay dividends?",
    },
    {
      id: "stocks-valuation-risk",
      title: "Valuation, growth, and risk",
      aliases: ["investment risk diversification", "stock valuation basics"],
      definition:
        "Valuation compares price to fundamentals; growth expectations and risk affect what investors pay; diversification spreads risk.",
      explanation:
        "Paying more for expected growth can raise multiples. Risk includes business, market, and liquidity risks. Diversification reduces idiosyncratic risk but not all market risk. None of this is a recommendation to buy or sell.",
      purpose: "Introduce valuation context, risk, and diversification conceptually.",
      example:
        "Owning many unrelated companies reduces the impact of one firm's failure compared with owning only one stock.",
      misconceptions: ["Diversification does not eliminate all losses."],
      misconception: "Believing a diversified portfolio cannot decline.",
      vocabulary: ["valuation", "growth", "risk", "diversification"],
      relatedConcepts: ["stocks-pe-ratio", "stocks-market-cap"],
      practiceForms: ["explain", "scenario"],
      masteryCriteria: [
        "Can state that valuation needs context and diversification reduces single-name risk",
      ],
      difficulty: 2,
      checkPrompt: "What does diversification try to reduce?",
    },
  ],
};

registerInstructionalPack(STOCKS_FUNDAMENTALS_PACK);
