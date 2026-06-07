import type { AnchorHTMLAttributes, ReactNode } from 'react';
import { Link, type LinkProps } from 'react-router-dom';
import styles from './Chip.module.css';

type Variant = 'nav' | 'filter' | 'external' | 'opensea';

interface ChipStyleProps {
  variant?: Variant;
  active?: boolean;
  children: ReactNode;
  className?: string;
}

function chipClassName(variant: Variant, active: boolean | undefined, className?: string) {
  return [styles.chip, styles[variant], active && styles.active, className]
    .filter(Boolean)
    .join(' ');
}

type ChipAsSpan = ChipStyleProps & { as: 'span' };
type ChipAsLink = ChipStyleProps & Omit<LinkProps, 'className'> & { as?: never; href?: never; external?: false };
type ChipAsAnchor = ChipStyleProps & Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'className'> & {
  href: string;
  external: true;
  to?: never;
  as?: never;
};

type ChipProps = ChipAsSpan | ChipAsLink | ChipAsAnchor;

export function Chip(props: ChipProps) {
  const { variant = 'nav', active, children, className } = props;
  const cls = chipClassName(variant, active, className);

  if ('as' in props && props.as === 'span') {
    return <span className={cls}>{children}</span>;
  }

  if ('external' in props && props.external) {
    const { external: _, variant: __, active: ___, className: ____, children: _____, ...anchorProps } = props;
    return (
      <a className={cls} target="_blank" rel="noopener noreferrer" {...anchorProps}>
        {children}
      </a>
    );
  }

  const { to, ...linkProps } = props as ChipAsLink;
  return (
    <Link to={to} className={cls} {...linkProps}>
      {children}
    </Link>
  );
}
