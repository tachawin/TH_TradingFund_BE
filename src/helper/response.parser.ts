import { STANDARD_ERROR } from '../entities/constants/errors';

import { ResponseInterface, SuccessType, ErrorType } from '../entities/interfaces/data/response.interface';

function setMessageReplyFormatError(code: number, message: string, errorCode?: string): ErrorType {
  const status = code || 500;

  return {
    error: {
      code: status,
      ...errorCode && ({ errorCode }),
      message,
    },
  };
}

function setMessageReplyFormatSuccess(code: number, message: string): SuccessType {
  const status = code || 200;

  return {
    success: {
      code: status,
      message,
    },
  };
}

function parseResponse(data: ResponseInterface) {
  // message string response type
  if (typeof data === 'string' || data instanceof String) {
    const message = data.toString();

    return setMessageReplyFormatSuccess(200, message);
  }

  // specific code and message manual
  if ('code' in data && 'message' in data) {
    const { code, message } = data;

    if (code >= 400 && code <= 500) {
      return setMessageReplyFormatError(code, message);
    }

    return setMessageReplyFormatSuccess(code, message);
  }

  // error standard code response type
  if ('errorCode' in data) {
    const { errorCode } = data;

    if (!(errorCode in STANDARD_ERROR)) {
      return setMessageReplyFormatError(500, 'something went wrong, standard error code not exist');
    }

    const { code, message } = STANDARD_ERROR[errorCode];

    return setMessageReplyFormatError(code, message, errorCode);
  }

  if (data.constructor === Error && data.message.includes('errorCode')) {
    const errorCode = data.message.split(':')[1];

    if (!(errorCode in STANDARD_ERROR)) {
      return setMessageReplyFormatError(500, 'something went wrong, standard error code not exist');
    }

    const { code, message } = STANDARD_ERROR[errorCode];

    return setMessageReplyFormatError(code, message, errorCode);
  }

  // error throw response type
  if (data.constructor === Error) {
    const message = data.message.substring(
      data.message.indexOf(':') + 2,
      data.message.indexOf(';'),
    );

    return setMessageReplyFormatError(500, message);
  }

  return data;
}

export default parseResponse;
