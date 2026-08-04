declare module "mammoth" {
  export interface MammothResult {
    value: string;
    messages: Array<{ type: string; message: string }>;
  }

  export function convertToHtml(
    input: { arrayBuffer: ArrayBuffer },
    options?: Record<string, unknown>,
  ): Promise<MammothResult>;

  export function extractRawText(
    input: { arrayBuffer: ArrayBuffer },
    options?: Record<string, unknown>,
  ): Promise<{ value: string; messages: Array<{ type: string; message: string }> }>;
}
