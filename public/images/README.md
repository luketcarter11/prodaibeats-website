# Image Assets

Place your static image assets in this folder.

## Required Images

- `$PRODcrypto.png` - PROD Token image used in the crypto payment page
  - This should be a square image, ideally 32x32 pixels to match SOL icon
  - PNG format with transparency is recommended for best quality

## Usage

These images are accessible directly from your application via:

```jsx
// Example usage
<Image 
  src="/images/$PRODcrypto.png"
  alt="PROD Token"
  width={32}
  height={32}
/>
```

Images placed in the public directory are served statically by Next.js. 