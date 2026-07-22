var __defProp = Object.defineProperty;
var __getOwnPropNames = Object.getOwnPropertyNames;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });
var __esm = (fn, res, err) => function __init() {
  if (err) throw err[0];
  try {
    return fn && (res = (0, fn[__getOwnPropNames(fn)[0]])(fn = 0)), res;
  } catch (e) {
    throw err = [e], e;
  }
};
var __export = (target, all) => {
  for (var name in all)
    __defProp(target, name, { get: all[name], enumerable: true });
};

// wrangler-modules-watch:wrangler:modules-watch
var init_wrangler_modules_watch = __esm({
  "wrangler-modules-watch:wrangler:modules-watch"() {
    init_modules_watch_stub();
  }
});

// node_modules/wrangler/templates/modules-watch-stub.js
var init_modules_watch_stub = __esm({
  "node_modules/wrangler/templates/modules-watch-stub.js"() {
    init_wrangler_modules_watch();
  }
});

// src/utils/jwt.ts
var jwt_exports = {};
__export(jwt_exports, {
  decode: () => decode,
  sign: () => sign,
  verify: () => verify
});
function b64url(input) {
  return btoa(input).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}
function b64urlDecode(input) {
  input = input.replace(/-/g, "+").replace(/_/g, "/");
  while (input.length % 4) input += "=";
  return atob(input);
}
async function hmacSign(data, secret) {
  const key = await crypto.subtle.importKey("raw", encoder.encode(secret), { name: "HMAC", hash: "SHA-256" }, false, ["sign"]);
  const sig = await crypto.subtle.sign("HMAC", key, encoder.encode(data));
  return b64url(String.fromCharCode(...new Uint8Array(sig)));
}
async function sign(payload, secret, expiresInSec) {
  const header = b64url(JSON.stringify({ alg: "HS256", typ: "JWT" }));
  const body = b64url(JSON.stringify({ ...payload, exp: Math.floor(Date.now() / 1e3) + expiresInSec }));
  const sig = await hmacSign(`${header}.${body}`, secret);
  return `${header}.${body}.${sig}`;
}
async function verify(token, secret) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  const sig = await hmacSign(`${parts[0]}.${parts[1]}`, secret);
  if (sig !== parts[2]) return null;
  try {
    const payload = JSON.parse(b64urlDecode(parts[1]));
    if (payload.exp && payload.exp < Math.floor(Date.now() / 1e3)) return null;
    return payload;
  } catch {
    return null;
  }
}
function decode(token) {
  const parts = token.split(".");
  if (parts.length !== 3) return null;
  try {
    return JSON.parse(b64urlDecode(parts[1]));
  } catch {
    return null;
  }
}
var encoder;
var init_jwt = __esm({
  "src/utils/jwt.ts"() {
    "use strict";
    init_modules_watch_stub();
    encoder = new TextEncoder();
    __name(b64url, "b64url");
    __name(b64urlDecode, "b64urlDecode");
    __name(hmacSign, "hmacSign");
    __name(sign, "sign");
    __name(verify, "verify");
    __name(decode, "decode");
  }
});

// .wrangler/tmp/bundle-gKw4Ld/middleware-loader.entry.ts
init_modules_watch_stub();

// .wrangler/tmp/bundle-gKw4Ld/middleware-insertion-facade.js
init_modules_watch_stub();

// src/index.ts
init_modules_watch_stub();

// src/router.ts
init_modules_watch_stub();

// node_modules/hono/dist/index.js
init_modules_watch_stub();

// node_modules/hono/dist/hono.js
init_modules_watch_stub();

// node_modules/hono/dist/hono-base.js
init_modules_watch_stub();

// node_modules/hono/dist/compose.js
init_modules_watch_stub();
var compose = /* @__PURE__ */ __name((middleware, onError, onNotFound) => {
  return (context, next) => {
    let index = -1;
    return dispatch(0);
    async function dispatch(i) {
      if (i <= index) {
        throw new Error("next() called multiple times");
      }
      index = i;
      let res;
      let isError = false;
      let handler;
      if (middleware[i]) {
        handler = middleware[i][0][0];
        context.req.routeIndex = i;
      } else {
        handler = i === middleware.length && next || void 0;
      }
      if (handler) {
        try {
          res = await handler(context, () => dispatch(i + 1));
        } catch (err) {
          if (err instanceof Error && onError) {
            context.error = err;
            res = await onError(err, context);
            isError = true;
          } else {
            throw err;
          }
        }
      } else {
        if (context.finalized === false && onNotFound) {
          res = await onNotFound(context);
        }
      }
      if (res && (context.finalized === false || isError)) {
        context.res = res;
      }
      return context;
    }
    __name(dispatch, "dispatch");
  };
}, "compose");

// node_modules/hono/dist/context.js
init_modules_watch_stub();

// node_modules/hono/dist/request.js
init_modules_watch_stub();

// node_modules/hono/dist/http-exception.js
init_modules_watch_stub();

// node_modules/hono/dist/request/constants.js
init_modules_watch_stub();
var GET_MATCH_RESULT = /* @__PURE__ */ Symbol();

// node_modules/hono/dist/utils/body.js
init_modules_watch_stub();

// node_modules/hono/dist/utils/buffer.js
init_modules_watch_stub();

// node_modules/hono/dist/utils/crypto.js
init_modules_watch_stub();

// node_modules/hono/dist/utils/buffer.js
var bufferToFormData = /* @__PURE__ */ __name((arrayBuffer, contentType) => {
  const response = new Response(arrayBuffer, {
    headers: {
      // Normalize the media type (case-insensitive) while keeping parameters like the boundary
      "Content-Type": contentType.replace(/^[^;]+/, (mediaType) => mediaType.toLowerCase())
    }
  });
  return response.formData();
}, "bufferToFormData");

// node_modules/hono/dist/utils/body.js
var isRawRequest = /* @__PURE__ */ __name((request) => "headers" in request, "isRawRequest");
var parseBody = /* @__PURE__ */ __name(async (request, options = /* @__PURE__ */ Object.create(null)) => {
  const { all = false, dot = false } = options;
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const contentType = headers.get("Content-Type");
  const mediaType = contentType?.split(";")[0].trim().toLowerCase();
  if (mediaType === "multipart/form-data" || mediaType === "application/x-www-form-urlencoded") {
    return parseFormData(request, { all, dot });
  }
  return {};
}, "parseBody");
async function parseFormData(request, options) {
  if (!isRawRequest(request) && request.bodyCache.formData) {
    return convertFormDataToBodyData(
      await request.bodyCache.formData,
      options
    );
  }
  const headers = isRawRequest(request) ? request.headers : request.raw.headers;
  const arrayBuffer = await request.arrayBuffer();
  const formDataPromise = bufferToFormData(arrayBuffer, headers.get("Content-Type") || "");
  if (!isRawRequest(request)) {
    request.bodyCache.formData = formDataPromise;
  }
  const formData = await formDataPromise;
  if (formData) {
    return convertFormDataToBodyData(formData, options);
  }
  return {};
}
__name(parseFormData, "parseFormData");
function convertFormDataToBodyData(formData, options) {
  const form = /* @__PURE__ */ Object.create(null);
  formData.forEach((value, key) => {
    const shouldParseAllValues = options.all || key.endsWith("[]");
    if (!shouldParseAllValues) {
      form[key] = value;
    } else {
      handleParsingAllValues(form, key, value);
    }
  });
  if (options.dot) {
    Object.entries(form).forEach(([key, value]) => {
      const shouldParseDotValues = key.includes(".");
      if (shouldParseDotValues) {
        handleParsingNestedValues(form, key, value);
        delete form[key];
      }
    });
  }
  return form;
}
__name(convertFormDataToBodyData, "convertFormDataToBodyData");
var handleParsingAllValues = /* @__PURE__ */ __name((form, key, value) => {
  if (form[key] !== void 0) {
    if (Array.isArray(form[key])) {
      ;
      form[key].push(value);
    } else {
      form[key] = [form[key], value];
    }
  } else {
    if (!key.endsWith("[]")) {
      form[key] = value;
    } else {
      form[key] = [value];
    }
  }
}, "handleParsingAllValues");
var handleParsingNestedValues = /* @__PURE__ */ __name((form, key, value) => {
  if (/(?:^|\.)__proto__\./.test(key)) {
    return;
  }
  let nestedForm = form;
  const keys = key.split(".");
  keys.forEach((key2, index) => {
    if (index === keys.length - 1) {
      nestedForm[key2] = value;
    } else {
      if (!nestedForm[key2] || typeof nestedForm[key2] !== "object" || Array.isArray(nestedForm[key2]) || nestedForm[key2] instanceof File) {
        nestedForm[key2] = /* @__PURE__ */ Object.create(null);
      }
      nestedForm = nestedForm[key2];
    }
  });
}, "handleParsingNestedValues");

// node_modules/hono/dist/utils/url.js
init_modules_watch_stub();
var splitPath = /* @__PURE__ */ __name((path) => {
  const paths = path.split("/");
  if (paths[0] === "") {
    paths.shift();
  }
  return paths;
}, "splitPath");
var splitRoutingPath = /* @__PURE__ */ __name((routePath) => {
  const { groups, path } = extractGroupsFromPath(routePath);
  const paths = splitPath(path);
  return replaceGroupMarks(paths, groups);
}, "splitRoutingPath");
var extractGroupsFromPath = /* @__PURE__ */ __name((path) => {
  const groups = [];
  path = path.replace(/\{[^}]+\}/g, (match2, index) => {
    const mark = `@${index}`;
    groups.push([mark, match2]);
    return mark;
  });
  return { groups, path };
}, "extractGroupsFromPath");
var replaceGroupMarks = /* @__PURE__ */ __name((paths, groups) => {
  for (let i = groups.length - 1; i >= 0; i--) {
    const [mark] = groups[i];
    for (let j = paths.length - 1; j >= 0; j--) {
      if (paths[j].includes(mark)) {
        paths[j] = paths[j].replace(mark, groups[i][1]);
        break;
      }
    }
  }
  return paths;
}, "replaceGroupMarks");
var patternCache = {};
var getPattern = /* @__PURE__ */ __name((label, next) => {
  if (label === "*") {
    return "*";
  }
  const match2 = label.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
  if (match2) {
    const cacheKey = `${label}#${next}`;
    if (!patternCache[cacheKey]) {
      if (match2[2]) {
        patternCache[cacheKey] = next && next[0] !== ":" && next[0] !== "*" ? [cacheKey, match2[1], new RegExp(`^${match2[2]}(?=/${next})`)] : [label, match2[1], new RegExp(`^${match2[2]}$`)];
      } else {
        patternCache[cacheKey] = [label, match2[1], true];
      }
    }
    return patternCache[cacheKey];
  }
  return null;
}, "getPattern");
var tryDecode = /* @__PURE__ */ __name((str, decoder) => {
  try {
    return decoder(str);
  } catch {
    return str.replace(/(?:%[0-9A-Fa-f]{2})+/g, (match2) => {
      try {
        return decoder(match2);
      } catch {
        return match2;
      }
    });
  }
}, "tryDecode");
var tryDecodeURI = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURI), "tryDecodeURI");
var getPath = /* @__PURE__ */ __name((request) => {
  const url = request.url;
  const start = url.indexOf("/", url.indexOf(":") + 4);
  let i = start;
  for (; i < url.length; i++) {
    const charCode = url.charCodeAt(i);
    if (charCode === 37) {
      const queryIndex = url.indexOf("?", i);
      const hashIndex = url.indexOf("#", i);
      const end = queryIndex === -1 ? hashIndex === -1 ? void 0 : hashIndex : hashIndex === -1 ? queryIndex : Math.min(queryIndex, hashIndex);
      const path = url.slice(start, end);
      return tryDecodeURI(path.includes("%25") ? path.replace(/%25/g, "%2525") : path);
    } else if (charCode === 63 || charCode === 35) {
      break;
    }
  }
  return url.slice(start, i);
}, "getPath");
var getPathNoStrict = /* @__PURE__ */ __name((request) => {
  const result = getPath(request);
  return result.length > 1 && result.at(-1) === "/" ? result.slice(0, -1) : result;
}, "getPathNoStrict");
var mergePath = /* @__PURE__ */ __name((base, sub, ...rest) => {
  if (rest.length) {
    sub = mergePath(sub, ...rest);
  }
  return `${base?.[0] === "/" ? "" : "/"}${base}${sub === "/" ? "" : `${base?.at(-1) === "/" ? "" : "/"}${sub?.[0] === "/" ? sub.slice(1) : sub}`}`;
}, "mergePath");
var checkOptionalParameter = /* @__PURE__ */ __name((path) => {
  if (path.charCodeAt(path.length - 1) !== 63 || !path.includes(":")) {
    return null;
  }
  const segments = path.split("/");
  const results = [];
  let basePath = "";
  segments.forEach((segment) => {
    if (segment !== "" && !/\:/.test(segment)) {
      basePath += "/" + segment;
    } else if (/\:/.test(segment)) {
      if (/\?/.test(segment)) {
        if (results.length === 0 && basePath === "") {
          results.push("/");
        } else {
          results.push(basePath);
        }
        const optionalSegment = segment.replace("?", "");
        basePath += "/" + optionalSegment;
        results.push(basePath);
      } else {
        basePath += "/" + segment;
      }
    }
  });
  return results.filter((v, i, a) => a.indexOf(v) === i);
}, "checkOptionalParameter");
var _decodeURI = /* @__PURE__ */ __name((value) => {
  if (!/[%+]/.test(value)) {
    return value;
  }
  if (value.indexOf("+") !== -1) {
    value = value.replace(/\+/g, " ");
  }
  return value.indexOf("%") !== -1 ? tryDecode(value, decodeURIComponent_) : value;
}, "_decodeURI");
var _getQueryParam = /* @__PURE__ */ __name((url, key, multiple) => {
  let encoded;
  if (!multiple && key && !/[%+]/.test(key)) {
    let keyIndex2 = url.indexOf("?", 8);
    if (keyIndex2 === -1) {
      return void 0;
    }
    if (!url.startsWith(key, keyIndex2 + 1)) {
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    while (keyIndex2 !== -1) {
      const trailingKeyCode = url.charCodeAt(keyIndex2 + key.length + 1);
      if (trailingKeyCode === 61) {
        const valueIndex = keyIndex2 + key.length + 2;
        const endIndex = url.indexOf("&", valueIndex);
        return _decodeURI(url.slice(valueIndex, endIndex === -1 ? void 0 : endIndex));
      } else if (trailingKeyCode == 38 || isNaN(trailingKeyCode)) {
        return "";
      }
      keyIndex2 = url.indexOf(`&${key}`, keyIndex2 + 1);
    }
    encoded = /[%+]/.test(url);
    if (!encoded) {
      return void 0;
    }
  }
  const results = {};
  encoded ??= /[%+]/.test(url);
  let keyIndex = url.indexOf("?", 8);
  while (keyIndex !== -1) {
    const nextKeyIndex = url.indexOf("&", keyIndex + 1);
    let valueIndex = url.indexOf("=", keyIndex);
    if (valueIndex > nextKeyIndex && nextKeyIndex !== -1) {
      valueIndex = -1;
    }
    let name = url.slice(
      keyIndex + 1,
      valueIndex === -1 ? nextKeyIndex === -1 ? void 0 : nextKeyIndex : valueIndex
    );
    if (encoded) {
      name = _decodeURI(name);
    }
    keyIndex = nextKeyIndex;
    if (name === "") {
      continue;
    }
    let value;
    if (valueIndex === -1) {
      value = "";
    } else {
      value = url.slice(valueIndex + 1, nextKeyIndex === -1 ? void 0 : nextKeyIndex);
      if (encoded) {
        value = _decodeURI(value);
      }
    }
    if (multiple) {
      if (!(results[name] && Array.isArray(results[name]))) {
        results[name] = [];
      }
      ;
      results[name].push(value);
    } else {
      results[name] ??= value;
    }
  }
  return key ? results[key] : results;
}, "_getQueryParam");
var getQueryParam = _getQueryParam;
var getQueryParams = /* @__PURE__ */ __name((url, key) => {
  return _getQueryParam(url, key, true);
}, "getQueryParams");
var decodeURIComponent_ = decodeURIComponent;

// node_modules/hono/dist/request.js
var tryDecodeURIComponent = /* @__PURE__ */ __name((str) => tryDecode(str, decodeURIComponent_), "tryDecodeURIComponent");
var HonoRequest = class {
  static {
    __name(this, "HonoRequest");
  }
  /**
   * `.raw` can get the raw Request object.
   *
   * @see {@link https://hono.dev/docs/api/request#raw}
   *
   * @example
   * ```ts
   * // For Cloudflare Workers
   * app.post('/', async (c) => {
   *   const metadata = c.req.raw.cf?.hostMetadata?
   *   ...
   * })
   * ```
   */
  raw;
  #validatedData;
  // Short name of validatedData
  #matchResult;
  routeIndex = 0;
  /**
   * `.path` can get the pathname of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#path}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const pathname = c.req.path // `/about/me`
   * })
   * ```
   */
  path;
  bodyCache = {};
  constructor(request, path = "/", matchResult = [[]]) {
    this.raw = request;
    this.path = path;
    this.#matchResult = matchResult;
    this.#validatedData = {};
  }
  param(key) {
    return key ? this.#getDecodedParam(key) : this.#getAllDecodedParams();
  }
  #getDecodedParam(key) {
    const paramKey = this.#matchResult[0][this.routeIndex][1][key];
    const param = this.#getParamValue(paramKey);
    return param && /\%/.test(param) ? tryDecodeURIComponent(param) : param;
  }
  #getAllDecodedParams() {
    const decoded = {};
    const keys = Object.keys(this.#matchResult[0][this.routeIndex][1]);
    for (const key of keys) {
      const value = this.#getParamValue(this.#matchResult[0][this.routeIndex][1][key]);
      if (value !== void 0) {
        decoded[key] = /\%/.test(value) ? tryDecodeURIComponent(value) : value;
      }
    }
    return decoded;
  }
  #getParamValue(paramKey) {
    return this.#matchResult[1] ? this.#matchResult[1][paramKey] : paramKey;
  }
  query(key) {
    return getQueryParam(this.url, key);
  }
  queries(key) {
    return getQueryParams(this.url, key);
  }
  header(name) {
    if (name) {
      return this.raw.headers.get(name) ?? void 0;
    }
    const headerData = {};
    this.raw.headers.forEach((value, key) => {
      headerData[key] = value;
    });
    return headerData;
  }
  async parseBody(options) {
    return parseBody(this, options);
  }
  #cachedBody = /* @__PURE__ */ __name((key) => {
    const { bodyCache, raw: raw2 } = this;
    const cachedBody = bodyCache[key];
    if (cachedBody) {
      return cachedBody;
    }
    const anyCachedKey = Object.keys(bodyCache)[0];
    if (anyCachedKey) {
      return bodyCache[anyCachedKey].then((body) => {
        if (anyCachedKey === "json") {
          body = JSON.stringify(body);
        }
        return new Response(body)[key]();
      });
    }
    return bodyCache[key] = raw2[key]();
  }, "#cachedBody");
  /**
   * `.json()` can parse Request body of type `application/json`
   *
   * @see {@link https://hono.dev/docs/api/request#json}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.json()
   * })
   * ```
   */
  json() {
    return this.#cachedBody("text").then((text) => JSON.parse(text));
  }
  /**
   * `.text()` can parse Request body of type `text/plain`
   *
   * @see {@link https://hono.dev/docs/api/request#text}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.text()
   * })
   * ```
   */
  text() {
    return this.#cachedBody("text");
  }
  /**
   * `.arrayBuffer()` parse Request body as an `ArrayBuffer`
   *
   * @see {@link https://hono.dev/docs/api/request#arraybuffer}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.arrayBuffer()
   * })
   * ```
   */
  arrayBuffer() {
    return this.#cachedBody("arrayBuffer");
  }
  /**
   * `.bytes()` parses the request body as a `Uint8Array`.
   *
   * @see {@link https://hono.dev/docs/api/request#bytes}
   *
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.bytes()
   * })
   * ```
   */
  bytes() {
    return this.#cachedBody("arrayBuffer").then((buffer) => new Uint8Array(buffer));
  }
  /**
   * Parses the request body as a `Blob`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.blob();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#blob
   */
  blob() {
    return this.#cachedBody("blob");
  }
  /**
   * Parses the request body as `FormData`.
   * @example
   * ```ts
   * app.post('/entry', async (c) => {
   *   const body = await c.req.formData();
   * });
   * ```
   * @see https://hono.dev/docs/api/request#formdata
   */
  formData() {
    return this.#cachedBody("formData");
  }
  /**
   * Adds validated data to the request.
   *
   * @param target - The target of the validation.
   * @param data - The validated data to add.
   */
  addValidatedData(target, data) {
    this.#validatedData[target] = data;
  }
  valid(target) {
    return this.#validatedData[target];
  }
  /**
   * `.url()` can get the request url strings.
   *
   * @see {@link https://hono.dev/docs/api/request#url}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const url = c.req.url // `http://localhost:8787/about/me`
   *   ...
   * })
   * ```
   */
  get url() {
    return this.raw.url;
  }
  /**
   * `.method()` can get the method name of the request.
   *
   * @see {@link https://hono.dev/docs/api/request#method}
   *
   * @example
   * ```ts
   * app.get('/about/me', (c) => {
   *   const method = c.req.method // `GET`
   * })
   * ```
   */
  get method() {
    return this.raw.method;
  }
  get [GET_MATCH_RESULT]() {
    return this.#matchResult;
  }
  /**
   * `.matchedRoutes()` can return a matched route in the handler
   *
   * @deprecated
   *
   * Use matchedRoutes helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#matchedroutes}
   *
   * @example
   * ```ts
   * app.use('*', async function logger(c, next) {
   *   await next()
   *   c.req.matchedRoutes.forEach(({ handler, method, path }, i) => {
   *     const name = handler.name || (handler.length < 2 ? '[handler]' : '[middleware]')
   *     console.log(
   *       method,
   *       ' ',
   *       path,
   *       ' '.repeat(Math.max(10 - path.length, 0)),
   *       name,
   *       i === c.req.routeIndex ? '<- respond from here' : ''
   *     )
   *   })
   * })
   * ```
   */
  get matchedRoutes() {
    return this.#matchResult[0].map(([[, route]]) => route);
  }
  /**
   * `routePath()` can retrieve the path registered within the handler
   *
   * @deprecated
   *
   * Use routePath helper defined in "hono/route" instead.
   *
   * @see {@link https://hono.dev/docs/api/request#routepath}
   *
   * @example
   * ```ts
   * app.get('/posts/:id', (c) => {
   *   return c.json({ path: c.req.routePath })
   * })
   * ```
   */
  get routePath() {
    return this.#matchResult[0].map(([[, route]]) => route)[this.routeIndex].path;
  }
};

