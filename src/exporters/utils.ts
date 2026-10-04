export { isMysqlFamily } from '../lib/engine';

/** 行配列を末尾改行付きのファイル内容にする */
export function joinLines(lines: string[]): string {
  return lines.join('\n').trim() + '\n';
}

/** `user_profiles` → `User_profiles`（先頭のみ大文字化。既存出力との互換を維持） */
export function capitalize(name: string): string {
  return name.charAt(0).toUpperCase() + name.slice(1);
}
