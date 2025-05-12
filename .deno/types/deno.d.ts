// Type definitions for Deno APIs
declare namespace Deno {
  export interface Env {
    get(key: string): string | undefined;
    set(key: string, value: string): void;
    toObject(): { [key: string]: string };
  }

  export const env: Env;
}

// Allow URL imports in TypeScript
declare module "https://deno.land/std@0.168.0/http/server.ts" {
  export function serve(handler: (req: Request) => Response | Promise<Response>): void;
}

declare module "npm:@supabase/supabase-js@2.39.8" {
  export * from "@supabase/supabase-js";
}

declare module "npm:emailjs@4.0.3" {
  export class SMTPClient {
    constructor(config: {
      user: string;
      password: string;
      host: string;
      port?: number;
      ssl?: boolean;
    });
    
    send(message: {
      text: string;
      from: string;
      to: string;
      subject: string;
      attachment?: Array<{
        data: string;
        alternative: boolean;
      }>;
    }): Promise<any>;
  }
}
