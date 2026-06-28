import { useCallback, useRef, useState } from 'react';
import { useWriteContract } from 'wagmi';
import {
  kaomojiNftAbiTyped,
  KAOMOJI_NFT_ADDRESS,
} from '../contracts/kaomojiNft';
import { getBasePublicClient } from '../lib/onchain/baseRpc';
import {
  buildGlyphsToCache,
  documentToOnchainClusters,
  encodeDocument,
} from '../lib/onchain/glyphIndex';
import { compositionToHex, uniqueGlyphIds } from '../lib/onchain/compositionCodec';
import { readCachedGlyphIds } from '../lib/onchain/fetchOwnedTokens';
import { formatContractError } from '../lib/onchain/txErrors';
import type { Document } from '../lib/glyphs/types';
import type { TxHash, TxStatus } from '../types/web3';

async function prepareGlyphs(clusters: Document, themeId: number, layoutAlign: number) {
  const bytes = await encodeDocument(clusters, themeId, layoutAlign);
  const onchainClusters = await documentToOnchainClusters(clusters);
  const glyphIds = uniqueGlyphIds(onchainClusters);
  const cached = await readCachedGlyphIds(glyphIds);
  const glyphsToCache = await buildGlyphsToCache(glyphIds, cached);
  return {
    composition: compositionToHex(bytes),
    glyphsToCache,
  };
}

async function waitForReceipt(hash: TxHash) {
  const client = getBasePublicClient();
  const receipt = await client.waitForTransactionReceipt({ hash });
  if (receipt.status === 'reverted') {
    throw new Error('Transaction reverted on-chain');
  }
}

export function useKaomojiWrite() {
  const { writeContractAsync, isPending: isWriting, reset } = useWriteContract();
  const [confirming, setConfirming] = useState(false);
  const activeHashRef = useRef<TxHash | null>(null);

  const [status, setStatus] = useState<TxStatus>({
    state: 'idle',
    hash: null,
    message: '',
  });

  const runTx = useCallback(
    async (confirmingMessage: string, write: () => Promise<TxHash>): Promise<TxHash> => {
      try {
        const txHash = await write();
        activeHashRef.current = txHash;
        setConfirming(true);
        setStatus({ state: 'confirming', hash: txHash, message: confirmingMessage });
        await waitForReceipt(txHash);
        setStatus({ state: 'success', hash: txHash, message: 'Transaction confirmed' });
        return txHash;
      } catch (err) {
        const raw = err instanceof Error ? err.message : 'Transaction failed';
        const txMessage = formatContractError(raw);
        setStatus({
          state: 'failed',
          hash: activeHashRef.current,
          message: txMessage,
        });
        throw err;
      } finally {
        setConfirming(false);
      }
    },
    [],
  );

  const reveal = useCallback(
    async (tokenId: string, clusters: Document, themeId: number, layoutAlign: number) => {
      setStatus({ state: 'pending', hash: null, message: 'Preparing reveal…' });
      const { composition, glyphsToCache } = await prepareGlyphs(clusters, themeId, layoutAlign);
      setStatus({ state: 'pending', hash: null, message: 'Confirm in wallet…' });
      return runTx('Revealing on-chain…', () =>
        writeContractAsync({
          address: KAOMOJI_NFT_ADDRESS,
          abi: kaomojiNftAbiTyped,
          functionName: 'reveal',
          args: [
            BigInt(tokenId),
            composition,
            glyphsToCache.map((g) => ({
              glyphId: g.glyphId,
              glyphData: g.glyphData,
              proof: g.proof,
            })),
          ],
        }),
      );
    },
    [runTx, writeContractAsync],
  );

  const edit = useCallback(
    async (tokenId: string, clusters: Document, themeId: number, layoutAlign: number) => {
      setStatus({ state: 'pending', hash: null, message: 'Preparing edit…' });
      const { composition, glyphsToCache } = await prepareGlyphs(clusters, themeId, layoutAlign);
      setStatus({ state: 'pending', hash: null, message: 'Confirm in wallet…' });
      return runTx('Applying edit…', () =>
        writeContractAsync({
          address: KAOMOJI_NFT_ADDRESS,
          abi: kaomojiNftAbiTyped,
          functionName: 'edit',
          args: [
            BigInt(tokenId),
            composition,
            glyphsToCache.map((g) => ({
              glyphId: g.glyphId,
              glyphData: g.glyphData,
              proof: g.proof,
            })),
          ],
        }),
      );
    },
    [runTx, writeContractAsync],
  );

  const sacrifice = useCallback(
    async (burnTokenId: string, targetTokenId: string) => {
      setStatus({ state: 'pending', hash: null, message: 'Confirm sacrifice…' });
      return runTx('Sacrificing NFT…', () =>
        writeContractAsync({
          address: KAOMOJI_NFT_ADDRESS,
          abi: kaomojiNftAbiTyped,
          functionName: 'sacrifice',
          args: [BigInt(burnTokenId), BigInt(targetTokenId)],
        }),
      );
    },
    [runTx, writeContractAsync],
  );

  const resetStatus = useCallback(() => {
    activeHashRef.current = null;
    reset();
    setConfirming(false);
    setStatus({ state: 'idle', hash: null, message: '' });
  }, [reset]);

  return {
    reveal,
    edit,
    sacrifice,
    status,
    isPending: isWriting || confirming,
    resetStatus,
  };
};
