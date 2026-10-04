import type { ColumnDefault, DefaultExpression } from '../types/tablespec';

export function isDefaultExpression(value: ColumnDefault | undefined): value is DefaultExpression {
  return typeof value === 'object' && value !== null && 'expression' in value;
}

/** 入力欄に表示する文字列 */
export function formatDefault(value: ColumnDefault | undefined): string {
  if (value === undefined || value === null) return '';
  if (isDefaultExpression(value)) return value.expression;
  return String(value);
}

/**
 * 入力欄の文字列を ColumnDefault に変換する。
 * 空文字はデフォルト値なし（undefined）として扱う。
 */
export function parseDefault(text: string, asExpression: boolean): ColumnDefault | undefined {
  if (text === '') return undefined;
  return asExpression ? { expression: text } : text;
}
