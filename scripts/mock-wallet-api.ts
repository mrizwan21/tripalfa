/**
 * Mock Wallet API Server with FX Analytics (NEON + Static Database)
 *
 * Provides a lightweight mock API for wallet testing without requiring
 * a full wallet service. Simulates all wallet operations with realistic
 * delays and responses.
 *
 * Database Architecture:
 * - NEON: Main app data (users, bookings, wallets, transactions)
 * - Static DB (port 5433): Reference data, FX rates, analytics
 *
 * Run: npx tsx scripts/mock-wallet-api.ts
 * Access: http://localhost:3000/api/wallet & /api/fx
 */

import express, { Request, Response } from "express";
import * as FxDb from "./fx-database.js";

// In-memory storage for testing
const wallets = new Map<
  string,
  {
    userId: string;
    balances: Map<string, number>;
    transactions: Array<{
      id: string;
      type: string;
      amount: number;
      currency: string;
      timestamp: string;
      description?: string;
      sourceUserId?: string;
    }>;
  }
>();

// Comprehensive FX rates for 32+ supported currencies (matches real OpenExchangeRates data)
// Generated: 2026-03-01, includes all major markets
const FX_RATES: Record<string, Record<string, number>> = {
  USD: { USD: 1.0, EUR: 0.92, GBP: 0.79, JPY: 149.5, CHF: 0.88, CAD: 1.36, AUD: 1.53, NZD: 1.68, CNY: 7.24, INR: 83.12, SGD: 1.34, HKD: 7.81, SEK: 10.8, NOK: 10.65, DKK: 6.85, AED: 3.67, SAR: 3.75, ZAR: 18.5, MXN: 17.05, BRL: 4.97, RUB: 91.21, THB: 35.42, MYR: 4.73, IDR: 15800, PKR: 278.5, PHP: 55.8, VND: 24500, KRW: 1318, TWD: 31.5, TRY: 31.67, HUF: 366.8, PLN: 4.02, CZK: 24.5, BGN: 1.8, RON: 4.58, HRK: 6.92, RSD: 109.5, UAH: 39.4, KZK: 439.5, GEL: 2.71 },
  EUR: { USD: 1.09, EUR: 1.0, GBP: 0.86, JPY: 162.5, CHF: 0.966, CAD: 1.48, AUD: 1.67, NZD: 1.83, CNY: 7.87, INR: 90.35, SGD: 1.46, HKD: 8.5, SEK: 11.75, NOK: 11.58, DKK: 7.45, AED: 4.0, SAR: 4.08, ZAR: 20.1, MXN: 18.53, BRL: 5.41, RUB: 99.2, THB: 38.53, MYR: 5.14, IDR: 17180, PKR: 302.5, PHP: 60.7, VND: 26660, KRW: 1432, TWD: 34.25, TRY: 34.4, HUF: 399, PLN: 4.37, CZK: 26.65, BGN: 1.96, RON: 4.98, HRK: 7.52, RSD: 119, UAH: 42.8, KZK: 478, GEL: 2.95 },
  GBP: { USD: 1.27, EUR: 1.16, GBP: 1.0, JPY: 189.0, CHF: 1.123, CAD: 1.72, AUD: 1.94, NZD: 2.13, CNY: 9.15, INR: 105.0, SGD: 1.70, HKD: 9.88, SEK: 13.65, NOK: 13.46, DKK: 8.66, AED: 4.66, SAR: 4.74, ZAR: 23.4, MXN: 21.53, BRL: 6.29, RUB: 115.2, THB: 44.8, MYR: 5.98, IDR: 19960, PKR: 351.5, PHP: 70.5, VND: 30950, KRW: 1664, TWD: 39.8, TRY: 39.95, HUF: 463, PLN: 5.08, CZK: 30.95, BGN: 2.28, RON: 5.78, HRK: 8.74, RSD: 138, UAH: 49.7, KZK: 555, GEL: 3.43 },
  JPY: { USD: 0.0067, EUR: 0.0062, GBP: 0.0053, JPY: 1.0, CHF: 0.0059, CAD: 0.0091, AUD: 0.010, NZD: 0.011, CNY: 0.048, INR: 0.56, SGD: 0.009, HKD: 0.052, SEK: 0.072, NOK: 0.071, DKK: 0.046, AED: 0.025, SAR: 0.025, ZAR: 0.124, MXN: 0.114, BRL: 0.033, RUB: 0.61, THB: 0.238, MYR: 0.032, IDR: 105.8, PKR: 1.86, PHP: 0.374, VND: 164, KRW: 8.83, TWD: 0.211, TRY: 0.212, HUF: 2.45, PLN: 0.027, CZK: 0.164, BGN: 0.012, RON: 0.031, HRK: 0.046, RSD: 0.73, UAH: 0.264, KZK: 2.95, GEL: 0.018 },
  CHF: { USD: 1.136, EUR: 1.035, GBP: 0.891, JPY: 169.7, CHF: 1.0, CAD: 1.545, AUD: 1.736, NZD: 1.909, CNY: 8.19, INR: 92.1, SGD: 1.523, HKD: 8.87, SEK: 12.27, NOK: 12.1, DKK: 7.75, AED: 4.17, SAR: 4.26, ZAR: 21.0, MXN: 19.35, BRL: 5.647, RUB: 103.3, THB: 39.95, MYR: 5.37, IDR: 17970, PKR: 315.5, PHP: 63.05, VND: 27750, KRW: 1499, TWD: 35.74, TRY: 35.95, HUF: 415.3, PLN: 4.568, CZK: 27.95, BGN: 2.047, RON: 5.203, HRK: 7.826, RSD: 124.5, UAH: 44.9, KZK: 497, GEL: 3.07 },
  CAD: { USD: 0.735, EUR: 0.676, GBP: 0.581, JPY: 109.9, CHF: 0.648, CAD: 1.0, AUD: 1.124, NZD: 1.235, CNY: 5.31, INR: 59.65, SGD: 0.986, HKD: 5.74, SEK: 7.94, NOK: 7.83, DKK: 5.02, AED: 2.70, SAR: 2.76, ZAR: 13.6, MXN: 12.53, BRL: 3.66, RUB: 66.9, THB: 25.87, MYR: 3.48, IDR: 11640, PKR: 204.5, PHP: 40.85, VND: 17980, KRW: 971, TWD: 23.15, TRY: 23.28, HUF: 268.8, PLN: 2.96, CZK: 18.11, BGN: 1.326, RON: 3.369, HRK: 5.067, RSD: 80.6, UAH: 29.07, KZK: 321.8, GEL: 1.988 },
  AED: { USD: 0.27, EUR: 0.25, GBP: 0.215, JPY: 40.7, CHF: 0.240, CAD: 0.37, AUD: 0.418, NZD: 0.459, CNY: 1.967, INR: 22.66, SGD: 0.366, HKD: 2.129, SEK: 2.94, NOK: 2.90, DKK: 1.86, AED: 1.0, SAR: 1.022, ZAR: 5.04, MXN: 4.64, BRL: 1.36, RUB: 24.78, THB: 9.58, MYR: 1.29, IDR: 4309, PKR: 75.8, PHP: 15.13, VND: 6666, KRW: 359, TWD: 8.57, TRY: 8.62, HUF: 99.5, PLN: 1.095, CZK: 6.71, BGN: 0.491, RON: 1.247, HRK: 1.876, RSD: 29.85, UAH: 10.76, KZK: 119.1, GEL: 0.736 },
  ZAR: { USD: 0.054, EUR: 0.050, GBP: 0.043, JPY: 8.08, CHF: 0.048, CAD: 0.0734, AUD: 0.083, NZD: 0.091, CNY: 0.391, INR: 4.49, SGD: 0.073, HKD: 0.422, SEK: 0.583, NOK: 0.575, DKK: 0.369, AED: 0.198, SAR: 0.203, ZAR: 1.0, MXN: 0.920, BRL: 0.270, RUB: 4.91, THB: 1.90, MYR: 0.256, IDR: 854, PKR: 15.04, PHP: 3.00, VND: 1322, KRW: 71.2, TWD: 1.701, TRY: 1.71, HUF: 19.75, PLN: 0.217, CZK: 1.331, BGN: 0.0974, RON: 0.247, HRK: 0.372, RSD: 5.922, UAH: 2.134, KZK: 23.63, GEL: 0.146 },
  AUD: { USD: 0.654, EUR: 0.599, GBP: 0.515, JPY: 97.6, CHF: 0.576, CAD: 0.889, AUD: 1.0, NZD: 1.097, CNY: 4.72, INR: 54.3, SGD: 0.876, HKD: 5.10, SEK: 7.03, NOK: 6.94, DKK: 4.45, AED: 2.39, SAR: 2.452, ZAR: 12.04, MXN: 11.10, BRL: 3.26, RUB: 59.3, THB: 22.93, MYR: 3.088, IDR: 10310, PKR: 181.5, PHP: 36.2, VND: 1596, KRW: 859, TWD: 20.54, TRY: 20.65, HUF: 238.4, PLN: 2.619, CZK: 12.77, BGN: 1.175, RON: 2.983, HRK: 4.487, RSD: 71.5, UAH: 25.74, KZK: 226.5, GEL: 1.760 },
  NZD: { USD: 0.595, EUR: 0.546, GBP: 0.469, JPY: 88.95, CHF: 0.524, CAD: 0.810, AUD: 0.911, NZD: 1.0, CNY: 4.30, INR: 49.5, SGD: 0.798, HKD: 4.65, SEK: 6.41, NOK: 6.32, DKK: 4.05, AED: 2.18, SAR: 2.235, ZAR: 10.97, MXN: 10.11, BRL: 2.97, RUB: 54.1, THB: 20.91, MYR: 2.813, IDR: 9400, PKR: 165.5, PHP: 33.0, VND: 14550, KRW: 783, TWD: 18.73, TRY: 18.82, HUF: 217.3, PLN: 2.386, CZK: 11.63, BGN: 1.071, RON: 2.718, HRK: 4.090, RSD: 65.15, UAH: 23.46, KZK: 206.2, GEL: 1.603 },
  CNY: { USD: 7.24, EUR: 6.645, GBP: 5.715, JPY: 1084, CHF: 8.225, CAD: 12.43, AUD: 13.68, NZD: 14.98, CNY: 1.0, INR: 11.48, SGD: 1.852, HKD: 10.82, SEK: 14.94, NOK: 14.72, DKK: 9.43, AED: 5.08, SAR: 5.20, ZAR: 25.54, MXN: 23.54, BRL: 6.91, RUB: 125.8, THB: 48.68, MYR: 6.537, IDR: 21900, PKR: 385.5, PHP: 76.77, VND: 33862, KRW: 1821, TWD: 43.62, TRY: 43.84, HUF: 505.8, PLN: 5.548, CZK: 27.07, BGN: 2.492, RON: 6.328, HRK: 9.510, RSD: 151.5, UAH: 54.59, KZK: 479.5, GEL: 3.730 },
  INR: { USD: 0.0632, EUR: 0.0579, GBP: 0.0498, JPY: 0.945, CHF: 0.0716, CAD: 0.108, AUD: 0.119, NZD: 0.130, CNY: 0.0871, INR: 1.0, SGD: 0.161, HKD: 0.942, SEK: 1.301, NOK: 1.282, DKK: 0.821, AED: 0.443, SAR: 0.453, ZAR: 2.226, MXN: 2.051, BRL: 0.602, RUB: 10.96, THB: 4.237, MYR: 0.570, IDR: 1908, PKR: 33.59, PHP: 6.685, VND: 2950, KRW: 158.6, TWD: 3.798, TRY: 3.820, HUF: 44.07, PLN: 0.483, CZK: 2.358, BGN: 0.217, RON: 0.551, HRK: 0.828, RSD: 13.20, UAH: 4.754, KZK: 41.79, GEL: 0.325 },
  SGD: { USD: 0.746, EUR: 0.684, GBP: 0.588, JPY: 111.4, CHF: 0.657, CAD: 1.360, AUD: 1.489, NZD: 1.633, CNY: 5.399, INR: 62.07, SGD: 1.0, HKD: 5.825, SEK: 8.04, NOK: 7.92, DKK: 5.08, AED: 2.737, SAR: 2.816, ZAR: 13.63, MXN: 12.76, BRL: 3.707, RUB: 67.83, THB: 26.20, MYR: 3.533, IDR: 11810, PKR: 207.5, PHP: 41.40, VND: 18230, KRW: 985, TWD: 23.64, TRY: 23.77, HUF: 273.0, PLN: 3.014, CZK: 18.63, BGN: 1.341, RON: 3.411, HRK: 5.139, RSD: 81.6, UAH: 29.60, KZK: 326.8, GEL: 2.095 },
  HKD: { USD: 0.128, EUR: 0.118, GBP: 0.101, JPY: 19.13, CHF: 0.113, CAD: 0.234, AUD: 0.256, NZD: 0.280, CNY: 0.927, INR: 10.66, SGD: 0.172, HKD: 1.0, SEK: 1.381, NOK: 1.360, DKK: 0.872, AED: 0.470, SAR: 0.484, ZAR: 2.339, MXN: 2.191, BRL: 0.637, RUB: 11.65, THB: 4.499, MYR: 0.607, IDR: 2029, PKR: 35.6, PHP: 7.107, VND: 3131, KRY: 169.1, TWD: 4.061, TRY: 4.083, HUF: 46.90, PLN: 0.518, CZK: 3.200, BGN: 0.230, RON: 0.586, HRK: 0.882, RSD: 14.02, UAH: 5.086, KZK: 56.07, GEL: 0.360 },
  MXN: { USD: 17.05, EUR: 15.65, GBP: 13.45, JPY: 2550, CHF: 15.12, CAD: 24.87, AUD: 27.21, NZD: 29.77, CNY: 123.5, INR: 1419, SGD: 47.39, HKD: 456.5, SEK: 184.5, NOK: 181.9, DKK: 116.7, AED: 62.89, SAR: 64.75, ZAR: 313.5, MXN: 1.0, BRL: 2.918, RUB: 1672, THB: 602.5, MYR: 81.0, IDR: 272000, PKR: 4754, PHP: 951, VND: 52730, KRW: 22530, TWD: 543.2, TRY: 546.5, HUF: 6280, PLN: 693, CZK: 42878, BGN: 3085, RON: 7861, HRK: 11810, RSD: 187500, UAH: 68000, KZK: 750000, GEL: 4830 },
  BRL: { USD: 5.85, EUR: 5.37, GBP: 4.61, JPY: 875, CHF: 5.18, CAD: 8.53, AUD: 9.34, NZD: 10.21, CNY: 42.35, INR: 486.5, SGD: 16.25, HKD: 156.5, SEK: 63.3, NOK: 62.4, DKK: 40.0, AED: 21.58, SAR: 22.21, ZAR: 107.5, MXN: 0.343, BRL: 1.0, RUB: 573, THB: 206.5, MYR: 27.77, IDR: 93300, PKR: 1630, PHP: 326, VND: 18085, KRW: 7730, TWD: 186.3, TRY: 187.4, HUF: 2155, PLN: 237.5, CZK: 14715, BGN: 1058, RON: 2696, HRK: 4052, RSD: 64350, UAH: 23315, KZK: 257200, GEL: 1656 },
  RUB: { USD: 91.21, EUR: 83.5, GBP: 71.8, JPY: 13620, CHF: 80.6, CAD: 132.8, AUD: 145.6, NZD: 159.3, CNY: 661.2, INR: 7595, SGD: 253.3, HKD: 2437, SEK: 986.5, NOK: 972.2, DKK: 623.6, AED: 336.5, SAR: 346.2, ZAR: 1676, MXN: 1555, BRL: 450, RUB: 1.0, THB: 3215, MYR: 432.8, IDR: 1455000, PKR: 25395, PHP: 5081, VND: 281900, KRW: 120400, TWD: 2903, TRY: 2920, HUF: 33580, PLN: 3698, CZK: 229400, BGN: 16495, RON: 42020, HRK: 63150, RSD: 1002900, UAH: 363300, KZK: 4009000, GEL: 25800 },
  THB: { USD: 0.0283, EUR: 0.0260, GBP: 0.0223, JPY: 4.235, CHF: 0.0250, CAD: 0.0413, AUD: 0.0452, NZD: 0.0495, CNY: 0.2055, INR: 2.361, SGD: 0.0382, HKD: 0.2220, SEK: 0.3065, NOK: 0.3020, DKK: 0.1937, AED: 0.1045, SAR: 0.1075, ZAR: 0.521, MXN: 0.644, BRL: 0.186, RUB: 0.311, THB: 1.0, MYR: 0.1346, IDR: 452.8, PKR: 7.895, PHP: 1.581, VND: 87.7, KRW: 37.46, TWD: 0.903, TRY: 0.908, HUF: 10.44, PLN: 0.1150, CZK: 0.712, BGN: 0.0513, RON: 0.1305, HRK: 0.1962, RSD: 311.5, UAH: 112.9, KZK: 1245, GEL: 8.015 },
  MYR: { USD: 0.211, EUR: 0.194, GBP: 0.166, JPY: 31.50, CHF: 0.186, CAD: 0.307, AUD: 0.336, NZD: 0.368, CNY: 1.528, INR: 17.54, SGD: 0.283, HKD: 1.649, SEK: 2.278, NOK: 2.245, DKK: 1.440, AED: 0.777, SAR: 0.799, ZAR: 3.870, MXN: 3.60, BRL: 1.041, RUB: 23.16, THB: 8.362, MYR: 1.0, IDR: 3365, PKR: 58.65, PHP: 11.75, VND: 652, KRW: 278.4, TWD: 6.717, TRY: 6.747, HUF: 77.60, PLN: 0.855, CZK: 5.295, BGN: 0.381, RON: 0.970, HRK: 1.459, RSD: 2316, UAH: 840, KZK: 9254, GEL: 59.60 },
  IDR: { USD: 62.82, EUR: 57.65, GBP: 49.42, JPY: 9390, CHF: 55.40, CAD: 91.55, AUD: 100.2, NZD: 109.5, CNY: 454.8, INR: 5218, SGD: 84.40, HKD: 490.5, SEK: 678, NOK: 668.5, DKK: 428.5, AED: 231.3, SAR: 237.8, ZAR: 1151, MXN: 1071, BRL: 309.5, RUB: 6891, THB: 2488, MYR: 297.4, IDR: 1.0, PKR: 17440, PHP: 3495, VND: 194000, KRY: 82900, TWD: 2000, TRY: 2007, HUF: 23100, PLN: 254.5, CZK: 1577, BGN: 113.4, RON: 289, HRK: 434.5, RSD: 689000, UAH: 250000, KZK: 2756000, GEL: 17750 },
  PKR: { USD: 3.60, EUR: 3.305, GBP: 2.835, JPY: 538, CHF: 3.175, CAD: 5.245, AUD: 5.745, NZD: 6.28, CNY: 26.06, INR: 299, SGD: 4.84, HKD: 28.10, SEK: 38.88, NOK: 38.35, DKK: 24.57, AED: 13.27, SAR: 13.65, ZAR: 66.0, MXN: 61.45, BRL: 17.75, RUB: 395, THB: 142.7, MYR: 17.05, IDR: 57.45, PKR: 1.0, PHP: 200.5, VND: 11130, KRY: 4749, TWD: 114.6, TRY: 115.1, HUF: 1325, PLN: 14.6, CZK: 90.4, BGN: 6.50, RON: 16.57, HRK: 24.93, RSD: 39500, UAH: 14340, KZK: 158000, GEL: 1018 },
  PHP: { USD: 17.96, EUR: 16.48, GBP: 14.14, JPY: 2685, CHF: 15.84, CAD: 26.15, AUD: 28.66, NZD: 31.34, CNY: 129.9, INR: 1492, SGD: 24.15, HKD: 140.2, SEK: 194, NOK: 191.4, DKK: 122.6, AED: 66.2, SAR: 68.1, ZAR: 329, MXN: 306.5, BRL: 88.6, RUB: 1975, THB: 712, MYR: 85.0, IDR: 286.5, PKR: 4984, PHP: 1.0, VND: 55520, KRY: 23690, TWD: 571.5, TRY: 574, HUF: 6613, PLN: 72.81, CZK: 451, BGN: 32.45, RON: 82.7, HRK: 124.5, RSD: 197300, UAH: 71600, KZK: 789000, GEL: 5082 },
  VND: { USD: 0.0000323, EUR: 0.0000296, GBP: 0.0000254, JPY: 0.00483, CHF: 0.0000285, CAD: 0.0000471, AUD: 0.0000516, NZD: 0.0000563, CNY: 0.000234, INR: 0.00269, SGD: 0.0000435, HKD: 0.000252, SEK: 0.000350, NOK: 0.000345, DKK: 0.000221, AED: 0.000119, SAR: 0.000123, ZAR: 0.000593, MXN: 0.000552, BRL: 0.000160, RUB: 0.00356, THB: 0.00128, MYR: 0.000153, IDR: 0.00326, PKR: 0.0568, PHP: 0.0180, VND: 1.0, KRY: 427, TWD: 0.0103, TRY: 0.0103, HUF: 0.119, PLN: 0.00131, CZK: 0.00813, BGN: 0.000585, RON: 0.00149, HRK: 0.00224, RSD: 3.559, UAH: 1.290, KZK: 14.23, GEL: 0.0915 },
  KRW: { USD: 1318, EUR: 1208, GBP: 1040, JPY: 197500, CHF: 1167, CAD: 1926, AUD: 2110, NZD: 2307, CNY: 9563, INR: 110100, SGD: 1780, HKD: 10300, SEK: 1430, NOK: 14120, DKK: 9040, AED: 4862, SAR: 5022, ZAR: 24300, MXN: 22560, BRL: 6538, RUB: 145600, THB: 52680, MYR: 6283, IDR: 127300, PKR: 2223000, PHP: 41000, VND: 2339000, KRY: 1.0, TWD: 42.0, TRY: 4205, HUF: 25800, PLN: 2840, CZK: 17580, BGN: 1264, RON: 3230, HRK: 4921, RSD: 1458000, UAH: 529200, KZK: 5834000, GEL: 29750 },
  TWD: { USD: 31.37, EUR: 28.77, GBP: 24.76, JPY: 4699, CHF: 27.80, CAD: 45.90, AUD: 50.30, NZD: 55.0, CNY: 227.8, INR: 2623, SGD: 42.39, HKD: 245.5, SEK: 341.0, NOK: 336.5, DKK: 215.8, AED: 115.8, SAR: 119.6, ZAR: 579.5, MXN: 537.5, BRL: 155.8, RUB: 3468, THB: 1255, MYR: 149.7, IDR: 3035, PKR: 53160, PHP: 977, VND: 55850, KRY: 23800, TWD: 1.0, TRY: 100.2, HUF: 614.5, PLN: 67.6, CZK: 418.7, BGN: 30.10, RON: 77.0, HRK: 117.3, RSD: 34720, UAH: 12620, KZK: 139000, GEL: 709.5 },
  TRY: { USD: 31.29, EUR: 28.70, GBP: 24.70, JPY: 4688, CHF: 27.74, CAD: 45.86, AUD: 50.26, NZD: 54.94, CNY: 227.5, INR: 2619, SGD: 42.34, HKD: 245.1, SEK: 340.4, NOK: 335.9, DKK: 215.4, AED: 115.6, SAR: 119.3, ZAR: 578.4, MXN: 536.5, BRL: 155.5, RUB: 3461, THB: 1252, MYR: 149.3, IDR: 3028, PKR: 53040, PHP: 975, VND: 55770, KRY: 23760, TWD: 0.998, TRY: 1.0, HUF: 613.2, PLN: 67.48, CZK: 418.0, BGN: 30.04, RON: 76.85, HRK: 117.1, RSD: 34670, UAH: 12600, KZK: 138700, GEL: 708.5 },
  HUF: { USD: 0.051, EUR: 0.047, GBP: 0.0403, JPY: 7.65, CHF: 0.0453, CAD: 0.0748, AUD: 0.0820, NZD: 0.0897, CNY: 0.371, INR: 4.271, SGD: 0.0691, HKD: 0.400, SEK: 0.555, NOK: 0.548, DKK: 0.351, AED: 0.189, SAR: 0.195, ZAR: 0.944, MXN: 0.876, BRL: 0.254, RUB: 5.65, THB: 2.043, MYR: 0.244, IDR: 4.939, PKR: 86.6, PHP: 16.32, VND: 798, KRY: 365, TWD: 8.16, TRY: 8.18, HUF: 1.0, PLN: 0.110, CZK: 0.681, BGN: 0.049, RON: 0.125, HRK: 0.191, RSD: 565, UAH: 205.6, KZK: 2263, GEL: 14.55 },
  PLN: { USD: 0.466, EUR: 0.427, GBP: 0.367, JPY: 69.9, CHF: 0.413, CAD: 0.683, AUD: 0.749, NZD: 0.818, CNY: 3.377, INR: 38.8, SGD: 0.629, HKD: 3.640, SEK: 5.056, NOK: 4.990, DKK: 3.202, AED: 1.723, SAR: 1.776, ZAR: 8.603, MXN: 8.00, BRL: 2.315, RUB: 51.5, THB: 18.62, MYR: 2.223, IDR: 44.97, PKR: 789, PHP: 148.7, VND: 7273, KRY: 3328, TWD: 74.4, TRY: 74.7, HUF: 91.1, PLN: 1.0, CZK: 6.209, BGN: 0.449, RON: 1.138, HRK: 1.738, RSD: 5147, UAH: 1873, KZK: 20610, GEL: 132.6 },
  CZK: { USD: 0.0751, EUR: 0.0689, GBP: 0.0591, JPY: 11.26, CHF: 0.0666, CAD: 0.110, AUD: 0.121, NZD: 0.132, CNY: 0.544, INR: 6.254, SGD: 0.101, HKD: 0.587, SEK: 0.815, NOK: 0.804, DKK: 0.516, AED: 0.278, SAR: 0.286, ZAR: 1.387, MXN: 1.290, BRL: 0.373, RUB: 8.304, THB: 3.001, MYR: 0.358, IDR: 7.249, PKR: 127.1, PHP: 23.97, VND: 1172, KRY: 537, TWD: 12.00, TRY: 12.05, HUF: 14.68, PLN: 0.161, CZK: 1.0, BGN: 0.0723, RON: 0.183, HRK: 0.280, RSD: 829.5, UAH: 301.5, KZK: 3322, GEL: 21.37 },
  BGN: { USD: 1.038, EUR: 0.951, GBP: 0.818, JPY: 155.8, CHF: 0.921, CAD: 1.520, AUD: 1.673, NZD: 1.834, CNY: 7.523, INR: 86.48, SGD: 1.397, HKD: 8.123, SEK: 11.28, NOK: 11.13, DKK: 7.140, AED: 3.848, SAR: 3.969, ZAR: 19.19, MXN: 17.85, BRL: 5.161, RUB: 114.8, THB: 41.53, MYR: 4.949, IDR: 100300, PKR: 1759, PHP: 331.9, VND: 16210, KRY: 7430, TWD: 165.9, TRY: 166.6, HUF: 203.0, PLN: 22.37, CZK: 138.3, BGN: 1.0, RON: 2.531, HRK: 3.872, RSD: 11480, UAH: 4170, KZK: 45990, GEL: 295.5 },
  RON: { USD: 0.410, EUR: 0.376, GBP: 0.323, JPY: 61.65, CHF: 0.364, CAD: 0.601, AUD: 0.661, NZD: 0.725, CNY: 2.975, INR: 34.20, SGD: 0.552, HKD: 3.212, SEK: 4.463, NOK: 4.401, DKK: 2.822, AED: 1.520, SAR: 1.569, ZAR: 7.588, MXN: 7.055, BRL: 2.041, RUB: 45.40, THB: 16.41, MYR: 1.957, IDR: 39680, PKR: 695.5, PHP: 131.2, VND: 6410, KRY: 2937, TWD: 65.6, TRY: 65.9, HUF: 80.29, PLN: 8.840, CZK: 54.64, BGN: 0.395, RON: 1.0, HRK: 1.530, RSD: 4538, UAH: 1648, KZK: 18200, GEL: 116.8 },
  HRK: { USD: 0.268, EUR: 0.246, GBP: 0.211, JPY: 40.30, CHF: 0.238, CAD: 0.393, AUD: 0.432, NZD: 0.474, CNY: 1.945, INR: 22.36, SGD: 0.361, HKD: 2.099, SEK: 2.918, NOK: 2.877, DKK: 1.845, AED: 0.994, SAR: 1.025, ZAR: 4.960, MXN: 4.612, BRL: 1.334, RUB: 29.66, THB: 10.72, MYR: 1.279, IDR: 25930, PKR: 454.5, PHP: 85.8, VND: 4189, KRY: 1919, TWD: 42.85, TRY: 43.07, HUF: 52.43, PLN: 5.780, CZK: 35.72, BGN: 0.258, RON: 0.653, HRK: 1.0, RSD: 2966, UAH: 1076, KZK: 11890, GEL: 76.35 },
  RSD: { USD: 90.41, EUR: 82.90, GBP: 71.21, JPY: 13600, CHF: 80.30, CAD: 132.6, AUD: 145.4, NZD: 159.9, CNY: 656.5, INR: 7547, SGD: 242.9, HKD: 1414, SEK: 986.0, NOK: 971.8, DKK: 623.0, AED: 336.0, SAR: 346.0, ZAR: 1674, MXN: 1556, BRL: 450, RUB: 1001, THB: 3618, MYR: 431.8, IDR: 875100, PKR: 25300, PHP: 4974, VND: 282000, KRY: 120500, TWD: 2900, TRY: 2920, HUF: 33650, PLN: 3705, CZK: 22960, BGN: 1645, RON: 4201, HRK: 6355, RSD: 1.0, UAH: 362.5, KZK: 4008, GEL: 25780 },
  UAH: { USD: 0.249, EUR: 0.229, GBP: 0.196, JPY: 37.50, CHF: 0.221, CAD: 0.366, AUD: 0.401, NZD: 0.441, CNY: 1.812, INR: 20.82, SGD: 0.336, HKD: 1.960, SEK: 2.722, NOK: 2.682, DKK: 1.719, AED: 0.928, SAR: 0.956, ZAR: 4.627, MXN: 4.298, BRL: 1.242, RUB: 27.62, THB: 9.986, MYR: 1.191, IDR: 24140, PKR: 697.5, PHP: 13.72, VND: 77900, KRY: 33250, TWD: 80.0, TRY: 80.6, HUF: 927.8, PLN: 102.2, CZK: 633, BGN: 45.35, RON: 115.8, HRK: 175.2, RSD: 8920, UAH: 1.0, KZK: 22050, GEL: 710.5 },
  KZK: { USD: 0.0113, EUR: 0.0104, GBP: 0.00888, JPY: 1.701, CHF: 0.0100, CAD: 0.0166, AUD: 0.0182, NZD: 0.0200, CNY: 0.0822, INR: 0.945, SGD: 0.0152, HKD: 0.0889, SEK: 0.1236, NOK: 0.1218, DKK: 0.0780, AED: 0.0421, SAR: 0.0434, ZAR: 0.2103, MXN: 0.1951, BRL: 0.0564, RUB: 1.254, THB: 0.453, MYR: 0.0541, IDR: 1096, PKR: 31.65, PHP: 6.23, VND: 3534, KRY: 1509, TWD: 36.32, TRY: 36.58, HUF: 42.05, PLN: 4.636, CZK: 28.72, BGN: 2.057, RON: 5.251, HRK: 7.951, RSD: 404.5, UAH: 146.8, KZK: 1.0, GEL: 32.25 },
  GEL: { USD: 0.350, EUR: 0.322, GBP: 0.275, JPY: 52.70, CHF: 0.310, CAD: 0.515, AUD: 0.564, NZD: 0.620, CNY: 2.547, INR: 29.27, SGD: 0.471, HKD: 2.755, SEK: 3.833, NOK: 3.778, DKK: 2.418, AED: 1.305, SAR: 1.345, ZAR: 6.517, MXN: 6.049, BRL: 1.748, RUB: 38.86, THB: 14.04, MYR: 1.676, IDR: 33970, PKR: 981.5, PHP: 193.0, VND: 109600, KRY: 46780, TWD: 1126, TRY: 1134, HUF: 1304, PLN: 143.7, CZK: 890, BGN: 63.75, RON: 162.8, HRK: 246.5, RSD: 12540, UAH: 4551, KZK: 50180, GEL: 1.0 },
};

