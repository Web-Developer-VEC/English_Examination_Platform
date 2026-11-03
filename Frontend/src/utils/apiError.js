/**
 * Extracts a human-readable and detailed error message from an API error response,
 * Axios error, Error instance, or plain string/object.
 *
 * Prioritizes specific validation/error details (e.g. "Row 4: Answer must match...")
 * over generic messages (e.g. "Failed to upload questions.").
 */
const isGenericFailure = (text) => {
  if (!text || typeof text !== "string") return false;
  const lower = text.trim().toLowerCase();
  return (
    lower === "failed to upload questions." ||
    lower === "failed to upload questions" ||
    lower === "failed to upload students." ||
    lower === "failed to upload students" ||
    lower === "failed to update students." ||
    lower === "failed to update students" ||
    lower === "something went wrong." ||
    lower === "something went wrong" ||
    lower === "unexpected server error." ||
    lower === "unexpected server error" ||
    lower === "internal server error" ||
    lower === "request failed." ||
    lower === "request failed" ||
    lower === "error"
  );
};

export const extractErrorMessage = (data) => {
  if (!data) return "";

  if (typeof data === "string") {
    // If it's raw HTML (e.g. 502 Bad Gateway page), ignore HTML
    if (data.trim().startsWith("<") && data.includes("</html>")) {
      return "";
    }
    return data.trim();
  }

  // Handle case where object is wrapped inside responseData or data
  const source = data.responseData || data.data || data;

  const msg = typeof source.message === "string" ? source.message.trim() : "";

  let errDetail = "";
  if (typeof source.error === "string") {
    errDetail = source.error.trim();
  } else if (source.error && typeof source.error === "object") {
    errDetail = source.error.message || source.error.detail || "";
  } else if (Array.isArray(source.errors) && source.errors.length > 0) {
    const first = source.errors[0];
    errDetail = typeof first === "string" ? first.trim() : first?.message || "";
  } else if (typeof source.detail === "string") {
    errDetail = source.detail.trim();
  }

  // Both message and error detail exist
  if (msg && errDetail) {
    if (msg.toLowerCase() === errDetail.toLowerCase()) {
      return msg;
    }
    if (msg.toLowerCase().includes(errDetail.toLowerCase())) {
      return msg;
    }
    if (errDetail.toLowerCase().includes(msg.toLowerCase())) {
      return errDetail;
    }

    // If message is generic and error is specific, prefer the specific error
    if (isGenericFailure(msg) && !isGenericFailure(errDetail)) {
      return errDetail;
    }

    // If error is generic and message is specific, prefer the specific message
    if (isGenericFailure(errDetail) && !isGenericFailure(msg)) {
      return msg;
    }

    return `${msg.replace(/\.+$/, "")}: ${errDetail}`;
  }

  // If only one exists, prefer whichever has content
  if (errDetail && !isGenericFailure(errDetail)) {
    return errDetail;
  }

  if (msg && !isGenericFailure(msg)) {
    return msg;
  }

  return errDetail || msg || "";
};

export const getApiErrorMessage = (error, fallback = "Something went wrong.") => {
  if (!error) return fallback;

  // 1. Check Axios response data
  if (error?.response?.data) {
    const extracted = extractErrorMessage(error.response.data);
    if (extracted) return extracted;
  }

  // 2. Check direct data object or payload
  const directExtracted = extractErrorMessage(error);
  if (directExtracted) return directExtracted;

  // 3. Fallback to standard error.message (e.g. Network Error, client-thrown Errors)
  if (typeof error?.message === "string" && error.message.trim()) {
    return error.message.trim();
  }

  return fallback;
};

export const getApiErrorDetails = (error, defaultSummary = "Operation failed") => {
  const fullMessage = getApiErrorMessage(error, defaultSummary);
  const data = error?.response?.data || error?.responseData || error;

  let summary = defaultSummary;
  let detail = fullMessage;

  if (data && typeof data === "object") {
    const msg = typeof data.message === "string" ? data.message.trim() : "";
    const err = typeof data.error === "string" ? data.error.trim() : "";

    if (msg && err && msg.toLowerCase() !== err.toLowerCase()) {
      summary = msg;
      detail = err;
    } else if (err) {
      detail = err;
    } else if (msg) {
      detail = msg;
    }
  }

  return {
    summary,
    detail,
    fullMessage,
  };
};
