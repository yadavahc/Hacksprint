// Minimal types for Paytm's official checksum library (https://github.com/paytm/Paytm_Node_Checksum).
declare module "paytmchecksum" {
  export default class PaytmChecksum {
    /** Signs a request body (JSON string for JSON APIs) with the merchant key. */
    static generateSignature(params: Record<string, string> | string, key: string): Promise<string>;
    static verifySignature(params: Record<string, string> | string, key: string, checksum: string): Promise<boolean> | boolean;
  }
}
