export interface Stocking {
  cageId: number;
  cageName?: string;
  species: string;
  qty: number;
  date: string;
  stockedQty: number;
  fishCount: any;
}                                                                                     
export interface EditableStocking {
  cageId: number;
  cageName: string;
  species: string;
  qty: number | null;
}
