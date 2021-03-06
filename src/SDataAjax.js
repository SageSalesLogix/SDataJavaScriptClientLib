/* Copyright (c) 2010, Sage Software, Inc. All rights reserved.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

(function(){
    "use strict";
    var Sage = window.Sage,
        S = Sage,
        A = Sage.namespace('Sage.SData.Client.Ajax');

    var successful = function(code)
    {
        return ((code >= 200 && code < 300) || code === 304);
    };

    var onReadyStateChange = function(xhr, o)
    {
        if (xhr.readyState == 4)
        {
            if (successful(xhr.status))
            {
                if (o.success)
                    o.success.call(o.scope || this, xhr, o);
            }
            else if (xhr.status === 0)
            {
                var isAbortedRequest = false;
                try
                {
                    // FF will throw an exception on access of statusText on an aborted request
                    isAbortedRequest = (xhr.statusText === '');
                }
                catch (exception)
                {
                    isAbortedRequest = true;
                }

                if (isAbortedRequest)
                {
                    var handler = o.aborted || o.failure;
                    if (handler)
                        handler.call(o.scope || this, xhr, o);
                }
                else
                {
                    if (o.failure)
                        o.failure.call(o.scope || this, xhr, o);
                }
            }
            else
            {
                if (o.failure)
                    o.failure.call(o.scope || this, xhr, o);
            }
        }
    };

    var onTimeout = function(xhr, o) {
        var handler = o.timeout || o.failure;
        if (handler) {
            handler.call(o.scope || this, xhr, o);
        }
    };

    var bindOnTimeout = function(xhr, o) {
        xhr.ontimeout = function() {
            onTimeout.call(xhr, xhr, o);
        };
    };


    var bindOnReadyStateChange = function(xhr, o) {
        xhr.onreadystatechange = function() {
            onReadyStateChange.call(xhr, xhr, o);
        };
    };

    var buildParameters = function(params) {
        var query = [];
        for (var n in params)
        {
            query.push(
                encodeURIComponent(n) +
                '=' +
                encodeURIComponent(params[n])
            );
        }
        return query.join('&');
    };

    Sage.apply(Sage.SData.Client.Ajax, {
        request: function(o) {
            o = S.apply({}, o);

            o.params = S.apply({}, o.params);
            o.headers = S.apply({}, o.headers);

            if (o.cache !== true) {
                o.params[o.cacheParam || '_t'] = (new Date()).getTime();
            }

            o.method = o.method || 'GET';

            var parameters = buildParameters(o.params);
            if (parameters)
                o.url = o.url + (/\?/.test(o.url) ? '&' : '?') + parameters;

            var xhr = new XMLHttpRequest();

            if (o.user)
                xhr.open(o.method, o.url, o.async !== false, o.user, o.password);
            else
                xhr.open(o.method, o.url, o.async !== false);

            if (o.withCredentials) xhr.withCredentials = true;

            try
            {
                xhr.setRequestHeader('Accept', o.accept || '*/*');
                xhr.setRequestHeader('X-Requested-With', 'XMLHttpRequest');

                if (o.contentType)
                    xhr.setRequestHeader('Content-Type', o.contentType);

                for (var n in o.headers)
                    xhr.setRequestHeader(n, o.headers[n]);

                var etagCache = o.etagCache;
                if (o.cache && etagCache && etagCache.etag) {
                    xhr.setRequestHeader('If-None-Match', etagCache.etag);
                }

            }
            catch (headerException)
            {
            }


            if (o.async !== false)
            {
                // Set the timeout only if the request is async
                if (typeof o.requestTimeout === 'number' && o.requestTimeout >= 0 && typeof xhr.timeout === 'number')
                {
                    xhr.timeout = o.requestTimeout;
                    bindOnTimeout(xhr, o);
                }

                bindOnReadyStateChange(xhr, o);

                xhr.send(o.body || null);
            }
            else
            {
                xhr.send(o.body || null);

                onReadyStateChange(xhr, o);
            }

            return xhr;
        },
        cancel: function(xhr) {
            xhr.abort();
        }
    });
})();
