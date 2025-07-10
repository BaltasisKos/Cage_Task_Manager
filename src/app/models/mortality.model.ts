export interface MortalityEntry {
  cageId?: number;
  cageName?: string; 
  species?: string;
  qty?: number ;
  mortality?: number;
  stockedQty?: number;
  // date: string;
  // entries: number;
}

export interface Mortality {

  date: string;
  entries: MortalityEntry[];  // entries is an array, not a number
}