import React from 'react';
import { renderToString } from 'react-dom/server';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

const html = renderToString(
  <ReactMarkdown remarkPlugins={[remarkGfm]}>
    {`| Filter | Current Support |\n|--------|-----------------|\n| A | B |`}
  </ReactMarkdown>
);
console.log(html);