// node_modules/hono/dist/utils/html.js
init_modules_watch_stub();
var HtmlEscapedCallbackPhase = {
  Stringify: 1,
  BeforeStream: 2,
  Stream: 3
};
var raw = /* @__PURE__ */ __name((value, callbacks) => {
  const escapedString = new String(value);
  escapedString.isEscaped = true;
  escapedString.callbacks = callbacks;
  return escapedString;
}, "raw");
var resolveCallback = /* @__PURE__ */ __name(async (str, phase, preserveCallbacks, context, buffer) => {
  if (typeof str === "object" && !(str instanceof String)) {
    if (!(str instanceof Promise)) {
      str = str.toString();
    }
    if (str instanceof Promise) {
      str = await str;
    }
  }
  const callbacks = str.callbacks;
  if (!callbacks?.length) {
    return Promise.resolve(str);
  }
  if (buffer) {
    buffer[0] += str;
  } else {
    buffer = [str];
  }
  const resStr = Promise.all(callbacks.map((c) => c({ phase, buffer, context }))).then(
    (res) => Promise.all(
      res.filter(Boolean).map((str2) => resolveCallback(str2, phase, false, context, buffer))
    ).then(() => buffer[0])
  );
  if (preserveCallbacks) {
    return raw(await resStr, callbacks);
  } else {
    return resStr;
  }
}, "resolveCallback");

