// Tax figures that change every year. Pure (no I/O), so pages and tests share them.

// CPP for the self-employed, 2026 (ESDC): 11.9% of earnings from $3,500 to
// $74,600 (most $8,460.90), plus CPP2 at 8% from $74,600 to $85,000 (most $832).
export const CPP_2026 = { rate: 0.119, exemption: 3500, ceiling: 74600, cpp2Rate: 0.08, cpp2Ceiling: 85000 };

/** Self-employed CPP and CPP2 on a year's net income. */
export const selfEmployedCpp = (net: number, c = CPP_2026) => {
  const base = Math.min(Math.max(0, net - c.exemption), c.ceiling - c.exemption) * c.rate;
  const second = Math.max(0, Math.min(net, c.cpp2Ceiling) - c.ceiling) * c.cpp2Rate;
  return Math.round((base + second) * 100) / 100;
};
