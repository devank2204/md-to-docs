import { useEffect, useLayoutEffect, useRef, useState } from 'react';
import { THEMES } from '@mdtodocs/compiler-core';
import { analytics } from '@/utils/analytics';
import { useStore } from '@/store';
import {
  prepareDocumentExport,
  downloadFile,
  writeFormattedClipboard,
} from '@/utils/exportHelpers';
import type { ExportInput, PreparedExport } from '@/utils/exportHelpers';

export function useDocumentExport(input: ExportInput, documentId: string) {
  const key = JSON.stringify([documentId, input]);
  const current = useRef(key);
  const lock = useRef('');
  const preparedPrint = useRef<Extract<
    PreparedExport,
    { kind: 'print' }
  > | null>(null);
  const requestId = useRef(0);
  const controller = useRef<AbortController | null>(null);
  const [state, setState] = useState<{
    key: string;
    busy?: boolean;
    preparing?: boolean;
    data?: PreparedExport;
    message?: string;
    error?: boolean;
  }>({ key });
  useLayoutEffect(() => {
    current.current = key;
    controller.current?.abort();
    lock.current = '';
    preparedPrint.current?.snapshot.dispose();
    preparedPrint.current = null;
    requestId.current += 1;
  }, [key]);
  useEffect(
    () => () => {
      current.current = '';
      controller.current?.abort();
      preparedPrint.current?.snapshot.dispose();
      requestId.current += 1;
    },
    [],
  );
  if (state.key !== key) setState({ key });
  const visible = state.key === key ? state : { key };
  // Also check the store synchronously: a resolved promise may precede effects.
  const isCurrent = () => {
    const latest = useStore.getState();
    return (
      current.current === key &&
      latest.activeDocumentId === documentId &&
      latest.markdown === input.markdown &&
      JSON.stringify({
        ...THEMES[latest.themeId],
        typography: {
          ...THEMES[latest.themeId].typography,
          baseFontSizePt: latest.baseFontSize,
        },
      }) === JSON.stringify(input.theme) &&
      JSON.stringify(latest.documentSignature) ===
        JSON.stringify(input.signature) &&
      ((input.destination !== 'clipboard' && input.destination !== 'html') ||
        latest.htmlOutput === (input.destination === 'html')) &&
      latest.destination ===
        (input.destination === 'html' ? 'clipboard' : input.destination)
    );
  };
  const event = (
    result:
      | 'print_opened'
      | 'prepared'
      | 'copied'
      | 'download_started'
      | 'share_opened'
      | 'canceled'
      | 'failed',
  ) =>
    analytics.track('document_delivery', {
      destination: input.destination,
      result,
    });
  const prepare = async () => {
    if (lock.current === key || !input.markdown.trim()) return;
    lock.current = key;
    const request = ++requestId.current;
    controller.current = new AbortController();
    setState({ key, busy: true, preparing: true });
    try {
      const data = await prepareDocumentExport(
        input,
        controller.current.signal,
      );
      if (isCurrent() && request === requestId.current) {
        if (data.kind === 'print') preparedPrint.current = data;
        setState({
          key,
          data,
          message:
            data.kind === 'print'
              ? 'Print document ready. Open Print, then choose Save as PDF if available.'
              : data.kind === 'file'
                ? 'Document ready. Choose how to save it.'
                : 'Formatting ready. Tap Copy to continue.',
        });
        event('prepared');
      } else if (data.kind === 'print') data.snapshot.dispose();
    } catch {
      if (isCurrent() && request === requestId.current) {
        setState({
          key,
          error: true,
          message:
            'Could not prepare this document. Your text is safe. Try again.',
        });
        event('failed');
      }
    } finally {
      if (lock.current === key && request === requestId.current)
        lock.current = '';
    }
  };
  const deliver = async (
    method: 'copy' | 'plain' | 'share' | 'download' | 'print',
  ) => {
    if (lock.current === key || !visible.data || !isCurrent()) return;
    lock.current = key;
    const data = visible.data;
    setState({ ...visible, busy: true });
    try {
      if (method === 'print' && data.kind === 'print') {
        data.snapshot.print();
        setState({
          key,
          data,
          message:
            'Print opened. Choose Save as PDF in your browser if available.',
        });
        event('print_opened');
      } else if (method === 'copy' && data.kind === 'clipboard') {
        await writeFormattedClipboard(data);
        if (isCurrent())
          setState({
            key,
            data,
            message:
              input.destination === 'google-docs'
                ? 'Copied. Open Google Docs, touch and hold, then Paste. Formatting may vary by app.'
                : 'Formatted text copied.',
          });
        event('copied');
        useStore.getState().recordSuccessfulExport();
      } else if (method === 'plain') {
        await navigator.clipboard.writeText(input.markdown);
        if (isCurrent())
          setState({ key, data, message: 'Markdown copied as plain text.' });
        event('copied');
      } else if (data.kind === 'file' && method === 'share') {
        await navigator.share({ files: [data.file] });
        if (isCurrent())
          setState({
            key,
            data,
            message: 'Share sheet closed. Check the app you selected.',
          });
        event('share_opened');
      } else if (data.kind === 'file' && method === 'download') {
        downloadFile(data.file);
        if (isCurrent())
          setState({
            key,
            data,
            message: 'Download started. Check your browser downloads.',
            busy: true,
          });
        event('download_started');
      }
    } catch (error) {
      const canceled = error instanceof Error && error.name === 'AbortError';
      if (isCurrent())
        setState({
          key,
          data,
          error: !canceled,
          message: canceled
            ? 'Sharing canceled. Your document is still ready.'
            : 'This action was unavailable. Try another option below.',
        });
      event(canceled ? 'canceled' : 'failed');
    } finally {
      if (method === 'download') {
        // Keep a double tap from starting two browser downloads.
        setTimeout(() => {
          if (lock.current === key) lock.current = '';
          if (isCurrent())
            setState((existing) =>
              existing.key === key ? { ...existing, busy: false } : existing,
            );
        }, 500);
      } else if (lock.current === key) lock.current = '';
    }
  };
  const cancel = () => {
    controller.current?.abort();
    requestId.current += 1;
    lock.current = '';
    preparedPrint.current?.snapshot.dispose();
    preparedPrint.current = null;
    setState({ key, message: 'Preparation canceled. Your text is safe.' });
  };
  return { ...visible, prepare, deliver, cancel };
}