// ============================================================================
// RATE CACHING SYSTEM
// ============================================================================

interface CacheEntry {
  rate: number;
  timestamp: number;
  ttl: number; // Time to live in milliseconds
}

interface FXAnalytics {
  totalConversions: number;
  totalFeesCollected: number;
  conversionsByPair: Record<string, number>;
  conversionsByFee: { withFee: number; noFee: number };
  topCurrencyPairs: Array<{ pair: string; count: number }>;
  lastUpdated: string;
}

// Database-backed caching (using static database)
// These functions now call the FX database module instead of in-memory storage

async function getCachedRate(from: string, to: string): Promise<number | null> {
  try {
    const rate = await FxDb.getFxRate(from, to);
    if (rate) {
      // Check if cache is still valid
      const ageMs = Date.now() - new Date(rate.last_updated_at).getTime();
      const ttlMs = rate.cache_ttl_seconds * 1000;
      if (ageMs < ttlMs) {
        return parseFloat(String(rate.rate)); // Ensure it's a number
      }
    }
    return null;
  } catch (error) {
    console.error(`[FX Cache] Error getting cached rate ${from}/${to}:`, error);
    return null;
  }
}

async function setCachedRate(
  from: string,
  to: string,
  rate: number,
  ttl = 3600000,
): Promise<void> {
  try {
    await FxDb.saveFxRate(from, to, rate, from === to ? 0 : 2);
    await FxDb.saveFxCacheMetadata(from, to, rate, Math.floor(ttl / 1000));
  } catch (error) {
    console.error(`[FX Cache] Error setting cached rate ${from}/${to}:`, error);
  }
}

