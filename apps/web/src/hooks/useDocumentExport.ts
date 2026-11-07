import { useEffect, useLayoutEffect, useRef, useState } from 'react';
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
  const [state, setState] = useState<{
    key: string;
    busy?: boolean;
    data?: PreparedExport;
    message?: string;
    error?: boolean;
  }>({ key });
  useLayoutEffect(() => {
    current.current = key;
  }, [key]);
  useEffect(
    () => () => {
      current.current = '';
    },
    [],
  );
  const visible = state.key === key ? state : { key };
  // Also check the store synchronously: a resolved promise may precede effects.
  const isCurrent = () => {
    const latest = useStore.getState();
    return (
      current.current === key &&
      latest.activeDocumentId === documentId &&
      latest.markdown === input.markdown &&
      latest.destination ===
        (input.destination === 'html' ? 'clipboard' : input.destination)
    );
  };
  const event = (
    result:
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
    setState({ key, busy: true });
    try {
      const data = await prepareDocumentExport(input);
      if (isCurrent()) {
        setState({
          key,
          data,
          message:
            data.kind === 'file'
              ? 'Document ready. Choose how to save it.'
              : 'Formatting ready. Tap Copy to continue.',
        });
        event('prepared');
      }
    } catch {
      if (isCurrent()) {
        setState({
          key,
          error: true,
          message:
            'Could not prepare this document. Your text is safe. Try again.',
        });
        event('failed');
      }
    } finally {
      if (lock.current === key) lock.current = '';
    }
  };
  const deliver = async (method: 'copy' | 'plain' | 'share' | 'download') => {
    if (lock.current === key || !visible.data) return;
    lock.current = key;
    const data = visible.data;
    setState({ ...visible, busy: true });
    try {
      if (method === 'copy' && data.kind === 'clipboard') {
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
  return { ...visible, prepare, deliver };
}
