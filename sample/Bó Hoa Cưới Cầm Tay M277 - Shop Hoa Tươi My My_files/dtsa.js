/* eslint-disable no-console */
((window, navigator) => {
  const SEC = 1000;
  const MIN = SEC * 60;
  const HOUR = MIN * 60;
  const DAY = HOUR * 24;

  const state = {
    loadTime: Date.now(),
    capabilities: {
      beacon: false,
    },
    user: {},
    events: [],
    eventsSent: [],
    timers: {
      idle: null,
    },
  };
  const config = {
    debug: true,
    endpoint: 'https://a.dtsan.net',
    sessionIdleTime: 30 * MIN,
    sessionStorageTime: 30 * DAY,
  };

  // ----- HELPERS ------
  function identifier() {
    const str = (Math.random() + 1).toString(36).slice(2, 12);
    return `${str}.${Math.floor(Date.now() / 1000)}`;
  }

  function friendlyTime(elapsed) {
    if (elapsed < SEC) {
      return `${elapsed}ms`;
    }
    if (elapsed < MIN) {
      return `${Math.floor(elapsed / 1000)}s`;
    }
    if (elapsed < HOUR) {
      return `${Math.floor(elapsed / 1000 / 60)}m`;
    }
    return `${Math.floor(elapsed / 1000 / 60 / 60)}h`;
  }

  function debugMessage(level, message) {
    const elapsed = friendlyTime(Date.now() - state.loadTime);
    console.debug(`%c [DTSA-${level}-${elapsed}] ${message}`, 'background: #222222; color: #a8d5e5');
  }

  function browserCapabilities() {
    // beacon
    if (navigator.sendBeacon) {
      state.capabilities.beacon = true;
    }
  }

  function parseFormFactor() {
    const devTypeRegex = /android|webos|iphone|ipad|ipod|blackberry|iemobile|opera mini|mobile/i;
    if (devTypeRegex.test(navigator.userAgent.toLocaleLowerCase())) {
      return 'm';
    }

    return 'd';
  }

  function parseOS() {
    const ua = navigator.userAgent.toLocaleLowerCase();
    if (ua.match(/android/i)) {
      return 'android';
    }
    if (ua.match(/iphone|ipad|ipod/i)) {
      return 'ios';
    }
    if (ua.match(/Windows/i)) {
      return 'win';
    }
    if (ua.match(/Mac/i)) {
      return 'mac';
    }
    if (ua.match(/Linux/i)) {
      return 'linux';
    }
    if (ua.match(/webos/i)) {
      return 'webos';
    }
    return null;
  }

  function parseBrowser() {
    const ua = navigator.userAgent.toLocaleLowerCase();
    if (ua.match(/edge/i)) {
      return 'edge';
    }
    if (ua.match(/samsungbrowser/i)) {
      return 'samsung';
    }
    if (ua.match(/ucbrowser/i)) {
      return 'samsung';
    }
    if (ua.match(/chrome/i)) {
      return 'chrome';
    }
    if (ua.match(/firefox/i)) {
      return 'firefox';
    }
    if (ua.match(/safari/i)) {
      return 'safari';
    }
    if (ua.match(/opera/i)) {
      return 'opera';
    }
    if (ua.match(/msie/i)) {
      return 'ie';
    }
    if (ua.match(/yandex/i)) {
      return 'yandex';
    }
    if (ua.match(/android/i)) {
      return 'android';
    }

    return null;
  }

  function parseUserAgent() {
    return {
      f: parseFormFactor(),
      o: parseOS(),
      ov: 'un',
      b: parseBrowser(),
      bv: 'un',
    };
  }

  // extract primary language only for now
  function parseLanguage() {
    if (navigator.language) {
      return navigator.language.split('-')[0];
    }

    return 'un';
  }

  function hasEventBeenSent(event) {
    return state.eventsSent.includes(event);
  }

  function logEvent(type, count = 1, data = null) {
    const event = {
      t: Date.now(),
      n: type,
      c: count,
      ...(data ? { d: data } : {}),
    };

    state.events.push(event);
  }

  // ----- STORAGE ------
  const storage = {
    baseKey: 'dtsa',
    buildKey: function(key) {
      return `dtsa.${key}`;
    },
    getBase: function() {
      const obj = localStorage.getItem(this.baseKey);
      if (!obj) {
        return null;
      }

      try {
        return JSON.parse(obj);
      } catch (e) {
        debugMessage('error', 'Failed to parse base object', e);
        return null;
      }
    },
    setBase: function(data) {
      let jsonValue;
      try {
        jsonValue = JSON.stringify(data);
      } catch (e) {
        debugMessage('error', 'Failed to stringify base object', e);
        return false;
      }

      try {
        localStorage.setItem(this.baseKey, jsonValue);
      } catch (e) {
        debugMessage('error', 'Failed to set base object', e);
        return false;
      }

      return true;
    },
    set: function(key, value, ttl = (60 * DAY)) {
      const obj = {
        e: Date.now() + ttl,
        v: value,
      };

      const base = this.getBase() || {};
      base[key] = obj;
      return this.setBase(base);
    },
    get: function(key) {
      const base = this.getBase() || {};

      if (!(key in base)) {
        return null;
      }

      const keyObj = base[key];
      if (keyObj.e < Date.now()) {
        delete base[key];
        this.setBase(base);
        return null;
      }

      return keyObj.v;
    },
    clear: function() {
      localStorage.removeItem(this.baseKey);
    },
    trim: function() {
      const base =  this.getBase() || {};

      let mutated = false;
      Object.keys(base).forEach((key) => {
        const keyObj = base[key];
        if (keyObj.e < Date.now()) {
          delete base[key];
          mutated = true;
        }
      });

      if (mutated) {
        this.setBase(base);
      }
    },
  };

  // ----- PRIMARY METHODS ------
  function preprocess() {
    // enable debugging via URL param
    const urlDebugMatches = window.location.search.match(/[?&]dtsadebug=(true|1)/);
    if (urlDebugMatches) {
      config.debug = true;
      debugMessage('debug', 'debug mode enabled via URL');
    }

    browserCapabilities();
  }

  function createNewSession(ts) {
    debugMessage('info', 'creating new session');

    state.user.idSess = identifier();
    state.user.tSessL = ts;
    state.user.tSessS = ts;
    state.user.pvs = 0;

    logEvent('ss');
  }

  function persistSession() {
    debugMessage('info', 'persisting session');

    storage.set('idSess', state.user.idSess, config.sessionStorageTime);
    storage.set('tSessS', state.user.tSessS, config.sessionStorageTime);
    storage.set('tSessL', state.user.tSessL, config.sessionStorageTime);
    storage.set('pvs', state.user.pvs, config.sessionStorageTime);
  }

  function resolveSession() {
    const ts = Date.now();
    state.user.tCurr = ts;
    state.user.tPvS = ts;

    state.user.u24 = !storage.get('u24');
    if (state.user.u24) {
      logEvent('u24');
      storage.set('u24', true, 1 * DAY);
    }

    state.user.u30 = !(storage.get('u30'));
    if (state.user.u30) {
      logEvent('u30');
      storage.set('u30', true, 30 * DAY);
    }

    let isNew = false;
    const idSess = storage.get('idSess');
    if (!idSess) {
      // no session id, new session
      isNew = true;
    } else {
      state.user.idSess = storage.get('idSess');

      const tSessS = storage.get('tSessS');
      if (!tSessS) {
        // no session start time, new session
        isNew = true;
      } else {
        // session exists, compare last touch time
        state.user.tSessS = tSessS;
        const tSessL = storage.get('tSessL');
        if (!tSessL) {
          // no session last touch, treat as new
          isNew = true;
        } else if ((ts - tSessL) > config.sessionIdleTime) {
          isNew = true;
          logEvent('sx');
        } else {
          state.user.tSessL = ts;

          // session is still current, retrieve additiona session metrics
          state.user.pvs = storage.get('pvs') || 0;
        }
      }
    }

    if (isNew) {
      createNewSession(ts);
    }
  }

  function sendEvents() {
    if (state.events.length === 0) {
      debugMessage('info', 'no events to send');
      return;
    }

    debugMessage('debug', 'sending events');
    const payload = {
      l: state.user.l,
      d: state.user.d,
      g: state.user.g,
      s: state.user.idSess,
      e: state.events.map((e) => ({
        ...e,
        t: Math.round((Date.now() - e.t) / 1000),
      })),
    };

    // track events sent
    state.eventsSent = [
      ...state.eventsSent,
      ...state.events.map((e) => e.n),
    ];

    const endpoint = `${config.endpoint}/a`;
    if (state.capabilities.beacon) {
      navigator.sendBeacon(endpoint, JSON.stringify(payload));
    } else {
      // fallback to XHR
      const xhr = new XMLHttpRequest();
      xhr.open('POST', endpoint, true);
      xhr.setRequestHeader('Content-Type', 'application/json');
      xhr.send(JSON.stringify(payload));
    }

    // clear events queue
    state.events = [];
  }

  function setupListeners() {
    // setup unload event
    window.document.addEventListener('visibilitychange', () => {
      if (window.document.hidden) {
        debugMessage('info', 'visibility change: hidden');

        /**
         * pageview time and count to normalize across hours,
         * only send on the first loss of visibility on the page
         */
        if (!hasEventBeenSent('pvl')) {
          logEvent('pvl', (Date.now() - state.user.tPvS) / 1000);
          logEvent('pvlc');
        }
        sendEvents();
      }
    });
  }

  function init() {
    resolveSession();

    // track current page
    logEvent('pv');
    state.user.pvs += 1;
    state.user.l = {
      d: window.location.hostname.replace('www.', ''),
      p: window.location.pathname,
      s: window.location.search.replace('?', ''),
      h: window.location.hash.replace('#', ''),
    };

    // device params
    state.user.d = parseUserAgent();

    // accept language (primary)
    state.user.g = parseLanguage();

    persistSession();

    setupListeners();

    // setup idle timer
    state.timers.idle = setTimeout(() => {
      debugMessage('info', 'idle timer triggered');
      sendEvents();
    }, 20 * SEC);
  }

  // entry point
  preprocess();
  init();
})(window, navigator);
