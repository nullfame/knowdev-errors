/* eslint-disable max-classes-per-file */
const log = require("@knowdev/log");
const JsonApiSerializer = require("jsonapi-serializer");
const { HTTP } = require("./lib/http");

//
//
// Constants
//

const NAME = "ProjectError";

const ERROR = {
  MESSAGE: {
    BAD_GATEWAY: "An unexpected error occurred on an upstream resource",
    BAD_REQUEST: "The request was not properly formatted",
    CONFIGURATION_ERROR:
      "The application responding to the request encountered a configuration error",
    FORBIDDEN: "Access to this resource is not authorized",
    GATEWAY_TIMEOUT:
      "The connection timed out waiting for an upstream resource",
    GONE: "The requested resource is no longer available",
    INTERNAL_ERROR:
      "An unexpected error occurred and the request was unable to complete",
    METHOD_NOT_ALLOWED: "The requested method is not allowed",
    NOT_FOUND: "The requested resource was not found",
    NOT_IMPLEMENTED:
      "The request was understood but the resource is not implemented",
    REJECTED: "The request was rejected prior to processing",
    TEAPOT: "This resource is a teapot incapable of processing the request",
    UNAVAILABLE: "The requested resource is temporarily unavailable",
    UNREACHABLE_CODE:
      "The application encountered an unreachable condition while processing the request",
  },
  TITLE: {
    BAD_GATEWAY: "Bad Gateway",
    BAD_REQUEST: "Bad Request",
    CONFIGURATION_ERROR: "Internal Configuration Error",
    FORBIDDEN: "Forbidden",
    GATEWAY_TIMEOUT: "Gateway Timeout",
    GONE: "Gone",
    INTERNAL_ERROR: "Internal Application Error",
    METHOD_NOT_ALLOWED: "Method Not Allowed",
    NOT_FOUND: "Not Found",
    NOT_IMPLEMENTED: "Not Implemented",
    REJECTED: "Request Rejected",
    TEAPOT: "Teapot",
    UNAVAILABLE: "Service Unavailable",
  },
};

//
//
// Public Classes
//

class ProjectError extends Error {
  constructor(
    message = ERROR.MESSAGE.INTERNAL_ERROR,
    {
      status = HTTP.CODE.INTERNAL_ERROR,
      title = ERROR.TITLE.INTERNAL_ERROR,
    } = {}
  ) {
    super(message);
    this.title = title;
    this.detail = message;
    this.status = status;
    this.name = NAME;
    this.isProjectError = true;
  }
}

class ProjectMultiError extends Error {
  constructor(errors = []) {
    super();
    this.errors = errors;
    this.name = NAME;
    this.isProjectError = true;
  }
}

//
//
// Error Functions (to throw)
//

// Standard HTTP

const BadGatewayError = (message = ERROR.MESSAGE.BAD_GATEWAY) =>
  new ProjectError(message, {
    status: HTTP.CODE.BAD_GATEWAY,
    title: ERROR.TITLE.BAD_GATEWAY,
  });

const BadRequestError = (message = ERROR.MESSAGE.BAD_REQUEST) =>
  new ProjectError(message, {
    status: HTTP.CODE.BAD_REQUEST,
    title: ERROR.TITLE.BAD_REQUEST,
  });

const ForbiddenError = (message = ERROR.MESSAGE.FORBIDDEN) =>
  new ProjectError(message, {
    status: HTTP.CODE.FORBIDDEN,
    title: ERROR.TITLE.FORBIDDEN,
  });

const GatewayTimeoutError = (message = ERROR.MESSAGE.GATEWAY_TIMEOUT) =>
  new ProjectError(message, {
    status: HTTP.CODE.GATEWAY_TIMEOUT,
    title: ERROR.TITLE.GATEWAY_TIMEOUT,
  });

const GoneError = (message = ERROR.MESSAGE.GONE) =>
  new ProjectError(message, {
    status: HTTP.CODE.GONE,
    title: ERROR.TITLE.GONE,
  });

