import { NextResponse } from 'next/server';

export async function GET() {
  const assetLinks = [
    {
      relation: [
        "delegate_permission/common.handle_all_urls",
        "delegate_permission/common.get_login_creds"
      ],
      target: {
        namespace: "android_app",
        package_name: "app.web.aura",
        "sha256_cert_fingerprints": [
          "95:8E:37:D3:25:7A:B6:76:B4:9F:75:D2:7A:EC:05:77:C9:B6:9E:AD:52:49:93:87:AD:26:CD:4C:0E:EE:6F:40"
        ]
      }
    }
  ];

  return NextResponse.json(assetLinks);
}