// node_modules/hono/dist/context.js
var TEXT_PLAIN = "text/plain; charset=UTF-8";
var setDefaultContentType = /* @__PURE__ */ __name((contentType, headers) => {
  return {
    "Content-Type": contentType,
    ...headers
  };
}, "setDefaultContentType");
var createResponseInstance = /* @__PURE__ */ __name((body, init) => new Response(body, init), "createResponseInstance");
var Context = class {
  static {
    __name(this, "Context");
  }
  #rawRequest;
  #req;
  /**
   * `.env` can get bindings (environment variables, secrets, KV namespaces, D1 database, R2 bucket etc.) in Cloudflare Workers.
   *
   * @see {@link https://hono.dev/docs/api/context#env}
   *
   * @example
   * ```ts
   * // Environment object for Cloudflare Workers
   * app.get('*', async c => {
   *   const counter = c.env.COUNTER
   * })
   * ```
   */
  env = {};
  #var;
  finalized = false;
  /**
   * `.error` can get the error object from the middleware if the Handler throws an error.
   *
   * @see {@link https://hono.dev/docs/api/context#error}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   await next()
   *   if (c.error) {
   *     // do something...
   *   }
   * })
   * ```
   */
  error;
  #status;
  #executionCtx;
  #res;
  #layout;
  #renderer;
  #notFoundHandler;
  #preparedHeaders;
  #matchResult;
  #path;
  /**
   * Creates an instance of the Context class.
   *
   * @param req - The Request object.
   * @param options - Optional configuration options for the context.
   */
  constructor(req, options) {
    this.#rawRequest = req;
    if (options) {
      this.#executionCtx = options.executionCtx;
      this.env = options.env;
      this.#notFoundHandler = options.notFoundHandler;
      this.#path = options.path;
      this.#matchResult = options.matchResult;
    }
  }
  /**
   * `.req` is the instance of {@link HonoRequest}.
   */
  get req() {
    this.#req ??= new HonoRequest(this.#rawRequest, this.#path, this.#matchResult);
    return this.#req;
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#event}
   * The FetchEvent associated with the current request.
   *
   * @throws Will throw an error if the context does not have a FetchEvent.
   */
  get event() {
    if (this.#executionCtx && "respondWith" in this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no FetchEvent");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#executionctx}
   * The ExecutionContext associated with the current request.
   *
   * @throws Will throw an error if the context does not have an ExecutionContext.
   */
  get executionCtx() {
    if (this.#executionCtx) {
      return this.#executionCtx;
    } else {
      throw Error("This context has no ExecutionContext");
    }
  }
  /**
   * @see {@link https://hono.dev/docs/api/context#res}
   * The Response object for the current request.
   */
  get res() {
    return this.#res ||= createResponseInstance(null, {
      headers: this.#preparedHeaders ??= new Headers()
    });
  }
  /**
   * Sets the Response object for the current request.
   *
   * @param _res - The Response object to set.
   */
  set res(_res) {
    if (this.#res && _res) {
      _res = createResponseInstance(_res.body, _res);
      for (const [k, v] of this.#res.headers.entries()) {
        if (k === "content-type") {
          continue;
        }
        if (k === "set-cookie") {
          const cookies = this.#res.headers.getSetCookie();
          _res.headers.delete("set-cookie");
          for (const cookie of cookies) {
            _res.headers.append("set-cookie", cookie);
          }
        } else {
          _res.headers.set(k, v);
        }
      }
    }
    this.#res = _res;
    this.finalized = true;
  }
  /**
   * `.render()` can create a response within a layout.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   return c.render('Hello!')
   * })
   * ```
   */
  render = /* @__PURE__ */ __name((...args) => {
    this.#renderer ??= (content) => this.html(content);
    return this.#renderer(...args);
  }, "render");
  /**
   * Sets the layout for the response.
   *
   * @param layout - The layout to set.
   * @returns The layout function.
   */
  setLayout = /* @__PURE__ */ __name((layout) => this.#layout = layout, "setLayout");
  /**
   * Gets the current layout for the response.
   *
   * @returns The current layout function.
   */
  getLayout = /* @__PURE__ */ __name(() => this.#layout, "getLayout");
  /**
   * `.setRenderer()` can set the layout in the custom middleware.
   *
   * @see {@link https://hono.dev/docs/api/context#render-setrenderer}
   *
   * @example
   * ```tsx
   * app.use('*', async (c, next) => {
   *   c.setRenderer((content) => {
   *     return c.html(
   *       <html>
   *         <body>
   *           <p>{content}</p>
   *         </body>
   *       </html>
   *     )
   *   })
   *   await next()
   * })
   * ```
   */
  setRenderer = /* @__PURE__ */ __name((renderer) => {
    this.#renderer = renderer;
  }, "setRenderer");
  /**
   * `.header()` can set headers.
   *
   * @see {@link https://hono.dev/docs/api/context#header}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  header = /* @__PURE__ */ __name((name, value, options) => {
    if (this.finalized) {
      this.#res = createResponseInstance(this.#res.body, this.#res);
    }
    const headers = this.#res ? this.#res.headers : this.#preparedHeaders ??= new Headers();
    if (value === void 0) {
      headers.delete(name);
    } else if (options?.append) {
      headers.append(name, value);
    } else {
      headers.set(name, value);
    }
  }, "header");
  status = /* @__PURE__ */ __name((status) => {
    this.#status = status;
  }, "status");
  /**
   * `.set()` can set the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.use('*', async (c, next) => {
   *   c.set('message', 'Hono is hot!!')
   *   await next()
   * })
   * ```
   */
  set = /* @__PURE__ */ __name((key, value) => {
    this.#var ??= /* @__PURE__ */ new Map();
    this.#var.set(key, value);
  }, "set");
  /**
   * `.get()` can use the value specified by the key.
   *
   * @see {@link https://hono.dev/docs/api/context#set-get}
   *
   * @example
   * ```ts
   * app.get('/', (c) => {
   *   const message = c.get('message')
   *   return c.text(`The message is "${message}"`)
   * })
   * ```
   */
  get = /* @__PURE__ */ __name((key) => {
    return this.#var ? this.#var.get(key) : void 0;
  }, "get");
  /**
   * `.var` can access the value of a variable.
   *
   * @see {@link https://hono.dev/docs/api/context#var}
   *
   * @example
   * ```ts
   * const result = c.var.client.oneMethod()
   * ```
   */
  // c.var.propName is a read-only
  get var() {
    if (!this.#var) {
      return {};
    }
    return Object.fromEntries(this.#var);
  }
  #newResponse(data, arg, headers) {
    const responseHeaders = this.#res ? new Headers(this.#res.headers) : this.#preparedHeaders ?? new Headers();
    if (typeof arg === "object" && "headers" in arg) {
      const argHeaders = arg.headers instanceof Headers ? arg.headers : new Headers(arg.headers);
      for (const [key, value] of argHeaders) {
        if (key.toLowerCase() === "set-cookie") {
          responseHeaders.append(key, value);
        } else {
          responseHeaders.set(key, value);
        }
      }
    }
    if (headers) {
      for (const [k, v] of Object.entries(headers)) {
        if (typeof v === "string") {
          responseHeaders.set(k, v);
        } else {
          responseHeaders.delete(k);
          for (const v2 of v) {
            responseHeaders.append(k, v2);
          }
        }
      }
    }
    const status = typeof arg === "number" ? arg : arg?.status ?? this.#status;
    return createResponseInstance(data, { status, headers: responseHeaders });
  }
  newResponse = /* @__PURE__ */ __name((...args) => this.#newResponse(...args), "newResponse");
  /**
   * `.body()` can return the HTTP response.
   * You can set headers with `.header()` and set HTTP status code with `.status`.
   * This can also be set in `.text()`, `.json()` and so on.
   *
   * @see {@link https://hono.dev/docs/api/context#body}
   *
   * @example
   * ```ts
   * app.get('/welcome', (c) => {
   *   // Set headers
   *   c.header('X-Message', 'Hello!')
   *   c.header('Content-Type', 'text/plain')
   *   // Set HTTP status code
   *   c.status(201)
   *
   *   // Return the response body
   *   return c.body('Thank you for coming')
   * })
   * ```
   */
  body = /* @__PURE__ */ __name((data, arg, headers) => this.#newResponse(data, arg, headers), "body");
  /**
   * `.text()` can render text as `Content-Type:text/plain`.
   *
   * @see {@link https://hono.dev/docs/api/context#text}
   *
   * @example
   * ```ts
   * app.get('/say', (c) => {
   *   return c.text('Hello!')
   * })
   * ```
   */
  text = /* @__PURE__ */ __name((text, arg, headers) => {
    return !this.#preparedHeaders && !this.#status && !arg && !headers && !this.finalized ? new Response(text) : this.#newResponse(
      text,
      arg,
      setDefaultContentType(TEXT_PLAIN, headers)
    );
  }, "text");
  /**
   * `.json()` can render JSON as `Content-Type:application/json`.
   *
   * @see {@link https://hono.dev/docs/api/context#json}
   *
   * @example
   * ```ts
   * app.get('/api', (c) => {
   *   return c.json({ message: 'Hello!' })
   * })
   * ```
   */
  json = /* @__PURE__ */ __name((object, arg, headers) => {
    return this.#newResponse(
      JSON.stringify(object),
      arg,
      setDefaultContentType("application/json", headers)
    );
  }, "json");
  html = /* @__PURE__ */ __name((html, arg, headers) => {
    const res = /* @__PURE__ */ __name((html2) => this.#newResponse(html2, arg, setDefaultContentType("text/html; charset=UTF-8", headers)), "res");
    return typeof html === "object" ? resolveCallback(html, HtmlEscapedCallbackPhase.Stringify, false, {}).then(res) : res(html);
  }, "html");
  /**
   * `.redirect()` can Redirect, default status code is 302.
   *
   * @see {@link https://hono.dev/docs/api/context#redirect}
   *
   * @example
   * ```ts
   * app.get('/redirect', (c) => {
   *   return c.redirect('/')
   * })
   * app.get('/redirect-permanently', (c) => {
   *   return c.redirect('/', 301)
   * })
   * ```
   */
  redirect = /* @__PURE__ */ __name((location, status) => {
    const locationString = String(location);
    this.header(
      "Location",
      // Multibyes should be encoded
      // eslint-disable-next-line no-control-regex
      !/[^\x00-\xFF]/.test(locationString) ? locationString : encodeURI(locationString)
    );
    return this.newResponse(null, status ?? 302);
  }, "redirect");
  /**
   * `.notFound()` can return the Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/context#notfound}
   *
   * @example
   * ```ts
   * app.get('/notfound', (c) => {
   *   return c.notFound()
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name(() => {
    this.#notFoundHandler ??= () => createResponseInstance();
    return this.#notFoundHandler(this);
  }, "notFound");
};

// node_modules/hono/dist/router.js
init_modules_watch_stub();
var METHOD_NAME_ALL = "ALL";
var METHOD_NAME_ALL_LOWERCASE = "all";
var METHODS = ["get", "post", "put", "delete", "options", "patch"];
var MESSAGE_MATCHER_IS_ALREADY_BUILT = "Can not add a route since the matcher is already built.";
var UnsupportedPathError = class extends Error {
  static {
    __name(this, "UnsupportedPathError");
  }
};

// node_modules/hono/dist/utils/constants.js
init_modules_watch_stub();
var COMPOSED_HANDLER = "__COMPOSED_HANDLER";

// node_modules/hono/dist/hono-base.js
var notFoundHandler = /* @__PURE__ */ __name((c) => {
  return c.text("404 Not Found", 404);
}, "notFoundHandler");
var errorHandler = /* @__PURE__ */ __name((err, c) => {
  if ("getResponse" in err) {
    const res = err.getResponse();
    return c.newResponse(res.body, res);
  }
  console.error(err);
  return c.text("Internal Server Error", 500);
}, "errorHandler");
var Hono = class _Hono {
  static {
    __name(this, "_Hono");
  }
  get;
  post;
  put;
  delete;
  options;
  patch;
  all;
  on;
  use;
  /*
    This class is like an abstract class and does not have a router.
    To use it, inherit the class and implement router in the constructor.
  */
  router;
  getPath;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  _basePath = "/";
  #path = "/";
  routes = [];
  constructor(options = {}) {
    const allMethods = [...METHODS, METHOD_NAME_ALL_LOWERCASE];
    allMethods.forEach((method) => {
      this[method] = (args1, ...args) => {
        if (typeof args1 === "string") {
          this.#path = args1;
        } else {
          this.#addRoute(method, this.#path, args1);
        }
        args.forEach((handler) => {
          this.#addRoute(method, this.#path, handler);
        });
        return this;
      };
    });
    this.on = (method, path, ...handlers) => {
      for (const p of [path].flat()) {
        this.#path = p;
        for (const m of [method].flat()) {
          handlers.map((handler) => {
            this.#addRoute(m.toUpperCase(), this.#path, handler);
          });
        }
      }
      return this;
    };
    this.use = (arg1, ...handlers) => {
      if (typeof arg1 === "string") {
        this.#path = arg1;
      } else {
        this.#path = "*";
        handlers.unshift(arg1);
      }
      handlers.forEach((handler) => {
        this.#addRoute(METHOD_NAME_ALL, this.#path, handler);
      });
      return this;
    };
    const { strict, ...optionsWithoutStrict } = options;
    Object.assign(this, optionsWithoutStrict);
    this.getPath = strict ?? true ? options.getPath ?? getPath : getPathNoStrict;
  }
  #clone() {
    const clone = new _Hono({
      router: this.router,
      getPath: this.getPath
    });
    clone.errorHandler = this.errorHandler;
    clone.#notFoundHandler = this.#notFoundHandler;
    clone.routes = this.routes;
    return clone;
  }
  #notFoundHandler = notFoundHandler;
  // Cannot use `#` because it requires visibility at JavaScript runtime.
  errorHandler = errorHandler;
  /**
   * `.route()` allows grouping other Hono instance in routes.
   *
   * @see {@link https://hono.dev/docs/api/routing#grouping}
   *
   * @param {string} path - base Path
   * @param {Hono} app - other Hono instance
   * @returns {Hono} routed Hono instance
   *
   * @example
   * ```ts
   * const app = new Hono()
   * const app2 = new Hono()
   *
   * app2.get("/user", (c) => c.text("user"))
   * app.route("/api", app2) // GET /api/user
   * ```
   */
  route(path, app2) {
    const subApp = this.basePath(path);
    app2.routes.map((r) => {
      let handler;
      if (app2.errorHandler === errorHandler) {
        handler = r.handler;
      } else {
        handler = /* @__PURE__ */ __name(async (c, next) => (await compose([], app2.errorHandler)(c, () => r.handler(c, next))).res, "handler");
        handler[COMPOSED_HANDLER] = r.handler;
      }
      subApp.#addRoute(r.method, r.path, handler, r.basePath);
    });
    return this;
  }
  /**
   * `.basePath()` allows base paths to be specified.
   *
   * @see {@link https://hono.dev/docs/api/routing#base-path}
   *
   * @param {string} path - base Path
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * const api = new Hono().basePath('/api')
   * ```
   */
  basePath(path) {
    const subApp = this.#clone();
    subApp._basePath = mergePath(this._basePath, path);
    return subApp;
  }
  /**
   * `.onError()` handles an error and returns a customized Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#error-handling}
   *
   * @param {ErrorHandler} handler - request Handler for error
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.onError((err, c) => {
   *   console.error(`${err}`)
   *   return c.text('Custom Error Message', 500)
   * })
   * ```
   */
  onError = /* @__PURE__ */ __name((handler) => {
    this.errorHandler = handler;
    return this;
  }, "onError");
  /**
   * `.notFound()` allows you to customize a Not Found Response.
   *
   * @see {@link https://hono.dev/docs/api/hono#not-found}
   *
   * @param {NotFoundHandler} handler - request handler for not-found
   * @returns {Hono} changed Hono instance
   *
   * @example
   * ```ts
   * app.notFound((c) => {
   *   return c.text('Custom 404 Message', 404)
   * })
   * ```
   */
  notFound = /* @__PURE__ */ __name((handler) => {
    this.#notFoundHandler = handler;
    return this;
  }, "notFound");
  /**
   * `.mount()` allows you to mount applications built with other frameworks into your Hono application.
   *
   * @see {@link https://hono.dev/docs/api/hono#mount}
   *
   * @param {string} path - base Path
   * @param {Function} applicationHandler - other Request Handler
   * @param {MountOptions} [options] - options of `.mount()`
   * @returns {Hono} mounted Hono instance
   *
   * @example
   * ```ts
   * import { Router as IttyRouter } from 'itty-router'
   * import { Hono } from 'hono'
   * // Create itty-router application
   * const ittyRouter = IttyRouter()
   * // GET /itty-router/hello
   * ittyRouter.get('/hello', () => new Response('Hello from itty-router'))
   *
   * const app = new Hono()
   * app.mount('/itty-router', ittyRouter.handle)
   * ```
   *
   * @example
   * ```ts
   * const app = new Hono()
   * // Send the request to another application without modification.
   * app.mount('/app', anotherApp, {
   *   replaceRequest: (req) => req,
   * })
   * ```
   */
  mount(path, applicationHandler, options) {
    let replaceRequest;
    let optionHandler;
    if (options) {
      if (typeof options === "function") {
        optionHandler = options;
      } else {
        optionHandler = options.optionHandler;
        if (options.replaceRequest === false) {
          replaceRequest = /* @__PURE__ */ __name((request) => request, "replaceRequest");
        } else {
          replaceRequest = options.replaceRequest;
        }
      }
    }
    const getOptions = optionHandler ? (c) => {
      const options2 = optionHandler(c);
      return Array.isArray(options2) ? options2 : [options2];
    } : (c) => {
      let executionContext = void 0;
      try {
        executionContext = c.executionCtx;
      } catch {
      }
      return [c.env, executionContext];
    };
    replaceRequest ||= (() => {
      const mergedPath = mergePath(this._basePath, path);
      const pathPrefixLength = mergedPath === "/" ? 0 : mergedPath.length;
      return (request) => {
        const url = new URL(request.url);
        url.pathname = this.getPath(request).slice(pathPrefixLength) || "/";
        return new Request(url, request);
      };
    })();
    const handler = /* @__PURE__ */ __name(async (c, next) => {
      const res = await applicationHandler(replaceRequest(c.req.raw), ...getOptions(c));
      if (res) {
        return res;
      }
      await next();
    }, "handler");
    this.#addRoute(METHOD_NAME_ALL, mergePath(path, "*"), handler);
    return this;
  }
  #addRoute(method, path, handler, baseRoutePath) {
    method = method.toUpperCase();
    path = mergePath(this._basePath, path);
    const r = {
      basePath: baseRoutePath !== void 0 ? mergePath(this._basePath, baseRoutePath) : this._basePath,
      path,
      method,
      handler
    };
    this.router.add(method, path, [handler, r]);
    this.routes.push(r);
  }
  #handleError(err, c) {
    if (err instanceof Error) {
      return this.errorHandler(err, c);
    }
    throw err;
  }
  #dispatch(request, executionCtx, env, method) {
    if (method === "HEAD") {
      return (async () => new Response(null, await this.#dispatch(request, executionCtx, env, "GET")))();
    }
    const path = this.getPath(request, { env });
    const matchResult = this.router.match(method, path);
    const c = new Context(request, {
      path,
      matchResult,
      env,
      executionCtx,
      notFoundHandler: this.#notFoundHandler
    });
    if (matchResult[0].length === 1) {
      let res;
      try {
        res = matchResult[0][0][0][0](c, async () => {
          c.res = await this.#notFoundHandler(c);
        });
      } catch (err) {
        return this.#handleError(err, c);
      }
      return res instanceof Promise ? res.then(
        (resolved) => resolved || (c.finalized ? c.res : this.#notFoundHandler(c))
      ).catch((err) => this.#handleError(err, c)) : res ?? this.#notFoundHandler(c);
    }
    const composed = compose(matchResult[0], this.errorHandler, this.#notFoundHandler);
    return (async () => {
      try {
        const context = await composed(c);
        if (!context.finalized) {
          throw new Error(
            "Context is not finalized. Did you forget to return a Response object or `await next()`?"
          );
        }
        return context.res;
      } catch (err) {
        return this.#handleError(err, c);
      }
    })();
  }
  /**
   * `.fetch()` will be entry point of your app.
   *
   * @see {@link https://hono.dev/docs/api/hono#fetch}
   *
   * @param {Request} request - request Object of request
   * @param {Env} Env - env Object
   * @param {ExecutionContext} - context of execution
   * @returns {Response | Promise<Response>} response of request
   *
   */
  fetch = /* @__PURE__ */ __name((request, ...rest) => {
    return this.#dispatch(request, rest[1], rest[0], request.method);
  }, "fetch");
  /**
   * `.request()` is a useful method for testing.
   * You can pass a URL or pathname to send a GET request.
   * app will return a Response object.
   * ```ts
   * test('GET /hello is ok', async () => {
   *   const res = await app.request('/hello')
   *   expect(res.status).toBe(200)
   * })
   * ```
   * @see https://hono.dev/docs/api/hono#request
   */
  request = /* @__PURE__ */ __name((input, requestInit, Env, executionCtx) => {
    if (input instanceof Request) {
      return this.fetch(requestInit ? new Request(input, requestInit) : input, Env, executionCtx);
    }
    input = input.toString();
    return this.fetch(
      new Request(
        /^https?:\/\//.test(input) ? input : `http://localhost${mergePath("/", input)}`,
        requestInit
      ),
      Env,
      executionCtx
    );
  }, "request");
  /**
   * `.fire()` automatically adds a global fetch event listener.
   * This can be useful for environments that adhere to the Service Worker API, such as non-ES module Cloudflare Workers.
   * @deprecated
   * Use `fire` from `hono/service-worker` instead.
   * ```ts
   * import { Hono } from 'hono'
   * import { fire } from 'hono/service-worker'
   *
   * const app = new Hono()
   * // ...
   * fire(app)
   * ```
   * @see https://hono.dev/docs/api/hono#fire
   * @see https://developer.mozilla.org/en-US/docs/Web/API/Service_Worker_API
   * @see https://developers.cloudflare.com/workers/reference/migrate-to-module-workers/
   */
  fire = /* @__PURE__ */ __name(() => {
    addEventListener("fetch", (event) => {
      event.respondWith(this.#dispatch(event.request, event, void 0, event.request.method));
    });
  }, "fire");
};

// node_modules/hono/dist/router/reg-exp-router/index.js
init_modules_watch_stub();

// node_modules/hono/dist/router/reg-exp-router/router.js
init_modules_watch_stub();

// node_modules/hono/dist/router/reg-exp-router/matcher.js
init_modules_watch_stub();
var emptyParam = [];
function match(method, path) {
  const matchers = this.buildAllMatchers();
  const match2 = /* @__PURE__ */ __name(((method2, path2) => {
    const matcher = matchers[method2] || matchers[METHOD_NAME_ALL];
    const staticMatch = matcher[2][path2];
    if (staticMatch) {
      return staticMatch;
    }
    const match3 = path2.match(matcher[0]);
    if (!match3) {
      return [[], emptyParam];
    }
    const index = match3.indexOf("", 1);
    return [matcher[1][index], match3];
  }), "match2");
  this.match = match2;
  return match2(method, path);
}
__name(match, "match");

// node_modules/hono/dist/router/reg-exp-router/node.js
init_modules_watch_stub();
var LABEL_REG_EXP_STR = "[^/]+";
var ONLY_WILDCARD_REG_EXP_STR = ".*";
var TAIL_WILDCARD_REG_EXP_STR = "(?:|/.*)";
var PATH_ERROR = /* @__PURE__ */ Symbol();
var regExpMetaChars = new Set(".\\+*[^]$()");
function compareKey(a, b) {
  if (a.length === 1) {
    return b.length === 1 ? a < b ? -1 : 1 : -1;
  }
  if (b.length === 1) {
    return 1;
  }
  if (a === ONLY_WILDCARD_REG_EXP_STR || a === TAIL_WILDCARD_REG_EXP_STR) {
    return 1;
  } else if (b === ONLY_WILDCARD_REG_EXP_STR || b === TAIL_WILDCARD_REG_EXP_STR) {
    return -1;
  }
  if (a === LABEL_REG_EXP_STR) {
    return 1;
  } else if (b === LABEL_REG_EXP_STR) {
    return -1;
  }
  return a.length === b.length ? a < b ? -1 : 1 : b.length - a.length;
}
__name(compareKey, "compareKey");
var Node = class _Node {
  static {
    __name(this, "_Node");
  }
  #index;
  #varIndex;
  #children = /* @__PURE__ */ Object.create(null);
  insert(tokens, index, paramMap, context, pathErrorCheckOnly) {
    if (tokens.length === 0) {
      if (this.#index !== void 0) {
        throw PATH_ERROR;
      }
      if (pathErrorCheckOnly) {
        return;
      }
      this.#index = index;
      return;
    }
    const [token, ...restTokens] = tokens;
    const pattern = token === "*" ? restTokens.length === 0 ? ["", "", ONLY_WILDCARD_REG_EXP_STR] : ["", "", LABEL_REG_EXP_STR] : token === "/*" ? ["", "", TAIL_WILDCARD_REG_EXP_STR] : token.match(/^\:([^\{\}]+)(?:\{(.+)\})?$/);
    let node;
    if (pattern) {
      const name = pattern[1];
      let regexpStr = pattern[2] || LABEL_REG_EXP_STR;
      if (name && pattern[2]) {
        if (regexpStr === ".*") {
          throw PATH_ERROR;
        }
        regexpStr = regexpStr.replace(/^\((?!\?:)(?=[^)]+\)$)/, "(?:");
        if (/\((?!\?:)/.test(regexpStr)) {
          throw PATH_ERROR;
        }
      }
      node = this.#children[regexpStr];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[regexpStr] = new _Node();
        if (name !== "") {
          node.#varIndex = context.varIndex++;
        }
      }
      if (!pathErrorCheckOnly && name !== "") {
        paramMap.push([name, node.#varIndex]);
      }
    } else {
      node = this.#children[token];
      if (!node) {
        if (Object.keys(this.#children).some(
          (k) => k.length > 1 && k !== ONLY_WILDCARD_REG_EXP_STR && k !== TAIL_WILDCARD_REG_EXP_STR
        )) {
          throw PATH_ERROR;
        }
        if (pathErrorCheckOnly) {
          return;
        }
        node = this.#children[token] = new _Node();
      }
    }
    node.insert(restTokens, index, paramMap, context, pathErrorCheckOnly);
  }
  buildRegExpStr() {
    const childKeys = Object.keys(this.#children).sort(compareKey);
    const strList = childKeys.map((k) => {
      const c = this.#children[k];
      return (typeof c.#varIndex === "number" ? `(${k})@${c.#varIndex}` : regExpMetaChars.has(k) ? `\\${k}` : k) + c.buildRegExpStr();
    });
    if (typeof this.#index === "number") {
      strList.unshift(`#${this.#index}`);
    }
    if (strList.length === 0) {
      return "";
    }
    if (strList.length === 1) {
      return strList[0];
    }
    return "(?:" + strList.join("|") + ")";
  }
};

// node_modules/hono/dist/router/reg-exp-router/trie.js
init_modules_watch_stub();
var Trie = class {
  static {
    __name(this, "Trie");
  }
  #context = { varIndex: 0 };
  #root = new Node();
  insert(path, index, pathErrorCheckOnly) {
    const paramAssoc = [];
    const groups = [];
    for (let i = 0; ; ) {
      let replaced = false;
      path = path.replace(/\{[^}]+\}/g, (m) => {
        const mark = `@\\${i}`;
        groups[i] = [mark, m];
        i++;
        replaced = true;
        return mark;
      });
      if (!replaced) {
        break;
      }
    }
    const tokens = path.match(/(?::[^\/]+)|(?:\/\*$)|./g) || [];
    for (let i = groups.length - 1; i >= 0; i--) {
      const [mark] = groups[i];
      for (let j = tokens.length - 1; j >= 0; j--) {
        if (tokens[j].indexOf(mark) !== -1) {
          tokens[j] = tokens[j].replace(mark, groups[i][1]);
          break;
        }
      }
    }
    this.#root.insert(tokens, index, paramAssoc, this.#context, pathErrorCheckOnly);
    return paramAssoc;
  }
  buildRegExp() {
    let regexp = this.#root.buildRegExpStr();
    if (regexp === "") {
      return [/^$/, [], []];
    }
    let captureIndex = 0;
    const indexReplacementMap = [];
    const paramReplacementMap = [];
    regexp = regexp.replace(/#(\d+)|@(\d+)|\.\*\$/g, (_, handlerIndex, paramIndex) => {
      if (handlerIndex !== void 0) {
        indexReplacementMap[++captureIndex] = Number(handlerIndex);
        return "$()";
      }
      if (paramIndex !== void 0) {
        paramReplacementMap[Number(paramIndex)] = ++captureIndex;
        return "";
      }
      return "";
    });
    return [new RegExp(`^${regexp}`), indexReplacementMap, paramReplacementMap];
  }
};

// node_modules/hono/dist/router/reg-exp-router/router.js
var nullMatcher = [/^$/, [], /* @__PURE__ */ Object.create(null)];
var wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
function buildWildcardRegExp(path) {
  return wildcardRegExpCache[path] ??= new RegExp(
    path === "*" ? "" : `^${path.replace(
      /\/\*$|([.\\+*[^\]$()])/g,
      (_, metaChar) => metaChar ? `\\${metaChar}` : "(?:|/.*)"
    )}$`
  );
}
__name(buildWildcardRegExp, "buildWildcardRegExp");
function clearWildcardRegExpCache() {
  wildcardRegExpCache = /* @__PURE__ */ Object.create(null);
}
__name(clearWildcardRegExpCache, "clearWildcardRegExpCache");
function buildMatcherFromPreprocessedRoutes(routes) {
  const trie = new Trie();
  const handlerData = [];
  if (routes.length === 0) {
    return nullMatcher;
  }
  const routesWithStaticPathFlag = routes.map(
    (route) => [!/\*|\/:/.test(route[0]), ...route]
  ).sort(
    ([isStaticA, pathA], [isStaticB, pathB]) => isStaticA ? 1 : isStaticB ? -1 : pathA.length - pathB.length
  );
  const staticMap = /* @__PURE__ */ Object.create(null);
  for (let i = 0, j = -1, len = routesWithStaticPathFlag.length; i < len; i++) {
    const [pathErrorCheckOnly, path, handlers] = routesWithStaticPathFlag[i];
    if (pathErrorCheckOnly) {
      staticMap[path] = [handlers.map(([h]) => [h, /* @__PURE__ */ Object.create(null)]), emptyParam];
    } else {
      j++;
    }
    let paramAssoc;
    try {
      paramAssoc = trie.insert(path, j, pathErrorCheckOnly);
    } catch (e) {
      throw e === PATH_ERROR ? new UnsupportedPathError(path) : e;
    }
    if (pathErrorCheckOnly) {
      continue;
    }
    handlerData[j] = handlers.map(([h, paramCount]) => {
      const paramIndexMap = /* @__PURE__ */ Object.create(null);
      paramCount -= 1;
      for (; paramCount >= 0; paramCount--) {
        const [key, value] = paramAssoc[paramCount];
        paramIndexMap[key] = value;
      }
      return [h, paramIndexMap];
    });
  }
  const [regexp, indexReplacementMap, paramReplacementMap] = trie.buildRegExp();
  for (let i = 0, len = handlerData.length; i < len; i++) {
    for (let j = 0, len2 = handlerData[i].length; j < len2; j++) {
      const map = handlerData[i][j]?.[1];
      if (!map) {
        continue;
      }
      const keys = Object.keys(map);
      for (let k = 0, len3 = keys.length; k < len3; k++) {
        map[keys[k]] = paramReplacementMap[map[keys[k]]];
      }
    }
  }
  const handlerMap = [];
  for (const i in indexReplacementMap) {
    handlerMap[i] = handlerData[indexReplacementMap[i]];
  }
  return [regexp, handlerMap, staticMap];
}
__name(buildMatcherFromPreprocessedRoutes, "buildMatcherFromPreprocessedRoutes");
function findMiddleware(middleware, path) {
  if (!middleware) {
    return void 0;
  }
  for (const k of Object.keys(middleware).sort((a, b) => b.length - a.length)) {
    if (buildWildcardRegExp(k).test(path)) {
      return [...middleware[k]];
    }
  }
  return void 0;
}
__name(findMiddleware, "findMiddleware");
var RegExpRouter = class {
  static {
    __name(this, "RegExpRouter");
  }
  name = "RegExpRouter";
  #middleware;
  #routes;
  constructor() {
    this.#middleware = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
    this.#routes = { [METHOD_NAME_ALL]: /* @__PURE__ */ Object.create(null) };
  }
  add(method, path, handler) {
    const middleware = this.#middleware;
    const routes = this.#routes;
    if (!middleware || !routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    if (!middleware[method]) {
      ;
      [middleware, routes].forEach((handlerMap) => {
        handlerMap[method] = /* @__PURE__ */ Object.create(null);
        Object.keys(handlerMap[METHOD_NAME_ALL]).forEach((p) => {
          handlerMap[method][p] = [...handlerMap[METHOD_NAME_ALL][p]];
        });
      });
    }
    if (path === "/*") {
      path = "*";
    }
    const paramCount = (path.match(/\/:/g) || []).length;
    if (/\*$/.test(path)) {
      const re = buildWildcardRegExp(path);
      if (method === METHOD_NAME_ALL) {
        Object.keys(middleware).forEach((m) => {
          middleware[m][path] ||= findMiddleware(middleware[m], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
        });
      } else {
        middleware[method][path] ||= findMiddleware(middleware[method], path) || findMiddleware(middleware[METHOD_NAME_ALL], path) || [];
      }
      Object.keys(middleware).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(middleware[m]).forEach((p) => {
            re.test(p) && middleware[m][p].push([handler, paramCount]);
          });
        }
      });
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          Object.keys(routes[m]).forEach(
            (p) => re.test(p) && routes[m][p].push([handler, paramCount])
          );
        }
      });
      return;
    }
    const paths = checkOptionalParameter(path) || [path];
    for (let i = 0, len = paths.length; i < len; i++) {
      const path2 = paths[i];
      Object.keys(routes).forEach((m) => {
        if (method === METHOD_NAME_ALL || method === m) {
          routes[m][path2] ||= [
            ...findMiddleware(middleware[m], path2) || findMiddleware(middleware[METHOD_NAME_ALL], path2) || []
          ];
          routes[m][path2].push([handler, paramCount - len + i + 1]);
        }
      });
    }
  }
  match = match;
  buildAllMatchers() {
    const matchers = /* @__PURE__ */ Object.create(null);
    Object.keys(this.#routes).concat(Object.keys(this.#middleware)).forEach((method) => {
      matchers[method] ||= this.#buildMatcher(method);
    });
    this.#middleware = this.#routes = void 0;
    clearWildcardRegExpCache();
    return matchers;
  }
  #buildMatcher(method) {
    const routes = [];
    let hasOwnRoute = method === METHOD_NAME_ALL;
    [this.#middleware, this.#routes].forEach((r) => {
      const ownRoute = r[method] ? Object.keys(r[method]).map((path) => [path, r[method][path]]) : [];
      if (ownRoute.length !== 0) {
        hasOwnRoute ||= true;
        routes.push(...ownRoute);
      } else if (method !== METHOD_NAME_ALL) {
        routes.push(
          ...Object.keys(r[METHOD_NAME_ALL]).map((path) => [path, r[METHOD_NAME_ALL][path]])
        );
      }
    });
    if (!hasOwnRoute) {
      return null;
    } else {
      return buildMatcherFromPreprocessedRoutes(routes);
    }
  }
};

// node_modules/hono/dist/router/reg-exp-router/prepared-router.js
init_modules_watch_stub();

// node_modules/hono/dist/router/smart-router/index.js
init_modules_watch_stub();

// node_modules/hono/dist/router/smart-router/router.js
init_modules_watch_stub();
var SmartRouter = class {
  static {
    __name(this, "SmartRouter");
  }
  name = "SmartRouter";
  #routers = [];
  #routes = [];
  constructor(init) {
    this.#routers = init.routers;
  }
  add(method, path, handler) {
    if (!this.#routes) {
      throw new Error(MESSAGE_MATCHER_IS_ALREADY_BUILT);
    }
    this.#routes.push([method, path, handler]);
  }
  match(method, path) {
    if (!this.#routes) {
      throw new Error("Fatal error");
    }
    const routers = this.#routers;
    const routes = this.#routes;
    const len = routers.length;
    let i = 0;
    let res;
    for (; i < len; i++) {
      const router = routers[i];
      try {
        for (let i2 = 0, len2 = routes.length; i2 < len2; i2++) {
          router.add(...routes[i2]);
        }
        res = router.match(method, path);
      } catch (e) {
        if (e instanceof UnsupportedPathError) {
          continue;
        }
        throw e;
      }
      this.match = router.match.bind(router);
      this.#routers = [router];
      this.#routes = void 0;
      break;
    }
    if (i === len) {
      throw new Error("Fatal error");
    }
    this.name = `SmartRouter + ${this.activeRouter.name}`;
    return res;
  }
  get activeRouter() {
    if (this.#routes || this.#routers.length !== 1) {
      throw new Error("No active router has been determined yet.");
    }
    return this.#routers[0];
  }
};

// node_modules/hono/dist/router/trie-router/index.js
init_modules_watch_stub();

// node_modules/hono/dist/router/trie-router/router.js
init_modules_watch_stub();

// node_modules/hono/dist/router/trie-router/node.js
init_modules_watch_stub();
var emptyParams = /* @__PURE__ */ Object.create(null);
var hasChildren = /* @__PURE__ */ __name((children) => {
  for (const _ in children) {
    return true;
  }
  return false;
}, "hasChildren");
var Node2 = class _Node2 {
  static {
    __name(this, "_Node");
  }
  #methods;
  #children;
  #patterns;
  #order = 0;
  #params = emptyParams;
  constructor(method, handler, children) {
    this.#children = children || /* @__PURE__ */ Object.create(null);
    this.#methods = [];
    if (method && handler) {
      const m = /* @__PURE__ */ Object.create(null);
      m[method] = { handler, possibleKeys: [], score: 0 };
      this.#methods = [m];
    }
    this.#patterns = [];
  }
  insert(method, path, handler) {
    this.#order = ++this.#order;
    let curNode = this;
    const parts = splitRoutingPath(path);
    const possibleKeys = [];
    for (let i = 0, len = parts.length; i < len; i++) {
      const p = parts[i];
      const nextP = parts[i + 1];
      const pattern = getPattern(p, nextP);
      const key = Array.isArray(pattern) ? pattern[0] : p;
      if (key in curNode.#children) {
        curNode = curNode.#children[key];
        if (pattern) {
          possibleKeys.push(pattern[1]);
        }
        continue;
      }
      curNode.#children[key] = new _Node2();
      if (pattern) {
        curNode.#patterns.push(pattern);
        possibleKeys.push(pattern[1]);
      }
      curNode = curNode.#children[key];
    }
    curNode.#methods.push({
      [method]: {
        handler,
        possibleKeys: possibleKeys.filter((v, i, a) => a.indexOf(v) === i),
        score: this.#order
      }
    });
    return curNode;
  }
  #pushHandlerSets(handlerSets, node, method, nodeParams, params) {
    for (let i = 0, len = node.#methods.length; i < len; i++) {
      const m = node.#methods[i];
      const handlerSet = m[method] || m[METHOD_NAME_ALL];
      const processedSet = {};
      if (handlerSet !== void 0) {
        handlerSet.params = /* @__PURE__ */ Object.create(null);
        handlerSets.push(handlerSet);
        if (nodeParams !== emptyParams || params && params !== emptyParams) {
          for (let i2 = 0, len2 = handlerSet.possibleKeys.length; i2 < len2; i2++) {
            const key = handlerSet.possibleKeys[i2];
            const processed = processedSet[handlerSet.score];
            handlerSet.params[key] = params?.[key] && !processed ? params[key] : nodeParams[key] ?? params?.[key];
            processedSet[handlerSet.score] = true;
          }
        }
      }
    }
  }
  search(method, path) {
    const handlerSets = [];
    this.#params = emptyParams;
    const curNode = this;
    let curNodes = [curNode];
    const parts = splitPath(path);
    const curNodesQueue = [];
    const len = parts.length;
    let partOffsets = null;
    for (let i = 0; i < len; i++) {
      const part = parts[i];
      const isLast = i === len - 1;
      const tempNodes = [];
      for (let j = 0, len2 = curNodes.length; j < len2; j++) {
        const node = curNodes[j];
        const nextNode = node.#children[part];
        if (nextNode) {
          nextNode.#params = node.#params;
          if (isLast) {
            if (nextNode.#children["*"]) {
              this.#pushHandlerSets(handlerSets, nextNode.#children["*"], method, node.#params);
            }
            this.#pushHandlerSets(handlerSets, nextNode, method, node.#params);
          } else {
            tempNodes.push(nextNode);
          }
        }
        for (let k = 0, len3 = node.#patterns.length; k < len3; k++) {
          const pattern = node.#patterns[k];
          const params = node.#params === emptyParams ? {} : { ...node.#params };
          if (pattern === "*") {
            const astNode = node.#children["*"];
            if (astNode) {
              this.#pushHandlerSets(handlerSets, astNode, method, node.#params);
              astNode.#params = params;
              tempNodes.push(astNode);
            }
            continue;
          }
          const [key, name, matcher] = pattern;
          if (!part && !(matcher instanceof RegExp)) {
            continue;
          }
          const child = node.#children[key];
          if (matcher instanceof RegExp) {
            if (partOffsets === null) {
              partOffsets = new Array(len);
              let offset = path[0] === "/" ? 1 : 0;
              for (let p = 0; p < len; p++) {
                partOffsets[p] = offset;
                offset += parts[p].length + 1;
              }
            }
            const restPathString = path.substring(partOffsets[i]);
            const m = matcher.exec(restPathString);
            if (m) {
              params[name] = m[0];
              this.#pushHandlerSets(handlerSets, child, method, node.#params, params);
              if (m[0].length === restPathString.length && child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  node.#params,
                  params
                );
              }
              if (hasChildren(child.#children)) {
                child.#params = params;
                const componentCount = m[0].match(/\//)?.length ?? 0;
                const targetCurNodes = curNodesQueue[componentCount] ||= [];
                targetCurNodes.push(child);
              }
              continue;
            }
          }
          if (matcher === true || matcher.test(part)) {
            params[name] = part;
            if (isLast) {
              this.#pushHandlerSets(handlerSets, child, method, params, node.#params);
              if (child.#children["*"]) {
                this.#pushHandlerSets(
                  handlerSets,
                  child.#children["*"],
                  method,
                  params,
                  node.#params
                );
              }
            } else {
              child.#params = params;
              tempNodes.push(child);
            }
          }
        }
      }
      const shifted = curNodesQueue.shift();
      curNodes = shifted ? tempNodes.concat(shifted) : tempNodes;
    }
    if (handlerSets.length > 1) {
      handlerSets.sort((a, b) => {
        return a.score - b.score;
      });
    }
    return [handlerSets.map(({ handler, params }) => [handler, params])];
  }
};