const InternalError = (message = ERROR.MESSAGE.INTERNAL_ERROR) =>
  new ProjectError(message, {
    status: HTTP.CODE.INTERNAL_ERROR,
    title: ERROR.TITLE.INTERNAL_ERROR,
  });

const MethodNotAllowedError = (message = ERROR.MESSAGE.METHOD_NOT_ALLOWED) =>
  new ProjectError(message, {
    status: HTTP.CODE.METHOD_NOT_ALLOWED,
    title: ERROR.TITLE.METHOD_NOT_ALLOWED,
  });

const NotFoundError = (message = ERROR.MESSAGE.NOT_FOUND) =>
  new ProjectError(message, {
    status: HTTP.CODE.NOT_FOUND,
    title: ERROR.TITLE.NOT_FOUND,
  });

const TeapotError = (message = ERROR.MESSAGE.TEAPOT) =>
  new ProjectError(message, {
    status: HTTP.CODE.TEAPOT,
    title: ERROR.TITLE.TEAPOT,
  });

const UnavailableError = (message = ERROR.MESSAGE.UNAVAILABLE) =>
  new ProjectError(message, {
    status: HTTP.CODE.UNAVAILABLE,
    title: ERROR.TITLE.UNAVAILABLE,
  });

// Special Errors

const ConfigurationError = (message = ERROR.MESSAGE.CONFIGURATION_ERROR) =>
  new ProjectError(message, {
    status: HTTP.CODE.INTERNAL_ERROR,
    title: ERROR.TITLE.CONFIGURATION_ERROR,
  });

const MultiError = (errors) => new ProjectMultiError(errors);

const RejectedError = (message = ERROR.MESSAGE.REJECTED) =>
  new ProjectError(message, {
    status: HTTP.CODE.FORBIDDEN,
    title: ERROR.TITLE.REJECTED,
  });

const NotImplementedError = (message = ERROR.MESSAGE.NOT_IMPLEMENTED) =>
  new ProjectError(message, {
    status: HTTP.CODE.BAD_REQUEST,
    title: ERROR.TITLE.NOT_IMPLEMENTED,
  });

const UnreachableCodeError = (message = ERROR.MESSAGE.UNREACHABLE_CODE) => {
  log.warn("Encountered unreachable code block");
  return new ProjectError(message, {
    status: HTTP.CODE.INTERNAL_ERROR,
    title: ERROR.TITLE.INTERNAL_ERROR,
  });
};

//
//
// Private Functions
//

function isMultiError(error) {
  return error instanceof ProjectMultiError;
}

//
//
// Public Functions
//

const formatError = (error) => {
  if (!error.isProjectError) throw error;

  let errors = [error];
  if (isMultiError(error)) {
    errors = error.errors;
  }

  const errorArray = [];
  let { status } = errors[0];
  errors.forEach((e) => {
    // If the errors aren't the same use a generic error
    if (status !== e.status) {
      // If they are both 4XX, use Bad Request
      if (Math.floor(status / 100) === 4 && Math.floor(e.status / 100) === 4) {
        status = HTTP.CODE.BAD_REQUEST;
      } else {
        // Otherwise, use internal server error
        status = HTTP.CODE.INTERNAL_ERROR;
      }
    }

    // Format the error
    const formatted = new JsonApiSerializer.Error(e);
    // But only pluck out the inner part of the array
    errorArray.push(formatted.errors[0]);
  });

  return {
    status,
    data: { errors: errorArray },
  };
};

//
//
// Export
//

module.exports = {
  BadGatewayError,
  BadRequestError,
  ConfigurationError,
  ERROR,
  ForbiddenError,
  formatError,
  GatewayTimeoutError,
  GoneError,
  InternalError,
  MethodNotAllowedError,
  MultiError,
  NAME,
  NotFoundError,
  NotImplementedError,
  ProjectError,
  ProjectMultiError,
  RejectedError,
  TeapotError,
  UnavailableError,
  UnreachableCodeError,
};