/**
 * Success response
 */
const success = (res, data = {}, message = "Success", statusCode = 200) => {
  return res.status(statusCode).json({
    success: true,
    message,
    ...data,
  });
};

/**
 * Created response
 */
const created = (res, data = {}, message = "Created successfully") => {
  return success(res, data, message, 201);
};

/**
 * Error response
 */
const error = (res, message = "Internal Server Error", statusCode = 500, details = null) => {
  const payload = { success: false, message };
  if (details && process.env.NODE_ENV !== "production") {
    payload.details = details;
  }
  return res.status(statusCode).json(payload);
};

/**
 * Not found response
 */
const notFound = (res, entity = "Resource") => {
  return error(res, `${entity} not found`, 404);
};

/**
 * Unauthorized response
 */
const unauthorized = (res, message = "Unauthorized") => {
  return error(res, message, 401);
};

/**
 * Forbidden response
 */
const forbidden = (res, message = "Forbidden") => {
  return error(res, message, 403);
};

/**
 * Validation error response
 */
const validationError = (res, message = "Validation failed", fields = []) => {
  return res.status(400).json({ success: false, message, fields });
};

/**
 * Paginated list response
 */
const paginated = (res, items, total, page, limit, message = "Retrieved successfully") => {
  return res.status(200).json({
    success: true,
    message,
    data: items,
    pagination: {
      total,
      page: parseInt(page),
      limit: parseInt(limit),
      pages: Math.ceil(total / limit),
      hasNextPage: parseInt(page) < Math.ceil(total / limit),
      hasPrevPage: parseInt(page) > 1,
    },
  });
};

module.exports = { success, created, error, notFound, unauthorized, forbidden, validationError, paginated };