// node_modules/hono/dist/router/trie-router/router.js
var TrieRouter = class {
  static {
    __name(this, "TrieRouter");
  }
  name = "TrieRouter";
  #node;
  constructor() {
    this.#node = new Node2();
  }
  add(method, path, handler) {
    const results = checkOptionalParameter(path);
    if (results) {
      for (let i = 0, len = results.length; i < len; i++) {
        this.#node.insert(method, results[i], handler);
      }
      return;
    }
    this.#node.insert(method, path, handler);
  }
  match(method, path) {
    return this.#node.search(method, path);
  }
};

// node_modules/hono/dist/hono.js
var Hono2 = class extends Hono {
  static {
    __name(this, "Hono");
  }
  /**
   * Creates an instance of the Hono class.
   *
   * @param options - Optional configuration options for the Hono instance.
   */
  constructor(options = {}) {
    super(options);
    this.router = options.router ?? new SmartRouter({
      routers: [new RegExpRouter(), new TrieRouter()]
    });
  }
};

// src/routes/auth.ts
init_modules_watch_stub();
init_jwt();

// src/services/wechat.ts
init_modules_watch_stub();
function createWechatAPI(env) {
  return {
    async code2Session(code) {
      const url = `https://api.weixin.qq.com/sns/jscode2session?appid=${env.WECHAT_APPID}&secret=${env.WECHAT_SECRET}&js_code=${code}&grant_type=authorization_code`;
      const res = await fetch(url);
      return res.json();
    }
  };
}
__name(createWechatAPI, "createWechatAPI");

// src/middleware/auth.ts
init_modules_watch_stub();
init_jwt();
async function authMiddleware(c, next) {
  const auth2 = c.req.header("Authorization");
  if (!auth2?.startsWith("Bearer ")) {
    return c.json({ success: false, error: "ERR_AUTH_TOKEN_INVALID" }, 401);
  }
  const token = auth2.slice(7);
  const payload = await verify(token, c.env.JWT_SECRET);
  if (!payload) {
    return c.json({ success: false, error: "ERR_AUTH_TOKEN_EXPIRED" }, 401);
  }
  c.set("user", { userId: payload.userId, openid: payload.openid });
  await next();
}
__name(authMiddleware, "authMiddleware");

// src/routes/auth.ts
var auth = new Hono2();
auth.post("/auth/login", async (c) => {
  const { code } = await c.req.json();
  if (!code) {
    return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400);
  }
  let openid;
  if (c.env.ENVIRONMENT === "development") {
    openid = `dev_${code}`;
  } else {
    const wechat = createWechatAPI(c.env);
    const session = await wechat.code2Session(code);
    if (!session.openid) {
      return c.json({ success: false, error: "ERR_AUTH_REFRESH_FAILED" }, 401);
    }
    openid = session.openid;
  }
  let user = await c.env.DB.prepare("SELECT id FROM users WHERE wechat_openid = ?").bind(openid).first();
  if (!user) {
    const result = await c.env.DB.prepare("INSERT INTO users (wechat_openid, nickname) VALUES (?, ?)").bind(openid, "").run();
    user = { id: Number(result.meta.last_row_id) };
  }
  const accessToken = await sign({ userId: user.id, openid }, c.env.JWT_SECRET, 7200);
  const refreshToken = await sign({ userId: user.id, openid, type: "refresh" }, c.env.JWT_SECRET, 2592e3);
  await c.env.KV.put(`refresh:${user.id}`, refreshToken, { expirationTtl: 2592e3 });
  const tokenFamily = crypto.randomUUID();
  await c.env.KV.put(`refresh:${user.id}`, JSON.stringify({ token: refreshToken, family: tokenFamily }), { expirationTtl: 2592e3 });
  return c.json({ success: true, data: { access_token: accessToken, refresh_token: refreshToken, user_id: user.id, token_family: tokenFamily } });
});
auth.post("/auth/refresh", async (c) => {
  const { refresh_token } = await c.req.json();
  if (!refresh_token) {
    return c.json({ success: false, error: "ERR_AUTH_REFRESH_FAILED" }, 401);
  }
  const { verify: verify2 } = await Promise.resolve().then(() => (init_jwt(), jwt_exports));
  const payload = await verify2(refresh_token, c.env.JWT_SECRET);
  if (!payload || payload.type !== "refresh") {
    return c.json({ success: false, error: "ERR_AUTH_REFRESH_FAILED" }, 401);
  }
  const userId = payload.userId;
  const storedRaw = await c.env.KV.get(`refresh:${userId}`);
  if (!storedRaw) return c.json({ success: false, error: "ERR_AUTH_REFRESH_FAILED" }, 401);
  const stored = JSON.parse(storedRaw);
  if (stored.token !== refresh_token) {
    await c.env.KV.delete(`refresh:${userId}`);
    return c.json({ success: false, error: "ERR_AUTH_REFRESH_FAILED" }, 401);
  }
  await c.env.KV.delete(`refresh:${userId}`);
  const accessToken = await sign({ userId, openid: payload.openid }, c.env.JWT_SECRET, 7200);
  const newRefreshToken = await sign({ userId, openid: payload.openid, type: "refresh" }, c.env.JWT_SECRET, 2592e3);
  await c.env.KV.put(`refresh:${userId}`, JSON.stringify({ token: newRefreshToken, family: stored.family }), { expirationTtl: 2592e3 });
  return c.json({ success: true, data: { access_token: accessToken, refresh_token: newRefreshToken } });
});
auth.post("/auth/logout", authMiddleware, async (c) => {
  const { userId } = c.var.user;
  await c.env.KV.delete(`refresh:${userId}`);
  return c.json({ success: true, data: {} });
});
auth.get("/user/profile", authMiddleware, async (c) => {
  const { userId } = c.var.user;
  const user = await c.env.DB.prepare("SELECT id, nickname, avatar, created_at FROM users WHERE id = ?").bind(userId).first();
  if (!user) {
    return c.json({ success: false, error: "ERR_AUTH_TOKEN_INVALID" }, 404);
  }
  return c.json({ success: true, data: user });
});
auth.put("/user/profile", authMiddleware, async (c) => {
  const { userId } = c.var.user;
  const { nickname, avatar } = await c.req.json();
  await c.env.DB.prepare("UPDATE users SET nickname = COALESCE(?, nickname), avatar = COALESCE(?, avatar), updated_at = datetime('now') WHERE id = ?").bind(nickname || null, avatar || null, userId).run();
  return c.json({ success: true, data: {} });
});

// src/routes/houses.ts
init_modules_watch_stub();

// src/utils/invite.ts
init_modules_watch_stub();
function generateInviteCode() {
  return Math.floor(1e5 + Math.random() * 9e5).toString();
}
__name(generateInviteCode, "generateInviteCode");
function inviteCodeExpiresAt() {
  const d = /* @__PURE__ */ new Date();
  d.setDate(d.getDate() + 7);
  return d.toISOString();
}
__name(inviteCodeExpiresAt, "inviteCodeExpiresAt");
function isExpired(expiresAt) {
  return new Date(expiresAt).getTime() < Date.now();
}
__name(isExpired, "isExpired");

// src/utils/role.ts
init_modules_watch_stub();
function hasMinRole(userRole, minRole) {
  const hierarchy = {
    "\u7CFB\u7EDF\u7BA1\u7406\u5458": 3,
    "\u5BDD\u5BA4\u957F": 2,
    "\u666E\u901A\u6210\u5458": 1
  };
  return (hierarchy[userRole] ?? 0) >= (hierarchy[minRole] ?? 0);
}
__name(hasMinRole, "hasMinRole");

