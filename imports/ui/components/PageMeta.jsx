// imports/ui/components/PageMeta.jsx
// Per-route title/description/social tags. Marketing pages only for now.
import React from 'react';
import { Helmet } from 'react-helmet';

export function PageMeta({ title, description, image, path }) {
  const origin = 'https://orbital.healthcare';
  return (
    <Helmet>
      <title>{title}</title>
      <meta name="description" content={description} />
      <meta property="og:title" content={title} />
      <meta property="og:description" content={description} />
      <meta property="og:type" content="website" />
      {path ? <meta property="og:url" content={origin + path} /> : null}
      {image ? <meta property="og:image" content={origin + image} /> : null}
      <meta name="twitter:card" content={image ? 'summary_large_image' : 'summary'} />
    </Helmet>
  );
}

export default PageMeta;
