export interface IGetToken {
  asset: string;
  issuer: string;
  include_sources?: boolean;
  include_changes?: boolean;
}
