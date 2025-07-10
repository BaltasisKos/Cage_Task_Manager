export interface Fish {
  cageId: number;
  cageName?: string;
  species: string;
  qty: number | null;
  mortality?: number | null;
  reamaining?: number;
  date?: Date;
}
