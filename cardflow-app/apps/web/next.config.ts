import type { NextConfig } from 'next';

const config: NextConfig = {
  // fe-kit ship SOURCE TypeScript, không ship dist. Next phải transpile nó.
  // Bỏ dòng này thì build chết ở cú pháp TS trong node_modules — lỗi đọc rất
  // khó hiểu, nên nó nằm ngay đây kèm lý do.
  transpilePackages: ['fe-kit', '@cardflow-app/shared'],
  env: {
    API_GATEWAY_URI: process.env.API_GATEWAY_URI || 'http://localhost:8080',
    NEXT_PUBLIC_API_GATEWAY_URI: process.env.NEXT_PUBLIC_API_GATEWAY_URI || 'http://localhost:8080',
    APP_ENV: process.env.APP_ENV || 'uat',
  },
};

export default config;
