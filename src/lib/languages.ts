import { LanguageOption, SubtitleItem } from '../types';

export const POPULAR_LANGUAGES: LanguageOption[] = [
  { code: 'es', name: 'Spanish', nativeName: 'Español', flag: '🇪🇸' },
  { code: 'en', name: 'English', nativeName: 'English', flag: '🇺🇸' },
  { code: 'ja', name: 'Japanese', nativeName: '日本語', flag: '🇯🇵' },
  { code: 'fr', name: 'French', nativeName: 'Français', flag: '🇫🇷' },
  { code: 'de', name: 'German', nativeName: 'Deutsch', flag: '🇩🇪' },
  { code: 'hi', name: 'Hindi', nativeName: 'हिन्दी', flag: '🇮🇳' },
  { code: 'zh', name: 'Chinese (Simplified)', nativeName: '简体中文', flag: '🇨🇳' },
  { code: 'ko', name: 'Korean', nativeName: '한국어', flag: '🇰🇷' },
  { code: 'pt', name: 'Portuguese', nativeName: 'Português', flag: '🇧🇷' },
  { code: 'it', name: 'Italian', nativeName: 'Italiano', flag: '🇮🇹' },
  { code: 'ar', name: 'Arabic', nativeName: 'العربية', flag: '🇸🇦' },
  { code: 'ru', name: 'Russian', nativeName: 'Русский', flag: '🇷🇺' },
  { code: 'tr', name: 'Turkish', nativeName: 'Türkçe', flag: '🇹🇷' },
  { code: 'nl', name: 'Dutch', nativeName: 'Nederlands', flag: '🇳🇱' },
  { code: 'vi', name: 'Vietnamese', nativeName: 'Tiếng Việt', flag: '🇻🇳' },
  { code: 'pl', name: 'Polish', nativeName: 'Polski', flag: '🇵🇱' },
  { code: 'id', name: 'Indonesian', nativeName: 'Bahasa Indonesia', flag: '🇮🇩' },
  { code: 'sv', name: 'Swedish', nativeName: 'Svenska', flag: '🇸🇪' },
  { code: 'uk', name: 'Ukrainian', nativeName: 'Українська', flag: '🇺🇦' },
  { code: 'el', name: 'Greek', nativeName: 'Ελληνικά', flag: '🇬🇷' },
];

export function formatTimestamp(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  return `[${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}]`;
}

export function formatSrtTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000);
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  const milliseconds = ms % 1000;
  return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')},${milliseconds.toString().padStart(3, '0')}`;
}

export function exportToSRT(subtitles: SubtitleItem[]): string {
  return subtitles
    .map((sub, index) => {
      const startTime = sub.timestamp;
      const endTime = sub.timestamp + Math.max(sub.latencyMs || 2500, 2500);
      return `${index + 1}\n${formatSrtTime(startTime)} --> ${formatSrtTime(endTime)}\n${sub.translatedText}\n(${sub.originalText})\n`;
    })
    .join('\n');
}

export function exportToVTT(subtitles: SubtitleItem[]): string {
  const header = 'WEBVTT\n\n';
  const body = subtitles
    .map((sub, index) => {
      const startTime = sub.timestamp;
      const endTime = sub.timestamp + Math.max(sub.latencyMs || 2500, 2500);
      const s = formatSrtTime(startTime).replace(',', '.');
      const e = formatSrtTime(endTime).replace(',', '.');
      return `${index + 1}\n${s} --> ${e}\n${sub.translatedText}\n${sub.originalText ? `<i>${sub.originalText}</i>` : ''}\n`;
    })
    .join('\n');
  return header + body;
}

export function exportToTXT(subtitles: SubtitleItem[]): string {
  return subtitles
    .map((sub) => `${sub.formattedTime} [${sub.sourceLanguage} -> ${sub.targetLanguage}]\n${sub.originalText}\n-> ${sub.translatedText}\n`)
    .join('\n');
}