// src/routes/houses.ts
var houses = new Hono2();
houses.use("*", authMiddleware);
houses.post("/houses", async (c) => {
  const { userId } = c.var.user;
  const { name, address } = await c.req.json();
  if (!name) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400);
  const inviteCode = generateInviteCode();
  const expiresAt = inviteCodeExpiresAt();
  const result = await c.env.DB.prepare(
    "INSERT INTO houses (name, address, invite_code, invite_code_expires_at, creator_id) VALUES (?, ?, ?, ?, ?)"
  ).bind(name, address || "", inviteCode, expiresAt, userId).run();
  const houseId = Number(result.meta.last_row_id);
  await c.env.DB.prepare(
    "INSERT INTO members (house_id, user_id, role) VALUES (?, ?, '\u5BDD\u5BA4\u957F')"
  ).bind(houseId, userId).run();
  const house = await c.env.DB.prepare("SELECT * FROM houses WHERE id = ?").bind(houseId).first();
  return c.json({ success: true, data: house });
});
houses.get("/houses", async (c) => {
  const { userId } = c.var.user;
  const list = await c.env.DB.prepare(`
    SELECT h.* FROM houses h
    JOIN members m ON m.house_id = h.id
    WHERE m.user_id = ? AND m.status = 'active'
  `).bind(userId).all();
  return c.json({ success: true, data: list.results });
});
houses.get("/user/houses", async (c) => {
  const { userId } = c.var.user;
  const list = await c.env.DB.prepare(`
    SELECT h.*, m.role FROM houses h
    JOIN members m ON m.house_id = h.id
    WHERE m.user_id = ? AND m.status = 'active'
  `).bind(userId).all();
  return c.json({ success: true, data: list.results });
});
houses.get("/houses/:id", async (c) => {
  const { userId } = c.var.user;
  const houseId = Number(c.req.param("id"));
  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(houseId, userId).first();
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  const house = await c.env.DB.prepare("SELECT * FROM houses WHERE id = ?").bind(houseId).first();
  return c.json({ success: true, data: house });
});
houses.put("/houses/:id", async (c) => {
  const { userId } = c.var.user;
  const houseId = Number(c.req.param("id"));
  const { name, address } = await c.req.json();
  const member = await c.env.DB.prepare(
    "SELECT role FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(houseId, userId).first();
  if (!member || !hasMinRole(member.role, "\u5BDD\u5BA4\u957F")) {
    return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  }
  await c.env.DB.prepare(
    "UPDATE houses SET name = COALESCE(?, name), address = COALESCE(?, address), updated_at = datetime('now') WHERE id = ?"
  ).bind(name || null, address || null, houseId).run();
  const house = await c.env.DB.prepare("SELECT * FROM houses WHERE id = ?").bind(houseId).first();
  return c.json({ success: true, data: house });
});
houses.delete("/houses/:id", async (c) => {
  const { userId } = c.var.user;
  const houseId = Number(c.req.param("id"));
  const member = await c.env.DB.prepare(
    "SELECT role FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(houseId, userId).first();
  if (!member || !hasMinRole(member.role, "\u5BDD\u5BA4\u957F")) {
    return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  }
  const settlementIds = await c.env.DB.prepare("SELECT id FROM settlements WHERE house_id = ?").bind(houseId).all();
  for (const s of settlementIds.results) {
    const itemIds = await c.env.DB.prepare("SELECT id FROM settlement_items WHERE settlement_id = ?").bind(s.id).all();
    for (const it of itemIds.results) {
      await c.env.DB.prepare("DELETE FROM settlement_challenges WHERE item_id = ?").bind(it.id).run();
      await c.env.DB.prepare("DELETE FROM partial_payments WHERE item_id = ?").bind(it.id).run();
    }
    await c.env.DB.prepare("DELETE FROM settlement_items WHERE settlement_id = ?").bind(s.id).run();
  }
  await c.env.DB.prepare("DELETE FROM settlements WHERE house_id = ?").bind(houseId).run();
  const billIds = await c.env.DB.prepare("SELECT id FROM bills WHERE house_id = ?").bind(houseId).all();
  for (const b of billIds.results) {
    await c.env.DB.prepare("DELETE FROM splits WHERE bill_id = ?").bind(b.id).run();
  }
  await c.env.DB.prepare("DELETE FROM bills WHERE house_id = ?").bind(houseId).run();
  await c.env.DB.prepare("DELETE FROM categories WHERE house_id = ?").bind(houseId).run();
  await c.env.DB.prepare("DELETE FROM bill_templates WHERE house_id = ?").bind(houseId).run();
  await c.env.DB.prepare("DELETE FROM cron_tasks WHERE house_id = ?").bind(houseId).run();
  await c.env.DB.prepare("DELETE FROM operation_logs WHERE house_id = ?").bind(houseId).run();
  await c.env.DB.prepare("DELETE FROM members WHERE house_id = ?").bind(houseId).run();
  await c.env.DB.prepare("DELETE FROM houses WHERE id = ?").bind(houseId).run();
  await c.env.DB.prepare(`
    INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id)
    VALUES (?, ?, 'house_deleted', 'houses', ?)
  `).bind(houseId, userId, houseId).run();
  return c.json({ success: true, data: {} });
});
houses.get("/houses/:id/members", async (c) => {
  const { userId } = c.var.user;
  const houseId = Number(c.req.param("id"));
  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(houseId, userId).first();
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  const members = await c.env.DB.prepare(`
    SELECT m.id, m.user_id, m.role, m.joined_at, u.nickname, u.avatar
    FROM members m JOIN users u ON u.id = m.user_id
    WHERE m.house_id = ? AND m.status = 'active'
    ORDER BY m.joined_at
  `).bind(houseId).all();
  return c.json({ success: true, data: members.results });
});
houses.post("/houses/:id/join", async (c) => {
  const { userId } = c.var.user;
  const houseId = Number(c.req.param("id"));
  const { code } = await c.req.json();
  const house = await c.env.DB.prepare("SELECT * FROM houses WHERE id = ?").bind(houseId).first();
  if (!house) return c.json({ success: false, error: "ERR_BILL_NOT_FOUND" }, 404);
  if (house.invite_code !== code) {
    return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  }
  if (isExpired(house.invite_code_expires_at)) {
    return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  }
  const existing = await c.env.DB.prepare(
    "SELECT id, status FROM members WHERE house_id = ? AND user_id = ?"
  ).bind(houseId, userId).first();
  if (existing) {
    if (existing.status === "active") {
      return c.json({ success: false, error: "ERR_BILL_DUPLICATE" }, 400);
    }
    await c.env.DB.prepare("UPDATE members SET status = 'active', left_at = NULL WHERE id = ?").bind(existing.id).run();
  } else {
    await c.env.DB.prepare(
      "INSERT INTO members (house_id, user_id, role) VALUES (?, ?, '\u666E\u901A\u6210\u5458')"
    ).bind(houseId, userId).run();
  }
  return c.json({ success: true, data: {} });
});
houses.post("/houses/:id/leave", async (c) => {
  const { userId } = c.var.user;
  const houseId = Number(c.req.param("id"));
  const member = await c.env.DB.prepare(
    "SELECT id, role FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(houseId, userId).first();
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  await c.env.DB.prepare(`
    UPDATE settlement_challenges SET status = 'timeout', handled_at = datetime('now')
    WHERE status = 'open' AND item_id IN (
      SELECT si.id FROM settlement_items si
      JOIN settlements s ON s.id = si.settlement_id
      WHERE s.house_id = ? AND (si.payer_id = ? OR si.payee_id = ?)
    )
  `).bind(houseId, userId, userId).run();
  await c.env.DB.prepare(`
    UPDATE settlement_items SET status = 'pending', version = version + 1, updated_at = datetime('now')
    WHERE status = 'disputed' AND (payer_id = ? OR payee_id = ?) AND id IN (
      SELECT item_id FROM settlement_challenges WHERE status = 'timeout'
    )
  `).bind(userId, userId).run();
  await c.env.DB.prepare(
    "UPDATE members SET status = 'left', left_at = datetime('now') WHERE id = ?"
  ).bind(member.id).run();
  await c.env.DB.prepare(`
    INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id)
    VALUES (?, ?, 'member_leave', 'members', ?)
  `).bind(houseId, userId, member.id).run();
  const pending = await c.env.DB.prepare(
    "SELECT COUNT(*) as cnt FROM settlements WHERE house_id = ? AND status = 'pending'"
  ).bind(houseId).first();
  return c.json({ success: true, data: { pending_settlements: pending?.cnt ?? 0 } });
});
houses.put("/houses/:id/members/:userId/role", async (c) => {
  const { userId: currentUserId } = c.var.user;
  const houseId = Number(c.req.param("id"));
  const targetUserId = Number(c.req.param("userId"));
  const { role } = await c.req.json();
  if (!["\u5BDD\u5BA4\u957F", "\u666E\u901A\u6210\u5458"].includes(role)) {
    return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400);
  }
  const currentMember = await c.env.DB.prepare(
    "SELECT role FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(houseId, currentUserId).first();
  if (!currentMember || !hasMinRole(currentMember.role, "\u5BDD\u5BA4\u957F")) {
    return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  }
  await c.env.DB.prepare(
    "UPDATE members SET role = ? WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(role, houseId, targetUserId).run();
  return c.json({ success: true, data: {} });
});
houses.delete("/houses/:id/members/:userId", async (c) => {
  const { userId: currentUserId } = c.var.user;
  const houseId = Number(c.req.param("id"));
  const targetUserId = Number(c.req.param("userId"));
  const currentMember = await c.env.DB.prepare(
    "SELECT role FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(houseId, currentUserId).first();
  if (!currentMember || !hasMinRole(currentMember.role, "\u5BDD\u5BA4\u957F")) {
    return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  }
  await c.env.DB.prepare(`
    UPDATE settlement_challenges SET status = 'timeout', handled_at = datetime('now')
    WHERE status = 'open' AND item_id IN (
      SELECT si.id FROM settlement_items si
      JOIN settlements s ON s.id = si.settlement_id
      WHERE s.house_id = ? AND (si.payer_id = ? OR si.payee_id = ?)
    )
  `).bind(houseId, targetUserId, targetUserId).run();
  await c.env.DB.prepare(`
    UPDATE settlement_items SET status = 'pending', version = version + 1, updated_at = datetime('now')
    WHERE status = 'disputed' AND (payer_id = ? OR payee_id = ?) AND id IN (
      SELECT item_id FROM settlement_challenges WHERE status = 'timeout'
    )
  `).bind(targetUserId, targetUserId).run();
  await c.env.DB.prepare(
    "UPDATE members SET status = 'left', left_at = datetime('now') WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(houseId, targetUserId).run();
  await c.env.DB.prepare(`
    INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id)
    VALUES (?, ?, 'member_removed', 'members', ?)
  `).bind(houseId, currentUserId, targetUserId).run();
  return c.json({ success: true, data: {} });
});
houses.get("/houses/:id/invite-code", async (c) => {
  const { userId } = c.var.user;
  const houseId = Number(c.req.param("id"));
  const member = await c.env.DB.prepare(
    "SELECT role FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(houseId, userId).first();
  if (!member || !hasMinRole(member.role, "\u5BDD\u5BA4\u957F")) {
    return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  }
  const house = await c.env.DB.prepare("SELECT invite_code, invite_code_expires_at FROM houses WHERE id = ?").bind(houseId).first();
  return c.json({ success: true, data: house });
});
houses.post("/houses/:id/invite-code/renew", async (c) => {
  const { userId } = c.var.user;
  const houseId = Number(c.req.param("id"));
  const member = await c.env.DB.prepare(
    "SELECT role FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(houseId, userId).first();
  if (!member || !hasMinRole(member.role, "\u5BDD\u5BA4\u957F")) {
    return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  }
  const newCode = generateInviteCode();
  const newExpires = inviteCodeExpiresAt();
  await c.env.DB.prepare(
    "UPDATE houses SET invite_code = ?, invite_code_expires_at = ? WHERE id = ?"
  ).bind(newCode, newExpires, houseId).run();
  return c.json({ success: true, data: { invite_code: newCode, invite_code_expires_at: newExpires } });
});

// src/routes/bills.ts
init_modules_watch_stub();

// src/algorithms/split.ts
init_modules_watch_stub();
function splitEqual(total, count) {
  const per = Math.floor(total / count);
  const remainder = total - per * count;
  return Array.from({ length: count }, (_, i) => per + (i < remainder ? 1 : 0));
}
__name(splitEqual, "splitEqual");
function splitByWeight(total, weights) {
  const sum = weights.reduce((a, b) => a + b, 0);
  if (sum === 0) return weights.map(() => 0);
  let remaining = total;
  const result = weights.map((w, i) => {
    const amount = i === weights.length - 1 ? remaining : Math.floor(w / sum * total);
    remaining -= amount;
    return Math.max(0, amount);
  });
  return result;
}
__name(splitByWeight, "splitByWeight");
function splitByDays(total, days) {
  return splitByWeight(total, days);
}
__name(splitByDays, "splitByDays");
function splitByUsage(total, usage) {
  return splitByWeight(total, usage);
}
__name(splitByUsage, "splitByUsage");
function splitByArea(total, areas) {
  return splitByWeight(total, areas);
}
__name(splitByArea, "splitByArea");
function splitByTier(total, usage, tiers) {
  const amounts = usage.map((u) => {
    let remaining2 = u;
    let cost = 0;
    for (const tier of tiers) {
      const used = Math.min(remaining2, tier.threshold);
      cost += used * tier.rate;
      remaining2 -= used;
      if (remaining2 <= 0) break;
    }
    return cost;
  });
  const sum = amounts.reduce((a, b) => a + b, 0);
  if (sum === 0) return usage.map(() => 0);
  const ratio = total / sum;
  let remaining = total;
  return amounts.map((a, i) => {
    const amount = i === amounts.length - 1 ? remaining : Math.floor(a * ratio);
    remaining -= amount;
    return Math.max(0, amount);
  });
}
__name(splitByTier, "splitByTier");

// src/routes/bills.ts
var bills = new Hono2();
bills.use("*", authMiddleware);
bills.post("/bills", async (c) => {
  const { userId } = c.var.user;
  const body = await c.req.json();
  if (!body.title || !body.total_amount || !body.split_type || !body.splits?.length) {
    return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400);
  }
  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(body.house_id, userId).first();
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  const params = body.splits.map((s) => s.parameter ?? 1);
  let amounts;
  switch (body.split_type) {
    case "\u5747\u644A":
      amounts = splitEqual(body.total_amount, body.splits.length);
      break;
    case "\u6743\u91CD":
      amounts = splitByWeight(body.total_amount, params);
      break;
    case "\u5929\u6570":
      amounts = splitByDays(body.total_amount, params);
      break;
    case "\u7528\u91CF":
      amounts = splitByUsage(body.total_amount, params);
      break;
    case "\u9762\u79EF":
      amounts = splitByArea(body.total_amount, params);
      break;
    case "\u9636\u68AF":
      if (!body.tiers) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400);
      amounts = splitByTier(body.total_amount, params, body.tiers);
      break;
    default:
      return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400);
  }
  const sum = amounts.reduce((a, b) => a + b, 0);
  if (sum !== body.total_amount) {
    amounts[amounts.length - 1] += body.total_amount - sum;
  }
  const billResult = await c.env.DB.prepare(`
    INSERT INTO bills (house_id, creator_id, title, total_amount, category_id, bill_date, receipt_image, note, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, '\u8349\u7A3F')
  `).bind(
    body.house_id,
    userId,
    body.title,
    body.total_amount,
    body.category_id ?? null,
    body.bill_date,
    body.receipt_image ?? null,
    body.note ?? ""
  ).run();
  const billId = Number(billResult.meta.last_row_id);
  const stmt = c.env.DB.prepare(`
    INSERT INTO splits (bill_id, user_id, amount, split_type, weight)
    VALUES (?, ?, ?, ?, ?)
  `);
  for (let i = 0; i < body.splits.length; i++) {
    await stmt.bind(billId, body.splits[i].user_id, amounts[i], body.split_type, body.splits[i].parameter ?? null).run();
  }
  if (body.house_id) {
    await c.env.DB.prepare(`
      INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id)
      VALUES (?, ?, 'create_bill', 'bills', ?)
    `).bind(body.house_id, userId, billId).run();
  }
  const bill = await c.env.DB.prepare("SELECT * FROM bills WHERE id = ?").bind(billId).first();
  const splits = await c.env.DB.prepare("SELECT * FROM splits WHERE bill_id = ?").bind(billId).all();
  return c.json({ success: true, data: { ...bill, splits: splits.results } });
});
bills.get("/bills", async (c) => {
  const { userId } = c.var.user;
  const houseId = c.req.query("house_id");
  const status = c.req.query("status");
  const categoryId = c.req.query("category_id");
  const keyword = c.req.query("keyword");
  const startDate = c.req.query("start_date");
  const endDate = c.req.query("end_date");
  const minAmount = c.req.query("min_amount");
  const maxAmount = c.req.query("max_amount");
  const cursor = c.req.query("cursor");
  const limit = Math.min(Number(c.req.query("limit")) || 20, 100);
  if (!houseId) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400);
  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(Number(houseId), userId).first();
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  let sql = "SELECT * FROM bills WHERE house_id = ?";
  const params = [Number(houseId)];
  if (status) {
    sql += " AND status = ?";
    params.push(status);
  }
  if (categoryId) {
    sql += " AND category_id = ?";
    params.push(Number(categoryId));
  }
  if (keyword) {
    sql += " AND title LIKE ?";
    params.push(`%${keyword}%`);
  }
  if (startDate) {
    sql += " AND bill_date >= ?";
    params.push(startDate);
  }
  if (endDate) {
    sql += " AND bill_date <= ?";
    params.push(endDate);
  }
  if (minAmount) {
    sql += " AND total_amount >= ?";
    params.push(Number(minAmount));
  }
  if (maxAmount) {
    sql += " AND total_amount <= ?";
    params.push(Number(maxAmount));
  }
  if (cursor) {
    sql += " AND id < ?";
    params.push(Number(cursor));
  }
  sql += " ORDER BY created_at DESC LIMIT ?";
  params.push(limit + 1);
  const result = await c.env.DB.prepare(sql).bind(...params).all();
  const hasMore = result.results.length > limit;
  const items = hasMore ? result.results.slice(0, limit) : result.results;
  const nextCursor = hasMore ? String(items[items.length - 1].id) : null;
  return c.json({ success: true, data: { items, next_cursor: nextCursor } });
});
bills.get("/bills/my", async (c) => {
  const { userId } = c.var.user;
  const houseId = c.req.query("house_id");
  if (!houseId) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400);
  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(Number(houseId), userId).first();
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  const bills2 = await c.env.DB.prepare(`
    SELECT DISTINCT b.* FROM bills b
    JOIN splits s ON s.bill_id = b.id
    WHERE b.house_id = ? AND s.user_id = ?
    ORDER BY b.created_at DESC
  `).bind(Number(houseId), userId).all();
  return c.json({ success: true, data: bills2.results });
});
bills.get("/bills/:id", async (c) => {
  const { userId } = c.var.user;
  const billId = Number(c.req.param("id"));
  const bill = await c.env.DB.prepare("SELECT * FROM bills WHERE id = ?").bind(billId).first();
  if (!bill) return c.json({ success: false, error: "ERR_BILL_NOT_FOUND" }, 404);
  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(bill.house_id, userId).first();
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  const splits = await c.env.DB.prepare(`
    SELECT s.*, u.nickname, u.avatar FROM splits s
    JOIN users u ON u.id = s.user_id
    WHERE s.bill_id = ? ORDER BY s.id
  `).bind(billId).all();
  return c.json({ success: true, data: { ...bill, splits: splits.results } });
});
bills.put("/bills/:id", async (c) => {
  const { userId } = c.var.user;
  const billId = Number(c.req.param("id"));
  const bill = await c.env.DB.prepare(
    "SELECT * FROM bills WHERE id = ? AND creator_id = ? AND status = '\u8349\u7A3F'"
  ).bind(billId, userId).first();
  if (!bill) return c.json({ success: false, error: "ERR_BILL_STATUS_INVALID" }, 400);
  const body = await c.req.json();
  if (body.title !== void 0 || body.total_amount !== void 0 || body.category_id !== void 0) {
    await c.env.DB.prepare(`
      UPDATE bills SET title = COALESCE(?, title), total_amount = COALESCE(?, total_amount),
        category_id = COALESCE(?, category_id), receipt_image = COALESCE(?, receipt_image),
        note = COALESCE(?, note), updated_at = datetime('now')
      WHERE id = ?
    `).bind(
      body.title ?? null,
      body.total_amount ?? null,
      body.category_id ?? null,
      body.receipt_image ?? null,
      body.note ?? null,
      billId
    ).run();
  }
  if (body.splits && body.split_type && body.total_amount) {
    await c.env.DB.prepare("DELETE FROM splits WHERE bill_id = ?").bind(billId).run();
    const params = body.splits.map((s) => s.parameter ?? 1);
    let amounts;
    switch (body.split_type) {
      case "\u5747\u644A":
        amounts = splitEqual(body.total_amount, body.splits.length);
        break;
      case "\u6743\u91CD":
        amounts = splitByWeight(body.total_amount, params);
        break;
      case "\u5929\u6570":
        amounts = splitByDays(body.total_amount, params);
        break;
      case "\u7528\u91CF":
        amounts = splitByUsage(body.total_amount, params);
        break;
      case "\u9762\u79EF":
        amounts = splitByArea(body.total_amount, params);
        break;
      case "\u9636\u68AF":
        amounts = splitByTier(body.total_amount, params, body.tiers ?? []);
        break;
      default:
        return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400);
    }
    const sum = amounts.reduce((a, b) => a + b, 0);
    if (sum !== body.total_amount) amounts[amounts.length - 1] += body.total_amount - sum;
    const stmt = c.env.DB.prepare("INSERT INTO splits (bill_id, user_id, amount, split_type, weight) VALUES (?, ?, ?, ?, ?)");
    for (let i = 0; i < body.splits.length; i++) {
      await stmt.bind(billId, body.splits[i].user_id, amounts[i], body.split_type, body.splits[i].parameter ?? null).run();
    }
  }
  const updated = await c.env.DB.prepare("SELECT * FROM bills WHERE id = ?").bind(billId).first();
  const splits = await c.env.DB.prepare("SELECT * FROM splits WHERE bill_id = ?").bind(billId).all();
  return c.json({ success: true, data: { ...updated, splits: splits.results } });
});
bills.delete("/bills/:id", async (c) => {
  const { userId } = c.var.user;
  const billId = Number(c.req.param("id"));
  const bill = await c.env.DB.prepare(
    "SELECT id, house_id FROM bills WHERE id = ? AND creator_id = ? AND status = '\u8349\u7A3F'"
  ).bind(billId, userId).first();
  if (!bill) return c.json({ success: false, error: "ERR_BILL_STATUS_INVALID" }, 400);
  await c.env.DB.prepare("DELETE FROM splits WHERE bill_id = ?").bind(billId).run();
  await c.env.DB.prepare("DELETE FROM bills WHERE id = ?").bind(billId).run();
  await c.env.DB.prepare(`
    INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id)
    VALUES (?, ?, 'delete_bill', 'bills', ?)
  `).bind(bill.house_id, userId, billId).run();
  return c.json({ success: true, data: {} });
});
bills.post("/r2/upload", async (c) => {
  const { userId } = c.var.user;
  const body = await c.req.parseBody();
  const file = body.file;
  if (!file) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400);
  const key = `receipts/${userId}/${Date.now()}_${file.name}`;
  await c.env.R2.put(key, await file.arrayBuffer(), {
    httpMetadata: { contentType: file.type }
  });
  return c.json({ success: true, data: { key } });
});
bills.post("/bills/:id/confirm", async (c) => {
  const { userId } = c.var.user;
  const billId = Number(c.req.param("id"));
  const bill = await c.env.DB.prepare(
    "SELECT id, house_id, creator_id, status, version FROM bills WHERE id = ?"
  ).bind(billId).first();
  if (!bill) return c.json({ success: false, error: "ERR_BILL_NOT_FOUND" }, 404);
  if (bill.creator_id !== userId) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  if (bill.status !== "\u8349\u7A3F") return c.json({ success: false, error: "ERR_BILL_STATUS_INVALID" }, 400);
  await c.env.DB.prepare(
    "UPDATE bills SET status = '\u5DF2\u786E\u8BA4', version = version + 1, updated_at = datetime('now') WHERE id = ? AND version = ?"
  ).bind(billId, bill.version || 1).run();
  return c.json({ success: true, data: {} });
});

// src/routes/settlements/index.ts
init_modules_watch_stub();

// src/routes/settlements/read.ts
init_modules_watch_stub();
var read = new Hono2();
read.use("*", authMiddleware);
read.get("/settlements", async (c) => {
  const { userId } = c.var.user;
  const houseId = c.req.query("house_id");
  if (!houseId) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400);
  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(Number(houseId), userId).first();
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  const list = await c.env.DB.prepare(
    "SELECT * FROM settlements WHERE house_id = ? ORDER BY created_at DESC"
  ).bind(Number(houseId)).all();
  return c.json({ success: true, data: list.results });
});
read.get("/settlements/:id", async (c) => {
  const { userId } = c.var.user;
  const settlementId = Number(c.req.param("id"));
  const settlement = await c.env.DB.prepare("SELECT * FROM settlements WHERE id = ?").bind(settlementId).first();
  if (!settlement) return c.json({ success: false, error: "ERR_SETTLE_NOT_FOUND" }, 404);
  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(settlement.house_id, userId).first();
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  const items = await c.env.DB.prepare(`
    SELECT si.*, payer.nickname AS payer_name, payer.avatar AS payer_avatar,
           payee.nickname AS payee_name, payee.avatar AS payee_avatar
    FROM settlement_items si
    JOIN users payer ON payer.id = si.payer_id
    JOIN users payee ON payee.id = si.payee_id
    WHERE si.settlement_id = ? ORDER BY si.id
  `).bind(settlementId).all();
  const challenges2 = await c.env.DB.prepare(`
    SELECT sc.*, u.nickname AS challenger_name
    FROM settlement_challenges sc
    JOIN users u ON u.id = sc.challenger_id
    WHERE sc.item_id IN (SELECT id FROM settlement_items WHERE settlement_id = ?)
    ORDER BY sc.created_at DESC
  `).bind(settlementId).all();
  const itemStatuses = items.results.map((i) => i.status);
  let displayStatus;
  if (itemStatuses.every((s) => s === "transferred")) displayStatus = "\u5DF2\u5B8C\u6210";
  else if (itemStatuses.some((s) => s === "disputed")) displayStatus = "\u4E89\u8BAE\u4E2D";
  else if (itemStatuses.every((s) => s === "confirmed")) displayStatus = "\u5DF2\u786E\u8BA4";
  else if (itemStatuses.every((s) => s === "pending")) displayStatus = "\u5F85\u786E\u8BA4";
  else displayStatus = "\u8FDB\u884C\u4E2D";
  const enrichedItems = items.results.map((item) => ({
    ...item,
    remaining: Number(item.final_amount) - (Number(item.paid_amount) || 0)
  }));
  return c.json({ success: true, data: { ...settlement, display_status: displayStatus, items: enrichedItems, challenges: challenges2.results } });
});

