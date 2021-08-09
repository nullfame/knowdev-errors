const JsonApiSerializer = require("jsonapi-serializer");
const { HTTP } = require("../lib/http");
const {
  ERROR,
  formatError,
  NAME,
  ProjectError,
  ProjectMultiError,
} = require("../errors");

//
//
// Mock constants
//

const MOCK = {
  DETAIL: "mockDetails",
  TITLE: "mockTitle",
  STATUS: 600,
};

//
//
// Mock modules
//

//
//
// Mock environment
//

const DEFAULT_ENV = process.env;
beforeEach(() => {
  process.env = { ...process.env };
});
afterEach(() => {
  process.env = DEFAULT_ENV;
});

//
//
// Run tests
//

describe("JSON:API HTTP Error", () => {
  it("Is throwable", () => {
    try {
      const error = new ProjectError();
      throw error;
    } catch (error) {
      expect(error).not.toBeEmpty();
      expect(error.name).toBe(NAME);
    }
    expect.assertions(2);
  });
  it("Has isProjectError", () => {
    const error = new ProjectError();
    expect(error.isProjectError).toBeTrue();
  });
  it("Defaults to internal error", () => {
    const error = new ProjectError();
    expect(error.status).toBe(HTTP.CODE.INTERNAL_ERROR);
    expect(error.title).toBe(ERROR.TITLE.INTERNAL_ERROR);
    expect(error.detail).toBe(ERROR.MESSAGE.INTERNAL_ERROR);
  });
  it("Allows custom message", () => {
    const error = new ProjectError(MOCK.DETAIL);
    expect(error.detail).toBe(MOCK.DETAIL);
  });
  it("Allows custom status", () => {
    const error = new ProjectError(undefined, { status: MOCK.STATUS });
    expect(error.status).toBe(MOCK.STATUS);
  });
  it("Allows custom title", () => {
    const error = new ProjectError(undefined, { title: MOCK.TITLE });
    expect(error.title).toBe(MOCK.TITLE);
  });

  describe("Formatting Errors", () => {
    it("Can be formatted as JSON:API", () => {
      const error = new ProjectError();
      const response = formatError(error);

      expect(response.status).toBeNumber();
      expect(response.status).not.toBeNegative();

      expect(response.data).toBeObject();
      expect(response.data.errors).toBeArrayOfSize(1);

      // Each element in the errors should parse as a JsonApiError
      response.data.errors.forEach((element) => {
        const test = JsonApiSerializer.Error(element);
        expect(test.errors[0]).toEqual(element);
      });
    });
    it("Re-throws non-ProjectError", () => {
      try {
        const notProjectError = Error();
        formatError(notProjectError);
      } catch (error) {
        expect(error).not.toBeEmpty();
        expect(error.name).not.toBe("ProjectError");
      }
      expect.assertions(2);
    });
  });

  describe("Multiple Error Messages", () => {
    it("Is throwable", () => {
      try {
        const error = new ProjectMultiError();
        throw error;
      } catch (error) {
        expect(error).not.toBeEmpty();
        expect(error.name).toBe("ProjectError");
      }
      expect.assertions(2);
    });
    it("Has isProjectError", () => {
      const error = new ProjectMultiError();
      expect(error.isProjectError).toBeTrue();
    });
    it("Can be formatted as JSON:API", () => {
      const error1 = new ProjectError();
      const error2 = new ProjectError();
      const error = new ProjectMultiError([error1, error2]);
      const response = formatError(error);

      expect(response.status).toBeNumber();
      expect(response.status).not.toBeNegative();

      expect(response.data).toBeObject();
      expect(response.data.errors).toBeArrayOfSize(2);

      // Each element in the errors should parse as a JsonApiError
      response.data.errors.forEach((element) => {
        const test = JsonApiSerializer.Error(element);
        expect(test.errors[0]).toEqual(element);
      });
    });
    it("Lists all errors when formatting", () => {
      const error1 = new ProjectError();
      const error2 = new ProjectError(MOCK.DETAIL);
      const error = new ProjectMultiError([error1, error2]);
      const response = formatError(error);
      expect(response.data.errors[0].detail).toBe(ERROR.MESSAGE.INTERNAL_ERROR);
      expect(response.data.errors[1].detail).toBe(MOCK.DETAIL);
    });
    it("Preserves error code when all same", () => {
      const error1 = new ProjectError(undefined, { status: MOCK.STATUS });
      const error2 = new ProjectError(undefined, { status: MOCK.STATUS });
      const error = new ProjectMultiError([error1, error2]);
      const response = formatError(error);
      expect(response.status).toBe(MOCK.STATUS);
    });
    it("Uses 400 when multiple 4XX", () => {
      const error1 = new ProjectError(undefined, {
        status: HTTP.CODE.NOT_FOUND,
      });
      const error2 = new ProjectError(undefined, {
        status: HTTP.CODE.FORBIDDEN,
      });
      const error = new ProjectMultiError([error1, error2]);
      const response = formatError(error);
      expect(response.status).toBe(HTTP.CODE.BAD_REQUEST);
    });
    it("Uses 500 when multiple 5XX", () => {
      const error1 = new ProjectError(undefined, {
        status: HTTP.CODE.GATEWAY_TIMEOUT,
      });
      const error2 = new ProjectError(undefined, {
        status: HTTP.CODE.BAD_GATEWAY,
      });
      const error = new ProjectMultiError([error1, error2]);
      const response = formatError(error);
      expect(response.status).toBe(HTTP.CODE.INTERNAL_ERROR);
    });
    it("Uses 500 when mixing 4XX and 5XX", () => {
      const error1 = new ProjectError(undefined, {
        status: HTTP.CODE.NOT_FOUND,
      });
      const error2 = new ProjectError(undefined, {
        status: HTTP.CODE.BAD_GATEWAY,
      });
      const error = new ProjectMultiError([error1, error2]);
      const response = formatError(error);
      expect(response.status).toBe(HTTP.CODE.INTERNAL_ERROR);
    });
  });
});