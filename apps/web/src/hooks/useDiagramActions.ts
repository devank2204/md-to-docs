import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { copyDiagramImage, svgImageBlob } from '@/utils/diagramImages';
import { downloadFile } from '@/utils/exportHelpers';

type Action =
  'image' | 'svg' | 'code' | 'download-svg' | 'download-png' | 'download-jpeg';
export function useDiagramActions(
  svg: string,
  code: string,
  scope = '',
  imageOptions: { scale?: number; background?: string } = {},
) {
  const key = JSON.stringify([svg, code, scope, imageOptions]);
  const current = useRef(key);
  const controller = useRef(new AbortController());
  const lock = useRef('');
  const [state, setState] = useState<{
    key: string;
    busy?: boolean;
    copied?: Action;
    message?: string;
    error?: boolean;
  }>({ key });
  useLayoutEffect(() => {
    current.current = key;
    controller.current.abort();
    controller.current = new AbortController();
    lock.current = '';
  }, [key]);
  useEffect(
    () => () => {
      current.current = '';
      controller.current.abort();
    },
    [],
  );
  const visible = state.key === key ? state : { key };
  const run = async (action: Action) => {
    if (
      lock.current === key ||
      current.current !== key ||
      (action !== 'code' && !svg)
    )
      return;
    lock.current = key;
    setState({
      key,
      busy: true,
      message:
        action === 'image'
          ? 'Preparing image for your clipboard…'
          : 'Preparing diagram…',
    });
    const signal = controller.current.signal;
    try {
      if (action === 'image')
        await copyDiagramImage(svg, { ...imageOptions, signal });
      else if (action === 'svg' || action === 'code')
        await navigator.clipboard.writeText(action === 'svg' ? svg : code);
      else {
        const extension =
          action === 'download-jpeg'
            ? 'jpg'
            : action === 'download-png'
              ? 'png'
              : 'svg';
        const blob =
          extension === 'svg'
            ? new Blob([svg], { type: 'image/svg+xml' })
            : await svgImageBlob(svg, {
                ...imageOptions,
                signal,
                mime: extension === 'jpg' ? 'image/jpeg' : 'image/png',
              });
        if (current.current !== key || signal.aborted) return;
        downloadFile(
          new File([blob], `diagram.${extension}`, { type: blob.type }),
        );
      }
      if (current.current === key)
        setState({
          key,
          copied: action.startsWith('download') ? undefined : action,
          message: action.startsWith('download')
            ? 'Download started. Check your browser downloads.'
            : action === 'image'
              ? 'Image copied. Paste it into your document or chat.'
              : action === 'svg'
                ? 'SVG code copied.'
                : 'Mermaid source copied.',
        });
    } catch {
      if (current.current === key && !signal.aborted)
        setState({
          key,
          error: true,
          message: action.startsWith('download')
            ? 'Could not download this image. Try SVG or copy the source.'
            : 'Could not copy. Clipboard access is unavailable. Try again, copy the source, or download the image.',
        });
    } finally {
      if (lock.current === key) lock.current = '';
    }
  };
  return { ...visible, run };
}
