import { ChangeEvent, useRef } from 'react';
import { useTranslation } from 'react-i18next';
import { useProjectStore } from '../store/useProjectStore';
import { parseSpec } from '../lib/spec-io';

/** 非表示の file input を介して TableSpec JSON を読み込む */
export function useSpecImport(onImported?: () => void) {
  const { t } = useTranslation();
  const importSpec = useProjectStore((state) => state.importSpec);
  const inputRef = useRef<HTMLInputElement>(null);

  const open = () => inputRef.current?.click();

  const handleChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = '';
    if (!file) return;
    try {
      importSpec(parseSpec(JSON.parse(await file.text())));
      onImported?.();
    } catch (err) {
      console.error('Failed to import spec', err);
      alert(t('header.invalidJson'));
    }
  };

  const inputProps = {
    ref: inputRef,
    type: 'file',
    accept: '.json,application/json',
    className: 'hidden',
    onChange: handleChange,
  } as const;

  return { open, inputProps };
}