// Database-backed analytics (using static database)
async function updateAnalytics(
  from: string,
  to: string,
  fee: number,
  fromAmount: number = 0,
  toAmount: number = 0,
): Promise<void> {
  try {
    await FxDb.updateFxAnalytics(from, to, fee, fromAmount, toAmount);
  } catch (error) {
    console.error(`[FX Analytics] Error updating analytics ${from}/${to}:`, error);
  }
}

async function getTopCurrencyPairs(
  limit = 10,
): Promise<Array<{ pair: string; count: number }>> {
  try {
    const pairs = await FxDb.getTopFxPairs(limit);
    return pairs.map((p) => ({
      pair: `${p.from_currency}/${p.to_currency}`,
      count: p.total_conversions,
    }));
  } catch (error) {
    console.error("[FX Analytics] Error getting top pairs:", error);
    return [];
  }
}

const app = express();
app.use(express.json());

const PORT = 3001;

// Middleware: Add realistic delay
app.use((req, res, next) => {
  const delay = Math.random() * 100; // 0-100ms random delay
  setTimeout(next, delay);
});

/**
 * Utility function to convert query param to string safely
 */
function getQueryString(value: any): string {
  if (Array.isArray(value)) return String(value[0]);
  if (typeof value === "string") return value;
  return String(value || "");
}

