import { Link } from 'react-router-dom';
import { COLLECTION } from '../../config/external';
import { Callout } from '../../components/ui/Callout';
import { CodeBlock } from '../../components/ui/CodeBlock';
import { SectionHead } from '../../components/ui/SectionHead';
import styles from './DocsPage.module.css';

interface DocsPageShellProps {
  title: string;
  subtitle?: string;
  breadcrumb: string;
  prev?: { to: string; label: string };
  next?: { to: string; label: string };
  children: React.ReactNode;
}

export function DocsPageShell({
  title,
  subtitle,
  breadcrumb,
  prev,
  next,
  children,
}: DocsPageShellProps) {
  return (
    <article>
      <p className={styles.breadcrumb}>Docs / {breadcrumb}</p>
      <SectionHead title={title} subtitle={subtitle} />
      <input
        type="search"
        className={styles.search}
        placeholder="Search docs…"
        aria-label="Search documentation"
      />
      <div className={`prose ${styles.prose}`}>{children}</div>
      <nav className={styles.pagination}>
        {prev ? (
          <Link to={prev.to}>← {prev.label}</Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link to={next.to}>{next.label} →</Link>
        ) : (
          <span />
        )}
      </nav>
    </article>
  );
}

export function GettingStartedPage() {
  return (
    <DocsPageShell
      title="Getting Started"
      subtitle="QUICK START"
      breadcrumb="Getting Started"
      next={{ to: '/docs/guides', label: 'User Guides' }}
    >
      <div className={styles.quickLinks}>
        <span>Quick links:</span>
        <Link to="/studio">Studio</Link>
        <Link to="/docs/guides">Modify</Link>
        <Link to="/docs/mechanics">Burn</Link>
      </div>
      <h2>Welcome to {COLLECTION.nameJa}</h2>
      <p>
        Kaomoji is an Ethereum-based NFT collection where holders can modify, burn,
        and eventually evolve their on-chain characters.
      </p>
      <Callout variant="tip" title="Before you start">
        You need an Ethereum wallet (MetaMask, WalletConnect, etc.) and ETH for gas fees.
      </Callout>
      <h2>Connect Your Wallet</h2>
      <p>
        Click Connect Wallet in the header or visit the Studio. Your owned Kaomoji
        will appear in the inventory panel.
      </p>
      <h2>Next Steps</h2>
      <ul>
        <li>Read the User Guides for modify and burn flows</li>
        <li>Review smart contract addresses on Etherscan</li>
        <li>Join Discord for community support</li>
      </ul>
    </DocsPageShell>
  );
}

export function GuidesPage() {
  return (
    <DocsPageShell
      title="User Guides"
      subtitle="HOW TO USE THE EDITOR"
      breadcrumb="User Guides"
      prev={{ to: '/docs', label: 'Getting Started' }}
      next={{ to: '/docs/contracts', label: 'Smart Contracts' }}
    >
      <h2>Modify an NFT</h2>
      <p>
        Select an NFT from your inventory, choose a trait category (eyes, mouth, hands, background),
        pick a variant, preview the change, and confirm the on-chain transaction.
      </p>
      <Callout variant="warning" title="Gas fees">
        Every modify transaction requires ETH for gas. Preview before confirming.
      </Callout>
      <h2>Burn an NFT</h2>
      <p>
        Burning is permanent. Type BURN to confirm, review the warning, and sign the transaction.
        The token will be destroyed and removed from your wallet.
      </p>
      <Callout variant="danger" title="Irreversible">
        Burned NFTs cannot be recovered. Proceed with caution.
      </Callout>
    </DocsPageShell>
  );
}

export function ContractsPage() {
  return (
    <DocsPageShell
      title="Smart Contracts"
      subtitle="ON-CHAIN ADDRESSES"
      breadcrumb="Smart Contracts"
      prev={{ to: '/docs/guides', label: 'User Guides' }}
      next={{ to: '/docs/mechanics', label: 'Collection Mechanics' }}
    >
      <h2>Collection Contract</h2>
      <p>Main ERC-721 contract for the Kaomoji collection (placeholder):</p>
      <CodeBlock>{COLLECTION.contractAddress}</CodeBlock>
      <h2>Network</h2>
      <p>
        Chain ID: {COLLECTION.chainId} ({COLLECTION.chainName} Mainnet)
      </p>
      <Callout variant="tip">
        Always verify contract addresses on Etherscan before interacting.
      </Callout>
    </DocsPageShell>
  );
}

export function MechanicsPage() {
  return (
    <DocsPageShell
      title="Collection Mechanics"
      subtitle="MODIFY · BURN · EVOLVE"
      breadcrumb="Collection Mechanics"
      prev={{ to: '/docs/contracts', label: 'Smart Contracts' }}
      next={{ to: '/docs/faq', label: 'FAQ' }}
    >
      <h2>Modify</h2>
      <p>
        Holders can swap individual traits stored on-chain. Each trait category has
        multiple variants. Modifications update token metadata permanently.
      </p>
      <h2>Burn</h2>
      <p>
        Burning removes a token from circulation. Total supply decreases. This action
        is intentional and cannot be reversed.
      </p>
      <h2>Evolve (Coming Soon)</h2>
      <p>
        Future mechanics will allow transformation into new forms. Details to be
        announced via roadmap updates.
      </p>
    </DocsPageShell>
  );
}

export function FaqPage() {
  return (
    <DocsPageShell
      title="FAQ"
      subtitle="COMMON QUESTIONS"
      breadcrumb="FAQ"
      prev={{ to: '/docs/mechanics', label: 'Collection Mechanics' }}
    >
      <h2>What is a Kaomoji NFT?</h2>
      <p>
        On-chain characters based on Japanese ASCII emoticons (kaomoji). Unlike static
        NFTs, they can be modified and burned by holders.
      </p>
      <h2>Which wallet should I use?</h2>
      <p>
        Any Ethereum-compatible wallet: MetaMask, Rainbow, Coinbase Wallet, WalletConnect-supported apps.
      </p>
      <h2>Can I undo a burn?</h2>
      <p>No. Burning is permanent and irreversible.</p>
      <h2>When is Evolve launching?</h2>
      <p>Evolve mechanics are planned for a future roadmap phase. Follow announcements on X and Discord.</p>
    </DocsPageShell>
  );
}
