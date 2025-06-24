import axios from 'axios';
import { parse } from 'node-html-parser';

const fetch = async (url) => {
  const { data: html } = await axios.get(url);
  const root = parse(html);
  const title = root.querySelector('title')?.text || '';
  const articleEl = root.querySelector('article') || root;
  return {
    title: title.trim(),
    text: articleEl.text.trim(),
  };
};

export default { fetch };