// src/routes/settlements/create.ts
init_modules_watch_stub();

// src/algorithms/settlement.ts
init_modules_watch_stub();
function settle(balances) {
  const payers = balances.filter((b) => b.amount < 0).map((b) => ({ ...b, amount: -b.amount }));
  const receivers = balances.filter((b) => b.amount > 0).map((b) => ({ ...b }));
  payers.sort((a, b) => b.amount - a.amount);
  receivers.sort((a, b) => b.amount - a.amount);
  const transfers = [];
  let i = 0;
  let j = 0;
  while (i < payers.length && j < receivers.length) {
    const amount = Math.min(payers[i].amount, receivers[j].amount);
    transfers.push({ from: payers[i].userId, to: receivers[j].userId, amount });
    payers[i].amount -= amount;
    receivers[j].amount -= amount;
    if (payers[i].amount === 0) i++;
    if (receivers[j].amount === 0) j++;
  }
  return transfers;
}
__name(settle, "settle");

// src/routes/settlements/create.ts
var create = new Hono2();
create.use("*", authMiddleware);
create.post("/settlements", async (c) => {
  const { userId } = c.var.user;
  const { house_id, title, start_date, end_date } = await c.req.json();
  if (!house_id || !start_date || !end_date) {
    return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400);
  }
  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(house_id, userId).first();
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  const bills2 = await c.env.DB.prepare(`
    SELECT id, creator_id, total_amount FROM bills
    WHERE house_id = ? AND bill_date >= ? AND bill_date <= ?
    AND status IN ('\u5DF2\u786E\u8BA4', '\u4E89\u8BAE\u4E2D', '\u518D\u6B21\u786E\u8BA4', '\u5F85\u652F\u4ED8', '\u5DF2\u652F\u4ED8')
  `).bind(house_id, start_date, end_date).all();
  if (!bills2.results.length) {
    return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400);
  }
  const billIds = bills2.results.map((b) => b.id);
  const placeholders = billIds.map(() => "?").join(",");
  const splits = await c.env.DB.prepare(`
    SELECT bill_id, user_id, amount FROM splits WHERE bill_id IN (${placeholders})
  `).bind(...billIds).all();
  const balanceMap = /* @__PURE__ */ new Map();
  for (const bill of bills2.results) {
    const creatorId = bill.creator_id;
    const total = bill.total_amount;
    if (!balanceMap.has(creatorId)) balanceMap.set(creatorId, 0);
    balanceMap.set(creatorId, balanceMap.get(creatorId) + total);
  }
  for (const split of splits.results) {
    const current = balanceMap.get(split.user_id) ?? 0;
    balanceMap.set(split.user_id, current - split.amount);
  }
  const balances = Array.from(balanceMap.entries()).filter(([_, amount]) => amount !== 0).map(([userId2, amount]) => ({ userId: userId2, amount }));
  if (!balances.length) {
    return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400);
  }
  const transfers = settle(balances);
  const result = await c.env.DB.prepare(`
    INSERT INTO settlements (house_id, title, start_date, end_date, creator_id)
    VALUES (?, ?, ?, ?, ?)
  `).bind(house_id, title || `${start_date} ~ ${end_date} \u7ED3\u7B97`, start_date, end_date, userId).run();
  const settlementId = Number(result.meta.last_row_id);
  const stmt = c.env.DB.prepare(
    "INSERT INTO settlement_items (settlement_id, payer_id, payee_id, original_amount, final_amount) VALUES (?, ?, ?, ?, ?)"
  );
  for (const t of transfers) {
    await stmt.bind(settlementId, t.from, t.to, t.amount, t.amount).run();
  }
  await c.env.DB.prepare(`
    INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id, after_snapshot)
    VALUES (?, ?, 'create_settlement', 'settlements', ?, ?)
  `).bind(
    house_id,
    userId,
    settlementId,
    JSON.stringify({ bill_count: bills2.results.length, transfer_count: transfers.length })
  ).run();
  const settlement = await c.env.DB.prepare("SELECT * FROM settlements WHERE id = ?").bind(settlementId).first();
  const items = await c.env.DB.prepare(`
    SELECT si.*, payer.nickname AS payer_name, payee.nickname AS payee_name
    FROM settlement_items si JOIN users payer ON payer.id = si.payer_id
    JOIN users payee ON payee.id = si.payee_id
    WHERE si.settlement_id = ? ORDER BY si.id
  `).bind(settlementId).all();
  return c.json({ success: true, data: { ...settlement, items: items.results } });
});

// src/routes/settlements/actions.ts
init_modules_watch_stub();
var actions = new Hono2();
actions.use("*", authMiddleware);
async function updateItemWithLock(db, itemId, version, updates) {
  const setClauses = ["version = version + 1", "updated_at = datetime('now')"];
  const params = [];
  for (const [key, value] of Object.entries(updates)) {
    setClauses.push(`${key} = ?`);
    params.push(value);
  }
  params.push(itemId, version);
  const result = await db.prepare(
    `UPDATE settlement_items SET ${setClauses.join(", ")} WHERE id = ? AND version = ?`
  ).bind(...params).run();
  return (result.meta.changes ?? 0) > 0;
}
__name(updateItemWithLock, "updateItemWithLock");
actions.post("/settlements/:id/confirm", async (c) => {
  const { userId } = c.var.user;
  const settlementId = Number(c.req.param("id"));
  const settlement = await c.env.DB.prepare(
    "SELECT * FROM settlements WHERE id = ? AND status = 'active'"
  ).bind(settlementId).first();
  if (!settlement) return c.json({ success: false, error: "ERR_SETTLE_STATUS_INVALID" }, 400);
  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(settlement.house_id, userId).first();
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  await c.env.DB.prepare(
    "UPDATE settlements SET status = 'closed', updated_at = datetime('now') WHERE id = ?"
  ).bind(settlementId).run();
  await c.env.DB.prepare(
    "UPDATE settlement_items SET status = 'confirmed', version = version + 1, updated_at = datetime('now') WHERE settlement_id = ? AND status = 'pending'"
  ).bind(settlementId).run();
  return c.json({ success: true, data: {} });
});
actions.post("/settlements/:id/transfer", async (c) => {
  const { userId } = c.var.user;
  const settlementId = Number(c.req.param("id"));
  const settlement = await c.env.DB.prepare(
    "SELECT * FROM settlements WHERE id = ? AND status = 'active'"
  ).bind(settlementId).first();
  if (!settlement) return c.json({ success: false, error: "ERR_SETTLE_STATUS_INVALID" }, 400);
  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(settlement.house_id, userId).first();
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  await c.env.DB.prepare(
    "UPDATE settlements SET status = 'closed', updated_at = datetime('now') WHERE id = ?"
  ).bind(settlementId).run();
  return c.json({ success: true, data: {} });
});
actions.post("/settlements/:id/items/:itemId/confirm", async (c) => {
  const { userId } = c.var.user;
  const itemId = Number(c.req.param("itemId"));
  const item = await c.env.DB.prepare(`
    SELECT si.*, s.house_id, s.status AS settlement_status FROM settlement_items si
    JOIN settlements s ON s.id = si.settlement_id
    WHERE si.id = ? AND si.status = 'pending'
  `).bind(itemId).first();
  if (!item || item.settlement_status !== "active") return c.json({ success: false, error: "ERR_SETTLE_STATUS_INVALID" }, 400);
  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(item.house_id, userId).first();
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  const ok = await updateItemWithLock(c.env.DB, itemId, item.version, { status: "confirmed" });
  if (!ok) return c.json({ success: false, error: "ERR_COMMON_CONFLICT" }, 409);
  return c.json({ success: true, data: {} });
});
actions.post("/settlements/:id/items/:itemId/transfer", async (c) => {
  const { userId } = c.var.user;
  const itemId = Number(c.req.param("itemId"));
  const item = await c.env.DB.prepare(`
    SELECT si.*, s.house_id, s.status AS settlement_status FROM settlement_items si
    JOIN settlements s ON s.id = si.settlement_id
    WHERE si.id = ? AND si.status = 'confirmed'
  `).bind(itemId).first();
  if (!item || item.settlement_status !== "active") return c.json({ success: false, error: "ERR_SETTLE_STATUS_INVALID" }, 400);
  if ((Number(item.paid_amount) || 0) < Number(item.final_amount)) {
    return c.json({ success: false, error: "ERR_SETTLE_NOT_PAID" }, 400);
  }
  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(item.house_id, userId).first();
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  const ok = await updateItemWithLock(c.env.DB, itemId, item.version, { status: "transferred" });
  if (!ok) return c.json({ success: false, error: "ERR_COMMON_CONFLICT" }, 409);
  return c.json({ success: true, data: {} });
});
actions.post("/settlements/:id/items/:itemId/partial-payments", async (c) => {
  const { userId } = c.var.user;
  const itemId = Number(c.req.param("itemId"));
  const { amount, note, voucher } = await c.req.json();
  if (!amount || amount <= 0) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400);
  const item = await c.env.DB.prepare(`
    SELECT si.*, s.house_id FROM settlement_items si
    JOIN settlements s ON s.id = si.settlement_id
    WHERE si.id = ? AND s.status = 'active'
  `).bind(itemId).first();
  if (!item) return c.json({ success: false, error: "ERR_SETTLE_NOT_FOUND" }, 404);
  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(item.house_id, userId).first();
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  if (item.payer_id !== userId) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  const remaining = Number(item.final_amount) - (Number(item.paid_amount) || 0);
  if (amount > remaining) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400);
  const result = await c.env.DB.prepare(`
    INSERT INTO partial_payments (item_id, payer_id, amount, note, voucher)
    VALUES (?, ?, ?, ?, ?)
  `).bind(itemId, userId, amount, note || null, voucher || null).run();
  const newPaid = (Number(item.paid_amount) || 0) + amount;
  const ok = await updateItemWithLock(c.env.DB, itemId, item.version, { paid_amount: newPaid });
  if (!ok) return c.json({ success: false, error: "ERR_COMMON_CONFLICT" }, 409);
  const pp = await c.env.DB.prepare("SELECT * FROM partial_payments WHERE id = ?").bind(Number(result.meta.last_row_id)).first();
  return c.json({ success: true, data: pp });
});
actions.get("/settlements/:id/items/:itemId/partial-payments", async (c) => {
  const { userId } = c.var.user;
  const itemId = Number(c.req.param("itemId"));
  const item = await c.env.DB.prepare(`
    SELECT si.id, s.house_id FROM settlement_items si
    JOIN settlements s ON s.id = si.settlement_id
    WHERE si.id = ?
  `).bind(itemId).first();
  if (!item) return c.json({ success: false, error: "ERR_SETTLE_NOT_FOUND" }, 404);
  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(item.house_id, userId).first();
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  const list = await c.env.DB.prepare(`
    SELECT pp.*, u.nickname AS payer_name FROM partial_payments pp
    JOIN users u ON u.id = pp.payer_id
    WHERE pp.item_id = ? ORDER BY pp.created_at DESC
  `).bind(itemId).all();
  return c.json({ success: true, data: list.results });
});
actions.delete("/settlements/:id/items/:itemId/partial-payments/:pid", async (c) => {
  const { userId } = c.var.user;
  const pid = Number(c.req.param("pid"));
  const itemId = Number(c.req.param("itemId"));
  const pp = await c.env.DB.prepare(`
    SELECT pp.*, si.version AS item_version FROM partial_payments pp
    JOIN settlement_items si ON si.id = pp.item_id
    JOIN settlements s ON s.id = si.settlement_id
    WHERE pp.id = ? AND pp.item_id = ?
  `).bind(pid, itemId).first();
  if (!pp) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 404);
  if (pp.payer_id !== userId) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  await c.env.DB.prepare("DELETE FROM partial_payments WHERE id = ?").bind(pid).run();
  const sum = await c.env.DB.prepare(
    "SELECT COALESCE(SUM(amount), 0) as total FROM partial_payments WHERE item_id = ?"
  ).bind(itemId).first();
  const ok = await updateItemWithLock(c.env.DB, itemId, pp.item_version, { paid_amount: sum?.total ?? 0 });
  if (!ok) return c.json({ success: false, error: "ERR_COMMON_CONFLICT" }, 409);
  return c.json({ success: true, data: {} });
});
actions.post("/settlements/:id/undo", async (c) => {
  const { userId } = c.var.user;
  const settlementId = Number(c.req.param("id"));
  const settlement = await c.env.DB.prepare(
    "SELECT * FROM settlements WHERE id = ? AND status = 'closed'"
  ).bind(settlementId).first();
  if (!settlement) return c.json({ success: false, error: "ERR_SETTLE_STATUS_INVALID" }, 400);
  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(settlement.house_id, userId).first();
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  const items = await c.env.DB.prepare(
    "SELECT id FROM settlement_items WHERE settlement_id = ?"
  ).bind(settlementId).all();
  try {
    for (const item of items.results) {
      await c.env.DB.prepare("DELETE FROM settlement_challenges WHERE item_id = ?").bind(item.id).run();
      await c.env.DB.prepare("DELETE FROM partial_payments WHERE item_id = ?").bind(item.id).run();
    }
    await c.env.DB.prepare("DELETE FROM settlement_items WHERE settlement_id = ?").bind(settlementId).run();
    await c.env.DB.prepare(
      "UPDATE settlements SET status = 'active', updated_at = datetime('now') WHERE id = ?"
    ).bind(settlementId).run();
    await c.env.DB.prepare(`
      INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id)
      VALUES (?, ?, 'undo_settlement', 'settlements', ?)
    `).bind(settlement.house_id, userId, settlementId).run();
    return c.json({ success: true, data: { id: settlementId, status: "active" } });
  } catch {
    await c.env.DB.prepare(
      "UPDATE settlements SET status = 'closed', updated_at = datetime('now') WHERE id = ?"
    ).bind(settlementId).run();
    return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 500);
  }
});
actions.post("/settlements/:id/items/:itemId/undo", async (c) => {
  const { userId } = c.var.user;
  const itemId = Number(c.req.param("itemId"));
  const item = await c.env.DB.prepare(`
    SELECT si.*, s.house_id FROM settlement_items si
    JOIN settlements s ON s.id = si.settlement_id
    WHERE si.id = ? AND s.status = 'active'
  `).bind(itemId).first();
  if (!item) return c.json({ success: false, error: "ERR_SETTLE_NOT_FOUND" }, 404);
  if (item.status === "pending") return c.json({ success: false, error: "ERR_SETTLE_STATUS_INVALID" }, 400);
  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(item.house_id, userId).first();
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  try {
    await c.env.DB.prepare("DELETE FROM settlement_challenges WHERE item_id = ?").bind(itemId).run();
    await c.env.DB.prepare("DELETE FROM partial_payments WHERE item_id = ?").bind(itemId).run();
    const ok = await updateItemWithLock(c.env.DB, itemId, item.version, { status: "pending", paid_amount: 0 });
    if (!ok) return c.json({ success: false, error: "ERR_COMMON_CONFLICT" }, 409);
    await c.env.DB.prepare(`
      INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id)
      VALUES (?, ?, 'undo_settlement_item', 'settlement_items', ?)
    `).bind(item.house_id, userId, itemId).run();
    return c.json({ success: true, data: { id: itemId, status: "pending" } });
  } catch {
    return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 500);
  }
});

