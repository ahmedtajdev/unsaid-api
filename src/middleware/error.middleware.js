export const globalErrorHandling = (error, req, res, next) => {
  return res.status(error.cause?.status ?? 500).json({
    error_message: error.message || "Server error",
    issues: error.cause?.issues,
    error,
    stack: error.stack,
  });
};
