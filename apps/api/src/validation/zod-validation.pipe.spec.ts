import { BadRequestException } from "@nestjs/common";
import { z } from "zod";
import { ZodValidationPipe } from "./zod-validation.pipe.js";

describe("ZodValidationPipe", () => {
  const pipe = new ZodValidationPipe(
    z.object({ name: z.string().trim(), count: z.coerce.number() }),
  );

  it("returns the parsed value", () => {
    expect(pipe.transform({ name: " rent ", count: "2" })).toEqual({
      name: "rent",
      count: 2,
    });
  });

  it("rejects invalid input with the zod issues", () => {
    expect.assertions(2);
    try {
      pipe.transform({ count: "two" });
    } catch (error) {
      expect(error).toBeInstanceOf(BadRequestException);
      expect((error as BadRequestException).getResponse()).toMatchObject({
        message: [
          expect.objectContaining({ path: ["name"] }),
          expect.objectContaining({ path: ["count"] }),
        ],
      });
    }
  });
});
