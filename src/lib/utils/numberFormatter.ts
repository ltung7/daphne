export const formatCurrency = (value: number, currency: string = 'PLN', locale: string = 'pl') => {
    const formatter = new Intl.NumberFormat(locale, { style: 'currency', currency });
    return formatter.format(value);
}