// src/routes/settlements/index.ts
var settlements = new Hono2();
settlements.use("*", authMiddleware);
settlements.route("/", read);
settlements.route("/", create);
settlements.route("/", actions);

// src/routes/challenges.ts
init_modules_watch_stub();
async function captureBefore(db, itemId, challengeId) {
  const ch = await db.prepare("SELECT status, handler_id FROM settlement_challenges WHERE id = ?").bind(challengeId).first();
  const item = await db.prepare("SELECT final_amount, status, version FROM settlement_items WHERE id = ?").bind(itemId).first();
  const scope = await db.prepare(`
    SELECT si.payer_id, s.start_date, s.end_date, s.house_id FROM settlement_items si
    JOIN settlements s ON s.id = si.settlement_id WHERE si.id = ?
  `).bind(itemId).first();
  const splits = [];
  const bills2 = [];
  if (scope) {
    const billRows = await db.prepare(`
      SELECT DISTINCT b.id FROM bills b JOIN splits s ON s.bill_id = b.id
      WHERE b.house_id = ? AND b.status != '\u8349\u7A3F' AND s.user_id = ? AND b.bill_date >= ? AND b.bill_date <= ?
    `).bind(scope.house_id, scope.payer_id, scope.start_date, scope.end_date).all();
    if (billRows.results.length) {
      const ids = billRows.results.map((r) => r.id);
      const ph = ids.map(() => "?").join(",");
      const s = await db.prepare(`SELECT id, amount FROM splits WHERE bill_id IN (${ph}) AND user_id = ?`).bind(...ids, scope.payer_id).all();
      splits.push(...s.results);
      const b = await db.prepare(`SELECT id, total_amount FROM bills WHERE id IN (${ph})`).bind(...ids).all();
      bills2.push(...b.results.map((r) => ({ id: r.id, total: r.total_amount })));
    }
  }
  return { challengeStatus: ch?.status, challengeHandler: ch?.handler_id, itemFinal: item?.final_amount, itemStatus: item?.status, itemVersion: item?.version, splits, bills: bills2 };
}
__name(captureBefore, "captureBefore");
function compensateSaga(db, snap, itemId, challengeId) {
  return async () => {
    if (snap.challengeStatus) await db.prepare("UPDATE settlement_challenges SET status = ?, handler_id = ?, handled_at = datetime('now') WHERE id = ?").bind(snap.challengeStatus, snap.challengeHandler ?? null, challengeId).run();
    if (snap.itemFinal != null) await db.prepare("UPDATE settlement_items SET final_amount = ?, status = ?, version = ?, updated_at = datetime('now') WHERE id = ?").bind(snap.itemFinal, snap.itemStatus ?? "pending", snap.itemVersion ?? 1, itemId).run();
    for (const s of snap.splits) await db.prepare("UPDATE splits SET amount = ? WHERE id = ?").bind(s.amount, s.id).run();
    for (const b of snap.bills) await db.prepare("UPDATE bills SET total_amount = ?, version = version + 1, updated_at = datetime('now') WHERE id = ?").bind(b.total, b.id).run();
  };
}
__name(compensateSaga, "compensateSaga");
async function recalculateSettlement(db, itemId) {
  const result = await db.prepare(`
    SELECT s.id, s.house_id, s.start_date, s.end_date FROM settlement_items si
    JOIN settlements s ON s.id = si.settlement_id WHERE si.id = ?
  `).bind(itemId).first();
  if (!result) return;
  const { id: settlementId, house_id, start_date, end_date } = result;
  const bills2 = await db.prepare(`
    SELECT id, creator_id, total_amount FROM bills
    WHERE house_id = ? AND bill_date >= ? AND bill_date <= ?
      AND status IN ('\u5DF2\u786E\u8BA4', '\u4E89\u8BAE\u4E2D', '\u518D\u6B21\u786E\u8BA4', '\u5F85\u652F\u4ED8', '\u5DF2\u652F\u4ED8')
  `).bind(house_id, start_date, end_date).all();
  if (!bills2.results.length) return;
  const billIds = bills2.results.map((b) => b.id);
  const splits = await db.prepare(`
    SELECT bill_id, user_id, amount FROM splits WHERE bill_id IN (${billIds.map(() => "?").join(",")})
  `).bind(...billIds).all();
  const balanceMap = /* @__PURE__ */ new Map();
  for (const bill of bills2.results) {
    balanceMap.set(bill.creator_id, (balanceMap.get(bill.creator_id) ?? 0) + bill.total_amount);
  }
  for (const split of splits.results) {
    balanceMap.set(split.user_id, (balanceMap.get(split.user_id) ?? 0) - split.amount);
  }
  const balances = Array.from(balanceMap.entries()).filter(([_, amount]) => amount !== 0).map(([userId, amount]) => ({ userId, amount }));
  if (!balances.length) return;
  const newTransfers = settle(balances);
  const existing = await db.prepare(
    "SELECT id, payer_id, payee_id, original_amount, status FROM settlement_items WHERE settlement_id = ?"
  ).bind(settlementId).all();
  const challengedItemIds = new Set(
    (await db.prepare("SELECT DISTINCT item_id FROM settlement_challenges WHERE status = 'resolved'").all()).results.map((r) => r.item_id)
  );
  const existingMap = /* @__PURE__ */ new Map();
  for (const ex of existing.results) {
    if (challengedItemIds.has(ex.id)) continue;
    const key = `${ex.payer_id}-${ex.payee_id}`;
    existingMap.set(key, ex);
  }
  const insertStmt = db.prepare(
    "INSERT INTO settlement_items (settlement_id, payer_id, payee_id, original_amount, final_amount) VALUES (?, ?, ?, ?, ?)"
  );
  const usedKeys = /* @__PURE__ */ new Set();
  for (const t of newTransfers) {
    const key = `${t.from}-${t.to}`;
    usedKeys.add(key);
    const match2 = existingMap.get(key);
    if (match2 && match2.original_amount === t.amount) {
      continue;
    }
    if (match2) {
      await db.prepare(
        "UPDATE settlement_items SET original_amount = ?, final_amount = ?, updated_at = datetime('now') WHERE id = ?"
      ).bind(t.amount, t.amount, match2.id).run();
    } else {
      await insertStmt.bind(settlementId, t.from, t.to, t.amount, t.amount).run();
    }
  }
  for (const ex of existing.results) {
    if (challengedItemIds.has(ex.id)) continue;
    const key = `${ex.payer_id}-${ex.payee_id}`;
    if (!usedKeys.has(key)) {
      await db.prepare("DELETE FROM partial_payments WHERE item_id = ?").bind(ex.id).run();
      await db.prepare("DELETE FROM settlement_items WHERE id = ?").bind(ex.id).run();
    }
  }
}
__name(recalculateSettlement, "recalculateSettlement");
async function syncBillsFromChallenge(db, itemId, newAmount, houseId) {
  const item = await db.prepare(`
    SELECT si.payer_id, si.original_amount, s.start_date, s.end_date
    FROM settlement_items si
    JOIN settlements s ON s.id = si.settlement_id
    WHERE si.id = ?
  `).bind(itemId).first();
  if (!item) return;
  const adjustment = item.original_amount - newAmount;
  if (adjustment === 0) return;
  const bills2 = await db.prepare(`
    SELECT DISTINCT b.id, b.total_amount FROM bills b
    JOIN splits s ON s.bill_id = b.id
    WHERE b.house_id = ? AND b.status != '\u8349\u7A3F' AND s.user_id = ?
      AND b.bill_date >= ? AND b.bill_date <= ?
  `).bind(houseId, item.payer_id, item.start_date, item.end_date).all();
  if (!bills2.results.length) return;
  const billIds = bills2.results.map((b) => b.id);
  const placeholders = billIds.map(() => "?").join(",");
  const payerSplits = await db.prepare(`
    SELECT id, amount, bill_id FROM splits
    WHERE bill_id IN (${placeholders}) AND user_id = ?
  `).bind(...billIds, item.payer_id).all();
  if (!payerSplits.results.length) return;
  const totalPayer = payerSplits.results.reduce((s, r) => s + r.amount, 0);
  if (totalPayer === 0) return;
  const sorted = payerSplits.results.map((r) => ({ ...r, reduction: Math.round(adjustment * r.amount / totalPayer) }));
  const appliedTotal = sorted.reduce((s, r) => s + r.reduction, 0);
  const remainder = adjustment - appliedTotal;
  if (remainder !== 0 && sorted.length > 0) sorted[0].reduction += remainder;
  for (const split of sorted) {
    await db.prepare("UPDATE splits SET amount = amount - ? WHERE id = ?").bind(split.reduction, split.id).run();
  }
  for (const bill of bills2.results) {
    const total = await db.prepare("SELECT SUM(amount) as total FROM splits WHERE bill_id = ?").bind(bill.id).first();
    if (total?.total != null) {
      await db.prepare("UPDATE bills SET total_amount = ?, version = version + 1, updated_at = datetime('now') WHERE id = ?").bind(total.total, bill.id).run();
    }
  }
}
__name(syncBillsFromChallenge, "syncBillsFromChallenge");
var challenges = new Hono2();
challenges.use("*", authMiddleware);
challenges.post("/settlements/:settlementId/items/:itemId/challenges", async (c) => {
  const { userId } = c.var.user;
  const itemId = Number(c.req.param("itemId"));
  const { reason, challenge_amount, requested_amount } = await c.req.json();
  if (!reason) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400);
  const item = await c.env.DB.prepare(`
    SELECT si.*, s.house_id, s.status AS settlement_status FROM settlement_items si
    JOIN settlements s ON s.id = si.settlement_id
    WHERE si.id = ?
  `).bind(itemId).first();
  if (!item || item.settlement_status !== "active") return c.json({ success: false, error: "ERR_SETTLE_NOT_FOUND" }, 404);
  const member = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND status = 'active'"
  ).bind(item.house_id, userId).first();
  if (!member) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  const last = await c.env.DB.prepare(
    "SELECT MAX(round) as max_round FROM settlement_challenges WHERE item_id = ?"
  ).bind(itemId).first();
  const round = (last?.max_round ?? 0) + 1;
  const timeoutAt = new Date(Date.now() + 3 * 864e5).toISOString();
  const result = await c.env.DB.prepare(`
    INSERT INTO settlement_challenges
      (item_id, challenger_id, round, reason, challenge_amount, requested_amount,
       original_amount_snapshot, timeout_at, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'open')
  `).bind(
    itemId,
    userId,
    round,
    reason,
    challenge_amount ?? null,
    requested_amount ?? null,
    item.final_amount,
    timeoutAt
  ).run();
  const challengeId = Number(result.meta.last_row_id);
  const disputeResult = await c.env.DB.prepare(
    "UPDATE settlement_items SET status = 'disputed', version = version + 1, updated_at = datetime('now') WHERE id = ? AND version = ?"
  ).bind(itemId, item.version).run();
  if ((disputeResult.meta.changes ?? 0) === 0) {
    return c.json({ success: false, error: "ERR_COMMON_CONFLICT" }, 409);
  }
  await c.env.DB.prepare(`
    INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id, before_snapshot)
    VALUES (?, ?, 'challenge', 'settlement_challenges', ?, ?)
  `).bind(item.house_id, userId, challengeId, JSON.stringify({ item_id: itemId, original_amount: item.final_amount })).run();
  const challenge = await c.env.DB.prepare("SELECT * FROM settlement_challenges WHERE id = ?").bind(challengeId).first();
  return c.json({ success: true, data: challenge });
});
challenges.post("/challenges/:id/respond", async (c) => {
  const { userId } = c.var.user;
  const challengeId = Number(c.req.param("id"));
  const { action, adjusted_amount } = await c.req.json();
  const challenge = await c.env.DB.prepare(`
    SELECT sc.*, si.payer_id, si.payee_id, s.house_id FROM settlement_challenges sc
    JOIN settlement_items si ON si.id = sc.item_id
    JOIN settlements s ON s.id = si.settlement_id
    WHERE sc.id = ? AND sc.status = 'open'
  `).bind(challengeId).first();
  if (!challenge) return c.json({ success: false, error: "ERR_CHALLENGE_RESOLVED" }, 400);
  const isTarget = userId === challenge.payer_id || userId === challenge.payee_id;
  if (!isTarget || userId === challenge.challenger_id) {
    return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  }
  if (action === "adjust" && adjusted_amount != null) {
    const snap = await captureBefore(c.env.DB, challenge.item_id, challengeId);
    const itemForLock = await c.env.DB.prepare("SELECT version FROM settlement_items WHERE id = ?").bind(challenge.item_id).first();
    if (!itemForLock) return c.json({ success: false, error: "ERR_SETTLE_NOT_FOUND" }, 404);
    try {
      await c.env.DB.prepare(`
        UPDATE settlement_challenges SET status = 'resolved',
          adjusted_amount = ?, handler_id = ?, handled_at = datetime('now')
        WHERE id = ?
      `).bind(adjusted_amount, userId, challengeId).run();
      const itemResult = await c.env.DB.prepare(
        "UPDATE settlement_items SET final_amount = ?, status = 'confirmed', version = version + 1, updated_at = datetime('now') WHERE id = ? AND version = ?"
      ).bind(adjusted_amount, challenge.item_id, itemForLock.version).run();
      if ((itemResult.meta.changes ?? 0) === 0) {
        return c.json({ success: false, error: "ERR_COMMON_CONFLICT" }, 409);
      }
      await syncBillsFromChallenge(c.env.DB, challenge.item_id, adjusted_amount, challenge.house_id);
      await recalculateSettlement(c.env.DB, challenge.item_id);
      await c.env.DB.prepare(`
        INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id, after_snapshot)
        VALUES (?, ?, 'challenge_adjusted', 'settlement_items', ?, ?)
      `).bind(
        challenge.house_id,
        userId,
        challenge.item_id,
        JSON.stringify({ final_amount: adjusted_amount })
      ).run();
    } catch {
      await compensateSaga(c.env.DB, snap, challenge.item_id, challengeId)();
      return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 500);
    }
  } else {
    await c.env.DB.prepare(`
      UPDATE settlement_challenges SET status = 'open', handler_id = ?, handled_at = datetime('now')
      WHERE id = ?
    `).bind(userId, challengeId).run();
    const leader = await c.env.DB.prepare(
      "SELECT user_id FROM members WHERE house_id = ? AND role = '\u5BDD\u5BA4\u957F' AND status = 'active' LIMIT 1"
    ).bind(challenge.house_id).first();
    if (leader) {
      await c.env.DB.prepare(`
        INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id)
        VALUES (?, ?, 'challenge_escalated', 'settlement_challenges', ?)
      `).bind(challenge.house_id, userId, challengeId).run();
    }
  }
  return c.json({ success: true, data: {} });
});
challenges.post("/challenges/:id/accept", async (c) => {
  const { userId } = c.var.user;
  const challengeId = Number(c.req.param("id"));
  const challenge = await c.env.DB.prepare(`
    SELECT sc.*, si.payer_id, si.payee_id, s.house_id FROM settlement_challenges sc
    JOIN settlement_items si ON si.id = sc.item_id
    JOIN settlements s ON s.id = si.settlement_id
    WHERE sc.id = ? AND sc.status = 'open' AND sc.adjusted_amount IS NOT NULL
  `).bind(challengeId).first();
  if (!challenge) return c.json({ success: false, error: "ERR_CHALLENGE_RESOLVED" }, 400);
  if (challenge.challenger_id !== userId) {
    return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  }
  await c.env.DB.prepare(`
    UPDATE settlement_challenges SET status = 'resolved', handled_at = datetime('now')
    WHERE id = ?
  `).bind(challengeId).run();
  return c.json({ success: true, data: {} });
});
challenges.post("/challenges/:id/ruling", async (c) => {
  const { userId } = c.var.user;
  const challengeId = Number(c.req.param("id"));
  const { ruling, amount } = await c.req.json();
  const challenge = await c.env.DB.prepare(`
    SELECT sc.*, s.house_id FROM settlement_challenges sc
    JOIN settlement_items si ON si.id = sc.item_id
    JOIN settlements s ON s.id = si.settlement_id
    WHERE sc.id = ?
  `).bind(challengeId).first();
  if (!challenge) return c.json({ success: false, error: "ERR_CHALLENGE_RESOLVED" }, 400);
  const leader = await c.env.DB.prepare(
    "SELECT id FROM members WHERE house_id = ? AND user_id = ? AND role = '\u5BDD\u5BA4\u957F' AND status = 'active'"
  ).bind(challenge.house_id, userId).first();
  if (!leader) return c.json({ success: false, error: "ERR_COMMON_FORBIDDEN" }, 403);
  let finalAmount;
  switch (ruling) {
    case "support_challenger":
      finalAmount = challenge.requested_amount ?? challenge.original_amount_snapshot;
      break;
    case "support_respondent":
      finalAmount = challenge.original_amount_snapshot;
      break;
    case "compromise":
      finalAmount = amount ?? challenge.original_amount_snapshot;
      break;
    default:
      return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400);
  }
  const snap = await captureBefore(c.env.DB, challenge.item_id, challengeId);
  const itemForLock = await c.env.DB.prepare("SELECT version FROM settlement_items WHERE id = ?").bind(challenge.item_id).first();
  if (!itemForLock) return c.json({ success: false, error: "ERR_SETTLE_NOT_FOUND" }, 404);
  try {
    await c.env.DB.prepare(`
      UPDATE settlement_challenges SET status = 'resolved',
        adjusted_amount = ?, handler_id = ?, handled_at = datetime('now')
      WHERE id = ?
    `).bind(finalAmount, userId, challengeId).run();
    const itemResult = await c.env.DB.prepare(`
      UPDATE settlement_items SET final_amount = ?, status = 'confirmed',
        version = version + 1, updated_at = datetime('now')
      WHERE id = ? AND version = ?
    `).bind(finalAmount, challenge.item_id, itemForLock.version).run();
    if ((itemResult.meta.changes ?? 0) === 0) {
      return c.json({ success: false, error: "ERR_COMMON_CONFLICT" }, 409);
    }
    await syncBillsFromChallenge(c.env.DB, challenge.item_id, finalAmount, challenge.house_id);
    await recalculateSettlement(c.env.DB, challenge.item_id);
    await c.env.DB.prepare(`
      INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id, after_snapshot)
      VALUES (?, ?, 'challenge_ruling', 'settlement_items', ?, ?)
    `).bind(
      challenge.house_id,
      userId,
      challenge.item_id,
      JSON.stringify({ ruling, final_amount: finalAmount })
    ).run();
    return c.json({ success: true, data: {} });
  } catch {
    await compensateSaga(c.env.DB, snap, challenge.item_id, challengeId)();
    return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 500);
  }
});

