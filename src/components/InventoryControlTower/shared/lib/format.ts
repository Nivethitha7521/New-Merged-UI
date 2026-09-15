import { formatCurrency } from '@/utilities/formatters';
export const money=(v:number)=>formatCurrency(v);
export const number=(v:number)=>new Intl.NumberFormat("en-IN").format(v);
export const cn=(...v:(string|false|undefined)[])=>v.filter(Boolean).join(" ");
