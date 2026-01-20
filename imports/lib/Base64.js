let decoder;
let haveU8 = (typeof Uint8Array == 'function');


Base64 = {
    decode: function (a) {
        var isString = (typeof a == 'string');
        var i;
        if (decoder === undefined) {
            var b64 = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/",
                ignore = "= \f\n\r\t\u00A0\u2028\u2029";
            decoder = [];
            for (i = 0; i < 64; ++i)
                decoder[b64.charCodeAt(i)] = i;
            for (i = 0; i < ignore.length; ++i)
                decoder[ignore.charCodeAt(i)] = -1;
            // RFC 3548 URL & file safe encoding
            decoder['-'.charCodeAt(0)] = decoder['+'.charCodeAt(0)];
            decoder['_'.charCodeAt(0)] = decoder['/'.charCodeAt(0)];
        }
        var out = haveU8 ? new Uint8Array(a.length * 3 >> 2) : [];
        var bits = 0, char_count = 0, len = 0;
        for (i = 0; i < a.length; ++i) {
            var c = isString ? a.charCodeAt(i) : a[i];
            if (c == 61) // '='.charCodeAt(0)
                break;
            c = decoder[c];
            if (c == -1)
                continue;
            if (c === undefined)
                throw 'Illegal character at offset ' + i;
            bits |= c;
            if (++char_count >= 4) {
                out[len++] = (bits >> 16);
                out[len++] = (bits >> 8) & 0xFF;
                out[len++] = bits & 0xFF;
                bits = 0;
                char_count = 0;
            } else {
                bits <<= 6;
            }
        }
        switch (char_count) {
        case 1:
            throw "Base64 encoding incomplete: at least 2 bits missing";
        case 2:
            out[len++] = (bits >> 10);
            break;
        case 3:
            out[len++] = (bits >> 16);
            out[len++] = (bits >> 8) & 0xFF;
            break;
        }
        if (haveU8 && out.length > len) // in case it was originally longer because of ignored characters
            out = out.subarray(0, len);
        return out;
    },
    pretty: function (str) {
        // fix padding
        if (str.length % 4 > 0)
            str = (str + '===').slice(0, str.length + str.length % 4);
        // convert RFC 3548 to standard Base64
        str = str.replace(/-/g, '+').replace(/_/g, '/');
        // 80 column width
        return str.replace(/(.{80})/g, '$1\n');
    },
    unarmor: function (a) {
        var m = Base64.re.exec(a);
        if (m) {
            if (m[1])
                a = m[1];
            else if (m[2])
                a = m[2];
            else if (m[3])
                a = m[3];
            else
                throw "RegExp out of sync";
        }
        return Base64.decode(a);
    },
    re: /-----BEGIN [^-]+-----([A-Za-z0-9+/=\s]+)-----END [^-]+-----|begin-base64[^\n]+\n([A-Za-z0-9+/=\s]+)====|^([A-Za-z0-9+/=\s]+)$/
};



export default Base64;
