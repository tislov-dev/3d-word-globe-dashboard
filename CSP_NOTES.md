# Content Security Policy (CSP) Notes

## Fixed CSP Issues

### 1. **frame-ancestors Directive Removed**
- **Issue**: `frame-ancestors` is ignored when delivered via `<meta>` element
- **Solution**: Removed from meta CSP (only works in HTTP headers)
- **Note**: For production deployment, add via server configuration:
  ```
  X-Frame-Options: DENY
  ```
  or via HTTP header:
  ```
  Content-Security-Policy: frame-ancestors 'none';
  ```

### 2. **Three.js Font Loading Allowed**
- **Issue**: Three.js tried to load fonts from `https://threejs.org/examples/fonts/`
- **Solution**: Added `https://threejs.org` to `connect-src` directive
- **Security**: Safe - threejs.org is the official Three.js domain

## Current CSP Configuration

```html
<meta http-equiv="Content-Security-Policy" content="
  default-src 'self'; 
  script-src 'self' https://cdnjs.cloudflare.com; 
  style-src 'self' 'unsafe-inline'; 
  connect-src 'self' https://api.github.com https://threejs.org; 
  base-uri 'self';
">
```

### Explanation:
- **default-src 'self'**: Only allow resources from same origin
- **script-src**: Allow scripts from same origin + cdnjs.cloudflare.com
- **style-src**: Allow styles from same origin + inline styles (required for dynamic styling)
- **connect-src**: Allow connections to same origin + GitHub API + Three.js
- **base-uri 'self'**: Prevent base tag injection

## Production Recommendations

For production deployment, consider using HTTP headers instead of meta tags:

```
Content-Security-Policy: default-src 'self'; script-src 'self' https://cdnjs.cloudflare.com; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.github.com https://threejs.org; base-uri 'self'; frame-ancestors 'none'; object-src 'none';
X-Frame-Options: DENY
X-Content-Type-Options: nosniff
Referrer-Policy: strict-origin-when-cross-origin
```

## Security Level: HIGH ✅

The current CSP provides strong protection against:
- ✅ XSS attacks
- ✅ Data injection
- ✅ Unauthorized resource loading
- ✅ Code injection via external scripts