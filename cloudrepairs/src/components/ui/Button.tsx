import type { ReactNode } from 'react';
import { Link } from 'react-router';
import { Icon, type IconName } from './Icon';
import styles from './Button.module.css';

type Variant = 'primary' | 'secondary' | 'ghost' | 'inverse' | 'inverse-ghost';

interface BaseProps {
  children: ReactNode;
  variant?: Variant;
  size?: 'm' | 'l';
  icon?: IconName;
  iconPosition?: 'start' | 'end';
  className?: string;
}

type ButtonProps = BaseProps &
  (
    | { to: string; href?: never; onClick?: never; type?: never }
    | { href: string; to?: never; onClick?: never; type?: never }
    | { onClick: () => void; type?: 'button' | 'submit'; to?: never; href?: never }
  );

/** Единая кнопка: внутренняя ссылка (to), внешняя ссылка (href) или действие (onClick) */
export function Button(props: ButtonProps) {
  const { children, variant = 'primary', size = 'm', icon, iconPosition = 'end', className } = props;
  const cls = [styles.button, styles[variant], styles[size], className].filter(Boolean).join(' ');
  const content = (
    <>
      {icon && iconPosition === 'start' && <Icon name={icon} size={18} />}
      <span>{children}</span>
      {icon && iconPosition === 'end' && <Icon name={icon} size={18} className={styles.endIcon} />}
    </>
  );

  if ('to' in props && props.to !== undefined) {
    return (
      <Link to={props.to} className={cls}>
        {content}
      </Link>
    );
  }
  if ('href' in props && props.href !== undefined) {
    return (
      <a href={props.href} className={cls}>
        {content}
      </a>
    );
  }
  return (
    <button type={props.type ?? 'button'} onClick={props.onClick} className={cls}>
      {content}
    </button>
  );
}
