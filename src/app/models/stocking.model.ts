export interface Stocking {
  id: number;
  cageId: number;
  date: string;   // ISO date string like '2025-07-03'
  fishCount: number;
}