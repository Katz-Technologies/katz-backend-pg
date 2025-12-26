export interface IPriceData {
  [vsCurrency: string]: number | null | undefined;
}

export interface IPriceResponse {
  [coinId: string]: IPriceData;
}
