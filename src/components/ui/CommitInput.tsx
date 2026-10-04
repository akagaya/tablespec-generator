import { InputHTMLAttributes, useEffect, useRef, useState } from 'react';

interface Props extends Omit<InputHTMLAttributes<HTMLInputElement>, 'value' | 'onChange'> {
  value: string;
  onCommit: (value: string) => void;
}

/**
 * blur / Enter で値を確定する入力欄（Escape で破棄）。
 * テーブル名・カラム名のように、他の定義から名前で参照される値に使う
 * （1文字ごとに参照を書き換えると途中の名前衝突で参照が壊れるため）。
 */
export function CommitInput({ value, onCommit, onBlur, onKeyDown, ...rest }: Props) {
  const [draft, setDraft] = useState(value);
  const discardRef = useRef(false);

  useEffect(() => setDraft(value), [value]);

  return (
    <input
      type="text"
      {...rest}
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={(e) => {
        if (discardRef.current) {
          discardRef.current = false;
          setDraft(value);
        } else if (draft !== value) {
          onCommit(draft);
        }
        onBlur?.(e);
      }}
      onKeyDown={(e) => {
        if (e.key === 'Enter') e.currentTarget.blur();
        if (e.key === 'Escape') {
          discardRef.current = true;
          e.currentTarget.blur();
        }
        onKeyDown?.(e);
      }}
    />
  );
}
