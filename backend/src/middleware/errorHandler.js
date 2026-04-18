const errorHandler = (err, req, res, _next) => {
  let status = err.status || 500;
  let message = err.message || 'Internal Server Error';

  const isValidationError =
    err.name === 'ZodError' || err.issues || (err.errors && Array.isArray(err.errors));

  if (isValidationError) {
    status = 400;
    const errors = err.issues || err.errors;
    if (Array.isArray(errors) && errors[0]?.message) {
      message = errors[0].message;
    }
  }

  if (typeof message === 'string' && message.startsWith('[') && message.includes('"message":')) {
    try {
      const parsed = JSON.parse(message);
      if (Array.isArray(parsed) && parsed[0]?.message) {
        message = parsed[0].message;
      }
    } catch {
      // Not valid JSON or parsing failed, keep the original message
    }
  }

  // Only show stack trace in development for security
  res.status(status).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
};

export default errorHandler;
