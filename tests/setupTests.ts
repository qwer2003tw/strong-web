jest.mock("@/lib/supabaseServer", () => ({
  createServerSupabaseClient: jest.fn(async () => ({})),
  createSupabaseRouteHandlerClient: jest.fn(async () => ({})),
}));

if (typeof globalThis.Node === "undefined") {
  const doc = globalThis.document as unknown as
    | { defaultView?: { Node?: typeof globalThis.Node } }
    | undefined;
  const nodeCtor = doc?.defaultView?.Node;

  if (nodeCtor) {
    globalThis.Node = nodeCtor;
  } else {
    class NodePolyfill {}
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    globalThis.Node = NodePolyfill as any;
  }
}

// eslint-disable-next-line @typescript-eslint/no-var-requires
require("@testing-library/jest-dom");

export {};

if (typeof globalThis.Request === "undefined") {
  class TestRequest {
    private readonly body: unknown;

    constructor(_url: string, init?: RequestInit) {
      this.body = init?.body ? JSON.parse(init.body as string) : undefined;
    }

    async json() {
      return this.body;
    }
  }

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  globalThis.Request = TestRequest as any;
}
