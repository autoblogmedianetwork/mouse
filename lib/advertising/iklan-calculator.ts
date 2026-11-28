/**
 * Simple iklan (advertising) calculator.
 *
 * Parameters:
 *   commission   percent (0‑100) expected commission per sale
 *   cpc          cost‑per‑click (Rp)
 *   budget       daily budget (Rp)
 *
 * Returns:
 *   salesNeeded        number of sales needed to break‑even
 *   clicksNeeded       estimated clicks to achieve those sales
 *   costPerSale       cost the ad network will charge per sale
 */
export type IklanParams = {
  /**
   * Expected commission per sale, expressed as a percentage of the
   * transaction amount. Must be between 0 and 100.
   */
  commission: number;
  /**
   * Cost‑per‑click in Indonesian Rupiah.
   */
  cpc: number;
  /**
   * Daily spending budget in Rupiah.
   */
  budget: number;
};

export type IklanResult = {
  /**
   * Number of sales the user needs to earn before the cost of the
   * campaign exceeds the spend (rounded up).
   */
  salesNeeded: number;
  /**
   * Estimated number of clicks to generate those sales.
   */
  clicksNeeded: number;
  /**
   * The net cost the platform takes for each sales transaction.
   */
  costPerSale: number;
};

/**
 * Estimasi break‑even untuk iklan affiliate. Perhitungan bersifat
 * `will‑force` tanpa mempertimbangkan konversi 1:1, atau faktor
 * penurunan iklan seiring waktu. Digunakan sebagai contoh dasar.
 */
export function estimateIklan({
  commission,
  cpc,
  budget,
}: IklanParams): IklanResult {
  if (commission <= 0 || commission > 100) {
    throw new Error("commission harus di antara 0 < x ≤ 100");
  }
  if (cpc <= 0) {
    throw new Error("cpc harus lebih dari 0");
  }
  if (budget <= 0) {
    throw new Error("budget harus lebih dari 0");
  }

  // biaya per nilai jual harus ditentukan: biaya per sale = cpc / (commission/100)
  const costPerSale = cpc / (commission / 100);

  // banyaknya penjualan yang dibutuhkan untuk menutup pengeluaran
  const salesNeeded = Math.ceil((budget) / costPerSale);

  // estimasi klik: setiap penjualan membutuhkan rata‑rata cpc/(commission/100) / cpc clicks
  const clicksPerSale = costPerSale / cpc; // rata‑rata klik per penjualan
  const clicksNeeded = Math.ceil(salesNeeded * clicksPerSale);

  return { salesNeeded, clicksNeeded, costPerSale };
}
