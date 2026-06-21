// npmPackages/data-importer/lib/httpClient.js
//
// Minimal drop-in for the deprecated meteor/http `HTTP` API, backed by
// meteor/fetch (a core package, always present on client + server). The
// Atmosphere data-importer api.use'd 'http', which pulled the http package into
// the resolved set; as an NPM workflow package there is no api.use, so importing
// 'meteor/http' would fail unless some other loaded package happens to provide it.
// This shim keeps the existing call sites (HTTP.post/put(url, {data}, cb)) intact.

import { fetch } from 'meteor/fetch';

function request(method, url, options, callback) {
  const opts = options || {};
  const headers = Object.assign({}, opts.headers);
  const fetchOptions = { method: method, headers: headers };

  if (opts.data !== undefined && opts.data !== null) {
    fetchOptions.body = JSON.stringify(opts.data);
    if (!headers['Content-Type'] && !headers['content-type']) {
      headers['Content-Type'] = 'application/json';
    }
  } else if (opts.content !== undefined) {
    fetchOptions.body = opts.content;
  }

  const promise = fetch(url, fetchOptions).then(function(res) {
    return res.text().then(function(text) {
      let data;
      try { data = JSON.parse(text); } catch (e) { data = undefined; }
      const result = { statusCode: res.status, content: text, data: data, headers: res.headers };
      if (!res.ok) {
        const err = new Error('HTTP ' + method + ' failed [' + res.status + ']');
        err.response = result;
        throw err;
      }
      return result;
    });
  });

  if (typeof callback === 'function') {
    promise.then(function(r) { callback(null, r); }, function(e) { callback(e); });
    return undefined;
  }
  return promise;
}

export const HTTP = {
  get: function(url, options, callback) { return request('GET', url, options, callback); },
  post: function(url, options, callback) { return request('POST', url, options, callback); },
  put: function(url, options, callback) { return request('PUT', url, options, callback); },
  del: function(url, options, callback) { return request('DELETE', url, options, callback); },
  call: function(method, url, options, callback) { return request(method, url, options, callback); }
};

export default { HTTP: HTTP };
