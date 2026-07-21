# QR Generator

A small, private QR-code generator that runs entirely in the browser. It supports:

- Text and website addresses
- Wi-Fi credentials
- Email links
- PNG and SVG downloads
- Foreground/background colors
- Multiple image sizes and error-correction levels

The generated content is processed in the browser and is not submitted to a server.

## Live site

After GitHub Pages is enabled, the site will be available at:

`https://mffg1993.github.io/qr-generator/`

## Publish with GitHub Pages

1. Create a public GitHub repository named `qr-generator`.
2. Upload all files in this project to the repository root.
3. Commit the files to the `main` branch.
4. Open **Settings → Pages**.
5. Under **Build and deployment**, select **Deploy from a branch**.
6. Select the `main` branch and the `/(root)` folder, then click **Save**.

GitHub will publish the site after the Pages deployment finishes.

## Run locally

Opening `index.html` directly usually works, but a local web server is more reliable:

```bash
python -m http.server 8000
```

Then open `http://localhost:8000`.

## Keyboard shortcut

Press `Ctrl+Enter` on Windows/Linux or `Command+Enter` on macOS to generate a QR code.

## Dependency

This project loads [`qrcode`](https://github.com/soldair/node-qrcode) version 1.5.4 from jsDelivr. The library is MIT licensed.

## License

MIT License. See [LICENSE](LICENSE).