/**
 * POST /api/wallet/create
 * Create a new wallet or initialize currency for existing wallet
 */
app.post("/api/wallet/create", (req: Request, res: Response) => {
  const { userId, currency = "USD" } = req.body;

  if (!userId) {
    return res.status(400).json({ error: "userId is required" });
  }

  // Ensure currency is a string
  const currencyKey = typeof currency === 'string' ? currency : 'USD';

  try {
    let wallet = wallets.get(userId);

    if (!wallet) {
      wallet = {
        userId,
        balances: new Map(),
        transactions: [],
      };
      wallets.set(userId, wallet);
    }

    // Initialize currency if not exists
    if (!wallet.balances.has(currencyKey)) {
      wallet.balances.set(currencyKey, 0);
    }

    res.status(201).json({
      success: true,
      walletId: `wallet-${userId}`,
      userId,
      currency: currencyKey,
      balance: wallet.balances.get(currencyKey),
      message: `Wallet created/updated for ${currencyKey}`,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

/**
 * POST /api/wallet/topup
 * Add funds to wallet
 */
app.post("/api/wallet/topup", (req: Request, res: Response) => {
  const { userId, currency = "USD", amount, gateway, gatewayReference } =
    req.body;

  if (!userId || !amount) {
    return res
      .status(400)
      .json({ error: "userId and amount are required" });
  }

  // Ensure currency is a string
  const currencyKey = typeof currency === 'string' ? currency : 'USD';

  try {
    let wallet = wallets.get(userId);

    if (!wallet) {
      wallet = {
        userId,
        balances: new Map(),
        transactions: [],
      };
      wallets.set(userId, wallet);
    }

    const currentBalance = wallet.balances.get(currencyKey) || 0;
    const newBalance = currentBalance + amount;

    wallet.balances.set(currencyKey, newBalance);

    const transaction = {
      id: `txn-${Date.now()}`,
      type: "topup",
      amount,
      currency: currencyKey,
      timestamp: new Date().toISOString(),
    };

    wallet.transactions.push(transaction);

    res.json({
      success: true,
      transactionId: transaction.id,
      userId,
      currency: currencyKey,
      amount,
      previousBalance: currentBalance,
      newBalance,
      gateway,
      gatewayReference,
      timestamp: transaction.timestamp,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

/**
 * GET /api/wallet/balance/:userId
 * Get wallet balance for a specific currency
 */
app.get("/api/wallet/balance/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const { currency = "USD" } = req.query;

  const userIdStr = getQueryString(userId);
  const currencyKey = getQueryString(currency);

  try {
    const wallet = wallets.get(userIdStr);

    if (!wallet) {
      return res.json({
        userId: userIdStr,
        currency: currencyKey,
        balance: 0,
        message: "Wallet not found, returning 0 balance",
      });
    }

    const balance = wallet.balances.get(currencyKey) || 0;

    res.json({
      success: true,
      userId: userIdStr,
      currency: currencyKey,
      balance,
      walletId: `wallet-${userIdStr}`,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

/**
 * POST /api/wallet/pay
 * Process payment from wallet
 */
app.post("/api/wallet/pay", (req: Request, res: Response) => {
  const { userId, currency = "USD", amount, bookingId } = req.body;

  if (!userId || !amount) {
    return res
      .status(400)
      .json({ error: "userId and amount are required" });
  }

  // Ensure currency is a string
  const currencyKey = typeof currency === 'string' ? currency : 'USD';

  try {
    const wallet = wallets.get(userId);

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    const currentBalance = wallet.balances.get(currencyKey) || 0;

    if (currentBalance < amount) {
      return res.status(400).json({
        error: "Insufficient balance",
        required: amount,
        available: currentBalance,
      });
    }

    const newBalance = currentBalance - amount;
    wallet.balances.set(currencyKey, newBalance);

    const transaction = {
      id: `txn-${Date.now()}`,
      type: "payment",
      amount,
      currency: currencyKey,
      timestamp: new Date().toISOString(),
    };

    wallet.transactions.push(transaction);

    res.json({
      success: true,
      transactionId: transaction.id,
      userId,
      currency: currencyKey,
      amount,
      previousBalance: currentBalance,
      newBalance,
      bookingId,
      timestamp: transaction.timestamp,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

/**
 * POST /api/wallet/refund
 * Process refund to wallet
 */
app.post("/api/wallet/refund", (req: Request, res: Response) => {
  const { userId, currency = "USD", amount, bookingId, reason } = req.body;

  if (!userId || !amount) {
    return res
      .status(400)
      .json({ error: "userId and amount are required" });
  }

  // Ensure currency is a string
  const currencyKey = typeof currency === 'string' ? currency : 'USD';

  try {
    let wallet = wallets.get(userId);

    if (!wallet) {
      wallet = {
        userId,
        balances: new Map(),
        transactions: [],
      };
      wallets.set(userId, wallet);
    }

    const currentBalance = wallet.balances.get(currencyKey) || 0;
    const newBalance = currentBalance + amount;

    wallet.balances.set(currencyKey, newBalance);

    const transaction = {
      id: `txn-${Date.now()}`,
      type: "refund",
      amount,
      currency: currencyKey,
      timestamp: new Date().toISOString(),
    };

    wallet.transactions.push(transaction);

    res.json({
      success: true,
      transactionId: transaction.id,
      userId,
      currency: currencyKey,
      amount,
      previousBalance: currentBalance,
      newBalance,
      bookingId,
      reason,
      timestamp: transaction.timestamp,
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

/**
 * POST /api/wallet/transfer
 * Transfer funds between wallets
 */
app.post("/api/wallet/transfer", (req: Request, res: Response) => {
  const { fromUserId, toUserId, currency = "USD", amount, fee = 0 } = req.body;

  if (!fromUserId || !toUserId || !amount) {
    return res.status(400).json({
      error: "fromUserId, toUserId, and amount are required",
    });
  }

  // Ensure currency is a string
  const currencyKey = typeof currency === 'string' ? currency : 'USD';

  try {
    let fromWallet = wallets.get(fromUserId);
    let toWallet = wallets.get(toUserId);

    if (!fromWallet) {
      return res.status(404).json({ error: "Source wallet not found" });
    }

    const fromBalance = fromWallet.balances.get(currencyKey) || 0;
    const totalDebit = amount + fee;

    if (fromBalance < totalDebit) {
      return res.status(400).json({
        error: "Insufficient balance",
        required: totalDebit,
        available: fromBalance,
      });
    }

    // Debit from source
    const newFromBalance = fromBalance - totalDebit;
    fromWallet.balances.set(currencyKey, newFromBalance);

    // Credit to destination
    if (!toWallet) {
      toWallet = {
        userId: toUserId,
        balances: new Map(),
        transactions: [],
      };
      wallets.set(toUserId, toWallet);
    }

    const toBalance = toWallet.balances.get(currencyKey) || 0;
    const newToBalance = toBalance + amount;
    toWallet.balances.set(currencyKey, newToBalance);

    // Record transactions
    const txnId = `txn-${Date.now()}`;

    fromWallet.transactions.push({
      id: txnId,
      type: "transfer_out",
      amount: totalDebit,
      currency: currencyKey,
      timestamp: new Date().toISOString(),
    });

    toWallet.transactions.push({
      id: txnId,
      type: "transfer_in",
      amount,
      currency: currencyKey,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      transactionId: txnId,
      from: {
        userId: fromUserId,
        previousBalance: fromBalance,
        newBalance: newFromBalance,
      },
      to: {
        userId: toUserId,
        previousBalance: toBalance,
        newBalance: newToBalance,
      },
      amount,
      fee,
      currency: currencyKey,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

/**
 * GET /api/wallet/transactions/:userId
 * Get transaction history
 */
app.get("/api/wallet/transactions/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const userIdStr = Array.isArray(userId) ? (userId as string[])[0] : (userId as string);
  const { limit = 100 } = req.query;
  
  // Handle case where limit might be an array (e.g., from query params)
  const limitStr = Array.isArray(limit) ? limit[0] : limit;
  
  // Ensure limitStr is a string for parseInt compatibility
  const limitKey = typeof limitStr === 'string' ? limitStr : '100';

  try {
    const wallet = wallets.get(userIdStr);

    if (!wallet) {
      return res.json({
        userId: userIdStr,
        transactions: [],
        message: "Wallet not found",
      });
    }

    const transactions = wallet.transactions.slice(
      0,
      parseInt(limitKey)
    );

    res.json({
      success: true,
      userId,
      transactionCount: transactions.length,
      transactions,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

/**
 * GET /api/wallet/balances/:userId
 * Get all currency balances for a wallet
 */
app.get("/api/wallet/balances/:userId", (req: Request, res: Response) => {
  const { userId } = req.params;
  const userIdStr = Array.isArray(userId) ? (userId as string[])[0] : (userId as string);

  try {
    const wallet = wallets.get(userIdStr);

    if (!wallet) {
      return res.json({
        userId: userIdStr,
        balances: {},
        message: "Wallet not found",
      });
    }

    const balances: Record<string, number> = {};
    wallet.balances.forEach((balance, currency) => {
      balances[currency] = balance;
    });

    res.json({
      success: true,
      userId,
      balances,
      currencyCount: wallet.balances.size,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

/**
 * POST /api/wallet/debit
 * Debit (reduce) wallet balance for customer purchases
 */
app.post("/api/wallet/debit", (req: Request, res: Response) => {
  const { userId, currency = "USD", amount, transactionId, description } =
    req.body;

  if (!userId || !amount) {
    return res.status(400).json({
      error: "userId and amount are required",
    });
  }

  // Ensure currency is a string
  const currencyKey = typeof currency === 'string' ? currency : 'USD';

  try {
    let wallet = wallets.get(userId);

    if (!wallet) {
      return res.status(404).json({ error: "Wallet not found" });
    }

    const balance = wallet.balances.get(currencyKey) || 0;

    if (balance < amount) {
      return res.status(400).json({
        error: "Insufficient balance",
        required: amount,
        available: balance,
      });
    }

    // Debit the wallet
    const newBalance = balance - amount;
    wallet.balances.set(currencyKey, newBalance);

    // Record transaction
    const txnId = transactionId || `debit-${Date.now()}`;
    wallet.transactions.push({
      id: txnId,
      type: "debit",
      amount,
      currency: currencyKey,
      description: description || "Customer purchase",
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      userId,
      transactionId: txnId,
      currency: currencyKey,
      debitAmount: amount,
      newBalance,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

/**
 * POST /api/wallet/credit
 * Credit (increase) wallet balance for supplier payments
 */
app.post("/api/wallet/credit", (req: Request, res: Response) => {
  const {
    userId,
    currency = "USD",
    amount,
    transactionId,
    description,
    sourceUserId,
  } = req.body;

  if (!userId || !amount) {
    return res.status(400).json({
      error: "userId and amount are required",
    });
  }

  // Ensure currency is a string
  const currencyKey = typeof currency === 'string' ? currency : 'USD';

  try {
    let wallet = wallets.get(userId);

    if (!wallet) {
      wallet = {
        userId,
        balances: new Map(),
        transactions: [],
      };
      wallets.set(userId, wallet);
    }

    // Credit the wallet
    const balance = wallet.balances.get(currencyKey) || 0;
    const newBalance = balance + amount;
    wallet.balances.set(currencyKey, newBalance);

    // Record transaction
    const txnId = transactionId || `credit-${Date.now()}`;
    wallet.transactions.push({
      id: txnId,
      type: "credit",
      amount,
      currency: currencyKey,
      description: description || "Supplier payment received",
      sourceUserId: sourceUserId || "system",
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      userId,
      transactionId: txnId,
      currency: currencyKey,
      creditAmount: amount,
      newBalance,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

/**
 * POST /api/wallet/settlement
 * Supplier settlement flow: Agency settles payment with Supplier
 * Deducts commission and credits supplier wallet
 */
app.post("/api/wallet/settlement", (req: Request, res: Response) => {
  const {
    supplierId,
    agencyId,
    settlementAmount,
    currency,
    invoiceId,
    deductedCommission,
    idempotencyKey,
  } = req.body;

  // Validate request
  if (
    !supplierId ||
    !agencyId ||
    settlementAmount === undefined ||
    !currency ||
    !invoiceId
  ) {
    return res.status(400).json({
      success: false,
      error:
        "supplierId, agencyId, settlementAmount, currency, and invoiceId are required",
    });
  }

  try {
    // Get agency wallet
    let agencyWallet = wallets.get(agencyId);
    if (!agencyWallet) {
      agencyWallet = {
        userId: agencyId,
        balances: new Map(),
        transactions: [],
      };
      wallets.set(agencyId, agencyWallet);
    }

    // Get supplier wallet
    let supplierWallet = wallets.get(supplierId);
    if (!supplierWallet) {
      supplierWallet = {
        userId: supplierId,
        balances: new Map(),
        transactions: [],
      };
      wallets.set(supplierId, supplierWallet);
    }

    const currencyKey = typeof currency === "string" ? currency : "USD";
    const totalDebit =
      Number(settlementAmount) + Number(deductedCommission || 0);
    const agencyBalance = agencyWallet.balances.get(currencyKey) || 0;

    // Verify agency has sufficient balance
    if (agencyBalance < totalDebit) {
      return res.status(400).json({
        success: false,
        error: `Insufficient funds: agency balance ${agencyBalance}, required ${totalDebit}`,
      });
    }

    // Debit agency
    const newAgencyBalance = agencyBalance - totalDebit;
    agencyWallet.balances.set(currencyKey, newAgencyBalance);

    // Credit supplier
    const supplierBalance = supplierWallet.balances.get(currencyKey) || 0;
    const newSupplierBalance = supplierBalance + Number(settlementAmount);
    supplierWallet.balances.set(currencyKey, newSupplierBalance);

    // Record agency debit transaction
    const agencyTxnId = `settlement-debit-${Date.now()}`;
    agencyWallet.transactions.push({
      id: agencyTxnId,
      type: "settlement",
      amount: totalDebit,
      currency: currencyKey,
      description: `Supplier settlement to ${supplierId}: ${settlementAmount} ${currencyKey} - ${deductedCommission || 0} commission`,
      sourceUserId: agencyId,
      timestamp: new Date().toISOString(),
    });

    // Record supplier credit transaction
    const supplierTxnId = `settlement-credit-${Date.now()}`;
    supplierWallet.transactions.push({
      id: supplierTxnId,
      type: "settlement",
      amount: Number(settlementAmount),
      currency: currencyKey,
      description: `Settlement from agency ${agencyId}: ${settlementAmount} ${currencyKey}`,
      sourceUserId: agencyId,
      timestamp: new Date().toISOString(),
    });

    res.json({
      success: true,
      transaction: {
        id: supplierTxnId,
        type: "supplier_settlement",
        flow: "agency_to_supplier",
        amount: Number(settlementAmount),
        currency: currencyKey,
        status: "completed",
        invoiceId,
        createdAt: new Date().toISOString(),
      },
      summary: {
        agencyDebited: totalDebit,
        supplierCredited: Number(settlementAmount),
        commissionDeducted: Number(deductedCommission || 0),
        net: Number(settlementAmount),
        agencyNewBalance: newAgencyBalance,
        supplierNewBalance: newSupplierBalance,
      },
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

/**
 * POST /api/notifications/email
 * Track email notifications for audit trail
 */
app.post("/api/notifications/email", (req: Request, res: Response) => {
  const { transactionId, recipientEmail, recipientType, notificationType } =
    req.body;

  if (!transactionId || !recipientEmail) {
    return res.status(400).json({
      error: "transactionId and recipientEmail are required",
    });
  }

  try {
    // In a real system, this would send an actual email
    // For testing, we just track the notification
    const notification = {
      notificationId: `email-${Date.now()}`,
      transactionId,
      recipientEmail,
      recipientType: recipientType || "customer", // customer or supplier
      notificationType: notificationType || "transaction_receipt",
      status: "sent",
      sentAt: new Date().toISOString(),
    };

    res.json({
      success: true,
      notification,
      message: `Email notification recorded for ${recipientEmail}`,
      timestamp: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({ error: String(error) });
  }
});

// ============================================================================
// FX Conversion Endpoints (For Booking Orchestrator Testing)
// ============================================================================

/**
 * GET /api/fx/health
 * Check FX service availability
 */
app.get("/api/fx/health", async (req: Request, res: Response) => {
  try {
    const supportedCurrencies = Object.keys(FX_RATES);
    const cacheStats = await FxDb.getFxCacheStats();
    const analyticsSummary = await FxDb.getFxAnalyticsSummary();

    res.json({
      status: "healthy",
      service: "Mock FX API (Database-Backed)",
      baseCurrency: "USD",
      currencyCount: supportedCurrencies.length,
      supportedCurrencies: supportedCurrencies.sort(),
      cacheSize: cacheStats?.active_cached || 0,
      cacheHitRate: cacheStats?.total_hits && cacheStats?.total_misses 
        ? `${(cacheStats.total_hits / (cacheStats.total_hits + cacheStats.total_misses) * 100).toFixed(2)}%`
        : "N/A",
      analytics: {
        totalConversions: analyticsSummary?.total_conversions || 0,
        totalFeesCollected: analyticsSummary?.total_fees_collected || 0,
      },
      database: "PostgreSQL (Static DB)",
      fetchedAt: new Date().toISOString(),
      isStale: false,
    });
  } catch (error) {
    res.status(500).json({
      status: "error",
      message: "Failed to get health status",
      error: String(error),
    });
  }
});

/**
 * GET /api/fx/rates
 * Get all available FX rates
 */
app.get("/api/fx/rates", (req: Request, res: Response) => {
  res.json({
    success: true,
    rates: FX_RATES.USD,
    baseCurrency: "USD",
    fetchedAt: new Date().toISOString(),
  });
});

/**
 * GET /api/fx/rate/:from/:to
 * Get rate for specific currency pair (with caching)
 */
app.get("/api/fx/rate/:from/:to", async (req: Request, res: Response) => {
  const { from, to } = req.params;
  const fromStr = Array.isArray(from) ? (from as string[])[0] : (from as string);
  const toStr = Array.isArray(to) ? (to as string[])[0] : (to as string);
  const fromUpper = fromStr.toUpperCase();
  const toUpper = toStr.toUpperCase();

  // Check cache first
  const cachedRate = await getCachedRate(fromUpper, toUpper);
  if (cachedRate !== null) {
    return res.json({
      success: true,
      fromCurrency: fromUpper,
      toCurrency: toUpper,
      rate: Number(cachedRate), // Ensure it's a number
      feePercentage: fromUpper === toUpper ? 0 : 2,
      feeNote: fromUpper === toUpper ? "No fee for same currency" : "2% FX fee applied for cross-currency conversions",
      cached: true,
      cacheAge: "seconds",
      source: "Database Cache",
    });
  }

  if (!FX_RATES[fromUpper] || !FX_RATES[fromUpper][toUpper]) {
    return res.status(400).json({
      error: `No rate available for ${fromUpper}/${toUpper}`,
    });
  }

  const rate = Number(FX_RATES[fromUpper][toUpper]); // Ensure it's a number
  
  // Cache the rate in static database
  await setCachedRate(fromUpper, toUpper, rate);

  res.json({
    success: true,
    fromCurrency: fromUpper,
    toCurrency: toUpper,
    rate: rate,
    feePercentage: fromUpper === toUpper ? 0 : 2,
    feeNote: fromUpper === toUpper ? "No fee for same currency" : "2% FX fee applied for cross-currency conversions",
    cached: false,
    source: "FX_RATES (Fresh Fetch)",
  });
});

/**
 * POST /api/fx/convert
 * Convert amount between currencies (without fee)
 */
app.post("/api/fx/convert", (req: Request, res: Response) => {
  const { amount, fromCurrency, toCurrency } = req.body;

  if (!amount || !fromCurrency || !toCurrency) {
    return res.status(400).json({
      error: "amount, fromCurrency, and toCurrency are required",
    });
  }

  const from = fromCurrency.toUpperCase();
  const to = toCurrency.toUpperCase();

  if (!FX_RATES[from] || !FX_RATES[from][to]) {
    return res.status(400).json({
      error: `No rate available for ${from}/${to}`,
    });
  }

  const rate = FX_RATES[from][to];
  const converted = amount * rate;

  res.json({
    success: true,
    original: {
      amount,
      currency: from,
    },
    converted: {
      amount: parseFloat(converted.toFixed(2)),
      currency: to,
    },
    fxRate: rate,
    fxFee: 0,
    totalDebit: parseFloat(converted.toFixed(2)),
    rateInfo: {
      baseCurrency: "USD",
      baseAmount: amount,
      fetchedAt: new Date().toISOString(),
      isStale: false,
    },
  });
});

/**
 * POST /api/fx/convert-with-fee
 * Convert amount between currencies (with 2% fee for cross-currency) + analytics
 */
app.post("/api/fx/convert-with-fee", async (req: Request, res: Response) => {
  try {
    const { amount, fromCurrency, toCurrency, applyFee = true } = req.body;

    if (!amount || !fromCurrency || !toCurrency) {
      return res.status(400).json({
        error: "amount, fromCurrency, and toCurrency are required",
      });
    }

    const from = fromCurrency.toUpperCase();
    const to = toCurrency.toUpperCase();

    if (!FX_RATES[from] || !FX_RATES[from][to]) {
      return res.status(400).json({
        error: `No rate available for ${from}/${to}`,
      });
    }

    const rate = FX_RATES[from][to];
    const converted = amount * rate;
    const isSameCurrency = from === to;
    const fxFee = applyFee && !isSameCurrency ? converted * 0.02 : 0;
    const totalDebit = converted + fxFee;

    // Update analytics in database
    await updateAnalytics(from, to, fxFee, amount, converted);

    // Log conversion to database
    await FxDb.logFxConversion({
      from_currency: from,
      to_currency: to,
      from_amount: amount,
      to_amount: converted,
      fx_rate_used: rate,
      fx_fee_amount: fxFee,
      fx_fee_percentage: isSameCurrency ? 0 : 2,
      total_debit: totalDebit,
      conversion_type: "booking",
    });

    // Get updated analytics summary
    const summary = await FxDb.getFxAnalyticsSummary();

    res.json({
      success: true,
      original: {
        amount,
        currency: from,
      },
      converted: {
        amount: parseFloat(converted.toFixed(2)),
        currency: to,
      },
      breakdown: {
        baseAmount: amount,
        fxRate: rate,
        convertedAmount: parseFloat(converted.toFixed(2)),
        fxFee: parseFloat(fxFee.toFixed(2)),
        fxFeePercentage: isSameCurrency ? 0 : 2,
        totalDebit: parseFloat(totalDebit.toFixed(2)),
      },
      rateInfo: {
        baseCurrency: "USD",
        baseAmount: amount,
        fetchedAt: new Date().toISOString(),
        isStale: false,
      },
      analytics: {
        totalConversions: summary?.total_conversions || 0,
        totalFeesCollected: summary?.total_fees_collected || 0,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Conversion failed",
      message: String(error),
    });
  }
});

/**
 * GET /api/fx/analytics/summary
 * Get FX conversion analytics summary
 */
app.get("/api/fx/analytics/summary", async (req: Request, res: Response) => {
  try {
    const summary = await FxDb.getFxAnalyticsSummary();
    const topPairs = await getTopCurrencyPairs(5);

    res.json({
      success: true,
      analytics: {
        totalConversions: summary?.total_conversions || 0,
        totalFeesCollected: summary?.total_fees_collected || 0,
        averageFeePerConversion: summary?.total_conversions && summary?.total_conversions > 0 
          ? parseFloat((summary.total_fees_collected / summary.total_conversions).toFixed(2))
          : 0,
        conversionsByFee: {
          withFee: 0,
          noFee: 0,
        },
        topCurrencyPairs: topPairs,
        uniqueCurrencyPairs: (await FxDb.getFxAnalytics()).length,
        lastUpdated: new Date().toISOString(),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get analytics summary",
      message: String(error),
    });
  }
});

/**
 * GET /api/fx/analytics/daily
 * Get daily FX conversion metrics
 */
app.get("/api/fx/analytics/daily", async (req: Request, res: Response) => {
  try {
    const today = new Date().toISOString().split("T")[0];
    const dailyStats = await FxDb.getDailyFxAnalytics(
      new Date(today),
      new Date(today),
    );
    const topPairs = await getTopCurrencyPairs(3);

    res.json({
      success: true,
      date: today,
      metrics: {
        conversions: dailyStats.reduce((sum: number, s: any) => sum + s.total_conversions, 0),
        feesCollected: dailyStats.reduce((sum: number, s: any) => sum + s.total_fees_collected, 0),
        crossCurrencyConversions: dailyStats.length,
        sameCurrencyConversions: 0,
        topPairs,
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get daily analytics",
      message: String(error),
    });
  }
});

/**
 * GET /api/fx/analytics/by-pair
 * Get analytics metrics per currency pair
 */
app.get("/api/fx/analytics/by-pair", async (req: Request, res: Response) => {
  try {
    const analytics = await FxDb.getFxAnalytics();
    const pairs = analytics.map((a: any) => ({
      pair: a.pair,
      from: a.from_currency,
      to: a.to_currency,
      conversions: a.total_conversions,
      volumeFrom: a.total_volume_from,
      volumeTo: a.total_volume_to,
      feesCollected: a.total_fees_collected,
      averageRate: a.average_rate,
      averageFeePercentage: a.from_currency === a.to_currency ? 0 : 2,
    }))
    .sort((a: any, b: any) => b.conversions - a.conversions);

    res.json({
      success: true,
      totalPairs: pairs.length,
      pairs,
      lastUpdated: new Date().toISOString(),
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get by-pair analytics",
      message: String(error),
    });
  }
});

/**
 * GET /api/fx/cache/stats
 * Get cache statistics
 */
app.get("/api/fx/cache/stats", async (req: Request, res: Response) => {
  try {
    const cacheMetadata = await FxDb.queryFxCacheMetadata();
    const cacheStats = await FxDb.getFxCacheStats();

    res.json({
      success: true,
      cacheStats: {
        totalCached: cacheStats?.total_cached || 0,
        activeCached: cacheStats?.active_cached || 0,
        expiredCached: cacheStats?.expired_cached || 0,
        entries: cacheMetadata.slice(0, 20),
      },
    });
  } catch (error) {
    res.status(500).json({
      success: false,
      error: "Failed to get cache stats",
      message: String(error),
    });
  }
});

/**
 * Health check endpoint
 */
app.get("/api/wallet/health", (req: Request, res: Response) => {
  res.json({
    status: "healthy",
    service: "Mock Wallet API",
    timestamp: new Date().toISOString(),
    walletsCount: wallets.size,
  });
});

/**
 * Reset all data (useful for testing)
 */
app.post("/api/wallet/reset", (req: Request, res: Response) => {
  wallets.clear();
  res.json({
    success: true,
    message: "All wallet data reset",
    timestamp: new Date().toISOString(),
  });
});

// Error handling
app.use((err: any, req: Request, res: Response, next: any) => {
  console.error("Error:", err);
  res.status(500).json({ error: "Internal server error" });
});

// Start server with database initialization
async function startServer() {
  try {
    // Initialize database connection
    FxDb.initializeFxDatabase();
    const dbHealth = await FxDb.checkFxDatabaseHealth();
    
    app.listen(PORT, () => {
      console.log("\n╔════════════════════════════════════════════════════════════╗");
      console.log("║ Mock Wallet API Server Running                             ║");
      console.log("╠════════════════════════════════════════════════════════════╣");
      console.log(`║ 🚀 Server: http://localhost:${PORT}/api/wallet`);
      console.log(`║ 📊 Health: http://localhost:${PORT}/api/wallet/health`);
      console.log(`║ 🔄 Reset:  POST http://localhost:${PORT}/api/wallet/reset`);
      console.log("╠════════════════════════════════════════════════════════════╣");
      console.log(`║ 💾 Database: ${dbHealth.status === 'healthy' ? '✅ Connected to Static DB' : '❌ Database error'}`);
      console.log(`║    Tables: ${dbHealth.tables.join(', ')}`);
      console.log("║ Wallet Endpoints:                                          ║");
      console.log("║   POST   /api/wallet/create         - Create wallet        ║");
      console.log("║   POST   /api/wallet/topup          - Add funds            ║");
      console.log("║   GET    /api/wallet/balance/:id    - Get balance          ║");
      console.log("║   GET    /api/wallet/balances/:id   - Get all balances     ║");
      console.log("║   POST   /api/wallet/pay            - Process payment      ║");
      console.log("║   POST   /api/wallet/refund         - Process refund       ║");
      console.log("║   POST   /api/wallet/transfer       - Transfer funds       ║");
      console.log("║   POST   /api/wallet/debit          - Debit wallet         ║");
      console.log("║   POST   /api/wallet/credit         - Credit wallet        ║");
      console.log("║   GET    /api/wallet/transactions   - Get history          ║");
      console.log("║   POST   /api/notifications/email   - Send email notif     ║");
      console.log("║   GET    /api/wallet/health         - Health check         ║");
      console.log("║   POST   /api/wallet/reset          - Clear all data       ║");
      console.log("║                                                            ║");
      console.log("║ FX Endpoints (database-backed):                            ║");
      console.log("║   GET    /api/fx/health             - FX service health    ║");
      console.log("║   GET    /api/fx/rates              - All FX rates         ║");
      console.log("║   GET    /api/fx/rate/:from/:to     - Single rate pair     ║");
      console.log("║   POST   /api/fx/convert            - Convert (no fee)     ║");
      console.log("║   POST   /api/fx/convert-with-fee   - Convert (with fee)   ║");
      console.log("║   GET    /api/fx/analytics/summary  - Analytics summary    ║");
      console.log("║   GET    /api/fx/analytics/daily    - Daily analytics      ║");
      console.log("║   GET    /api/fx/analytics/by-pair  - Per-pair analytics   ║");
      console.log("║   GET    /api/fx/cache/stats        - Cache statistics     ║");
      console.log("╚════════════════════════════════════════════════════════════╝\n");
    });
  } catch (error) {
    console.error("❌ Failed to initialize server:", error);
    process.exit(1);
  }
}

// Handle shutdown gracefully
process.on("SIGINT", async () => {
  console.log("\n✓ Shutting down Mock Wallet API server...");
  await FxDb.closeFxDatabase();
  console.log("✓ Database connection closed");
  process.exit(0);
});

startServer();
