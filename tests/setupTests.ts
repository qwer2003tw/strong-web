import "@testing-library/jest-dom";

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
