import { describe, it, expect } from "bun:test";
import { CORSPreflight, CORSResponse } from "../../middlewares/cors";
import { getInstance } from "../testing";

const { server, bunsai } = getInstance({
  dir: "./pages",
  dev: false,
  staticFiles: [".html"],
});

describe("CORS Middleware", () => {
  describe("Preflight", () => {
    describe("should block invalid request", () => {
      it("using string origin", async () => {
        const { remove } = CORSPreflight.inject(bunsai.middlewares, {
          origin: "https://test.bun",
        });

        const response = await server.fetch(
          new Request("https://bun.test/html", {
            method: "OPTIONS",
            headers: { origin: "https://bun.test" },
          })
        );

        try {
          expect(response.status).toBe(403);
        } finally {
          remove();
        }
      });

      it("using RegExp origin", async () => {
        const { remove } = CORSPreflight.inject(bunsai.middlewares, {
          origin: /\.example2\.com$/,
        });

        const response = await server.fetch(
          new Request("https://bun.test/html", {
            method: "OPTIONS",
            headers: { origin: "https://bun.test" },
          })
        );

        try {
          expect(response.status).toBe(403);
        } finally {
          remove();
        }
      });

      it("using string[] origin", async () => {
        const { remove } = CORSPreflight.inject(bunsai.middlewares, {
          origin: ["http://test.s"],
        });

        const response = await server.fetch(
          new Request("https://bun.test/html", {
            method: "OPTIONS",
            headers: { origin: "https://bun.test" },
          })
        );

        try {
          expect(response.status).toBe(403);
        } finally {
          remove();
        }
      });

      it("using RegExp[] origin", async () => {
        const { remove } = CORSPreflight.inject(bunsai.middlewares, {
          origin: [/\.example2\.com$/],
        });

        const response = await server.fetch(
          new Request("https://bun.test/html", {
            method: "OPTIONS",
            headers: { origin: "https://bun.test" },
          })
        );

        try {
          expect(response.status).toBe(403);
        } finally {
          remove();
        }
      });

      it("using function origin", async () => {
        const { remove } = CORSPreflight.inject(bunsai.middlewares, {
          origin: () => false,
        });

        const response = await server.fetch(
          new Request("https://bun.test/html", {
            method: "OPTIONS",
            headers: { origin: "https://bun.test" },
          })
        );

        try {
          expect(response.status).toBe(403);
        } finally {
          remove();
        }
      });
    });

    describe("should allow valid request", () => {
      it("using string origin", async () => {
        const { remove } = CORSPreflight.inject(bunsai.middlewares, {
          origin: "https://bun.test",
        });

        const response = await server.fetch(
          new Request("https://bun.test/html", {
            method: "OPTIONS",
            headers: { origin: "https://bun.test" },
          })
        );

        try {
          expect(response.status).toBe(204);
        } finally {
          remove();
        }
      });

      it("using RegExp origin", async () => {
        const { remove } = CORSPreflight.inject(bunsai.middlewares, {
          origin: /bun\.test$/,
        });

        const response = await server.fetch(
          new Request("https://bun.test/html", {
            method: "OPTIONS",
            headers: { origin: "https://bun.test" },
          })
        );

        try {
          expect(response.status).toBe(204);
        } finally {
          remove();
        }
      });

      it("using string[] origin", async () => {
        const { remove } = CORSPreflight.inject(bunsai.middlewares, {
          origin: ["https://bun.test"],
        });

        const response = await server.fetch(
          new Request("https://bun.test/html", {
            method: "OPTIONS",
            headers: { origin: "https://bun.test" },
          })
        );

        try {
          expect(response.status).toBe(204);
        } finally {
          remove();
        }
      });

      it("using RegExp[] origin", async () => {
        const { remove } = CORSPreflight.inject(bunsai.middlewares, {
          origin: [/bun\.test$/],
        });

        const response = await server.fetch(
          new Request("https://bun.test/html", {
            method: "OPTIONS",
            headers: { origin: "https://bun.test" },
          })
        );

        try {
          expect(response.status).toBe(204);
        } finally {
          remove();
        }
      });

      it("using function origin", async () => {
        const { remove } = CORSPreflight.inject(bunsai.middlewares, {
          origin: () => "https://bun.test",
        });

        const response = await server.fetch(
          new Request("https://bun.test/html", {
            method: "OPTIONS",
            headers: { origin: "https://bun.test" },
          })
        );

        try {
          expect(response.status).toBe(204);
        } finally {
          remove();
        }
      });
    });

    it("should return all headers correctly", async () => {
      const { remove } = CORSPreflight.inject(bunsai.middlewares, {
        origin: "https://bun.test",
        credentials: true,
        exposedHeaders: ["X-A", "X-B"],
        methods: ["PUT", "DELETE"],
        maxAge: 2,
        optionsSuccessStatus: 418,
      });

      const response = await server.fetch(
        new Request("https://bun.test/html", {
          method: "OPTIONS",
          headers: {
            origin: "https://bun.test",
            "Access-Control-Request-Headers": "X-C",
          },
        })
      );

      try {
        expect(response.status).toBe(418);

        expect(response.headers.toJSON()).toMatchObject({
          "access-control-allow-credentials": "true",
          "access-control-allow-headers": "X-C",
          "access-control-allow-methods": "PUT,DELETE",
          "access-control-allow-origin": "https://bun.test",
          "access-control-expose-headers": "X-A,X-B",
          "access-control-max-age": "2",
        });
      } finally {
        remove();
      }
    });

    it("should continue", async () => {
      const { remove } = CORSPreflight.inject(bunsai.middlewares, {
        preflightContinue: true,
      });

      const response = await server.fetch(
        new Request("https://bun.test/html", {
          method: "OPTIONS",
          headers: {
            origin: "https://bun.test",
          },
        })
      );

      try {
        expect(response.status).toBe(405); // loader blocks non GET requests
      } finally {
        remove();
      }
    });
  });

  describe("Response", () => {
    describe("should block invalid request", () => {
      it("using string origin", async () => {
        const { remove } = CORSResponse.inject(bunsai.middlewares, {
          origin: "https://test.bun",
        });

        const response = await server.fetch(
          new Request("https://bun.test/html", {
            headers: { origin: "https://bun.test" },
          })
        );

        try {
          expect(response.status).toBe(403);
        } finally {
          remove();
        }
      });

      it("using RegExp origin", async () => {
        const { remove } = CORSResponse.inject(bunsai.middlewares, {
          origin: /\.example2\.com$/,
        });

        const response = await server.fetch(
          new Request("https://bun.test/html", {
            headers: { origin: "https://bun.test" },
          })
        );

        try {
          expect(response.status).toBe(403);
        } finally {
          remove();
        }
      });

      it("using string[] origin", async () => {
        const { remove } = CORSResponse.inject(bunsai.middlewares, {
          origin: ["http://test.s"],
        });

        const response = await server.fetch(
          new Request("https://bun.test/html", {
            headers: { origin: "https://bun.test" },
          })
        );

        try {
          expect(response.status).toBe(403);
        } finally {
          remove();
        }
      });

      it("using RegExp[] origin", async () => {
        const { remove } = CORSResponse.inject(bunsai.middlewares, {
          origin: [/\.example2\.com$/],
        });

        const response = await server.fetch(
          new Request("https://bun.test/html", {
            headers: { origin: "https://bun.test" },
          })
        );

        try {
          expect(response.status).toBe(403);
        } finally {
          remove();
        }
      });

      it("using function origin", async () => {
        const { remove } = CORSResponse.inject(bunsai.middlewares, {
          origin: () => false,
        });

        const response = await server.fetch(
          new Request("https://bun.test/html", {
            headers: { origin: "https://bun.test" },
          })
        );

        try {
          expect(response.status).toBe(403);
        } finally {
          remove();
        }
      });
    });

    describe("should allow valid request", () => {
      it("using string origin", async () => {
        const { remove } = CORSResponse.inject(bunsai.middlewares, {
          origin: "https://bun.test",
        });

        const response = await server.fetch(
          new Request("https://bun.test/html", {
            headers: { origin: "https://bun.test" },
          })
        );

        try {
          expect(await response.text()).toInclude("<title>Document</title>");
        } finally {
          remove();
        }
      });

      it("using RegExp origin", async () => {
        const { remove } = CORSResponse.inject(bunsai.middlewares, {
          origin: /bun\.test$/,
        });

        const response = await server.fetch(
          new Request("https://bun.test/html", {
            headers: { origin: "https://bun.test" },
          })
        );

        try {
          expect(await response.text()).toInclude("<title>Document</title>");
        } finally {
          remove();
        }
      });

      it("using string[] origin", async () => {
        const { remove } = CORSResponse.inject(bunsai.middlewares, {
          origin: ["https://bun.test"],
        });

        const response = await server.fetch(
          new Request("https://bun.test/html", {
            headers: { origin: "https://bun.test" },
          })
        );

        try {
          expect(await response.text()).toInclude("<title>Document</title>");
        } finally {
          remove();
        }
      });

      it("using RegExp[] origin", async () => {
        const { remove } = CORSResponse.inject(bunsai.middlewares, {
          origin: [/bun\.test$/],
        });

        const response = await server.fetch(
          new Request("https://bun.test/html", {
            headers: { origin: "https://bun.test" },
          })
        );

        try {
          expect(await response.text()).toInclude("<title>Document</title>");
        } finally {
          remove();
        }
      });

      it("using function origin", async () => {
        const { remove } = CORSResponse.inject(bunsai.middlewares, {
          origin: () => "https://bun.test",
        });

        const response = await server.fetch(
          new Request("https://bun.test/html", {
            headers: { origin: "https://bun.test" },
          })
        );

        try {
          expect(await response.text()).toInclude("<title>Document</title>");
        } finally {
          remove();
        }
      });
    });

    it("should return all headers correctly", async () => {
      const { remove } = CORSResponse.inject(bunsai.middlewares, {
        origin: "https://bun.test",
        credentials: true,
        exposedHeaders: ["X-A", "X-B"],
        methods: ["PUT", "DELETE"],
        maxAge: 2,
      });

      const response = await server.fetch(
        new Request("https://bun.test/html", {
          headers: {
            origin: "https://bun.test",
            "Access-Control-Request-Headers": "X-C",
          },
        })
      );

      try {
        expect(await response.text()).toInclude("<title>Document</title>");

        expect(response.headers.toJSON()).toMatchObject({
          "access-control-allow-credentials": "true",
          "access-control-allow-headers": "X-C",
          "access-control-allow-methods": "PUT,DELETE",
          "access-control-allow-origin": "https://bun.test",
          "access-control-expose-headers": "X-A,X-B",
          "access-control-max-age": "2",
        });
      } finally {
        remove();
      }
    });
  });
});