// src/routes/stats.ts
init_modules_watch_stub();
var stats = new Hono2();
stats.use("*", authMiddleware);
stats.get("/houses/:id/stats/trend", async (c) => {
  const houseId = Number(c.req.param("id"));
  const rows = await c.env.DB.prepare(`
    SELECT strftime('%Y-%m', bill_date) as month, SUM(total_amount) as total
    FROM bills WHERE house_id = ? AND status != '\u8349\u7A3F'
      AND bill_date >= date('now', '-12 months')
    GROUP BY month ORDER BY month
  `).bind(houseId).all();
  return c.json({ success: true, data: rows.results });
});
stats.get("/houses/:id/stats/category", async (c) => {
  const houseId = Number(c.req.param("id"));
  const rows = await c.env.DB.prepare(`
    SELECT c.name, SUM(b.total_amount) as total
    FROM bills b JOIN categories c ON c.id = b.category_id
    WHERE b.house_id = ? AND b.status != '\u8349\u7A3F'
      AND b.bill_date >= date('now', '-1 month')
    GROUP BY c.id ORDER BY total DESC
  `).bind(houseId).all();
  return c.json({ success: true, data: rows.results });
});
stats.get("/houses/:id/stats/yearly", async (c) => {
  const houseId = Number(c.req.param("id"));
  const thisYear = String((/* @__PURE__ */ new Date()).getFullYear());
  const lastYear = String((/* @__PURE__ */ new Date()).getFullYear() - 1);
  const rows = await c.env.DB.prepare(`
    SELECT strftime('%m', bill_date) as month,
      SUM(CASE WHEN strftime('%Y', bill_date) = ? THEN total_amount ELSE 0 END) as this_year,
      SUM(CASE WHEN strftime('%Y', bill_date) = ? THEN total_amount ELSE 0 END) as last_year
    FROM bills WHERE house_id = ? AND status != '\u8349\u7A3F'
      AND bill_date >= ? || '-01-01' AND bill_date <= ? || '-12-31'
    GROUP BY month ORDER BY month
  `).bind(thisYear, lastYear, houseId, thisYear, lastYear).all();
  return c.json({ success: true, data: rows.results });
});

// src/routes/categories.ts
init_modules_watch_stub();
var categories = new Hono2();
categories.use("*", authMiddleware);
categories.get("/houses/:id/categories", async (c) => {
  const houseId = Number(c.req.param("id"));
  const list = await c.env.DB.prepare("SELECT * FROM categories WHERE house_id = ? ORDER BY sort_order").bind(houseId).all();
  return c.json({ success: true, data: list.results });
});
categories.post("/houses/:id/categories", async (c) => {
  const houseId = Number(c.req.param("id"));
  const { name } = await c.req.json();
  if (!name) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400);
  const max = await c.env.DB.prepare("SELECT COALESCE(MAX(sort_order), 0) + 1 AS next FROM categories WHERE house_id = ?").bind(houseId).first();
  const result = await c.env.DB.prepare("INSERT INTO categories (house_id, name, sort_order) VALUES (?, ?, ?)").bind(houseId, name, max?.next ?? 1).run();
  const cat = await c.env.DB.prepare("SELECT * FROM categories WHERE id = ?").bind(Number(result.meta.last_row_id)).first();
  return c.json({ success: true, data: cat });
});
categories.put("/houses/:id/categories/:catId", async (c) => {
  const catId = Number(c.req.param("catId"));
  const { name, sort_order } = await c.req.json();
  await c.env.DB.prepare("UPDATE categories SET name = COALESCE(?, name), sort_order = COALESCE(?, sort_order) WHERE id = ?").bind(name ?? null, sort_order ?? null, catId).run();
  const cat = await c.env.DB.prepare("SELECT * FROM categories WHERE id = ?").bind(catId).first();
  return c.json({ success: true, data: cat });
});
categories.delete("/houses/:id/categories/:catId", async (c) => {
  const catId = Number(c.req.param("catId"));
  await c.env.DB.prepare("DELETE FROM categories WHERE id = ?").bind(catId).run();
  return c.json({ success: true, data: {} });
});

// src/routes/templates.ts
init_modules_watch_stub();
var templates = new Hono2();
templates.use("*", authMiddleware);
templates.get("/bill-templates", async (c) => {
  const houseId = c.req.query("house_id");
  if (!houseId) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400);
  const list = await c.env.DB.prepare(
    "SELECT * FROM bill_templates WHERE house_id = ? ORDER BY created_at DESC"
  ).bind(Number(houseId)).all();
  return c.json({ success: true, data: list.results });
});
templates.post("/bill-templates", async (c) => {
  const { house_id, title, amount, category_id, split_type, cron_expr } = await c.req.json();
  if (!house_id || !title || !amount || !cron_expr) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400);
  const result = await c.env.DB.prepare(`
    INSERT INTO bill_templates (house_id, title, amount, category_id, split_type, cron_expr)
    VALUES (?, ?, ?, ?, ?, ?)
  `).bind(house_id, title, amount, category_id ?? null, split_type ?? "\u5747\u644A", cron_expr).run();
  const tpl = await c.env.DB.prepare("SELECT * FROM bill_templates WHERE id = ?").bind(Number(result.meta.last_row_id)).first();
  return c.json({ success: true, data: tpl });
});
templates.put("/bill-templates/:id", async (c) => {
  const id = Number(c.req.param("id"));
  const body = await c.req.json();
  await c.env.DB.prepare(`
    UPDATE bill_templates SET title = COALESCE(?, title), amount = COALESCE(?, amount),
      enabled = COALESCE(?, enabled), updated_at = datetime('now') WHERE id = ?
  `).bind(body.title ?? null, body.amount ?? null, body.enabled ?? null, id).run();
  const tpl = await c.env.DB.prepare("SELECT * FROM bill_templates WHERE id = ?").bind(id).first();
  return c.json({ success: true, data: tpl });
});
templates.delete("/bill-templates/:id", async (c) => {
  await c.env.DB.prepare("DELETE FROM bill_templates WHERE id = ?").bind(Number(c.req.param("id"))).run();
  return c.json({ success: true, data: {} });
});

// src/routes/cron-tasks.ts
init_modules_watch_stub();
var cronTasks = new Hono2();
cronTasks.use("*", authMiddleware);
cronTasks.get("/cron-tasks", async (c) => {
  const houseId = c.req.query("house_id");
  if (!houseId) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400);
  const list = await c.env.DB.prepare(
    "SELECT * FROM cron_tasks WHERE house_id = ? ORDER BY next_run_at"
  ).bind(Number(houseId)).all();
  return c.json({ success: true, data: list.results });
});

// src/routes/budget.ts
init_modules_watch_stub();
var budget = new Hono2();
budget.use("*", authMiddleware);
budget.get("/houses/:id/budget", async (c) => {
  const key = `budget:${c.req.param("id")}`;
  const raw2 = await c.env.KV.get(key);
  return c.json({ success: true, data: raw2 ? JSON.parse(raw2) : {} });
});
budget.post("/houses/:id/budget", async (c) => {
  const key = `budget:${c.req.param("id")}`;
  const data = await c.req.json();
  await c.env.KV.put(key, JSON.stringify(data), { expirationTtl: 365 * 86400 });
  return c.json({ success: true, data: {} });
});

// src/routes/budget-suggestion.ts
init_modules_watch_stub();
var budgetSuggestion = new Hono2();
budgetSuggestion.use("*", authMiddleware);
budgetSuggestion.get("/houses/:id/budget-suggestion", async (c) => {
  const houseId = Number(c.req.param("id"));
  const rows = await c.env.DB.prepare(`
    SELECT category_id, AVG(total_amount) as avg_amount FROM bills
    WHERE house_id = ? AND status != '\u8349\u7A3F'
      AND bill_date >= date('now', '-3 months')
    GROUP BY category_id
  `).bind(houseId).all();
  return c.json({ success: true, data: rows.results });
});

// src/routes/ranking.ts
init_modules_watch_stub();
var ranking = new Hono2();
ranking.use("*", authMiddleware);
ranking.get("/houses/:id/ranking", async (c) => {
  const houseId = Number(c.req.param("id"));
  const startDate = c.req.query("start_date");
  const endDate = c.req.query("end_date");
  let sql = `
    SELECT u.id, u.nickname, u.avatar, SUM(s.amount) as total_spent
    FROM splits s
    JOIN bills b ON b.id = s.bill_id
    JOIN users u ON u.id = s.user_id
    WHERE b.house_id = ? AND b.status != '\u8349\u7A3F'
  `;
  const params = [houseId];
  if (startDate) {
    sql += " AND b.bill_date >= ?";
    params.push(startDate);
  }
  if (endDate) {
    sql += " AND b.bill_date <= ?";
    params.push(endDate);
  }
  sql += " GROUP BY s.user_id ORDER BY total_spent DESC";
  const rows = await c.env.DB.prepare(sql).bind(...params).all();
  return c.json({ success: true, data: rows.results });
});

// src/routes/reports.ts
init_modules_watch_stub();
var reports = new Hono2();
reports.use("*", authMiddleware);
reports.get("/houses/:id/reports", async (c) => {
  const houseId = Number(c.req.param("id"));
  const startDate = c.req.query("start_date") ?? dateMonthsAgo(3);
  const endDate = c.req.query("end_date") ?? today();
  const bills2 = await c.env.DB.prepare(`
    SELECT b.*, c.name as category_name, GROUP_CONCAT(s.user_id || ':' || s.amount) as split_detail
    FROM bills b
    LEFT JOIN categories c ON c.id = b.category_id
    LEFT JOIN splits s ON s.bill_id = b.id
    WHERE b.house_id = ? AND b.bill_date >= ? AND b.bill_date <= ?
    GROUP BY b.id ORDER BY b.bill_date DESC
  `).bind(houseId, startDate, endDate).all();
  return c.json({ success: true, data: bills2.results });
});
function today() {
  return (/* @__PURE__ */ new Date()).toISOString().slice(0, 10);
}
__name(today, "today");
function dateMonthsAgo(n) {
  const d = /* @__PURE__ */ new Date();
  d.setMonth(d.getMonth() - n);
  return d.toISOString().slice(0, 10);
}
__name(dateMonthsAgo, "dateMonthsAgo");

// src/routes/payments.ts
init_modules_watch_stub();
var payments = new Hono2();
payments.use("*", authMiddleware);
payments.get("/payment-methods", async (c) => {
  const { userId } = c.var.user;
  const list = await c.env.DB.prepare(
    "SELECT id, type, account, is_default FROM payment_methods WHERE user_id = ?"
  ).bind(userId).all();
  return c.json({ success: true, data: list.results });
});
payments.post("/payment-methods", async (c) => {
  const { userId } = c.var.user;
  const { type, account } = await c.req.json();
  if (!type || !account) return c.json({ success: false, error: "ERR_COMMON_INTERNAL" }, 400);
  const result = await c.env.DB.prepare(
    "INSERT INTO payment_methods (user_id, type, account) VALUES (?, ?, ?)"
  ).bind(userId, type, account).run();
  const pm = await c.env.DB.prepare("SELECT id, type, account, is_default FROM payment_methods WHERE id = ?").bind(Number(result.meta.last_row_id)).first();
  return c.json({ success: true, data: pm });
});
payments.put("/payment-methods/:id", async (c) => {
  const { userId } = c.var.user;
  const id = Number(c.req.param("id"));
  const { type, account, is_default } = await c.req.json();
  await c.env.DB.prepare(
    "UPDATE payment_methods SET type = COALESCE(?, type), account = COALESCE(?, account), is_default = COALESCE(?, is_default) WHERE id = ? AND user_id = ?"
  ).bind(type ?? null, account ?? null, is_default ?? null, id, userId).run();
  const pm = await c.env.DB.prepare("SELECT id, type, account, is_default FROM payment_methods WHERE id = ?").bind(id).first();
  return c.json({ success: true, data: pm });
});
payments.delete("/payment-methods/:id", async (c) => {
  const { userId } = c.var.user;
  await c.env.DB.prepare("DELETE FROM payment_methods WHERE id = ? AND user_id = ?").bind(Number(c.req.param("id")), userId).run();
  return c.json({ success: true, data: {} });
});

// src/routes/notify.ts
init_modules_watch_stub();
var notify = new Hono2();
notify.use("*", authMiddleware);
notify.post("/notify/subscribe", async (c) => {
  const { userId } = c.var.user;
  const { template_id, subscribe } = await c.req.json();
  const key = `subscribe:${userId}:${template_id}`;
  if (subscribe) {
    await c.env.KV.put(key, "1", { expirationTtl: 365 * 86400 });
  } else {
    await c.env.KV.delete(key);
  }
  return c.json({ success: true, data: {} });
});

// src/routes/notifications.ts
init_modules_watch_stub();
var notifications = new Hono2();
notifications.use("*", authMiddleware);
notifications.get("/notifications", async (c) => {
  const { userId } = c.var.user;
  const key = `notifications:${userId}`;
  const raw2 = await c.env.KV.get(key);
  const items = raw2 ? JSON.parse(raw2) : [];
  return c.json({ success: true, data: items });
});
notifications.post("/notifications/read", async (c) => {
  return c.json({ success: true, data: {} });
});

// src/routes/seed.ts
init_modules_watch_stub();
var seed = new Hono2();
seed.use("*", authMiddleware);
seed.post("/seed/test-data", async (c) => {
  const { userId } = c.var.user;
  const code = String(Math.floor(1e5 + Math.random() * 9e5));
  const houseResult = await c.env.DB.prepare(
    "INSERT INTO houses (name, address, invite_code, invite_code_expires_at, creator_id) VALUES (?, ?, ?, ?, ?)"
  ).bind("\u6D4B\u8BD5\u5408\u79DF\u5C4B", "\u6D4B\u8BD5\u5730\u5740", code, new Date(Date.now() + 7 * 864e5).toISOString(), userId).run();
  const houseId = Number(houseResult.meta.last_row_id);
  await c.env.DB.prepare("INSERT INTO members (house_id, user_id, role) VALUES (?, ?, '\u5BDD\u5BA4\u957F')").bind(houseId, userId).run();
  await c.env.DB.prepare("INSERT INTO categories (house_id, name, sort_order) VALUES (?, '\u623F\u79DF', 1)").bind(houseId).run();
  await c.env.DB.prepare("INSERT INTO categories (house_id, name, sort_order) VALUES (?, '\u7535\u8D39', 2)").bind(houseId).run();
  await c.env.DB.prepare("INSERT INTO categories (house_id, name, sort_order) VALUES (?, '\u6C34\u8D39', 3)").bind(houseId).run();
  return c.json({ success: true, data: { house_id: houseId, invite_code: code } });
});

// src/router.ts
function createRouter(env) {
  const app2 = new Hono2();
  app2.route("/api", auth);
  app2.route("/api", houses);
  app2.route("/api", bills);
  app2.route("/api", settlements);
  app2.route("/api", challenges);
  app2.route("/api", stats);
  app2.route("/api", categories);
  app2.route("/api", templates);
  app2.route("/api", cronTasks);
  app2.route("/api", budget);
  app2.route("/api", budgetSuggestion);
  app2.route("/api", ranking);
  app2.route("/api", reports);
  app2.route("/api", payments);
  app2.route("/api", notify);
  app2.route("/api", notifications);
  if (env?.ENVIRONMENT !== "production") app2.route("/api", seed);
  return app2;
}
__name(createRouter, "createRouter");
var app = createRouter();
var router_default = app;

// src/index.ts
async function handleMonthlyBills(env) {
  const templates2 = await env.DB.prepare(
    "SELECT bt.*, h.creator_id FROM bill_templates bt JOIN houses h ON h.id = bt.house_id WHERE bt.enabled = 1"
  ).all();
  for (const tpl of templates2.results) {
    const members = await env.DB.prepare(
      "SELECT user_id FROM members WHERE house_id = ? AND status = 'active'"
    ).bind(tpl.house_id).all();
    if (!members.results.length) continue;
    const now = /* @__PURE__ */ new Date();
    const billDate = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const cnt = members.results.length;
    const splitAmount = Math.round(tpl.amount / cnt);
    const remainder = tpl.amount - splitAmount * cnt;
    const billResult = await env.DB.prepare(`
      INSERT INTO bills (house_id, creator_id, title, total_amount, category_id, bill_date, status)
      VALUES (?, ?, ?, ?, ?, ?, '\u5DF2\u786E\u8BA4')
    `).bind(tpl.house_id, tpl.creator_id, tpl.title, tpl.amount, tpl.category_id, billDate).run();
    const billId = Number(billResult.meta.last_row_id);
    for (let i = 0; i < members.results.length; i++) {
      const amt = splitAmount + (i === members.results.length - 1 ? remainder : 0);
      await env.DB.prepare(
        "INSERT INTO splits (bill_id, user_id, amount, split_type) VALUES (?, ?, ?, '\u5747\u644A')"
      ).bind(billId, members.results[i].user_id, amt).run();
    }
    await env.DB.prepare(`
      INSERT INTO cron_tasks (house_id, task_type, last_run_at, next_run_at, status)
      VALUES (?, 'monthly_bill', datetime('now'), datetime('now', '+1 month'), 'success')
    `).bind(tpl.house_id).run();
  }
}
__name(handleMonthlyBills, "handleMonthlyBills");
async function handleDailyTasks(env) {
  const expired = await env.DB.prepare(`
    SELECT sc.id, sc.item_id, s.house_id FROM settlement_challenges sc
    JOIN settlement_items si ON si.id = sc.item_id
    JOIN settlements s ON s.id = si.settlement_id
    WHERE sc.status = 'open' AND sc.timeout_at <= datetime('now')
  `).all();
  for (const ch of expired.results) {
    await env.DB.prepare(`
      UPDATE settlement_challenges SET status = 'timeout', handled_at = datetime('now')
      WHERE id = ?
    `).bind(ch.id).run();
    await env.DB.prepare(`
      UPDATE settlement_items SET status = 'confirmed', version = version + 1, updated_at = datetime('now')
      WHERE id = ? AND status = 'disputed'
    `).bind(ch.item_id).run();
    await env.DB.prepare(`
      INSERT INTO operation_logs (house_id, operator_id, action, target_table, target_id)
      VALUES (?, 0, 'challenge_timeout', 'settlement_challenges', ?)
    `).bind(ch.house_id, ch.id).run();
  }
}
__name(handleDailyTasks, "handleDailyTasks");
var src_default = {
  fetch: router_default.fetch,
  async scheduled(event, env) {
    switch (event.cron) {
      case "0 0 L * *":
        await handleMonthlyBills(env);
        break;
      case "0 0 * * *":
        await handleDailyTasks(env);
        break;
    }
  }
};

// node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
init_modules_watch_stub();
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
init_modules_watch_stub();
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    const body = JSON.stringify(error);
    const headers = {
      "Content-Type": "application/json",
      "MF-Experimental-Error-Stack": "true"
    };
    const encoded = encodeURIComponent(body);
    if (encoded.length <= 8192) {
      headers["MF-Experimental-Error-Stack-Payload"] = encoded;
    }
    return new Response(body, { status: 500, headers });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-gKw4Ld/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = src_default;

// node_modules/wrangler/templates/middleware/common.ts
init_modules_watch_stub();
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-gKw4Ld/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  scheduledTime;
  cron;
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=index.js.map
