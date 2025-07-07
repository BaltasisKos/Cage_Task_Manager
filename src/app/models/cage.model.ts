export interface Cage {
  id: number;
  name: string;
  status: 'Empty' | 'Stocked';
  species?: string;
  qty?: number;

}