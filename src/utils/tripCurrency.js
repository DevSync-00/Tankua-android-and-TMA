export const getTripCurrency = (currency) => currency === 'USD' ? 'USD' : 'ETB';

export const formatTripPrice = (amount, currency) => {
  const code = getTripCurrency(currency);
  const formatted = Number(amount).toLocaleString(undefined, {
    minimumFractionDigits: code === 'USD' ? 2 : 0,
    maximumFractionDigits: 2,
  });
  return `${code} ${formatted}`;
};

export const calculatePriceWithFees = (basePrice, currency) => {
  const isUSD = currency === 'USD';
  const minorUnits = Math.round(basePrice * 100);
  const fee = isUSD ? Math.round(minorUnits * 5 / 100) / 100 : Math.round(basePrice * 0.05);

  return {
    basePrice: isUSD ? minorUnits / 100 : basePrice,
    serviceFee: fee,
    providerFee: fee,
    total: isUSD ? (minorUnits + Math.round(fee * 100)) / 100 : basePrice + fee,
  };
};
