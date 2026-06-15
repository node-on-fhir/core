// packages/smart-web-messaging/tests/client/UrlValidator.tests.js

Tinytest.add('UrlValidator - blocks javascript: URLs', function(test) {
  test.isFalse(UrlValidator.isSafeUrl('javascript:alert(1)'));
  test.isFalse(UrlValidator.isSafeUrl('javascript:void(0)'));
  test.isFalse(UrlValidator.isSafeUrl(' javascript:alert(1) '));
  test.isFalse(UrlValidator.isSafeUrl('JAVASCRIPT:alert(1)'));
});

Tinytest.add('UrlValidator - blocks data: URLs', function(test) {
  test.isFalse(UrlValidator.isSafeUrl('data:text/html,<script>alert(1)</script>'));
  test.isFalse(UrlValidator.isSafeUrl('data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg=='));
});

Tinytest.add('UrlValidator - blocks vbscript: URLs', function(test) {
  test.isFalse(UrlValidator.isSafeUrl('vbscript:msgbox("XSS")'));
  test.isFalse(UrlValidator.isSafeUrl('VBSCRIPT:alert(1)'));
});

Tinytest.add('UrlValidator - allows safe http/https URLs', function(test) {
  test.isTrue(UrlValidator.isSafeUrl('http://example.com'));
  test.isTrue(UrlValidator.isSafeUrl('https://example.com'));
  test.isTrue(UrlValidator.isSafeUrl('https://example.com/path?query=1'));
  test.isTrue(UrlValidator.isSafeUrl('https://sub.example.com:8080/path'));
});

Tinytest.add('UrlValidator - allows relative URLs', function(test) {
  test.isTrue(UrlValidator.isSafeUrl('/relative/path'));
  test.isTrue(UrlValidator.isSafeUrl('./relative/path'));
  test.isTrue(UrlValidator.isSafeUrl('../parent/path'));
  test.isTrue(UrlValidator.isSafeUrl('/'));
});

Tinytest.add('UrlValidator - allows mailto: URLs', function(test) {
  test.isTrue(UrlValidator.isSafeUrl('mailto:test@example.com'));
  test.isTrue(UrlValidator.isSafeUrl('mailto:test@example.com?subject=Test'));
});

Tinytest.add('UrlValidator - handles malformed URLs', function(test) {
  test.isFalse(UrlValidator.isSafeUrl(''));
  test.isFalse(UrlValidator.isSafeUrl(null));
  test.isFalse(UrlValidator.isSafeUrl(undefined));
  test.isFalse(UrlValidator.isSafeUrl(123));
  test.isFalse(UrlValidator.isSafeUrl({}));
  test.isFalse(UrlValidator.isSafeUrl([]));
});

Tinytest.add('UrlValidator - sanitizeUrl returns null for unsafe URLs', function(test) {
  test.isNull(UrlValidator.sanitizeUrl('javascript:alert(1)'));
  test.isNull(UrlValidator.sanitizeUrl('data:text/html,<script>alert(1)</script>'));
  test.equal(UrlValidator.sanitizeUrl('https://example.com'), 'https://example.com');
});

Tinytest.add('UrlValidator - isSameOrigin detects same origin', function(test) {
  // Mock window.location.origin for testing
  const originalOrigin = window.location.origin;
  
  test.isTrue(UrlValidator.isSameOrigin(window.location.origin + '/path'));
  test.isTrue(UrlValidator.isSameOrigin('/relative/path'));
  test.isFalse(UrlValidator.isSameOrigin('https://different-domain.com/path'));
  test.isFalse(UrlValidator.isSameOrigin('http://localhost:4000/path')); // Different port
});