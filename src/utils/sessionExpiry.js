let sessionExpiryHandler = null;
let sessionExpiryNoticeVisible = false;

export const registerSessionExpiryHandler = handler => {
  sessionExpiryHandler = handler;

  return () => {
    if (sessionExpiryHandler === handler) {
      sessionExpiryHandler = null;
    }
  };
};

export const notifySessionExpired = () => {
  if (!sessionExpiryHandler || sessionExpiryNoticeVisible) {
    return;
  }

  sessionExpiryNoticeVisible = true;
  sessionExpiryHandler(() => {
    sessionExpiryNoticeVisible = false;
  });
};
