// @ts-nocheck
const { withContentCollections } = require("content-collections");
const { withBotId } = require("botid/next/config");
const nextConfig = { output: 'export', trailingSlash: true, images: { unoptimized: true }, eslint: { ignoreDuringBuilds: true } };
module.exports = withContentCollections(withBotId(nextConfig));
