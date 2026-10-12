let sessionExpiryHandler = null;
let sessionExpiryNoticeVisible = false;
let pendingNotice = null;

export const registerSessionExpiryHandler = handler => {
  sessionExpiryHandler = handler;
  if (pendingNotice) {
    const notice = pendingNotice;
    pendingNotice = null;
    notifySessionExpired(notice);
  }

  return () => {
    if (sessionExpiryHandler === handler) {
      sessionExpiryHandler = null;
    }
  };
};

export const notifySessionExpired = (details = {}) => {
  if (!sessionExpiryHandler) {
    pendingNotice = details;
    return;
  }
  if (sessionExpiryNoticeVisible) {
    return;
  }

  sessionExpiryNoticeVisible = true;
  sessionExpiryHandler(() => {
    sessionExpiryNoticeVisible = false;
  }, details);
};
