import { useCallback, useEffect, useState } from 'react';
import {
  copyImageToClipboard,
  downloadImage,
  renderKaomojiSharePng,
} from '../../../lib/share';
import type { GlyphLookup, GlyphPack } from '../../../lib/glyphs';
import { Button } from '../../ui/Button';
import { Callout } from '../../ui/Callout';
import { Modal } from '../../ui/Modal';
import styles from './KaomojiShareModal.module.css';

const SHARE_TWEET_TEXT = `Made my favorite kaomoji in the @kaomojinft editor
Excited to turn my future NFT into this one`;

interface KaomojiShareModalProps {
  open: boolean;
  onClose: () => void;
  text: string;
  pack: GlyphPack;
  lookup: GlyphLookup;
}

type ShareStatus = 'generating' | 'ready' | 'copied' | 'error';

function buildTweetText(): string {
  return SHARE_TWEET_TEXT;
}

function XIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true" className={styles.xIcon}>
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231 5.451-6.231zm-1.161 17.52h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

export function KaomojiShareModal({ open, onClose, text, pack, lookup }: KaomojiShareModalProps) {
  const [status, setStatus] = useState<ShareStatus>('generating');
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [blob, setBlob] = useState<Blob | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [twitterHint, setTwitterHint] = useState(false);
  const [clipboardUnsupported, setClipboardUnsupported] = useState(false);

  useEffect(() => {
    if (!open) {
      setPreviewUrl((prev) => {
        if (prev) URL.revokeObjectURL(prev);
        return null;
      });
      setBlob(null);
      setStatus('generating');
      setErrorMessage(null);
      setTwitterHint(false);
      setClipboardUnsupported(false);
      return;
    }

    let cancelled = false;

    setStatus('generating');
    setErrorMessage(null);
    setTwitterHint(false);
    setClipboardUnsupported(false);

    renderKaomojiSharePng(text, pack, lookup)
      .then((pngBlob) => {
        if (cancelled) return;
        const url = URL.createObjectURL(pngBlob);
        setBlob(pngBlob);
        setPreviewUrl((prev) => {
          if (prev) URL.revokeObjectURL(prev);
          return url;
        });
        setStatus('ready');
      })
      .catch((err: unknown) => {
        if (cancelled) return;
        setStatus('error');
        setErrorMessage(err instanceof Error ? err.message : 'Failed to generate image');
      });

    return () => {
      cancelled = true;
    };
  }, [open, text, pack, lookup]);

  const handleCopy = useCallback(async () => {
    if (!blob) return;
    try {
      await copyImageToClipboard(blob);
      setStatus('copied');
      setTwitterHint(false);
      setClipboardUnsupported(false);
    } catch {
      setClipboardUnsupported(true);
    }
  }, [blob]);

  const handleSave = useCallback(() => {
    if (!blob) return;
    downloadImage(blob, 'kaomoji.png');
  }, [blob]);

  const handleShareOnX = useCallback(async () => {
    if (!blob) return;

    try {
      await copyImageToClipboard(blob);
      setTwitterHint(true);
      setClipboardUnsupported(false);
      setStatus('copied');
    } catch {
      setClipboardUnsupported(true);
      setTwitterHint(false);
      return;
    }

    const tweetUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(buildTweetText())}`;
    window.open(tweetUrl, '_blank', 'noopener,noreferrer');
  }, [blob]);

  return (
    <Modal open={open} onClose={onClose} title="Share Kaomoji">
      <div className={styles.content}>
        <div className={styles.previewWrap}>
          {status === 'generating' && (
            <div className={styles.previewPlaceholder}>
              <span className={styles.loadingText}>Generating…</span>
            </div>
          )}
          {status === 'error' && (
            <div className={styles.previewPlaceholder}>
              <span className={styles.errorText}>{errorMessage ?? 'Something went wrong'}</span>
            </div>
          )}
          {previewUrl && status !== 'error' && (
            <img src={previewUrl} alt="Kaomoji share preview" className={styles.preview} />
          )}
        </div>

        {status === 'copied' && !clipboardUnsupported && (
          <p className={styles.feedback} role="status">
            Copied!
          </p>
        )}

        {twitterHint && (
          <Callout variant="tip" title="Image copied">
            Paste with ⌘V / Ctrl+V in the tweet composer.
          </Callout>
        )}

        {clipboardUnsupported && (
          <Callout variant="warning" title="Clipboard unavailable">
            Use Save to download the image, then attach it manually in X.
          </Callout>
        )}

        <div className={styles.actions}>
          <Button variant="ghost" onClick={handleSave} disabled={!blob || status === 'generating'}>
            Save
          </Button>
          <Button variant="secondary" onClick={handleCopy} disabled={!blob || status === 'generating'}>
            Copy
          </Button>
          <Button
            variant="primary"
            className={styles.xButton}
            onClick={handleShareOnX}
            disabled={!blob || status === 'generating'}
          >
            <XIcon />
            Share on X
          </Button>
        </div>
      </div>
    </Modal>
  );
}
